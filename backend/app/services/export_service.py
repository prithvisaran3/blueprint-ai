"""Export service — turn Planner output into Jira / GitHub Issues (Phase 6).

Reads a completed run's Planner agent output (Epics → Stories → Tasks) and
converts it into ready-to-use ticket payloads. The GitHub export can optionally
create the issues for real using a user-provided token (used in-request only,
never stored or logged).
"""

from __future__ import annotations

import uuid
from typing import Any

import httpx

from app.core.logging import get_logger
from app.core.security import AuthenticatedUser
from app.exceptions import ExternalServiceError, NotFoundError, ValidationError
from app.models.enums import AgentName
from app.repositories.agent_run_repository import AgentRunRepository
from app.repositories.project_repository import ProjectRepository
from app.schemas.export import (
    GitHubExportRequest,
    GitHubExportResponse,
    GitHubIssue,
    JiraExportRequest,
    JiraExportResponse,
    JiraIssueFields,
    JiraTicket,
)

logger = get_logger(__name__)

_GITHUB_API = "https://api.github.com"


class ExportService:
    """Converts Planner output into external ticketing payloads."""

    def __init__(self, projects: ProjectRepository, runs: AgentRunRepository) -> None:
        self.projects = projects
        self.runs = runs

    def _planner_output(
        self, current: AuthenticatedUser, run_id: uuid.UUID
    ) -> dict[str, Any]:
        """Return the run's Planner output, enforcing ownership."""
        run = self.runs.get(run_id)
        if run is None:
            raise NotFoundError("Run not found")
        project = self.projects.get(run.project_id)
        if project is None or project.user_id != current.id:
            raise NotFoundError("Run not found")

        row = self.runs.get_output(run_id, AgentName.PLANNER)
        if row is None or not row.output:
            raise ValidationError(
                "This run has no planner output to export. Generate a blueprint first."
            )
        return row.output

    # --- Jira ----------------------------------------------------------------
    def export_jira(
        self, current: AuthenticatedUser, payload: JiraExportRequest
    ) -> JiraExportResponse:
        plan = self._planner_output(current, payload.run_id)
        key = payload.project_key.upper()
        tickets: list[JiraTicket] = []

        for ei, epic in enumerate(plan.get("epics", []) or [], start=1):
            epic_ref = f"EPIC-{ei}"
            tickets.append(
                JiraTicket(
                    ref=epic_ref,
                    fields=JiraIssueFields(
                        project={"key": key},
                        summary=epic.get("title", "Untitled epic"),
                        description=epic.get("goal", ""),
                        issuetype={"name": "Epic"},
                        labels=["blueprint-ai", "epic"],
                    ),
                )
            )
            for si, story in enumerate(epic.get("stories", []) or [], start=1):
                story_ref = f"STORY-{ei}-{si}"
                tickets.append(
                    JiraTicket(
                        ref=story_ref,
                        parent_ref=epic_ref,
                        story_points=story.get("story_points") or None,
                        fields=JiraIssueFields(
                            project={"key": key},
                            summary=story.get("title", "Untitled story"),
                            description=_story_description(story),
                            issuetype={"name": "Story"},
                            labels=["blueprint-ai", "story"],
                        ),
                    )
                )
                for ti, task in enumerate(story.get("tasks", []) or [], start=1):
                    tickets.append(
                        JiraTicket(
                            ref=f"TASK-{ei}-{si}-{ti}",
                            parent_ref=story_ref,
                            fields=JiraIssueFields(
                                project={"key": key},
                                summary=task.get("title", "Untitled task"),
                                description=_task_description(task),
                                issuetype={"name": "Task"},
                                labels=["blueprint-ai", "task"],
                            ),
                        )
                    )

        return JiraExportResponse(project_key=key, count=len(tickets), tickets=tickets)

    # --- GitHub Issues -------------------------------------------------------
    def _build_github_issues(
        self, plan: dict[str, Any], base_labels: list[str]
    ) -> list[GitHubIssue]:
        issues: list[GitHubIssue] = []
        for epic in plan.get("epics", []) or []:
            title = epic.get("title", "Untitled epic")
            stories = epic.get("stories", []) or []
            body_lines = [epic.get("goal", ""), "", "**Stories**"]
            body_lines += [f"- {s.get('title', 'Untitled story')}" for s in stories]
            issues.append(
                GitHubIssue(
                    title=f"[Epic] {title}",
                    body="\n".join(body_lines).strip(),
                    labels=[*base_labels, "epic"],
                )
            )
            for story in stories:
                issues.append(
                    GitHubIssue(
                        title=f"{title} — {story.get('title', 'Untitled story')}",
                        body=_story_github_body(story),
                        labels=[*base_labels, "story"],
                    )
                )
        return issues

    async def export_github(
        self, current: AuthenticatedUser, payload: GitHubExportRequest
    ) -> GitHubExportResponse:
        plan = self._planner_output(current, payload.run_id)
        issues = self._build_github_issues(plan, payload.labels)

        # Preview-only unless a repo + token are supplied and dry_run is off.
        if payload.dry_run or not payload.repo or not payload.token:
            return GitHubExportResponse(
                repo=payload.repo, dry_run=True, count=len(issues), created=0, issues=issues
            )

        if "/" not in payload.repo:
            raise ValidationError("repo must be in 'owner/name' format")

        created = await self._create_github_issues(payload.repo, payload.token, issues)
        return GitHubExportResponse(
            repo=payload.repo,
            dry_run=False,
            count=len(issues),
            created=len(created),
            issues=created,
        )

    async def _create_github_issues(
        self, repo: str, token: str, issues: list[GitHubIssue]
    ) -> list[GitHubIssue]:
        headers = {
            "Authorization": f"Bearer {token}",
            "Accept": "application/vnd.github+json",
            "X-GitHub-Api-Version": "2022-11-28",
        }
        created: list[GitHubIssue] = []
        async with httpx.AsyncClient(base_url=_GITHUB_API, timeout=20.0) as client:
            for issue in issues:
                resp = await client.post(
                    f"/repos/{repo}/issues",
                    headers=headers,
                    json={"title": issue.title, "body": issue.body, "labels": issue.labels},
                )
                if resp.status_code >= 300:
                    # Never echo the token; surface GitHub's message only.
                    detail = _github_error_detail(resp)
                    logger.warning(
                        "GitHub issue creation failed (%s): %s", resp.status_code, detail
                    )
                    raise ExternalServiceError(
                        f"GitHub returned {resp.status_code}: {detail}"
                    )
                data = resp.json()
                created.append(
                    issue.model_copy(
                        update={"number": data.get("number"), "url": data.get("html_url")}
                    )
                )
        return created


# --- description builders ----------------------------------------------------
def _story_description(story: dict[str, Any]) -> str:
    parts: list[str] = []
    if story.get("as_a") or story.get("i_want") or story.get("so_that"):
        parts.append(
            f"As a {story.get('as_a', 'user')}, I want {story.get('i_want', '…')}, "
            f"so that {story.get('so_that', '…')}."
        )
    criteria = story.get("acceptance_criteria") or []
    if criteria:
        parts.append("Acceptance criteria:\n" + "\n".join(f"- {c}" for c in criteria))
    if story.get("story_points"):
        parts.append(f"Story points: {story['story_points']}")
    return "\n\n".join(parts)


def _task_description(task: dict[str, Any]) -> str:
    parts = [task.get("description", "")]
    if task.get("estimate_hours"):
        parts.append(f"Estimate: {task['estimate_hours']}h")
    return "\n\n".join(p for p in parts if p)


def _story_github_body(story: dict[str, Any]) -> str:
    lines: list[str] = []
    desc = _story_description(story)
    if desc:
        lines.append(desc)
    tasks = story.get("tasks") or []
    if tasks:
        lines.append("\n**Tasks**")
        lines += [f"- [ ] {t.get('title', 'Task')}" for t in tasks]
    return "\n".join(lines).strip()


def _github_error_detail(resp: httpx.Response) -> str:
    try:
        return str(resp.json().get("message", resp.text[:200]))
    except Exception:  # noqa: BLE001 - defensive parse of error body
        return resp.text[:200]
