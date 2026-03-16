import asyncio
from dataclasses import asdict

from fastapi import APIRouter, Depends, HTTPException

from app.api.deps import get_workspace_service
from app.schemas.common import ApiResponse
from app.schemas.workspace import (
    PreparationStatusResponse,
    SuggestedQuestionResponse,
    WorkspaceCreate,
    WorkspaceResponse,
    WorkspaceStatsResponse,
)
from app.services.workspace_service import WorkspaceService

router = APIRouter()


@router.get("/workspaces", response_model=ApiResponse[list[WorkspaceResponse]])
async def list_workspaces(
    service: WorkspaceService = Depends(get_workspace_service),
) -> ApiResponse[list[WorkspaceResponse]]:
    workspaces = await service.list_workspaces()
    return ApiResponse(
        data=[WorkspaceResponse(**asdict(ws)) for ws in workspaces],
    )


@router.post(
    "/workspaces",
    response_model=ApiResponse[WorkspaceResponse],
    status_code=201,
)
async def create_workspace(
    payload: WorkspaceCreate,
    service: WorkspaceService = Depends(get_workspace_service),
) -> ApiResponse[WorkspaceResponse]:
    ws = await service.create_workspace(name=payload.name, domain=payload.domain)
    return ApiResponse(data=WorkspaceResponse(**asdict(ws)))


@router.delete("/workspaces", status_code=200)
async def delete_all_workspaces(
    service: WorkspaceService = Depends(get_workspace_service),
) -> ApiResponse[dict]:
    count = await service.delete_all_workspaces()
    return ApiResponse(data={"deleted": count})


@router.delete("/workspaces/{workspace_id}", status_code=204)
async def delete_workspace(
    workspace_id: str,
    service: WorkspaceService = Depends(get_workspace_service),
) -> None:
    ws = await service.get_workspace(workspace_id)
    if ws is None:
        raise HTTPException(status_code=404, detail="Workspace not found")
    await service.delete_workspace(workspace_id)


# Global stats — must be before /{workspace_id} to avoid path conflict
@router.get("/workspaces/stats", response_model=ApiResponse[WorkspaceStatsResponse])
async def get_global_stats(
    service: WorkspaceService = Depends(get_workspace_service),
) -> ApiResponse[WorkspaceStatsResponse]:
    stats = await service.get_stats()
    return ApiResponse(data=WorkspaceStatsResponse(**stats))


@router.get("/workspaces/{workspace_id}", response_model=ApiResponse[WorkspaceResponse])
async def get_workspace(
    workspace_id: str,
    service: WorkspaceService = Depends(get_workspace_service),
) -> ApiResponse[WorkspaceResponse]:
    ws = await service.get_workspace(workspace_id)
    if ws is None:
        raise HTTPException(status_code=404, detail="Workspace not found")
    return ApiResponse(data=WorkspaceResponse(**asdict(ws)))


@router.get(
    "/workspaces/{workspace_id}/stats",
    response_model=ApiResponse[WorkspaceStatsResponse],
)
async def get_workspace_stats(
    workspace_id: str,
    service: WorkspaceService = Depends(get_workspace_service),
) -> ApiResponse[WorkspaceStatsResponse]:
    stats = await service.get_stats()
    return ApiResponse(data=WorkspaceStatsResponse(**stats))


@router.post(
    "/workspaces/{workspace_id}/prepare",
    status_code=202,
)
async def prepare_workspace(
    workspace_id: str,
    service: WorkspaceService = Depends(get_workspace_service),
) -> ApiResponse[PreparationStatusResponse]:
    ws = await service.get_workspace(workspace_id)
    if ws is None:
        raise HTTPException(status_code=404, detail="Workspace not found")
    # Run as async task — doesn't block the event loop because
    # document processing uses asyncio.to_thread for CPU-bound work
    asyncio.create_task(service.prepare_workspace(workspace_id))
    return ApiResponse(
        data=PreparationStatusResponse(step="extracting_text", progress=0),
    )


@router.get(
    "/workspaces/{workspace_id}/preparation-status",
    response_model=ApiResponse[PreparationStatusResponse],
)
async def get_preparation_status(
    workspace_id: str,
    service: WorkspaceService = Depends(get_workspace_service),
) -> ApiResponse[PreparationStatusResponse]:
    status = service.get_preparation_status(workspace_id)
    return ApiResponse(
        data=PreparationStatusResponse(
            step=str(status["step"]),
            progress=int(status["progress"]),
            rejected_count=int(status.get("rejected_count", 0)),
        ),
    )


@router.get(
    "/workspaces/{workspace_id}/suggested-questions",
    response_model=ApiResponse[list[SuggestedQuestionResponse]],
)
async def get_suggested_questions(
    workspace_id: str,
    service: WorkspaceService = Depends(get_workspace_service),
) -> ApiResponse[list[SuggestedQuestionResponse]]:
    ws = await service.get_workspace(workspace_id)
    if ws is None:
        raise HTTPException(status_code=404, detail="Workspace not found")
    questions = service.get_suggested_questions(ws.domain)
    return ApiResponse(data=[SuggestedQuestionResponse(**q) for q in questions])
