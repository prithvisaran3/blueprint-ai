"""Execution endpoints: detail, logs, and the SSE live stream."""

from __future__ import annotations

import uuid
from collections.abc import AsyncIterator

from fastapi import APIRouter, Query, Request
from sse_starlette.sse import EventSourceResponse

from app.core.deps import CurrentUser, ExecutionServiceDep, SettingsDep, resolve_sse_user
from app.schemas.common import SSEEvent
from app.schemas.run import ExecutionLogRead, ExecutionRead

router = APIRouter(prefix="/executions", tags=["executions"])


@router.get("/{run_id}", response_model=ExecutionRead)
def get_execution(
    run_id: uuid.UUID,
    current: CurrentUser,
    service: ExecutionServiceDep,
) -> ExecutionRead:
    """Return the run plus all agent outputs and the health score."""
    return service.get_execution(current, run_id)


@router.get("/{run_id}/logs", response_model=list[ExecutionLogRead])
def get_execution_logs(
    run_id: uuid.UUID,
    current: CurrentUser,
    service: ExecutionServiceDep,
) -> list[ExecutionLogRead]:
    return service.get_logs(current, run_id)


@router.get("/{run_id}/stream", summary="SSE live agent stream")
async def stream_execution(
    run_id: uuid.UUID,
    request: Request,
    settings: SettingsDep,
    service: ExecutionServiceDep,
    access_token: str | None = Query(default=None),
) -> EventSourceResponse:
    """Stream agent progress as Server-Sent Events.

    Event types: ``agent_started``, ``agent_token``, ``agent_completed``,
    ``run_completed``, ``error`` with envelope ``{type, agent, run_id, payload, ts}``.

    Runs the live LangGraph + Gemini pipeline for a queued run; replays persisted
    outputs for a finished run. Auth via ``Authorization`` header or the
    ``access_token`` query param (the latter for ``EventSource`` clients).
    """
    current = resolve_sse_user(request, settings, access_token)

    async def event_publisher() -> AsyncIterator[dict[str, str]]:
        try:
            async for event in service.stream_events(current, run_id):
                if await request.is_disconnected():
                    break
                yield {
                    "event": event.type,
                    "data": event.model_dump_json(),
                }
        except Exception as exc:  # pragma: no cover - defensive stream guard
            error_event = SSEEvent(
                type="error", run_id=str(run_id), payload={"message": str(exc)}
            )
            yield {"event": "error", "data": error_event.model_dump_json()}

    return EventSourceResponse(event_publisher())
