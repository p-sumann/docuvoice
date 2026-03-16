import asyncio
from decimal import Decimal
from typing import Any

import boto3
import structlog
from boto3.dynamodb.conditions import Attr, Key
from botocore.exceptions import ClientError
from tenacity import retry, retry_if_exception_type, stop_after_attempt, wait_exponential

from app.config import settings
from app.models.document import DocumentModel, ExtractedFieldModel
from app.models.finding import FindingModel
from app.models.session import SessionModel, TranscriptEntryModel
from app.models.workspace import WorkspaceModel

logger = structlog.get_logger(__name__)

_dynamo_retry = retry(
    stop=stop_after_attempt(3),
    wait=wait_exponential(multiplier=0.5, min=1, max=5),
    retry=retry_if_exception_type(ClientError),
    before_sleep=lambda rs: logger.warning(
        "dynamodb_retry", attempt=rs.attempt_number, wait=rs.next_action.sleep
    ),
)


def _get_table():
    """Get DynamoDB table resource."""
    session = boto3.Session(
        aws_access_key_id=settings.aws_access_key_id or None,
        aws_secret_access_key=settings.aws_secret_access_key or None,
        aws_session_token=settings.aws_session_token or None,
        region_name=settings.aws_default_region,
    )
    kwargs: dict[str, Any] = {}
    if settings.dynamodb_endpoint_url:
        kwargs["endpoint_url"] = settings.dynamodb_endpoint_url
    dynamodb = session.resource("dynamodb", **kwargs)
    return dynamodb.Table(settings.dynamodb_table_name)


@_dynamo_retry
def _put_item_sync(table: Any, **kwargs: Any) -> dict:
    return table.put_item(**kwargs)


@_dynamo_retry
def _get_item_sync(table: Any, **kwargs: Any) -> dict:
    return table.get_item(**kwargs)


@_dynamo_retry
def _query_sync(table: Any, **kwargs: Any) -> dict:
    return table.query(**kwargs)


@_dynamo_retry
def _scan_sync(table: Any, **kwargs: Any) -> dict:
    return table.scan(**kwargs)


@_dynamo_retry
def _update_item_sync(table: Any, **kwargs: Any) -> dict:
    return table.update_item(**kwargs)


@_dynamo_retry
def _delete_item_sync(table: Any, **kwargs: Any) -> dict:
    return table.delete_item(**kwargs)


# Async wrappers — run blocking boto3 calls in thread pool so asyncio.gather works
async def _put_item(table: Any, **kwargs: Any) -> dict:
    return await asyncio.to_thread(_put_item_sync, table, **kwargs)


async def _get_item(table: Any, **kwargs: Any) -> dict:
    return await asyncio.to_thread(_get_item_sync, table, **kwargs)


async def _query(table: Any, **kwargs: Any) -> dict:
    return await asyncio.to_thread(_query_sync, table, **kwargs)


async def _scan(table: Any, **kwargs: Any) -> dict:
    return await asyncio.to_thread(_scan_sync, table, **kwargs)


async def _update_item(table: Any, **kwargs: Any) -> dict:
    return await asyncio.to_thread(_update_item_sync, table, **kwargs)


async def _delete_item(table: Any, **kwargs: Any) -> dict:
    return await asyncio.to_thread(_delete_item_sync, table, **kwargs)


def _sanitize_for_dynamo(value: Any) -> Any:
    """Convert Python types to DynamoDB-compatible types (floats → Decimal, strip empty strings from sets)."""
    if isinstance(value, float):
        return Decimal(str(value))
    if isinstance(value, dict):
        return {k: _sanitize_for_dynamo(v) for k, v in value.items()}
    if isinstance(value, list):
        return [_sanitize_for_dynamo(v) for v in value]
    return value


def _desanitize_from_dynamo(value: Any) -> Any:
    """Convert DynamoDB types back to Python types (Decimal → float/int)."""
    if isinstance(value, Decimal):
        if value == int(value):
            return int(value)
        return float(value)
    if isinstance(value, dict):
        return {k: _desanitize_from_dynamo(v) for k, v in value.items()}
    if isinstance(value, list):
        return [_desanitize_from_dynamo(v) for v in value]
    return value


# ---------------------------------------------------------------------------
# Workspace
# ---------------------------------------------------------------------------

class DynamoDBWorkspaceRepository:
    def _to_item(self, ws: WorkspaceModel) -> dict:
        return _sanitize_for_dynamo({
            "PK": f"WS#{ws.id}",
            "SK": f"WS#{ws.id}",
            "entity_type": "WORKSPACE",
            "id": ws.id,
            "name": ws.name,
            "domain": ws.domain,
            "status": ws.status,
            "document_count": ws.document_count,
            "session_count": ws.session_count,
            "finding_count": ws.finding_count,
            "phone_number": ws.phone_number,
            "last_call_at": ws.last_call_at,
            "minutes_used": ws.minutes_used,
            "created_at": ws.created_at,
            "updated_at": ws.updated_at,
        })

    def _from_item(self, item: dict) -> WorkspaceModel:
        item = _desanitize_from_dynamo(item)
        return WorkspaceModel(
            id=item["id"],
            name=item["name"],
            domain=item["domain"],
            status=item.get("status", "setup"),
            document_count=item.get("document_count", 0),
            session_count=item.get("session_count", 0),
            finding_count=item.get("finding_count", 0),
            phone_number=item.get("phone_number"),
            last_call_at=item.get("last_call_at"),
            minutes_used=item.get("minutes_used", 0.0),
            created_at=item.get("created_at", ""),
            updated_at=item.get("updated_at", ""),
        )

    async def list_all(self) -> list[WorkspaceModel]:
        table = _get_table()
        # Match workspace records by key pattern (PK and SK both start with WS#)
        filter_expr = Attr("PK").begins_with("WS#") & Attr("SK").begins_with("WS#")
        resp = await _scan(table, FilterExpression=filter_expr)
        items = resp.get("Items", [])
        while "LastEvaluatedKey" in resp:
            resp = await _scan(table,
                FilterExpression=filter_expr,
                ExclusiveStartKey=resp["LastEvaluatedKey"],
            )
            items.extend(resp.get("Items", []))
        return [self._from_item(i) for i in items]

    async def get_by_id(self, workspace_id: str) -> WorkspaceModel | None:
        table = _get_table()
        resp = await _get_item(table,
            Key={"PK": f"WS#{workspace_id}", "SK": f"WS#{workspace_id}"}
        )
        item = resp.get("Item")
        if not item:
            return None
        return self._from_item(item)

    async def create(self, workspace: WorkspaceModel) -> WorkspaceModel:
        table = _get_table()
        await _put_item(table, Item=self._to_item(workspace))
        logger.info("workspace_created_dynamo", workspace_id=workspace.id)
        return workspace

    async def update(self, workspace: WorkspaceModel) -> WorkspaceModel:
        table = _get_table()
        await _put_item(table, Item=self._to_item(workspace))
        logger.info("workspace_updated_dynamo", workspace_id=workspace.id)
        return workspace

    async def delete(self, workspace_id: str) -> None:
        table = _get_table()
        # Delete workspace record
        await _delete_item(table,
            Key={"PK": f"WS#{workspace_id}", "SK": f"WS#{workspace_id}"}
        )
        # Also delete associated documents, sessions under this workspace
        resp = await _query(table,
            KeyConditionExpression=Key("PK").eq(f"WS#{workspace_id}"),
        )
        def _batch_delete():
            with table.batch_writer() as batch:
                for item in resp.get("Items", []):
                    batch.delete_item(Key={"PK": item["PK"], "SK": item["SK"]})
        await asyncio.to_thread(_batch_delete)
        logger.info("workspace_deleted_dynamo", workspace_id=workspace_id)


# ---------------------------------------------------------------------------
# Document
# ---------------------------------------------------------------------------

class DynamoDBDocumentRepository:
    def _to_item(self, doc: DocumentModel) -> dict:
        extracted_fields = [
            {
                "key": f.key,
                "value": f.value,
                "source": f.source,
                "confidence": f.confidence,
                "is_anomaly": f.is_anomaly,
                "anomaly_reason": f.anomaly_reason,
            }
            for f in doc.extracted_fields
        ]
        return _sanitize_for_dynamo({
            "PK": f"WS#{doc.workspace_id}",
            "SK": f"DOC#{doc.id}",
            "entity_type": "DOCUMENT",
            "id": doc.id,
            "workspace_id": doc.workspace_id,
            "filename": doc.filename,
            "document_type": doc.document_type,
            "status": doc.status,
            "s3_key": doc.s3_key,
            "size_bytes": doc.size_bytes,
            "size_tokens": doc.size_tokens,
            "raw_text": doc.raw_text,
            "extracted_fields": extracted_fields,
            "summary": doc.summary,
            "processing_error": doc.processing_error,
            "is_referenced": doc.is_referenced,
            "created_at": doc.created_at,
        })

    def _from_item(self, item: dict) -> DocumentModel:
        item = _desanitize_from_dynamo(item)
        extracted_fields = [
            ExtractedFieldModel(
                key=f["key"],
                value=f["value"],
                source=f["source"],
                confidence=f.get("confidence", 0.0),
                is_anomaly=f.get("is_anomaly", False),
                anomaly_reason=f.get("anomaly_reason"),
            )
            for f in item.get("extracted_fields", [])
        ]
        return DocumentModel(
            id=item["id"],
            workspace_id=item["workspace_id"],
            filename=item["filename"],
            document_type=item["document_type"],
            status=item.get("status", "uploading"),
            s3_key=item.get("s3_key", ""),
            size_bytes=item.get("size_bytes", 0),
            size_tokens=item.get("size_tokens", 0),
            raw_text=item.get("raw_text", ""),
            extracted_fields=extracted_fields,
            summary=item.get("summary", ""),
            processing_error=item.get("processing_error"),
            is_referenced=item.get("is_referenced", False),
            created_at=item.get("created_at", ""),
        )

    async def list_by_workspace(self, workspace_id: str) -> list[DocumentModel]:
        table = _get_table()
        resp = await _query(table,
            KeyConditionExpression=Key("PK").eq(f"WS#{workspace_id}") & Key("SK").begins_with("DOC#"),
        )
        return [self._from_item(i) for i in resp.get("Items", [])]

    async def get_by_id(self, doc_id: str) -> DocumentModel | None:
        table = _get_table()
        # Scan since we don't know workspace_id from doc_id alone
        resp = _scan(table,
            FilterExpression=Attr("SK").begins_with("DOC#") & Attr("id").eq(doc_id),
        )
        items = resp.get("Items", [])
        if not items:
            return None
        return self._from_item(items[0])

    async def create(self, document: DocumentModel) -> DocumentModel:
        table = _get_table()
        await _put_item(table, Item=self._to_item(document))
        logger.info("document_created_dynamo", doc_id=document.id)
        return document

    async def update(self, document: DocumentModel) -> DocumentModel:
        table = _get_table()
        await _put_item(table, Item=self._to_item(document))
        logger.info("document_updated_dynamo", doc_id=document.id)
        return document

    async def delete(self, doc_id: str) -> None:
        # Find the document first to get its workspace_id
        doc = await self.get_by_id(doc_id)
        if doc:
            table = _get_table()
            await _delete_item(table,
                Key={"PK": f"WS#{doc.workspace_id}", "SK": f"DOC#{doc.id}"}
            )
            logger.info("document_deleted_dynamo", doc_id=doc_id)


# ---------------------------------------------------------------------------
# Session
# ---------------------------------------------------------------------------

class DynamoDBSessionRepository:
    """Compatible with agent's dynamo.py key schema:
    PK=WS#{workspace_id}, SK=SESSION#{session_id}
    """

    def _to_item(self, session: SessionModel) -> dict:
        return _sanitize_for_dynamo({
            "PK": f"WS#{session.workspace_id}",
            "SK": f"SESSION#{session.id}",
            "entity_type": "SESSION",
            "session_id": session.id,
            "workspace_id": session.workspace_id,
            "channel": session.channel,
            "caller_id": session.caller_id,
            "started_at": session.started_at,
            "ended_at": session.ended_at,
            "duration_seconds": session.duration_seconds,
            "finding_count": session.finding_count,
            "transcript_url": session.transcript_url,
        })

    def _from_item(self, item: dict) -> SessionModel:
        item = _desanitize_from_dynamo(item)
        return SessionModel(
            id=item.get("session_id", item.get("id", "")),
            workspace_id=item["workspace_id"],
            channel=item.get("channel", "web"),
            caller_id=item.get("caller_id"),
            started_at=item.get("started_at", ""),
            ended_at=item.get("ended_at"),
            duration_seconds=item.get("duration_seconds", 0),
            finding_count=item.get("finding_count", 0),
            transcript_url=item.get("transcript_url"),
        )

    async def list_by_workspace(self, workspace_id: str) -> list[SessionModel]:
        table = _get_table()
        resp = await _query(table,
            KeyConditionExpression=Key("PK").eq(f"WS#{workspace_id}") & Key("SK").begins_with("SESSION#"),
        )
        return [self._from_item(i) for i in resp.get("Items", [])]

    async def list_recent(self, limit: int = 3) -> list[SessionModel]:
        table = _get_table()
        # Scan for sessions by key pattern, sort by started_at descending
        filter_expr = Attr("SK").begins_with("SESSION#") & Attr("PK").begins_with("WS#")
        resp = await _scan(table, FilterExpression=filter_expr)
        items = resp.get("Items", [])
        while "LastEvaluatedKey" in resp:
            resp = await _scan(table,
                FilterExpression=filter_expr,
                ExclusiveStartKey=resp["LastEvaluatedKey"],
            )
            items.extend(resp.get("Items", []))
        sessions = [self._from_item(i) for i in items]
        sessions.sort(key=lambda s: s.started_at, reverse=True)
        return sessions[:limit]

    async def get_by_id(self, session_id: str) -> SessionModel | None:
        table = _get_table()
        resp = _scan(table,
            FilterExpression=Attr("SK").eq(f"SESSION#{session_id}") & Attr("PK").begins_with("WS#"),
        )
        items = resp.get("Items", [])
        if not items:
            return None
        return self._from_item(items[0])

    async def create(self, session: SessionModel) -> SessionModel:
        table = _get_table()
        await _put_item(table, Item=self._to_item(session))
        logger.info("session_created_dynamo", session_id=session.id)
        return session

    async def get_transcript(self, session_id: str) -> list[TranscriptEntryModel]:
        table = _get_table()
        resp = await _query(table,
            KeyConditionExpression=Key("PK").eq(f"SESSION#{session_id}") & Key("SK").begins_with("TRANSCRIPT#"),
        )
        items = resp.get("Items", [])
        entries = []
        for item in _desanitize_from_dynamo(items):
            entries.append(TranscriptEntryModel(
                id=item.get("id", ""),
                role=item.get("role", ""),
                text=item.get("text", ""),
                timestamp=item.get("timestamp", 0.0),
                document_ref=item.get("document_ref"),
                tool_call=item.get("tool_call"),
            ))
        entries.sort(key=lambda e: e.timestamp)
        return entries

    async def add_transcript_entry(self, session_id: str, entry: TranscriptEntryModel) -> None:
        table = _get_table()
        await _put_item(table, Item=_sanitize_for_dynamo({
            "PK": f"SESSION#{session_id}",
            "SK": f"TRANSCRIPT#{entry.id}",
            "entity_type": "TRANSCRIPT",
            "id": entry.id,
            "session_id": session_id,
            "role": entry.role,
            "text": entry.text,
            "timestamp": entry.timestamp,
            "document_ref": entry.document_ref,
            "tool_call": entry.tool_call,
        }))


# ---------------------------------------------------------------------------
# Finding
# ---------------------------------------------------------------------------

class DynamoDBFindingRepository:
    """Compatible with agent's dynamo.py key schema:
    PK=SESSION#{session_id}, SK=FINDING#{index}
    """

    def _to_item(self, finding: FindingModel) -> dict:
        # Extract finding index from id (format: find-{session_id}-{index})
        parts = finding.id.rsplit("-", 1)
        finding_index = parts[-1] if len(parts) > 1 else finding.id
        return _sanitize_for_dynamo({
            "PK": f"SESSION#{finding.session_id}",
            "SK": f"FINDING#{finding_index}",
            "entity_type": "FINDING",
            "id": finding.id,
            "session_id": finding.session_id,
            "workspace_id": finding.workspace_id,
            "type": finding.type,
            "severity": finding.severity,
            "title": finding.title,
            "description": finding.description,
            "document_refs": finding.document_refs,
            "field_refs": finding.field_refs,
            "confidence": finding.confidence,
            "created_at": finding.created_at,
        })

    def _from_item(self, item: dict) -> FindingModel:
        item = _desanitize_from_dynamo(item)
        return FindingModel(
            id=item.get("id", ""),
            session_id=item.get("session_id", ""),
            workspace_id=item.get("workspace_id", ""),
            type=item.get("type", "anomaly"),
            severity=item.get("severity", "medium"),
            title=item.get("title", ""),
            description=item.get("description", ""),
            document_refs=item.get("document_refs", []),
            field_refs=item.get("field_refs", []),
            confidence=item.get("confidence", 0.0),
            created_at=item.get("created_at", ""),
        )

    async def list_by_workspace(self, workspace_id: str) -> list[FindingModel]:
        table = _get_table()
        # Findings are keyed by session, so filter by workspace_id attribute + SK pattern
        filter_expr = Attr("SK").begins_with("FINDING#") & Attr("workspace_id").eq(workspace_id)
        resp = await _scan(table, FilterExpression=filter_expr)
        items = resp.get("Items", [])
        while "LastEvaluatedKey" in resp:
            resp = await _scan(table,
                FilterExpression=filter_expr,
                ExclusiveStartKey=resp["LastEvaluatedKey"],
            )
            items.extend(resp.get("Items", []))
        return [self._from_item(i) for i in items]

    async def create(self, finding: FindingModel) -> FindingModel:
        table = _get_table()
        await _put_item(table, Item=self._to_item(finding))
        logger.info("finding_created_dynamo", finding_id=finding.id)
        return finding
