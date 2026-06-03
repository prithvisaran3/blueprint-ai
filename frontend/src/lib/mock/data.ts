import type {
  AgentKey,
  AgentMetric,
  AgentOutput,
  AgentRun,
  DashboardStats,
  ExecutionLog,
  GeneratedDocument,
  Project,
  User,
  UsagePoint,
} from '@/types'
import { AGENT_ORDER } from '@/types'
import {
  mockArchitect,
  mockBackend,
  mockCtoReview,
  mockDocumentation,
  mockFrontend,
  mockPlanner,
  mockQa,
} from './outputs'

export const mockUser: User = {
  id: 'usr_blueprint_demo',
  email: 'alex@blueprint.ai',
  displayName: 'Alex Rivera',
  avatarUrl: null,
  createdAt: '2026-01-12T09:00:00Z',
}

const now = Date.now()
const hoursAgo = (h: number) => new Date(now - h * 3600_000).toISOString()
const daysAgo = (d: number) => new Date(now - d * 86_400_000).toISOString()

export const PRIMARY_RUN_ID = 'run_taskflow_01'
export const PRIMARY_PROJECT_ID = 'proj_taskflow'

export const mockProjects: Project[] = [
  {
    id: PRIMARY_PROJECT_ID,
    userId: mockUser.id,
    name: 'TaskFlow — Realtime Collaboration',
    ideaPrompt:
      'A realtime collaborative task manager with Kanban boards, presence, and notifications for small product teams.',
    status: 'completed',
    createdAt: daysAgo(3),
    updatedAt: hoursAgo(5),
    latestRunId: PRIMARY_RUN_ID,
    healthScore: 87,
    tags: ['SaaS', 'Realtime', 'Productivity'],
  },
  {
    id: 'proj_ledger',
    userId: mockUser.id,
    name: 'Ledger — Indie Finance',
    ideaPrompt:
      'A privacy-first personal finance tracker that imports bank statements and auto-categorizes transactions.',
    status: 'completed',
    createdAt: daysAgo(8),
    updatedAt: daysAgo(7),
    latestRunId: 'run_ledger_01',
    healthScore: 79,
    tags: ['Fintech', 'Privacy'],
  },
  {
    id: 'proj_atlas',
    userId: mockUser.id,
    name: 'Atlas — Docs Search',
    ideaPrompt:
      'An internal documentation search engine with semantic ranking and Slack integration.',
    status: 'running',
    createdAt: hoursAgo(2),
    updatedAt: hoursAgo(1),
    latestRunId: 'run_atlas_01',
    healthScore: null,
    tags: ['AI', 'Search', 'Internal Tools'],
  },
  {
    id: 'proj_pulse',
    userId: mockUser.id,
    name: 'Pulse — Status Page',
    ideaPrompt: 'A lightweight status page and incident timeline for small SaaS teams.',
    status: 'completed',
    createdAt: daysAgo(14),
    updatedAt: daysAgo(13),
    latestRunId: 'run_pulse_01',
    healthScore: 92,
    tags: ['DevTools', 'Monitoring'],
  },
  {
    id: 'proj_draft',
    userId: mockUser.id,
    name: 'Untitled Idea',
    ideaPrompt: 'A marketplace connecting local artists with cafes for rotating exhibitions.',
    status: 'draft',
    createdAt: hoursAgo(1),
    updatedAt: hoursAgo(1),
    latestRunId: null,
    healthScore: null,
    tags: ['Marketplace'],
  },
]

/** Full structured outputs for the primary completed run. */
export const mockAgentOutputs: AgentOutput[] = [
  {
    id: 'out_architect',
    runId: PRIMARY_RUN_ID,
    agent: 'architect',
    status: 'completed',
    output: mockArchitect,
    tokens: 4120,
    durationMs: 8400,
    createdAt: hoursAgo(5),
  },
  {
    id: 'out_planner',
    runId: PRIMARY_RUN_ID,
    agent: 'planner',
    status: 'completed',
    output: mockPlanner,
    tokens: 3680,
    durationMs: 7200,
    createdAt: hoursAgo(5),
  },
  {
    id: 'out_backend',
    runId: PRIMARY_RUN_ID,
    agent: 'backend',
    status: 'completed',
    output: mockBackend,
    tokens: 5210,
    durationMs: 11200,
    createdAt: hoursAgo(5),
  },
  {
    id: 'out_frontend',
    runId: PRIMARY_RUN_ID,
    agent: 'frontend',
    status: 'completed',
    output: mockFrontend,
    tokens: 4890,
    durationMs: 10100,
    createdAt: hoursAgo(5),
  },
  {
    id: 'out_qa',
    runId: PRIMARY_RUN_ID,
    agent: 'qa',
    status: 'completed',
    output: mockQa,
    tokens: 3010,
    durationMs: 6600,
    createdAt: hoursAgo(5),
  },
  {
    id: 'out_docs',
    runId: PRIMARY_RUN_ID,
    agent: 'documentation',
    status: 'completed',
    output: mockDocumentation,
    tokens: 2780,
    durationMs: 5900,
    createdAt: hoursAgo(5),
  },
  {
    id: 'out_cto',
    runId: PRIMARY_RUN_ID,
    agent: 'cto_review',
    status: 'completed',
    output: mockCtoReview,
    tokens: 3990,
    durationMs: 9300,
    createdAt: hoursAgo(5),
  },
]

const totalTokens = mockAgentOutputs.reduce((sum, o) => sum + o.tokens, 0)
const totalDuration = mockAgentOutputs.reduce((sum, o) => sum + o.durationMs, 0)

export const mockRuns: AgentRun[] = [
  {
    id: PRIMARY_RUN_ID,
    projectId: PRIMARY_PROJECT_ID,
    projectName: 'TaskFlow — Realtime Collaboration',
    status: 'completed',
    startedAt: hoursAgo(5),
    finishedAt: hoursAgo(5),
    totalTokens,
    totalDurationMs: totalDuration,
    healthScore: mockCtoReview.healthScore,
    error: null,
  },
  {
    id: 'run_ledger_01',
    projectId: 'proj_ledger',
    projectName: 'Ledger — Indie Finance',
    status: 'completed',
    startedAt: daysAgo(7),
    finishedAt: daysAgo(7),
    totalTokens: 24800,
    totalDurationMs: 61200,
    healthScore: { overall: 79, dimensions: mockCtoReview.healthScore.dimensions },
    error: null,
  },
  {
    id: 'run_atlas_01',
    projectId: 'proj_atlas',
    projectName: 'Atlas — Docs Search',
    status: 'running',
    startedAt: hoursAgo(1),
    finishedAt: null,
    totalTokens: 9200,
    totalDurationMs: 22000,
    healthScore: null,
    error: null,
  },
  {
    id: 'run_pulse_01',
    projectId: 'proj_pulse',
    projectName: 'Pulse — Status Page',
    status: 'completed',
    startedAt: daysAgo(13),
    finishedAt: daysAgo(13),
    totalTokens: 19400,
    totalDurationMs: 48800,
    healthScore: { overall: 92, dimensions: mockCtoReview.healthScore.dimensions },
    error: null,
  },
]

export const mockDocuments: GeneratedDocument[] = mockDocumentation.documents.map((doc, i) => ({
  id: `doc_${i}`,
  projectId: PRIMARY_PROJECT_ID,
  runId: PRIMARY_RUN_ID,
  docType: doc.docType,
  title: doc.title,
  contentMd: doc.contentMd,
  createdAt: hoursAgo(5),
}))

const sampleLogLines: { agent: AgentKey; level: ExecutionLog['level']; message: string }[] = [
  { agent: 'architect', level: 'info', message: 'Parsing idea and constraints…' },
  { agent: 'architect', level: 'info', message: 'Selected serverless-friendly stack.' },
  { agent: 'planner', level: 'info', message: 'Decomposed scope into 3 epics, 5 stories.' },
  { agent: 'backend', level: 'info', message: 'Generated FastAPI routers and schemas.' },
  { agent: 'frontend', level: 'info', message: 'Generated React component hierarchy.' },
  { agent: 'qa', level: 'warn', message: 'Flagged optimistic rollback race condition.' },
  { agent: 'documentation', level: 'info', message: 'Authored developer guide + deployment plan.' },
  { agent: 'cto_review', level: 'info', message: 'Synthesized health score: 87/100.' },
]

export const mockLogs: ExecutionLog[] = sampleLogLines.map((line, i) => ({
  id: `log_${i}`,
  runId: PRIMARY_RUN_ID,
  agent: line.agent,
  level: line.level,
  message: line.message,
  ts: new Date(now - (sampleLogLines.length - i) * 4000).toISOString(),
}))

const usage: UsagePoint[] = Array.from({ length: 14 }, (_, i) => {
  const date = new Date(now - (13 - i) * 86_400_000)
  const wobble = Math.sin(i / 2) * 1.5
  return {
    date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    generations: Math.max(0, Math.round(2 + wobble + (i > 9 ? 2 : 0))),
    tokens: Math.max(2000, Math.round(14000 + wobble * 4000 + i * 600)),
  }
})

const agentMetrics: AgentMetric[] = AGENT_ORDER.map((agent) => {
  const out = mockAgentOutputs.find((o) => o.agent === agent)
  return {
    agent,
    avgDurationMs: out ? out.durationMs : 8000,
    avgTokens: out ? out.tokens : 4000,
    successRate: agent === 'qa' ? 0.94 : 0.99,
  }
})

export const mockDashboardStats: DashboardStats = {
  totalProjects: mockProjects.length,
  totalRuns: 42,
  totalTokens: 642_400,
  avgHealthScore: 86,
  usage,
  agentMetrics,
}
