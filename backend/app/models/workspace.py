from dataclasses import dataclass, field


@dataclass
class WorkspaceModel:
    id: str
    name: str
    domain: str
    status: str = "setup"
    document_count: int = 0
    session_count: int = 0
    finding_count: int = 0
    phone_number: str | None = None
    last_call_at: str | None = None
    minutes_used: float = 0.0
    created_at: str = ""
    updated_at: str = ""
