from dataclasses import asdict

from fastapi import APIRouter, Depends

from app.api.deps import get_settings_service
from app.schemas.common import ApiResponse
from app.schemas.settings import ModelConfigResponse, ModelConfigUpdate
from app.services.settings_service import SettingsService

router = APIRouter()


@router.get("/settings/model", response_model=ApiResponse[ModelConfigResponse])
async def get_model_config(
    service: SettingsService = Depends(get_settings_service),
) -> ApiResponse[ModelConfigResponse]:
    config = await service.get_model_config()
    return ApiResponse(data=ModelConfigResponse(**asdict(config)))


@router.patch("/settings/model", response_model=ApiResponse[ModelConfigResponse])
async def update_model_config(
    payload: ModelConfigUpdate,
    service: SettingsService = Depends(get_settings_service),
) -> ApiResponse[ModelConfigResponse]:
    updates = payload.model_dump(exclude_none=True)
    config = await service.update_model_config(updates)
    return ApiResponse(data=ModelConfigResponse(**asdict(config)))
