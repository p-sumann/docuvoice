from app.models.session import SessionModel, TranscriptEntryModel
from app.repositories.protocols import SessionRepository


class SessionService:
    def __init__(self, session_repo: SessionRepository) -> None:
        self._session_repo = session_repo

    async def list_by_workspace(self, workspace_id: str) -> list[SessionModel]:
        return await self._session_repo.list_by_workspace(workspace_id)

    async def get_session(self, session_id: str) -> SessionModel | None:
        return await self._session_repo.get_by_id(session_id)

    async def list_recent(self, limit: int = 3) -> list[SessionModel]:
        return await self._session_repo.list_recent(limit=limit)

    async def get_transcript(self, session_id: str) -> list[TranscriptEntryModel]:
        return await self._session_repo.get_transcript(session_id)
