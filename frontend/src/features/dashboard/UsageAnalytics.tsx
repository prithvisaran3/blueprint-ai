import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { GlassCard } from '@/components/shared'
import { ChartTooltip } from './ChartTooltip'
import type { UsagePoint } from '@/types'

export function UsageAnalytics({ data }: { data: UsagePoint[] }) {
  return (
    <GlassCard className="lg:col-span-2">
      <div className="mb-1 flex items-center justify-between">
        <div>
          <h3 className="font-semibold">Usage analytics</h3>
          <p className="text-xs text-muted-foreground">Generations & token spend · last 14 days</p>
        </div>
        <div className="flex items-center gap-4 text-xs">
          <span className="flex items-center gap-1.5 text-muted-foreground">
            <span className="size-2 rounded-full bg-primary" /> Generations
          </span>
          <span className="flex items-center gap-1.5 text-muted-foreground">
            <span className="size-2 rounded-full bg-fuchsia-400" /> Tokens
          </span>
        </div>
      </div>

      <div className="mt-4 h-64 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 8, right: 6, left: -18, bottom: 0 }}>
            <defs>
              <linearGradient id="gradGen" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#38bdf8" stopOpacity={0.45} />
                <stop offset="100%" stopColor="#38bdf8" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="gradTok" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#e879f9" stopOpacity={0.3} />
                <stop offset="100%" stopColor="#e879f9" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
            <XAxis
              dataKey="date"
              tick={{ fontSize: 11, fill: 'var(--color-muted-foreground)' }}
              tickLine={false}
              axisLine={false}
              interval="preserveStartEnd"
            />
            <YAxis
              yAxisId="left"
              tick={{ fontSize: 11, fill: 'var(--color-muted-foreground)' }}
              tickLine={false}
              axisLine={false}
            />
            <YAxis yAxisId="right" orientation="right" hide />
            <Tooltip
              content={(props) => <ChartTooltip {...props} />}
              cursor={{ stroke: 'var(--color-border)' }}
            />
            <Area
              yAxisId="right"
              type="monotone"
              dataKey="tokens"
              stroke="#e879f9"
              strokeWidth={2}
              fill="url(#gradTok)"
            />
            <Area
              yAxisId="left"
              type="monotone"
              dataKey="generations"
              stroke="#38bdf8"
              strokeWidth={2.5}
              fill="url(#gradGen)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </GlassCard>
  )
}
