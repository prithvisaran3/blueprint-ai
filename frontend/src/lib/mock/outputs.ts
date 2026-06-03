import type {
  ArchitectOutput,
  PlannerOutput,
  CodeAgentOutput,
  QaOutput,
  DocumentationOutput,
  CtoReviewOutput,
} from '@/types'

export const mockArchitect: ArchitectOutput = {
  summary:
    'A real-time collaborative task platform built on a serverless-friendly stack: React SPA, FastAPI gateway, Postgres, and a Redis-backed websocket fan-out for presence and live updates.',
  stack: [
    { category: 'Frontend', choice: 'React + Vite + TypeScript', rationale: 'Fast DX, typed UI, instant HMR.' },
    { category: 'API', choice: 'FastAPI (Python)', rationale: 'Async-first, automatic OpenAPI, Pydantic validation.' },
    { category: 'Database', choice: 'PostgreSQL', rationale: 'Relational integrity for tasks, projects, and members.' },
    { category: 'Realtime', choice: 'Redis Pub/Sub + WebSockets', rationale: 'Low-latency presence and live task updates.' },
    { category: 'Auth', choice: 'JWT + OAuth providers', rationale: 'Stateless sessions, social sign-in.' },
    { category: 'Hosting', choice: 'Vercel + Render + Supabase', rationale: 'Generous free tiers, simple CI/CD.' },
  ],
  nodes: [
    { id: 'web', label: 'Web App', kind: 'client', description: 'React SPA served from the edge.' },
    { id: 'gateway', label: 'API Gateway', kind: 'service', description: 'FastAPI REST + WebSocket gateway.' },
    { id: 'worker', label: 'Task Worker', kind: 'service', description: 'Async jobs: notifications, digests.' },
    { id: 'db', label: 'PostgreSQL', kind: 'datastore', description: 'Primary relational store.' },
    { id: 'cache', label: 'Redis', kind: 'datastore', description: 'Pub/Sub + ephemeral presence.' },
    { id: 'auth', label: 'Auth Provider', kind: 'external', description: 'OAuth / identity provider.' },
  ],
  edges: [
    { source: 'web', target: 'gateway', label: 'REST + WS' },
    { source: 'gateway', target: 'db', label: 'SQL' },
    { source: 'gateway', target: 'cache', label: 'pub/sub' },
    { source: 'gateway', target: 'auth', label: 'verify' },
    { source: 'worker', target: 'db', label: 'SQL' },
    { source: 'worker', target: 'cache', label: 'subscribe' },
  ],
  contentMd: `## System Architecture

The platform follows a **layered, event-driven architecture** optimized for real-time collaboration.

### Key decisions
- **Stateless API gateway** so we can scale horizontally behind a load balancer.
- **Redis Pub/Sub** decouples websocket fan-out from request handling.
- **Optimistic UI** on the client with server reconciliation for conflict-free editing.

### Data flow
1. Client authenticates and opens a websocket to the gateway.
2. Mutations hit REST endpoints; the gateway persists to Postgres and publishes an event to Redis.
3. Subscribed gateway instances push the event to connected clients.

> The design favors **read scalability** and keeps the write path simple and auditable.`,
}

export const mockPlanner: PlannerOutput = {
  summary:
    'Three epics across an 8-week delivery: foundations, collaboration core, and polish/launch. Sequenced to ship a usable vertical slice by week 4.',
  epics: [
    {
      id: 'E1',
      title: 'Foundations',
      description: 'Auth, project/task data model, and base UI shell.',
      stories: [
        {
          id: 'S1',
          title: 'Authentication & accounts',
          tasks: [
            { id: 'T1', title: 'OAuth sign-in flow', estimate: '3d' },
            { id: 'T2', title: 'JWT session handling', estimate: '2d' },
            { id: 'T3', title: 'Account settings page', estimate: '2d' },
          ],
        },
        {
          id: 'S2',
          title: 'Task data model',
          tasks: [
            { id: 'T4', title: 'Schema + migrations', estimate: '2d' },
            { id: 'T5', title: 'CRUD endpoints', estimate: '3d' },
          ],
        },
      ],
    },
    {
      id: 'E2',
      title: 'Collaboration Core',
      description: 'Realtime updates, presence, and board UI.',
      stories: [
        {
          id: 'S3',
          title: 'Realtime engine',
          tasks: [
            { id: 'T6', title: 'WebSocket gateway', estimate: '4d' },
            { id: 'T7', title: 'Redis pub/sub fan-out', estimate: '3d' },
            { id: 'T8', title: 'Presence indicators', estimate: '2d' },
          ],
        },
        {
          id: 'S4',
          title: 'Kanban board',
          tasks: [
            { id: 'T9', title: 'Drag & drop columns', estimate: '3d' },
            { id: 'T10', title: 'Optimistic updates', estimate: '2d' },
          ],
        },
      ],
    },
    {
      id: 'E3',
      title: 'Polish & Launch',
      description: 'Notifications, analytics, and deployment.',
      stories: [
        {
          id: 'S5',
          title: 'Notifications & digests',
          tasks: [
            { id: 'T11', title: 'Async worker', estimate: '3d' },
            { id: 'T12', title: 'Email digests', estimate: '2d' },
          ],
        },
      ],
    },
  ],
  milestones: [
    { title: 'Vertical slice (auth + tasks)', due: 'Week 4' },
    { title: 'Realtime collaboration live', due: 'Week 6' },
    { title: 'Public launch', due: 'Week 8' },
  ],
  contentMd: `## Delivery Plan

A pragmatic **8-week roadmap** broken into three epics. Each epic ends with a demoable increment.

- **Weeks 1–4 — Foundations:** auth, data model, and the base UI shell.
- **Weeks 5–6 — Collaboration Core:** the realtime engine and Kanban board.
- **Weeks 7–8 — Polish & Launch:** notifications, analytics, and deploy.

Estimates assume a **2-engineer team** with shared QA. Buffer of ~15% is baked into each milestone.`,
}

export const mockBackend: CodeAgentOutput = {
  summary:
    'FastAPI service with typed Pydantic schemas, SQLAlchemy models, and a clean repository/service split. Includes the task CRUD router and the websocket gateway.',
  artifacts: [
    {
      path: 'app/api/routers/tasks.py',
      language: 'python',
      description: 'Task CRUD router with dependency-injected service.',
      code: `from fastapi import APIRouter, Depends, status
from app.schemas.task import TaskCreate, TaskRead
from app.services.task_service import TaskService, get_task_service

router = APIRouter(prefix="/tasks", tags=["tasks"])


@router.get("", response_model=list[TaskRead])
async def list_tasks(
    project_id: str,
    service: TaskService = Depends(get_task_service),
) -> list[TaskRead]:
    return await service.list_for_project(project_id)


@router.post("", response_model=TaskRead, status_code=status.HTTP_201_CREATED)
async def create_task(
    payload: TaskCreate,
    service: TaskService = Depends(get_task_service),
) -> TaskRead:
    task = await service.create(payload)
    await service.broadcast("task_created", task)
    return task
`,
    },
    {
      path: 'app/schemas/task.py',
      language: 'python',
      description: 'Pydantic request/response schemas.',
      code: `from datetime import datetime
from pydantic import BaseModel, Field


class TaskBase(BaseModel):
    title: str = Field(min_length=1, max_length=200)
    status: str = "todo"
    assignee_id: str | None = None


class TaskCreate(TaskBase):
    project_id: str


class TaskRead(TaskBase):
    id: str
    project_id: str
    created_at: datetime
    updated_at: datetime
`,
    },
    {
      path: 'app/realtime/gateway.py',
      language: 'python',
      description: 'WebSocket gateway with Redis pub/sub fan-out.',
      code: `import json
from fastapi import WebSocket
from app.realtime.redis_bus import RedisBus


class Gateway:
    def __init__(self, bus: RedisBus) -> None:
        self._bus = bus
        self._clients: set[WebSocket] = set()

    async def connect(self, ws: WebSocket) -> None:
        await ws.accept()
        self._clients.add(ws)

    async def broadcast(self, channel: str, payload: dict) -> None:
        await self._bus.publish(channel, json.dumps(payload))
`,
    },
  ],
  contentMd: `## Backend Implementation

Generated a **FastAPI** service following a clean layered structure:

- \`routers/\` — thin HTTP layer, no business logic.
- \`services/\` — orchestration + broadcasting.
- \`repositories/\` — all DB access, easily mockable in tests.

All endpoints are fully typed with **Pydantic v2** and produce an OpenAPI schema out of the box.`,
}

export const mockFrontend: CodeAgentOutput = {
  summary:
    'React + TypeScript client with a typed API hook layer, optimistic Kanban board, and a websocket presence provider.',
  artifacts: [
    {
      path: 'src/features/board/useBoard.ts',
      language: 'typescript',
      description: 'TanStack Query hook with optimistic task moves.',
      code: `import { useMutation, useQueryClient } from '@tanstack/react-query'
import { moveTask } from '@/lib/api'
import type { Task } from '@/types'

export function useMoveTask(projectId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: moveTask,
    onMutate: async (next: Task) => {
      await qc.cancelQueries({ queryKey: ['tasks', projectId] })
      const prev = qc.getQueryData<Task[]>(['tasks', projectId])
      qc.setQueryData<Task[]>(['tasks', projectId], (old) =>
        (old ?? []).map((t) => (t.id === next.id ? next : t)),
      )
      return { prev }
    },
    onError: (_e, _next, ctx) => {
      if (ctx?.prev) qc.setQueryData(['tasks', projectId], ctx.prev)
    },
    onSettled: () => qc.invalidateQueries({ queryKey: ['tasks', projectId] }),
  })
}
`,
    },
    {
      path: 'src/features/board/Column.tsx',
      language: 'tsx',
      description: 'Kanban column with drop target.',
      code: `import type { Task } from '@/types'
import { TaskCard } from './TaskCard'

interface ColumnProps {
  title: string
  tasks: Task[]
  onDrop: (taskId: string) => void
}

export function Column({ title, tasks, onDrop }: ColumnProps) {
  return (
    <div
      className="flex w-72 flex-col gap-3 rounded-xl bg-muted/40 p-3"
      onDragOver={(e) => e.preventDefault()}
      onDrop={(e) => onDrop(e.dataTransfer.getData('id'))}
    >
      <h3 className="text-sm font-medium text-muted-foreground">{title}</h3>
      {tasks.map((task) => (
        <TaskCard key={task.id} task={task} />
      ))}
    </div>
  )
}
`,
    },
  ],
  contentMd: `## Frontend Implementation

Generated a **React + TypeScript** client emphasizing perceived performance:

- **Optimistic updates** via TanStack Query so the board feels instant.
- A **presence provider** subscribes to the websocket and reconciles remote changes.
- Component layer is fully typed against the shared API contracts.`,
}

export const mockQa: QaOutput = {
  summary:
    'Test strategy spanning unit, integration, and e2e. Identified two medium-risk areas around websocket reconnection and optimistic rollback.',
  coverage: 84,
  checks: [
    { id: 'Q1', title: 'Auth token expiry handled', severity: 'high', status: 'pass', detail: 'Refresh flow verified under expiry.' },
    { id: 'Q2', title: 'Optimistic rollback on failure', severity: 'medium', status: 'warn', detail: 'Edge case when two moves race needs a server version check.' },
    { id: 'Q3', title: 'WebSocket reconnection', severity: 'medium', status: 'warn', detail: 'Backoff works; missed-event replay not yet implemented.' },
    { id: 'Q4', title: 'SQL injection surface', severity: 'high', status: 'pass', detail: 'All queries parameterized via ORM.' },
    { id: 'Q5', title: 'N+1 query check', severity: 'low', status: 'pass', detail: 'Eager loading applied on board fetch.' },
  ],
  artifacts: [
    {
      path: 'tests/test_tasks.py',
      language: 'python',
      description: 'Integration test for task creation + broadcast.',
      code: `import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_create_task_broadcasts(client: AsyncClient, fake_bus) -> None:
    resp = await client.post(
        "/tasks",
        json={"title": "Write tests", "project_id": "p1"},
    )
    assert resp.status_code == 201
    assert fake_bus.published[-1][0] == "task_created"
`,
    },
  ],
  contentMd: `## QA Report

Overall quality is **solid** with a measured coverage of **84%**.

### Findings
- ⚠️ **Optimistic rollback race** — add a server-side version field to reject stale moves.
- ⚠️ **Websocket replay** — buffer missed events during reconnection windows.
- ✅ Security surface (auth, SQL) passes review.

Recommended to address the two warnings before public launch.`,
}

export const mockDocumentation: DocumentationOutput = {
  summary: 'Generated a developer guide, deployment plan, and product spec.',
  documents: [
    {
      title: 'Developer Guide',
      docType: 'developer_guide',
      contentMd: `# Developer Guide

## Getting started
\`\`\`bash
git clone <repo> && cd app
make bootstrap   # installs deps, runs migrations, seeds data
make dev         # starts api + web with hot reload
\`\`\`

## Project layout
- \`backend/\` — FastAPI service.
- \`frontend/\` — React client.
- \`infra/\` — IaC + deploy scripts.

## Conventions
- Conventional commits, trunk-based development.
- Every PR runs lint, type-check, and tests in CI.`,
    },
    {
      title: 'Deployment Plan',
      docType: 'deployment_plan',
      contentMd: `# Deployment Plan

| Component | Platform | Notes |
| --- | --- | --- |
| Web | Vercel | Edge SSR + preview deploys |
| API | Render | Autoscaling web service |
| DB | Supabase | Managed Postgres + backups |
| Cache | Upstash | Serverless Redis |

Promotion: \`preview → staging → production\` gated by CI and a manual approval.`,
    },
  ],
  contentMd: `## Documentation

Three documents were generated covering onboarding, deployment, and the product spec. They are ready to drop into a \`docs/\` folder and publish to a docs site.`,
}

export const mockCtoReview: CtoReviewOutput = {
  summary:
    'A well-architected MVP with a clear delivery path. Approved with minor changes — resolve the two QA warnings and add observability before scaling.',
  verdict: 'approved_with_changes',
  healthScore: {
    overall: 87,
    dimensions: [
      { dimension: 'Architecture', score: 91 },
      { dimension: 'Scalability', score: 84 },
      { dimension: 'Security', score: 88 },
      { dimension: 'Maintainability', score: 90 },
      { dimension: 'Cost Efficiency', score: 82 },
      { dimension: 'Delivery Risk', score: 86 },
    ],
  },
  risks: [
    { id: 'R1', title: 'Realtime fan-out becomes a bottleneck at scale', severity: 'medium', mitigation: 'Shard Redis channels per workspace; add horizontal websocket nodes.' },
    { id: 'R2', title: 'No observability/tracing in MVP', severity: 'medium', mitigation: 'Add OpenTelemetry + a hosted tracing backend before launch.' },
    { id: 'R3', title: 'Single primary DB', severity: 'low', mitigation: 'Enable read replicas when read load grows.' },
  ],
  cost: {
    monthlyInfraUsd: 78,
    oneTimeBuildUsd: 32000,
    breakdown: [
      { label: 'Hosting (web + api)', amountUsd: 25 },
      { label: 'Managed Postgres', amountUsd: 25 },
      { label: 'Serverless Redis', amountUsd: 10 },
      { label: 'Email + misc', amountUsd: 18 },
    ],
  },
  team: {
    totalHeadcount: 4,
    roles: [
      { role: 'Full-stack Engineer', count: 2, seniority: 'mid' },
      { role: 'Designer', count: 1, seniority: 'senior' },
      { role: 'QA / SDET', count: 1, seniority: 'mid' },
    ],
  },
  delivery: {
    totalWeeks: 8,
    phases: [
      { name: 'Foundations', weeks: 4 },
      { name: 'Collaboration Core', weeks: 2 },
      { name: 'Polish & Launch', weeks: 2 },
    ],
  },
  contentMd: `## CTO Review

**Verdict: Approved with changes.**

This is a clean, scalable MVP design with sensible technology choices and a realistic 8-week plan. The team estimate (4 people) and infra cost (~$78/mo) are appropriate for the target.

### Before launch
1. Resolve the two QA warnings (optimistic race + websocket replay).
2. Add baseline observability (tracing + structured logs).
3. Document the scaling plan for the realtime layer.

Overall health score: **87/100**.`,
}
