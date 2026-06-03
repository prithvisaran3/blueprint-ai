import { useEffect, useRef } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Terminal } from 'lucide-react'
import { GlassCard } from '@/components/shared'
import { AGENT_META } from '@/lib/agents'
import { cn } from '@/lib/utils'
import { useExecutionStore } from '@/stores/executionStore'

const LEVEL_COLOR = {
  info: 'text-muted-foreground',
  warn: 'text-warning',
  error: 'text-destructive',
} as const

export function LiveOutputDrawer() {
  const logs = useExecutionStore((s) => s.logs)
  const status = useExecutionStore((s) => s.status)
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const el = scrollRef.current
    if (el) el.scrollTop = el.scrollHeight
  }, [logs])

  return (
    <GlassCard className="flex h-full flex-col p-0">
      <div className="flex items-center justify-between border-b border-border px-4 py-3">
        <div className="flex items-center gap-2 text-sm font-medium">
          <Terminal className="size-4 text-primary" />
          Live output
        </div>
        <span
          className={cn(
            'flex items-center gap-1.5 text-xs',
            status === 'running' ? 'text-primary' : 'text-muted-foreground',
          )}
        >
          <span
            className={cn(
              'size-1.5 rounded-full',
              status === 'running' ? 'animate-pulse bg-primary' : 'bg-muted-foreground',
            )}
          />
          {status === 'running' ? 'streaming' : status}
        </span>
      </div>

      <div
        ref={scrollRef}
        className="flex-1 space-y-1.5 overflow-y-auto p-4 font-mono text-xs"
      >
        <AnimatePresence initial={false}>
          {logs.map((log) => {
            const meta = log.agent !== 'system' ? AGENT_META[log.agent] : null
            return (
              <motion.div
                key={log.id}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                className="flex gap-2"
              >
                <span className="shrink-0 text-muted-foreground/50">
                  {new Date(log.ts).toLocaleTimeString('en-US', { hour12: false })}
                </span>
                <span
                  className="shrink-0 font-medium"
                  style={{ color: meta?.color ?? 'var(--color-muted-foreground)' }}
                >
                  [{meta?.label ?? 'system'}]
                </span>
                <span className={LEVEL_COLOR[log.level]}>{log.message}</span>
              </motion.div>
            )
          })}
        </AnimatePresence>
        {logs.length === 0 && (
          <p className="text-muted-foreground">Waiting for the run to start…</p>
        )}
      </div>
    </GlassCard>
  )
}
