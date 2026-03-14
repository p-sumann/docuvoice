import time

from app.models.document import DocumentModel
from app.services.document_service import DocumentService

# Simple in-memory cache: workspace_id -> (lean, full, timestamp)
_cache: dict[str, tuple[str, str, float]] = {}
_CACHE_TTL = 120  # seconds


def _build_lean_context(workspace_id: str, docs: list[DocumentModel]) -> str:
    """Build lean context: extracted fields + summaries only. For the voice model system prompt."""
    lines = [f"=== WORKSPACE: {workspace_id} ==="]
    lines.append(f"Documents: {len(docs)}")
    lines.append("")
    for i, doc in enumerate(docs, 1):
        lines.append(f"=== DOCUMENT {i}: {doc.filename} ===")
        lines.append(f"Type: {doc.document_type}")
        if doc.summary:
            lines.append(f"Summary: {doc.summary}")
        if doc.extracted_fields:
            lines.append("--- Extracted Fields ---")
            for field in doc.extracted_fields:
                lines.append(f"{field.key}: {field.value}")
        lines.append("")
    return "\n".join(lines)


def _build_full_context(workspace_id: str, docs: list[DocumentModel]) -> str:
    """Build full context: extracted fields + raw text. For tool-level search."""
    lines = [f"=== WORKSPACE: {workspace_id} ==="]
    lines.append(f"Documents: {len(docs)}")
    lines.append("")
    for i, doc in enumerate(docs, 1):
        lines.append(f"=== DOCUMENT {i}: {doc.filename} ===")
        lines.append(f"Type: {doc.document_type}")
        if doc.extracted_fields:
            lines.append("--- Extracted Fields ---")
            for field in doc.extracted_fields:
                lines.append(f"{field.key}: {field.value}")
        if doc.raw_text:
            lines.append("--- Full Text ---")
            text = doc.raw_text[:3000]
            if len(doc.raw_text) > 3000:
                text += "\n[... truncated ...]"
            lines.append(text)
        lines.append("")
    return "\n".join(lines)


class ContextService:
    def __init__(self, document_service: DocumentService) -> None:
        self._document_service = document_service

    async def get_context(self, workspace_id: str) -> dict[str, str]:
        """Return cached two-tier context, building it if stale or missing."""
        now = time.monotonic()
        cached = _cache.get(workspace_id)
        if cached and (now - cached[2]) < _CACHE_TTL:
            return {"lean_context": cached[0], "full_context": cached[1]}

        docs = await self._document_service.list_by_workspace(workspace_id)
        lean = _build_lean_context(workspace_id, docs)
        full = _build_full_context(workspace_id, docs)
        _cache[workspace_id] = (lean, full, now)
        return {"lean_context": lean, "full_context": full}

    async def warm(self, workspace_id: str) -> None:
        """Pre-build and cache context for a workspace."""
        await self.get_context(workspace_id)
