import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'

import { CHART } from '@/config'
import { formatMoneyCompact } from '@/lib/format'
import type { MonthPoint } from '@/store/selectors'
import { AXIS_LINE, AXIS_TICK } from './axis'
import { ChartLegend, ChartTooltip } from './ChartKit'

/** Two measures on one scale — never a second y-axis. */
export function IncomeOutgoChart({ data, height = 280 }: { data: MonthPoint[]; height?: number }) {
  const totalIncome = data.reduce((s, d) => s + d.income, 0)
  const totalOutgo = data.reduce((s, d) => s + d.outgo, 0)
  const totalNet = totalIncome - totalOutgo

  return (
    <div>
      <ChartLegend
        className="mb-3"
        items={[
          { key: 'income', label: 'Income', value: totalIncome, color: CHART.income },
          { key: 'outgo', label: 'Outgo', value: totalOutgo, color: CHART.outgo },
          { key: 'net', label: 'Net', value: totalNet, color: CHART.accent },
        ]}
      />
      <div style={{ height }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 4, right: 4, bottom: 0, left: -8 }} barGap={2}>
            <CartesianGrid stroke={CHART.grid} vertical={false} />
            <XAxis dataKey="label" tick={AXIS_TICK} axisLine={AXIS_LINE} tickLine={false} />
            <YAxis
              tick={AXIS_TICK}
              axisLine={false}
              tickLine={false}
              width={64}
              tickFormatter={(v: number) => formatMoneyCompact(v)}
            />
            <Tooltip
              cursor={{ fill: '#FBF3E4' }}
              content={({ active, payload, label }) =>
                active && payload?.length ? (
                  <ChartTooltip
                    label={label as string}
                    rows={[
                      { key: 'income', label: 'Income', value: Number(payload[0]?.payload?.income ?? 0), color: CHART.income },
                      { key: 'outgo', label: 'Outgo', value: Number(payload[0]?.payload?.outgo ?? 0), color: CHART.outgo },
                      { key: 'net', label: 'Net', value: Number(payload[0]?.payload?.net ?? 0), color: CHART.accent },
                    ]}
                  />
                ) : null
              }
            />
            <Bar
              dataKey="income"
              fill={CHART.income}
              radius={[4, 4, 0, 0]}
              maxBarSize={18}
              isAnimationActive={true}
              animationDuration={800}
              animationEasing="ease-out"
              style={{ outline: 'none' }}
            />
            <Bar
              dataKey="outgo"
              fill={CHART.outgo}
              radius={[4, 4, 0, 0]}
              maxBarSize={18}
              isAnimationActive={true}
              animationDuration={800}
              animationEasing="ease-out"
              style={{ outline: 'none' }}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}

/** The same 12 months split by sector, for the reports page. */
export function SectorIncomeChart({ data, height = 280 }: { data: MonthPoint[]; height?: number }) {
  const series = [
    { key: 'temple', label: 'Temple', color: CHART.temple },
    { key: 'sevalaya', label: 'Sevalaya', color: CHART.sevalaya },
    { key: 'sangam', label: 'Tamil Sangam', color: CHART.sangam },
  ]

  return (
    <div>
      <ChartLegend
        className="mb-3"
        items={series.map((s) => ({
          key: s.key,
          label: s.label,
          value: data.reduce((sum, d) => sum + (d[s.key as 'temple'] ?? 0), 0),
          color: s.color,
        }))}
      />
      <div style={{ height }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 4, right: 4, bottom: 0, left: -8 }}>
            <CartesianGrid stroke={CHART.grid} vertical={false} />
            <XAxis dataKey="label" tick={AXIS_TICK} axisLine={AXIS_LINE} tickLine={false} />
            <YAxis
              tick={AXIS_TICK}
              axisLine={false}
              tickLine={false}
              width={64}
              tickFormatter={(v: number) => formatMoneyCompact(v)}
            />
            <Tooltip
              cursor={{ fill: '#FBF3E4' }}
              content={({ active, payload, label }) =>
                active && payload?.length ? (
                  <ChartTooltip
                    label={label as string}
                    rows={series.map((s) => ({
                      key: s.key,
                      label: s.label,
                      value: Number(payload[0]?.payload?.[s.key] ?? 0),
                      color: s.color,
                    }))}
                  />
                ) : null
              }
            />
            {series.map((s) => (
              // A 2px surface gap keeps stacked segments from touching.
              <Bar
                key={s.key}
                dataKey={s.key}
                stackId="sector"
                fill={s.color}
                stroke={CHART.surface}
                strokeWidth={2}
                maxBarSize={26}
                isAnimationActive={true}
                animationDuration={800}
                animationEasing="ease-out"
              />
            ))}
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
