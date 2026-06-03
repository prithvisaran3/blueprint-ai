"""GeneratedDocument model — markdown documents produced by a run."""

from __future__ import annotations

import uuid
from datetime import datetime
from typing import TYPE_CHECKING

from sqlalchemy import DateTime, ForeignKey, String, Text, func
from sqlalchemy import Enum as SAEnum
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base, uuid_pk
from app.models.enums import DOC_TYPE_ENUM, DocType

if TYPE_CHECKING:
    from app.models.agent_run import AgentRun
    from app.models.project import Project


class GeneratedDocument(Base):
    """A markdown document generated for a project/run."""

    __tablename__ = "generated_documents"

    id: Mapped[uuid.UUID] = uuid_pk()
    project_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("projects.id", ondelete="CASCADE"), nullable=False, index=True
    )
    run_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("agent_runs.id", ondelete="CASCADE"), nullable=False, index=True
    )
    doc_type: Mapped[DocType] = mapped_column(
        SAEnum(
            DocType,
            name=DOC_TYPE_ENUM,
            values_callable=lambda e: [m.value for m in e],
        ),
        nullable=False,
    )
    title: Mapped[str] = mapped_column(String(512), nullable=False)
    content_md: Mapped[str] = mapped_column(Text, nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )

    project: Mapped[Project] = relationship(back_populates="documents")
    run: Mapped[AgentRun] = relationship()
