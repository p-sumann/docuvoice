"""Lightweight domain classification using Nova Lite.

Validates that uploaded documents belong to the workspace domain
before running the expensive extraction pipeline.
"""

import asyncio
from functools import lru_cache
from typing import Literal

import boto3
import instructor
import structlog
from botocore.config import Config as BotoConfig
from botocore.exceptions import ClientError, ReadTimeoutError
from pydantic import BaseModel, Field
from tenacity import retry, retry_if_exception_type, stop_after_attempt, wait_exponential

from app.config import settings


@lru_cache(maxsize=1)
def _get_lite_client():
    """Shared Nova Lite Bedrock client for classification."""
    bedrock = boto3.client(
        "bedrock-runtime",
        region_name=settings.aws_default_region,
        aws_access_key_id=settings.aws_access_key_id,
        aws_secret_access_key=settings.aws_secret_access_key,
        aws_session_token=settings.aws_session_token or None,
        config=BotoConfig(
            max_pool_connections=10,
            retries={"max_attempts": 2, "mode": "adaptive"},
        ),
    )
    return instructor.from_bedrock(bedrock)

logger = structlog.get_logger()


class ClassificationResult(BaseModel):
    belongs_to_domain: bool = Field(
        description="True if the document content is relevant to the workspace domain"
    )
    detected_category: str = Field(
        description="What the document actually appears to be, e.g. 'insurance_claim', 'recipe', 'resume'"
    )
    confidence: float = Field(ge=0.0, le=1.0, description="Classification confidence")
    reason: str = Field(description="Brief explanation of the classification decision")


_DOMAIN_KEYWORDS: dict[str, str] = {
    "insurance_claims": (
        "Insurance claims processing domain. "
        "VALID documents: First Notice of Loss (FNOL) reports, insurance policy declarations, "
        "medical bills, medical records, police/incident reports, claim correspondence letters, "
        "adjuster notes, coverage declarations, vehicle damage estimates/appraisals, "
        "witness statements, subrogation documents, explanation of benefits (EOB), "
        "repair invoices related to a claim, denial/approval letters. "
        "INVALID examples: resumes, recipes, technical manuals, marketing brochures, "
        "academic papers, software documentation, personal letters unrelated to claims."
    ),
    "legal_contracts": (
        "Legal contracts and agreements domain. "
        "VALID documents: contracts, NDAs, lease/rental agreements, service level agreements (SLA), "
        "terms of service, employment agreements, partnership agreements, amendments, "
        "legal memoranda, court filings, cease and desist letters, settlement agreements, "
        "power of attorney, articles of incorporation, licensing agreements, IP assignments. "
        "INVALID examples: resumes, recipes, technical manuals, insurance claims, "
        "medical records, financial statements, marketing materials."
    ),
    "financial_dd": (
        "Financial due diligence domain. "
        "VALID documents: financial statements, balance sheets, income/profit-loss statements, "
        "cash flow statements, audit reports, tax returns, cap tables, investor presentations, "
        "term sheets, valuation reports, revenue forecasts, budget documents, "
        "accounts receivable/payable aging reports, bank statements, loan agreements. "
        "INVALID examples: resumes, recipes, technical manuals, insurance claims, "
        "legal contracts, marketing materials, personal correspondence."
    ),
}

_CLASSIFY_PROMPT = """You are a document classifier. Determine if the following document excerpt belongs to the specified domain.

DOMAIN: {domain}
DOMAIN DESCRIPTION: {domain_description}

Analyze the document excerpt and decide:
1. Does this document belong to the specified domain?
2. What category does this document actually fall into?
3. How confident are you?

Give the document the benefit of the doubt if it's plausibly related to the domain.
Only reject (belongs_to_domain=false) if you are highly confident the document is completely unrelated — e.g. a recipe, resume, or textbook chapter.
If the document could reasonably be part of a claims file, mark it as belonging to the domain.

--- DOCUMENT EXCERPT ---
{text_excerpt}"""


@retry(
    stop=stop_after_attempt(2),
    wait=wait_exponential(multiplier=1, min=1, max=5),
    retry=retry_if_exception_type((ClientError, ReadTimeoutError, ConnectionError)),
)
def _classify_sync(text_excerpt: str, domain: str) -> ClassificationResult:
    """Synchronous classification call using Nova Lite."""
    client = _get_lite_client()

    domain_desc = _DOMAIN_KEYWORDS.get(domain, f"General domain: {domain}")
    prompt = _CLASSIFY_PROMPT.format(
        domain=domain,
        domain_description=domain_desc,
        text_excerpt=text_excerpt,
    )

    return client.chat.completions.create(
        model=settings.bedrock_lite_model_id,
        messages=[{"role": "user", "content": prompt}],
        response_model=ClassificationResult,
        max_tokens=256,
    )


async def classify_document(text: str, domain: str) -> ClassificationResult:
    """Classify whether a document belongs to the workspace domain.

    Uses only the first 1500 chars for speed — this is a gate, not deep analysis.
    """
    excerpt = text[:3000].strip()
    if not excerpt:
        return ClassificationResult(
            belongs_to_domain=False,
            detected_category="empty",
            confidence=1.0,
            reason="Document has no extractable text.",
        )

    try:
        result = await asyncio.to_thread(_classify_sync, excerpt, domain)
        logger.info(
            "domain_classification",
            domain=domain,
            belongs=result.belongs_to_domain,
            detected=result.detected_category,
            confidence=result.confidence,
        )
        return result
    except Exception as e:
        logger.warning("domain_classification_failed", error=str(e))
        # On failure, allow the document through (don't block on classifier errors)
        return ClassificationResult(
            belongs_to_domain=True,
            detected_category="unknown",
            confidence=0.0,
            reason=f"Classification failed: {e}",
        )


async def classify_documents_batch(
    documents: list[tuple[str, str]],
    domain: str,
    batch_size: int = 4,
) -> list[tuple[str, ClassificationResult]]:
    """Classify multiple documents in async batches.

    Args:
        documents: List of (doc_id, raw_text) tuples
        domain: The workspace domain to validate against
        batch_size: Number of concurrent classifications

    Returns:
        List of (doc_id, ClassificationResult) tuples
    """
    results: list[tuple[str, ClassificationResult]] = []

    for i in range(0, len(documents), batch_size):
        batch = documents[i : i + batch_size]
        tasks = [classify_document(text, domain) for _, text in batch]
        batch_results = await asyncio.gather(*tasks)
        for (doc_id, _), result in zip(batch, batch_results):
            results.append((doc_id, result))

    return results
