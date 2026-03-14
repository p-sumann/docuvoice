from fastapi import APIRouter, Depends

from app.api.auth import require_api_key
from app.api.v1 import context, documents, findings, health, livekit, sessions, settings, workspaces

v1_router = APIRouter()

# Public
v1_router.include_router(health.router, tags=["health"])

# Protected — require API key when configured
_auth = [Depends(require_api_key)]
v1_router.include_router(workspaces.router, tags=["workspaces"], dependencies=_auth)
v1_router.include_router(documents.router, tags=["documents"], dependencies=_auth)
v1_router.include_router(sessions.router, tags=["sessions"], dependencies=_auth)
v1_router.include_router(findings.router, tags=["findings"], dependencies=_auth)
v1_router.include_router(livekit.router, tags=["livekit"], dependencies=_auth)
v1_router.include_router(context.router, tags=["context"], dependencies=_auth)
v1_router.include_router(settings.router, tags=["settings"], dependencies=_auth)
