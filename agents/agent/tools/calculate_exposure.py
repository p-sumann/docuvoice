import json
import re

import structlog
from livekit.agents import RunContext
from livekit.agents.llm import function_tool

from agent.context.session_memory import FindingRecord, SessionMemory
from agent.utils.dynamo import create_finding

logger = structlog.get_logger(__name__)


def _parse_currency(value: str) -> float | None:
    """Parse a currency string like '$47,250' or '100000' to float."""
    cleaned = re.sub(r"[^\d.]", "", value)
    try:
        return float(cleaned)
    except ValueError:
        return None


def _extract_all_fields_with_source(context_text: str) -> tuple[dict[str, str], dict[str, str]]:
    """Extract all fields from context text into a flat dict + track which doc each field came from."""
    fields: dict[str, str] = {}
    field_source: dict[str, str] = {}
    current_doc = ""
    in_fields = False
    for line in context_text.split("\n"):
        doc_match = re.match(r"=== DOCUMENT \d+:\s*(.+?)\s*===", line)
        if doc_match:
            current_doc = doc_match.group(1)
            in_fields = False
            continue
        if "--- Extracted Fields ---" in line:
            in_fields = True
            continue
        if line.startswith("---") or line.startswith("==="):
            in_fields = False
            continue
        if in_fields and ":" in line:
            key, _, value = line.partition(":")
            key = key.strip()
            value = value.strip()
            if key and value:
                fields[key] = value
                field_source[key] = current_doc
    return fields, field_source


@function_tool()
async def calculate_exposure(
    context: RunContext[SessionMemory],
) -> str:
    """Calculate total medical exposure against policy limits for this insurance claim.

    Compares medical bills total against Bodily Injury per-person and per-occurrence limits.
    Use this when the user asks about exposure, coverage adequacy, or reserve recommendations.
    """
    memory = context.userdata
    memory.record_tool_call()

    fields, field_source = _extract_all_fields_with_source(memory.context_text)
    if not fields:
        return json.dumps({"error": "No extracted fields available for exposure calculation."})

    # Find medical total
    medical_total = None
    for key in ("total_medical", "medical_total", "total_bills"):
        if key in fields:
            medical_total = _parse_currency(fields[key])
            break

    # Find BI limit per person
    bi_limit = None
    for key in ("bi_limit_per_person", "bi_limit", "bodily_injury_limit"):
        if key in fields:
            bi_limit = _parse_currency(fields[key])
            break

    # Find deductible
    deductible = None
    for key in ("deductible", "collision_deductible"):
        if key in fields:
            deductible = _parse_currency(fields[key])
            break

    # Find BI per occurrence
    bi_occurrence = None
    for key in ("bi_limit_per_occurrence",):
        if key in fields:
            bi_occurrence = _parse_currency(fields[key])
            break

    # Find passenger count for per-person calc
    passengers = None
    for key in ("passengers", "passengers_fnol", "passengers_police"):
        if key in fields:
            try:
                passengers = int(fields[key])
            except ValueError:
                pass
            break

    result: dict = {
        "medical_total": medical_total,
        "bi_limit_per_person": bi_limit,
        "bi_limit_per_occurrence": bi_occurrence,
        "deductible": deductible,
        "passengers": passengers,
    }

    if medical_total is None or bi_limit is None:
        result["message"] = (
            "Insufficient data: need both medical total and BI limit for exposure calculation."
        )
        return json.dumps(result)

    # Calculate exposure ratio
    exposure_ratio = medical_total / bi_limit
    result["exposure_ratio"] = round(exposure_ratio, 4)
    result["exposure_percent"] = f"{exposure_ratio * 100:.1f}%"

    net_medical = medical_total - (deductible or 0)
    result["net_medical_after_deductible"] = net_medical

    # Assess risk
    if exposure_ratio >= 0.75:
        risk_level = "HIGH"
        recommendation = (
            f"Medical bills (${medical_total:,.0f}) are at {exposure_ratio * 100:.1f}% of "
            f"the BI limit (${bi_limit:,.0f}). HIGH RISK — recommend immediate reserve "
            f"adjustment and supervisor review."
        )
        severity = "critical"
    elif exposure_ratio >= 0.50:
        risk_level = "ELEVATED"
        recommendation = (
            f"Medical bills (${medical_total:,.0f}) are at {exposure_ratio * 100:.1f}% of "
            f"the BI limit (${bi_limit:,.0f}). ELEVATED RISK — monitor closely and consider "
            f"early reserve adjustment."
        )
        severity = "high"
    elif exposure_ratio >= 0.25:
        risk_level = "MODERATE"
        recommendation = (
            f"Medical bills (${medical_total:,.0f}) are at {exposure_ratio * 100:.1f}% of "
            f"the BI limit (${bi_limit:,.0f}). Within normal range but approaching review threshold."
        )
        severity = "medium"
    else:
        risk_level = "LOW"
        recommendation = (
            f"Medical bills (${medical_total:,.0f}) are at {exposure_ratio * 100:.1f}% of "
            f"the BI limit (${bi_limit:,.0f}). Well within coverage limits."
        )
        severity = "low"

    result["risk_level"] = risk_level
    result["recommendation"] = recommendation

    # Create finding if elevated or higher
    if exposure_ratio >= 0.40:
        # Resolve actual document names from field sources
        medical_doc = field_source.get("total_medical", field_source.get("medical_total", ""))
        policy_doc = field_source.get("bi_limit_per_person", field_source.get("bi_limit", ""))
        doc_refs = [d for d in [medical_doc, policy_doc] if d]

        finding = FindingRecord(
            index=memory.next_finding_index(),
            type="exposure",
            severity=severity,
            title=f"Medical Exposure at {exposure_ratio * 100:.1f}% of BI Limit",
            description=recommendation,
            document_refs=doc_refs,
            field_refs=["total_medical", "bi_limit_per_person"],
            confidence=0.91,
        )
        memory.add_finding(finding)
        result["finding_created"] = True

        try:
            await create_finding(
                session_id=memory.session_id,
                workspace_id=memory.workspace_id,
                finding_index=finding.index,
                finding_data=finding.to_dynamo_dict(),
            )
        except Exception:
            logger.warning("finding_persist_failed", finding_index=finding.index)

    return json.dumps(result)
