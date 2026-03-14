from pydantic import BaseModel, Field


class FindingRecord(BaseModel):
    """In-session finding record. Matches frontend Finding type and backend FindingModel."""

    index: int
    type: str  # discrepancy, anomaly, exposure, missing, red_flag
    severity: str  # critical, high, medium, low, info
    title: str
    description: str
    document_refs: list[str] = Field(default_factory=list)
    field_refs: list[str] = Field(default_factory=list)
    confidence: float = 0.0

    def to_dynamo_dict(self) -> dict:
        return {
            "type": self.type,
            "severity": self.severity,
            "title": self.title,
            "description": self.description,
            "document_refs": self.document_refs,
            "field_refs": self.field_refs,
            "confidence": str(self.confidence),
        }


class SessionMemory(BaseModel):
    """In-session memory passed as AgentSession userdata."""

    workspace_id: str
    session_id: str
    workspace_name: str = ""
    domain_type: str = "insurance_claims"
    context_text: str = ""           # Lean context (fields + summaries) — used by most tools
    full_context_text: str = ""      # Full context (fields + raw text) — used by search_documents
    findings: list[FindingRecord] = Field(default_factory=list)
    referenced_documents: set[str] = Field(default_factory=set)
    tool_call_count: int = 0

    def add_finding(self, finding: FindingRecord) -> None:
        self.findings.append(finding)

    def next_finding_index(self) -> int:
        return len(self.findings)

    def record_tool_call(self) -> None:
        self.tool_call_count += 1

    def add_document_ref(self, doc_name: str) -> None:
        self.referenced_documents.add(doc_name)
