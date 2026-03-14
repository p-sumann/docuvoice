from app.schemas.common import CamelCaseModel


class WorkspaceCreate(CamelCaseModel):
    name: str
    domain: str


class WorkspaceResponse(CamelCaseModel):
    id: str
    name: str
    domain: str
    status: str
    document_count: int
    session_count: int
    finding_count: int
    phone_number: str | None
    last_call_at: str | None
    minutes_used: float
    created_at: str
    updated_at: str


class WorkspaceStatsResponse(CamelCaseModel):
    total_workspaces: int
    total_sessions: int
    total_minutes_used: float


class SuggestedQuestionResponse(CamelCaseModel):
    id: str
    text: str
    category: str


class PreparationStatusResponse(CamelCaseModel):
    step: str
    progress: int
    rejected_count: int = 0
