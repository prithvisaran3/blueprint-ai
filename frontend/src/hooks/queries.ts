import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  exportGithub,
  exportJira,
  fetchCurrentUser,
  fetchDashboardStats,
  fetchProject,
  fetchProjects,
  fetchRun,
  fetchRunDocuments,
  fetchRunLogs,
  fetchRunOutputs,
  fetchRuns,
  generate,
  type GenerateInput,
} from '@/lib/data'

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
  return useQuery({ queryKey: queryKeys.user, queryFn: () => fetchCurrentUser() })
}

export function useProjects() {
  return useQuery({ queryKey: queryKeys.projects, queryFn: () => fetchProjects() })
}

export function useProject(id: string) {
  return useQuery({
    queryKey: queryKeys.project(id),
    queryFn: () => fetchProject(id),
    enabled: !!id,
  })
}

export function useRuns() {
  return useQuery({ queryKey: queryKeys.runs, queryFn: () => fetchRuns() })
}

export function useRun(id: string) {
  return useQuery({
    queryKey: queryKeys.run(id),
    queryFn: () => fetchRun(id),
    enabled: !!id,
  })
}

export function useRunOutputs(id: string) {
  return useQuery({
    queryKey: queryKeys.runOutputs(id),
    queryFn: () => fetchRunOutputs(id),
    enabled: !!id,
  })
}

export function useRunLogs(id: string) {
  return useQuery({
    queryKey: queryKeys.runLogs(id),
    queryFn: () => fetchRunLogs(id),
    enabled: !!id,
  })
}

export function useRunDocuments(id: string) {
  return useQuery({
    queryKey: queryKeys.runDocuments(id),
    queryFn: () => fetchRunDocuments(id),
    enabled: !!id,
  })
}

export function useDashboardStats() {
  return useQuery({ queryKey: queryKeys.dashboard, queryFn: () => fetchDashboardStats() })
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
