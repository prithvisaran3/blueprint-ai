import { useState } from 'react'
import { FileText } from 'lucide-react'
import { GlassCard } from '@/components/shared'
import { MarkdownView } from '../MarkdownView'
import { cn } from '@/lib/utils'
import type { DocumentationOutput } from '@/types'

export function DocumentationTab({ data }: { data: DocumentationOutput }) {
  const [active, setActive] = useState(0)
  const doc = data.documents[active]

  return (
    <div className="grid gap-6 lg:grid-cols-[260px_1fr]">
      <div className="space-y-1.5">
        {data.documents.map((d, i) => (
          <button
            key={d.title}
            onClick={() => setActive(i)}
            className={cn(
              'flex w-full items-center gap-2.5 rounded-xl border px-3 py-2.5 text-left text-sm transition-colors',
              i === active
                ? 'border-primary/40 bg-primary/8 text-foreground'
                : 'border-border text-muted-foreground hover:bg-accent/40',
            )}
          >
            <FileText className="size-4 shrink-0" />
            <div className="min-w-0">
              <p className="truncate font-medium">{d.title}</p>
              <p className="truncate text-[11px] capitalize text-muted-foreground">
                {d.docType.replace(/_/g, ' ')}
              </p>
            </div>
          </button>
        ))}
      </div>

      <GlassCard>{doc && <MarkdownView content={doc.contentMd} />}</GlassCard>
    </div>
  )
}
