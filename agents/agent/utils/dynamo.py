from datetime import datetime, timezone

import aioboto3
import structlog
from botocore.exceptions import ClientError
from tenacity import retry, retry_if_exception_type, stop_after_attempt, wait_exponential

from agent.config import get_settings

logger = structlog.get_logger(__name__)

_session: aioboto3.Session | None = None

_dynamo_retry = retry(
    stop=stop_after_attempt(3),
    wait=wait_exponential(multiplier=0.5, min=1, max=5),
    retry=retry_if_exception_type(ClientError),
    before_sleep=lambda rs: logger.warning(
        "dynamodb_retry", attempt=rs.attempt_number, wait=rs.next_action.sleep
    ),
)


def _get_session() -> aioboto3.Session:
    global _session
    if _session is None:
        _session = aioboto3.Session()
    return _session


@_dynamo_retry
async def get_workspace_config(workspace_id: str) -> dict | None:
    """Read workspace record from DynamoDB."""
    settings = get_settings()
    session = _get_session()
    async with session.resource(
        "dynamodb", region_name=settings.aws_default_region
    ) as dynamodb:
        table = await dynamodb.Table(settings.dynamodb_table_name)
        resp = await table.get_item(
            Key={"PK": f"WS#{workspace_id}", "SK": f"WS#{workspace_id}"}
        )
        return resp.get("Item")


@_dynamo_retry
async def list_documents(workspace_id: str) -> list[dict]:
    """List all documents for a workspace."""
    settings = get_settings()
    session = _get_session()
    async with session.resource(
        "dynamodb", region_name=settings.aws_default_region
    ) as dynamodb:
        table = await dynamodb.Table(settings.dynamodb_table_name)
        resp = await table.query(
            KeyConditionExpression="PK = :pk AND begins_with(SK, :sk_prefix)",
            ExpressionAttributeValues={
                ":pk": f"WS#{workspace_id}",
                ":sk_prefix": "DOC#",
            },
        )
        return resp.get("Items", [])


@_dynamo_retry
async def list_findings_for_workspace(workspace_id: str) -> list[dict]:
    """Load all findings for a workspace (from preparation and prior sessions)."""
    settings = get_settings()
    session = _get_session()
    async with session.resource(
        "dynamodb", region_name=settings.aws_default_region
    ) as dynamodb:
        table = await dynamodb.Table(settings.dynamodb_table_name)
        # Findings have PK=SESSION#{session_id}, SK=FINDING#{index}
        # Filter by workspace_id attribute
        resp = await table.scan(
            FilterExpression="begins_with(SK, :sk) AND workspace_id = :ws",
            ExpressionAttributeValues={
                ":sk": "FINDING#",
                ":ws": workspace_id,
            },
        )
        return resp.get("Items", [])


@_dynamo_retry
async def create_session(workspace_id: str, session_id: str, channel: str = "web") -> None:
    """Write a new session record to DynamoDB."""
    settings = get_settings()
    now = datetime.now(timezone.utc).isoformat()
    session = _get_session()
    async with session.resource(
        "dynamodb", region_name=settings.aws_default_region
    ) as dynamodb:
        table = await dynamodb.Table(settings.dynamodb_table_name)
        await table.put_item(
            Item={
                "PK": f"WS#{workspace_id}",
                "SK": f"SESSION#{session_id}",
                "session_id": session_id,
                "workspace_id": workspace_id,
                "channel": channel,
                "started_at": now,
                "ended_at": None,
                "duration_seconds": 0,
                "finding_count": 0,
            }
        )
        logger.info("session_created", session_id=session_id, workspace_id=workspace_id)


@_dynamo_retry
async def create_finding(
    session_id: str,
    workspace_id: str,
    finding_index: int,
    finding_data: dict,
) -> None:
    """Write a finding record to DynamoDB."""
    settings = get_settings()
    now = datetime.now(timezone.utc).isoformat()
    session = _get_session()
    async with session.resource(
        "dynamodb", region_name=settings.aws_default_region
    ) as dynamodb:
        table = await dynamodb.Table(settings.dynamodb_table_name)
        finding_id = f"find-{session_id}-{finding_index}"
        await table.put_item(
            Item={
                "PK": f"SESSION#{session_id}",
                "SK": f"FINDING#{finding_index}",
                "id": finding_id,
                "session_id": session_id,
                "workspace_id": workspace_id,
                "created_at": now,
                **finding_data,
            }
        )
        logger.info("finding_created", finding_id=finding_id, session_id=session_id)


@_dynamo_retry
async def update_session_end(
    workspace_id: str,
    session_id: str,
    duration: int,
    finding_count: int,
) -> None:
    """Update session record with end time and stats, and bump workspace counters."""
    settings = get_settings()
    now = datetime.now(timezone.utc).isoformat()
    minutes = round(duration / 60, 2)
    session = _get_session()
    async with session.resource(
        "dynamodb", region_name=settings.aws_default_region
    ) as dynamodb:
        table = await dynamodb.Table(settings.dynamodb_table_name)

        # Update the session record
        await table.update_item(
            Key={"PK": f"WS#{workspace_id}", "SK": f"SESSION#{session_id}"},
            UpdateExpression=(
                "SET ended_at = :ended, duration_seconds = :dur, finding_count = :fc"
            ),
            ExpressionAttributeValues={
                ":ended": now,
                ":dur": duration,
                ":fc": finding_count,
            },
        )

        # Increment session_count and minutes_used on the workspace record
        from decimal import Decimal

        await table.update_item(
            Key={"PK": f"WS#{workspace_id}", "SK": f"WS#{workspace_id}"},
            UpdateExpression=(
                "SET session_count = if_not_exists(session_count, :zero) + :one, "
                "minutes_used = if_not_exists(minutes_used, :zero_d) + :mins, "
                "updated_at = :now"
            ),
            ExpressionAttributeValues={
                ":one": 1,
                ":zero": 0,
                ":mins": Decimal(str(minutes)),
                ":zero_d": Decimal("0"),
                ":now": now,
            },
        )
        logger.info("session_ended", session_id=session_id, duration=duration, minutes=minutes)
