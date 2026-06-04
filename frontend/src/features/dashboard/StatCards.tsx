import { motion } from 'framer-motion'
import { FolderKanban, Activity, Coins, HeartPulse, type LucideIcon } from 'lucide-react'
import { GlassCard, AnimatedCounter } from '@/components/shared'
import { staggerContainer, fadeInUp } from '@/lib/motion'
import type { DashboardStats } from '@/types'

interface Stat {
  label: string
  value: number
  icon: LucideIcon
  suffix?: string
  decimals?: number
  hint: string
  color: string
}

export function StatCards({ stats }: { stats: DashboardStats }) {
  const items: Stat[] = [
    { label: 'Projects', value: stats.totalProjects, icon: FolderKanban, hint: 'across your workspace', color: '#38bdf8' },
    { label: 'Total runs', value: stats.totalRuns, icon: Activity, hint: 'agent pipelines executed', color: '#a855f7' },
    { label: 'Tokens used', value: stats.totalTokens / 1000, suffix: 'k', decimals: 1, icon: Coins, hint: 'this billing period', color: '#34d399' },
    { label: 'Avg. health', value: stats.avgHealthScore, suffix: '/100', icon: HeartPulse, hint: 'across completed runs', color: '#fbbf24' },
  ]

  return (
    <motion.div
      variants={staggerContainer(0.08)}
      initial="hidden"
      animate="visible"
      className="grid grid-cols-2 gap-4 lg:grid-cols-4"
    >
      {items.map((stat) => {
        const Icon = stat.icon
        return (
        <motion.div key={stat.label} variants={fadeInUp}>
          <GlassCard interactive className="h-full">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">{stat.label}</span>
              <span
                className="inline-flex size-8 items-center justify-center rounded-lg ring-1 ring-inset"
                style={{ backgroundColor: `${stat.color}1f`, color: stat.color, borderColor: `${stat.color}33` }}
              >
                <Icon className="size-4" />
              </span>
            </div>
            <p className="mt-3 text-3xl font-semibold tracking-tight tabular-nums">
              <AnimatedCounter value={stat.value} decimals={stat.decimals ?? 0} suffix={stat.suffix} />
            </p>
            <p className="mt-1 text-xs text-muted-foreground">{stat.hint}</p>
          </GlassCard>
        </motion.div>
        )
      })}
    </motion.div>
  )
}
