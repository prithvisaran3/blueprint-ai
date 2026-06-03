# Blueprint AI

> **Transform Product Ideas Into Engineering Execution**

Blueprint AI is a multi-agent engineering intelligence platform. You describe a
product idea in plain language, and a pipeline of specialized AI agents turns it
into a complete engineering blueprint: system architecture, delivery plan,
backend & frontend designs, a QA strategy, generated documentation, and a CTO
review with health, cost, team, and delivery estimates.

The entire stack is **100% free-tier** and uses **no paid dependencies** and
**no OpenAI** — generation is powered by Google Gemini (free tier).

---

## What it does

1. You submit an idea (e.g. _"a marketplace for renting camera gear"_).
2. `POST /generate` creates a `project` and an `agent_run`.
3. A [LangGraph](https://langchain-ai.github.io/langgraph/) orchestrator runs
   **7 agents sequentially** over a shared typed state:
   `Architect → Planner → Backend → Frontend → QA → Documentation → CTO Review`.
4. Each agent streams progress and tokens to the browser over **Server-Sent
   Events (SSE)** and persists its structured output + execution logs.
5. The frontend renders a live [React Flow](https://reactflow.dev/) execution
   graph, then a tabbed **Results Workspace** reads the persisted outputs.

---

## Tech stack (approved)

| Layer        | Technology                                                                 |
| ------------ | -------------------------------------------------------------------------- |
| Frontend     | React 19, Vite, TypeScript, Tailwind CSS v4, shadcn/ui, Framer Motion      |
| Data / State | TanStack Query (server cache), Zustand (UI state), React Hook Form + Zod   |
| Viz          | React Flow (execution & architecture graphs), Recharts, Monaco editor      |
| Backend      | FastAPI (Python 3.12), SQLAlchemy, Alembic, Pydantic v2                     |
| AI           | Google Gemini 2.5 Flash via LangGraph (structured outputs, streaming)      |
| Database     | Supabase PostgreSQL (free tier) with Row Level Security                    |
| Auth         | Supabase Auth — FastAPI verifies Supabase-issued JWTs                      |
| Storage      | Supabase Storage                                                           |
| Streaming    | Server-Sent Events (SSE)                                                    |
| Hosting      | Vercel (frontend) · Render (backend) · Supabase (DB/Auth/Storage)          |
| CI           | GitHub Actions                                                             |

---

## Monorepo layout

```
blueprint-ai/                 # ← workspace root (this repo)
  README.md
  .github/workflows/          # ci-frontend.yml, ci-backend.yml
  docs/                       # ARCHITECTURE, SCHEMA, API, LANGGRAPH, FRONTEND, ROADMAP
  frontend/                   # React 19 + Vite + TS (deploys to Vercel)
    src/
      app/                    # router, providers, theme, layouts
      features/               # landing, dashboard, execution, workspace, projects, auth
      components/ui/          # shadcn primitives
      components/shared/      # AnimatedCounter, GlassCard, GradientMesh, ...
      lib/                    # api client, sse client, supabase client, utils
      stores/                 # zustand stores
      types/                  # shared TS types (mirror Pydantic schemas)
      hooks/
  backend/                    # FastAPI (deploys to Render)
    app/
      main.py
      core/                   # config, security (JWT verify), deps, logging
      api/v1/routers/         # projects, generate, executions, history, agents, health
      schemas/                # Pydantic request/response models
      models/                 # SQLAlchemy ORM models
      repositories/           # DB access layer (DI)
      services/               # project_service, execution_service
      agents/                 # LangGraph: graph.py, state.py, nodes/, prompts/
      db/                     # session, base
    alembic/                  # migrations
    pyproject.toml
```

See [`docs/`](./docs) for the full architecture, schema, API, LangGraph,
frontend, and roadmap specifications.

---

## Local development quickstart

### Prerequisites

- **Node.js 20+** and npm
- **Python 3.12+**
- A free **Supabase** project (provides the Postgres connection string, the
  JWT secret / JWKS used to verify auth tokens, and Storage)

### Frontend (`frontend/`)

```bash
cd frontend
npm install
cp .env.example .env.local   # VITE_API_BASE_URL + VITE_SUPABASE_URL/ANON_KEY (or leave VITE_USE_MOCKS=true)
npm run dev                  # Vite dev server (http://localhost:5173)
```

Common scripts:

```bash
npm run typecheck            # tsc --noEmit
npm run build                # production build
npm run preview              # preview the production build
```

### Backend (`backend/`)

```bash
cd backend
python3.12 -m venv .venv
source .venv/bin/activate
pip install -e ".[dev]"      # installs from pyproject.toml
cp .env.example .env         # DATABASE_URL, SUPABASE_JWT_SECRET, GEMINI_API_KEY, ...
alembic upgrade head         # apply migrations to Supabase Postgres
uvicorn app.main:app --reload --port 8000
```

Common checks:

```bash
ruff check .                 # lint
python -m compileall app     # import/compile sanity check
```

> The frontend expects the backend at `http://localhost:8000/api/v1` by
> default; set `VITE_API_BASE_URL` to override. With no Supabase project
> configured it runs entirely on mock data (`VITE_USE_MOCKS=true`).

---

## Free-tier deployment

Everything runs on free plans — no card required to get started.

### Frontend → Vercel

- Import the repo, set the **Root Directory** to `frontend/`. A
  [`frontend/vercel.json`](./frontend/vercel.json) (Vite preset + SPA rewrites)
  is committed, so the build is auto-detected.
- Add env vars: `VITE_API_BASE_URL` (your Render URL, e.g.
  `https://blueprint-ai-backend.onrender.com/api/v1`), `VITE_SUPABASE_URL`,
  `VITE_SUPABASE_ANON_KEY`. Set `VITE_USE_MOCKS=false` to talk to the real
  backend (it defaults to mocks until Supabase is configured).

### Backend → Render

- Use the committed [`render.yaml`](./render.yaml) blueprint (**New + →
  Blueprint**), or create a **Web Service** with root directory `backend/`.
- Build: `pip install -e .` · Start:
  `alembic upgrade head && uvicorn app.main:app --host 0.0.0.0 --port $PORT`.
- Set the `sync: false` secrets when prompted: `DATABASE_URL`,
  `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_JWT_SECRET` (or JWKS URL),
  `CORS_ORIGINS` (your Vercel origin), and optionally `GEMINI_API_KEY`
  (omit to run on the deterministic stub fallback).
- Health check path is `/`. Render's free web services **sleep when idle**.

### Database / Auth / Storage → Supabase

- Free Postgres + Auth + Storage.
- Run `alembic upgrade head` against the Supabase connection string.
- Enable **Row Level Security** so each user only sees their own rows; the
  FastAPI service role bypasses RLS for trusted server-side writes (see
  [`docs/SCHEMA.md`](./docs/SCHEMA.md)).

### CI → GitHub Actions

- [`ci-frontend.yml`](./.github/workflows/ci-frontend.yml): typecheck + build on
  every push/PR touching `frontend/`.
- [`ci-backend.yml`](./.github/workflows/ci-backend.yml): lint + import/compile
  check on every push/PR touching `backend/`.

---

## Roadmap

Built incrementally — no big-bang. See [`docs/ROADMAP.md`](./docs/ROADMAP.md).

1. **Architecture** — folder structure, schema, API, LangGraph, components (docs).
2. **Frontend Foundation** — UI on mock data with full animations.
3. **Backend Foundation** — FastAPI + Supabase + migrations (AI stubbed).
4. **Integration** — wire frontend ↔ backend, Supabase Auth, replace mocks.
5. **AI Agents** — Gemini + LangGraph 7-agent pipeline with SSE streaming.
6. **Workflow add-ons** — Jira tickets / GitHub Issues export; deploy + CI.

---

## License

MIT.
