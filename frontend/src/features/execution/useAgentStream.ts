import { useEffect, useRef } from 'react'
import type { StreamEvent, StreamEventType } from '@/types'
import { useExecutionStore } from '@/stores/executionStore'
import { SSE_BASE_URL, USE_MOCKS } from '@/lib/env'
import { debugError, debugLog, debugWarn } from '@/lib/debug'
import { getAccessToken } from '@/lib/supabase'

const SSE_EVENT_TYPES: StreamEventType[] = [
  'agent_started',
  'agent_token',
  'agent_progress',
  'agent_completed',
  'run_completed',
  'error',
]

/** Map a raw backend SSE envelope (`{type, agent, run_id, payload, ts}`) to a `StreamEvent`. */
function toStreamEvent(type: string, raw: unknown): StreamEvent {
  const data = (raw ?? {}) as { agent?: string | null; run_id?: string; payload?: Record<string, unknown>; ts?: string }
  const payload = { ...(data.payload ?? {}) }
  // Normalize snake_case numeric fields the store reads as camelCase.
  if (typeof payload.duration_ms === 'number') payload.durationMs = payload.duration_ms
  return {
    type: type as StreamEventType,
    agent: (data.agent ?? 'system') as StreamEvent['agent'],
    runId: data.run_id ?? '',
    payload,
    ts: data.ts ?? new Date().toISOString(),
  }
}

/**
 * Drives the live execution view.
 *
 * In mock mode this plays a scripted timeline from the Zustand execution store.
 * In real mode it opens an `EventSource` against
 * `GET /executions/{runId}/stream` and dispatches each SSE event into the store
 * so the React Flow graph animates from real backend events.
 */
export function useAgentStream(runId: string, autostart = true) {
  const store = useExecutionStore()
  const { start, startStream, applyEvent, reset, status, runId: activeRunId } = store
  const streamGenRef = useRef(0)

  // --- Mock mode: scripted timeline ----------------------------------------
  useEffect(() => {
    if (!USE_MOCKS || !runId || !autostart) return
    if (activeRunId !== runId && status !== 'running') start(runId)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [runId, autostart])

  // --- Real mode: live SSE EventSource -------------------------------------
  useEffect(() => {
    if (USE_MOCKS || !runId || !autostart) return

    const generation = ++streamGenRef.current
    let es: EventSource | null = null
    let cancelled = false

    // Start immediately — don't wait for the async token fetch. React StrictMode
    // remounts effects in dev; a ref guard that skipped the second mount left
    // runs stuck at "Queued" forever.
    startStream(runId)
    debugLog('stream', `Opening SSE for run ${runId}`)

    ;(async () => {
      const token = await getAccessToken()
      if (cancelled || generation !== streamGenRef.current) return

      if (!token) {
        debugWarn('stream', 'No Supabase session token — SSE may be rejected with 401')
      }

      const params = token ? `?access_token=${encodeURIComponent(token)}` : ''
      const url = `${SSE_BASE_URL}/executions/${runId}/stream${params}`
      debugLog('stream', `Connecting EventSource`, { url: url.replace(/access_token=[^&]+/, 'access_token=***') })

      es = new EventSource(url)

      for (const type of SSE_EVENT_TYPES) {
        es.addEventListener(type, (ev) => {
          try {
            const parsed = JSON.parse((ev as MessageEvent).data)
            const event = toStreamEvent(type, parsed)
            debugLog('stream', `← ${type}`, event.agent)
            applyEvent(event)
            if (type === 'run_completed') es?.close()
          } catch (err) {
            debugError('stream', 'Malformed SSE event', err)
          }
        })
      }

      es.onopen = () => debugLog('stream', 'SSE connection open')

      es.onerror = () => {
        const state = useExecutionStore.getState()
        if (state.status === 'completed') return
        debugError('stream', 'SSE connection error — check Network tab for /stream status')
        applyEvent(
          toStreamEvent('error', {
            payload: {
              message:
                'Lost connection to the agent stream. If you are not signed in, log in and refresh. On the free Render tier the backend may still be waking up — wait ~60s and reload.',
            },
          }),
        )
        es?.close()
      }
    })()

    return () => {
      cancelled = true
      es?.close()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [runId, autostart])

  return { ...store, reset }
}
