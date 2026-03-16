"""AI-powered field extraction using Instructor + AWS Nova Pro.

Extracts structured key-value fields from document text using LLM,
with regex fallback for resilience.
"""

import asyncio
import re
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
from app.models.document import ExtractedFieldModel

logger = structlog.get_logger()


@lru_cache(maxsize=1)
def _get_bedrock_client():
    """Shared Bedrock client — reuses TCP connections across all calls."""
    bedrock = boto3.client(
        "bedrock-runtime",
        region_name=settings.aws_default_region,
        aws_access_key_id=settings.aws_access_key_id,
        aws_secret_access_key=settings.aws_secret_access_key,
        aws_session_token=settings.aws_session_token or None,
        config=BotoConfig(
            max_pool_connections=20,
            retries={"max_attempts": 2, "mode": "adaptive"},
        ),
    )
    return instructor.from_bedrock(bedrock)

# ── Pydantic models for structured LLM output ────────────────────

class ExtractedFieldItem(BaseModel):
    key: str = Field(description="Human-readable field name, e.g. 'Policy Number', 'Date of Loss'")
    value: str = Field(description="Exact value as it appears in the document")
    confidence: float = Field(ge=0.0, le=1.0, description="Confidence score 0.0-1.0")
    is_anomaly: bool = Field(default=False, description="True if value seems suspicious or unusual")
    anomaly_reason: str | None = Field(
        default=None, description="Explanation of why this is anomalous"
    )


class ExtractionResult(BaseModel):
    fields: list[ExtractedFieldItem]
    document_type: Literal["fnol", "policy", "medical", "police", "general"] = Field(
        description="Detected document type"
    )


class DocumentSummaryResult(BaseModel):
    summary: str = Field(description="1-2 sentence summary of the document for an insurance adjuster")


# ── Domain descriptions for system prompt ─────────────────────────

_DOMAIN_DESCRIPTIONS: dict[str, str] = {
    "fnol": (
        "First Notice of Loss (FNOL) report. Look for: claim/reference number, "
        "date of loss, policy number, insured name, vehicle/VIN, loss location, "
        "description of incident, injuries reported, passengers, fault determination."
    ),
    "policy": (
        "Insurance policy document. Look for: policy number, effective/expiration dates, "
        "coverage limits (BI, PD, UM/UIM), deductibles, premium, insured name, "
        "vehicle details, endorsements."
    ),
    "medical": (
        "Medical bill or record. Look for: patient name, date of service, provider, "
        "diagnosis/ICD codes, CPT/procedure codes, total amount, individual charges, "
        "insurance information."
    ),
    "police": (
        "Police/incident report. Look for: report/case number, incident date, "
        "location, reporting officer, narrative summary, involved parties, "
        "citations issued, fault determination, witnesses."
    ),
    "general": (
        "General document. Extract all identifiable key-value pairs including names, "
        "dates, reference numbers, amounts, and any structured data."
    ),
}

_SYSTEM_PROMPT = """You are a senior insurance document analyst. Your job is to extract every structured field from this {document_type} document accurately.

EXTRACTION RULES:
1. Use snake_case keys that are consistent and predictable (e.g. "policy_number", "date_of_loss", "bi_limit_per_person", "total_medical")
2. Extract the EXACT value as written in the document — do not reformat dates or numbers
3. Confidence scoring:
   - 0.95-1.0: Value is clearly printed/typed and unambiguous
   - 0.80-0.94: Value is present but partially obscured, handwritten, or requires inference
   - Below 0.80: Value is guessed from context — flag as low confidence
4. Flag anomalies ONLY for genuinely suspicious values:
   - Dates that don't make sense (loss date after report date, future dates)
   - Amounts that seem unusually high or low for the document type
   - Values that contradict other fields in the same document
   - DO NOT flag normal variations in formatting as anomalies

Document type context: {domain_description}

Extract comprehensively — every name, date, number, address, reference ID, and status field matters for cross-document analysis."""


# ── Main extraction function ──────────────────────────────────────

@retry(
    stop=stop_after_attempt(3),
    wait=wait_exponential(multiplier=1, min=2, max=10),
    retry=retry_if_exception_type((ClientError, ReadTimeoutError, ConnectionError)),
    before_sleep=lambda rs: logger.warning(
        "bedrock_retry", attempt=rs.attempt_number, wait=rs.next_action.sleep
    ),
)
def _extract_sync(filename: str, text: str, document_type: str) -> ExtractionResult:
    """Synchronous extraction call (runs in thread via asyncio.to_thread)."""
    client = _get_bedrock_client()

    domain_desc = _DOMAIN_DESCRIPTIONS.get(document_type, _DOMAIN_DESCRIPTIONS["general"])
    system_prompt = _SYSTEM_PROMPT.format(
        document_type=document_type, domain_description=domain_desc
    )

    # Truncate text to stay within context budget
    truncated = text[:6000]
    if len(text) > 6000:
        truncated += "\n[... document truncated ...]"

    result = client.chat.completions.create(
        model=settings.bedrock_model_id,
        messages=[
            {"role": "user", "content": f"{system_prompt}\n\n--- DOCUMENT: {filename} ---\n{truncated}"},
        ],
        response_model=ExtractionResult,
        max_tokens=4096,
    )
    return result


async def extract_fields_with_ai(
    filename: str, text: str, document_type: str = "auto"
) -> list[ExtractedFieldModel]:
    """Extract structured fields from document text using Nova Pro.

    Falls back to regex heuristics if AI extraction fails.
    """
    if not text.strip():
        return []

    try:
        result = await asyncio.to_thread(_extract_sync, filename, text, document_type)
        fields = [
            ExtractedFieldModel(
                key=f.key,
                value=f.value,
                source=filename,
                confidence=f.confidence,
                is_anomaly=f.is_anomaly,
                anomaly_reason=f.anomaly_reason,
            )
            for f in result.fields
        ]
        logger.info(
            "ai_extraction_complete",
            filename=filename,
            field_count=len(fields),
            detected_type=result.document_type,
            anomalies=sum(1 for f in fields if f.is_anomaly),
        )
        return fields
    except Exception as e:
        logger.warning("ai_extraction_failed", filename=filename, error=str(e))
        return _regex_fallback(filename, text)


# ── Regex fallback (moved from document_processor.py) ─────────────

_FIELD_PATTERNS: dict[str, list[tuple[str, str]]] = {
    "fnol": [
        (r"(?:Claim|Reference)\s*(?:#|Number|No\.?)[:\s]*([A-Z0-9-]+)", "Claim Number"),
        (r"(?:Date of Loss|Loss Date|Incident Date)[:\s]*([A-Za-z0-9,/ -]+)", "Date of Loss"),
        (r"(?:Policy\s*(?:#|Number))[:\s]*([A-Z0-9-]+)", "Policy Number"),
        (r"(?:Insured|Policyholder|Claimant)[:\s]*([A-Za-z ]+)", "Insured Name"),
        (r"(?:Vehicle|VIN)[:\s]*([A-Z0-9]+)", "Vehicle/VIN"),
        (r"(?:Location|Scene|Address)[:\s]*(.+?)(?:\n|$)", "Loss Location"),
    ],
    "policy": [
        (r"(?:Policy\s*(?:#|Number))[:\s]*([A-Z0-9-]+)", "Policy Number"),
        (r"(?:Effective\s*Date)[:\s]*([A-Za-z0-9,/ -]+)", "Effective Date"),
        (r"(?:Expiration\s*Date|Expires)[:\s]*([A-Za-z0-9,/ -]+)", "Expiration Date"),
        (r"(?:Coverage\s*(?:Limit|Amount))[:\s]*\$?([\d,]+)", "Coverage Limit"),
        (r"(?:Deductible)[:\s]*\$?([\d,]+)", "Deductible"),
        (r"(?:Premium)[:\s]*\$?([\d,.]+)", "Premium"),
        (r"(?:Insured|Named Insured|Policyholder)[:\s]*([A-Za-z ]+)", "Insured Name"),
    ],
    "medical": [
        (r"(?:Patient|Name)[:\s]*([A-Za-z ]+)", "Patient Name"),
        (r"(?:Date of Service|Service Date|DOS)[:\s]*([A-Za-z0-9,/ -]+)", "Date of Service"),
        (r"(?:Diagnosis|DX|ICD)[:\s]*(.+?)(?:\n|$)", "Diagnosis"),
        (r"(?:Provider|Doctor|Physician|Facility)[:\s]*([A-Za-z .]+)", "Provider"),
        (r"(?:Total|Amount\s*Due|Balance)[:\s]*\$?([\d,.]+)", "Total Amount"),
        (r"(?:CPT|Procedure)[:\s]*(\d{5})", "CPT Code"),
    ],
    "police": [
        (r"(?:Report|Case)\s*(?:#|Number|No\.?)[:\s]*([A-Z0-9-]+)", "Report Number"),
        (r"(?:Date|Incident Date|Date of Incident)[:\s]*([A-Za-z0-9,/ -]+)", "Incident Date"),
        (r"(?:Location|Scene|Address)[:\s]*(.+?)(?:\n|$)", "Location"),
        (r"(?:Officer|Reporting Officer|Badge)[:\s]*([A-Za-z .#0-9]+)", "Officer"),
        (r"(?:Narrative|Description|Summary)[:\s]*(.{20,200})", "Narrative Summary"),
    ],
}

_FILENAME_TO_TYPE: list[tuple[str, str]] = [
    ("fnol", "fnol"),
    ("first notice", "fnol"),
    ("policy", "policy"),
    ("medical", "medical"),
    ("bill", "medical"),
    ("police", "police"),
    ("report", "police"),
]


def _detect_doc_type(filename: str, text: str) -> str:
    """Heuristically detect document type from filename and content."""
    lower = filename.lower()
    for keyword, doc_type in _FILENAME_TO_TYPE:
        if keyword in lower:
            return doc_type
    text_lower = text[:500].lower()
    if "first notice" in text_lower or "fnol" in text_lower:
        return "fnol"
    if "policy" in text_lower or "coverage" in text_lower:
        return "policy"
    if "medical" in text_lower or "patient" in text_lower or "diagnosis" in text_lower:
        return "medical"
    if "police" in text_lower or "officer" in text_lower or "incident report" in text_lower:
        return "police"
    return "general"


def _regex_fallback(filename: str, text: str) -> list[ExtractedFieldModel]:
    """Extract structured fields from document text using regex heuristics (fallback)."""
    doc_type = _detect_doc_type(filename, text)
    patterns = _FIELD_PATTERNS.get(doc_type, [])
    fields: list[ExtractedFieldModel] = []
    seen_keys: set[str] = set()

    for pattern, key in patterns:
        match = re.search(pattern, text, re.IGNORECASE)
        if match and key not in seen_keys:
            value = match.group(1).strip()
            if value:
                seen_keys.add(key)
                fields.append(
                    ExtractedFieldModel(
                        key=key,
                        value=value,
                        source=filename,
                        confidence=0.85,
                    )
                )

    logger.info("regex_fallback_extraction", filename=filename, field_count=len(fields))
    return fields


# ── Document summary generation ──────────────────────────────────

_SUMMARY_SYSTEM_PROMPT = """You are a senior insurance document analyst. Summarize this {document_type} document in 1-2 concise sentences for an insurance adjuster.

Focus on the key facts: who, what, when, where, and critical numbers (amounts, limits, counts).
Write in plain language — no bullet points, no markdown. This summary will be spoken aloud in a voice interface."""


@retry(
    stop=stop_after_attempt(2),
    wait=wait_exponential(multiplier=1, min=2, max=5),
    retry=retry_if_exception_type((ClientError, ReadTimeoutError, ConnectionError)),
)
def _summarize_sync(filename: str, text: str, document_type: str, fields_text: str) -> DocumentSummaryResult:
    """Synchronous summary call (runs in thread via asyncio.to_thread)."""
    client = _get_bedrock_client()

    system_prompt = _SUMMARY_SYSTEM_PROMPT.format(document_type=document_type)
    truncated = text[:2000]

    user_content = f"{system_prompt}\n\n--- EXTRACTED FIELDS ---\n{fields_text}\n\n--- DOCUMENT TEXT ---\n{truncated}"

    return client.chat.completions.create(
        model=settings.bedrock_model_id,
        messages=[{"role": "user", "content": user_content}],
        response_model=DocumentSummaryResult,
        max_tokens=512,
    )


def _fallback_summary(filename: str, fields: list[ExtractedFieldModel], document_type: str) -> str:
    """Generate a simple template summary from extracted fields when AI fails."""
    field_map = {f.key: f.value for f in fields}
    parts = [f"{document_type.replace('_', ' ').title()} document: {filename}."]
    for key in ("claimant_name", "patient_name", "insured_name", "policy_number"):
        if key in field_map:
            parts.append(f"{key.replace('_', ' ').title()}: {field_map[key]}.")
            break
    for key in ("date_of_loss", "date_of_service", "effective_date"):
        if key in field_map:
            parts.append(f"Date: {field_map[key]}.")
            break
    for key in ("total_medical", "bi_limit_per_person", "total_amount"):
        if key in field_map:
            parts.append(f"Amount: {field_map[key]}.")
            break
    return " ".join(parts)


async def generate_document_summary(
    filename: str,
    text: str,
    document_type: str,
    extracted_fields: list[ExtractedFieldModel],
) -> str:
    """Generate a 1-2 sentence document summary using Nova Pro, with fallback."""
    if not text.strip() and not extracted_fields:
        return ""

    fields_text = "\n".join(f"{f.key}: {f.value}" for f in extracted_fields)

    try:
        result = await asyncio.to_thread(_summarize_sync, filename, text, document_type, fields_text)
        logger.info("summary_generated", filename=filename, length=len(result.summary))
        return result.summary
    except Exception as e:
        logger.warning("summary_generation_failed", filename=filename, error=str(e))
        return _fallback_summary(filename, extracted_fields, document_type)
