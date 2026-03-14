from dataclasses import asdict

from fastapi import APIRouter, Depends

from app.api.deps import get_finding_service
from app.schemas.common import ApiResponse
from app.schemas.finding import FindingResponse
from app.services.finding_service import FindingService

router = APIRouter()


@router.get(
    "/workspaces/{workspace_id}/findings",
    response_model=ApiResponse[list[FindingResponse]],
)
async def list_findings(
    workspace_id: str,
    service: FindingService = Depends(get_finding_service),
) -> ApiResponse[list[FindingResponse]]:
    findings = await service.list_by_workspace(workspace_id)
    return ApiResponse(
        data=[FindingResponse(**asdict(f)) for f in findings],
    )
