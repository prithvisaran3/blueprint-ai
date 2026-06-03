"""Execution business logic: runs, the LangGraph generate pipeline, and SSE.

``POST /generate`` creates a queued run; the SSE endpoint
(``GET /executions/{run_id}/stream``) executes the real LangGraph + Gemini
pipeline live, streaming ``agent_started`` / ``agent_token`` /
``agent_completed`` / ``run_completed`` events while persisting each agent's
output and logs. Revisiting a finished run replays its persisted outputs.

If ``GEMINI_API_KEY`` is unset the LLM layer falls back to the deterministic
stub (:mod:`app.services.stubs`), so the pipeline still runs end-to-end.
"""

from __future__ import annotations

import asyncio
import uuid
from collections.abc import AsyncIterator
from datetime import UTC, datetime
from typing import Any

from sqlalchemy.orm import Session

from app.agents import AGENT_SEQUENCE, PipelineContext, stream_pipeline
from app.agents.llm import generate_structured
from app.core.config import Settings
from app.core.logging import get_logger
from app.core.security import AuthenticatedUser
from app.exceptions import NotFoundError, ValidationError
from app.models.agent_run import AgentRun
from app.models.enums import (
    AgentName,
    AgentOutputStatus,
    DocType,
    LogLevel,
    ProjectStatus,
    RunStatus,
)
from app.models.feature_request import FeatureRequest
from app.models.project import Project
from app.repositories.agent_run_repository import AgentRunRepository
from app.repositories.document_repository import DocumentRepository
from app.repositories.project_repository import ProjectRepository
from app.repositories.user_repository import UserRepository
from app.schemas.common import SSEEvent
from app.schemas.document import GeneratedDocumentRead
from app.schemas.run import (
    AgentOutputRead,
    AgentRerunRequest,
    AgentRunRead,
    ExecutionLogRead,
    ExecutionRead,
    GenerateRequest,
)

logger = get_logger(__name__)

# Inter-event delay when replaying a finished run's persisted outputs (seconds).
_REPLAY_STEP_DELAY = 0.25


class ExecutionService:
    """Coordinates run creation, the live AI pipeline, storage, and streaming."""

    def __init__(
        self,
        db: Session,
        projects: ProjectRepository,
        runs: AgentRunRepository,
        documents: DocumentRepository,
        users: UserRepository,
        settings: Settings,
    ) -> None:
        self.db = db
        self.projects = projects
        self.runs = runs
        self.documents = documents
        self.users = users
        self.settings = settings

    # --- Authorization helpers ----------------------------------------------
    def _require_owned_run(
        self, current: AuthenticatedUser, run_id: uuid.UUID
    ) -> AgentRun:
        run = self.runs.get(run_id)
        if run is None:
            raise NotFoundError("Run not found")
        project = self.projects.get(run.project_id)
        if project is None or project.user_id != current.id:
            # Hide existence of runs the caller doesn't own.
            raise NotFoundError("Run not found")
        return run

    def _resolve_project(
        self, current: AuthenticatedUser, payload: GenerateRequest
    ) -> Project:
        """Return the target project, creating one from the prompt if needed."""
        if payload.project_id is not None:
            project = self.projects.get_for_user(payload.project_id, current.id)
            if project is None:
                raise NotFoundError("Project not found")
            return project

        if not payload.idea_prompt:
            raise ValidationError("idea_prompt is required when project_id is omitted")

        name = payload.name or self._derive_name(payload.idea_prompt)
        project = Project(
            user_id=current.id,
            name=name,
            idea_prompt=payload.idea_prompt,
        )
        self.projects.add(project)
        return project

    @staticmethod
    def _derive_name(prompt: str) -> str:
        snippet = prompt.strip().splitlines()[0] if prompt.strip() else "Untitled"
        return (snippet[:60] + "…") if len(snippet) > 60 else snippet or "Untitled"

    # --- Generate / run creation --------------------------------------------
    def create_run(
        self, current: AuthenticatedUser, payload: GenerateRequest
    ) -> AgentRunRead:
        """Create a *queued* run; the SSE stream endpoint executes the pipeline.

        The agent pipeline runs live when the client connects to
        ``/executions/{run_id}/stream`` so the React Flow graph animates from
        real backend events.
        """
        # Ensure the user row exists before creating FK-related rows.
        self.users.upsert(
            user_id=current.id,
            email=current.email or f"{current.id}@unknown.local",
            display_name=current.display_name,
            avatar_url=current.avatar_url,
        )

        project = self._resolve_project(current, payload)
        self.db.flush()

        feature_request = FeatureRequest(
            project_id=project.id,
            raw_prompt=project.idea_prompt,
            parsed_constraints={},
        )
        self.db.add(feature_request)

        run = AgentRun(project_id=project.id, status=RunStatus.QUEUED)
        self.runs.add(run)
        self.db.commit()
        self.db.refresh(run)

        logger.info(
            "Created queued run %s for project %s (ai_enabled=%s)",
            run.id,
            project.id,
            self.settings.ai_enabled,
        )
        return AgentRunRead.model_validate(run)

    def _persist_documents(
        self, project_id: uuid.UUID, run_id: uuid.UUID, documentation_output: dict
    ) -> None:
        for draft in documentation_output.get("documents", []) or []:
            try:
                doc_type = DocType(draft["doc_type"])
            except (KeyError, ValueError):
                doc_type = DocType.NOTES
            self.documents.create(
                project_id=project_id,
                run_id=run_id,
                doc_type=doc_type,
                title=draft.get("title", "Untitled"),
                content_md=draft.get("content_md", ""),
            )

    # --- Live pipeline execution (SSE) --------------------------------------
    def _build_context(
        self, run_id: uuid.UUID, project_id: uuid.UUID
    ) -> PipelineContext:
        """Wire DB persistence + an event queue into a per-run pipeline context."""
        queue: asyncio.Queue[SSEEvent | None] = asyncio.Queue()

        def persist_output(
            agent: AgentName,
            status: AgentOutputStatus,
            output: dict[str, Any] | None,
            tokens: int,
            duration_ms: int,
        ) -> None:
            self.runs.upsert_output(
                run_id=run_id,
                agent=agent,
                status=status,
                output=output,
                tokens=tokens,
                duration_ms=duration_ms,
            )
            if agent is AgentName.DOCUMENTATION and output:
                self._persist_documents(project_id, run_id, output)
            self.db.commit()

        def persist_log(
            agent: AgentName | None,
            message: str,
            level: LogLevel,
            meta: dict[str, Any] | None,
        ) -> None:
            self.runs.add_log(run_id, message, level=level, agent=agent, meta=meta)
            self.db.commit()

        return PipelineContext(
            run_id=str(run_id),
            settings=self.settings,
            queue=queue,
            persist_output=persist_output,
            persist_log=persist_log,
        )

    async def _execute_live(
        self, run: AgentRun, project: Project
    ) -> AsyncIterator[SSEEvent]:
        """Run the LangGraph pipeline live, yielding SSE events as agents run."""
        run.status = RunStatus.RUNNING
        run.started_at = datetime.now(UTC)
        project.status = ProjectStatus.RUNNING
        self.runs.add_log(run.id, "Run started", level=LogLevel.INFO)
        self.db.commit()

        ctx = self._build_context(run.id, project.id)
        idea = project.idea_prompt
        fatal_error: str | None = None

        try:
            async for event in stream_pipeline(ctx, idea, constraints={}):
                yield event
        except Exception as exc:  # noqa: BLE001 - finalize run on fatal failure
            fatal_error = str(exc)
            logger.exception("Pipeline crashed for run %s", run.id)

        yield self._finalize_run(run.id, project.id, fatal_error)

    def _finalize_run(
        self, run_id: uuid.UUID, project_id: uuid.UUID, fatal_error: str | None
    ) -> SSEEvent:
        """Persist run-level totals + health score and emit ``run_completed``."""
        run = self.runs.get_with_outputs(run_id)
        project = self.projects.get(project_id)
        assert run is not None and project is not None

        total_tokens = sum(o.tokens for o in run.outputs)
        total_duration = sum(o.duration_ms for o in run.outputs)
        completed = [o for o in run.outputs if o.status is AgentOutputStatus.COMPLETED]

        health_score: dict[str, Any] | None = None
        cto = self.runs.get_output(run_id, AgentName.CTO_REVIEW)
        if cto is not None and cto.output:
            health_score = cto.output.get("health_score")

        run.total_tokens = total_tokens
        run.total_duration_ms = total_duration
        run.health_score = health_score
        run.finished_at = datetime.now(UTC)

        if fatal_error and not completed:
            run.status = RunStatus.FAILED
            run.error = fatal_error
            project.status = ProjectStatus.FAILED
            self.runs.add_log(run_id, f"Run failed: {fatal_error}", level=LogLevel.ERROR)
        elif not completed:
            run.status = RunStatus.FAILED
            run.error = "All agents failed"
            project.status = ProjectStatus.FAILED
            self.runs.add_log(run_id, "Run failed: all agents failed", level=LogLevel.ERROR)
        else:
            run.status = RunStatus.COMPLETED
            project.status = ProjectStatus.COMPLETED
            if len(completed) == len(AGENT_SEQUENCE):
                note = "Run completed"
            else:
                note = (
                    f"Run completed with partial results "
                    f"({len(completed)}/{len(AGENT_SEQUENCE)} agents)"
                )
            self.runs.add_log(run_id, note, level=LogLevel.INFO)

        self.db.commit()
        logger.info(
            "Run %s finalized: status=%s tokens=%d", run_id, run.status.value, total_tokens
        )
        return SSEEvent(
            type="run_completed",
            run_id=str(run_id),
            payload={
                "status": run.status.value,
                "total_tokens": total_tokens,
                "total_duration_ms": total_duration,
                "health_score": health_score,
                "error": run.error,
            },
        )

    async def _replay(
        self, run: AgentRun, run_id: uuid.UUID
    ) -> AsyncIterator[SSEEvent]:
        """Replay a finished run's persisted outputs as SSE events."""
        rid = str(run_id)
        for agent in AGENT_SEQUENCE:
            output_row = self.runs.get_output(run_id, agent)
            if output_row is None:
                continue
            yield SSEEvent(type="agent_started", agent=agent.value, run_id=rid)
            await asyncio.sleep(_REPLAY_STEP_DELAY)
            yield SSEEvent(
                type="agent_completed",
                agent=agent.value,
                run_id=rid,
                payload={
                    "status": output_row.status.value,
                    "tokens": output_row.tokens,
                    "duration_ms": output_row.duration_ms,
                    "output": output_row.output,
                },
            )

        yield SSEEvent(
            type="run_completed",
            run_id=rid,
            payload={
                "status": run.status.value,
                "total_tokens": run.total_tokens,
                "total_duration_ms": run.total_duration_ms,
                "health_score": run.health_score,
                "error": run.error,
            },
        )

    async def stream_events(
        self, current: AuthenticatedUser, run_id: uuid.UUID
    ) -> AsyncIterator[SSEEvent]:
        """Stream a run: execute live if queued, otherwise replay persisted outputs."""
        run = self._require_owned_run(current, run_id)

        if run.status is RunStatus.QUEUED:
            project = self.projects.get(run.project_id)
            assert project is not None  # ownership already validated
            async for event in self._execute_live(run, project):
                yield event
        else:
            async for event in self._replay(run, run_id):
                yield event

    # --- Single-agent re-run -------------------------------------------------
    def rerun_agent(
        self, current: AuthenticatedUser, payload: AgentRerunRequest
    ) -> AgentOutputRead:
        """Re-run a single agent for an existing run (regenerate one tab)."""
        run = self._require_owned_run(current, payload.run_id)
        project = self.projects.get(run.project_id)
        assert project is not None  # ownership already validated

        # Rebuild pipeline state from prior persisted outputs for prompt context.
        state: dict[str, Any] = {"idea": project.idea_prompt, "constraints": {}}
        for agent in AGENT_SEQUENCE:
            row = self.runs.get_output(run.id, agent)
            state[agent.value] = row.output if row is not None else None

        logger.info("Re-running agent %s for run %s", payload.agent.value, run.id)
        try:
            output, tokens = asyncio.run(
                generate_structured(payload.agent, state, self.settings)
            )
            status = AgentOutputStatus.COMPLETED
            duration_ms = 0
        except Exception as exc:  # noqa: BLE001 - persist failure state for the tab
            logger.exception("Re-run of agent %s failed", payload.agent.value)
            self.runs.add_log(
                run.id, f"Agent '{payload.agent.value}' re-run failed: {exc}",
                level=LogLevel.ERROR, agent=payload.agent,
            )
            row = self.runs.upsert_output(
                run_id=run.id,
                agent=payload.agent,
                status=AgentOutputStatus.FAILED,
                output=None,
            )
            self.db.commit()
            self.db.refresh(row)
            return AgentOutputRead.model_validate(row)

        if payload.agent is AgentName.DOCUMENTATION and output:
            self._persist_documents(project.id, run.id, output)
        row = self.runs.upsert_output(
            run_id=run.id,
            agent=payload.agent,
            status=status,
            output=output,
            tokens=tokens,
            duration_ms=duration_ms,
        )
        self.runs.add_log(
            run.id, f"Agent '{payload.agent.value}' re-run", agent=payload.agent
        )
        self.db.commit()
        self.db.refresh(row)
        return AgentOutputRead.model_validate(row)

    # --- Reads ---------------------------------------------------------------
    def get_execution(
        self, current: AuthenticatedUser, run_id: uuid.UUID
    ) -> ExecutionRead:
        self._require_owned_run(current, run_id)
        run = self.runs.get_with_outputs(run_id)
        assert run is not None
        return ExecutionRead.model_validate(run)

    def get_logs(
        self, current: AuthenticatedUser, run_id: uuid.UUID
    ) -> list[ExecutionLogRead]:
        self._require_owned_run(current, run_id)
        return [ExecutionLogRead.model_validate(log) for log in self.runs.list_logs(run_id)]

    def get_documents(
        self, current: AuthenticatedUser, run_id: uuid.UUID
    ) -> list[GeneratedDocumentRead]:
        self._require_owned_run(current, run_id)
        return [
            GeneratedDocumentRead.model_validate(doc)
            for doc in self.documents.list_for_run(run_id)
        ]

    def history(
        self, current: AuthenticatedUser, limit: int, offset: int
    ) -> tuple[list[AgentRunRead], int]:
        items, total = self.runs.history_for_user(current.id, limit, offset)
        return [AgentRunRead.model_validate(r) for r in items], total
