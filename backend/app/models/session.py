from dataclasses import dataclass


@dataclass
class TranscriptEntryModel:
    id: str
    role: str
    text: str
    timestamp: float
    document_ref: str | None = None
    tool_call: str | None = None


@dataclass
class SessionModel:
    id: str
    workspace_id: str
    channel: str
    caller_id: str | None = None
    started_at: str = ""
    ended_at: str | None = None
    duration_seconds: int = 0
    finding_count: int = 0
    transcript_url: str | None = None
