import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  exportGithub,
  exportJira,
  generate,
  type GenerateInput,
} from '@/lib/data'
import {
  loadCurrentUser,
  loadDashboardStats,
  loadProject,
  loadProjects,
  loadRun,
  loadRunDocuments,
  loadRunLogs,
  loadRunOutputs,
  loadRuns,
} from '@/lib/loaders'

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
  return useQuery({ queryKey: queryKeys.user, queryFn: loadCurrentUser })
}

export function useProjects() {
  return useQuery({ queryKey: queryKeys.projects, queryFn: loadProjects })
}

export function useProject(id: string) {
  return useQuery({
    queryKey: queryKeys.project(id),
    queryFn: () => loadProject(id),
    enabled: !!id,
  })
}

export function useRuns() {
  return useQuery({ queryKey: queryKeys.runs, queryFn: loadRuns })
}

export function useRun(id: string) {
  return useQuery({
    queryKey: queryKeys.run(id),
    queryFn: () => loadRun(id),
    enabled: !!id,
  })
}

export function useRunOutputs(id: string) {
  return useQuery({
    queryKey: queryKeys.runOutputs(id),
    queryFn: () => loadRunOutputs(id),
    enabled: !!id,
  })
}

export function useRunLogs(id: string) {
  return useQuery({
    queryKey: queryKeys.runLogs(id),
    queryFn: () => loadRunLogs(id),
    enabled: !!id,
  })
}

export function useRunDocuments(id: string) {
  return useQuery({
    queryKey: queryKeys.runDocuments(id),
    queryFn: () => loadRunDocuments(id),
    enabled: !!id,
  })
}

export function useDashboardStats() {
  return useQuery({ queryKey: queryKeys.dashboard, queryFn: loadDashboardStats })
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
