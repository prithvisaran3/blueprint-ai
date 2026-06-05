import { lazy, Suspense } from 'react'
import { motion } from 'framer-motion'
import { useDashboardStats, useProjects, useRuns } from '@/hooks/queries'
import { useAuth } from '@/app/providers'
import { DashboardSkeleton } from '@/components/shared'
import { StatCards } from './StatCards'

/** Lazy-loaded so recharts/es-toolkit stay out of this chunk (avoids Rolldown minify collision). */
const UsageAnalytics = lazy(() =>
  import('./UsageAnalytics').then((m) => ({ default: m.UsageAnalytics })),
)
import { AgentMetrics } from './AgentMetrics'
import { HealthScoreWidget } from './HealthScoreWidget'
import { RecentGenerations } from './RecentGenerations'
import { ProjectCard } from './ProjectCard'
import { mockCtoReview } from '@/lib/mock/outputs'
import { fadeInUp } from '@/lib/motion'

export function DashboardPage() {
  const { user } = useAuth()
  const stats = useDashboardStats()
  const projects = useProjects()
  const runs = useRuns()

  const isLoading = stats.isLoading || projects.isLoading || runs.isLoading
  const error = stats.error ?? projects.error ?? runs.error

  // While any query is actively retrying after a failure, show a skeleton with a banner
  // rather than an error page — this covers Render free-tier cold-start (~60s wake-up).
  const isRetrying =
    (stats.isError && stats.fetchStatus === 'fetching') ||
    (projects.isError && projects.fetchStatus === 'fetching') ||
    (runs.isError && runs.fetchStatus === 'fetching')

  if (isLoading || isRetrying) {
    return (
      <>
        {isRetrying && (
          <div className="mb-4 rounded-lg border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-600 dark:text-amber-400">
            Backend is warming up — this can take ~60 s on the free tier. Retrying automatically&hellip;
          </div>
        )}
        <DashboardSkeleton />
      </>
    )
  }

  if (error) {
    const isNetworkError =
      error instanceof Error && 'code' in error && (error as { code: string }).code === 'network_error'
    return (
      <div className="glass rounded-xl border border-destructive/30 p-6 text-sm">
        <p className="font-medium text-destructive">Could not load dashboard</p>
        <p className="mt-2 text-muted-foreground">
          {isNetworkError
            ? 'The backend did not respond. If this is your first visit today, the free server may need ~60 s to wake up.'
            : (error instanceof Error ? error.message : 'Something went wrong fetching your data.')}
        </p>
        <button
          type="button"
          className="mt-4 text-primary underline-offset-4 hover:underline"
          onClick={() => {
            void stats.refetch()
            void projects.refetch()
            void runs.refetch()
          }}
        >
          Try again
        </button>
      </div>
    )
  }

  if (!stats.data) {
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
        <Suspense
          fallback={
            <div className="glass lg:col-span-2 h-64 animate-pulse rounded-xl border border-border" />
          }
        >
          <UsageAnalytics data={stats.data.usage} />
        </Suspense>
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
