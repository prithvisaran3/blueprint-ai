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
from app.schemas.agents.backend import APIEndpoint, BackendOutput, CodeArtifact as BackendCodeArtifact, DataModel
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
from app.schemas.agents.frontend import CodeArtifact as FrontendCodeArtifact, FrontendOutput, Route, UIComponent
from app.schemas.agents.planner import Epic, Milestone, PlannerOutput, Story, Task
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


def _label(idea: str) -> str:
    """Short, human-friendly product label derived from the idea."""
    text = " ".join((idea or "the product").strip().split())
    return text[:80] + ("…" if len(text) > 80 else "")


def _architect(idea: str) -> ArchitectOutput:
    label = _label(idea)
    return ArchitectOutput(
        summary=(
            f"A modular, cloud-native architecture for {label}. A React client "
            "talks to a FastAPI gateway that fronts focused domain services, with "
            "Postgres for persistence, Redis for caching/queues, and Supabase for "
            "auth and file storage."
        ),
        pattern="modular monolith with service-oriented seams (split later)",
        tech_stack=[
            TechChoice(category="frontend", choice="React 19 + Vite + TypeScript", rationale="Fast DX, huge ecosystem, type safety."),
            TechChoice(category="styling", choice="Tailwind CSS + shadcn/ui", rationale="Consistent, accessible UI fast."),
            TechChoice(category="backend", choice="FastAPI (Python)", rationale="Async, typed, great for APIs + ML."),
            TechChoice(category="database", choice="PostgreSQL (Supabase)", rationale="Relational integrity + managed hosting."),
            TechChoice(category="cache/queue", choice="Redis", rationale="Caching, rate limiting, background jobs."),
            TechChoice(category="auth", choice="Supabase Auth (JWT)", rationale="Email/social login, RLS, zero-ops."),
            TechChoice(category="storage", choice="Supabase Storage / S3", rationale="Media and user uploads."),
            TechChoice(category="deploy", choice="Vercel (web) + Render (API)", rationale="Free tiers, push-to-deploy CI."),
        ],
        components=[
            Component(name="Web Client", responsibility="React SPA / user interface", depends_on=["API Gateway", "Auth"]),
            Component(name="API Gateway", responsibility="REST entrypoint, routing, validation", depends_on=["Core Service", "Auth"]),
            Component(name="Auth", responsibility="Authentication & authorization (JWT)", depends_on=["Database"]),
            Component(name="Core Service", responsibility="Primary domain business logic", depends_on=["Database", "Cache", "Storage"]),
            Component(name="Notification Service", responsibility="Email / push / in-app alerts", depends_on=["Queue"]),
            Component(name="Search Service", responsibility="Full-text & filtered search", depends_on=["Database"]),
            Component(name="Queue", responsibility="Async background jobs", depends_on=["Cache"]),
            Component(name="Cache", responsibility="Hot-path caching & rate limits", depends_on=[]),
            Component(name="Database", responsibility="Source-of-truth persistence", depends_on=[]),
            Component(name="Storage", responsibility="File & media object storage", depends_on=[]),
        ],
        data_model=[
            DataEntity(name="User", description="Authenticated account", key_fields=["id", "email", "created_at"]),
            DataEntity(name="Profile", description="User profile & preferences", key_fields=["id", "user_id", "display_name"]),
            DataEntity(name="Session", description="Auth session / token metadata", key_fields=["id", "user_id", "expires_at"]),
            DataEntity(name="Resource", description="Primary domain object for this product", key_fields=["id", "owner_id", "status"]),
            DataEntity(name="Activity", description="Audit / event log", key_fields=["id", "user_id", "type", "created_at"]),
            DataEntity(name="Notification", description="Outbound user notification", key_fields=["id", "user_id", "read_at"]),
        ],
        integrations=["Supabase Auth", "Supabase Storage", "Resend/SMTP email", "Sentry (errors)", "PostHog (analytics)"],
        diagram_mermaid=(
            "flowchart TD\n"
            "  subgraph Client\n"
            "    UI[Web Client]\n"
            "  end\n"
            "  subgraph Edge\n"
            "    GW[API Gateway]\n"
            "    AUTH[Auth / JWT]\n"
            "  end\n"
            "  subgraph Services\n"
            "    CORE[Core Service]\n"
            "    SEARCH[Search Service]\n"
            "    NOTIF[Notification Service]\n"
            "    Q[Job Queue]\n"
            "  end\n"
            "  subgraph Data\n"
            "    DB[(PostgreSQL)]\n"
            "    CACHE[(Redis)]\n"
            "    STORE[(Object Storage)]\n"
            "  end\n"
            "  subgraph External\n"
            "    EMAIL[Email Provider]\n"
            "  end\n"
            "  UI -->|HTTPS| GW\n"
            "  UI -->|login| AUTH\n"
            "  GW --> AUTH\n"
            "  GW --> CORE\n"
            "  GW --> SEARCH\n"
            "  CORE --> DB\n"
            "  CORE --> CACHE\n"
            "  CORE --> STORE\n"
            "  CORE --> Q\n"
            "  SEARCH --> DB\n"
            "  Q --> NOTIF\n"
            "  NOTIF --> EMAIL\n"
            "  AUTH --> DB\n"
        ),
    )


def _planner(idea: str) -> PlannerOutput:
    label = _label(idea)
    return PlannerOutput(
        summary=(
            f"A phased delivery plan for {label}: stand up the foundation, ship a "
            "usable vertical slice, build out the core features, then harden and "
            "launch."
        ),
        epics=[
            Epic(
                title="Foundation & Auth",
                goal="Stand up the repo, CI/CD, and authentication.",
                stories=[
                    Story(
                        title="Project scaffolding & CI",
                        as_a="developer", i_want="a working monorepo with CI",
                        so_that="every change is built and tested automatically",
                        acceptance_criteria=["Frontend & backend build", "CI runs lint + tests on PRs"],
                        story_points=3,
                        tasks=[
                            Task(title="Initialize monorepo & tooling", estimate_hours=4),
                            Task(title="Set up GitHub Actions CI", estimate_hours=4),
                        ],
                    ),
                    Story(
                        title="User authentication",
                        as_a="user", i_want="to sign up and log in securely",
                        so_that="my data is private to me",
                        acceptance_criteria=["Email + social login work", "JWT verified on API", "Protected routes redirect"],
                        story_points=5,
                        tasks=[
                            Task(title="Wire Supabase Auth on client", estimate_hours=6),
                            Task(title="Verify JWT on backend middleware", estimate_hours=5),
                            Task(title="Add auth guards to routes", estimate_hours=3),
                        ],
                    ),
                ],
            ),
            Epic(
                title="Core Domain",
                goal="Implement the primary entities and their CRUD flows.",
                stories=[
                    Story(
                        title="Resource data model & API",
                        as_a="user", i_want="to create, view, edit and delete my items",
                        so_that="I can manage my data",
                        acceptance_criteria=["CRUD endpoints exist", "Validation + errors handled", "Owned by current user"],
                        story_points=8,
                        tasks=[
                            Task(title="Define models & migrations", estimate_hours=6),
                            Task(title="Implement CRUD endpoints", estimate_hours=8),
                            Task(title="Build list + detail UI", estimate_hours=8),
                        ],
                    ),
                ],
            ),
            Epic(
                title="Signature Feature",
                goal="Build the feature that makes this product unique.",
                stories=[
                    Story(
                        title="Core differentiating flow",
                        as_a="user", i_want="the product's headline capability",
                        so_that="I get the value I came for",
                        acceptance_criteria=["Happy path works end-to-end", "Edge cases handled gracefully"],
                        story_points=8,
                        tasks=[
                            Task(title="Backend logic for signature feature", estimate_hours=10),
                            Task(title="Interactive UI for the feature", estimate_hours=10),
                        ],
                    ),
                ],
            ),
            Epic(
                title="Quality, Observability & Launch",
                goal="Harden, instrument, and ship to production.",
                stories=[
                    Story(
                        title="Testing & monitoring",
                        as_a="team", i_want="tests, error tracking and analytics",
                        so_that="we can ship and operate confidently",
                        acceptance_criteria=["Critical paths covered by tests", "Errors reported to Sentry", "Deployed to prod"],
                        story_points=5,
                        tasks=[
                            Task(title="Add unit + e2e tests", estimate_hours=8),
                            Task(title="Wire Sentry + analytics", estimate_hours=3),
                            Task(title="Production deploy + smoke test", estimate_hours=4),
                        ],
                    ),
                ],
            ),
        ],
        milestones=[
            Milestone(name="M1 – Walking Skeleton", epics=["Foundation & Auth"]),
            Milestone(name="M2 – Core Product", epics=["Core Domain", "Signature Feature"]),
            Milestone(name="M3 – Launch", epics=["Quality, Observability & Launch"]),
        ],
    )


def _backend(idea: str) -> BackendOutput:
    label = _label(idea)
    return BackendOutput(
        summary=(
            f"A FastAPI backend for {label} with JWT auth, RESTful CRUD for the "
            "core entities, the signature-feature endpoints, and search."
        ),
        framework="FastAPI",
        endpoints=[
            APIEndpoint(method="POST", path="/auth/signup", auth_required=False, description="Create an account"),
            APIEndpoint(method="POST", path="/auth/login", auth_required=False, description="Authenticate, return JWT"),
            APIEndpoint(method="GET", path="/me", auth_required=True, description="Current user profile"),
            APIEndpoint(method="GET", path="/resources", auth_required=True, description="List the user's resources"),
            APIEndpoint(method="POST", path="/resources", auth_required=True, description="Create a resource"),
            APIEndpoint(method="GET", path="/resources/{id}", auth_required=True, description="Get one resource"),
            APIEndpoint(method="PATCH", path="/resources/{id}", auth_required=True, description="Update a resource"),
            APIEndpoint(method="DELETE", path="/resources/{id}", auth_required=True, description="Delete a resource"),
            APIEndpoint(method="GET", path="/search", auth_required=True, description="Search & filter resources"),
            APIEndpoint(method="GET", path="/notifications", auth_required=True, description="List notifications"),
            APIEndpoint(method="GET", path="/health", auth_required=False, description="Liveness probe"),
        ],
        models=[
            DataModel(name="User", fields=["id", "email", "password_hash", "created_at"]),
            DataModel(name="Profile", fields=["id", "user_id", "display_name", "avatar_url"]),
            DataModel(name="Resource", fields=["id", "owner_id", "title", "status", "created_at"]),
            DataModel(name="Activity", fields=["id", "user_id", "type", "payload", "created_at"]),
            DataModel(name="Notification", fields=["id", "user_id", "message", "read_at"]),
        ],
        services=["auth_service", "resource_service", "search_service", "notification_service"],
        dependencies=["fastapi", "uvicorn", "sqlalchemy", "alembic", "pydantic", "redis", "python-jose"],
        code_artifacts=[
            BackendCodeArtifact(
                path="app/api/resources.py",
                language="python",
                description="CRUD router for the core resource entity.",
                snippet=(
                    "from fastapi import APIRouter, Depends\n"
                    "from app.deps import current_user, get_service\n\n"
                    "router = APIRouter(prefix=\"/resources\", tags=[\"resources\"])\n\n"
                    "@router.get(\"\")\n"
                    "async def list_resources(user=Depends(current_user), svc=Depends(get_service)):\n"
                    "    return await svc.list_for_user(user.id)\n\n"
                    "@router.post(\"\", status_code=201)\n"
                    "async def create_resource(body: ResourceIn, user=Depends(current_user), svc=Depends(get_service)):\n"
                    "    return await svc.create(user.id, body)\n"
                ),
            ),
            BackendCodeArtifact(
                path="app/services/resource_service.py",
                language="python",
                description="Business logic for resources.",
                snippet=(
                    "class ResourceService:\n"
                    "    def __init__(self, repo):\n"
                    "        self.repo = repo\n\n"
                    "    async def list_for_user(self, user_id: str):\n"
                    "        return await self.repo.find_by_owner(user_id)\n\n"
                    "    async def create(self, user_id: str, body):\n"
                    "        return await self.repo.insert(owner_id=user_id, **body.model_dump())\n"
                ),
            ),
        ],
    )


def _frontend(idea: str) -> FrontendOutput:
    label = _label(idea)
    return FrontendOutput(
        summary=(
            f"A React + Vite frontend for {label} with auth, a dashboard, full "
            "CRUD screens, the signature-feature flow, search, and settings."
        ),
        framework="React 19 + Vite + TypeScript",
        routes=[
            Route(path="/", name="Landing", description="Marketing / value proposition"),
            Route(path="/login", name="Login", description="Sign in / sign up"),
            Route(path="/dashboard", name="Dashboard", description="Overview & key metrics"),
            Route(path="/resources", name="Resource List", description="Browse and filter items"),
            Route(path="/resources/:id", name="Resource Detail", description="View / edit a single item"),
            Route(path="/create", name="Create", description="The signature creation flow"),
            Route(path="/search", name="Search", description="Search & filter results"),
            Route(path="/settings", name="Settings", description="Profile & preferences"),
        ],
        components=[
            UIComponent(name="AppShell", responsibility="Layout, nav, auth state", props=["children"]),
            UIComponent(name="ResourceCard", responsibility="Summarize a resource", props=["resource", "onOpen"]),
            UIComponent(name="ResourceForm", responsibility="Create / edit resource", props=["initial", "onSubmit"]),
            UIComponent(name="SearchBar", responsibility="Debounced search input", props=["value", "onChange"]),
            UIComponent(name="DataTable", responsibility="Sortable, paginated list", props=["rows", "columns"]),
            UIComponent(name="EmptyState", responsibility="Friendly empty/error states", props=["title", "action"]),
            UIComponent(name="Toast", responsibility="Transient notifications", props=["message", "variant"]),
        ],
        state_management="TanStack Query (server state) + Zustand (UI state)",
        styling="Tailwind CSS + shadcn/ui",
        dependencies=["react", "react-router-dom", "@tanstack/react-query", "zustand", "zod", "react-hook-form", "tailwindcss"],
        code_artifacts=[
            FrontendCodeArtifact(
                path="src/routes/ResourceList.tsx",
                language="tsx",
                description="List screen backed by the API via TanStack Query.",
                snippet=(
                    "import { useQuery } from '@tanstack/react-query'\n"
                    "import { api } from '@/lib/api'\n\n"
                    "export function ResourceList() {\n"
                    "  const { data, isLoading } = useQuery({\n"
                    "    queryKey: ['resources'],\n"
                    "    queryFn: () => api.get('/resources'),\n"
                    "  })\n"
                    "  if (isLoading) return <Spinner />\n"
                    "  return <div className=\"grid gap-4\">{data.map(r => <ResourceCard key={r.id} resource={r} />)}</div>\n"
                    "}\n"
                ),
            ),
            FrontendCodeArtifact(
                path="src/lib/api.ts",
                language="ts",
                description="Typed fetch client that attaches the auth token.",
                snippet=(
                    "import { getToken } from './auth'\n\n"
                    "export const api = {\n"
                    "  async get(path: string) {\n"
                    "    const res = await fetch(`${import.meta.env.VITE_API_URL}${path}`, {\n"
                    "      headers: { Authorization: `Bearer ${await getToken()}` },\n"
                    "    })\n"
                    "    if (!res.ok) throw new Error(await res.text())\n"
                    "    return res.json()\n"
                    "  },\n"
                    "}\n"
                ),
            ),
        ],
    )


def _qa(idea: str) -> QAOutput:
    return QAOutput(
        summary=(
            f"A risk-based test strategy for {_label(idea)}: a broad unit base, "
            "focused integration tests on the API, and smoke e2e on the critical "
            "user journeys."
        ),
        strategy="Test pyramid — heavy unit, focused integration, smoke e2e on the happy paths.",
        test_cases=[
            TestCase(title="Sign-up creates a user", type="integration",
                     given="a new email", when="the user signs up", then="an account + session exist", priority="high"),
            TestCase(title="Login rejects bad credentials", type="integration",
                     given="a wrong password", when="the user logs in", then="a 401 is returned", priority="high"),
            TestCase(title="Protected route requires auth", type="integration",
                     given="no token", when="calling /resources", then="a 401 is returned", priority="high"),
            TestCase(title="Create resource happy path", type="e2e",
                     given="a logged-in user", when="they create a resource", then="it appears in their list", priority="high"),
            TestCase(title="Resource validation rejects bad input", type="unit",
                     given="an invalid payload", when="validating", then="a 422 with field errors", priority="medium"),
            TestCase(title="Search returns relevant results", type="integration",
                     given="seeded data", when="searching a term", then="matching items are returned", priority="medium"),
            TestCase(title="Owner-only access enforced", type="integration",
                     given="another user's resource", when="requesting it", then="a 403/404 is returned", priority="high"),
        ],
        coverage_targets={"unit": 80.0, "integration": 60.0, "e2e": 40.0},
        risks=[
            Risk(title="Auth/permission gaps", severity="high", likelihood="medium",
                 mitigation="Integration tests on every protected route + RLS policies."),
            Risk(title="Data integrity under concurrency", severity="medium", likelihood="medium",
                 mitigation="DB constraints + transactional writes; load test hot paths."),
            Risk(title="Third-party/API rate limits", severity="medium", likelihood="medium",
                 mitigation="Caching, retries with backoff, graceful degradation."),
        ],
        tooling=["pytest", "httpx", "Playwright", "Vitest", "Testing Library", "GitHub Actions"],
    )


def _documentation(idea: str) -> DocumentationOutput:
    label = _label(idea)
    return DocumentationOutput(
        summary=f"Core documentation set for {label}: a technical spec, a developer guide, and a deployment plan.",
        documents=[
            DocumentDraft(
                doc_type=DocType.SPEC,
                title="Technical Specification",
                content_md=(
                    f"# Technical Specification\n\n## Overview\n{label}.\n\n"
                    "## Architecture\nA React client talks to a FastAPI gateway over REST. "
                    "Domain services own business logic; PostgreSQL is the source of truth, "
                    "Redis handles caching and background jobs, and object storage holds media.\n\n"
                    "## Core Entities\n- **User / Profile** — accounts and preferences\n"
                    "- **Resource** — the primary domain object\n- **Activity** — audit log\n"
                    "- **Notification** — outbound alerts\n\n"
                    "## API\nJWT-authenticated REST endpoints for auth, CRUD on resources, "
                    "search, and notifications.\n\n## Non-Functional\nAuth via Supabase, "
                    "p95 < 300ms on hot paths, observability via Sentry + analytics.\n"
                ),
            ),
            DocumentDraft(
                doc_type=DocType.DEVELOPER_GUIDE,
                title="Developer Guide",
                content_md=(
                    "# Developer Guide\n\n## Prerequisites\nNode 20+, Python 3.12+, a Supabase project.\n\n"
                    "## Setup\n```bash\n# Frontend\ncd frontend && npm install && npm run dev\n\n"
                    "# Backend\ncd backend && uv sync && uvicorn app.main:app --reload\n```\n\n"
                    "## Environment\nCopy `.env.example` to `.env` and fill in Supabase + API keys.\n\n"
                    "## Project Layout\n- `frontend/` — React + Vite SPA\n- `backend/` — FastAPI service\n\n"
                    "## Conventions\nTyped end-to-end (TypeScript + Pydantic), feature-based folders, "
                    "conventional commits, PRs gated by CI.\n"
                ),
            ),
            DocumentDraft(
                doc_type=DocType.DEPLOYMENT_PLAN,
                title="Deployment Plan",
                content_md=(
                    "# Deployment Plan\n\n## Targets\n- **Frontend** → Vercel\n- **Backend** → Render\n"
                    "- **Database / Auth / Storage** → Supabase\n\n## Pipeline\nGitHub Actions runs "
                    "lint + tests on every PR, then deploys `main` to production.\n\n## Rollout\n"
                    "Run DB migrations (Alembic), deploy backend, then frontend; smoke-test the health "
                    "endpoint and a core user journey.\n"
                ),
            ),
        ],
    )


def _health_score() -> HealthScore:
    return HealthScore(
        overall=84.0,
        grade="A-",
        dimensions=[
            HealthScoreDimension(name="architecture", score=88,
                                 rationale="Clean separation of concerns with clear service seams."),
            HealthScoreDimension(name="scalability", score=82,
                                 rationale="Stateless API + cache/queue scale horizontally; DB is the main bottleneck."),
            HealthScoreDimension(name="security", score=80,
                                 rationale="Managed auth + RLS; needs rate limiting and input hardening."),
            HealthScoreDimension(name="maintainability", score=86,
                                 rationale="Typed end-to-end, modular, well-documented."),
        ],
        summary="A solid, modern foundation that can ship an MVP quickly and scale incrementally.",
    )


def _cto_review(idea: str) -> CTOReviewOutput:
    return CTOReviewOutput(
        summary=(
            f"{_label(idea)} is a viable, well-scoped product on a modern, low-cost stack. "
            "Proceed to an MVP, with attention to auth hardening and observability."
        ),
        verdict="go-with-changes",
        health_score=_health_score(),
        cost_estimation=CostEstimation(
            monthly_total_usd=45.0,
            one_time_usd=0.0,
            line_items=[
                CostLineItem(label="Supabase (DB/Auth/Storage)", monthly_usd=25.0, notes="Pro tier once past free limits"),
                CostLineItem(label="Render (API hosting)", monthly_usd=7.0, notes="Starter instance"),
                CostLineItem(label="Vercel (frontend)", monthly_usd=0.0, notes="Hobby/free"),
                CostLineItem(label="Email + monitoring", monthly_usd=13.0, notes="Resend + Sentry starter"),
            ],
            assumptions=["Early-stage traffic", "Managed services over self-hosting"],
        ),
        team_estimation=TeamEstimation(
            total_headcount=3,
            roles=[
                TeamRole(role="Full-stack Lead", count=1, seniority="senior"),
                TeamRole(role="Frontend Engineer", count=1, seniority="mid"),
                TeamRole(role="Backend Engineer", count=1, seniority="mid"),
            ],
            notes="A part-time designer/PM accelerates the signature feature.",
        ),
        delivery_estimation=DeliveryEstimation(
            total_weeks=10,
            confidence="medium",
            phases=[
                DeliveryPhase(name="Foundation & Auth", duration_weeks=2, deliverables=["Repo, CI, auth"]),
                DeliveryPhase(name="Core Product", duration_weeks=5, deliverables=["CRUD", "signature feature"]),
                DeliveryPhase(name="Quality & Launch", duration_weeks=3, deliverables=["Tests", "monitoring", "prod deploy"]),
            ],
        ),
        key_risks=[
            Risk(title="Scope creep on the signature feature", severity="medium", likelihood="high",
                 mitigation="Lock a thin MVP of the headline flow before polishing."),
            Risk(title="Auth & data-access bugs", severity="high", likelihood="medium",
                 mitigation="RLS + integration tests on every protected route."),
            Risk(title="Free-tier limits at scale", severity="low", likelihood="medium",
                 mitigation="Budget for paid tiers; add caching early."),
        ],
        recommendations=[
            "Ship a thin vertical slice of the signature feature first.",
            "Add Sentry + analytics from day one.",
            "Harden auth: rate limiting, input validation, RLS policies.",
            "Write integration tests for all protected endpoints.",
        ],
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
