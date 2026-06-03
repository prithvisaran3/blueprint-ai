"""AgentOutput model — structured output produced by one agent in a run."""

from __future__ import annotations

import uuid
from datetime import datetime
from typing import TYPE_CHECKING, Any

from sqlalchemy import DateTime, ForeignKey, Integer, UniqueConstraint, func
from sqlalchemy import Enum as SAEnum
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base, uuid_pk
from app.models.enums import (
    AGENT_NAME_ENUM,
    AGENT_OUTPUT_STATUS_ENUM,
    AgentName,
    AgentOutputStatus,
)

if TYPE_CHECKING:
    from app.models.agent_run import AgentRun


class AgentOutput(Base):
    """One agent's structured output for a run (unique per ``run_id``/``agent``)."""

    __tablename__ = "agent_outputs"
    __table_args__ = (
        UniqueConstraint("run_id", "agent", name="uq_agent_outputs_run_id_agent"),
    )

    id: Mapped[uuid.UUID] = uuid_pk()
    run_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("agent_runs.id", ondelete="CASCADE"), nullable=False, index=True
    )
    agent: Mapped[AgentName] = mapped_column(
        SAEnum(
            AgentName,
            name=AGENT_NAME_ENUM,
            values_callable=lambda e: [m.value for m in e],
        ),
        nullable=False,
    )
    status: Mapped[AgentOutputStatus] = mapped_column(
        SAEnum(
            AgentOutputStatus,
            name=AGENT_OUTPUT_STATUS_ENUM,
            values_callable=lambda e: [m.value for m in e],
        ),
        default=AgentOutputStatus.PENDING,
        nullable=False,
    )
    output: Mapped[dict[str, Any] | None] = mapped_column(JSONB, nullable=True)
    tokens: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    duration_ms: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )

    run: Mapped[AgentRun] = relationship(back_populates="outputs")
