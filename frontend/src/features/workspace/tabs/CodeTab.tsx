import { GlassCard } from '@/components/shared'
import { MarkdownView } from '../MarkdownView'
import { CodeArtifacts } from '../CodeArtifacts'
import type { CodeAgentOutput } from '@/types'

export function CodeTab({ data }: { data: CodeAgentOutput }) {
  return (
    <div className="space-y-6">
      <GlassCard>
        <MarkdownView content={data.contentMd} />
      </GlassCard>
      <div>
        <h3 className="mb-3 text-sm font-medium text-muted-foreground">
          Generated artifacts ({data.artifacts.length})
        </h3>
        <CodeArtifacts artifacts={data.artifacts} />
      </div>
    </div>
  )
}
