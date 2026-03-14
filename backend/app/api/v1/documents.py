from dataclasses import asdict

from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile

from app.api.deps import get_document_service
from app.schemas.common import ApiResponse
from app.schemas.document import DocumentResponse, ExtractedFieldResponse
from app.services.document_service import DocumentService

router = APIRouter()

MAX_FILE_SIZE_MB = 50
MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024
ALLOWED_CONTENT_TYPES = {
    "application/pdf",
    "image/png",
    "image/jpeg",
    "image/tiff",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",  # .docx
}


@router.get(
    "/workspaces/{workspace_id}/documents",
    response_model=ApiResponse[list[DocumentResponse]],
)
async def list_documents(
    workspace_id: str,
    service: DocumentService = Depends(get_document_service),
) -> ApiResponse[list[DocumentResponse]]:
    docs = await service.list_by_workspace(workspace_id)
    return ApiResponse(
        data=[DocumentResponse(**asdict(d)) for d in docs],
    )


@router.get(
    "/workspaces/{workspace_id}/extracted-fields",
    response_model=ApiResponse[list[ExtractedFieldResponse]],
)
async def get_workspace_extracted_fields(
    workspace_id: str,
    service: DocumentService = Depends(get_document_service),
) -> ApiResponse[list[ExtractedFieldResponse]]:
    docs = await service.list_by_workspace(workspace_id)
    all_fields: list[ExtractedFieldResponse] = []
    for doc in docs:
        for f in doc.extracted_fields:
            all_fields.append(ExtractedFieldResponse(**asdict(f)))
    return ApiResponse(data=all_fields)


@router.post(
    "/workspaces/{workspace_id}/documents/upload",
    response_model=ApiResponse[DocumentResponse],
    status_code=201,
)
async def upload_document(
    workspace_id: str,
    file: UploadFile = File(...),
    document_type: str = Form("auto"),
    service: DocumentService = Depends(get_document_service),
) -> ApiResponse[DocumentResponse]:
    # Validate content type
    if file.content_type and file.content_type not in ALLOWED_CONTENT_TYPES:
        raise HTTPException(
            status_code=415,
            detail=f"Unsupported file type: {file.content_type}. Allowed: PDF, PNG, JPEG, TIFF, DOCX.",
        )

    content = await file.read()

    # Validate file size
    if len(content) > MAX_FILE_SIZE_BYTES:
        raise HTTPException(
            status_code=413,
            detail=f"File too large. Maximum size is {MAX_FILE_SIZE_MB}MB.",
        )

    filename = file.filename or "unknown"

    _upload_url, doc = await service.create_upload(
        workspace_id=workspace_id,
        filename=filename,
        document_type=document_type,
        content=content,
    )

    return ApiResponse(
        data=DocumentResponse(**asdict(doc)),
    )
