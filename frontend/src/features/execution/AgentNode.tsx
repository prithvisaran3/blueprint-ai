import { memo } from 'react'
import { Handle, Position, type NodeProps, type Node } from '@xyflow/react'
import { motion } from 'framer-motion'
import { Check, Loader2, X } from 'lucide-react'
import { AGENT_META } from '@/lib/agents'
import { cn, formatDuration, formatTokens } from '@/lib/utils'
import type { AgentKey, AgentStatus } from '@/types'

export interface AgentNodeData extends Record<string, unknown> {
  agent: AgentKey
  status: AgentStatus
  progress: number
  tokens: number
  durationMs: number
}

export type AgentFlowNode = Node<AgentNodeData, 'agent'>

function StatusIcon({ status, color }: { status: AgentStatus; color: string }) {
  if (status === 'completed') return <Check className="size-3.5 text-success" />
  if (status === 'failed') return <X className="size-3.5 text-destructive" />
  if (status === 'running')
    return <Loader2 className="size-3.5 animate-spin" style={{ color }} />
  return <span className="size-1.5 rounded-full bg-muted-foreground" />
}

function AgentNodeComponent({ data, selected }: NodeProps<AgentFlowNode>) {
  const meta = AGENT_META[data.agent]
  const isRunning = data.status === 'running'
  const isDone = data.status === 'completed'

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ type: 'spring', stiffness: 300, damping: 24 }}
      className={cn(
        'relative w-48 rounded-2xl border bg-card/80 p-3.5 backdrop-blur-xl transition-all duration-300',
        selected ? 'border-primary/60' : 'border-border',
      )}
      style={
        isRunning
          ? { boxShadow: `0 0 0 1px ${meta.color}66, 0 0 28px -4px ${meta.color}` }
          : isDone
            ? { boxShadow: `0 0 0 1px ${meta.color}33` }
            : undefined
      }
    >
      <Handle type="target" position={Position.Left} className="!size-2 !border-border !bg-muted" />
      <Handle type="source" position={Position.Right} className="!size-2 !border-border !bg-muted" />

      {/* Animated glow ring while running */}
      {isRunning && (
        <motion.span
          aria-hidden
          className="pointer-events-none absolute inset-0 rounded-2xl"
          style={{ boxShadow: `0 0 22px -2px ${meta.color}` }}
          animate={{ opacity: [0.4, 1, 0.4] }}
          transition={{ duration: 1.6, repeat: Infinity, ease: 'easeInOut' }}
        />
      )}

      <div className="relative flex items-center gap-2.5">
        <span
          className="inline-flex size-9 shrink-0 items-center justify-center rounded-xl ring-1 ring-inset transition-colors"
          style={{
            backgroundColor: isRunning || isDone ? `${meta.color}26` : 'var(--color-muted)',
            color: isRunning || isDone ? meta.color : 'var(--color-muted-foreground)',
            borderColor: `${meta.color}33`,
          }}
        >
          <meta.icon className="size-4.5" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold leading-tight">{meta.label}</p>
          <p className="truncate text-[11px] text-muted-foreground">{meta.role}</p>
        </div>
        <StatusIcon status={data.status} color={meta.color} />
      </div>

      {/* Progress bar */}
      <div className="relative mt-3 h-1.5 overflow-hidden rounded-full bg-muted">
        <motion.div
          className="h-full rounded-full"
          style={{ backgroundColor: meta.color }}
          animate={{ width: `${data.progress}%` }}
          transition={{ ease: 'linear', duration: 0.1 }}
        />
      </div>

      <div className="relative mt-2 flex items-center justify-between text-[10px] text-muted-foreground">
        <span className="tabular-nums">{formatTokens(data.tokens)} tok</span>
        <span className="tabular-nums">
          {data.durationMs > 0 ? formatDuration(data.durationMs) : '—'}
        </span>
      </div>
    </motion.div>
  )
}

export const AgentNode = memo(AgentNodeComponent)
