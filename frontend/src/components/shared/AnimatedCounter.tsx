import { useEffect } from 'react'
import { animate, useInView, useMotionValue, useTransform, motion } from 'framer-motion'
import { useRef } from 'react'

interface AnimatedCounterProps {
  value: number
  /** Number of decimals to render. */
  decimals?: number
  durationMs?: number
  prefix?: string
  suffix?: string
  /** Add thousands separators. */
  separator?: boolean
}

/** Counts up to `value` when scrolled into view. */
export function AnimatedCounter({
  value,
  decimals = 0,
  durationMs = 1200,
  prefix = '',
  suffix = '',
  separator = true,
}: AnimatedCounterProps) {
  const ref = useRef<HTMLSpanElement>(null)
  const inView = useInView(ref, { once: true, margin: '-40px' })
  const count = useMotionValue(0)
  const rounded = useTransform(count, (latest) => {
    const fixed = latest.toFixed(decimals)
    if (!separator) return `${prefix}${fixed}${suffix}`
    const [int, dec] = fixed.split('.')
    const grouped = Number(int).toLocaleString('en-US')
    return `${prefix}${dec ? `${grouped}.${dec}` : grouped}${suffix}`
  })

  useEffect(() => {
    if (!inView) return
    const controls = animate(count, value, {
      duration: durationMs / 1000,
      ease: [0.16, 1, 0.3, 1],
    })
    return () => {
      controls.stop()
    }
  }, [inView, value, count, durationMs])

  return <motion.span ref={ref}>{rounded}</motion.span>
}
