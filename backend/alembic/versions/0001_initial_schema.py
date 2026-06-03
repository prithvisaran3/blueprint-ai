"""initial schema

Creates the full Blueprint AI schema (plan section 3): users, projects,
feature_requests, agent_runs, agent_outputs, execution_logs,
generated_documents, analytics — with their Postgres enum types.

Revision ID: 0001_initial_schema
Revises:
Create Date: 2026-06-03

"""
from __future__ import annotations

from collections.abc import Sequence

import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

from alembic import op

# revision identifiers, used by Alembic.
revision: str = "0001_initial_schema"
down_revision: str | None = None
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None

# --- Enum types --------------------------------------------------------------
# create_type=False so the columns don't try to emit CREATE TYPE themselves;
# we create/drop them explicitly (works in offline `--sql` mode).
project_status = postgresql.ENUM(
    "draft", "running", "completed", "failed", name="project_status", create_type=False
)
run_status = postgresql.ENUM(
    "queued", "running", "completed", "failed", name="run_status", create_type=False
)
agent_name = postgresql.ENUM(
    "architect",
    "planner",
    "backend",
    "frontend",
    "qa",
    "documentation",
    "cto_review",
    name="agent_name",
    create_type=False,
)
agent_output_status = postgresql.ENUM(
    "pending", "running", "completed", "failed", name="agent_output_status", create_type=False
)
log_level = postgresql.ENUM("info", "warn", "error", name="log_level", create_type=False)
doc_type = postgresql.ENUM(
    "spec", "developer_guide", "deployment_plan", "notes", name="doc_type", create_type=False
)

_ENUMS = (project_status, run_status, agent_name, agent_output_status, log_level, doc_type)


def upgrade() -> None:
    bind = op.get_bind()
    for enum in _ENUMS:
        enum.create(bind, checkfirst=True)

    op.create_table(
        "users",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("email", sa.String(length=320), nullable=False),
        sa.Column("display_name", sa.String(length=255), nullable=True),
        sa.Column("avatar_url", sa.String(length=1024), nullable=True),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.PrimaryKeyConstraint("id", name="pk_users"),
        sa.UniqueConstraint("email", name="uq_users_email"),
    )

    op.create_table(
        "projects",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("user_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("name", sa.String(length=255), nullable=False),
        sa.Column("idea_prompt", sa.Text(), nullable=False),
        sa.Column("status", project_status, nullable=False),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.ForeignKeyConstraint(
            ["user_id"], ["users.id"], name="fk_projects_user_id_users", ondelete="CASCADE"
        ),
        sa.PrimaryKeyConstraint("id", name="pk_projects"),
    )
    op.create_index("ix_projects_user_id", "projects", ["user_id"])

    op.create_table(
        "feature_requests",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("project_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("raw_prompt", sa.Text(), nullable=False),
        sa.Column("parsed_constraints", postgresql.JSONB(), nullable=False),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.ForeignKeyConstraint(
            ["project_id"],
            ["projects.id"],
            name="fk_feature_requests_project_id_projects",
            ondelete="CASCADE",
        ),
        sa.PrimaryKeyConstraint("id", name="pk_feature_requests"),
    )
    op.create_index("ix_feature_requests_project_id", "feature_requests", ["project_id"])

    op.create_table(
        "agent_runs",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("project_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("status", run_status, nullable=False),
        sa.Column("started_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("finished_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("total_tokens", sa.Integer(), nullable=False),
        sa.Column("total_duration_ms", sa.Integer(), nullable=False),
        sa.Column("health_score", postgresql.JSONB(), nullable=True),
        sa.Column("error", sa.Text(), nullable=True),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.ForeignKeyConstraint(
            ["project_id"],
            ["projects.id"],
            name="fk_agent_runs_project_id_projects",
            ondelete="CASCADE",
        ),
        sa.PrimaryKeyConstraint("id", name="pk_agent_runs"),
    )
    op.create_index("ix_agent_runs_project_id", "agent_runs", ["project_id"])

    op.create_table(
        "agent_outputs",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("run_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("agent", agent_name, nullable=False),
        sa.Column("status", agent_output_status, nullable=False),
        sa.Column("output", postgresql.JSONB(), nullable=True),
        sa.Column("tokens", sa.Integer(), nullable=False),
        sa.Column("duration_ms", sa.Integer(), nullable=False),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.ForeignKeyConstraint(
            ["run_id"],
            ["agent_runs.id"],
            name="fk_agent_outputs_run_id_agent_runs",
            ondelete="CASCADE",
        ),
        sa.PrimaryKeyConstraint("id", name="pk_agent_outputs"),
        sa.UniqueConstraint("run_id", "agent", name="uq_agent_outputs_run_id_agent"),
    )
    op.create_index("ix_agent_outputs_run_id", "agent_outputs", ["run_id"])

    op.create_table(
        "execution_logs",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("run_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("agent", agent_name, nullable=True),
        sa.Column("level", log_level, nullable=False),
        sa.Column("message", sa.Text(), nullable=False),
        sa.Column("meta", postgresql.JSONB(), nullable=False),
        sa.Column(
            "ts",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.ForeignKeyConstraint(
            ["run_id"],
            ["agent_runs.id"],
            name="fk_execution_logs_run_id_agent_runs",
            ondelete="CASCADE",
        ),
        sa.PrimaryKeyConstraint("id", name="pk_execution_logs"),
    )
    op.create_index("ix_execution_logs_run_id", "execution_logs", ["run_id"])
    op.create_index("ix_execution_logs_ts", "execution_logs", ["ts"])

    op.create_table(
        "generated_documents",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("project_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("run_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("doc_type", doc_type, nullable=False),
        sa.Column("title", sa.String(length=512), nullable=False),
        sa.Column("content_md", sa.Text(), nullable=False),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.ForeignKeyConstraint(
            ["project_id"],
            ["projects.id"],
            name="fk_generated_documents_project_id_projects",
            ondelete="CASCADE",
        ),
        sa.ForeignKeyConstraint(
            ["run_id"],
            ["agent_runs.id"],
            name="fk_generated_documents_run_id_agent_runs",
            ondelete="CASCADE",
        ),
        sa.PrimaryKeyConstraint("id", name="pk_generated_documents"),
    )
    op.create_index(
        "ix_generated_documents_project_id", "generated_documents", ["project_id"]
    )
    op.create_index("ix_generated_documents_run_id", "generated_documents", ["run_id"])

    op.create_table(
        "analytics",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("user_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("event_type", sa.String(length=128), nullable=False),
        sa.Column("project_id", postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column("run_id", postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column("props", postgresql.JSONB(), nullable=False),
        sa.Column(
            "ts",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.ForeignKeyConstraint(
            ["user_id"], ["users.id"], name="fk_analytics_user_id_users", ondelete="CASCADE"
        ),
        sa.ForeignKeyConstraint(
            ["project_id"],
            ["projects.id"],
            name="fk_analytics_project_id_projects",
            ondelete="SET NULL",
        ),
        sa.ForeignKeyConstraint(
            ["run_id"],
            ["agent_runs.id"],
            name="fk_analytics_run_id_agent_runs",
            ondelete="SET NULL",
        ),
        sa.PrimaryKeyConstraint("id", name="pk_analytics"),
    )
    op.create_index("ix_analytics_user_id", "analytics", ["user_id"])
    op.create_index("ix_analytics_event_type", "analytics", ["event_type"])
    op.create_index("ix_analytics_ts", "analytics", ["ts"])


def downgrade() -> None:
    op.drop_index("ix_analytics_ts", table_name="analytics")
    op.drop_index("ix_analytics_event_type", table_name="analytics")
    op.drop_index("ix_analytics_user_id", table_name="analytics")
    op.drop_table("analytics")

    op.drop_index("ix_generated_documents_run_id", table_name="generated_documents")
    op.drop_index("ix_generated_documents_project_id", table_name="generated_documents")
    op.drop_table("generated_documents")

    op.drop_index("ix_execution_logs_ts", table_name="execution_logs")
    op.drop_index("ix_execution_logs_run_id", table_name="execution_logs")
    op.drop_table("execution_logs")

    op.drop_index("ix_agent_outputs_run_id", table_name="agent_outputs")
    op.drop_table("agent_outputs")

    op.drop_index("ix_agent_runs_project_id", table_name="agent_runs")
    op.drop_table("agent_runs")

    op.drop_index("ix_feature_requests_project_id", table_name="feature_requests")
    op.drop_table("feature_requests")

    op.drop_index("ix_projects_user_id", table_name="projects")
    op.drop_table("projects")

    op.drop_table("users")

    bind = op.get_bind()
    for enum in reversed(_ENUMS):
        enum.drop(bind, checkfirst=True)
