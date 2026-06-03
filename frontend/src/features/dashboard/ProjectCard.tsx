import { useNavigate } from 'react-router-dom'
import { ArrowUpRight, Clock } from 'lucide-react'
import { GlassCard, StatusBadge } from '@/components/shared'
import { Badge } from '@/components/ui/badge'
import { cn, timeAgo } from '@/lib/utils'
import type { Project } from '@/types'

function healthColor(score: number | null) {
  if (score == null) return 'text-muted-foreground'
  if (score >= 85) return 'text-success'
  if (score >= 70) return 'text-primary'
  return 'text-warning'
}

export function ProjectCard({ project }: { project: Project }) {
  const navigate = useNavigate()
  const target = project.latestRunId
    ? project.status === 'running'
      ? `/executions/${project.latestRunId}`
      : `/workspace/${project.latestRunId}`
    : `/projects/${project.id}`

  return (
    <GlassCard interactive animate onClick={() => navigate(target)} className="flex h-full flex-col">
      <div className="flex items-start justify-between gap-3">
        <h3 className="font-semibold leading-snug">{project.name}</h3>
        <ArrowUpRight className="size-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
      </div>

      <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">{project.ideaPrompt}</p>

      <div className="mt-3 flex flex-wrap gap-1.5">
        {project.tags.map((tag) => (
          <Badge key={tag} variant="muted" className="text-[10px]">
            {tag}
          </Badge>
        ))}
      </div>

      <div className="mt-auto flex items-center justify-between pt-4">
        <StatusBadge status={project.status} />
        <div className="flex items-center gap-3 text-xs text-muted-foreground">
          {project.healthScore != null && (
            <span className={cn('font-medium', healthColor(project.healthScore))}>
              {project.healthScore} health
            </span>
          )}
          <span className="flex items-center gap-1">
            <Clock className="size-3" />
            {timeAgo(project.updatedAt)}
          </span>
        </div>
      </div>
    </GlassCard>
  )
}
