import { useEffect, useRef, useState } from 'react'
import { animate, useInView } from 'framer-motion'

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
  const [text, setText] = useState(() =>
    formatValue(0, decimals, prefix, suffix, separator),
  )

  useEffect(() => {
    if (!inView) return
    const controls = animate(0, value, {
      duration: durationMs / 1000,
      ease: [0.16, 1, 0.3, 1],
      onUpdate: (latest) => {
        setText(formatValue(latest, decimals, prefix, suffix, separator))
      },
    })
    return () => controls.stop()
  }, [inView, value, decimals, durationMs, prefix, suffix, separator])

  return <span ref={ref}>{text}</span>
}
