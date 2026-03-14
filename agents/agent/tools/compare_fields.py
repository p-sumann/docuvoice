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
        # Detect document header
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


@function_tool()
async def compare_fields(
    context: RunContext[SessionMemory],
    field_name: str,
    doc1_name: str = "",
    doc2_name: str = "",
) -> str:
    """Compare a specific field across documents to find discrepancies.

    Use this when the user asks about differences or inconsistencies between documents,
    or when you need to verify if information matches across sources.

    Args:
        field_name: The name of the field to compare (e.g., 'passengers', 'date_of_loss').
        doc1_name: First document filename. Leave empty to compare across all documents.
        doc2_name: Second document filename. Leave empty to compare across all documents.
    """
    memory = context.userdata
    memory.record_tool_call()

    docs_fields = _extract_fields_by_document(memory.context_text)
    if not docs_fields:
        return json.dumps({"error": "No extracted fields found in workspace documents."})

    field_lower = field_name.lower()

    # Collect all values for this field across documents
    field_values: dict[str, str] = {}
    for doc_name, fields in docs_fields.items():
        # Filter by specific docs if provided
        if doc1_name and doc2_name:
            if doc_name not in (doc1_name, doc2_name):
                continue
        for key, value in fields.items():
            if field_lower in key.lower():
                field_values[doc_name] = value
                memory.add_document_ref(doc_name)

    if not field_values:
        return json.dumps({
            "field": field_name,
            "found": False,
            "message": f"Field '{field_name}' not found in any document.",
        })

    if len(field_values) < 2:
        doc, val = next(iter(field_values.items()))
        return json.dumps({
            "field": field_name,
            "found": True,
            "values": {doc: val},
            "discrepancy": False,
            "message": f"Field '{field_name}' only found in one document: {doc} = {val}",
        })

    # Check for discrepancies
    unique_values = set(field_values.values())
    has_discrepancy = len(unique_values) > 1

    result = {
        "field": field_name,
        "found": True,
        "values": field_values,
        "discrepancy": has_discrepancy,
    }

    if has_discrepancy:
        doc_names = list(field_values.keys())
        vals = list(field_values.values())
        description = (
            f"Discrepancy in '{field_name}': "
            + ", ".join(f"{doc} says '{val}'" for doc, val in field_values.items())
            + ". This inconsistency should be investigated."
        )
        result["message"] = description

        # Create and persist finding
        finding = FindingRecord(
            index=memory.next_finding_index(),
            type="discrepancy",
            severity="critical" if field_lower in ("passengers", "injury", "fault") else "high",
            title=f"{field_name.replace('_', ' ').title()} Mismatch",
            description=description,
            document_refs=doc_names,
            field_refs=[field_name],
            confidence=0.94,
        )
        memory.add_finding(finding)

        # Persist to DynamoDB (best-effort)
        try:
            await create_finding(
                session_id=memory.session_id,
                workspace_id=memory.workspace_id,
                finding_index=finding.index,
                finding_data=finding.to_dynamo_dict(),
            )
        except Exception:
            logger.warning("finding_persist_failed", finding_index=finding.index)
    else:
        val = next(iter(unique_values))
        result["message"] = (
            f"Field '{field_name}' is consistent across all documents: {val}"
        )

    return json.dumps(result)
