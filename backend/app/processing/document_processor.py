"""Document processing pipeline.

Primary:  pymupdf4llm for digital/text PDFs (fast, local, no API calls)
Fallback: AWS Textract for scanned/image-based PDFs (cloud OCR)

Flow per document:
1. Try pymupdf4llm → if text is too short, assume scanned → fall back to Textract
2. Run AI field extraction via Instructor + Nova Pro (regex fallback)
3. Compute token count estimate
"""

import asyncio
import os
import tempfile

import boto3
import pymupdf4llm
import structlog

from app.config import settings
from app.models.document import DocumentModel
from app.processing.ai_extractor import extract_fields_with_ai, generate_document_summary

logger = structlog.get_logger()

# Minimum chars to consider pymupdf extraction successful (below = likely scanned)
_MIN_TEXT_LENGTH = 50


def _extract_with_pymupdf_sync(content: bytes) -> str:
    """Extract text from a PDF using pymupdf4llm (local, fast). Blocking call."""
    with tempfile.NamedTemporaryFile(suffix=".pdf", delete=False) as tmp:
        tmp.write(content)
        tmp_path = tmp.name
    try:
        md_text = pymupdf4llm.to_markdown(tmp_path)
        return md_text.strip()
    finally:
        os.unlink(tmp_path)


def _extract_with_textract_sync(content: bytes) -> str:
    """Extract text from a scanned/image PDF or image using AWS Textract. Blocking call."""
    textract = boto3.client(
        "textract",
        region_name=settings.aws_default_region,
        aws_access_key_id=settings.aws_access_key_id,
        aws_secret_access_key=settings.aws_secret_access_key,
        aws_session_token=settings.aws_session_token or None,
    )

    response = textract.detect_document_text(Document={"Bytes": content})

    lines: list[str] = []
    for block in response.get("Blocks", []):
        if block["BlockType"] == "LINE":
            lines.append(block.get("Text", ""))

    return "\n".join(lines).strip()


async def extract_text_from_file(filename: str, content: bytes) -> str:
    """Extract text from file (async — runs blocking I/O in threads).

    - PDFs: pymupdf4llm first; if text is too short (scanned), fall back to Textract
    - Images: Textract directly
    - Text files: raw decode
    """
    lower = filename.lower()

    if lower.endswith(".pdf"):
        try:
            text = await asyncio.to_thread(_extract_with_pymupdf_sync, content)
            if len(text) >= _MIN_TEXT_LENGTH:
                logger.info("pymupdf_extracted", filename=filename, chars=len(text))
                return text
            logger.info("pymupdf_low_text", filename=filename, chars=len(text))
        except Exception as e:
            logger.warning("pymupdf_failed", filename=filename, error=str(e))

        # Fallback to Textract for scanned/image PDFs
        try:
            text = await asyncio.to_thread(_extract_with_textract_sync, content)
            logger.info("textract_extracted", filename=filename, chars=len(text))
            return text
        except Exception as e:
            logger.error("textract_failed", filename=filename, error=str(e))
            return ""

    if lower.endswith((".png", ".jpg", ".jpeg", ".tiff")):
        try:
            text = await asyncio.to_thread(_extract_with_textract_sync, content)
            logger.info("textract_image_extracted", filename=filename, chars=len(text))
            return text
        except Exception as e:
            logger.error("textract_image_failed", filename=filename, error=str(e))
            return ""

    if lower.endswith((".txt", ".md", ".csv")):
        return content.decode("utf-8", errors="replace")

    return ""


def estimate_tokens(text: str) -> int:
    """Rough token estimate: ~4 chars per token."""
    return max(1, len(text) // 4)


async def process_document(doc: DocumentModel, content: bytes) -> DocumentModel:
    """Full processing pipeline for a single document."""
    logger.info("processing_document", doc_id=doc.id, filename=doc.filename)

    text = await extract_text_from_file(doc.filename, content)
    doc.raw_text = text
    doc.size_bytes = len(content)
    doc.size_tokens = estimate_tokens(text)
    doc.extracted_fields = await extract_fields_with_ai(doc.filename, text, doc.document_type)
    doc.summary = await generate_document_summary(doc.filename, text, doc.document_type, doc.extracted_fields)
    doc.status = "ready"

    logger.info(
        "document_processed",
        doc_id=doc.id,
        text_length=len(text),
        tokens=doc.size_tokens,
        fields_extracted=len(doc.extracted_fields),
    )
    return doc
