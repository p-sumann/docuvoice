import structlog

from app.config import settings
from app.repositories.protocols import (
    DocumentRepository,
    FindingRepository,
    SessionRepository,
    WorkspaceRepository,
)
from app.services.context_service import ContextService
from app.services.document_service import DocumentService
from app.services.finding_service import FindingService
from app.services.livekit_service import LiveKitService
from app.services.session_service import SessionService
from app.services.settings_service import SettingsService
from app.services.workspace_service import WorkspaceService

logger = structlog.get_logger(__name__)


def _create_repositories() -> (
    tuple[WorkspaceRepository, DocumentRepository, SessionRepository, FindingRepository]
):
    if settings.storage_backend == "dynamodb":
        from app.repositories.dynamodb import (
            DynamoDBDocumentRepository,
            DynamoDBFindingRepository,
            DynamoDBSessionRepository,
            DynamoDBWorkspaceRepository,
        )

        logger.info("using_dynamodb_storage", table=settings.dynamodb_table_name)
        return (
            DynamoDBWorkspaceRepository(),
            DynamoDBDocumentRepository(),
            DynamoDBSessionRepository(),
            DynamoDBFindingRepository(),
        )
    else:
        from app.repositories.memory import (
            InMemoryDocumentRepository,
            InMemoryFindingRepository,
            InMemorySessionRepository,
            InMemoryWorkspaceRepository,
        )

        logger.info("using_memory_storage")
        return (
            InMemoryWorkspaceRepository(),
            InMemoryDocumentRepository(),
            InMemorySessionRepository(),
            InMemoryFindingRepository(),
        )


# Create repositories based on config
workspace_repo, document_repo, session_repo, finding_repo = _create_repositories()

# Services wired to repos
document_service = DocumentService(document_repo)
workspace_service = WorkspaceService(workspace_repo, session_repo, document_service, finding_repo)
session_service = SessionService(session_repo)
finding_service = FindingService(finding_repo)
livekit_service = LiveKitService()
context_service = ContextService(document_service)
settings_service = SettingsService()


def get_workspace_service() -> WorkspaceService:
    return workspace_service


def get_document_service() -> DocumentService:
    return document_service


def get_session_service() -> SessionService:
    return session_service


def get_finding_service() -> FindingService:
    return finding_service


def get_livekit_service() -> LiveKitService:
    return livekit_service


def get_context_service() -> ContextService:
    return context_service


def get_settings_service() -> SettingsService:
    return settings_service
