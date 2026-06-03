"""Agents endpoint — re-run a single agent for an existing run."""

from __future__ import annotations

from fastapi import APIRouter

from app.core.deps import CurrentUser, ExecutionServiceDep
from app.schemas.run import AgentOutputRead, AgentRerunRequest

router = APIRouter(prefix="/agents", tags=["agents"])


@router.post("/run", response_model=AgentOutputRead)
def rerun_agent(
    payload: AgentRerunRequest,
    current: CurrentUser,
    service: ExecutionServiceDep,
) -> AgentOutputRead:
    """Re-run a single agent (e.g. to regenerate one workspace tab).

    STUB: regenerates a placeholder output. Phase 5 calls the real agent.
    """
    return service.rerun_agent(current, payload)
