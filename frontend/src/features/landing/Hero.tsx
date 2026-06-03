import { motion } from 'framer-motion'
import { Sparkles } from 'lucide-react'
import { GradientMesh, FloatingParticles } from '@/components/shared'
import { useTypingEffect } from '@/hooks/useTypingEffect'
import { fadeInUp, staggerContainer } from '@/lib/motion'
import { PromptInput } from './PromptInput'

const PHRASES = ['production architectures', 'delivery plans', 'backend & frontend', 'quality reviews', 'engineering blueprints']

interface HeroProps {
  onGenerate: (idea: string) => void
  submitting?: boolean
}

export function Hero({ onGenerate, submitting }: HeroProps) {
  const typed = useTypingEffect(PHRASES)

  return (
    <section className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden px-6 pt-20 text-center">
      <GradientMesh />
      <FloatingParticles />
      <div className="pointer-events-none absolute inset-0 bg-grid opacity-[0.04]" />

      <motion.div
        variants={staggerContainer(0.12)}
        initial="hidden"
        animate="visible"
        className="relative z-10 flex flex-col items-center"
      >
        <motion.div
          variants={fadeInUp}
          className="mb-6 inline-flex items-center gap-2 rounded-full border border-border bg-card/40 px-4 py-1.5 text-xs text-muted-foreground backdrop-blur"
        >
          <Sparkles className="size-3.5 text-primary" />
          Multi-agent engineering intelligence
          <span className="ml-1 rounded-full bg-primary/15 px-2 py-0.5 text-[10px] font-medium text-primary">
            Beta
          </span>
        </motion.div>

        <motion.h1
          variants={fadeInUp}
          className="max-w-4xl text-balance text-5xl font-semibold leading-[1.05] tracking-tight sm:text-6xl md:text-7xl"
        >
          Turn one idea into
          <br />
          <span className="text-gradient">{typed}</span>
          <span className="ml-0.5 inline-block h-[0.9em] w-[3px] translate-y-1 animate-pulse bg-primary align-middle" />
        </motion.h1>

        <motion.p
          variants={fadeInUp}
          className="mt-6 max-w-2xl text-pretty text-lg text-muted-foreground"
        >
          Blueprint AI orchestrates seven specialized agents — Architect, Planner, Backend, Frontend,
          QA, Docs, and CTO Review — to transform a single prompt into a complete, reviewed
          engineering blueprint.
        </motion.p>

        <motion.div variants={fadeInUp} className="mt-10 flex w-full justify-center">
          <PromptInput onGenerate={onGenerate} submitting={submitting} />
        </motion.div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.2 }}
        className="absolute bottom-8 left-1/2 -translate-x-1/2"
      >
        <motion.div
          animate={{ y: [0, 8, 0] }}
          transition={{ duration: 1.8, repeat: Infinity, ease: 'easeInOut' }}
          className="flex h-9 w-5.5 items-start justify-center rounded-full border border-border p-1.5"
        >
          <span className="size-1 rounded-full bg-muted-foreground" />
        </motion.div>
      </motion.div>
    </section>
  )
}
