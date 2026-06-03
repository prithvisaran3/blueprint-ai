"""Project model."""

from __future__ import annotations

import uuid
from typing import TYPE_CHECKING

from sqlalchemy import Enum as SAEnum
from sqlalchemy import ForeignKey, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base, TimestampMixin, uuid_pk
from app.models.enums import PROJECT_STATUS_ENUM, ProjectStatus

if TYPE_CHECKING:
    from app.models.agent_run import AgentRun
    from app.models.feature_request import FeatureRequest
    from app.models.generated_document import GeneratedDocument
    from app.models.user import User


class Project(Base, TimestampMixin):
    """A user's idea/project that agent runs are executed against."""

    __tablename__ = "projects"

    id: Mapped[uuid.UUID] = uuid_pk()
    user_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True
    )
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    idea_prompt: Mapped[str] = mapped_column(Text, nullable=False)
    status: Mapped[ProjectStatus] = mapped_column(
        SAEnum(
            ProjectStatus,
            name=PROJECT_STATUS_ENUM,
            values_callable=lambda e: [m.value for m in e],
        ),
        default=ProjectStatus.DRAFT,
        nullable=False,
    )

    owner: Mapped[User] = relationship(back_populates="projects")
    feature_requests: Mapped[list[FeatureRequest]] = relationship(
        back_populates="project", cascade="all, delete-orphan"
    )
    runs: Mapped[list[AgentRun]] = relationship(
        back_populates="project",
        cascade="all, delete-orphan",
        order_by="AgentRun.created_at.desc()",
    )
    documents: Mapped[list[GeneratedDocument]] = relationship(
        back_populates="project", cascade="all, delete-orphan"
    )
