import { CheckCircle2, AlertCircle, XCircle } from 'lucide-react'
import { GlassCard } from '@/components/shared'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { MarkdownView } from '../MarkdownView'
import { CodeArtifacts } from '../CodeArtifacts'
import type { QaCheck, QaOutput } from '@/types'

const STATUS = {
  pass: { icon: CheckCircle2, color: 'text-success', variant: 'success' as const },
  warn: { icon: AlertCircle, color: 'text-warning', variant: 'warning' as const },
  fail: { icon: XCircle, color: 'text-destructive', variant: 'destructive' as const },
}

function CheckRow({ check }: { check: QaCheck }) {
  const s = STATUS[check.status]
  const Icon = s.icon
  return (
    <div className="flex items-start gap-3 rounded-xl border border-border bg-card/40 p-3">
      <Icon className={`mt-0.5 size-4 shrink-0 ${s.color}`} />
      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between gap-2">
          <p className="text-sm font-medium">{check.title}</p>
          <Badge variant={check.severity === 'high' ? 'destructive' : check.severity === 'medium' ? 'warning' : 'muted'} className="capitalize">
            {check.severity}
          </Badge>
        </div>
        <p className="mt-1 text-xs text-muted-foreground">{check.detail}</p>
      </div>
    </div>
  )
}

export function QaTab({ data }: { data: QaOutput }) {
  return (
    <div className="space-y-6">
      <div className="grid gap-6 lg:grid-cols-3">
        <GlassCard className="lg:col-span-1">
          <h3 className="font-semibold">Test coverage</h3>
          <p className="mt-4 text-4xl font-semibold tabular-nums">{data.coverage}%</p>
          <Progress value={data.coverage} className="mt-3" />
          <p className="mt-3 text-xs text-muted-foreground">
            {data.checks.filter((c) => c.status === 'pass').length} passed ·{' '}
            {data.checks.filter((c) => c.status === 'warn').length} warnings ·{' '}
            {data.checks.filter((c) => c.status === 'fail').length} failed
          </p>
        </GlassCard>
        <GlassCard className="lg:col-span-2">
          <MarkdownView content={data.contentMd} />
        </GlassCard>
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        {data.checks.map((check) => (
          <CheckRow key={check.id} check={check} />
        ))}
      </div>

      {data.artifacts.length > 0 && (
        <div>
          <h3 className="mb-3 text-sm font-medium text-muted-foreground">Test artifacts</h3>
          <CodeArtifacts artifacts={data.artifacts} />
        </div>
      )}
    </div>
  )
}
