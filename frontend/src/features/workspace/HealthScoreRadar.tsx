import {
  PolarAngleAxis,
  PolarGrid,
  PolarRadiusAxis,
  Radar,
  RadarChart,
  ResponsiveContainer,
} from 'recharts'
import type { HealthScore } from '@/types'

export function HealthScoreRadar({ health }: { health: HealthScore }) {
  const data = health.dimensions.map((d) => ({ dimension: d.dimension, score: d.score }))
  return (
    <div className="h-72 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <RadarChart data={data} outerRadius="72%">
          <PolarGrid stroke="var(--color-border)" />
          <PolarAngleAxis
            dataKey="dimension"
            tick={{ fontSize: 11, fill: 'var(--color-muted-foreground)' }}
          />
          <PolarRadiusAxis domain={[0, 100]} tick={false} axisLine={false} />
          <Radar
            dataKey="score"
            stroke="#38bdf8"
            strokeWidth={2}
            fill="#38bdf8"
            fillOpacity={0.25}
            isAnimationActive
          />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  )
}
