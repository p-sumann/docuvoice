import asyncio
import re

import httpx
import structlog
import tiktoken
from pydantic import BaseModel

from agent.config import get_settings
from agent.utils.s3 import load_workspace_context as load_from_s3

logger = structlog.get_logger(__name__)

# Cache tokenizer at module level — avoid re-creating per request
_enc = tiktoken.get_encoding("cl100k_base")


class WorkspaceContext(BaseModel):
    """Two-tier workspace context for the agent."""

    lean_context: str = ""    # Fields + summaries — injected into system prompt
    full_context: str = ""    # Fields + raw text — used by search_documents tool


# ── MVP fallback contexts ────────────────────────────────────────

MVP_LEAN_CONTEXT = """=== WORKSPACE: Insurance Claims — AUT-2024-789 ===
Documents: 4

=== DOCUMENT 1: FNOL-2024-1234.pdf ===
Type: first_notice_of_loss
Summary: FNOL for John Smith's rear-end collision on 2024-03-16 at Main St and 5th Ave, 2 passengers with soft tissue injuries.
--- Extracted Fields ---
claimant_name: John Smith
date_of_loss: 2024-03-16
passengers: 2
injury_type: soft tissue
vehicle_year: 2022
vehicle_make: Toyota Camry
description: Rear-end collision at intersection of Main St and 5th Ave

=== DOCUMENT 2: Policy-AUT-789.pdf ===
Type: insurance_policy
Summary: Auto policy AUT-2024-789 for John Smith, BI limits 100k/300k, PD 50k, effective 2024.
--- Extracted Fields ---
policy_number: AUT-2024-789
bi_limit_per_person: $100,000
bi_limit_per_occurrence: $300,000
pd_limit: $50,000
deductible: $1,000
effective_date: 2024-01-01
expiry_date: 2025-01-01

=== DOCUMENT 3: Medical-Bills-Combined.pdf ===
Type: medical_bill
Summary: Medical bills totaling $47,250 from Mercy General Hospital for cervical strain and lumbar sprain, 8 weeks treatment.
--- Extracted Fields ---
total_medical: $47,250
er_visit_date: 2024-03-16
treatment_provider: Mercy General Hospital
diagnosis: Cervical strain, lumbar sprain
treatment_duration: 8 weeks

=== DOCUMENT 4: Police-Report-2024.pdf ===
Type: police_report
Summary: Police report listing 3 passengers, clear weather, other driver at fault on Interstate 95.
--- Extracted Fields ---
report_number: PR-2024-0316-4521
passengers: 3
weather_conditions: Clear
officer: Sgt. Michael Torres
fault_determination: Other driver at fault
loss_location: Interstate 95, Mile Marker 142
"""

MVP_FULL_CONTEXT = """=== WORKSPACE: Insurance Claims — AUT-2024-789 ===
Documents: 4

=== DOCUMENT 1: FNOL-2024-1234.pdf ===
Type: first_notice_of_loss
--- Extracted Fields ---
claimant_name: John Smith
date_of_loss: 2024-03-16
passengers: 2
injury_type: soft tissue
vehicle_year: 2022
vehicle_make: Toyota Camry
description: Rear-end collision at intersection of Main St and 5th Ave
--- Full Text ---
FIRST NOTICE OF LOSS
Claim Reference: AUT-2024-789
Date of Loss: March 16, 2024
Claimant: John Smith
Vehicle: 2022 Toyota Camry
Number of Passengers: 2
Description of Incident: The insured vehicle was rear-ended while stopped at the intersection of Main St and 5th Ave during heavy traffic conditions. Both passengers reported soft tissue injuries. The claimant was transported to Mercy General Hospital for evaluation.

=== DOCUMENT 2: Policy-AUT-789.pdf ===
Type: insurance_policy
--- Extracted Fields ---
policy_number: AUT-2024-789
bi_limit_per_person: $100,000
bi_limit_per_occurrence: $300,000
pd_limit: $50,000
deductible: $1,000
effective_date: 2024-01-01
expiry_date: 2025-01-01
--- Full Text ---
AUTO INSURANCE POLICY
Policy Number: AUT-2024-789
Insured: John Smith
Effective: January 1, 2024 - January 1, 2025
Bodily Injury Liability: $100,000 per person / $300,000 per occurrence
Property Damage Liability: $50,000
Collision Deductible: $1,000
Comprehensive Deductible: $500
Uninsured Motorist: $100,000/$300,000

=== DOCUMENT 3: Medical-Bills-Combined.pdf ===
Type: medical_bill
--- Extracted Fields ---
total_medical: $47,250
er_visit_date: 2024-03-16
treatment_provider: Mercy General Hospital
diagnosis: Cervical strain, lumbar sprain
treatment_duration: 8 weeks
--- Full Text ---
MEDICAL BILLING SUMMARY
Patient: John Smith
Provider: Mercy General Hospital
Date of Service: March 16, 2024
Emergency Room Visit: $8,500
Diagnostic Imaging (MRI): $4,200
Physical Therapy (24 sessions): $12,000
Specialist Consultations: $6,750
Medications: $2,800
Follow-up Visits: $5,000
Orthopedic Evaluation: $4,500
Pain Management: $3,500
TOTAL: $47,250

=== DOCUMENT 4: Police-Report-2024.pdf ===
Type: police_report
--- Extracted Fields ---
report_number: PR-2024-0316-4521
passengers: 3
weather_conditions: Clear
officer: Sgt. Michael Torres
fault_determination: Other driver at fault
loss_location: Interstate 95, Mile Marker 142
--- Full Text ---
POLICE ACCIDENT REPORT
Report Number: PR-2024-0316-4521
Date: March 16, 2024
Location: Interstate 95, Mile Marker 142
Investigating Officer: Sgt. Michael Torres
Weather: Clear
Road Conditions: Dry

Vehicle 1 (Insured): 2022 Toyota Camry driven by John Smith with 3 passengers.
Vehicle 2: 2019 Ford F-150 driven by Robert Davis.

Description: Vehicle 2 struck Vehicle 1 from behind while Vehicle 1 was slowing for traffic. Vehicle 1 sustained moderate rear-end damage. All occupants of Vehicle 1 reported neck and back pain.

Fault Determination: Driver of Vehicle 2 (Robert Davis) cited for following too closely.
"""


async def _noop() -> str:
    return ""


def _strip_full_text(context_text: str) -> str:
    """Strip '--- Full Text ---' / '--- Full Content ---' sections from context, keeping fields only."""
    return re.sub(
        r"--- Full (?:Text|Content) ---\n.*?(?=\n=== DOCUMENT|\n*$)",
        "",
        context_text,
        flags=re.DOTALL,
    )


async def load_workspace_context(workspace_id: str) -> WorkspaceContext:
    """Load workspace context as two tiers.

    Priority: cached /context endpoint > S3 > /documents endpoint > MVP fallback.
    Cached and S3 are fetched concurrently to reduce startup latency.
    """
    settings = get_settings()
    has_s3 = bool(settings.aws_access_key_id and settings.s3_bucket_name)

    # 1. Race cached endpoint and S3 concurrently
    cached_result, s3_text = await asyncio.gather(
        _load_cached_context(workspace_id),
        load_from_s3(workspace_id) if has_s3 else _noop(),
    )

    # Cached endpoint returns WorkspaceContext directly (JSON with both tiers)
    if cached_result:
        return cached_result

    # S3 returns full context text — derive lean from it
    if s3_text:
        full = _truncate(s3_text, settings.max_context_tokens)
        lean = _strip_full_text(full)
        return WorkspaceContext(lean_context=lean, full_context=full)

    # 2. Fallback: build from /documents endpoint (lean only, no raw text available)
    lean_text = await _load_from_documents(workspace_id)
    if lean_text:
        lean = _truncate(lean_text, settings.max_context_tokens)
        return WorkspaceContext(lean_context=lean, full_context=lean)

    # 3. MVP hardcoded context for demo
    logger.info("using_mvp_fallback_context", workspace_id=workspace_id)
    return WorkspaceContext(lean_context=MVP_LEAN_CONTEXT, full_context=MVP_FULL_CONTEXT)


async def _load_cached_context(workspace_id: str) -> WorkspaceContext | None:
    """Try the pre-built context endpoint (returns JSON with lean_context and full_context)."""
    settings = get_settings()
    try:
        async with httpx.AsyncClient(base_url=settings.backend_url) as client:
            resp = await client.get(
                f"/api/v1/workspaces/{workspace_id}/context",
                timeout=3.0,
            )
            if resp.status_code == 200:
                data = resp.json()
                lean = data.get("lean_context", "")
                full = data.get("full_context", "")
                if lean or full:
                    logger.info("loaded_cached_context", workspace_id=workspace_id)
                    return WorkspaceContext(
                        lean_context=_truncate(lean, settings.max_context_tokens),
                        full_context=_truncate(full, settings.max_context_tokens),
                    )
    except Exception:
        logger.debug("cached_context_unavailable", workspace_id=workspace_id)
    return None


async def _load_from_documents(workspace_id: str) -> str:
    """Fallback: load document data from backend API and build lean context."""
    settings = get_settings()
    try:
        async with httpx.AsyncClient(base_url=settings.backend_url) as client:
            resp = await client.get(
                f"/api/v1/workspaces/{workspace_id}/documents",
                timeout=5.0,
            )
            if resp.status_code != 200:
                return ""
            data = resp.json()
            documents = data.get("data", {}).get("items", []) if isinstance(data.get("data"), dict) else data.get("data", [])
            if not documents:
                return ""

            # Build lean context from backend document data (no raw text)
            lines = [f"=== WORKSPACE: {workspace_id} ==="]
            lines.append(f"Documents: {len(documents)}")
            lines.append("")
            for i, doc in enumerate(documents, 1):
                lines.append(f"=== DOCUMENT {i}: {doc.get('filename', 'unknown')} ===")
                lines.append(f"Type: {doc.get('documentType', 'unknown')}")
                summary = doc.get("summary", "")
                if summary:
                    lines.append(f"Summary: {summary}")
                fields = doc.get("extractedFields", [])
                if fields:
                    lines.append("--- Extracted Fields ---")
                    for field in fields:
                        lines.append(f"{field.get('key', '')}: {field.get('value', '')}")
                lines.append("")
            return "\n".join(lines)
    except Exception:
        logger.debug("backend_context_unavailable", workspace_id=workspace_id)
        return ""


def _truncate(text: str, max_tokens: int) -> str:
    """Truncate text to fit within token limit."""
    tokens = _enc.encode(text)
    if len(tokens) <= max_tokens:
        return text
    logger.warning("context_truncated", original_tokens=len(tokens), max_tokens=max_tokens)
    return _enc.decode(tokens[:max_tokens])
