from datetime import datetime, timezone
from uuid import uuid4

from app.models.document import DocumentModel
from app.processing.document_processor import (
    extract_text_from_file,
    estimate_tokens,
)
from app.processing.ai_extractor import extract_fields_with_ai, generate_document_summary
from app.repositories.protocols import DocumentRepository

# In-memory file content store: doc_id -> bytes
_file_store: dict[str, bytes] = {}


class DocumentService:
    def __init__(self, document_repo: DocumentRepository) -> None:
        self._document_repo = document_repo

    async def list_by_workspace(self, workspace_id: str) -> list[DocumentModel]:
        return await self._document_repo.list_by_workspace(workspace_id)

    async def get_document(self, doc_id: str) -> DocumentModel | None:
        return await self._document_repo.get_by_id(doc_id)

    async def create_upload(
        self,
        workspace_id: str,
        filename: str,
        document_type: str,
        content: bytes | None = None,
    ) -> tuple[str, DocumentModel]:
        """Create a document record and optionally store file content."""
        doc_id = f"doc-{uuid4().hex[:8]}"
        s3_key = f"{workspace_id}/documents/{doc_id}/{filename}"
        now = datetime.now(timezone.utc).isoformat()

        doc = DocumentModel(
            id=doc_id,
            workspace_id=workspace_id,
            filename=filename,
            document_type=document_type,
            status="uploading",
            s3_key=s3_key,
            size_bytes=len(content) if content else 0,
            created_at=now,
        )
        await self._document_repo.create(doc)

        if content:
            _file_store[doc_id] = content

        upload_url = f"http://localhost:8000/mock-upload/{s3_key}"
        return upload_url, doc

    async def extract_text(self, doc_id: str) -> DocumentModel | None:
        """Step 1: Extract raw text from the document (PyMuPDF / Textract)."""
        doc = await self._document_repo.get_by_id(doc_id)
        if doc is None:
            return None

        content = _file_store.get(doc_id)
        if content is None:
            doc.status = "error"
            doc.processing_error = "No file content available"
            return await self._document_repo.update(doc)

        doc.status = "processing"
        await self._document_repo.update(doc)

        text = await extract_text_from_file(doc.filename, content)
        doc.raw_text = text
        doc.size_bytes = len(content)
        doc.size_tokens = estimate_tokens(text)
        return await self._document_repo.update(doc)

    async def extract_fields(self, doc_id: str) -> DocumentModel | None:
        """Step 2: Run AI field extraction + summary on already-extracted text."""
        doc = await self._document_repo.get_by_id(doc_id)
        if doc is None:
            return None

        doc.extracted_fields = await extract_fields_with_ai(
            doc.filename, doc.raw_text, doc.document_type
        )
        doc.summary = await generate_document_summary(
            doc.filename, doc.raw_text, doc.document_type, doc.extracted_fields
        )
        doc.status = "ready"
        return await self._document_repo.update(doc)

    async def reject_document(self, doc_id: str, reason: str) -> DocumentModel | None:
        """Mark a document as rejected (failed domain validation)."""
        doc = await self._document_repo.get_by_id(doc_id)
        if doc is None:
            return None

        doc.status = "rejected"
        doc.rejection_reason = reason
        return await self._document_repo.update(doc)

    async def process_doc(self, doc_id: str) -> DocumentModel | None:
        """Run the full processing pipeline (text extraction + field extraction).

        Kept for backward compatibility.
        """
        await self.extract_text(doc_id)
        return await self.extract_fields(doc_id)

    async def update_status(self, doc_id: str, status: str) -> DocumentModel | None:
        doc = await self._document_repo.get_by_id(doc_id)
        if doc is None:
            return None
        doc.status = status
        return await self._document_repo.update(doc)
