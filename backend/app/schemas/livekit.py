from app.schemas.common import CamelCaseModel


class LiveKitTokenRequest(CamelCaseModel):
    workspace_id: str
    participant_name: str = "user"
    workspace_name: str = ""
    domain: str = "insurance_claims"


class LiveKitTokenResponse(CamelCaseModel):
    token: str
    server_url: str
