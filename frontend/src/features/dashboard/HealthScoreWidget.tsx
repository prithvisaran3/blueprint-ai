import { motion } from 'framer-motion'
import { GlassCard, HealthRing } from '@/components/shared'
import type { HealthScore } from '@/types'

export function HealthScoreWidget({ health }: { health: HealthScore }) {
  return (
    <GlassCard>
      <h3 className="font-semibold">Latest health score</h3>
      <p className="text-xs text-muted-foreground">From your most recent CTO review</p>

      <div className="mt-4 flex items-center gap-6">
        <HealthRing value={health.overall} size={116} />
        <div className="min-w-0 flex-1 space-y-2.5">
          {health.dimensions.map((dim, i) => (
            <div key={dim.dimension}>
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">{dim.dimension}</span>
                <span className="font-medium tabular-nums">{dim.score}</span>
              </div>
              <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-muted">
                <motion.div
                  className="h-full rounded-full bg-primary"
                  initial={{ width: 0 }}
                  animate={{ width: `${dim.score}%` }}
                  transition={{ duration: 0.9, delay: i * 0.05, ease: [0.16, 1, 0.3, 1] }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </GlassCard>
  )
}
