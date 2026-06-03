"""Execution context passed to LangGraph nodes via the run config.

The agents package stays storage-agnostic: the :class:`ExecutionService`
constructs a :class:`PipelineContext` with concrete persistence + emit
callbacks and passes it through ``config["configurable"]["ctx"]``. Nodes use it
to stream SSE events and persist their outputs/logs as they run.
"""

from __future__ import annotations

import asyncio
from collections.abc import Callable
from dataclasses import dataclass
from datetime import UTC, datetime
from typing import Any

from app.core.config import Settings
from app.models.enums import AgentName, AgentOutputStatus, LogLevel
from app.schemas.common import SSEEvent

# Callback signatures implemented by the service layer (synchronous DB writes).
PersistOutput = Callable[[AgentName, AgentOutputStatus, dict[str, Any] | None, int, int], None]
PersistLog = Callable[[AgentName | None, str, LogLevel, dict[str, Any] | None], None]


@dataclass
class PipelineContext:
    """Per-run context shared with every node."""

    run_id: str
    settings: Settings
    queue: asyncio.Queue[SSEEvent | None]
    persist_output: PersistOutput
    persist_log: PersistLog

    # --- SSE emit helpers ----------------------------------------------------
    async def emit(self, event: SSEEvent) -> None:
        await self.queue.put(event)

    def _event(
        self,
        type_: str,
        agent: AgentName | None,
        payload: dict[str, Any] | None = None,
    ) -> SSEEvent:
        return SSEEvent(
            type=type_,
            agent=agent.value if agent else None,
            run_id=self.run_id,
            payload=payload or {},
            ts=datetime.now(UTC),
        )

    async def agent_started(self, agent: AgentName) -> None:
        self.persist_log(agent, f"Agent '{agent.value}' started", LogLevel.INFO, None)
        await self.emit(self._event("agent_started", agent))

    async def agent_token(self, agent: AgentName, token: str) -> None:
        await self.emit(self._event("agent_token", agent, {"token": token}))

    async def agent_completed(
        self,
        agent: AgentName,
        *,
        status: AgentOutputStatus,
        output: dict[str, Any] | None,
        tokens: int,
        duration_ms: int,
    ) -> None:
        await self.emit(
            self._event(
                "agent_completed",
                agent,
                {
                    "status": status.value,
                    "tokens": tokens,
                    "duration_ms": duration_ms,
                    "output": output,
                },
            )
        )

    async def agent_failed(self, agent: AgentName, message: str) -> None:
        self.persist_log(agent, f"Agent '{agent.value}' failed: {message}", LogLevel.ERROR, None)
        await self.emit(self._event("error", agent, {"message": message, "fatal": False}))
