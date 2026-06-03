"""Placeholder agent outputs for Phase 3.

.. note::
   **Fallback for when no Gemini key is configured.** None of this calls an
   LLM. It produces deterministic, schema-valid placeholder outputs for each
   agent so the frontend, persistence layer, and SSE plumbing run end-to-end
   without a ``GEMINI_API_KEY``. The real Gemini + LangGraph pipeline lives in
   :mod:`app.agents`; its LLM layer (:mod:`app.agents.llm`) calls into these
   builders when ``settings.ai_enabled`` is false.
"""

from __future__ import annotations

from app.models.enums import AgentName, DocType
from app.schemas.agents.architect import (
    ArchitectOutput,
    Component,
    DataEntity,
    TechChoice,
)
from app.schemas.agents.backend import APIEndpoint, BackendOutput, DataModel
from app.schemas.agents.common import (
    CostEstimation,
    CostLineItem,
    DeliveryEstimation,
    DeliveryPhase,
    HealthScore,
    HealthScoreDimension,
    Risk,
    TeamEstimation,
    TeamRole,
)
from app.schemas.agents.cto_review import CTOReviewOutput
from app.schemas.agents.documentation import DocumentationOutput, DocumentDraft
from app.schemas.agents.frontend import FrontendOutput, Route, UIComponent
from app.schemas.agents.planner import Epic, PlannerOutput, Story, Task
from app.schemas.agents.qa import QAOutput, TestCase

# Order matches the LangGraph sequence in plan section 5.
AGENT_SEQUENCE: tuple[AgentName, ...] = (
    AgentName.ARCHITECT,
    AgentName.PLANNER,
    AgentName.BACKEND,
    AgentName.FRONTEND,
    AgentName.QA,
    AgentName.DOCUMENTATION,
    AgentName.CTO_REVIEW,
)


def _architect(idea: str) -> ArchitectOutput:
    return ArchitectOutput(
        summary=f"[STUB] Proposed architecture for: {idea[:120]}",
        pattern="modular monolith",
        tech_stack=[
            TechChoice(category="frontend", choice="React + Vite", rationale="[stub]"),
            TechChoice(category="backend", choice="FastAPI", rationale="[stub]"),
            TechChoice(category="database", choice="PostgreSQL", rationale="[stub]"),
        ],
        components=[
            Component(name="API", responsibility="HTTP layer", depends_on=["Services"]),
            Component(name="Services", responsibility="Business logic", depends_on=["DB"]),
            Component(name="DB", responsibility="Persistence"),
        ],
        data_model=[
            DataEntity(name="User", description="App user", key_fields=["id", "email"]),
        ],
        integrations=["Supabase Auth"],
        diagram_mermaid="flowchart LR\n  UI --> API --> Services --> DB",
    )


def _planner(idea: str) -> PlannerOutput:
    return PlannerOutput(
        summary=f"[STUB] Delivery plan for: {idea[:120]}",
        epics=[
            Epic(
                title="Foundation",
                goal="Stand up the core system",
                stories=[
                    Story(
                        title="Project scaffolding",
                        acceptance_criteria=["Repo builds", "CI passes"],
                        story_points=3,
                        tasks=[Task(title="Init repo", estimate_hours=2)],
                    )
                ],
            )
        ],
    )


def _backend(idea: str) -> BackendOutput:
    return BackendOutput(
        summary=f"[STUB] Backend design for: {idea[:120]}",
        framework="FastAPI",
        endpoints=[APIEndpoint(method="GET", path="/health", auth_required=False)],
        models=[DataModel(name="User", fields=["id", "email"])],
        services=["project_service", "execution_service"],
        dependencies=["fastapi", "sqlalchemy"],
    )


def _frontend(idea: str) -> FrontendOutput:
    return FrontendOutput(
        summary=f"[STUB] Frontend design for: {idea[:120]}",
        framework="React + Vite",
        routes=[Route(path="/", name="Landing")],
        components=[UIComponent(name="Hero", responsibility="Landing hero")],
        state_management="TanStack Query + Zustand",
        styling="Tailwind v4",
        dependencies=["react", "@tanstack/react-query"],
    )


def _qa(idea: str) -> QAOutput:
    return QAOutput(
        summary=f"[STUB] QA strategy for: {idea[:120]}",
        strategy="Pyramid: heavy unit, focused integration, smoke e2e.",
        test_cases=[
            TestCase(title="Health endpoint returns 200", type="integration", priority="high")
        ],
        coverage_targets={"unit": 80.0, "integration": 60.0},
        risks=[Risk(title="Stubbed AI", severity="low", mitigation="Replace in Phase 5")],
        tooling=["pytest"],
    )


def _documentation(idea: str) -> DocumentationOutput:
    return DocumentationOutput(
        summary=f"[STUB] Documentation set for: {idea[:120]}",
        documents=[
            DocumentDraft(
                doc_type=DocType.SPEC,
                title="Technical Specification (stub)",
                content_md=f"# Specification\n\n_Stub generated for_: {idea}\n",
            ),
            DocumentDraft(
                doc_type=DocType.DEVELOPER_GUIDE,
                title="Developer Guide (stub)",
                content_md="# Developer Guide\n\nPlaceholder content.\n",
            ),
        ],
    )


def _health_score() -> HealthScore:
    return HealthScore(
        overall=82.0,
        grade="B+",
        dimensions=[
            HealthScoreDimension(name="architecture", score=85, rationale="[stub]"),
            HealthScoreDimension(name="scalability", score=80, rationale="[stub]"),
            HealthScoreDimension(name="security", score=78, rationale="[stub]"),
            HealthScoreDimension(name="maintainability", score=85, rationale="[stub]"),
        ],
        summary="[STUB] Solid foundation; replace with real analysis in Phase 5.",
    )


def _cto_review(idea: str) -> CTOReviewOutput:
    return CTOReviewOutput(
        summary=f"[STUB] CTO review for: {idea[:120]}",
        verdict="go-with-changes",
        health_score=_health_score(),
        cost_estimation=CostEstimation(
            monthly_total_usd=0.0,
            one_time_usd=0.0,
            line_items=[CostLineItem(label="Supabase free tier", monthly_usd=0.0)],
            assumptions=["Free-tier infrastructure"],
        ),
        team_estimation=TeamEstimation(
            total_headcount=3,
            roles=[
                TeamRole(role="Backend Engineer", count=1, seniority="senior"),
                TeamRole(role="Frontend Engineer", count=1, seniority="mid"),
                TeamRole(role="Full-stack Engineer", count=1, seniority="mid"),
            ],
        ),
        delivery_estimation=DeliveryEstimation(
            total_weeks=8,
            confidence="medium",
            phases=[
                DeliveryPhase(name="Foundation", duration_weeks=3, deliverables=["MVP"]),
                DeliveryPhase(name="Hardening", duration_weeks=5, deliverables=["GA"]),
            ],
        ),
        key_risks=[Risk(title="Scope creep", severity="medium", mitigation="Lock MVP")],
        recommendations=["Ship the MVP", "Add observability early"],
    )


_BUILDERS = {
    AgentName.ARCHITECT: _architect,
    AgentName.PLANNER: _planner,
    AgentName.BACKEND: _backend,
    AgentName.FRONTEND: _frontend,
    AgentName.QA: _qa,
    AgentName.DOCUMENTATION: _documentation,
    AgentName.CTO_REVIEW: _cto_review,
}


def build_agent_output(agent: AgentName, idea: str) -> dict:
    """Return a schema-valid placeholder output dict for ``agent``."""
    return _BUILDERS[agent](idea).model_dump(mode="json")


def build_health_score() -> dict:
    """Return the placeholder run-level health score."""
    return _health_score().model_dump(mode="json")
