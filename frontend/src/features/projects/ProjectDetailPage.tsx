import { useNavigate, useParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowLeft, Activity, Sparkles, Coins, Clock, Calendar } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { GlassCard, HealthRing, StatusBadge, WorkspaceSkeleton } from '@/components/shared'
import { useProject, useRun } from '@/hooks/queries'
import { formatDuration, formatNumber, timeAgo } from '@/lib/utils'
import { fadeInUp, staggerContainer } from '@/lib/motion'

export function ProjectDetailPage() {
  const { id = '' } = useParams()
  const navigate = useNavigate()
  const { data: project, isLoading } = useProject(id)
  const { data: run } = useRun(project?.latestRunId ?? '')

  if (isLoading) return <WorkspaceSkeleton />

  if (!project) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <p className="text-lg font-medium">Project not found</p>
        <Button variant="outline" className="mt-4" onClick={() => navigate('/dashboard')}>
          <ArrowLeft className="size-4" /> Back to dashboard
        </Button>
      </div>
    )
  }

  return (
    <motion.div variants={staggerContainer(0.08)} initial="hidden" animate="visible" className="space-y-6">
      <motion.div variants={fadeInUp}>
        <Button variant="ghost" size="sm" onClick={() => navigate('/dashboard')} className="-ml-2 text-muted-foreground">
          <ArrowLeft className="size-4" /> Dashboard
        </Button>
      </motion.div>

      <motion.div variants={fadeInUp} className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-semibold tracking-tight">{project.name}</h1>
            <StatusBadge status={project.status} />
          </div>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {project.tags.map((t) => (
              <Badge key={t} variant="muted">{t}</Badge>
            ))}
          </div>
        </div>
        <div className="flex gap-2">
          {project.latestRunId && project.status === 'running' && (
            <Button onClick={() => navigate(`/executions/${project.latestRunId}`)}>
              <Activity className="size-4" /> View live run
            </Button>
          )}
          {project.latestRunId && project.status !== 'running' && (
            <Button onClick={() => navigate(`/workspace/${project.latestRunId}`)}>
              <Sparkles className="size-4" /> Open workspace
            </Button>
          )}
          <Button variant="outline" onClick={() => navigate('/')}>Regenerate</Button>
        </div>
      </motion.div>

      <div className="grid gap-6 lg:grid-cols-3">
        <motion.div variants={fadeInUp} className="lg:col-span-2">
          <GlassCard className="h-full">
            <h3 className="text-sm font-medium text-muted-foreground">Idea prompt</h3>
            <p className="mt-2 text-lg leading-relaxed">{project.ideaPrompt}</p>
            <Separator className="my-5" />
            <div className="grid grid-cols-2 gap-4 text-sm sm:grid-cols-4">
              <Meta icon={Calendar} label="Created" value={timeAgo(project.createdAt)} />
              <Meta icon={Clock} label="Updated" value={timeAgo(project.updatedAt)} />
              {run && <Meta icon={Coins} label="Tokens" value={formatNumber(run.totalTokens)} />}
              {run && <Meta icon={Activity} label="Duration" value={formatDuration(run.totalDurationMs)} />}
            </div>
          </GlassCard>
        </motion.div>

        <motion.div variants={fadeInUp}>
          <GlassCard className="flex h-full flex-col items-center justify-center gap-3 text-center">
            <h3 className="text-sm font-medium text-muted-foreground">Health score</h3>
            {project.healthScore != null ? (
              <HealthRing value={project.healthScore} size={140} />
            ) : (
              <p className="py-8 text-sm text-muted-foreground">No completed run yet.</p>
            )}
          </GlassCard>
        </motion.div>
      </div>
    </motion.div>
  )
}

function Meta({ icon: Icon, label, value }: { icon: typeof Activity; label: string; value: string }) {
  return (
    <div>
      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
        <Icon className="size-3.5" /> {label}
      </div>
      <p className="mt-1 font-medium">{value}</p>
    </div>
  )
}
