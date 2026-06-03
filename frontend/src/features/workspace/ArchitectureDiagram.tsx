import { memo, useMemo } from 'react'
import {
  ReactFlow,
  Background,
  BackgroundVariant,
  Controls,
  Handle,
  Position,
  MarkerType,
  type Edge,
  type Node,
  type NodeProps,
} from '@xyflow/react'
import '@xyflow/react/dist/style.css'
import { Monitor, Server, Database, Cloud } from 'lucide-react'
import type { ArchitectOutput, ArchitectureNodeSpec } from '@/types'

const KIND_STYLE = {
  client: { color: '#38bdf8', icon: Monitor, column: 0 },
  service: { color: '#a855f7', icon: Server, column: 1 },
  datastore: { color: '#34d399', icon: Database, column: 2 },
  external: { color: '#fbbf24', icon: Cloud, column: 3 },
} as const

interface ArchNodeData extends Record<string, unknown> {
  spec: ArchitectureNodeSpec
}
type ArchFlowNode = Node<ArchNodeData, 'arch'>

const ArchNode = memo(({ data }: NodeProps<ArchFlowNode>) => {
  const style = KIND_STYLE[data.spec.kind]
  const Icon = style.icon
  return (
    <div
      className="w-44 rounded-xl border bg-card/80 p-3 backdrop-blur-xl"
      style={{ borderColor: `${style.color}55`, boxShadow: `0 0 18px -8px ${style.color}` }}
    >
      <Handle type="target" position={Position.Left} className="!size-2 !border-border !bg-muted" />
      <Handle type="source" position={Position.Right} className="!size-2 !border-border !bg-muted" />
      <div className="flex items-center gap-2">
        <span
          className="inline-flex size-7 items-center justify-center rounded-lg"
          style={{ backgroundColor: `${style.color}22`, color: style.color }}
        >
          <Icon className="size-4" />
        </span>
        <p className="text-sm font-semibold">{data.spec.label}</p>
      </div>
      <p className="mt-1.5 text-[11px] leading-tight text-muted-foreground">{data.spec.description}</p>
    </div>
  )
})
ArchNode.displayName = 'ArchNode'

const nodeTypes = { arch: ArchNode }

export function ArchitectureDiagram({ architecture }: { architecture: ArchitectOutput }) {
  const nodes = useMemo<Node[]>(() => {
    const perColumn: Record<number, number> = {}
    return architecture.nodes.map((spec) => {
      const col = KIND_STYLE[spec.kind].column
      const row = perColumn[col] ?? 0
      perColumn[col] = row + 1
      return {
        id: spec.id,
        type: 'arch',
        position: { x: col * 250, y: row * 130 },
        data: { spec },
      }
    })
  }, [architecture.nodes])

  const edges = useMemo<Edge[]>(
    () =>
      architecture.edges.map((e, i) => ({
        id: `arch-e-${i}`,
        source: e.source,
        target: e.target,
        label: e.label,
        type: 'smoothstep',
        animated: true,
        labelStyle: { fill: 'var(--color-muted-foreground)', fontSize: 11 },
        labelBgStyle: { fill: 'var(--color-card)', fillOpacity: 0.8 },
        style: { stroke: 'var(--color-border)', strokeWidth: 1.5 },
        markerEnd: { type: MarkerType.ArrowClosed, color: 'var(--color-border)' },
      })),
    [architecture.edges],
  )

  return (
    <div className="h-[440px] w-full overflow-hidden rounded-2xl border border-border bg-card/30">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        fitView
        fitViewOptions={{ padding: 0.2 }}
        nodesDraggable={false}
        nodesConnectable={false}
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
