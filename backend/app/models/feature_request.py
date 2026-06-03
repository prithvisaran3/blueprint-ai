"""FeatureRequest model — captures the raw prompt and parsed constraints."""

from __future__ import annotations

import uuid
from datetime import datetime
from typing import TYPE_CHECKING, Any

from sqlalchemy import DateTime, ForeignKey, Text, func
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base, uuid_pk

if TYPE_CHECKING:
    from app.models.project import Project


class FeatureRequest(Base):
    """A request derived from a project's idea prompt."""

    __tablename__ = "feature_requests"

    id: Mapped[uuid.UUID] = uuid_pk()
    project_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("projects.id", ondelete="CASCADE"), nullable=False, index=True
    )
    raw_prompt: Mapped[str] = mapped_column(Text, nullable=False)
    parsed_constraints: Mapped[dict[str, Any]] = mapped_column(
        JSONB, default=dict, nullable=False
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )

    project: Mapped[Project] = relationship(back_populates="feature_requests")
