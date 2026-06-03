/**
 * Data source toggle.
 *
 * Re-exports either the mock data layer (`lib/mock/api`) or the real API client
 * (`lib/api`) based on `USE_MOCKS`. Uses explicit wrapper functions (not module-
 * level ternary bindings) so production bundlers never produce an undefined queryFn.
 */
import type {
  WireGitHubExportResponse,
  WireJiraExportResponse,
} from './api/types'
import {
  fetchCurrentUser as realFetchCurrentUser,
  fetchDashboardStats as realFetchDashboardStats,
  fetchProject as realFetchProject,
  fetchProjects as realFetchProjects,
  fetchRun as realFetchRun,
  fetchRunDocuments as realFetchRunDocuments,
  fetchRunLogs as realFetchRunLogs,
  fetchRunOutputs as realFetchRunOutputs,
  fetchRuns as realFetchRuns,
  generate as realGenerate,
  exportGithub as realExportGithub,
  exportJira as realExportJira,
  type GenerateInput as RealGenerateInput,
} from './api'
import {
  fetchCurrentUser as mockFetchCurrentUser,
  fetchDashboardStats as mockFetchDashboardStats,
  fetchProject as mockFetchProject,
  fetchProjects as mockFetchProjects,
  fetchRun as mockFetchRun,
  fetchRunDocuments as mockFetchRunDocuments,
  fetchRunLogs as mockFetchRunLogs,
  fetchRunOutputs as mockFetchRunOutputs,
  fetchRuns as mockFetchRuns,
} from './mock/api'
import { PRIMARY_PROJECT_ID, PRIMARY_RUN_ID } from './mock/data'
import { mockPlanner } from './mock/outputs'
import { USE_MOCKS } from './env'
import { sleep } from './utils'

export { USE_MOCKS }
export type GenerateInput = RealGenerateInput

// --- Reads -------------------------------------------------------------------
export function fetchCurrentUser() {
  return USE_MOCKS ? mockFetchCurrentUser() : realFetchCurrentUser()
}

export function fetchProjects() {
  return USE_MOCKS ? mockFetchProjects() : realFetchProjects()
}

export function fetchProject(id: string) {
  return USE_MOCKS ? mockFetchProject(id) : realFetchProject(id)
}

export function fetchRuns() {
  return USE_MOCKS ? mockFetchRuns() : realFetchRuns()
}

export function fetchRun(id: string) {
  return USE_MOCKS ? mockFetchRun(id) : realFetchRun(id)
}

export function fetchRunOutputs(id: string) {
  return USE_MOCKS ? mockFetchRunOutputs(id) : realFetchRunOutputs(id)
}

export function fetchRunLogs(id: string) {
  return USE_MOCKS ? mockFetchRunLogs(id) : realFetchRunLogs(id)
}

export function fetchRunDocuments(id: string) {
  return USE_MOCKS ? mockFetchRunDocuments(id) : realFetchRunDocuments(id)
}

export function fetchDashboardStats() {
  return USE_MOCKS ? mockFetchDashboardStats() : realFetchDashboardStats()
}

// --- Mutations: generate -----------------------------------------------------
async function mockGenerate(): Promise<{ runId: string; projectId: string; status: string }> {
  await sleep(400)
  return { runId: PRIMARY_RUN_ID, projectId: PRIMARY_PROJECT_ID, status: 'queued' }
}

export function generate(input: GenerateInput) {
  return USE_MOCKS ? mockGenerate() : realGenerate(input)
}

// --- Mutations: exports (Phase 6) -------------------------------------------
async function mockExportJira(input: {
  runId: string
  projectKey?: string
}): Promise<WireJiraExportResponse> {
  await sleep(500)
  const key = (input.projectKey ?? 'BP').toUpperCase()
  const tickets = mockPlanner.epics.flatMap((epic, ei) => [
    {
      ref: `EPIC-${ei + 1}`,
      parent_ref: null,
      story_points: null,
      fields: {
        project: { key },
        summary: epic.title,
        description: epic.description,
        issuetype: { name: 'Epic' },
        labels: ['blueprint-ai', 'epic'],
      },
    },
    ...epic.stories.map((story, si) => ({
      ref: `STORY-${ei + 1}-${si + 1}`,
      parent_ref: `EPIC-${ei + 1}`,
      story_points: null,
      fields: {
        project: { key },
        summary: story.title,
        description: '',
        issuetype: { name: 'Story' },
        labels: ['blueprint-ai', 'story'],
      },
    })),
  ])
  return { project_key: key, count: tickets.length, tickets }
}

async function mockExportGithub(input: {
  runId: string
  repo?: string
  dryRun?: boolean
  labels?: string[]
}): Promise<WireGitHubExportResponse> {
  await sleep(500)
  const labels = input.labels ?? ['blueprint-ai']
  const issues = mockPlanner.epics.flatMap((epic) => [
    { title: `[Epic] ${epic.title}`, body: epic.description, labels: [...labels, 'epic'], number: null, url: null },
    ...epic.stories.map((story) => ({
      title: `${epic.title} — ${story.title}`,
      body: story.tasks.map((t) => `- [ ] ${t.title}`).join('\n'),
      labels: [...labels, 'story'],
      number: null,
      url: null,
    })),
  ])
  return { repo: input.repo ?? null, dry_run: true, count: issues.length, created: 0, issues }
}

export function exportJira(input: { runId: string; projectKey?: string }) {
  return USE_MOCKS ? mockExportJira(input) : realExportJira(input)
}

export function exportGithub(input: {
  runId: string
  repo?: string
  token?: string
  dryRun?: boolean
  labels?: string[]
}) {
  return USE_MOCKS ? mockExportGithub(input) : realExportGithub(input)
}
