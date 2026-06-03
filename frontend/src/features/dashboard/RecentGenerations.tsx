import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ChevronRight } from 'lucide-react'
import { GlassCard, StatusBadge } from '@/components/shared'
import { formatDuration, formatTokens, timeAgo } from '@/lib/utils'
import { fadeInUp, staggerContainer } from '@/lib/motion'
import type { AgentRun } from '@/types'

export function RecentGenerations({ runs }: { runs: AgentRun[] }) {
  const navigate = useNavigate()
  return (
    <GlassCard>
      <div className="mb-4 flex items-center justify-between">
        <h3 className="font-semibold">Recent generations</h3>
        <span className="text-xs text-muted-foreground">{runs.length} runs</span>
      </div>

      <motion.ul variants={staggerContainer(0.06)} initial="hidden" animate="visible" className="space-y-1.5">
        {runs.map((run) => (
          <motion.li key={run.id} variants={fadeInUp}>
            <button
              onClick={() =>
                navigate(run.status === 'running' ? `/executions/${run.id}` : `/workspace/${run.id}`)
              }
              className="group flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition-colors hover:bg-accent/40"
            >
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{run.projectName}</p>
                <p className="text-xs text-muted-foreground">
                  {formatTokens(run.totalTokens)} tokens · {formatDuration(run.totalDurationMs)} ·{' '}
                  {timeAgo(run.startedAt)}
                </p>
              </div>
              {run.healthScore && (
                <span className="hidden text-sm font-medium tabular-nums text-foreground sm:block">
                  {run.healthScore.overall}
                </span>
              )}
              <StatusBadge status={run.status} />
              <ChevronRight className="size-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
            </button>
          </motion.li>
        ))}
      </motion.ul>
    </GlassCard>
  )
}
