from dataclasses import asdict

from fastapi import APIRouter, Depends, HTTPException, Query

from app.api.deps import get_session_service
from app.schemas.common import ApiResponse
from app.schemas.session import SessionResponse, TranscriptEntryResponse
from app.services.session_service import SessionService

router = APIRouter()


# /sessions/recent must be before /sessions/{session_id} to avoid path conflict
@router.get(
    "/sessions/recent",
    response_model=ApiResponse[list[SessionResponse]],
)
async def get_recent_sessions(
    limit: int = Query(default=3, le=20),
    service: SessionService = Depends(get_session_service),
) -> ApiResponse[list[SessionResponse]]:
    sessions = await service.list_recent(limit=limit)
    return ApiResponse(
        data=[SessionResponse(**asdict(s)) for s in sessions],
    )


@router.get(
    "/sessions/{session_id}",
    response_model=ApiResponse[SessionResponse],
)
async def get_session(
    session_id: str,
    service: SessionService = Depends(get_session_service),
) -> ApiResponse[SessionResponse]:
    session = await service.get_session(session_id)
    if session is None:
        raise HTTPException(status_code=404, detail="Session not found")
    return ApiResponse(data=SessionResponse(**asdict(session)))


@router.get(
    "/workspaces/{workspace_id}/sessions",
    response_model=ApiResponse[list[SessionResponse]],
)
async def list_sessions(
    workspace_id: str,
    service: SessionService = Depends(get_session_service),
) -> ApiResponse[list[SessionResponse]]:
    sessions = await service.list_by_workspace(workspace_id)
    return ApiResponse(
        data=[SessionResponse(**asdict(s)) for s in sessions],
    )


@router.get(
    "/sessions/{session_id}/transcript",
    response_model=ApiResponse[list[TranscriptEntryResponse]],
)
async def get_transcript(
    session_id: str,
    service: SessionService = Depends(get_session_service),
) -> ApiResponse[list[TranscriptEntryResponse]]:
    entries = await service.get_transcript(session_id)
    return ApiResponse(
        data=[TranscriptEntryResponse(**asdict(e)) for e in entries],
    )
