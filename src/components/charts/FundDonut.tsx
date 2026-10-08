import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts'

import { SECTORS, type SectorId } from '@/config'
import { formatMoney } from '@/lib/format'
import type { FundSlice } from '@/store/selectors'
import { ChartTooltip } from './ChartKit'

/**
 * Balances rolled up to sector, not one hue per fund — a dozen generated hues
 * would be unreadable. The list beside it carries every fund by name.
 */
export function FundDonut({ slices, height = 220 }: { slices: FundSlice[]; height?: number }) {
  const bySector = new Map<SectorId, number>()
  for (const slice of slices) {
    bySector.set(slice.sectorId, (bySector.get(slice.sectorId) ?? 0) + slice.balance)
  }

  const data = [...bySector.entries()]
    .map(([sectorId, value]) => ({
      key: sectorId,
      label: SECTORS[sectorId].name,
      value,
      color: SECTORS[sectorId].chartColor,
    }))
    .sort((a, b) => b.value - a.value)

  const total = data.reduce((s, d) => s + d.value, 0)

  if (total <= 0) {
    return <p className="py-10 text-center text-[14px] text-stone-500">No fund balances to show yet.</p>
  }

  return (
    <div className="flex flex-col items-center gap-6">
      <div className="relative shrink-0" style={{ width: height, height }}>
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              dataKey="value"
              nameKey="label"
              innerRadius="62%"
              outerRadius="100%"
              paddingAngle={2}
              stroke="#FFFBF4"
              strokeWidth={2}
            >
              {data.map((d) => (
                <Cell key={d.key} fill={d.color} />
              ))}
            </Pie>
            <Tooltip
              content={({ active, payload }) =>
                active && payload?.length ? (
                  <ChartTooltip
                    label="Fund balance"
                    rows={[
                      {
                        key: String(payload[0]?.name),
                        label: String(payload[0]?.name),
                        value: Number(payload[0]?.value ?? 0),
                        color: String(payload[0]?.payload?.color ?? '#9A1F18'),
                      },
                    ]}
                  />
                ) : null
              }
            />
          </PieChart>
        </ResponsiveContainer>
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-[11px] font-semibold tracking-[0.12em] text-stone-500 uppercase">Held</span>
          <span className="font-display text-[22px] text-stone-900">{formatMoney(total)}</span>
        </div>
      </div>

      <ul className="w-full space-y-2.5">
        {slices.slice(0, 6).map((slice) => (
          <li key={slice.id} className="flex items-baseline justify-between gap-3 border-b border-sandal-200 pb-2 last:border-0 last:pb-0">
            <span className="flex min-w-0 items-center gap-2">
              <span
                className="size-2.5 shrink-0 rounded-sm"
                style={{ backgroundColor: SECTORS[slice.sectorId].chartColor }}
                aria-hidden
              />
              <span className="truncate text-[14px] text-stone-700">{slice.name}</span>
            </span>
            <span className="shrink-0 font-mono text-[14px] text-stone-900 tabular-nums">
              {formatMoney(slice.balance)}
            </span>
          </li>
        ))}
      </ul>
    </div>
  )
}
