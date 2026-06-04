import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { USE_MOCKS } from '@/lib/env'
import {
  exportGithub,
  exportJira,
  generate,
  type GenerateInput,
} from '@/lib/data'
import {
  fetchCurrentUser as apiFetchCurrentUser,
  fetchDashboardStats as apiFetchDashboardStats,
  fetchProject as apiFetchProject,
  fetchProjects as apiFetchProjects,
  fetchRun as apiFetchRun,
  fetchRunDocuments as apiFetchRunDocuments,
  fetchRunLogs as apiFetchRunLogs,
  fetchRunOutputs as apiFetchRunOutputs,
  fetchRuns as apiFetchRuns,
} from '@/lib/api'
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
} from '@/lib/mock/api'

export const queryKeys = {
  user: ['user'] as const,
  projects: ['projects'] as const,
  project: (id: string) => ['project', id] as const,
  runs: ['runs'] as const,
  run: (id: string) => ['run', id] as const,
  runOutputs: (id: string) => ['run', id, 'outputs'] as const,
  runLogs: (id: string) => ['run', id, 'logs'] as const,
  runDocuments: (id: string) => ['run', id, 'documents'] as const,
  dashboard: ['dashboard'] as const,
}

export function useCurrentUser() {
  return useQuery({
    queryKey: queryKeys.user,
    queryFn: () => (USE_MOCKS ? mockFetchCurrentUser() : apiFetchCurrentUser()),
  })
}

export function useProjects() {
  return useQuery({
    queryKey: queryKeys.projects,
    queryFn: () => (USE_MOCKS ? mockFetchProjects() : apiFetchProjects()),
  })
}

export function useProject(id: string) {
  return useQuery({
    queryKey: queryKeys.project(id),
    queryFn: () => (USE_MOCKS ? mockFetchProject(id) : apiFetchProject(id)),
    enabled: !!id,
  })
}

export function useRuns() {
  return useQuery({
    queryKey: queryKeys.runs,
    queryFn: () => (USE_MOCKS ? mockFetchRuns() : apiFetchRuns()),
  })
}

export function useRun(id: string) {
  return useQuery({
    queryKey: queryKeys.run(id),
    queryFn: () => (USE_MOCKS ? mockFetchRun(id) : apiFetchRun(id)),
    enabled: !!id,
  })
}

export function useRunOutputs(id: string) {
  return useQuery({
    queryKey: queryKeys.runOutputs(id),
    queryFn: () => (USE_MOCKS ? mockFetchRunOutputs(id) : apiFetchRunOutputs(id)),
    enabled: !!id,
  })
}

export function useRunLogs(id: string) {
  return useQuery({
    queryKey: queryKeys.runLogs(id),
    queryFn: () => (USE_MOCKS ? mockFetchRunLogs(id) : apiFetchRunLogs(id)),
    enabled: !!id,
  })
}

export function useRunDocuments(id: string) {
  return useQuery({
    queryKey: queryKeys.runDocuments(id),
    queryFn: () => (USE_MOCKS ? mockFetchRunDocuments(id) : apiFetchRunDocuments(id)),
    enabled: !!id,
  })
}

export function useDashboardStats() {
  return useQuery({
    queryKey: queryKeys.dashboard,
    queryFn: () => (USE_MOCKS ? mockFetchDashboardStats() : apiFetchDashboardStats()),
  })
}

// --- Mutations ---------------------------------------------------------------
export function useGenerate() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (input: GenerateInput) => generate(input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.projects })
      qc.invalidateQueries({ queryKey: queryKeys.runs })
      qc.invalidateQueries({ queryKey: queryKeys.dashboard })
    },
  })
}

export function useExportJira() {
  return useMutation({
    mutationFn: (input: { runId: string; projectKey?: string }) => exportJira(input),
  })
}

export function useExportGithub() {
  return useMutation({
    mutationFn: (input: {
      runId: string
      repo?: string
      token?: string
      dryRun?: boolean
      labels?: string[]
    }) => exportGithub(input),
  })
}
