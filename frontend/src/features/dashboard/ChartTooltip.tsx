import { formatNumber } from '@/lib/utils'

interface TooltipPayloadItem {
  name?: string | number
  value?: string | number
  color?: string
  dataKey?: string | number
}

interface ChartTooltipProps {
  active?: boolean
  payload?: readonly TooltipPayloadItem[]
  label?: string | number
}

/** Glassmorphism tooltip shared across Recharts visualizations. */
export function ChartTooltip({ active, payload, label }: ChartTooltipProps) {
  if (!active || !payload || payload.length === 0) return null
  return (
    <div className="glass rounded-lg px-3 py-2 text-xs shadow-lg">
      {label != null && <p className="mb-1 font-medium text-foreground">{label}</p>}
      <div className="space-y-0.5">
        {payload.map((item, i) => (
          <div key={i} className="flex items-center gap-2">
            <span className="size-2 rounded-full" style={{ backgroundColor: item.color }} />
            <span className="capitalize text-muted-foreground">{item.name}</span>
            <span className="ml-auto font-medium text-foreground">
              {typeof item.value === 'number' ? formatNumber(item.value) : item.value}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}
