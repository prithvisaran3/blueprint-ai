import type { AgentKey, LogLevel } from '@/types'
import { AGENT_ORDER } from '@/types'
import { mockAgentOutputs } from './data'

export interface AgentScriptStep {
  agent: AgentKey
  /** Simulated wall-clock duration for this agent in the mock stream (ms). */
  durationMs: number
  /** Total tokens the agent "emits". */
  tokens: number
  /** Log lines surfaced while the agent runs. */
  logs: { level: LogLevel; message: string }[]
}

const AGENT_LOGS: Record<AgentKey, { level: LogLevel; message: string }[]> = {
  architect: [
    { level: 'info', message: 'Parsing idea and constraints…' },
    { level: 'info', message: 'Evaluating candidate tech stacks…' },
    { level: 'info', message: 'Locked architecture: layered + event-driven.' },
  ],
  planner: [
    { level: 'info', message: 'Decomposing scope into epics…' },
    { level: 'info', message: 'Sequencing stories for a week-4 vertical slice…' },
    { level: 'info', message: 'Generated 3 epics · 5 stories · 12 tasks.' },
  ],
  backend: [
    { level: 'info', message: 'Designing data model + migrations…' },
    { level: 'info', message: 'Generating FastAPI routers and Pydantic schemas…' },
    { level: 'info', message: 'Wired websocket gateway with Redis fan-out.' },
  ],
  frontend: [
    { level: 'info', message: 'Mapping component hierarchy…' },
    { level: 'info', message: 'Generating optimistic Kanban board…' },
    { level: 'info', message: 'Added presence provider over websocket.' },
  ],
  qa: [
    { level: 'info', message: 'Deriving test strategy…' },
    { level: 'warn', message: 'Flagged optimistic rollback race condition.' },
    { level: 'warn', message: 'Websocket replay missing during reconnect.' },
  ],
  documentation: [
    { level: 'info', message: 'Authoring developer guide…' },
    { level: 'info', message: 'Drafting deployment plan…' },
    { level: 'info', message: 'Compiled 2 documents.' },
  ],
  cto_review: [
    { level: 'info', message: 'Synthesizing all agent outputs…' },
    { level: 'info', message: 'Computing health, cost, team, and delivery…' },
    { level: 'info', message: 'Verdict: Approved with changes · score 87/100.' },
  ],
}

/**
 * Build the scripted timeline the execution store plays to animate the graph.
 * Durations are compressed (~3.5s/agent) so the demo feels lively but readable.
 */
export function buildExecutionScript(): AgentScriptStep[] {
  return AGENT_ORDER.map((agent) => {
    const out = mockAgentOutputs.find((o) => o.agent === agent)
    return {
      agent,
      durationMs: 3200 + Math.round(Math.random() * 1200),
      tokens: out ? out.tokens : 4000,
      logs: AGENT_LOGS[agent],
    }
  })
}
