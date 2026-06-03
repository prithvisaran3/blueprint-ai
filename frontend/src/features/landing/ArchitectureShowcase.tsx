import { motion } from 'framer-motion'
import { ChevronRight } from 'lucide-react'
import { GlassCard } from '@/components/shared'
import { AGENT_META } from '@/lib/agents'
import { AGENT_ORDER } from '@/types'
import { fadeInUp, staggerContainer } from '@/lib/motion'

export function ArchitectureShowcase() {
  return (
    <section className="relative mx-auto max-w-7xl px-6 py-24">
      <div className="pointer-events-none absolute inset-x-0 top-1/2 h-px bg-gradient-to-r from-transparent via-border to-transparent" />

      <motion.div
        variants={fadeInUp}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true }}
        className="mx-auto max-w-2xl text-center"
      >
        <p className="text-sm font-medium text-primary">The pipeline</p>
        <h2 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">
          Seven agents, one shared state
        </h2>
        <p className="mt-4 text-muted-foreground">
          Each agent reads everything before it and contributes its specialty. The CTO agent reviews
          the whole blueprint and signs off.
        </p>
      </motion.div>

      <motion.div
        variants={staggerContainer(0.1)}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: '-60px' }}
        className="mt-14 flex flex-wrap items-stretch justify-center gap-3"
      >
        {AGENT_ORDER.map((key, i) => {
          const meta = AGENT_META[key]
          return (
            <motion.div key={key} variants={fadeInUp} className="flex items-center gap-3">
              <GlassCard className="flex w-40 flex-col items-center gap-2 p-4 text-center">
                <span
                  className="inline-flex size-10 items-center justify-center rounded-xl ring-1 ring-inset"
                  style={{
                    backgroundColor: `${meta.color}1f`,
                    color: meta.color,
                    boxShadow: `0 0 18px -6px ${meta.color}`,
                  }}
                >
                  <meta.icon className="size-5" />
                </span>
                <p className="text-sm font-semibold">{meta.label}</p>
                <p className="text-[11px] leading-tight text-muted-foreground">{meta.role}</p>
              </GlassCard>
              {i < AGENT_ORDER.length - 1 && (
                <ChevronRight className="hidden size-5 shrink-0 text-muted-foreground/50 lg:block" />
              )}
            </motion.div>
          )
        })}
      </motion.div>
    </section>
  )
}
