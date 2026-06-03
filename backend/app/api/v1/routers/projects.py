"""Project CRUD endpoints."""

from __future__ import annotations

import uuid

from fastapi import APIRouter, Query, status

from app.core.deps import (
    AgentRunRepositoryDep,
    CurrentUser,
    ProjectServiceDep,
)
from app.schemas.common import Page
from app.schemas.project import (
    ProjectCreate,
    ProjectDetail,
    ProjectRead,
    ProjectUpdate,
)

router = APIRouter(prefix="/projects", tags=["projects"])


@router.post("", response_model=ProjectRead, status_code=status.HTTP_201_CREATED)
def create_project(
    payload: ProjectCreate,
    current: CurrentUser,
    service: ProjectServiceDep,
) -> ProjectRead:
    return service.create_project(current, payload)


@router.get("", response_model=Page[ProjectRead])
def list_projects(
    current: CurrentUser,
    service: ProjectServiceDep,
    limit: int = Query(default=20, ge=1, le=100),
    offset: int = Query(default=0, ge=0),
) -> Page[ProjectRead]:
    items, total = service.list_projects(current, limit, offset)
    return Page(items=items, total=total, limit=limit, offset=offset)


@router.get("/{project_id}", response_model=ProjectDetail)
def get_project(
    project_id: uuid.UUID,
    current: CurrentUser,
    service: ProjectServiceDep,
    runs: AgentRunRepositoryDep,
) -> ProjectDetail:
    return service.get_project_detail(current, project_id, runs)


@router.patch("/{project_id}", response_model=ProjectRead)
def update_project(
    project_id: uuid.UUID,
    payload: ProjectUpdate,
    current: CurrentUser,
    service: ProjectServiceDep,
) -> ProjectRead:
    return service.update_project(current, project_id, payload)


@router.delete("/{project_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_project(
    project_id: uuid.UUID,
    current: CurrentUser,
    service: ProjectServiceDep,
) -> None:
    service.delete_project(current, project_id)
