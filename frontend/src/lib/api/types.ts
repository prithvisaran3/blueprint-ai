/**
 * Backend wire types — the raw JSON shapes returned by the FastAPI backend
 * (snake_case, mirroring the Pydantic schemas in `backend/app/schemas`).
 *
 * These are intentionally separate from the app's domain types in
 * `src/types`. The adapter layer (`adapters.ts`) maps these wire shapes into
 * the domain types the UI consumes, which is the frontend↔backend contract.
 */

export interface Page<T> {
  items: T[]
  total: number
  limit: number
  offset: number
}

// --- Projects / runs ---------------------------------------------------------
export interface WireProject {
  id: string
  user_id: string
  name: string
  idea_prompt: string
  status: 'draft' | 'running' | 'completed' | 'failed'
  created_at: string
  updated_at: string
}

export interface WireRunSummary {
  id: string
  status: string
  total_tokens: number
  total_duration_ms: number
  started_at: string | null
  finished_at: string | null
  created_at: string
}

export interface WireProjectDetail extends WireProject {
  latest_run: WireRunSummary | null
}

export interface WireAgentRun {
  id: string
  project_id: string
  status: 'queued' | 'running' | 'completed' | 'failed'
  started_at: string | null
  finished_at: string | null
  total_tokens: number
  total_duration_ms: number
  health_score: Record<string, unknown> | null
  error: string | null
  created_at: string
  updated_at: string
}

export interface WireAgentOutput {
  id: string
  run_id: string
  agent: string
  status: 'pending' | 'running' | 'completed' | 'failed'
  output: Record<string, unknown> | null
  tokens: number
  duration_ms: number
  created_at: string
}

export interface WireExecution extends WireAgentRun {
  outputs: WireAgentOutput[]
}

export interface WireExecutionLog {
  id: string
  run_id: string
  agent: string | null
  level: 'info' | 'warn' | 'error'
  message: string
  meta: Record<string, unknown>
  ts: string
}

export interface WireGeneratedDocument {
  id: string
  project_id: string
  run_id: string
  doc_type: 'spec' | 'developer_guide' | 'deployment_plan' | 'notes'
  title: string
  content_md: string
  created_at: string
}

export interface WireGenerateResponse {
  run_id: string
  project_id: string
  status: string
}

// --- Export (Phase 6) --------------------------------------------------------
export interface WireJiraTicket {
  fields: {
    project: Record<string, string>
    summary: string
    description: string
    issuetype: Record<string, string>
    labels: string[]
  }
  ref: string
  parent_ref: string | null
  story_points: number | null
}

export interface WireJiraExportResponse {
  project_key: string
  count: number
  tickets: WireJiraTicket[]
}

export interface WireGitHubIssue {
  title: string
  body: string
  labels: string[]
  number: number | null
  url: string | null
}

export interface WireGitHubExportResponse {
  repo: string | null
  dry_run: boolean
  count: number
  created: number
  issues: WireGitHubIssue[]
}
