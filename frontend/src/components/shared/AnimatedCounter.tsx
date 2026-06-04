import { useEffect, useRef, useState } from 'react'
import { useInView } from 'framer-motion'

interface AnimatedCounterProps {
  value: number
  decimals?: number
  durationMs?: number
  prefix?: string
  suffix?: string
  separator?: boolean
}

function formatValue(
  n: number,
  decimals: number,
  prefix: string,
  suffix: string,
  separator: boolean,
): string {
  const fixed = n.toFixed(decimals)
  if (!separator) return `${prefix}${fixed}${suffix}`
  const [int, dec] = fixed.split('.')
  const grouped = Number(int).toLocaleString('en-US')
  return `${prefix}${dec ? `${grouped}.${dec}` : grouped}${suffix}`
}

function easeOutCubic(t: number): number {
  return 1 - Math.pow(1 - t, 3)
}

/** Counts up to `value` when scrolled into view (rAF — avoids framer-motion `animate` in prod bundles). */
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
  const [text, setText] = useState(() =>
    formatValue(0, decimals, prefix, suffix, separator),
  )

  useEffect(() => {
    if (!inView) return
    const start = performance.now()
    let frame = 0

    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / durationMs)
      const current = value * easeOutCubic(t)
      setText(formatValue(current, decimals, prefix, suffix, separator))
      if (t < 1) frame = requestAnimationFrame(tick)
    }

    frame = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(frame)
  }, [inView, value, decimals, durationMs, prefix, suffix, separator])

  return <span ref={ref}>{text}</span>
}
