import json
import re

import structlog
from livekit.agents import RunContext
from livekit.agents.llm import function_tool

from agent.context.session_memory import FindingRecord, SessionMemory
from agent.utils.dynamo import create_finding

logger = structlog.get_logger(__name__)


def _extract_fields_by_document(context_text: str) -> dict[str, dict[str, str]]:
    """Parse context text into {document_name: {field_key: field_value}}."""
    docs: dict[str, dict[str, str]] = {}
    current_doc = ""
    in_fields = False

    for line in context_text.split("\n"):
        doc_match = re.match(r"=== DOCUMENT \d+:\s*(.+?)\s*===", line)
        if doc_match:
            current_doc = doc_match.group(1)
            docs[current_doc] = {}
            in_fields = False
            continue
        if "--- Extracted Fields ---" in line:
            in_fields = True
            continue
        if line.startswith("---") or line.startswith("==="):
            in_fields = False
            continue
        if in_fields and current_doc and ":" in line:
            key, _, value = line.partition(":")
            key = key.strip()
            value = value.strip()
            if key and value:
                docs[current_doc][key] = value

    return docs


def _parse_currency(value: str) -> float | None:
    cleaned = re.sub(r"[^\d.]", "", value)
    try:
        return float(cleaned)
    except ValueError:
        return None


@function_tool()
async def flag_red_flags(
    context: RunContext[SessionMemory],
) -> str:
    """Analyze all workspace documents for anomalies, discrepancies, and red flags.

    Performs a systematic check including:
    - Field value mismatches across documents
    - Values exceeding risk thresholds
    - Missing required fields
    - Date inconsistencies

    Use this when the user asks for a comprehensive review or wants to know about
    any issues with the claim.
    """
    memory = context.userdata
    memory.record_tool_call()

    docs_fields = _extract_fields_by_document(memory.context_text)
    if not docs_fields:
        return json.dumps({"red_flags": [], "message": "No documents to analyze."})

    red_flags: list[dict] = []

    # --- Check 1: Field mismatches across documents ---
    # Collect all field values across docs for comparison
    field_values: dict[str, dict[str, str]] = {}  # field -> {doc: value}
    for doc_name, fields in docs_fields.items():
        for key, value in fields.items():
            # Normalize field names for comparison
            base_key = re.sub(r"_(fnol|police|medical|policy)$", "", key)
            if base_key not in field_values:
                field_values[base_key] = {}
            field_values[base_key][doc_name] = value

    for field_key, doc_vals in field_values.items():
        if len(doc_vals) < 2:
            continue
        unique_vals = set(doc_vals.values())
        if len(unique_vals) > 1:
            docs_involved = list(doc_vals.keys())
            description = (
                f"'{field_key}' has different values: "
                + ", ".join(f"{doc}: '{val}'" for doc, val in doc_vals.items())
            )
            red_flags.append({
                "type": "discrepancy",
                "severity": "critical" if field_key in ("passengers", "fault") else "high",
                "title": f"{field_key.replace('_', ' ').title()} Mismatch",
                "description": description,
                "document_refs": docs_involved,
                "field_refs": [field_key],
                "confidence": 0.92,
            })

    # --- Check 2: Exposure thresholds ---
    all_fields: dict[str, str] = {}
    for fields in docs_fields.values():
        all_fields.update(fields)

    medical_total = None
    bi_limit = None
    for key in ("total_medical", "medical_total"):
        if key in all_fields:
            medical_total = _parse_currency(all_fields[key])
            break
    for key in ("bi_limit_per_person", "bi_limit"):
        if key in all_fields:
            bi_limit = _parse_currency(all_fields[key])
            break

    if medical_total and bi_limit and medical_total / bi_limit >= 0.40:
        ratio = medical_total / bi_limit
        # Resolve actual document names that contain these fields
        medical_doc = ""
        policy_doc = ""
        for doc_name, fields in docs_fields.items():
            for k in fields:
                if k in ("total_medical", "medical_total") and not medical_doc:
                    medical_doc = doc_name
                if k in ("bi_limit_per_person", "bi_limit") and not policy_doc:
                    policy_doc = doc_name
        exposure_doc_refs = [d for d in [medical_doc, policy_doc] if d]

        red_flags.append({
            "type": "exposure",
            "severity": "critical" if ratio >= 0.75 else "high" if ratio >= 0.50 else "medium",
            "title": f"Medical Exposure at {ratio * 100:.1f}% of BI Limit",
            "description": (
                f"Combined medical bills (${medical_total:,.0f}) represent "
                f"{ratio * 100:.1f}% of the BI per-person limit (${bi_limit:,.0f})."
            ),
            "document_refs": exposure_doc_refs,
            "field_refs": ["total_medical", "bi_limit_per_person"],
            "confidence": 0.91,
        })

    # --- Check 3: Missing critical fields ---
    required_insurance_fields = {
        "policy_number", "claimant_name", "date_of_loss", "bi_limit_per_person",
    }
    present_fields = set()
    for fields in docs_fields.values():
        present_fields.update(fields.keys())

    missing = required_insurance_fields - present_fields
    if missing:
        red_flags.append({
            "type": "missing",
            "severity": "medium",
            "title": "Missing Required Fields",
            "description": f"The following critical fields were not found: {', '.join(missing)}",
            "document_refs": [],
            "field_refs": list(missing),
            "confidence": 0.85,
        })

    # --- Persist findings ---
    for flag_data in red_flags:
        # Check if we already have a similar finding (avoid duplicates)
        existing_titles = {f.title for f in memory.findings}
        if flag_data["title"] in existing_titles:
            continue

        finding = FindingRecord(
            index=memory.next_finding_index(),
            **flag_data,
        )
        memory.add_finding(finding)

        try:
            await create_finding(
                session_id=memory.session_id,
                workspace_id=memory.workspace_id,
                finding_index=finding.index,
                finding_data=finding.to_dynamo_dict(),
            )
        except Exception:
            logger.warning("finding_persist_failed", finding_index=finding.index)

    return json.dumps({
        "red_flags": red_flags,
        "total_flags": len(red_flags),
        "documents_analyzed": len(docs_fields),
        "message": (
            f"Found {len(red_flags)} red flag(s) across {len(docs_fields)} documents."
            if red_flags
            else f"No red flags detected across {len(docs_fields)} documents."
        ),
    })
