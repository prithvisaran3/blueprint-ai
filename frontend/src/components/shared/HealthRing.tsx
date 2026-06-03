import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'

interface HealthRingProps {
  /** Score 0–100. */
  value: number
  size?: number
  strokeWidth?: number
  className?: string
  showValue?: boolean
}

function colorFor(value: number): string {
  if (value >= 85) return 'var(--color-success)'
  if (value >= 70) return 'var(--color-primary)'
  if (value >= 50) return 'var(--color-warning)'
  return 'var(--color-destructive)'
}

/** Animated circular health-score ring. */
export function HealthRing({
  value,
  size = 120,
  strokeWidth = 10,
  className,
  showValue = true,
}: HealthRingProps) {
  const radius = (size - strokeWidth) / 2
  const circumference = 2 * Math.PI * radius
  const offset = circumference - (value / 100) * circumference
  const stroke = colorFor(value)

  return (
    <div className={cn('relative inline-flex items-center justify-center', className)} style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="var(--color-muted)"
          strokeWidth={strokeWidth}
        />
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={stroke}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          whileInView={{ strokeDashoffset: offset }}
          viewport={{ once: true }}
          transition={{ duration: 1.3, ease: [0.16, 1, 0.3, 1] }}
          style={{ filter: `drop-shadow(0 0 6px ${stroke})` }}
        />
      </svg>
      {showValue && (
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-2xl font-semibold tabular-nums" style={{ color: stroke }}>
            {Math.round(value)}
          </span>
          <span className="text-[10px] uppercase tracking-wider text-muted-foreground">Health</span>
        </div>
      )}
    </div>
  )
}
