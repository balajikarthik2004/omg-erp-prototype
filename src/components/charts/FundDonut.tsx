import { useState } from 'react'
import { Cell, Pie, PieChart, ResponsiveContainer } from 'recharts'

import { SECTORS, type SectorId } from '@/config'
import { cn } from '@/lib/cn'
import { formatMoney } from '@/lib/format'
import type { FundSlice } from '@/store/selectors'

/**
 * Balances rolled up to sector, not one hue per fund — a dozen generated hues
 * would be unreadable. The list beside it carries every fund by name.
 */
export function FundDonut({ slices, height = 220 }: { slices: FundSlice[]; height?: number }) {
  const [activeIndex, setActiveIndex] = useState<number | null>(null)

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

  const activeSector = activeIndex !== null ? data[activeIndex] : null
  const percent = activeSector && total > 0 ? Math.round((activeSector.value / total) * 100) : null

  return (
    <div className="flex flex-col items-center gap-6" onMouseLeave={() => setActiveIndex(null)}>
      <div
        className="relative shrink-0"
        style={{ width: height, height }}
        onMouseLeave={() => setActiveIndex(null)}
        onPointerLeave={() => setActiveIndex(null)}
      >
        <ResponsiveContainer width="100%" height="100%">
          <PieChart onMouseLeave={() => setActiveIndex(null)}>
            <Pie
              data={data}
              dataKey="value"
              nameKey="label"
              innerRadius="64%"
              outerRadius="100%"
              paddingAngle={2}
              stroke="#FFFBF4"
              strokeWidth={2}
              isAnimationActive={true}
              animationDuration={800}
              animationEasing="ease-out"
              onMouseEnter={(_, index) => setActiveIndex(index)}
              onMouseLeave={() => setActiveIndex(null)}
            >
              {data.map((d, index) => (
                <Cell
                  key={d.key}
                  fill={d.color}
                  fillOpacity={activeIndex === null || activeIndex === index ? 1 : 0.45}
                  style={{ transition: 'fill-opacity 200ms ease', cursor: 'pointer', outline: 'none' }}
                />
              ))}
            </Pie>
          </PieChart>
        </ResponsiveContainer>
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center text-center px-3 transition-all duration-150">
          <span className="truncate max-w-[130px] text-[11px] font-semibold tracking-[0.1em] text-stone-500 uppercase">
            {activeSector ? activeSector.label : 'Held'}
          </span>
          <span className="font-display text-[20px] text-stone-900 leading-tight">
            {formatMoney(activeSector ? activeSector.value : total)}
          </span>
          {percent !== null ? (
            <span className="font-mono text-[11px] text-stone-500">{percent}% of total</span>
          ) : (
            <span className="text-[11px] text-stone-400">Total held</span>
          )}
        </div>
      </div>

      <ul className="w-full space-y-2.5">
        {slices.slice(0, 6).map((slice) => {
          const isSectorActive = activeSector?.key === slice.sectorId
          return (
            <li
              key={slice.id}
              className={cn(
                'flex items-baseline justify-between gap-3 border-b border-sandal-200 pb-2 transition-opacity duration-150 last:border-0 last:pb-0',
                activeIndex !== null && !isSectorActive ? 'opacity-40' : 'opacity-100',
              )}
            >
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
          )
        })}
      </ul>
    </div>
  )
}
