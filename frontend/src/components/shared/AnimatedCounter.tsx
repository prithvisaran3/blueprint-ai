import { useEffect, useRef, useState } from 'react'

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
  return 1 - (1 - t) ** 3
}

/**
 * Counts up to `value` when scrolled into view.
 * Uses native IntersectionObserver + rAF — no framer-motion dependency
 * so the production bundle never encounters a minification edge-case.
 */
export function AnimatedCounter({
  value,
  decimals = 0,
  durationMs = 1200,
  prefix = '',
  suffix = '',
  separator = true,
}: AnimatedCounterProps) {
  const ref = useRef<HTMLSpanElement>(null)
  const [inView, setInView] = useState(false)
  const [text, setText] = useState(() =>
    formatValue(0, decimals, prefix, suffix, separator),
  )

  // Native IntersectionObserver — no framer-motion, no minification surprises.
  useEffect(() => {
    const el = ref.current
    if (!el || typeof IntersectionObserver === 'undefined') {
      setInView(true) // fallback: just count up immediately
      return
    }
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setInView(true)
          observer.disconnect()
        }
      },
      { rootMargin: '-40px' },
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  useEffect(() => {
    if (!inView) return
    const start = performance.now()
    let frame = 0

    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / durationMs)
      setText(formatValue(value * easeOutCubic(t), decimals, prefix, suffix, separator))
      if (t < 1) frame = requestAnimationFrame(tick)
    }

    frame = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(frame)
  }, [inView, value, decimals, durationMs, prefix, suffix, separator])

  return <span ref={ref}>{text}</span>
}
