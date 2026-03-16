import json
import re

import structlog
from livekit.agents import RunContext
from livekit.agents.llm import function_tool

from agent.context.session_memory import SessionMemory

logger = structlog.get_logger(__name__)


def _extract_all_fields(context_text: str) -> dict[str, str]:
    """Extract all fields from context text into a flat dict."""
    fields: dict[str, str] = {}
    in_fields = False
    for line in context_text.split("\n"):
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
    return fields


def _extract_document_names(context_text: str) -> list[str]:
    """Extract document names from context text."""
    return re.findall(r"=== DOCUMENT \d+:\s*(.+?)\s*===", context_text)


def _count_documents(context_text: str) -> int:
    return len(re.findall(r"=== DOCUMENT \d+:", context_text))


@function_tool()
async def generate_summary(
    context: RunContext[SessionMemory],
) -> str:
    """Generate adjuster summary notes for this insurance claim.

    Compiles findings, exposure risks, discrepancies, and key action items into a
    structured report. Findings and recommendations come first — they're the priority.

    Use this when the user asks for a summary, report, or adjuster notes.
    """
    memory = context.userdata
    memory.record_tool_call()

    fields = _extract_all_fields(memory.context_text)
    doc_count = _count_documents(memory.context_text)
    doc_names = _extract_document_names(memory.context_text)

    sections: list[str] = []

    # ── Header (brief) ──
    policy = fields.get("policy_number", "Unknown")
    claimant = fields.get("claimant_name", "Unknown")
    date_of_loss = fields.get("date_of_loss", "Unknown")
    sections.append(f"ADJUSTER SUMMARY — {policy}")
    sections.append(f"Claimant: {claimant} | Date of Loss: {date_of_loss} | Docs: {doc_count}")
    sections.append("")

    # ── Findings FIRST — this is the main value ──
    critical_high = [f for f in memory.findings if f.severity in ("critical", "high")]
    medium_low = [f for f in memory.findings if f.severity not in ("critical", "high")]

    if memory.findings:
        sections.append(f"{'⚠ ' if critical_high else ''}FINDINGS ({len(memory.findings)}):")
        # Critical/high findings first
        for f in critical_high:
            sections.append(f"  !! [{f.severity.upper()}] {f.title}")
            sections.append(f"     {f.description}")
            if f.document_refs:
                sections.append(f"     Sources: {', '.join(f.document_refs)}")
        for f in medium_low:
            sections.append(f"  [{f.severity.upper()}] {f.title}")
            sections.append(f"     {f.description}")
            if f.document_refs:
                sections.append(f"     Sources: {', '.join(f.document_refs)}")
        sections.append("")
    else:
        sections.append("FINDINGS: None detected.")
        sections.append("")

    # ── Recommendations (action items) ──
    sections.append("ACTION ITEMS:")
    if critical_high:
        sections.append("  !! PRIORITY: Resolve critical/high findings before proceeding")
    if any(f.type == "discrepancy" for f in memory.findings):
        sections.append("  - Contact claimant to clarify document discrepancies")
    if any(f.type == "exposure" for f in memory.findings):
        sections.append("  - Review reserve adequacy given exposure level")
    if any(f.type == "missing" for f in memory.findings):
        sections.append("  - Request missing documentation to complete the file")
    if not memory.findings:
        sections.append("  - No significant issues. Proceed with standard processing.")
    sections.append("")

    # ── Exposure snapshot ──
    medical_total = fields.get("total_medical", fields.get("medical_total"))
    bi_limit = fields.get("bi_limit_per_person")
    if medical_total or bi_limit:
        sections.append("EXPOSURE:")
        if medical_total:
            sections.append(f"  - Medical Total: {medical_total}")
        if bi_limit:
            sections.append(f"  - BI Limit (Per Person): {bi_limit}")
        if medical_total and bi_limit:
            try:
                med_val = float(medical_total.replace("$", "").replace(",", ""))
                bi_val = float(bi_limit.replace("$", "").replace(",", ""))
                ratio = med_val / bi_val * 100 if bi_val > 0 else 0
                sections.append(f"  - Utilization: {ratio:.0f}% of BI limit")
            except (ValueError, ZeroDivisionError):
                pass
        sections.append("")

    # ── Claim snapshot (compact, not the main event) ──
    snapshot_items = []
    for key in ["vehicle_make", "vehicle_year", "loss_location", "fault_determination"]:
        if key in fields:
            snapshot_items.append(f"{key.replace('_', ' ').title()}: {fields[key]}")
    if snapshot_items:
        sections.append("CLAIM SNAPSHOT: " + " | ".join(snapshot_items))
        sections.append("")

    # ── Sources ──
    if doc_names:
        sections.append(f"SOURCES: {', '.join(doc_names)}")

    summary_text = "\n".join(sections)

    return json.dumps({
        "summary": summary_text,
        "finding_count": len(memory.findings),
        "critical_count": len(critical_high),
        "document_count": doc_count,
        "key_fields_extracted": len(fields),
    })
