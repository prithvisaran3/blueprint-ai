import { motion } from 'framer-motion'
import { GlassCard } from '@/components/shared'
import { AGENT_META } from '@/lib/agents'
import { AGENT_ORDER } from '@/types'
import { cn, formatDuration, formatTokens } from '@/lib/utils'
import { useExecutionStore } from '@/stores/executionStore'

export function ExecutionTimeline() {
  const agents = useExecutionStore((s) => s.agents)
  const selectedAgent = useExecutionStore((s) => s.selectedAgent)
  const selectAgent = useExecutionStore((s) => s.selectAgent)

  return (
    <GlassCard className="p-0">
      <div className="border-b border-border px-4 py-3 text-sm font-medium">Execution timeline</div>
      <div className="p-2">
        {AGENT_ORDER.map((key, i) => {
          const meta = AGENT_META[key]
          const rt = agents[key]
          const isSelected = selectedAgent === key
          return (
            <button
              key={key}
              onClick={() => selectAgent(key)}
              className={cn(
                'relative flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition-colors',
                isSelected ? 'bg-accent/50' : 'hover:bg-accent/30',
              )}
            >
              {/* connector */}
              {i < AGENT_ORDER.length - 1 && (
                <span
                  className="absolute left-[1.65rem] top-[2.6rem] h-[calc(100%-1.2rem)] w-px"
                  style={{
                    backgroundColor: rt.status === 'completed' ? meta.color : 'var(--color-border)',
                    opacity: rt.status === 'completed' ? 0.5 : 1,
                  }}
                />
              )}
              <span
                className="relative z-10 inline-flex size-8 shrink-0 items-center justify-center rounded-lg ring-1 ring-inset"
                style={{
                  backgroundColor:
                    rt.status === 'pending' ? 'var(--color-muted)' : `${meta.color}26`,
                  color: rt.status === 'pending' ? 'var(--color-muted-foreground)' : meta.color,
                  borderColor: `${meta.color}33`,
                }}
              >
                <meta.icon className="size-4" />
                {rt.status === 'running' && (
                  <motion.span
                    className="absolute inset-0 rounded-lg"
                    style={{ boxShadow: `0 0 16px -2px ${meta.color}` }}
                    animate={{ opacity: [0.3, 1, 0.3] }}
                    transition={{ duration: 1.4, repeat: Infinity }}
                  />
                )}
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium">{meta.title}</p>
                <p className="text-xs text-muted-foreground">
                  {rt.status === 'pending' && 'Queued'}
                  {rt.status === 'running' && `Running · ${Math.round(rt.progress)}%`}
                  {rt.status === 'completed' &&
                    `${formatTokens(rt.tokens)} tok · ${formatDuration(rt.durationMs)}`}
                  {rt.status === 'failed' && 'Failed'}
                </p>
              </div>
            </button>
          )
        })}
      </div>
    </GlassCard>
  )
}
