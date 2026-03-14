from app.models.finding import FindingModel
from app.repositories.protocols import FindingRepository


class FindingService:
    def __init__(self, finding_repo: FindingRepository) -> None:
        self._finding_repo = finding_repo

    async def list_by_workspace(self, workspace_id: str) -> list[FindingModel]:
        return await self._finding_repo.list_by_workspace(workspace_id)

    async def create_finding(self, finding: FindingModel) -> FindingModel:
        return await self._finding_repo.create(finding)
