import json

import aioboto3
import structlog
from botocore.exceptions import ClientError
from tenacity import retry, retry_if_exception_type, stop_after_attempt, wait_exponential

from agent.config import get_settings

logger = structlog.get_logger(__name__)

_session: aioboto3.Session | None = None

_s3_retry = retry(
    stop=stop_after_attempt(3),
    wait=wait_exponential(multiplier=0.5, min=1, max=5),
    retry=retry_if_exception_type((ClientError, ConnectionError)),
    before_sleep=lambda rs: logger.warning(
        "s3_retry", attempt=rs.attempt_number, wait=rs.next_action.sleep
    ),
)


def _get_session() -> aioboto3.Session:
    global _session
    if _session is None:
        _session = aioboto3.Session()
    return _session


@_s3_retry
async def load_workspace_context(workspace_id: str) -> str:
    """Load pre-built workspace context from S3."""
    settings = get_settings()
    key = f"workspaces/{workspace_id}/context.txt"
    session = _get_session()
    async with session.client("s3", region_name=settings.aws_default_region) as s3:
        try:
            resp = await s3.get_object(Bucket=settings.s3_bucket_name, Key=key)
            body = await resp["Body"].read()
            text = body.decode("utf-8")
            logger.info("loaded_workspace_context", workspace_id=workspace_id, chars=len(text))
            return text
        except s3.exceptions.NoSuchKey:
            logger.warning("no_context_file", workspace_id=workspace_id, key=key)
            return ""


@_s3_retry
async def load_document_text(workspace_id: str, doc_id: str) -> str:
    """Load processed text for a single document."""
    settings = get_settings()
    key = f"workspaces/{workspace_id}/documents/{doc_id}/processed_text.txt"
    session = _get_session()
    async with session.client("s3", region_name=settings.aws_default_region) as s3:
        try:
            resp = await s3.get_object(Bucket=settings.s3_bucket_name, Key=key)
            body = await resp["Body"].read()
            return body.decode("utf-8")
        except s3.exceptions.NoSuchKey:
            logger.warning("no_document_text", workspace_id=workspace_id, doc_id=doc_id)
            return ""


@_s3_retry
async def load_document_fields(workspace_id: str, doc_id: str) -> dict:
    """Load processed.json (extracted fields) for a single document."""
    settings = get_settings()
    key = f"workspaces/{workspace_id}/documents/{doc_id}/processed.json"
    session = _get_session()
    async with session.client("s3", region_name=settings.aws_default_region) as s3:
        try:
            resp = await s3.get_object(Bucket=settings.s3_bucket_name, Key=key)
            body = await resp["Body"].read()
            return json.loads(body.decode("utf-8"))
        except s3.exceptions.NoSuchKey:
            logger.warning("no_document_fields", workspace_id=workspace_id, doc_id=doc_id)
            return {}
