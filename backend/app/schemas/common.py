"""Shared schema primitives: base models, pagination, and SSE events."""

from __future__ import annotations

from datetime import datetime
from typing import Any, Generic, TypeVar

from pydantic import BaseModel, ConfigDict, Field

T = TypeVar("T")


class APIModel(BaseModel):
    """Base model for response payloads (reads attributes from ORM objects)."""

    model_config = ConfigDict(from_attributes=True)


class Page(APIModel, Generic[T]):
    """A paginated collection response."""

    items: list[T]
    total: int
    limit: int
    offset: int


class PaginationParams(BaseModel):
    """Common pagination query parameters."""

    limit: int = Field(default=20, ge=1, le=100)
    offset: int = Field(default=0, ge=0)


class SSEEvent(BaseModel):
    """Server-sent event envelope as defined in the architecture plan.

    Shape: ``{ type, agent, run_id, payload, ts }``.
    """

    type: str = Field(description="agent_started|agent_token|agent_completed|run_completed|error")
    agent: str | None = None
    run_id: str
    payload: dict[str, Any] = Field(default_factory=dict)
    ts: datetime = Field(default_factory=datetime.utcnow)
