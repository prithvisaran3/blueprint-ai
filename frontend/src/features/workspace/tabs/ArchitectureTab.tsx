import { GlassCard } from '@/components/shared'
import { MarkdownView } from '../MarkdownView'
import { ArchitectureDiagram } from '../ArchitectureDiagram'
import type { ArchitectOutput } from '@/types'

export function ArchitectureTab({ data }: { data: ArchitectOutput }) {
  return (
    <div className="space-y-6">
      <GlassCard>
        <h3 className="font-semibold">System diagram</h3>
        <p className="text-xs text-muted-foreground">Interactive — drag to pan, scroll to zoom.</p>
        <div className="mt-4">
          <ArchitectureDiagram architecture={data} />
        </div>
      </GlassCard>

      <div className="grid gap-6 lg:grid-cols-2">
        <GlassCard>
          <h3 className="font-semibold">Tech stack</h3>
          <div className="mt-4 space-y-3">
            {data.stack.map((choice) => (
              <div key={choice.category} className="rounded-xl border border-border bg-card/40 p-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs uppercase tracking-wide text-muted-foreground">
                    {choice.category}
                  </span>
                  <span className="text-sm font-semibold text-primary">{choice.choice}</span>
                </div>
                <p className="mt-1 text-xs text-muted-foreground">{choice.rationale}</p>
              </div>
            ))}
          </div>
        </GlassCard>

        <GlassCard>
          <MarkdownView content={data.contentMd} />
        </GlassCard>
      </div>
    </div>
  )
}
