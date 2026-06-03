import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'

interface Particle {
  id: number
  left: number
  top: number
  size: number
  duration: number
  delay: number
  opacity: number
}

const MAX_PARTICLES = 60

// Generated once at module load (not during render) so the render stays pure.
const PARTICLE_POOL: Particle[] = Array.from({ length: MAX_PARTICLES }, (_, i) => ({
  id: i,
  left: Math.random() * 100,
  top: Math.random() * 100,
  size: 1 + Math.random() * 3,
  duration: 6 + Math.random() * 10,
  delay: Math.random() * 6,
  opacity: 0.2 + Math.random() * 0.5,
}))

interface FloatingParticlesProps {
  count?: number
  className?: string
}

/** Subtle drifting particles for depth behind the hero. */
export function FloatingParticles({ count = 26, className }: FloatingParticlesProps) {
  const particles = PARTICLE_POOL.slice(0, Math.min(count, MAX_PARTICLES))

  return (
    <div className={cn('pointer-events-none absolute inset-0 overflow-hidden', className)} aria-hidden>
      {particles.map((p) => (
        <motion.span
          key={p.id}
          className="absolute rounded-full bg-primary"
          style={{
            left: `${p.left}%`,
            top: `${p.top}%`,
            width: p.size,
            height: p.size,
            opacity: p.opacity,
          }}
          animate={{ y: [0, -30, 0], opacity: [p.opacity, p.opacity * 0.3, p.opacity] }}
          transition={{ duration: p.duration, delay: p.delay, repeat: Infinity, ease: 'easeInOut' }}
        />
      ))}
    </div>
  )
}
