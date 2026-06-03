import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import type { AgentStatus, ProjectStatus, RunStatus } from '@/types'

type AnyStatus = AgentStatus | ProjectStatus | RunStatus

const LABELS: Record<AnyStatus, string> = {
  pending: 'Pending',
  queued: 'Queued',
  running: 'Running',
  completed: 'Completed',
  failed: 'Failed',
  draft: 'Draft',
}

const VARIANT: Record<AnyStatus, 'default' | 'success' | 'warning' | 'destructive' | 'muted'> = {
  pending: 'muted',
  queued: 'muted',
  draft: 'muted',
  running: 'default',
  completed: 'success',
  failed: 'destructive',
}

export function StatusBadge({ status, className }: { status: AnyStatus; className?: string }) {
  const isRunning = status === 'running'
  return (
    <Badge variant={VARIANT[status]} className={cn('capitalize', className)}>
      <span
        className={cn(
          'size-1.5 rounded-full',
          status === 'completed' && 'bg-success',
          isRunning && 'bg-primary animate-pulse',
          status === 'failed' && 'bg-destructive',
          (status === 'pending' || status === 'queued' || status === 'draft') && 'bg-muted-foreground',
        )}
      />
      {LABELS[status]}
    </Badge>
  )
}
