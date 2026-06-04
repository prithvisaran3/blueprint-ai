/**
 * Low-level API client: a typed `fetch` wrapper that attaches the Supabase JWT
 * as a Bearer token, prefixes the configured API base URL, and normalizes
 * errors into a consistent `ApiError`.
 */
import { API_BASE_URL } from '@/lib/env'
import { debugLog, debugWarn } from '@/lib/debug'
import { getAccessToken } from '@/lib/supabase'

export class ApiError extends Error {
  status: number
  code: string
  constructor(message: string, status: number, code = 'error') {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.code = code
  }
}

interface RequestOptions {
  method?: string
  body?: unknown
  /** Query params appended to the URL (skips null/undefined values). */
  params?: Record<string, string | number | boolean | undefined>
  signal?: AbortSignal
}

function buildUrl(path: string, params?: RequestOptions['params']): string {
  const url = new URL(`${API_BASE_URL}${path}`)
  if (params) {
    for (const [key, value] of Object.entries(params)) {
      if (value !== undefined && value !== null) url.searchParams.set(key, String(value))
    }
  }
  return url.toString()
}

export async function apiFetch<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { method = 'GET', body, params, signal } = options
  const headers: Record<string, string> = { Accept: 'application/json' }

  const token = await getAccessToken()
  if (token) headers.Authorization = `Bearer ${token}`
  else debugWarn('api', `No auth token for ${method} ${path} — request may return 401`)
  if (body !== undefined) headers['Content-Type'] = 'application/json'

  const url = buildUrl(path, params)
  debugLog('api', `${method} ${url}`, body ?? undefined)

  let response: Response
  try {
    response = await fetch(url, {
      method,
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
      signal,
    })
  } catch (err) {
    if (err instanceof DOMException && err.name === 'AbortError') throw err
    throw new ApiError('Network error — is the backend running?', 0, 'network_error')
  }

  if (response.status === 204) return undefined as T

  const text = await response.text()
  const data = text ? safeJson(text) : null

  if (!response.ok) {
    const errObj = (data as { error?: { message?: string; code?: string } } | null)?.error
    const apiError = new ApiError(
      errObj?.message ?? response.statusText ?? 'Request failed',
      response.status,
      errObj?.code ?? 'error',
    )
    debugWarn('api', `${method} ${path} → ${response.status}`, apiError.message)
    throw apiError
  }

  debugLog('api', `${method} ${path} → ${response.status}`)
  return data as T
}

function safeJson(text: string): unknown {
  try {
    return JSON.parse(text)
  } catch {
    return text
  }
}
