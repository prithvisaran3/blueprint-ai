import { GlassCard } from '@/components/shared'
import { MarkdownView } from '../MarkdownView'
import { CodeArtifacts } from '../CodeArtifacts'
import type { CodeAgentOutput } from '@/types'

export function CodeTab({ data }: { data: CodeAgentOutput | undefined }) {
  if (!data) {
    return (
      <GlassCard className="py-10 text-center text-sm text-muted-foreground">
        No output available for this agent.
      </GlassCard>
    )
  }

  return (
    <div className="space-y-6">
      <GlassCard>
        <MarkdownView content={data.contentMd || data.summary} />
      </GlassCard>
      {data.artifacts.length > 0 ? (
        <div>
          <h3 className="mb-3 text-sm font-medium text-muted-foreground">
            Generated artifacts ({data.artifacts.length})
          </h3>
          <CodeArtifacts artifacts={data.artifacts} />
        </div>
      ) : (
        <GlassCard className="py-8 text-center text-sm text-muted-foreground">
          Design notes are above — no file snippets were attached to this run.
        </GlassCard>
      )}
    </div>
  )
}
