/**
 * Mock API layer.
 *
 * Each function mimics a REST endpoint from the architecture plan (section 4)
 * and returns a Promise after a small simulated latency. A later integration
 * agent can replace this module with a real API client (lib/api.ts) that hits
 * `VITE_API_BASE_URL` — the function signatures are the contract.
 */
import type { AgentOutput, AgentRun, DashboardStats, ExecutionLog, GeneratedDocument, Project, User } from '@/types'
import { sleep } from '@/lib/utils'
import {
  mockAgentOutputs,
  mockDashboardStats,
  mockDocuments,
  mockLogs,
  mockProjects,
  mockRuns,
  mockUser,
} from './data'

const LATENCY = 450

export async function fetchCurrentUser(): Promise<User> {
  await sleep(LATENCY)
  return mockUser
}

export async function fetchProjects(): Promise<Project[]> {
  await sleep(LATENCY)
  return mockProjects
}

export async function fetchProject(id: string): Promise<Project | undefined> {
  await sleep(LATENCY)
  return mockProjects.find((p) => p.id === id)
}

export async function fetchRuns(): Promise<AgentRun[]> {
  await sleep(LATENCY)
  return mockRuns
}

export async function fetchRun(runId: string): Promise<AgentRun | undefined> {
  await sleep(LATENCY)
  return mockRuns.find((r) => r.id === runId)
}

export async function fetchRunOutputs(runId: string): Promise<AgentOutput[]> {
  await sleep(LATENCY)
  return mockAgentOutputs.filter((o) => o.runId === runId)
}

export async function fetchRunLogs(runId: string): Promise<ExecutionLog[]> {
  await sleep(LATENCY)
  return mockLogs.filter((l) => l.runId === runId)
}

export async function fetchRunDocuments(runId: string): Promise<GeneratedDocument[]> {
  await sleep(LATENCY)
  return mockDocuments.filter((d) => d.runId === runId)
}

export async function fetchDashboardStats(): Promise<DashboardStats> {
  await sleep(LATENCY)
  return mockDashboardStats
}
