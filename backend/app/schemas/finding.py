from app.schemas.common import CamelCaseModel


class FindingResponse(CamelCaseModel):
    id: str
    session_id: str
    workspace_id: str
    type: str
    severity: str
    title: str
    description: str
    document_refs: list[str]
    field_refs: list[str]
    confidence: float
    created_at: str
