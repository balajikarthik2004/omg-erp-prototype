import { Line, LineChart, ResponsiveContainer, YAxis } from 'recharts'

import { cn } from '@/lib/cn'

/** A bare trend mark. It never carries its own axis or legend — the row names it. */
export function Sparkline({
  points,
  color = '#2E7D4F',
  width = 96,
  height = 28,
  className,
}: {
  points: number[]
  color?: string
  width?: number | string
  height?: number
  className?: string
}) {
  if (points.length < 2) {
    return <span className={cn('inline-block text-[13px] text-stone-500', className)}>—</span>
  }

  const data = points.map((value, i) => ({ i, value }))

  return (
    <div className={className} style={{ width, height }}>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 3, right: 2, bottom: 3, left: 2 }}>
          <YAxis hide domain={['dataMin', 'dataMax']} />
          <Line type="monotone" dataKey="value" stroke={color} strokeWidth={2} dot={false} isAnimationActive={false} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
