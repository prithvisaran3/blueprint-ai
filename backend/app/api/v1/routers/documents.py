"""Documents endpoint — generated documents for a run."""

from __future__ import annotations

import uuid

from fastapi import APIRouter

from app.core.deps import CurrentUser, ExecutionServiceDep
from app.schemas.document import GeneratedDocumentRead

router = APIRouter(prefix="/documents", tags=["documents"])


@router.get("/{run_id}", response_model=list[GeneratedDocumentRead])
def get_documents(
    run_id: uuid.UUID,
    current: CurrentUser,
    service: ExecutionServiceDep,
) -> list[GeneratedDocumentRead]:
    return service.get_documents(current, run_id)
