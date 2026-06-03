"""Agent-run repository (runs, agent outputs, and execution logs)."""

from __future__ import annotations

import uuid
from datetime import datetime
from typing import Any

from sqlalchemy import func, select
from sqlalchemy.orm import selectinload

from app.models.agent_output import AgentOutput
from app.models.agent_run import AgentRun
from app.models.enums import AgentName, AgentOutputStatus, LogLevel
from app.models.execution_log import ExecutionLog
from app.models.project import Project
from app.repositories.base import BaseRepository


class AgentRunRepository(BaseRepository[AgentRun]):
    """Data access for runs and their related outputs/logs."""

    model = AgentRun

    # --- Runs ----------------------------------------------------------------
    def get_with_outputs(self, run_id: uuid.UUID) -> AgentRun | None:
        stmt = (
            select(AgentRun)
            .where(AgentRun.id == run_id)
            .options(selectinload(AgentRun.outputs))
        )
        return self.db.execute(stmt).scalar_one_or_none()

    def latest_for_project(self, project_id: uuid.UUID) -> AgentRun | None:
        stmt = (
            select(AgentRun)
            .where(AgentRun.project_id == project_id)
            .order_by(AgentRun.created_at.desc())
            .limit(1)
        )
        return self.db.execute(stmt).scalar_one_or_none()

    def history_for_user(
        self, user_id: uuid.UUID, limit: int, offset: int
    ) -> tuple[list[AgentRun], int]:
        """Recent runs across all of a user's projects (dashboard view)."""
        base = (
            select(AgentRun)
            .join(Project, Project.id == AgentRun.project_id)
            .where(Project.user_id == user_id)
        )
        total = int(
            self.db.execute(
                select(func.count()).select_from(base.subquery())
            ).scalar_one()
        )
        stmt = (
            base.order_by(AgentRun.created_at.desc()).limit(limit).offset(offset)
        )
        items = list(self.db.execute(stmt).scalars().all())
        return items, total

    # --- Outputs -------------------------------------------------------------
    def upsert_output(
        self,
        run_id: uuid.UUID,
        agent: AgentName,
        status: AgentOutputStatus,
        output: dict[str, Any] | None = None,
        tokens: int = 0,
        duration_ms: int = 0,
    ) -> AgentOutput:
        """Create or update the single output row for ``(run_id, agent)``."""
        stmt = select(AgentOutput).where(
            AgentOutput.run_id == run_id, AgentOutput.agent == agent
        )
        row = self.db.execute(stmt).scalar_one_or_none()
        if row is None:
            row = AgentOutput(
                run_id=run_id,
                agent=agent,
                status=status,
                output=output,
                tokens=tokens,
                duration_ms=duration_ms,
            )
            self.db.add(row)
        else:
            row.status = status
            row.output = output
            row.tokens = tokens
            row.duration_ms = duration_ms
        self.db.flush()
        return row

    def get_output(
        self, run_id: uuid.UUID, agent: AgentName
    ) -> AgentOutput | None:
        stmt = select(AgentOutput).where(
            AgentOutput.run_id == run_id, AgentOutput.agent == agent
        )
        return self.db.execute(stmt).scalar_one_or_none()

    # --- Logs ----------------------------------------------------------------
    def add_log(
        self,
        run_id: uuid.UUID,
        message: str,
        level: LogLevel = LogLevel.INFO,
        agent: AgentName | None = None,
        meta: dict[str, Any] | None = None,
        ts: datetime | None = None,
    ) -> ExecutionLog:
        log = ExecutionLog(
            run_id=run_id,
            agent=agent,
            level=level,
            message=message,
            meta=meta or {},
        )
        if ts is not None:
            log.ts = ts
        self.db.add(log)
        self.db.flush()
        return log

    def list_logs(self, run_id: uuid.UUID) -> list[ExecutionLog]:
        stmt = (
            select(ExecutionLog)
            .where(ExecutionLog.run_id == run_id)
            .order_by(ExecutionLog.ts)
        )
        return list(self.db.execute(stmt).scalars().all())
