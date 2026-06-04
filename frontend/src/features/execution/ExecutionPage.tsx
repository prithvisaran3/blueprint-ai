import { useNavigate, useParams } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { ArrowRight, Pause, Play, RotateCcw, Cpu, Coins, Timer, Gauge } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { GlassCard, StatusBadge } from '@/components/shared'
import { AGENT_META } from '@/lib/agents'
import { AGENT_ORDER } from '@/types'
import { cn, formatDuration, formatTokens } from '@/lib/utils'
import { useRun } from '@/hooks/queries'
import { useExecutionStore } from '@/stores/executionStore'
import { ExecutionGraph } from './ExecutionGraph'
import { ExecutionTimeline } from './ExecutionTimeline'
import { LiveOutputDrawer } from './LiveOutputDrawer'
import { useAgentStream } from './useAgentStream'
import { fadeInUp, staggerContainer } from '@/lib/motion'

export function ExecutionPage() {
  const { runId = '' } = useParams()
  const navigate = useNavigate()
  const { data: run } = useRun(runId)
  const { status, agents, elapsedMs, selectedAgent, togglePause, start, logs } = useAgentStream(runId)

  const completed = AGENT_ORDER.filter((a) => agents[a].status === 'completed').length
  const totalTokens = AGENT_ORDER.reduce((sum, a) => sum + agents[a].tokens, 0)
  const activeAgentKey = AGENT_ORDER.find((a) => agents[a].status === 'running') ?? null
  const overallProgress = Math.round((completed / AGENT_ORDER.length) * 100)
  const streamError = logs.find((l) => l.level === 'error')?.message

  // Reset selection-derived detail when nothing is selected yet.
  const detailKey = selectedAgent ?? activeAgentKey ?? 'architect'
  const detailMeta = AGENT_META[detailKey]
  const detailRt = agents[detailKey]

  const stats = [
    {
      icon: Cpu,
      label: 'Active agent',
      value: activeAgentKey ? AGENT_META[activeAgentKey].label : status === 'completed' ? 'Done' : '—',
    },
    { icon: Gauge, label: 'Progress', value: `${overallProgress}%` },
    { icon: Coins, label: 'Tokens', value: formatTokens(totalTokens) },
    { icon: Timer, label: 'Elapsed', value: formatDuration(elapsedMs) },
  ]

  return (
    <motion.div variants={staggerContainer(0.07)} initial="hidden" animate="visible" className="space-y-6">
      {/* Header */}
      <motion.div variants={fadeInUp} className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-semibold tracking-tight">
              {run?.projectName ?? 'Generating blueprint'}
            </h1>
            <StatusBadge status={status === 'idle' ? 'queued' : status === 'paused' ? 'running' : status} />
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            Live multi-agent execution · {completed} of {AGENT_ORDER.length} agents complete
          </p>
        </div>
        <div className="flex gap-2">
          {status === 'completed' ? (
            <Button variant="outline" onClick={() => start(runId)}>
              <RotateCcw className="size-4" /> Run again
            </Button>
          ) : (
            <Button variant="outline" onClick={togglePause} disabled={status === 'idle'}>
              {status === 'paused' ? <Play className="size-4" /> : <Pause className="size-4" />}
              {status === 'paused' ? 'Resume' : 'Pause'}
            </Button>
          )}
          <Button onClick={() => navigate(`/workspace/${runId}`)} disabled={status !== 'completed'}>
            Open workspace <ArrowRight className="size-4" />
          </Button>
        </div>
      </motion.div>

      {streamError && (
        <motion.div variants={fadeInUp} className="rounded-xl border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {streamError}
        </motion.div>
      )}

      {/* Stats */}
      <motion.div variants={fadeInUp} className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {stats.map((s) => (
          <GlassCard key={s.label} className="flex items-center gap-3 py-3.5">
            <span className="inline-flex size-9 items-center justify-center rounded-lg bg-primary/12 text-primary">
              <s.icon className="size-4" />
            </span>
            <div>
              <p className="text-xs text-muted-foreground">{s.label}</p>
              <p className="text-lg font-semibold tabular-nums">{s.value}</p>
            </div>
          </GlassCard>
        ))}
      </motion.div>

      {/* Graph + timeline */}
      <motion.div variants={fadeInUp} className="grid gap-6 xl:grid-cols-3">
        <div className="xl:col-span-2">
          <ExecutionGraph />
        </div>
        <ExecutionTimeline />
      </motion.div>

      {/* Live output + selected agent detail */}
      <motion.div variants={fadeInUp} className="grid gap-6 lg:grid-cols-3">
        <div className="h-80 lg:col-span-2">
          <LiveOutputDrawer />
        </div>
        <GlassCard className="flex flex-col">
          <div className="flex items-center gap-2.5">
            <span
              className="inline-flex size-9 items-center justify-center rounded-xl ring-1 ring-inset"
              style={{ backgroundColor: `${detailMeta.color}26`, color: detailMeta.color, borderColor: `${detailMeta.color}33` }}
            >
              <detailMeta.icon className="size-4.5" />
            </span>
            <div>
              <p className="text-sm font-semibold">{detailMeta.title}</p>
              <p className="text-xs capitalize text-muted-foreground">{detailRt.status}</p>
            </div>
          </div>
          <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{detailMeta.description}</p>

          <div className="mt-auto space-y-3 pt-4">
            <div>
              <div className="mb-1 flex justify-between text-xs text-muted-foreground">
                <span>Progress</span>
                <span className="tabular-nums">{Math.round(detailRt.progress)}%</span>
              </div>
              <div className="h-1.5 overflow-hidden rounded-full bg-muted">
                <motion.div
                  className="h-full rounded-full"
                  style={{ backgroundColor: detailMeta.color }}
                  animate={{ width: `${detailRt.progress}%` }}
                />
              </div>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-muted-foreground">Tokens</span>
              <span className="font-medium tabular-nums">{formatTokens(detailRt.tokens)}</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-muted-foreground">Duration</span>
              <span className="font-medium tabular-nums">
                {detailRt.durationMs > 0 ? formatDuration(detailRt.durationMs) : '—'}
              </span>
            </div>
          </div>
        </GlassCard>
      </motion.div>

      <CompletionBanner runId={runId} />
    </motion.div>
  )
}

function CompletionBanner({ runId }: { runId: string }) {
  const status = useExecutionStore((s) => s.status)
  const navigate = useNavigate()

  return (
    <AnimatePresence>
      {status === 'completed' && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 20 }}
          className={cn(
            'fixed bottom-6 left-1/2 z-40 flex -translate-x-1/2 items-center gap-4 rounded-2xl glass px-5 py-3 shadow-xl',
          )}
        >
          <div className="flex items-center gap-2 text-sm">
            <span className="grid size-7 place-items-center rounded-full bg-success/20 text-success">✓</span>
            Blueprint generated successfully
          </div>
          <Button size="sm" onClick={() => navigate(`/workspace/${runId}`)}>
            View results <ArrowRight className="size-4" />
          </Button>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
