/**
 * Shared TypeScript types for Blueprint AI.
 *
 * These mirror the backend Pydantic schemas / Postgres tables described in the
 * architecture plan (sections 3 & 4). A later integration agent can swap the
 * mock data layer for real API responses without changing these contracts.
 */

// ---------------------------------------------------------------------------
// Enums / unions
// ---------------------------------------------------------------------------

/** The seven agents in the LangGraph pipeline, in execution order. */
export type AgentKey =
  | 'architect'
  | 'planner'
  | 'backend'
  | 'frontend'
  | 'qa'
  | 'documentation'
  | 'cto_review'

export const AGENT_ORDER: AgentKey[] = [
  'architect',
  'planner',
  'backend',
  'frontend',
  'qa',
  'documentation',
  'cto_review',
]

export type AgentStatus = 'pending' | 'running' | 'completed' | 'failed'

export type ProjectStatus = 'draft' | 'running' | 'completed' | 'failed'

export type RunStatus = 'queued' | 'running' | 'completed' | 'failed'

export type LogLevel = 'info' | 'warn' | 'error'

export type DocType = 'spec' | 'developer_guide' | 'deployment_plan' | 'notes'

// ---------------------------------------------------------------------------
// Core entities (mirror DB tables)
// ---------------------------------------------------------------------------

export interface User {
  id: string
  email: string
  displayName: string
  avatarUrl: string | null
  createdAt: string
}

export interface Project {
  id: string
  userId: string
  name: string
  ideaPrompt: string
  status: ProjectStatus
  createdAt: string
  updatedAt: string
  /** Latest run id, when one exists. */
  latestRunId: string | null
  /** Denormalized summary for list views. */
  healthScore: number | null
  tags: string[]
}

export interface AgentRun {
  id: string
  projectId: string
  projectName: string
  status: RunStatus
  startedAt: string
  finishedAt: string | null
  totalTokens: number
  totalDurationMs: number
  healthScore: HealthScore | null
  error: string | null
}

export interface AgentOutput {
  id: string
  runId: string
  agent: AgentKey
  status: AgentStatus
  /** Structured output payload, shape varies per agent. */
  output: AgentOutputPayload
  tokens: number
  durationMs: number
  createdAt: string
}

export interface ExecutionLog {
  id: string
  runId: string
  agent: AgentKey | 'system'
  level: LogLevel
  message: string
  ts: string
}

export interface GeneratedDocument {
  id: string
  projectId: string
  runId: string
  docType: DocType
  title: string
  contentMd: string
  createdAt: string
}

// ---------------------------------------------------------------------------
// Agent output payloads (structured outputs per agent)
// ---------------------------------------------------------------------------

export interface TechChoice {
  category: string
  choice: string
  rationale: string
}

export interface ArchitectureNodeSpec {
  id: string
  label: string
  kind: 'client' | 'service' | 'datastore' | 'external'
  description: string
}

export interface ArchitectureEdgeSpec {
  source: string
  target: string
  label: string
}

export interface ArchitectOutput {
  summary: string
  stack: TechChoice[]
  nodes: ArchitectureNodeSpec[]
  edges: ArchitectureEdgeSpec[]
  contentMd: string
}

export interface PlanTask {
  id: string
  title: string
  estimate: string
}

export interface PlanStory {
  id: string
  title: string
  tasks: PlanTask[]
}

export interface PlanEpic {
  id: string
  title: string
  description: string
  stories: PlanStory[]
}

export interface PlannerOutput {
  summary: string
  epics: PlanEpic[]
  milestones: { title: string; due: string }[]
  contentMd: string
}

export interface CodeArtifact {
  path: string
  language: string
  description: string
  code: string
}

export interface CodeAgentOutput {
  summary: string
  artifacts: CodeArtifact[]
  contentMd: string
}

export interface QaCheck {
  id: string
  title: string
  severity: 'low' | 'medium' | 'high'
  status: 'pass' | 'warn' | 'fail'
  detail: string
}

export interface QaOutput {
  summary: string
  coverage: number
  checks: QaCheck[]
  artifacts: CodeArtifact[]
  contentMd: string
}

export interface DocumentationOutput {
  summary: string
  documents: { title: string; docType: DocType; contentMd: string }[]
  contentMd: string
}

export interface Risk {
  id: string
  title: string
  severity: 'low' | 'medium' | 'high'
  mitigation: string
}

export interface CostEstimation {
  monthlyInfraUsd: number
  oneTimeBuildUsd: number
  breakdown: { label: string; amountUsd: number }[]
}

export interface TeamRole {
  role: string
  count: number
  seniority: 'junior' | 'mid' | 'senior'
}

export interface TeamEstimation {
  roles: TeamRole[]
  totalHeadcount: number
}

export interface DeliveryEstimation {
  totalWeeks: number
  phases: { name: string; weeks: number }[]
}

export interface HealthScoreDimension {
  dimension: string
  score: number
}

export interface HealthScore {
  overall: number
  dimensions: HealthScoreDimension[]
}

export interface CtoReviewOutput {
  summary: string
  verdict: 'approved' | 'approved_with_changes' | 'needs_work'
  healthScore: HealthScore
  risks: Risk[]
  cost: CostEstimation
  team: TeamEstimation
  delivery: DeliveryEstimation
  contentMd: string
}

export type AgentOutputPayload =
  | ArchitectOutput
  | PlannerOutput
  | CodeAgentOutput
  | QaOutput
  | DocumentationOutput
  | CtoReviewOutput

// ---------------------------------------------------------------------------
// Streaming / SSE event shapes (mirror plan section 4)
// ---------------------------------------------------------------------------

export type StreamEventType =
  | 'agent_started'
  | 'agent_token'
  | 'agent_progress'
  | 'agent_completed'
  | 'agent_failed'
  | 'run_completed'
  | 'log'
  | 'error'

export interface StreamEvent {
  type: StreamEventType
  agent: AgentKey | 'system'
  runId: string
  payload: {
    progress?: number
    tokens?: number
    durationMs?: number
    token?: string
    message?: string
    level?: LogLevel
  }
  ts: string
}

// ---------------------------------------------------------------------------
// Dashboard / analytics aggregates
// ---------------------------------------------------------------------------

export interface UsagePoint {
  date: string
  generations: number
  tokens: number
}

export interface AgentMetric {
  agent: AgentKey
  avgDurationMs: number
  avgTokens: number
  successRate: number
}

export interface DashboardStats {
  totalProjects: number
  totalRuns: number
  totalTokens: number
  avgHealthScore: number
  usage: UsagePoint[]
  agentMetrics: AgentMetric[]
}
