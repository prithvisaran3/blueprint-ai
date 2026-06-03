# API Reference

The backend exposes a JSON REST API under the base path **`/api/v1`**, plus one
**SSE** streaming endpoint. All request/response models are Pydantic v2 schemas
in `backend/app/schemas/` and are mirrored as TypeScript types in
`frontend/src/types/`.

Related docs: [ARCHITECTURE](./ARCHITECTURE.md) · [SCHEMA](./SCHEMA.md) ·
[LANGGRAPH](./LANGGRAPH.md)

---

## Conventions

- **Base URL:** `{API_URL}/api/v1`
- **Auth:** every endpoint except `GET /health` requires
  `Authorization: Bearer <supabase_jwt>`. FastAPI verifies the Supabase JWT and
  resolves the current user from the `sub` claim (= `users.id`).
- **Content type:** `application/json` for requests and responses (the stream
  endpoint returns `text/event-stream`).
- **Timestamps:** ISO-8601 UTC strings.
- **IDs:** UUID strings.
- **Pagination:** list endpoints accept `?limit=` (default 20, max 100) and
  `?offset=` (default 0) and return `{ items, total, limit, offset }`.

### Standard error shape

```json
{
  "error": {
    "code": "not_found",
    "message": "Project not found",
    "details": null
  }
}
```

| HTTP | `code` examples                         |
| ---- | --------------------------------------- |
| 400  | `validation_error`, `bad_request`       |
| 401  | `unauthorized`, `invalid_token`         |
| 403  | `forbidden`                             |
| 404  | `not_found`                             |
| 409  | `conflict`                              |
| 422  | `validation_error` (FastAPI)            |
| 500  | `internal_error`                        |

---

## Core object shapes

### Project

```json
{
  "id": "uuid",
  "user_id": "uuid",
  "name": "Camera gear marketplace",
  "idea_prompt": "A marketplace for renting camera gear...",
  "status": "draft",
  "created_at": "2026-06-03T19:00:00Z",
  "updated_at": "2026-06-03T19:00:00Z"
}
```

### RunSummary

```json
{
  "id": "uuid",
  "project_id": "uuid",
  "status": "completed",
  "started_at": "2026-06-03T19:00:01Z",
  "finished_at": "2026-06-03T19:00:48Z",
  "total_tokens": 18452,
  "total_duration_ms": 47210,
  "health_score": { "overall": 82, "categories": { "feasibility": 88 } },
  "error": null
}
```

### AgentOutput

```json
{
  "id": "uuid",
  "run_id": "uuid",
  "agent": "architect",
  "status": "completed",
  "output": { "...": "agent-specific structured object" },
  "tokens": 2310,
  "duration_ms": 6120,
  "created_at": "2026-06-03T19:00:08Z"
}
```

`agent` is one of: `architect`, `planner`, `backend`, `frontend`, `qa`,
`documentation`, `cto_review`. See [LANGGRAPH.md](./LANGGRAPH.md) for the
per-agent `output` schemas.

---

## Endpoints

### `GET /health`
Liveness probe (also used by the frontend to keep Render warm). **No auth.**

**Response `200`**
```json
{ "status": "ok", "version": "1.0.0", "time": "2026-06-03T19:00:00Z" }
```

---

### `POST /projects`
Create a project.

**Auth:** required.

**Request**
```json
{ "name": "Camera gear marketplace", "idea_prompt": "A marketplace for renting camera gear..." }
```

**Response `201`** → `Project`

---

### `GET /projects`
List the current user's projects (paginated, newest first).

**Auth:** required. **Query:** `limit`, `offset`.

**Response `200`**
```json
{
  "items": [ { "...": "Project" } ],
  "total": 12,
  "limit": 20,
  "offset": 0
}
```

---

### `GET /projects/{id}`
Fetch a single project plus its latest run summary.

**Auth:** required (must own the project).

**Response `200`**
```json
{
  "project": { "...": "Project" },
  "latest_run": { "...": "RunSummary | null" }
}
```

**Errors:** `404 not_found`, `403 forbidden`.

---

### `DELETE /projects/{id}`
Delete a project and all cascading rows (runs, outputs, logs, documents).

**Auth:** required (must own the project).

**Response `204`** (no body). **Errors:** `404 not_found`.

---

### `POST /generate`
Create and start an agent run. Accepts either an existing `project_id` or a raw
`idea_prompt` (in which case a project is created first).

**Auth:** required.

**Request** (one of)
```json
{ "project_id": "uuid" }
```
```json
{ "idea_prompt": "A marketplace for renting camera gear...", "name": "Camera gear marketplace" }
```

**Response `202`**
```json
{ "run_id": "uuid", "status": "queued" }
```

The client then opens the SSE stream (below) to watch the run.

**Errors:** `400 bad_request` (neither field provided), `404 not_found`.

---

### `GET /executions/{run_id}`
Fetch a run with all agent outputs and the health score (final read after
completion, or a snapshot mid-run).

**Auth:** required (must own the run's project).

**Response `200`**
```json
{
  "run": { "...": "RunSummary" },
  "agent_outputs": [ { "...": "AgentOutput" } ],
  "health_score": { "overall": 82, "categories": { "feasibility": 88 } }
}
```

---

### `GET /executions/{run_id}/stream`  ·  **SSE**
Live event stream for a run. Returns `Content-Type: text/event-stream`.

**Auth:** required (Bearer JWT on the request; must own the run's project).

**Event envelope** — every event payload is a JSON object with this shape:

```json
{ "type": "agent_token", "agent": "architect", "run_id": "uuid", "payload": { }, "ts": "2026-06-03T19:00:08Z" }
```

**Event types**

| `type`            | When                                   | `payload` example                                             |
| ----------------- | -------------------------------------- | ------------------------------------------------------------- |
| `agent_started`   | an agent node begins                   | `{ "index": 0, "total": 7 }`                                  |
| `agent_token`     | incremental token/text chunk           | `{ "text": "Designing service boundaries..." }`               |
| `agent_completed` | an agent finished (output persisted)   | `{ "status": "completed", "tokens": 2310, "duration_ms": 6120 }` |
| `run_completed`   | all agents done, run finalized         | `{ "status": "completed", "total_tokens": 18452, "health_score": { "overall": 82 } }` |
| `error`           | a node or the run failed               | `{ "scope": "agent", "agent": "qa", "message": "Gemini timeout" }` |

**Wire format** (standard SSE framing):

```
event: agent_started
data: {"type":"agent_started","agent":"architect","run_id":"...","payload":{"index":0,"total":7},"ts":"..."}

event: agent_token
data: {"type":"agent_token","agent":"architect","run_id":"...","payload":{"text":"..."},"ts":"..."}

event: run_completed
data: {"type":"run_completed","agent":null,"run_id":"...","payload":{"status":"completed","total_tokens":18452},"ts":"..."}
```

> The `event:` line mirrors `type`; clients may listen by named event or parse
> the `data` JSON. On reconnect, clients re-fetch `GET /executions/{run_id}` to
> resync state.

---

### `GET /executions/{run_id}/logs`
Fetch the persisted execution logs for a run (paginated, oldest first).

**Auth:** required. **Query:** `limit`, `offset`, optional `level`, `agent`.

**Response `200`**
```json
{
  "items": [
    { "id": "uuid", "run_id": "uuid", "agent": "architect", "level": "info", "message": "Architect started", "meta": null, "ts": "2026-06-03T19:00:02Z" }
  ],
  "total": 134,
  "limit": 50,
  "offset": 0
}
```

---

### `POST /agents/run`
Re-run a single agent for an existing run (used to regenerate one workspace tab
or to debug an agent). The agent reads existing upstream outputs from state and
overwrites its own `agent_outputs` row.

**Auth:** required (must own the run's project).

**Request**
```json
{ "run_id": "uuid", "agent": "frontend" }
```

**Response `202`**
```json
{ "run_id": "uuid", "agent": "frontend", "status": "queued" }
```

Progress for the single agent is emitted on the same SSE stream.

---

### `GET /history`
Recent runs across all of the user's projects (powers the dashboard).

**Auth:** required. **Query:** `limit`, `offset`.

**Response `200`**
```json
{
  "items": [
    {
      "run": { "...": "RunSummary" },
      "project": { "id": "uuid", "name": "Camera gear marketplace" }
    }
  ],
  "total": 30,
  "limit": 20,
  "offset": 0
}
```

---

### `GET /documents/{run_id}`
Fetch the generated Markdown documents for a run.

**Auth:** required (must own the run's project).

**Response `200`**
```json
{
  "items": [
    {
      "id": "uuid",
      "project_id": "uuid",
      "run_id": "uuid",
      "doc_type": "spec",
      "title": "Technical Specification",
      "content_md": "# Technical Specification\n...",
      "created_at": "2026-06-03T19:00:45Z"
    }
  ]
}
```

`doc_type` is one of `spec`, `developer_guide`, `deployment_plan`, `notes`.

---

## Phase 6 add-ons

These endpoints convert the Planner agent's Epics/Stories/Tasks into external
ticketing payloads. They are introduced in Phase 6 (see [ROADMAP.md](./ROADMAP.md)).

### `POST /export/jira`
Produce Jira-ready ticket payloads from a run's planner output.

**Request**
```json
{ "run_id": "uuid", "project_key": "BLU" }
```

**Response `200`**
```json
{
  "issues": [
    { "type": "Epic", "summary": "Authentication", "description": "...", "stories": [
      { "type": "Story", "summary": "Email/password login", "tasks": [ { "type": "Task", "summary": "Build login form" } ] }
    ] }
  ]
}
```

### `POST /export/github-issues`
Create GitHub Issues from planner output using a user-provided token.

**Request**
```json
{ "run_id": "uuid", "repo": "owner/name", "github_token": "ghp_..." }
```

**Response `200`**
```json
{
  "created": [
    { "title": "[Epic] Authentication", "number": 12, "url": "https://github.com/owner/name/issues/12" }
  ]
}
```

> The GitHub token is used transiently for the call and is **not persisted**.
