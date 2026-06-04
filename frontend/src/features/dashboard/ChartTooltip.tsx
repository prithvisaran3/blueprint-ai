import { formatNumber } from '@/lib/utils'

interface ChartTooltipProps {
  active?: boolean
  // Recharts 3 payload shape varies; keep loose for the custom tooltip renderer.
  payload?: readonly Record<string, unknown>[]
  label?: string | number
}

/** Glassmorphism tooltip shared across Recharts visualizations. */
export function ChartTooltip({ active, payload, label }: ChartTooltipProps) {
  if (!active || !payload || payload.length === 0) return null
  return (
    <div className="glass rounded-lg px-3 py-2 text-xs shadow-lg">
      {label != null && <p className="mb-1 font-medium text-foreground">{label}</p>}
      <div className="space-y-0.5">
        {payload.map((item, i) => {
          const name = item.name as string | number | undefined
          const value = item.value
          const color = item.color as string | undefined
          return (
          <div key={i} className="flex items-center gap-2">
            <span className="size-2 rounded-full" style={{ backgroundColor: color }} />
            <span className="capitalize text-muted-foreground">{name}</span>
            <span className="ml-auto font-medium text-foreground">
              {typeof value === 'number'
                ? formatNumber(value)
                : typeof value === 'string'
                  ? value
                  : String(value ?? '')}
            </span>
          </div>
          )
        })}
      </div>
    </div>
  )
}
