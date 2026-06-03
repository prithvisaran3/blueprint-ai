"""Agent-run, generate, and execution schemas."""

from __future__ import annotations

import uuid
from datetime import datetime
from typing import Any

from pydantic import BaseModel, Field, model_validator

from app.models.enums import AgentName, AgentOutputStatus, LogLevel, RunStatus
from app.schemas.common import APIModel


class GenerateRequest(BaseModel):
    """Request body for ``POST /generate``.

    Supply either an existing ``project_id`` or an ``idea_prompt`` (which
    creates a project on the fly). ``name`` is optional when creating one.
    """

    project_id: uuid.UUID | None = None
    idea_prompt: str | None = Field(default=None, min_length=1)
    name: str | None = Field(default=None, max_length=255)

    @model_validator(mode="after")
    def _require_one(self) -> GenerateRequest:
        if self.project_id is None and not self.idea_prompt:
            raise ValueError("Either 'project_id' or 'idea_prompt' is required")
        return self


class GenerateResponse(BaseModel):
    """Response for ``POST /generate``."""

    run_id: uuid.UUID
    project_id: uuid.UUID
    status: RunStatus


class AgentOutputRead(APIModel):
    """A single agent's output within a run."""

    id: uuid.UUID
    run_id: uuid.UUID
    agent: AgentName
    status: AgentOutputStatus
    output: dict[str, Any] | None = None
    tokens: int
    duration_ms: int
    created_at: datetime


class AgentRunRead(APIModel):
    """Run summary (without nested outputs)."""

    id: uuid.UUID
    project_id: uuid.UUID
    status: RunStatus
    started_at: datetime | None = None
    finished_at: datetime | None = None
    total_tokens: int
    total_duration_ms: int
    health_score: dict[str, Any] | None = None
    error: str | None = None
    created_at: datetime
    updated_at: datetime


class ExecutionRead(AgentRunRead):
    """Full execution detail: run + all agent outputs (``GET /executions/{id}``)."""

    outputs: list[AgentOutputRead] = Field(default_factory=list)


class ExecutionLogRead(APIModel):
    """A single execution log entry."""

    id: uuid.UUID
    run_id: uuid.UUID
    agent: AgentName | None = None
    level: LogLevel
    message: str
    meta: dict[str, Any] = Field(default_factory=dict)
    ts: datetime


class AgentRerunRequest(BaseModel):
    """Request body for ``POST /agents/run`` (re-run a single agent)."""

    run_id: uuid.UUID
    agent: AgentName
