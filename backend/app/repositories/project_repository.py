"""Project repository."""

from __future__ import annotations

import uuid

from sqlalchemy import func, select

from app.models.project import Project
from app.repositories.base import BaseRepository


class ProjectRepository(BaseRepository[Project]):
    """Data access for :class:`~app.models.project.Project`."""

    model = Project

    def list_for_user(
        self, user_id: uuid.UUID, limit: int, offset: int
    ) -> tuple[list[Project], int]:
        """Return a page of the user's projects (newest first) and the total."""
        base = select(Project).where(Project.user_id == user_id)
        total = int(
            self.db.execute(
                select(func.count()).select_from(base.subquery())
            ).scalar_one()
        )
        stmt = (
            base.order_by(Project.created_at.desc()).limit(limit).offset(offset)
        )
        items = list(self.db.execute(stmt).scalars().all())
        return items, total

    def get_for_user(
        self, project_id: uuid.UUID, user_id: uuid.UUID
    ) -> Project | None:
        stmt = select(Project).where(
            Project.id == project_id, Project.user_id == user_id
        )
        return self.db.execute(stmt).scalar_one_or_none()
