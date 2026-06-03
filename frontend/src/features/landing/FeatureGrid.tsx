import { motion } from 'framer-motion'
import {
  Workflow,
  GitBranch,
  Gauge,
  ShieldCheck,
  Boxes,
  Zap,
} from 'lucide-react'
import { GlassCard } from '@/components/shared'
import { fadeInUp, staggerContainer } from '@/lib/motion'

const FEATURES = [
  {
    icon: Workflow,
    title: 'Seven-agent pipeline',
    desc: 'A LangGraph orchestrator runs specialized agents sequentially over shared state — each builds on the last.',
  },
  {
    icon: Zap,
    title: 'Live execution graph',
    desc: 'Watch agents light up in real time with progress, tokens, and timing streamed over SSE.',
  },
  {
    icon: Boxes,
    title: 'Architecture diagrams',
    desc: 'Get an interactive system diagram with tech-stack rationale, not just a wall of text.',
  },
  {
    icon: GitBranch,
    title: 'Plan to tickets',
    desc: 'Epics, stories, and tasks ready to export to Jira or GitHub Issues in one click.',
  },
  {
    icon: ShieldCheck,
    title: 'Built-in QA review',
    desc: 'A QA agent surfaces risks and edge cases before they reach your sprint board.',
  },
  {
    icon: Gauge,
    title: 'CTO health score',
    desc: 'A final review synthesizes health, cost, team, and delivery estimates into one verdict.',
  },
]

export function FeatureGrid() {
  return (
    <section id="features" className="relative mx-auto max-w-7xl px-6 py-24">
      <motion.div
        variants={fadeInUp}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: '-80px' }}
        className="mx-auto max-w-2xl text-center"
      >
        <p className="text-sm font-medium text-primary">Everything in one pass</p>
        <h2 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">
          A full engineering team, on demand
        </h2>
        <p className="mt-4 text-muted-foreground">
          Blueprint AI compresses weeks of discovery, design, and planning into a single,
          reviewable artifact.
        </p>
      </motion.div>

      <motion.div
        variants={staggerContainer(0.08)}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: '-80px' }}
        className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-3"
      >
        {FEATURES.map((f) => (
          <motion.div key={f.title} variants={fadeInUp}>
            <GlassCard interactive className="h-full">
              <div className="mb-4 inline-flex size-11 items-center justify-center rounded-xl bg-primary/12 text-primary ring-1 ring-inset ring-primary/20">
                <f.icon className="size-5" />
              </div>
              <h3 className="text-base font-semibold">{f.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{f.desc}</p>
            </GlassCard>
          </motion.div>
        ))}
      </motion.div>
    </section>
  )
}
