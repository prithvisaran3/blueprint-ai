"""Export endpoints — Jira ticket payloads and GitHub Issues (Phase 6).

Converts a run's Planner output (Epics → Stories → Tasks) into ticket payloads.
GitHub issues can optionally be created for real with a user-provided token.
"""

from __future__ import annotations

from fastapi import APIRouter

from app.core.deps import CurrentUser, ExportServiceDep
from app.schemas.export import (
    GitHubExportRequest,
    GitHubExportResponse,
    JiraExportRequest,
    JiraExportResponse,
)

router = APIRouter(prefix="/export", tags=["export"])


@router.post("/jira", response_model=JiraExportResponse)
def export_jira(
    payload: JiraExportRequest,
    current: CurrentUser,
    service: ExportServiceDep,
) -> JiraExportResponse:
    """Convert the run's Planner output into ready-to-POST Jira issue payloads."""
    return service.export_jira(current, payload)


@router.post("/github-issues", response_model=GitHubExportResponse)
async def export_github_issues(
    payload: GitHubExportRequest,
    current: CurrentUser,
    service: ExportServiceDep,
) -> GitHubExportResponse:
    """Preview (or, with a repo + token, create) GitHub Issues from the plan."""
    return await service.export_github(current, payload)
