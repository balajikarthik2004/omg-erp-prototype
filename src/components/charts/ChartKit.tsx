import type { ReactNode } from 'react'

import { cn } from '@/lib/cn'
import { formatMoney } from '@/lib/format'

/** Shared tooltip shell: one surface, values in mono, identity by swatch. */
export function ChartTooltip({
  label,
  rows,
}: {
  label: ReactNode
  rows: { key: string; label: string; value: number; color: string }[]
}) {
  return (
    <div className="rounded-lg border border-sandal-200 bg-sandal-50 px-3 py-2 shadow-card">
      <p className="mb-1.5 text-[11px] font-semibold tracking-[0.12em] text-stone-500 uppercase">{label}</p>
      <ul className="flex flex-col gap-1">
        {rows.map((row) => (
          <li key={row.key} className="flex items-center justify-between gap-6 text-[13px]">
            <span className="inline-flex items-center gap-1.5 text-stone-700">
              <span className="size-2 rounded-full" style={{ backgroundColor: row.color }} aria-hidden />
              {row.label}
            </span>
            <span className="font-mono text-stone-900 tabular-nums">{formatMoney(row.value)}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}

/** A legend that always carries the value, so identity is never colour alone. */
export function ChartLegend({
  items,
  className,
}: {
  items: { key: string; label: string; value?: number; color: string }[]
  className?: string
}) {
  return (
    <ul className={cn('flex flex-wrap items-center gap-x-4 gap-y-1.5', className)}>
      {items.map((item) => (
        <li key={item.key} className="inline-flex items-center gap-1.5 text-[13px]">
          <span className="size-2.5 rounded-sm" style={{ backgroundColor: item.color }} aria-hidden />
          <span className="text-stone-700">{item.label}</span>
          {typeof item.value === 'number' ? (
            <span className="font-mono text-stone-900 tabular-nums">{formatMoney(item.value)}</span>
          ) : null}
        </li>
      ))}
    </ul>
  )
}

