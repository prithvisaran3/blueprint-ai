import { create } from 'zustand'
import type { AgentKey, AgentStatus, ExecutionLog, LogLevel, StreamEvent } from '@/types'
import { AGENT_ORDER } from '@/types'
import { buildExecutionScript, type AgentScriptStep } from '@/lib/mock'

export interface AgentRuntimeState {
  status: AgentStatus
  progress: number
  tokens: number
  durationMs: number
}

interface ExecutionState {
  runId: string | null
  status: 'idle' | 'running' | 'paused' | 'completed'
  agents: Record<AgentKey, AgentRuntimeState>
  activeAgent: AgentKey | null
  logs: ExecutionLog[]
  selectedAgent: AgentKey | null
  startedAt: number | null
  completedAt: number | null
  elapsedMs: number
  // actions
  start: (runId: string) => void
  /** Begin a real (SSE-driven) run: reset state and start the elapsed timer. */
  startStream: (runId: string) => void
  /** Reduce a single backend SSE event into the store (real mode). */
  applyEvent: (event: StreamEvent) => void
  togglePause: () => void
  reset: () => void
  selectAgent: (agent: AgentKey | null) => void
}

const TICK_MS = 80

function freshAgents(): Record<AgentKey, AgentRuntimeState> {
  return AGENT_ORDER.reduce(
    (acc, key) => {
      acc[key] = { status: 'pending', progress: 0, tokens: 0, durationMs: 0 }
      return acc
    },
    {} as Record<AgentKey, AgentRuntimeState>,
  )
}

// Timer + cursor live outside React/Zustand state so re-renders don't disturb them.
let timer: ReturnType<typeof setInterval> | null = null
let script: AgentScriptStep[] = []
let stepIndex = 0
let stepElapsed = 0
let logCounter = 0
let emittedLogIndex = 0

function clearTimer() {
  if (timer) {
    clearInterval(timer)
    timer = null
  }
}

function makeLog(agent: AgentKey | 'system', level: LogLevel, message: string): ExecutionLog {
  return {
    id: `live_${logCounter++}`,
    runId: 'live',
    agent,
    level,
    message,
    ts: new Date().toISOString(),
  }
}

export const useExecutionStore = create<ExecutionState>((set, get) => {
  const tick = () => {
    const state = get()
    if (state.status !== 'running') return

    const step = script[stepIndex]
    if (!step) return

    stepElapsed += TICK_MS
    const progress = Math.min(100, (stepElapsed / step.durationMs) * 100)
    const tokens = Math.round((progress / 100) * step.tokens)

    // Surface scripted logs progressively as the agent advances.
    const logsToShow = Math.floor((progress / 100) * step.logs.length)
    const newLogs: ExecutionLog[] = []
    while (emittedLogIndex < logsToShow && emittedLogIndex < step.logs.length) {
      const line = step.logs[emittedLogIndex]
      newLogs.push(makeLog(step.agent, line.level, line.message))
      emittedLogIndex++
    }

    set((s) => ({
      elapsedMs: s.startedAt ? Date.now() - s.startedAt : 0,
      logs: newLogs.length ? [...s.logs, ...newLogs] : s.logs,
      agents: {
        ...s.agents,
        [step.agent]: {
          ...s.agents[step.agent],
          status: 'running',
          progress,
          tokens,
          durationMs: stepElapsed,
        },
      },
    }))

    if (progress >= 100) {
      // Finalize this agent.
      set((s) => ({
        agents: {
          ...s.agents,
          [step.agent]: {
            status: 'completed',
            progress: 100,
            tokens: step.tokens,
            durationMs: step.durationMs,
          },
        },
      }))

      stepIndex++
      stepElapsed = 0
      emittedLogIndex = 0

      const next = script[stepIndex]
      if (next) {
        set((s) => ({
          activeAgent: next.agent,
          agents: { ...s.agents, [next.agent]: { ...s.agents[next.agent], status: 'running' } },
        }))
      } else {
        clearTimer()
        set((s) => ({
          status: 'completed',
          activeAgent: null,
          completedAt: Date.now(),
          logs: [...s.logs, makeLog('system', 'info', 'Run completed — opening workspace.')],
        }))
      }
    }
  }

  return {
    runId: null,
    status: 'idle',
    agents: freshAgents(),
    activeAgent: null,
    logs: [],
    selectedAgent: null,
    startedAt: null,
    completedAt: null,
    elapsedMs: 0,

    start: (runId) => {
      clearTimer()
      script = buildExecutionScript()
      stepIndex = 0
      stepElapsed = 0
      emittedLogIndex = 0
      logCounter = 0
      const first = script[0]
      set({
        runId,
        status: 'running',
        agents: {
          ...freshAgents(),
          [first.agent]: { status: 'running', progress: 0, tokens: 0, durationMs: 0 },
        },
        activeAgent: first.agent,
        logs: [makeLog('system', 'info', 'Run started — dispatching agents.')],
        selectedAgent: first.agent,
        startedAt: Date.now(),
        completedAt: null,
        elapsedMs: 0,
      })
      timer = setInterval(tick, TICK_MS)
    },

    startStream: (runId) => {
      clearTimer()
      logCounter = 0
      set({
        runId,
        status: 'running',
        agents: freshAgents(),
        activeAgent: null,
        logs: [makeLog('system', 'info', 'Connecting to live run…')],
        selectedAgent: 'architect',
        startedAt: Date.now(),
        completedAt: null,
        elapsedMs: 0,
      })
      // Lightweight elapsed-time ticker (no scripted progression in stream mode).
      timer = setInterval(() => {
        const s = get()
        if (s.status !== 'running' || !s.startedAt) return
        set({ elapsedMs: Date.now() - s.startedAt })
      }, 200)
    },

    applyEvent: (event) => {
      const agent = event.agent !== 'system' ? (event.agent as AgentKey) : null
      const p = event.payload ?? {}

      switch (event.type) {
        case 'agent_started': {
          if (!agent) break
          set((s) => ({
            activeAgent: agent,
            selectedAgent: s.selectedAgent ?? agent,
            logs: [...s.logs, makeLog(agent, 'info', `${agent} started`)],
            agents: {
              ...s.agents,
              [agent]: { ...s.agents[agent], status: 'running', progress: 5 },
            },
          }))
          break
        }
        case 'agent_token': {
          if (!agent) break
          set((s) => {
            const rt = s.agents[agent]
            return {
              agents: {
                ...s.agents,
                [agent]: { ...rt, status: 'running', progress: Math.min(90, rt.progress + 12) },
              },
            }
          })
          break
        }
        case 'agent_progress': {
          if (!agent) break
          set((s) => ({
            agents: {
              ...s.agents,
              [agent]: {
                ...s.agents[agent],
                progress: typeof p.progress === 'number' ? p.progress : s.agents[agent].progress,
              },
            },
          }))
          break
        }
        case 'agent_completed': {
          if (!agent) break
          const failed = p.message === 'failed' || (p as { status?: string }).status === 'failed'
          set((s) => ({
            logs: [
              ...s.logs,
              makeLog(agent, failed ? 'error' : 'info', `${agent} ${failed ? 'failed' : 'completed'}`),
            ],
            agents: {
              ...s.agents,
              [agent]: {
                status: failed ? 'failed' : 'completed',
                progress: 100,
                tokens: typeof p.tokens === 'number' ? p.tokens : s.agents[agent].tokens,
                durationMs: typeof p.durationMs === 'number' ? p.durationMs : s.agents[agent].durationMs,
              },
            },
          }))
          break
        }
        case 'run_completed': {
          clearTimer()
          set((s) => ({
            status: 'completed',
            activeAgent: null,
            completedAt: Date.now(),
            logs: [...s.logs, makeLog('system', 'info', 'Run completed — opening workspace.')],
          }))
          break
        }
        case 'error': {
          set((s) => ({
            logs: [
              ...s.logs,
              makeLog(agent ?? 'system', 'error', String(p.message ?? 'An error occurred')),
            ],
          }))
          break
        }
        default:
          break
      }
    },

    togglePause: () => {
      const { status } = get()
      if (status === 'running') {
        clearTimer()
        set({ status: 'paused' })
      } else if (status === 'paused') {
        set({ status: 'running' })
        timer = setInterval(tick, TICK_MS)
      }
    },

    reset: () => {
      clearTimer()
      script = []
      stepIndex = 0
      stepElapsed = 0
      emittedLogIndex = 0
      set({
        runId: null,
        status: 'idle',
        agents: freshAgents(),
        activeAgent: null,
        logs: [],
        selectedAgent: null,
        startedAt: null,
        completedAt: null,
        elapsedMs: 0,
      })
    },

    selectAgent: (agent) => set({ selectedAgent: agent }),
  }
})
