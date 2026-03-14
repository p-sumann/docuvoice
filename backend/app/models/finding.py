from dataclasses import dataclass, field


@dataclass
class FindingModel:
    id: str
    session_id: str
    workspace_id: str
    type: str
    severity: str
    title: str
    description: str
    document_refs: list[str] = field(default_factory=list)
    field_refs: list[str] = field(default_factory=list)
    confidence: float = 0.0
    created_at: str = ""
