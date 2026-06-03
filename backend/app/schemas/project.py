"""Project schemas (request + response)."""

from __future__ import annotations

import uuid
from datetime import datetime

from pydantic import BaseModel, Field

from app.models.enums import ProjectStatus
from app.schemas.common import APIModel


class ProjectCreate(BaseModel):
    """Request body for ``POST /projects``."""

    name: str = Field(min_length=1, max_length=255)
    idea_prompt: str = Field(min_length=1)


class ProjectUpdate(BaseModel):
    """Partial update for a project."""

    name: str | None = Field(default=None, min_length=1, max_length=255)
    idea_prompt: str | None = Field(default=None, min_length=1)
    status: ProjectStatus | None = None


class RunSummary(APIModel):
    """Compact run info embedded in project detail / history responses."""

    id: uuid.UUID
    status: str
    total_tokens: int
    total_duration_ms: int
    started_at: datetime | None = None
    finished_at: datetime | None = None
    created_at: datetime


class ProjectRead(APIModel):
    """Project representation returned by list/detail endpoints."""

    id: uuid.UUID
    user_id: uuid.UUID
    name: str
    idea_prompt: str
    status: ProjectStatus
    created_at: datetime
    updated_at: datetime


class ProjectDetail(ProjectRead):
    """Project detail including the latest run summary (plan section 4)."""

    latest_run: RunSummary | None = None
