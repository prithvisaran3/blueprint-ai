import { motion } from 'framer-motion'
import { AlertTriangle, DollarSign, Users, CalendarRange } from 'lucide-react'
import { GlassCard, HealthRing, AnimatedCounter } from '@/components/shared'
import { Badge } from '@/components/ui/badge'
import { formatNumber } from '@/lib/utils'
import { fadeInUp, staggerContainer } from '@/lib/motion'
import { HealthScoreRadar } from './HealthScoreRadar'
import type { CtoReviewOutput } from '@/types'

const SEVERITY_VARIANT = { low: 'muted', medium: 'warning', high: 'destructive' } as const

export function InsightsPanel({ review }: { review: CtoReviewOutput }) {
  return (
    <motion.div variants={staggerContainer(0.08)} initial="hidden" animate="visible" className="space-y-6">
      {/* Health overview */}
      <motion.div variants={fadeInUp}>
        <GlassCard>
          <div className="grid items-center gap-6 lg:grid-cols-[auto_1fr]">
            <div className="flex flex-col items-center gap-2">
              <HealthRing value={review.healthScore.overall} size={140} />
              <Badge
                variant={review.verdict === 'needs_work' ? 'destructive' : 'success'}
                className="capitalize"
              >
                {review.verdict.replace(/_/g, ' ')}
              </Badge>
            </div>
            <HealthScoreRadar health={review.healthScore} />
          </div>
        </GlassCard>
      </motion.div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Risks */}
        <motion.div variants={fadeInUp}>
          <GlassCard className="h-full">
            <h3 className="flex items-center gap-2 font-semibold">
              <AlertTriangle className="size-4 text-warning" /> Key risks
            </h3>
            <div className="mt-4 space-y-3">
              {review.risks.map((risk) => (
                <div key={risk.id} className="rounded-xl border border-border bg-card/40 p-3">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-sm font-medium">{risk.title}</p>
                    <Badge variant={SEVERITY_VARIANT[risk.severity]} className="capitalize">
                      {risk.severity}
                    </Badge>
                  </div>
                  <p className="mt-1.5 text-xs text-muted-foreground">{risk.mitigation}</p>
                </div>
              ))}
            </div>
          </GlassCard>
        </motion.div>

        {/* Cost */}
        <motion.div variants={fadeInUp}>
          <GlassCard className="h-full">
            <h3 className="flex items-center gap-2 font-semibold">
              <DollarSign className="size-4 text-success" /> Cost estimation
            </h3>
            <div className="mt-4 grid grid-cols-2 gap-3">
              <div className="rounded-xl bg-muted/40 p-3">
                <p className="text-xs text-muted-foreground">Monthly infra</p>
                <p className="text-xl font-semibold">
                  $<AnimatedCounter value={review.cost.monthlyInfraUsd} />
                </p>
              </div>
              <div className="rounded-xl bg-muted/40 p-3">
                <p className="text-xs text-muted-foreground">One-time build</p>
                <p className="text-xl font-semibold">
                  $<AnimatedCounter value={review.cost.oneTimeBuildUsd} />
                </p>
              </div>
            </div>
            <div className="mt-4 space-y-2">
              {review.cost.breakdown.map((b) => (
                <div key={b.label} className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">{b.label}</span>
                  <span className="font-medium tabular-nums">${formatNumber(b.amountUsd)}/mo</span>
                </div>
              ))}
            </div>
          </GlassCard>
        </motion.div>

        {/* Team */}
        <motion.div variants={fadeInUp}>
          <GlassCard className="h-full">
            <h3 className="flex items-center gap-2 font-semibold">
              <Users className="size-4 text-primary" /> Recommended team
            </h3>
            <p className="mt-1 text-xs text-muted-foreground">
              {review.team.totalHeadcount} people total
            </p>
            <div className="mt-4 space-y-2.5">
              {review.team.roles.map((r) => (
                <div key={r.role} className="flex items-center justify-between rounded-lg bg-muted/40 px-3 py-2">
                  <div>
                    <p className="text-sm font-medium">{r.role}</p>
                    <p className="text-xs capitalize text-muted-foreground">{r.seniority}</p>
                  </div>
                  <span className="text-lg font-semibold tabular-nums">×{r.count}</span>
                </div>
              ))}
            </div>
          </GlassCard>
        </motion.div>

        {/* Delivery timeline */}
        <motion.div variants={fadeInUp}>
          <GlassCard className="h-full">
            <h3 className="flex items-center gap-2 font-semibold">
              <CalendarRange className="size-4 text-fuchsia-400" /> Delivery timeline
            </h3>
            <p className="mt-1 text-xs text-muted-foreground">
              {review.delivery.totalWeeks} weeks end-to-end
            </p>
            <div className="mt-5 space-y-4">
              {review.delivery.phases.map((phase, i) => {
                const pct = (phase.weeks / review.delivery.totalWeeks) * 100
                return (
                  <div key={phase.name}>
                    <div className="mb-1 flex justify-between text-sm">
                      <span>{phase.name}</span>
                      <span className="text-muted-foreground">{phase.weeks}w</span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-muted">
                      <motion.div
                        className="h-full rounded-full bg-gradient-to-r from-primary to-fuchsia-400"
                        initial={{ width: 0 }}
                        whileInView={{ width: `${pct}%` }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.8, delay: i * 0.1, ease: [0.16, 1, 0.3, 1] }}
                      />
                    </div>
                  </div>
                )
              })}
            </div>
          </GlassCard>
        </motion.div>
      </div>
    </motion.div>
  )
}
