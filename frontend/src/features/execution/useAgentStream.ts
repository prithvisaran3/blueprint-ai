import { useEffect, useRef } from 'react'
import type { StreamEvent, StreamEventType } from '@/types'
import { useExecutionStore } from '@/stores/executionStore'
import { SSE_BASE_URL, USE_MOCKS } from '@/lib/env'
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
  const connectedRef = useRef<string | null>(null)

  // --- Mock mode: scripted timeline ----------------------------------------
  useEffect(() => {
    if (!USE_MOCKS || !runId || !autostart) return
    if (activeRunId !== runId && status !== 'running') start(runId)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [runId, autostart])

  // --- Real mode: live SSE EventSource -------------------------------------
  useEffect(() => {
    if (USE_MOCKS || !runId || !autostart) return
    if (connectedRef.current === runId) return
    connectedRef.current = runId

    let es: EventSource | null = null
    let cancelled = false

    ;(async () => {
      const token = await getAccessToken()
      if (cancelled) return
      startStream(runId)
      const params = token ? `?access_token=${encodeURIComponent(token)}` : ''
      es = new EventSource(`${SSE_BASE_URL}/executions/${runId}/stream${params}`)

      for (const type of SSE_EVENT_TYPES) {
        es.addEventListener(type, (ev) => {
          try {
            const parsed = JSON.parse((ev as MessageEvent).data)
            const event = toStreamEvent(type, parsed)
            applyEvent(event)
            if (type === 'run_completed') es?.close()
          } catch {
            /* ignore malformed event */
          }
        })
      }

      es.onerror = () => {
        // The stream closes naturally after run_completed; only surface real errors.
        if (useExecutionStore.getState().status !== 'completed') {
          applyEvent(toStreamEvent('error', { payload: { message: 'Connection lost' } }))
        }
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
