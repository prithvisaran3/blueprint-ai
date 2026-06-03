import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronDown, Flag, CheckCircle2 } from 'lucide-react'
import { GlassCard } from '@/components/shared'
import { Badge } from '@/components/ui/badge'
import { MarkdownView } from '../MarkdownView'
import { cn } from '@/lib/utils'
import type { PlanEpic, PlannerOutput } from '@/types'

function EpicCard({ epic, defaultOpen }: { epic: PlanEpic; defaultOpen?: boolean }) {
  const [open, setOpen] = useState(defaultOpen ?? false)
  const taskCount = epic.stories.reduce((n, s) => n + s.tasks.length, 0)

  return (
    <div className="rounded-xl border border-border bg-card/40">
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center gap-3 px-4 py-3 text-left"
      >
        <span className="inline-flex size-8 items-center justify-center rounded-lg bg-primary/12 text-xs font-semibold text-primary">
          {epic.id}
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold">{epic.title}</p>
          <p className="truncate text-xs text-muted-foreground">{epic.description}</p>
        </div>
        <Badge variant="muted" className="shrink-0">
          {epic.stories.length} stories · {taskCount} tasks
        </Badge>
        <ChevronDown className={cn('size-4 shrink-0 text-muted-foreground transition-transform', open && 'rotate-180')} />
      </button>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="overflow-hidden"
          >
            <div className="space-y-3 px-4 pb-4">
              {epic.stories.map((story) => (
                <div key={story.id} className="rounded-lg bg-muted/30 p-3">
                  <p className="text-sm font-medium">{story.title}</p>
                  <ul className="mt-2 space-y-1.5">
                    {story.tasks.map((task) => (
                      <li key={task.id} className="flex items-center gap-2 text-xs text-muted-foreground">
                        <CheckCircle2 className="size-3.5 text-primary/60" />
                        <span className="flex-1">{task.title}</span>
                        <Badge variant="outline" className="text-[10px]">{task.estimate}</Badge>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export function PlanningTab({ data }: { data: PlannerOutput }) {
  return (
    <div className="grid gap-6 lg:grid-cols-3">
      <div className="space-y-3 lg:col-span-2">
        {data.epics.map((epic, i) => (
          <EpicCard key={epic.id} epic={epic} defaultOpen={i === 0} />
        ))}
        <GlassCard>
          <MarkdownView content={data.contentMd} />
        </GlassCard>
      </div>

      <GlassCard className="h-fit">
        <h3 className="flex items-center gap-2 font-semibold">
          <Flag className="size-4 text-primary" /> Milestones
        </h3>
        <div className="mt-4 space-y-3">
          {data.milestones.map((m, i) => (
            <div key={m.title} className="flex gap-3">
              <div className="flex flex-col items-center">
                <span className="size-2.5 rounded-full bg-primary" />
                {i < data.milestones.length - 1 && <span className="my-1 w-px flex-1 bg-border" />}
              </div>
              <div className="pb-2">
                <p className="text-sm font-medium">{m.title}</p>
                <p className="text-xs text-muted-foreground">{m.due}</p>
              </div>
            </div>
          ))}
        </div>
      </GlassCard>
    </div>
  )
}
