import { useMemo, useCallback } from 'react'
import {
  ReactFlow,
  Background,
  BackgroundVariant,
  Controls,
  MarkerType,
  type Edge,
  type Node,
  type NodeMouseHandler,
} from '@xyflow/react'
import '@xyflow/react/dist/style.css'
import { AgentNode, type AgentFlowNode } from './AgentNode'
import { AGENT_META } from '@/lib/agents'
import { AGENT_ORDER, type AgentKey } from '@/types'
import { useExecutionStore, type AgentRuntimeState } from '@/stores/executionStore'

const nodeTypes = { agent: AgentNode }

// Snake layout so the 7-stage pipeline reads as a graph, not a flat line.
const POSITIONS: Record<AgentKey, { x: number; y: number }> = {
  architect: { x: 0, y: 30 },
  planner: { x: 240, y: 30 },
  backend: { x: 480, y: 30 },
  frontend: { x: 720, y: 30 },
  qa: { x: 720, y: 230 },
  documentation: { x: 480, y: 230 },
  cto_review: { x: 240, y: 230 },
}

function buildNodes(
  agents: Record<AgentKey, AgentRuntimeState>,
  selectedAgent: AgentKey | null,
): AgentFlowNode[] {
  return AGENT_ORDER.map((key) => {
    const rt = agents[key]
    return {
      id: key,
      type: 'agent',
      position: POSITIONS[key],
      selected: selectedAgent === key,
      data: {
        agent: key,
        status: rt.status,
        progress: rt.progress,
        tokens: rt.tokens,
        durationMs: rt.durationMs,
      },
    }
  })
}

function buildEdges(agents: Record<AgentKey, AgentRuntimeState>): Edge[] {
  return AGENT_ORDER.slice(0, -1).map((key, i) => {
    const next = AGENT_ORDER[i + 1]
    const active = agents[key].status === 'completed'
    const flowing = agents[key].status === 'completed' && agents[next].status === 'running'
    return {
      id: `${key}-${next}`,
      source: key,
      target: next,
      type: 'smoothstep',
      animated: flowing,
      style: {
        stroke: active ? AGENT_META[key].color : 'var(--color-border)',
        strokeWidth: active ? 2 : 1.5,
        opacity: active ? 0.9 : 0.5,
      },
      markerEnd: {
        type: MarkerType.ArrowClosed,
        color: active ? AGENT_META[key].color : 'var(--color-border)',
        width: 16,
        height: 16,
      },
    }
  })
}

export function ExecutionGraph() {
  const agents = useExecutionStore((s) => s.agents)
  const selectedAgent = useExecutionStore((s) => s.selectedAgent)
  const selectAgent = useExecutionStore((s) => s.selectAgent)

  const nodes = useMemo<Node[]>(() => buildNodes(agents, selectedAgent), [agents, selectedAgent])
  const edges = useMemo<Edge[]>(() => buildEdges(agents), [agents])

  const onNodeClick = useCallback<NodeMouseHandler>(
    (_event, node) => selectAgent(node.id as AgentKey),
    [selectAgent],
  )

  return (
    <div className="h-[460px] w-full overflow-hidden rounded-2xl border border-border bg-card/30">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        onNodeClick={onNodeClick}
        fitView
        fitViewOptions={{ padding: 0.2 }}
        nodesDraggable={false}
        nodesConnectable={false}
        elementsSelectable
        proOptions={{ hideAttribution: true }}
        minZoom={0.4}
        maxZoom={1.4}
      >
        <Background variant={BackgroundVariant.Dots} gap={20} size={1} color="var(--color-border)" />
        <Controls
          showInteractive={false}
          className="!rounded-lg !border !border-border !bg-card/80 !backdrop-blur [&_button]:!border-border [&_button]:!bg-transparent [&_button]:!fill-muted-foreground"
        />
      </ReactFlow>
    </div>
  )
}
