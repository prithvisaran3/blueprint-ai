# Blueprint AI — Frontend

The web client for **Blueprint AI**, a multi-agent engineering intelligence platform that turns a
single product idea into a full architecture, delivery plan, scaffolded code, QA review, docs, and a
CTO sign-off.

> **Phase 2 (Frontend Foundation).** This app currently runs entirely on **mock data** — no backend
> calls. A later integration phase swaps the mock layer for the real FastAPI + Supabase API. The
> mock data and TypeScript contracts are designed so that swap is a drop-in.

## Stack

React 19 · TypeScript (strict) · Vite · Tailwind CSS v4 · shadcn/ui · Framer Motion · TanStack Query
· React Flow (`@xyflow/react`) · Zustand · React Hook Form + Zod · Monaco Editor · Recharts ·
React Markdown · Lucide.

## Getting started

```bash
npm install            # install dependencies
npm run dev            # start the dev server (http://localhost:5173)
npm run build          # type-check (tsc -b) + production build to dist/
npm run preview        # preview the production build
npm run lint           # run ESLint
```

Copy `.env.example` to `.env.local` to configure integration variables (not required for Phase 2).

## Debugging (Flutter-style)

This stack splits debugging across **browser** (frontend) and **terminal** (backend).

| Flutter | Blueprint AI |
| ------- | -------------- |
| `debugPrint()` | `debugLog('scope', 'message', data)` in `src/lib/debug.ts`, or plain `console.log` |
| Debug console in IDE | **Browser DevTools → Console** (F12 or Cmd+Option+I) |
| Run & Debug | Cursor **Run and Debug** panel → **Full Stack Debug** (`.vscode/launch.json`) |
| Breakpoints in Dart | Set breakpoints in `.tsx` files, launch **Frontend: Chrome** |
| `flutter run` logs | Backend: uvicorn terminal output; Frontend: Vite terminal + browser console |

### Quick local debug loop

```bash
# Terminal 1 — backend (prints every request + SQL when DB_ECHO=true)
cd backend && source .venv/bin/activate
AUTH_DEV_BYPASS=true LOG_LEVEL=DEBUG uvicorn app.main:app --reload --port 8000

# Terminal 2 — frontend (hot reload)
cd frontend && npm run dev
```

Open http://localhost:5173, press **F12 → Console**, then click **Generate Blueprint**.
You should see lines like `[Blueprint:api] POST http://localhost:8000/api/v1/generate`.

`frontend/.env.local` overrides production URLs so local dev hits `localhost:8000`.

Optional: set `VITE_DEBUG=true` in `.env.local` to keep `[Blueprint:*]` logs in production builds.

### Cursor Run and Debug

1. Open **Run and Debug** (Cmd+Shift+D).
2. Choose **Full Stack Debug** — starts Vite, FastAPI with breakpoints, and Chrome.
3. For backend-only breakpoints: choose **Backend: FastAPI** (requires Python **debugpy** extension).

Equivalent script: `./scripts/dev-debug.sh both` from the repo root.

## Routes

| Path                 | Screen                                                        |
| -------------------- | ------------------------------------------------------------- |
| `/`                  | Landing — animated hero, feature grid, agent pipeline, CTA    |
| `/login`             | Auth (stubbed sign-in)                                        |
| `/dashboard`         | Projects, recent runs, health score, agent metrics, analytics |
| `/projects/:id`      | Project detail + latest run summary                           |
| `/executions/:runId` | Live multi-agent execution graph (React Flow + mock stream)   |
| `/workspace/:runId`  | Tabbed results: Architecture · Planning · Backend · Frontend · QA · Documentation · CTO Review · Insights |

## Project structure (feature-based)

```
src/
  app/            # router, providers (Query/Theme/Auth), layouts (AppShell/Sidebar/Topbar)
  features/       # landing, auth, dashboard, projects, execution, workspace
  components/
    ui/           # shadcn primitives
    shared/       # GlassCard, AnimatedCounter, HealthRing, GradientMesh, Skeletons, PageTransition…
  lib/
    mock/         # mock API + data + scripted execution stream  ← swap for real API later
    agents.ts     # agent display metadata
    motion.ts     # Framer Motion variants library
    utils.ts
  stores/         # Zustand (execution UI state machine)
  hooks/          # TanStack Query hooks, useTypingEffect
  types/          # shared TS types mirroring backend Pydantic schemas
```

## Swapping mocks for the real API

- `src/lib/mock/api.ts` mirrors the REST endpoints from the architecture plan. Replace these
  functions with a real client hitting `VITE_API_BASE_URL`; the TanStack Query hooks in
  `src/hooks/queries.ts` stay unchanged.
- `src/features/execution/useAgentStream.ts` plays a scripted timeline via the Zustand store. Swap
  `start()` for an `EventSource` connected to `GET /executions/{runId}/stream` and dispatch SSE
  events into the store.
- `src/app/providers/AuthProvider.tsx` is a stub. Replace with Supabase Auth + JWT.
```
