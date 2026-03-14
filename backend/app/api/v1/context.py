from fastapi import APIRouter, Depends
from fastapi.responses import JSONResponse

from app.api.deps import get_context_service
from app.services.context_service import ContextService

router = APIRouter()


@router.get(
    "/workspaces/{workspace_id}/context",
)
async def get_context(
    workspace_id: str,
    service: ContextService = Depends(get_context_service),
) -> JSONResponse:
    """Return two-tier agent context for a workspace (cached).

    Returns JSON with `lean_context` (fields + summaries) and `full_context` (fields + raw text).
    """
    context = await service.get_context(workspace_id)
    return JSONResponse(content=context)


@router.post(
    "/workspaces/{workspace_id}/context/warm",
    status_code=204,
)
async def warm_context(
    workspace_id: str,
    service: ContextService = Depends(get_context_service),
) -> None:
    """Pre-build and cache context. Called by the frontend on workspace page load."""
    await service.warm(workspace_id)
