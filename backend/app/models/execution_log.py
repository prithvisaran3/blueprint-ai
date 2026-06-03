"""ExecutionLog model — structured log lines emitted during a run."""

from __future__ import annotations

import uuid
from datetime import datetime
from typing import TYPE_CHECKING, Any

from sqlalchemy import DateTime, ForeignKey, Text, func
from sqlalchemy import Enum as SAEnum
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base, uuid_pk
from app.models.enums import AGENT_NAME_ENUM, LOG_LEVEL_ENUM, AgentName, LogLevel

if TYPE_CHECKING:
    from app.models.agent_run import AgentRun


class ExecutionLog(Base):
    """A single execution log entry tied to a run (and optionally an agent)."""

    __tablename__ = "execution_logs"

    id: Mapped[uuid.UUID] = uuid_pk()
    run_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("agent_runs.id", ondelete="CASCADE"), nullable=False, index=True
    )
    agent: Mapped[AgentName | None] = mapped_column(
        SAEnum(
            AgentName,
            name=AGENT_NAME_ENUM,
            values_callable=lambda e: [m.value for m in e],
        ),
        nullable=True,
    )
    level: Mapped[LogLevel] = mapped_column(
        SAEnum(
            LogLevel,
            name=LOG_LEVEL_ENUM,
            values_callable=lambda e: [m.value for m in e],
        ),
        default=LogLevel.INFO,
        nullable=False,
    )
    message: Mapped[str] = mapped_column(Text, nullable=False)
    meta: Mapped[dict[str, Any]] = mapped_column(JSONB, default=dict, nullable=False)
    ts: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False, index=True
    )

    run: Mapped[AgentRun] = relationship(back_populates="logs")
