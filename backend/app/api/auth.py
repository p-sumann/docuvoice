from fastapi import Depends, HTTPException, status
from fastapi.security import APIKeyHeader

from app.config import settings

_api_key_header = APIKeyHeader(name="X-API-Key", auto_error=False)


async def require_api_key(api_key: str | None = Depends(_api_key_header)) -> str | None:
    """Validate X-API-Key header. If API_KEY is not configured, auth is disabled (dev mode)."""
    if not settings.api_key:
        return None
    if not api_key or api_key != settings.api_key:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or missing API key",
        )
    return api_key
