"""AgentRun model — one execution of the agent pipeline for a project."""

from __future__ import annotations

import uuid
from datetime import datetime
from typing import TYPE_CHECKING, Any

from sqlalchemy import DateTime, ForeignKey, Integer, Text
from sqlalchemy import Enum as SAEnum
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base, TimestampMixin, uuid_pk
from app.models.enums import RUN_STATUS_ENUM, RunStatus

if TYPE_CHECKING:
    from app.models.agent_output import AgentOutput
    from app.models.execution_log import ExecutionLog
    from app.models.project import Project


class AgentRun(Base, TimestampMixin):
    """A single run of the 7-agent pipeline."""

    __tablename__ = "agent_runs"

    id: Mapped[uuid.UUID] = uuid_pk()
    project_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("projects.id", ondelete="CASCADE"), nullable=False, index=True
    )
    status: Mapped[RunStatus] = mapped_column(
        SAEnum(
            RunStatus,
            name=RUN_STATUS_ENUM,
            values_callable=lambda e: [m.value for m in e],
        ),
        default=RunStatus.QUEUED,
        nullable=False,
    )
    started_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )
    finished_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )
    total_tokens: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    total_duration_ms: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    health_score: Mapped[dict[str, Any] | None] = mapped_column(JSONB, nullable=True)
    error: Mapped[str | None] = mapped_column(Text, nullable=True)

    project: Mapped[Project] = relationship(back_populates="runs")
    outputs: Mapped[list[AgentOutput]] = relationship(
        back_populates="run",
        cascade="all, delete-orphan",
        order_by="AgentOutput.created_at",
    )
    logs: Mapped[list[ExecutionLog]] = relationship(
        back_populates="run",
        cascade="all, delete-orphan",
        order_by="ExecutionLog.ts",
    )
