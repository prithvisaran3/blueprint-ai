import { motion, type HTMLMotionProps } from 'framer-motion'
import { cn } from '@/lib/utils'
import { fadeInUp, hoverLift } from '@/lib/motion'

interface GlassCardProps extends HTMLMotionProps<'div'> {
  /** Enable hover lift + glow. */
  interactive?: boolean
  /** Animate in on mount. */
  animate?: boolean
}

/** Frosted glassmorphism surface used across the app. */
export function GlassCard({
  className,
  interactive = false,
  animate = false,
  children,
  ...props
}: GlassCardProps) {
  return (
    <motion.div
      variants={animate ? fadeInUp : undefined}
      initial={animate ? 'hidden' : undefined}
      whileInView={animate ? 'visible' : undefined}
      viewport={animate ? { once: true, margin: '-60px' } : undefined}
      {...(interactive ? hoverLift : {})}
      className={cn(
        'glass rounded-2xl p-5 shadow-sm',
        interactive && 'cursor-pointer transition-shadow hover:shadow-[0_8px_40px_-12px_rgba(56,189,248,0.25)]',
        className,
      )}
      {...props}
    >
      {children}
    </motion.div>
  )
}
