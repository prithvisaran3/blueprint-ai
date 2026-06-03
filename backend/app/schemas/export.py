"""Export schemas — convert Planner output into Jira / GitHub Issues payloads.

Phase 6 add-on. These take a completed run's Planner agent output (Epics →
Stories → Tasks) and turn it into ticket payloads. The GitHub export can
optionally create the issues for real using a **user-provided** token (never
hardcoded, never persisted).
"""

from __future__ import annotations

import uuid

from pydantic import BaseModel, Field


# --- Jira --------------------------------------------------------------------
class JiraExportRequest(BaseModel):
    """Request body for ``POST /export/jira``."""

    run_id: uuid.UUID
    project_key: str = Field(default="BP", min_length=1, max_length=20)


class JiraIssueFields(BaseModel):
    """The ``fields`` object of a Jira create-issue payload."""

    project: dict[str, str]
    summary: str
    description: str = ""
    issuetype: dict[str, str]
    labels: list[str] = Field(default_factory=list)


class JiraTicket(BaseModel):
    """A single Jira create-issue payload (Jira REST ``/issue`` shape)."""

    fields: JiraIssueFields
    # Cross-reference for hierarchy (Jira assigns real keys on creation).
    ref: str
    parent_ref: str | None = None
    story_points: int | None = None


class JiraExportResponse(BaseModel):
    """Response for ``POST /export/jira`` — ready-to-POST Jira payloads."""

    project_key: str
    count: int
    tickets: list[JiraTicket]


# --- GitHub Issues -----------------------------------------------------------
class GitHubExportRequest(BaseModel):
    """Request body for ``POST /export/github-issues``.

    When ``dry_run`` is true (default) the issues are only *previewed* and no
    network call is made. Provide ``repo`` (``owner/name``) and a personal
    access ``token`` to actually create them. The token is used in-request only
    and is never stored or logged.
    """

    run_id: uuid.UUID
    repo: str | None = Field(default=None, description="owner/name, e.g. acme/app")
    token: str | None = Field(default=None, description="GitHub PAT (write: issues)")
    dry_run: bool = True
    labels: list[str] = Field(default_factory=lambda: ["blueprint-ai"])


class GitHubIssue(BaseModel):
    """A GitHub issue payload (``POST /repos/{owner}/{repo}/issues`` shape)."""

    title: str
    body: str = ""
    labels: list[str] = Field(default_factory=list)
    # Populated only when actually created against GitHub.
    number: int | None = None
    url: str | None = None


class GitHubExportResponse(BaseModel):
    """Response for ``POST /export/github-issues``."""

    repo: str | None
    dry_run: bool
    count: int
    created: int
    issues: list[GitHubIssue]
