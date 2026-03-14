from datetime import datetime, timezone
from uuid import uuid4

import structlog

from app.models.finding import FindingModel
from app.models.workspace import WorkspaceModel
from app.processing.ai_findings import generate_findings
from app.processing.domain_classifier import classify_documents_batch
from app.repositories.protocols import FindingRepository, WorkspaceRepository, SessionRepository
from app.services.document_service import DocumentService

logger = structlog.get_logger()

# In-memory preparation state: workspace_id -> {"step": str, "progress": int}
_preparation_state: dict[str, dict[str, str | int]] = {}


class WorkspaceService:
    def __init__(
        self,
        workspace_repo: WorkspaceRepository,
        session_repo: SessionRepository,
        document_service: DocumentService | None = None,
        finding_repo: FindingRepository | None = None,
    ) -> None:
        self._workspace_repo = workspace_repo
        self._session_repo = session_repo
        self._document_service = document_service
        self._finding_repo = finding_repo

    async def list_workspaces(self) -> list[WorkspaceModel]:
        return await self._workspace_repo.list_all()

    async def get_workspace(self, workspace_id: str) -> WorkspaceModel | None:
        return await self._workspace_repo.get_by_id(workspace_id)

    async def create_workspace(self, name: str, domain: str) -> WorkspaceModel:
        now = datetime.now(timezone.utc).isoformat()
        workspace = WorkspaceModel(
            id=f"ws-{uuid4().hex[:8]}",
            name=name,
            domain=domain,
            status="setup",
            created_at=now,
            updated_at=now,
        )
        return await self._workspace_repo.create(workspace)

    async def get_stats(self) -> dict[str, int | float]:
        workspaces = await self._workspace_repo.list_all()
        total_sessions = sum(ws.session_count for ws in workspaces)
        total_minutes = sum(ws.minutes_used for ws in workspaces)
        return {
            "total_workspaces": len(workspaces),
            "total_sessions": total_sessions,
            "total_minutes_used": total_minutes,
        }

    @staticmethod
    def get_suggested_questions(domain: str) -> list[dict[str, str]]:
        questions_map: dict[str, list[dict[str, str]]] = {
            "insurance_claims": [
                {"id": "sq-1", "text": "Summarize all findings for this claim", "category": "summary"},
                {"id": "sq-2", "text": "Compare FNOL details with police report", "category": "comparison"},
                {"id": "sq-3", "text": "What are the policy coverage limits?", "category": "analysis"},
                {"id": "sq-4", "text": "Are there any red flags in the medical bills?", "category": "analysis"},
                {"id": "sq-5", "text": "Generate adjuster notes for this claim", "category": "general"},
                {"id": "sq-6", "text": "What additional documents should I request?", "category": "general"},
            ],
            "legal_contracts": [
                {"id": "sq-1", "text": "Summarize the key terms of this contract", "category": "summary"},
                {"id": "sq-2", "text": "Are there any unusual clauses?", "category": "analysis"},
                {"id": "sq-3", "text": "Compare this NDA with standard templates", "category": "comparison"},
                {"id": "sq-4", "text": "What are the termination conditions?", "category": "analysis"},
                {"id": "sq-5", "text": "Identify potential liability risks", "category": "analysis"},
                {"id": "sq-6", "text": "Draft a summary memo for review", "category": "general"},
            ],
            "financial_dd": [
                {"id": "sq-1", "text": "Summarize the financial health indicators", "category": "summary"},
                {"id": "sq-2", "text": "Are there any revenue recognition concerns?", "category": "analysis"},
                {"id": "sq-3", "text": "Compare year-over-year growth trends", "category": "comparison"},
                {"id": "sq-4", "text": "What are the key risk factors?", "category": "analysis"},
                {"id": "sq-5", "text": "Identify any off-balance-sheet liabilities", "category": "analysis"},
                {"id": "sq-6", "text": "Generate an executive summary", "category": "general"},
            ],
        }
        return questions_map.get(domain, [
            {"id": "sq-1", "text": "Summarize the uploaded documents", "category": "summary"},
            {"id": "sq-2", "text": "Are there any discrepancies across documents?", "category": "analysis"},
            {"id": "sq-3", "text": "What are the key findings?", "category": "analysis"},
            {"id": "sq-4", "text": "Generate a summary report", "category": "general"},
        ])

    async def prepare_workspace(self, workspace_id: str) -> None:
        """Run the full preparation pipeline for a workspace.

        1. Extract text from documents (PyMuPDF / Textract)
        2. Validate documents against workspace domain (Nova Lite, batches of 4)
        3. Extract fields from valid documents (Nova Pro)
        4. Generate cross-document findings (Nova Pro)
        5. Finalize workspace

        The frontend polls get_preparation_status() while this runs.
        """
        if self._document_service is None:
            logger.error("prepare_workspace_no_doc_service", workspace_id=workspace_id)
            _preparation_state[workspace_id] = {"step": "complete", "progress": 100}
            return

        ws = await self._workspace_repo.get_by_id(workspace_id)
        domain = ws.domain if ws else "general"

        # ── Step 1: Extract text from all documents ──────────────────
        _preparation_state[workspace_id] = {"step": "extracting_text", "progress": 0}

        docs = await self._document_service.list_by_workspace(workspace_id)
        total = len(docs) if docs else 1

        for i, doc in enumerate(docs):
            logger.info("extracting_text", doc_id=doc.id, filename=doc.filename)
            await self._document_service.extract_text(doc.id)
            progress = int(((i + 1) / total) * 100)
            _preparation_state[workspace_id] = {
                "step": "extracting_text",
                "progress": progress,
            }

        # ── Step 2: Domain validation (Nova Lite, batches of 4) ──────
        # Skip classification for generic domains — they accept anything
        _SKIP_CLASSIFICATION_DOMAINS = {"general"}

        rejected_ids: set[str] = set()

        if domain not in _SKIP_CLASSIFICATION_DOMAINS:
            _preparation_state[workspace_id] = {"step": "validating_documents", "progress": 0}

            # Re-fetch docs to get raw_text populated from step 1
            docs = await self._document_service.list_by_workspace(workspace_id)
            doc_texts = [(doc.id, doc.raw_text) for doc in docs if doc.status != "error"]

            classification_results = await classify_documents_batch(
                doc_texts, domain, batch_size=4,
            )

            for doc_id, result in classification_results:
                if not result.belongs_to_domain and result.confidence >= 0.7:
                    rejected_ids.add(doc_id)
                    await self._document_service.reject_document(
                        doc_id,
                        reason=f"Not relevant to {domain} domain. "
                        f"Detected as: {result.detected_category}. {result.reason}",
                    )
                    logger.info(
                        "document_rejected",
                        doc_id=doc_id,
                        detected=result.detected_category,
                        confidence=result.confidence,
                    )

            _preparation_state[workspace_id] = {
                "step": "validating_documents",
                "progress": 100,
                "rejected_count": len(rejected_ids),
            }
        else:
            logger.info(
                "skipping_domain_classification",
                workspace_id=workspace_id,
                domain=domain,
            )
            # Re-fetch docs for next step
            docs = await self._document_service.list_by_workspace(workspace_id)

        n_rejected = len(rejected_ids)
        valid_docs = [d for d in docs if d.id not in rejected_ids and d.status != "error"]

        if not valid_docs:
            logger.warning("no_valid_documents", workspace_id=workspace_id)
            _preparation_state[workspace_id] = {
                "step": "all_rejected", "progress": 100, "rejected_count": n_rejected,
            }
            if ws:
                ws.status = "setup"
                ws.document_count = 0
                ws.finding_count = 0
                ws.updated_at = datetime.now(timezone.utc).isoformat()
                await self._workspace_repo.update(ws)
            return

        # ── Step 3: AI field extraction for valid documents ──────────
        _preparation_state[workspace_id] = {
            "step": "extracting_fields", "progress": 0, "rejected_count": n_rejected,
        }

        for i, doc in enumerate(valid_docs):
            logger.info("extracting_fields", doc_id=doc.id, filename=doc.filename)
            await self._document_service.extract_fields(doc.id)
            progress = int(((i + 1) / len(valid_docs)) * 100)
            _preparation_state[workspace_id] = {
                "step": "extracting_fields",
                "progress": progress,
                "rejected_count": n_rejected,
            }

        # ── Step 4: Generate cross-document findings ─────────────────
        _preparation_state[workspace_id] = {
            "step": "generating_findings", "progress": 0, "rejected_count": n_rejected,
        }

        processed_docs = await self._document_service.list_by_workspace(workspace_id)
        # Only include ready docs for findings
        ready_docs = [d for d in processed_docs if d.status == "ready"]

        finding_items = await generate_findings(ready_docs, domain)

        if self._finding_repo and finding_items:
            now = datetime.now(timezone.utc).isoformat()
            for item in finding_items:
                finding = FindingModel(
                    id=f"find-{uuid4().hex[:8]}",
                    session_id="preparation",
                    workspace_id=workspace_id,
                    type=item.type,
                    severity=item.severity,
                    title=item.title,
                    description=item.description,
                    document_refs=item.document_refs,
                    field_refs=item.field_refs,
                    confidence=item.confidence,
                    created_at=now,
                )
                await self._finding_repo.create(finding)

            logger.info(
                "findings_persisted",
                workspace_id=workspace_id,
                count=len(finding_items),
            )

        _preparation_state[workspace_id] = {
            "step": "generating_findings", "progress": 100, "rejected_count": n_rejected,
        }

        # ── Step 5: Finalize ─────────────────────────────────────────
        _preparation_state[workspace_id] = {
            "step": "finalizing", "progress": 50, "rejected_count": n_rejected,
        }

        if ws:
            ws.status = "ready"
            ws.document_count = len(ready_docs)
            ws.finding_count = len(finding_items)
            ws.updated_at = datetime.now(timezone.utc).isoformat()
            await self._workspace_repo.update(ws)

        _preparation_state[workspace_id] = {
            "step": "complete", "progress": 100, "rejected_count": n_rejected,
        }
        logger.info("workspace_ready", workspace_id=workspace_id)

    @staticmethod
    def get_preparation_status(workspace_id: str) -> dict[str, str | int]:
        return _preparation_state.get(
            workspace_id,
            {"step": "idle", "progress": 0},
        )
