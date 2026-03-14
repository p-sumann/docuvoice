from app.schemas.common import CamelCaseModel


class ModelConfigResponse(CamelCaseModel):
    temperature: float
    tonality: str
    system_prompt: str
    persona: str
    max_tokens: int


class ModelConfigUpdate(CamelCaseModel):
    temperature: float | None = None
    tonality: str | None = None
    system_prompt: str | None = None
    persona: str | None = None
    max_tokens: int | None = None
