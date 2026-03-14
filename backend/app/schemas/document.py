from app.schemas.common import CamelCaseModel


class ExtractedFieldResponse(CamelCaseModel):
    key: str
    value: str
    source: str
    confidence: float
    is_anomaly: bool
    anomaly_reason: str | None


class DocumentResponse(CamelCaseModel):
    id: str
    workspace_id: str
    filename: str
    document_type: str
    status: str
    s3_key: str
    size_bytes: int
    size_tokens: int
    extracted_fields: list[ExtractedFieldResponse]
    summary: str
    processing_error: str | None
    rejection_reason: str | None
    is_referenced: bool
    created_at: str


