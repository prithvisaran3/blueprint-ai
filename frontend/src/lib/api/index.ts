/**
 * Real API client — same function signatures as the mock layer (`lib/mock`),
 * so the data toggle in `lib/data.ts` can swap between them transparently.
 *
 * Backend responses are normalized into the app's domain types via `adapters`.
 */
import type {
  AgentOutput,
  AgentRun,
  DashboardStats,
  ExecutionLog,
  GeneratedDocument,
  Project,
  User,
} from '@/types'
import { AGENT_ORDER } from '@/types'
import { supabase } from '@/lib/supabase'
import { apiFetch } from './client'
import {
  adaptDocument,
  adaptLog,
  adaptOutput,
  adaptProject,
  adaptRun,
  fillOutputs,
} from './adapters'
import type {
  Page,
  WireAgentRun,
  WireExecution,
  WireExecutionLog,
  WireGeneratedDocument,
  WireGenerateResponse,
  WireGitHubExportResponse,
  WireJiraExportResponse,
  WireProject,
  WireProjectDetail,
} from './types'

// --- Auth / user -------------------------------------------------------------
export async function fetchCurrentUser(): Promise<User> {
  const { data } = supabase ? await supabase.auth.getUser() : { data: { user: null } }
  const u = data.user
  if (!u) throw new Error('Not authenticated')
  const meta = (u.user_metadata ?? {}) as Record<string, unknown>
  const displayName =
    (typeof meta.full_name === 'string' && meta.full_name) ||
    (typeof meta.name === 'string' && meta.name) ||
    u.email ||
    'User'
  return {
    id: u.id,
    email: u.email ?? '',
    displayName,
    avatarUrl:
      (typeof meta.avatar_url === 'string' && meta.avatar_url) ||
      (typeof meta.picture === 'string' && meta.picture) ||
      null,
    createdAt: u.created_at ?? new Date().toISOString(),
  }
}

// --- Projects ----------------------------------------------------------------
export async function fetchProjects(): Promise<Project[]> {
  const page = await apiFetch<Page<WireProject>>('/projects', { params: { limit: 100 } })
  return page.items.map((p) => adaptProject(p))
}

export async function fetchProject(id: string): Promise<Project | undefined> {
  const detail = await apiFetch<WireProjectDetail>(`/projects/${id}`)
  const project = adaptProject(detail)
  // Best-effort: surface the latest run's health score on the detail view.
  if (detail.latest_run) {
    try {
      const run = await apiFetch<WireExecution>(`/executions/${detail.latest_run.id}`)
      project.healthScore =
        typeof run.health_score?.overall === 'number' ? (run.health_score.overall as number) : null
    } catch {
      /* non-fatal */
    }
  }
  return project
}

// --- Runs / executions -------------------------------------------------------
export async function fetchRuns(): Promise<AgentRun[]> {
  const [history, projects] = await Promise.all([
    apiFetch<Page<WireAgentRun>>('/history', { params: { limit: 50 } }),
    apiFetch<Page<WireProject>>('/projects', { params: { limit: 100 } }).catch(() => null),
  ])
  const names = new Map((projects?.items ?? []).map((p) => [p.id, p.name]))
  return history.items.map((r) => adaptRun(r, names.get(r.project_id) ?? 'Blueprint'))
}

export async function fetchRun(runId: string): Promise<AgentRun | undefined> {
  const exec = await apiFetch<WireExecution>(`/executions/${runId}`)
  let name = 'Blueprint'
  try {
    const project = await apiFetch<WireProjectDetail>(`/projects/${exec.project_id}`)
    name = project.name
  } catch {
    /* non-fatal */
  }
  return adaptRun(exec, name)
}

export async function fetchRunOutputs(runId: string): Promise<AgentOutput[]> {
  const exec = await apiFetch<WireExecution>(`/executions/${runId}`)
  const adapted = exec.outputs.map((o) => adaptOutput(o))
  return adapted.length ? fillOutputs(runId, adapted) : []
}

export async function fetchRunLogs(runId: string): Promise<ExecutionLog[]> {
  const logs = await apiFetch<WireExecutionLog[]>(`/executions/${runId}/logs`)
  return logs.map((l) => adaptLog(l))
}

export async function fetchRunDocuments(runId: string): Promise<GeneratedDocument[]> {
  const docs = await apiFetch<WireGeneratedDocument[]>(`/documents/${runId}`)
  return docs.map((d) => adaptDocument(d))
}

// --- Dashboard ---------------------------------------------------------------
export async function fetchDashboardStats(): Promise<DashboardStats> {
  const [history, projects] = await Promise.all([
    apiFetch<Page<WireAgentRun>>('/history', { params: { limit: 100 } }),
    apiFetch<Page<WireProject>>('/projects', { params: { limit: 1 } }).catch(() => null),
  ])
  const runs = history?.items ?? []
  const totalTokens = runs.reduce((sum, r) => sum + (r.total_tokens ?? 0), 0)
  const healthScores = runs
    .map((r) => (typeof r.health_score?.overall === 'number' ? (r.health_score.overall as number) : null))
    .filter((v): v is number => v != null)
  const avgHealthScore = healthScores.length
    ? Math.round(healthScores.reduce((a, b) => a + b, 0) / healthScores.length)
    : 0

  // Bucket the last 14 days of runs for the usage chart.
  const usage = Array.from({ length: 14 }, (_, i) => {
    const day = new Date(Date.now() - (13 - i) * 86_400_000)
    const label = day.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    const sameDay = runs.filter(
      (r) => new Date(r.created_at).toDateString() === day.toDateString(),
    )
    return {
      date: label,
      generations: sameDay.length,
      tokens: sameDay.reduce((sum, r) => sum + r.total_tokens, 0),
    }
  })

  return {
    totalProjects: projects?.total ?? 0,
    totalRuns: history?.total ?? runs.length,
    totalTokens,
    avgHealthScore,
    usage,
    agentMetrics: AGENT_ORDER.map((agent) => ({
      agent,
      avgDurationMs: 0,
      avgTokens: 0,
      successRate: 1,
    })),
  }
}

// --- Mutations: generate + export -------------------------------------------
export interface GenerateInput {
  ideaPrompt?: string
  projectId?: string
  name?: string
}

export async function generate(
  input: GenerateInput,
): Promise<{ runId: string; projectId: string; status: string }> {
  const res = await apiFetch<WireGenerateResponse>('/generate', {
    method: 'POST',
    body: { idea_prompt: input.ideaPrompt, project_id: input.projectId, name: input.name },
  })
  return { runId: res.run_id, projectId: res.project_id, status: res.status }
}

export async function exportJira(input: {
  runId: string
  projectKey?: string
}): Promise<WireJiraExportResponse> {
  return apiFetch<WireJiraExportResponse>('/export/jira', {
    method: 'POST',
    body: { run_id: input.runId, project_key: input.projectKey ?? 'BP' },
  })
}

export async function exportGithub(input: {
  runId: string
  repo?: string
  token?: string
  dryRun?: boolean
  labels?: string[]
}): Promise<WireGitHubExportResponse> {
  return apiFetch<WireGitHubExportResponse>('/export/github-issues', {
    method: 'POST',
    body: {
      run_id: input.runId,
      repo: input.repo,
      token: input.token,
      dry_run: input.dryRun ?? true,
      labels: input.labels,
    },
  })
}
