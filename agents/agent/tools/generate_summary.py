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

    Compiles all findings, key extracted fields, and exposure data into a structured
    report suitable for an insurance adjuster's review.

    Use this when the user asks for a summary, report, or adjuster notes.
    """
    memory = context.userdata
    memory.record_tool_call()

    fields = _extract_all_fields(memory.context_text)
    doc_count = _count_documents(memory.context_text)

    doc_names = _extract_document_names(memory.context_text)

    # Build summary sections
    sections: list[str] = []

    # Header
    policy = fields.get("policy_number", "Unknown")
    claimant = fields.get("claimant_name", "Unknown")
    date_of_loss = fields.get("date_of_loss", "Unknown")
    sections.append(f"ADJUSTER SUMMARY — {policy}")
    sections.append(f"Claimant: {claimant}")
    sections.append(f"Date of Loss: {date_of_loss}")
    sections.append(f"Documents Reviewed: {doc_count}")
    if doc_names:
        sections.append(f"Sources: {', '.join(doc_names)}")
    sections.append("")

    # Key Facts
    sections.append("KEY FACTS:")
    key_fields = [
        "vehicle_make", "vehicle_year", "loss_location",
        "weather_conditions", "fault_determination",
    ]
    for key in key_fields:
        if key in fields:
            label = key.replace("_", " ").title()
            sections.append(f"  - {label}: {fields[key]}")
    sections.append("")

    # Coverage
    sections.append("COVERAGE:")
    coverage_fields = [
        ("bi_limit_per_person", "BI Limit (Per Person)"),
        ("bi_limit_per_occurrence", "BI Limit (Per Occurrence)"),
        ("pd_limit", "PD Limit"),
        ("deductible", "Deductible"),
    ]
    for key, label in coverage_fields:
        if key in fields:
            sections.append(f"  - {label}: {fields[key]}")
    sections.append("")

    # Medical
    medical_total = fields.get("total_medical", fields.get("medical_total"))
    if medical_total:
        sections.append("MEDICAL:")
        sections.append(f"  - Total Medical Bills: {medical_total}")
        provider = fields.get("treatment_provider")
        if provider:
            sections.append(f"  - Provider: {provider}")
        duration = fields.get("treatment_duration")
        if duration:
            sections.append(f"  - Treatment Duration: {duration}")
        sections.append("")

    # Findings
    if memory.findings:
        sections.append(f"FINDINGS ({len(memory.findings)}):")
        for f in memory.findings:
            sections.append(f"  [{f.severity.upper()}] {f.title}")
            sections.append(f"    {f.description}")
            if f.document_refs:
                sections.append(f"    Sources: {', '.join(f.document_refs)}")
        sections.append("")

    # Recommendations
    sections.append("RECOMMENDATIONS:")
    if any(f.severity in ("critical", "high") for f in memory.findings):
        sections.append("  - PRIORITY: Resolve critical/high findings before proceeding")
    if any(f.type == "discrepancy" for f in memory.findings):
        sections.append("  - Contact claimant to clarify document discrepancies")
    if any(f.type == "exposure" for f in memory.findings):
        sections.append("  - Review reserve adequacy given exposure level")
    if not memory.findings:
        sections.append("  - No significant issues detected. Proceed with standard processing.")

    summary_text = "\n".join(sections)

    return json.dumps({
        "summary": summary_text,
        "finding_count": len(memory.findings),
        "document_count": doc_count,
        "key_fields_extracted": len(fields),
    })
