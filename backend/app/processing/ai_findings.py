"""AI-powered findings generation using Instructor + AWS Nova Pro.

Analyzes all documents in a workspace to identify discrepancies,
anomalies, exposure risks, missing information, and red flags.
"""

import asyncio
from typing import Literal

import boto3
import instructor
import structlog
from botocore.exceptions import ClientError, ReadTimeoutError
from pydantic import BaseModel, Field
from tenacity import retry, retry_if_exception_type, stop_after_attempt, wait_exponential

from app.config import settings
from app.models.document import DocumentModel

logger = structlog.get_logger()

# ── Pydantic models for structured LLM output ────────────────────


class FindingItem(BaseModel):
    type: Literal["discrepancy", "anomaly", "exposure", "missing", "red_flag"] = Field(
        description="Category of the finding"
    )
    severity: Literal["critical", "high", "medium", "low", "info"] = Field(
        description="Severity level"
    )
    title: str = Field(description="Short title summarizing the finding")
    description: str = Field(description="Detailed description with specific references")
    document_refs: list[str] = Field(
        default_factory=list, description="Filenames of documents involved"
    )
    field_refs: list[str] = Field(
        default_factory=list, description="Field names relevant to this finding"
    )
    confidence: float = Field(ge=0.0, le=1.0, description="Confidence score 0.0-1.0")


class FindingsResult(BaseModel):
    findings: list[FindingItem]


# ── Domain-specific analysis prompts ──────────────────────────────

_DOMAIN_PROMPTS: dict[str, str] = {
    "insurance_claims": (
        "You are an expert insurance claims adjuster reviewing documents for a claim. "
        "Pay special attention to:\n"
        "- Inconsistencies between FNOL, police report, and medical records\n"
        "- Medical costs approaching or exceeding policy limits\n"
        "- Date discrepancies across documents\n"
        "- Missing required documentation\n"
        "- Indicators of potential fraud (e.g. conflicting passenger counts, "
        "injury claims not matching accident description)\n"
        "- Liability exposure based on coverage limits vs claimed amounts"
    ),
    "legal_contracts": (
        "You are an expert legal reviewer analyzing contract documents. "
        "Pay special attention to:\n"
        "- Conflicting terms between documents\n"
        "- Unusual or non-standard clauses\n"
        "- Missing required provisions\n"
        "- Ambiguous language that could create liability\n"
        "- Compliance issues"
    ),
    "financial_dd": (
        "You are a financial due diligence analyst reviewing documents. "
        "Pay special attention to:\n"
        "- Inconsistent financial figures across documents\n"
        "- Unusual revenue patterns or trends\n"
        "- Off-balance-sheet items\n"
        "- Missing critical financial disclosures\n"
        "- Risk factors and red flags"
    ),
}

_SYSTEM_PROMPT = """{domain_prompt}

You are performing a cross-document analysis. Compare every document against every other document and identify actionable findings.

FINDING CATEGORIES (in priority order):
1. DISCREPANCIES: Same fact reported differently across documents. Always cite both documents and both values. Example: "FNOL reports 2 passengers but Police Report lists 3."
2. EXPOSURE: Medical costs approaching or exceeding coverage limits. Calculate the ratio and state it clearly.
3. RED FLAGS: Patterns that suggest fraud, exaggeration, or claims handling risk. Be specific about what pattern you see and why it matters.
4. MISSING: Critical fields expected for this document type that are absent. Only flag fields that would block claims processing.
5. ANOMALIES: Individual values that seem unusual in context (not just different formatting).

SEVERITY GUIDE:
- critical: Blocks claims processing or indicates potential fraud. Needs immediate action.
- high: Significant financial or liability risk. Needs investigation before proceeding.
- medium: Noteworthy inconsistency that should be documented. Review within normal workflow.
- low: Minor issue or informational note.

RULES:
- Reference exact document filenames and field names in every finding
- Include the specific values that conflict, not just "values differ"
- Do NOT fabricate findings. If the documents are clean, return an empty list.
- Do NOT flag the same issue twice from different angles — consolidate into one finding
- Confidence should reflect how certain you are this is a real issue, not just a formatting difference"""


def _build_context(documents: list[DocumentModel]) -> str:
    """Build a context string from all documents for cross-document analysis."""
    parts: list[str] = []
    for i, doc in enumerate(documents, 1):
        lines = [f"=== DOCUMENT {i}: {doc.filename} (type: {doc.document_type}) ==="]

        if doc.extracted_fields:
            lines.append("--- Extracted Fields ---")
            for field in doc.extracted_fields:
                anomaly_marker = " [ANOMALY]" if field.is_anomaly else ""
                lines.append(f"  {field.key}: {field.value}{anomaly_marker}")
                if field.anomaly_reason:
                    lines.append(f"    Reason: {field.anomaly_reason}")

        if doc.raw_text:
            lines.append("--- Document Text (excerpt) ---")
            text = doc.raw_text[:3000]
            if len(doc.raw_text) > 3000:
                text += "\n[... truncated ...]"
            lines.append(text)

        parts.append("\n".join(lines))

    return "\n\n".join(parts)


@retry(
    stop=stop_after_attempt(3),
    wait=wait_exponential(multiplier=1, min=2, max=10),
    retry=retry_if_exception_type((ClientError, ReadTimeoutError, ConnectionError)),
    before_sleep=lambda rs: logger.warning(
        "bedrock_retry", attempt=rs.attempt_number, wait=rs.next_action.sleep
    ),
)
def _generate_sync(documents: list[DocumentModel], domain: str) -> FindingsResult:
    """Synchronous findings generation (runs in thread)."""
    bedrock = boto3.client(
        "bedrock-runtime",
        region_name=settings.aws_default_region,
        aws_access_key_id=settings.aws_access_key_id,
        aws_secret_access_key=settings.aws_secret_access_key,
        aws_session_token=settings.aws_session_token or None,
    )
    client = instructor.from_bedrock(bedrock)

    domain_prompt = _DOMAIN_PROMPTS.get(domain, _DOMAIN_PROMPTS.get("insurance_claims", ""))
    if not domain_prompt:
        domain_prompt = (
            "You are an expert document reviewer. "
            "Analyze these documents for inconsistencies and issues."
        )

    system_prompt = _SYSTEM_PROMPT.format(domain_prompt=domain_prompt)
    context = _build_context(documents)

    result = client.chat.completions.create(
        model=settings.bedrock_model_id,
        messages=[
            {"role": "user", "content": f"{system_prompt}\n\n{context}"},
        ],
        response_model=FindingsResult,
        max_tokens=4096,
    )
    return result


async def generate_findings(
    documents: list[DocumentModel],
    domain: str,
) -> list[FindingItem]:
    """Analyze all workspace documents and generate findings using Nova Pro.

    Returns empty list on failure (non-critical path).
    """
    # Only analyze documents that have been processed
    ready_docs = [d for d in documents if d.status == "ready" and d.raw_text]
    if not ready_docs:
        logger.info("no_documents_for_findings")
        return []

    try:
        result = await asyncio.to_thread(_generate_sync, ready_docs, domain)
        logger.info(
            "findings_generated",
            total=len(result.findings),
            by_severity={
                s: sum(1 for f in result.findings if f.severity == s)
                for s in ("critical", "high", "medium", "low", "info")
                if any(f.severity == s for f in result.findings)
            },
        )
        return result.findings
    except Exception as e:
        logger.error("findings_generation_failed", error=str(e))
        return []
