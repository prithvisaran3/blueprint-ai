/**
 * Data loaders for TanStack Query.
 *
 * Uses dynamic imports so production bundles never merge mock + real fetchers
 * into a single minified binding (the source of "r is not a function" on /dashboard).
 */
import { USE_MOCKS } from './env'

async function loadMock<T extends keyof typeof import('./mock/api')>(name: T) {
  const mod = await import('./mock/api')
  return mod[name]
}

async function loadApi<T extends keyof typeof import('./api')>(name: T) {
  const mod = await import('./api')
  return mod[name]
}

export async function loadCurrentUser() {
  if (USE_MOCKS) return (await loadMock('fetchCurrentUser'))()
  return (await loadApi('fetchCurrentUser'))()
}

export async function loadProjects() {
  if (USE_MOCKS) return (await loadMock('fetchProjects'))()
  return (await loadApi('fetchProjects'))()
}

export async function loadProject(id: string) {
  if (USE_MOCKS) return (await loadMock('fetchProject'))(id)
  return (await loadApi('fetchProject'))(id)
}

export async function loadRuns() {
  if (USE_MOCKS) return (await loadMock('fetchRuns'))()
  return (await loadApi('fetchRuns'))()
}

export async function loadRun(id: string) {
  if (USE_MOCKS) return (await loadMock('fetchRun'))(id)
  return (await loadApi('fetchRun'))(id)
}

export async function loadRunOutputs(id: string) {
  if (USE_MOCKS) return (await loadMock('fetchRunOutputs'))(id)
  return (await loadApi('fetchRunOutputs'))(id)
}

export async function loadRunLogs(id: string) {
  if (USE_MOCKS) return (await loadMock('fetchRunLogs'))(id)
  return (await loadApi('fetchRunLogs'))(id)
}

export async function loadRunDocuments(id: string) {
  if (USE_MOCKS) return (await loadMock('fetchRunDocuments'))(id)
  return (await loadApi('fetchRunDocuments'))(id)
}

export async function loadDashboardStats() {
  if (USE_MOCKS) return (await loadMock('fetchDashboardStats'))()
  return (await loadApi('fetchDashboardStats'))()
}
