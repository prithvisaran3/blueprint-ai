/**
 * Data source toggle.
 *
 * Re-exports either the mock data layer (`lib/mock`) or the real API client
 * (`lib/api`) based on `USE_MOCKS`, so the rest of the app (hooks, pages) is
 * agnostic to which backend is in use. The mocks are preserved unchanged; set
 * `VITE_USE_MOCKS=false` (with a configured backend) to use the real API.
 */
import type {
  WireGitHubExportResponse,
  WireJiraExportResponse,
} from './api/types'
import * as real from './api'
import * as mock from './mock'
import { mockPlanner, PRIMARY_PROJECT_ID, PRIMARY_RUN_ID } from './mock'
import { USE_MOCKS } from './env'
import { sleep } from './utils'

export { USE_MOCKS }

// --- Reads (identical signatures across mock + real) -------------------------
export const fetchCurrentUser = USE_MOCKS ? mock.fetchCurrentUser : real.fetchCurrentUser
export const fetchProjects = USE_MOCKS ? mock.fetchProjects : real.fetchProjects
export const fetchProject = USE_MOCKS ? mock.fetchProject : real.fetchProject
export const fetchRuns = USE_MOCKS ? mock.fetchRuns : real.fetchRuns
export const fetchRun = USE_MOCKS ? mock.fetchRun : real.fetchRun
export const fetchRunOutputs = USE_MOCKS ? mock.fetchRunOutputs : real.fetchRunOutputs
export const fetchRunLogs = USE_MOCKS ? mock.fetchRunLogs : real.fetchRunLogs
export const fetchRunDocuments = USE_MOCKS ? mock.fetchRunDocuments : real.fetchRunDocuments
export const fetchDashboardStats = USE_MOCKS ? mock.fetchDashboardStats : real.fetchDashboardStats

// --- Mutations: generate -----------------------------------------------------
export interface GenerateInput {
  ideaPrompt?: string
  projectId?: string
  name?: string
}

async function mockGenerate(): Promise<{ runId: string; projectId: string; status: string }> {
  await sleep(400)
  return { runId: PRIMARY_RUN_ID, projectId: PRIMARY_PROJECT_ID, status: 'queued' }
}

export const generate = USE_MOCKS ? mockGenerate : real.generate

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

export const exportJira = USE_MOCKS ? mockExportJira : real.exportJira
export const exportGithub = USE_MOCKS ? mockExportGithub : real.exportGithub
