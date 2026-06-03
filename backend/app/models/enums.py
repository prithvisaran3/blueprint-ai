"""Enumerations shared across ORM models and Pydantic schemas."""

from __future__ import annotations

from enum import StrEnum


class ProjectStatus(StrEnum):
    """Lifecycle status of a project."""

    DRAFT = "draft"
    RUNNING = "running"
    COMPLETED = "completed"
    FAILED = "failed"


class RunStatus(StrEnum):
    """Lifecycle status of an agent run."""

    QUEUED = "queued"
    RUNNING = "running"
    COMPLETED = "completed"
    FAILED = "failed"


class AgentName(StrEnum):
    """The seven agents in the Blueprint AI pipeline."""

    ARCHITECT = "architect"
    PLANNER = "planner"
    BACKEND = "backend"
    FRONTEND = "frontend"
    QA = "qa"
    DOCUMENTATION = "documentation"
    CTO_REVIEW = "cto_review"


class AgentOutputStatus(StrEnum):
    """Status of a single agent's output within a run."""

    PENDING = "pending"
    RUNNING = "running"
    COMPLETED = "completed"
    FAILED = "failed"


class LogLevel(StrEnum):
    """Execution log severity."""

    INFO = "info"
    WARN = "warn"
    ERROR = "error"


class DocType(StrEnum):
    """Type of a generated document."""

    SPEC = "spec"
    DEVELOPER_GUIDE = "developer_guide"
    DEPLOYMENT_PLAN = "deployment_plan"
    NOTES = "notes"


# Postgres enum type names (referenced by models and Alembic migration).
PROJECT_STATUS_ENUM = "project_status"
RUN_STATUS_ENUM = "run_status"
AGENT_NAME_ENUM = "agent_name"
AGENT_OUTPUT_STATUS_ENUM = "agent_output_status"
LOG_LEVEL_ENUM = "log_level"
DOC_TYPE_ENUM = "doc_type"
