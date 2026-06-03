# Blueprint AI — Backend

Production-ready FastAPI backend for **Blueprint AI**, a multi-agent engineering
intelligence platform. This is **Phase 3** (Backend Foundation): full app
skeleton, database schema, repositories/services, and the REST + SSE API. The
AI pipeline is **stubbed** (deterministic placeholder outputs) and will be
replaced by the Gemini + LangGraph implementation in Phase 5.

## Stack

Python 3.12 · FastAPI · Pydantic v2 · SQLAlchemy 2.x · Alembic · PostgreSQL (Supabase)

## Layout

```
backend/
  app/
    main.py                 # FastAPI app: CORS, error handling, router registration
    exceptions.py           # Domain errors -> HTTP responses
    core/                   # config (pydantic-settings), logging, security (Supabase JWT), deps (DI)
    db/                     # declarative Base + lazy engine/session
    models/                 # SQLAlchemy ORM models (all tables)
    schemas/                # Pydantic API models + agents/ structured outputs
    repositories/           # injectable DB access layer
    services/               # project_service, execution_service (+ stubs.py)
    api/v1/routers/         # projects, generate, executions (SSE), history, agents, documents, health
    agents/                 # Phase 5 placeholder (LangGraph)
  alembic/                  # migration env + initial schema
  pyproject.toml
  .env.example
```

## Setup

```bash
cd backend
python3.12 -m venv .venv
source .venv/bin/activate
pip install -e .            # or: pip install -e ".[dev]"
cp .env.example .env        # then fill in real values
```

## Run

```bash
# Apply the database migration (requires a real DATABASE_URL)
alembic upgrade head

# Inspect the migration SQL offline (no DB needed)
alembic upgrade head --sql

# Start the API
uvicorn app.main:app --reload --port 8000
```

Open http://localhost:8000/docs for interactive API docs.

## Auth

The API verifies Supabase-issued JWTs (HS256 via `SUPABASE_JWT_SECRET`, or
RS/ES via JWKS). For local development without a Supabase project, set
`AUTH_DEV_BYPASS=true` to resolve every request to a fake dev user.

## API (`/api/v1`)

| Method | Path | Description |
| --- | --- | --- |
| GET | `/health` | Liveness |
| POST | `/projects` | Create project |
| GET | `/projects` | List projects (paginated) |
| GET | `/projects/{id}` | Project + latest run summary |
| PATCH | `/projects/{id}` | Update project |
| DELETE | `/projects/{id}` | Delete project |
| POST | `/generate` | Create a run (stubbed pipeline) |
| GET | `/executions/{run_id}` | Run + agent outputs + health score |
| GET | `/executions/{run_id}/stream` | **SSE** live agent stream |
| GET | `/executions/{run_id}/logs` | Execution logs |
| POST | `/agents/run` | Re-run a single agent |
| GET | `/history` | Recent runs across projects |
| GET | `/documents/{run_id}` | Generated documents |
