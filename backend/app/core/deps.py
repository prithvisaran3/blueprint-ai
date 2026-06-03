"""FastAPI dependency providers (dependency injection wiring).

Centralizes the application's injectable dependencies: settings, database
sessions, the authenticated user, repositories, and services.
"""

from __future__ import annotations

from typing import Annotated

from fastapi import Depends, Request
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy.orm import Session

from app.core.config import Settings, get_settings
from app.core.security import AuthenticatedUser, AuthError, dev_user, verify_token
from app.db.session import get_db
from app.exceptions import UnauthorizedError
from app.repositories.agent_run_repository import AgentRunRepository
from app.repositories.document_repository import DocumentRepository
from app.repositories.project_repository import ProjectRepository
from app.repositories.user_repository import UserRepository
from app.services.execution_service import ExecutionService
from app.services.export_service import ExportService
from app.services.project_service import ProjectService

# ``auto_error=False`` lets us raise a consistent 401 ourselves.
_bearer_scheme = HTTPBearer(auto_error=False)

SettingsDep = Annotated[Settings, Depends(get_settings)]
DbSession = Annotated[Session, Depends(get_db)]


def get_current_user(
    request: Request,
    settings: SettingsDep,
    credentials: Annotated[HTTPAuthorizationCredentials | None, Depends(_bearer_scheme)],
) -> AuthenticatedUser:
    """Resolve the authenticated user from the ``Authorization: Bearer`` header.

    Verifies a Supabase-issued JWT. When ``AUTH_DEV_BYPASS`` is enabled, a
    deterministic local user is returned without requiring a token.
    """
    if settings.auth_dev_bypass:
        return dev_user()

    if credentials is None or not credentials.credentials:
        raise UnauthorizedError("Missing or invalid Authorization header")

    try:
        return verify_token(credentials.credentials, settings)
    except AuthError as exc:
        raise UnauthorizedError(str(exc)) from exc


CurrentUser = Annotated[AuthenticatedUser, Depends(get_current_user)]


def resolve_sse_user(
    request: Request,
    settings: Settings,
    access_token: str | None,
) -> AuthenticatedUser:
    """Resolve the user for the SSE stream.

    ``EventSource`` cannot send an ``Authorization`` header, so the live stream
    accepts the Supabase access token via the ``access_token`` query parameter
    (falling back to the header when present). ``AUTH_DEV_BYPASS`` still applies.
    """
    if settings.auth_dev_bypass:
        return dev_user()

    token = access_token
    if not token:
        header = request.headers.get("authorization", "")
        if header.lower().startswith("bearer "):
            token = header[7:].strip()

    if not token:
        raise UnauthorizedError("Missing access token for stream")
    try:
        return verify_token(token, settings)
    except AuthError as exc:
        raise UnauthorizedError(str(exc)) from exc


# --- Repository providers ----------------------------------------------------
def get_user_repository(db: DbSession) -> UserRepository:
    return UserRepository(db)


def get_project_repository(db: DbSession) -> ProjectRepository:
    return ProjectRepository(db)


def get_agent_run_repository(db: DbSession) -> AgentRunRepository:
    return AgentRunRepository(db)


def get_document_repository(db: DbSession) -> DocumentRepository:
    return DocumentRepository(db)


UserRepositoryDep = Annotated[UserRepository, Depends(get_user_repository)]
ProjectRepositoryDep = Annotated[ProjectRepository, Depends(get_project_repository)]
AgentRunRepositoryDep = Annotated[AgentRunRepository, Depends(get_agent_run_repository)]
DocumentRepositoryDep = Annotated[DocumentRepository, Depends(get_document_repository)]


# --- Service providers -------------------------------------------------------
def get_project_service(
    db: DbSession,
    projects: ProjectRepositoryDep,
    users: UserRepositoryDep,
) -> ProjectService:
    return ProjectService(db=db, projects=projects, users=users)


def get_execution_service(
    db: DbSession,
    settings: SettingsDep,
    projects: ProjectRepositoryDep,
    runs: AgentRunRepositoryDep,
    documents: DocumentRepositoryDep,
    users: UserRepositoryDep,
) -> ExecutionService:
    return ExecutionService(
        db=db,
        projects=projects,
        runs=runs,
        documents=documents,
        users=users,
        settings=settings,
    )


def get_export_service(
    projects: ProjectRepositoryDep,
    runs: AgentRunRepositoryDep,
) -> ExportService:
    return ExportService(projects=projects, runs=runs)


ProjectServiceDep = Annotated[ProjectService, Depends(get_project_service)]
ExecutionServiceDep = Annotated[ExecutionService, Depends(get_execution_service)]
ExportServiceDep = Annotated[ExportService, Depends(get_export_service)]
