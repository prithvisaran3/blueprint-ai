import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowLeft, Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { DashboardSkeleton } from '@/components/shared'
import { ProjectCard } from '@/features/dashboard/ProjectCard'
import { useProjects } from '@/hooks/queries'
import { fadeInUp, staggerContainer } from '@/lib/motion'

export function ProjectsPage() {
  const navigate = useNavigate()
  const { data: projects, isLoading, error } = useProjects()

  if (isLoading) return <DashboardSkeleton />

  return (
    <motion.div variants={staggerContainer(0.07)} initial="hidden" animate="visible" className="space-y-6">
      <motion.div variants={fadeInUp} className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/dashboard')}
            className="-ml-2 mb-2 text-muted-foreground"
          >
            <ArrowLeft className="size-4" /> Dashboard
          </Button>
          <h1 className="text-2xl font-semibold tracking-tight">Projects</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {projects?.length ?? 0} blueprint{projects?.length === 1 ? '' : 's'} in your workspace
          </p>
        </div>
        <Button onClick={() => navigate('/')}>
          <Plus className="size-4" /> New Blueprint
        </Button>
      </motion.div>

      {error && (
        <motion.div variants={fadeInUp} className="rounded-xl border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          Could not load projects. Try again from the dashboard.
        </motion.div>
      )}

      {projects && projects.length > 0 ? (
        <motion.div variants={fadeInUp} className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {projects.map((project) => (
            <ProjectCard key={project.id} project={project} />
          ))}
        </motion.div>
      ) : (
        <motion.div variants={fadeInUp} className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border py-20 text-center">
          <p className="text-lg font-medium">No projects yet</p>
          <p className="mt-2 max-w-sm text-sm text-muted-foreground">
            Generate your first blueprint from the landing page to create a project here.
          </p>
          <Button className="mt-6" onClick={() => navigate('/')}>
            <Plus className="size-4" /> Generate a blueprint
          </Button>
        </motion.div>
      )}
    </motion.div>
  )
}
