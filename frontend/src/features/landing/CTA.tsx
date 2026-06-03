import { motion } from 'framer-motion'
import { ArrowRight, Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { GradientMesh } from '@/components/shared'
import { fadeInUp } from '@/lib/motion'

export function CTA({ onStart }: { onStart: () => void }) {
  return (
    <section className="relative mx-auto max-w-7xl px-6 pb-28 pt-10">
      <motion.div
        variants={fadeInUp}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true }}
        className="relative overflow-hidden rounded-3xl border border-border bg-card/40 px-8 py-16 text-center"
      >
        <GradientMesh />
        <div className="relative z-10 mx-auto max-w-2xl">
          <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">
            Ship your next idea with a <span className="text-gradient">blueprint in hand</span>
          </h2>
          <p className="mt-4 text-muted-foreground">
            Describe it once. Get an architecture, plan, scaffolding, QA review, docs, and a CTO
            sign-off — all in a single run.
          </p>
          <div className="mt-8 flex items-center justify-center gap-3">
            <Button size="lg" onClick={onStart}>
              <Sparkles className="size-4" /> Generate a blueprint
              <ArrowRight className="size-4" />
            </Button>
          </div>
        </div>
      </motion.div>

      <footer className="mt-16 flex flex-col items-center justify-between gap-4 border-t border-border pt-8 text-sm text-muted-foreground sm:flex-row">
        <p>© 2026 Blueprint AI. Built with React, FastAPI, and LangGraph.</p>
        <div className="flex gap-6">
          <a href="#features" className="hover:text-foreground">Features</a>
          <a href="#pipeline" className="hover:text-foreground">Pipeline</a>
          <a href="https://github.com" target="_blank" rel="noreferrer" className="hover:text-foreground">GitHub</a>
        </div>
      </footer>
    </section>
  )
}
