import { motion } from 'framer-motion'
import { GlassCard } from '@/components/shared'
import { AGENT_META } from '@/lib/agents'
import { formatDuration, formatTokens } from '@/lib/utils'
import type { AgentMetric } from '@/types'

export function AgentMetrics({ metrics }: { metrics: AgentMetric[] }) {
  const maxTokens = Math.max(...metrics.map((m) => m.avgTokens))

  return (
    <GlassCard>
      <h3 className="font-semibold">Agent performance</h3>
      <p className="text-xs text-muted-foreground">Average tokens & duration per agent</p>

      <div className="mt-5 space-y-3.5">
        {metrics.map((m, i) => {
          const meta = AGENT_META[m.agent]
          return (
            <div key={m.agent} className="flex items-center gap-3">
              <span
                className="inline-flex size-7 shrink-0 items-center justify-center rounded-md"
                style={{ backgroundColor: `${meta.color}1f`, color: meta.color }}
              >
                <meta.icon className="size-3.5" />
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-medium">{meta.label}</span>
                  <span className="text-muted-foreground">
                    {formatTokens(m.avgTokens)} · {formatDuration(m.avgDurationMs)}
                  </span>
                </div>
                <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-muted">
                  <motion.div
                    className="h-full rounded-full"
                    style={{ backgroundColor: meta.color }}
                    initial={{ width: 0 }}
                    animate={{ width: `${(m.avgTokens / maxTokens) * 100}%` }}
                    transition={{ duration: 0.9, delay: i * 0.06, ease: [0.16, 1, 0.3, 1] }}
                  />
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </GlassCard>
  )
}
