from fastapi import APIRouter, Depends

from app.api.deps import get_livekit_service
from app.schemas.common import ApiResponse
from app.schemas.livekit import LiveKitTokenRequest, LiveKitTokenResponse
from app.services.livekit_service import LiveKitService

router = APIRouter()


@router.post("/livekit/token", response_model=ApiResponse[LiveKitTokenResponse])
async def generate_token(
    payload: LiveKitTokenRequest,
    service: LiveKitService = Depends(get_livekit_service),
) -> ApiResponse[LiveKitTokenResponse]:
    token, server_url = await service.generate_token(
        workspace_id=payload.workspace_id,
        participant_name=payload.participant_name,
        workspace_name=payload.workspace_name,
        domain=payload.domain,
    )
    return ApiResponse(data=LiveKitTokenResponse(token=token, server_url=server_url))
