from app.schemas.common import CamelCaseModel


class SessionResponse(CamelCaseModel):
    id: str
    workspace_id: str
    channel: str
    caller_id: str | None
    started_at: str
    ended_at: str | None
    duration_seconds: int
    finding_count: int
    transcript_url: str | None


class TranscriptEntryResponse(CamelCaseModel):
    id: str
    role: str
    text: str
    timestamp: float
    document_ref: str | None
    tool_call: str | None
