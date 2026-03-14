from app.models.document import DocumentModel
from app.models.finding import FindingModel
from app.models.session import SessionModel, TranscriptEntryModel
from app.models.workspace import WorkspaceModel


class InMemoryWorkspaceRepository:
    def __init__(self) -> None:
        self._store: dict[str, WorkspaceModel] = {}

    async def list_all(self) -> list[WorkspaceModel]:
        return list(self._store.values())

    async def get_by_id(self, workspace_id: str) -> WorkspaceModel | None:
        return self._store.get(workspace_id)

    async def create(self, workspace: WorkspaceModel) -> WorkspaceModel:
        self._store[workspace.id] = workspace
        return workspace

    async def update(self, workspace: WorkspaceModel) -> WorkspaceModel:
        self._store[workspace.id] = workspace
        return workspace

    async def delete(self, workspace_id: str) -> None:
        self._store.pop(workspace_id, None)


class InMemoryDocumentRepository:
    def __init__(self) -> None:
        self._store: dict[str, DocumentModel] = {}

    async def list_by_workspace(self, workspace_id: str) -> list[DocumentModel]:
        return [d for d in self._store.values() if d.workspace_id == workspace_id]

    async def get_by_id(self, doc_id: str) -> DocumentModel | None:
        return self._store.get(doc_id)

    async def create(self, document: DocumentModel) -> DocumentModel:
        self._store[document.id] = document
        return document

    async def update(self, document: DocumentModel) -> DocumentModel:
        self._store[document.id] = document
        return document

    async def delete(self, doc_id: str) -> None:
        self._store.pop(doc_id, None)


class InMemorySessionRepository:
    def __init__(self) -> None:
        self._store: dict[str, SessionModel] = {}
        self._transcripts: dict[str, list[TranscriptEntryModel]] = {}

    async def list_by_workspace(self, workspace_id: str) -> list[SessionModel]:
        return [s for s in self._store.values() if s.workspace_id == workspace_id]

    async def get_by_id(self, session_id: str) -> SessionModel | None:
        return self._store.get(session_id)

    async def create(self, session: SessionModel) -> SessionModel:
        self._store[session.id] = session
        return session

    async def list_recent(self, limit: int = 3) -> list[SessionModel]:
        sessions = sorted(
            self._store.values(),
            key=lambda s: s.started_at,
            reverse=True,
        )
        return sessions[:limit]

    async def get_transcript(self, session_id: str) -> list[TranscriptEntryModel]:
        return self._transcripts.get(session_id, [])

    async def add_transcript_entry(
        self, session_id: str, entry: TranscriptEntryModel
    ) -> None:
        if session_id not in self._transcripts:
            self._transcripts[session_id] = []
        self._transcripts[session_id].append(entry)


class InMemoryFindingRepository:
    def __init__(self) -> None:
        self._store: dict[str, FindingModel] = {}

    async def list_by_workspace(self, workspace_id: str) -> list[FindingModel]:
        return [f for f in self._store.values() if f.workspace_id == workspace_id]

    async def create(self, finding: FindingModel) -> FindingModel:
        self._store[finding.id] = finding
        return finding
