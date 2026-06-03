"""History endpoint — recent runs across a user's projects (dashboard)."""

from __future__ import annotations

from fastapi import APIRouter, Query

from app.core.deps import CurrentUser, ExecutionServiceDep
from app.schemas.common import Page
from app.schemas.run import AgentRunRead

router = APIRouter(tags=["history"])


@router.get("/history", response_model=Page[AgentRunRead])
def get_history(
    current: CurrentUser,
    service: ExecutionServiceDep,
    limit: int = Query(default=20, ge=1, le=100),
    offset: int = Query(default=0, ge=0),
) -> Page[AgentRunRead]:
    items, total = service.history(current, limit, offset)
    return Page(items=items, total=total, limit=limit, offset=offset)
