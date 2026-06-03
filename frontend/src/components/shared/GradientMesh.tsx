import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'

/** Animated, slowly-drifting gradient mesh used as a hero/page backdrop. */
export function GradientMesh({ className }: { className?: string }) {
  return (
    <div className={cn('pointer-events-none absolute inset-0 overflow-hidden', className)} aria-hidden>
      <motion.div
        className="absolute -left-40 -top-40 h-[36rem] w-[36rem] rounded-full blur-[120px]"
        style={{ background: 'radial-gradient(circle, rgba(56,189,248,0.35), transparent 70%)' }}
        animate={{ x: [0, 80, 0], y: [0, 40, 0], scale: [1, 1.15, 1] }}
        transition={{ duration: 18, repeat: Infinity, ease: 'easeInOut' }}
      />
      <motion.div
        className="absolute -right-40 top-10 h-[32rem] w-[32rem] rounded-full blur-[120px]"
        style={{ background: 'radial-gradient(circle, rgba(168,85,247,0.3), transparent 70%)' }}
        animate={{ x: [0, -60, 0], y: [0, 70, 0], scale: [1, 1.2, 1] }}
        transition={{ duration: 22, repeat: Infinity, ease: 'easeInOut' }}
      />
      <motion.div
        className="absolute bottom-[-12rem] left-1/3 h-[30rem] w-[30rem] rounded-full blur-[120px]"
        style={{ background: 'radial-gradient(circle, rgba(99,102,241,0.28), transparent 70%)' }}
        animate={{ x: [0, 50, 0], y: [0, -40, 0], scale: [1, 1.1, 1] }}
        transition={{ duration: 20, repeat: Infinity, ease: 'easeInOut' }}
      />
    </div>
  )
}
