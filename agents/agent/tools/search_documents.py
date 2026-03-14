import json
import re

import structlog
from livekit.agents import RunContext
from livekit.agents.llm import function_tool

from agent.context.session_memory import SessionMemory

logger = structlog.get_logger(__name__)


@function_tool()
async def search_documents(
    context: RunContext[SessionMemory],
    query: str,
    max_results: int = 5,
) -> str:
    """Search across all workspace documents for a keyword or phrase.

    Use this tool when the user asks about specific information, terms, or data
    that may be in any of the uploaded documents.

    Args:
        query: The search term or phrase to look for across all documents.
        max_results: Maximum number of matching snippets to return. Default 5.
    """
    memory = context.userdata
    memory.record_tool_call()
    context_text = memory.full_context_text or memory.context_text

    if not context_text:
        return json.dumps({"results": [], "message": "No documents loaded in this workspace."})

    # Split context into document sections
    doc_sections = re.split(r"=== DOCUMENT \d+:", context_text)
    results: list[dict] = []

    query_lower = query.lower()

    for section in doc_sections:
        if not section.strip():
            continue

        # Extract document name
        first_line = section.strip().split("\n")[0]
        doc_name = first_line.strip().rstrip("=").strip()

        # Search for query in section
        section_lower = section.lower()
        if query_lower not in section_lower:
            continue

        memory.add_document_ref(doc_name)

        # Extract matching snippets (lines containing the query)
        lines = section.split("\n")
        matching_lines = []
        for i, line in enumerate(lines):
            if query_lower in line.lower():
                # Get context: line before + match + line after
                start = max(0, i - 1)
                end = min(len(lines), i + 2)
                snippet = "\n".join(lines[start:end]).strip()
                matching_lines.append(snippet)

        if matching_lines:
            results.append({
                "document": doc_name,
                "matches": matching_lines[:3],  # max 3 snippets per doc
            })

        if len(results) >= max_results:
            break

    if not results:
        return json.dumps({
            "results": [],
            "message": f"No matches found for '{query}' across {len(doc_sections) - 1} documents.",
        })

    return json.dumps({
        "results": results,
        "total_matches": sum(len(r["matches"]) for r in results),
        "documents_searched": len(doc_sections) - 1,
    })
