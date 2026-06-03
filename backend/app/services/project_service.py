"""Project business logic."""

from __future__ import annotations

import uuid

from sqlalchemy.orm import Session

from app.core.logging import get_logger
from app.core.security import AuthenticatedUser
from app.exceptions import NotFoundError
from app.models.project import Project
from app.repositories.agent_run_repository import AgentRunRepository
from app.repositories.project_repository import ProjectRepository
from app.repositories.user_repository import UserRepository
from app.schemas.project import (
    ProjectCreate,
    ProjectDetail,
    ProjectRead,
    ProjectUpdate,
    RunSummary,
)

logger = get_logger(__name__)


class ProjectService:
    """Coordinates project CRUD and owns its transaction boundary."""

    def __init__(
        self,
        db: Session,
        projects: ProjectRepository,
        users: UserRepository,
    ) -> None:
        self.db = db
        self.projects = projects
        self.users = users

    def ensure_user(self, current: AuthenticatedUser) -> None:
        """Provision the local user row from verified JWT claims (idempotent)."""
        self.users.upsert(
            user_id=current.id,
            email=current.email or f"{current.id}@unknown.local",
            display_name=current.display_name,
            avatar_url=current.avatar_url,
        )
        self.db.commit()

    def create_project(
        self, current: AuthenticatedUser, payload: ProjectCreate
    ) -> ProjectRead:
        self.ensure_user(current)
        project = Project(
            user_id=current.id,
            name=payload.name,
            idea_prompt=payload.idea_prompt,
        )
        self.projects.add(project)
        self.db.commit()
        self.db.refresh(project)
        logger.info("Created project %s for user %s", project.id, current.id)
        return ProjectRead.model_validate(project)

    def list_projects(
        self, current: AuthenticatedUser, limit: int, offset: int
    ) -> tuple[list[ProjectRead], int]:
        items, total = self.projects.list_for_user(current.id, limit, offset)
        return [ProjectRead.model_validate(p) for p in items], total

    def _require_project(
        self, current: AuthenticatedUser, project_id: uuid.UUID
    ) -> Project:
        project = self.projects.get_for_user(project_id, current.id)
        if project is None:
            raise NotFoundError("Project not found")
        return project

    def get_project_detail(
        self,
        current: AuthenticatedUser,
        project_id: uuid.UUID,
        runs: AgentRunRepository,
    ) -> ProjectDetail:
        project = self._require_project(current, project_id)
        latest = runs.latest_for_project(project.id)
        detail = ProjectDetail.model_validate(project)
        if latest is not None:
            detail.latest_run = RunSummary.model_validate(latest)
        return detail

    def update_project(
        self,
        current: AuthenticatedUser,
        project_id: uuid.UUID,
        payload: ProjectUpdate,
    ) -> ProjectRead:
        project = self._require_project(current, project_id)
        data = payload.model_dump(exclude_unset=True)
        for field, value in data.items():
            setattr(project, field, value)
        self.db.commit()
        self.db.refresh(project)
        return ProjectRead.model_validate(project)

    def delete_project(
        self, current: AuthenticatedUser, project_id: uuid.UUID
    ) -> None:
        project = self._require_project(current, project_id)
        self.projects.delete(project)
        self.db.commit()
        logger.info("Deleted project %s for user %s", project_id, current.id)
