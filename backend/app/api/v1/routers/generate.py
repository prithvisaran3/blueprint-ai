"""Generate endpoint — creates a run and kicks off the (stubbed) pipeline."""

from __future__ import annotations

from fastapi import APIRouter, status

from app.core.deps import CurrentUser, ExecutionServiceDep
from app.schemas.run import GenerateRequest, GenerateResponse

router = APIRouter(tags=["generate"])


@router.post("/generate", response_model=GenerateResponse, status_code=status.HTTP_201_CREATED)
def generate(
    payload: GenerateRequest,
    current: CurrentUser,
    service: ExecutionServiceDep,
) -> GenerateResponse:
    """Create a *queued* run for a project (or a new project from ``idea_prompt``).

    The LangGraph + Gemini pipeline runs live when the client connects to
    ``GET /executions/{run_id}/stream``, streaming agent events over SSE.
    """
    run = service.create_run(current, payload)
    return GenerateResponse(run_id=run.id, project_id=run.project_id, status=run.status)
