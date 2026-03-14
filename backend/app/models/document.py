from dataclasses import dataclass, field


@dataclass
class ExtractedFieldModel:
    key: str
    value: str
    source: str
    confidence: float
    is_anomaly: bool = False
    anomaly_reason: str | None = None


@dataclass
class DocumentModel:
    id: str
    workspace_id: str
    filename: str
    document_type: str
    status: str = "uploading"
    s3_key: str = ""
    size_bytes: int = 0
    size_tokens: int = 0
    raw_text: str = ""
    extracted_fields: list[ExtractedFieldModel] = field(default_factory=list)
    summary: str = ""
    processing_error: str | None = None
    rejection_reason: str | None = None
    is_referenced: bool = False
    created_at: str = ""
