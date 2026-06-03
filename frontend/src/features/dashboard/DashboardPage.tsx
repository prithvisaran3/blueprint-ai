import { motion } from 'framer-motion'
import { useDashboardStats, useProjects, useRuns } from '@/hooks/queries'
import { useAuth } from '@/app/providers'
import { DashboardSkeleton } from '@/components/shared'
import { StatCards } from './StatCards'
import { UsageAnalytics } from './UsageAnalytics'
import { AgentMetrics } from './AgentMetrics'
import { HealthScoreWidget } from './HealthScoreWidget'
import { RecentGenerations } from './RecentGenerations'
import { ProjectCard } from './ProjectCard'
import { mockCtoReview } from '@/lib/mock'
import { fadeInUp } from '@/lib/motion'

export function DashboardPage() {
  const { user } = useAuth()
  const stats = useDashboardStats()
  const projects = useProjects()
  const runs = useRuns()

  if (stats.isLoading || projects.isLoading || runs.isLoading || !stats.data) {
    return <DashboardSkeleton />
  }

  const firstName = user?.displayName?.split(' ')[0] ?? 'there'

  return (
    <div className="space-y-7">
      <motion.div variants={fadeInUp} initial="hidden" animate="visible">
        <h1 className="text-2xl font-semibold tracking-tight">Welcome back, {firstName}</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Here's what's happening across your blueprints.
        </p>
      </motion.div>

      <StatCards stats={stats.data} />

      <div className="grid gap-6 lg:grid-cols-3">
        <UsageAnalytics data={stats.data.usage} />
        <HealthScoreWidget health={mockCtoReview.healthScore} />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <RecentGenerations runs={runs.data ?? []} />
        </div>
        <AgentMetrics metrics={stats.data.agentMetrics} />
      </div>

      <div>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold tracking-tight">Your projects</h2>
          <span className="text-sm text-muted-foreground">{projects.data?.length ?? 0} total</span>
        </div>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {projects.data?.map((project) => (
            <ProjectCard key={project.id} project={project} />
          ))}
        </div>
      </div>
    </div>
  )
}
