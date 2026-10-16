import type { ReactNode } from 'react'

import { cn } from '@/lib/cn'
import { formatMoneyShort } from '@/lib/format'

/** Shared tooltip shell: one surface, values in mono, identity by swatch. */
export function ChartTooltip({
  label,
  rows,
}: {
  label: ReactNode
  rows: { key: string; label: string; value: number; color: string }[]
}) {
  return (
    <div className="rounded-xl border border-sandal-200 bg-white/95 px-3.5 py-2.5 shadow-xl backdrop-blur-md">
      <p className="mb-1.5 text-[11px] font-bold tracking-[0.12em] text-navy-600 uppercase">{label}</p>
      <ul className="flex flex-col gap-1">
        {rows.map((row) => (
          <li key={row.key} className="flex items-center justify-between gap-6 text-[13px]">
            <span className="inline-flex items-center gap-1.5 text-navy-800 font-medium">
              <span className="size-2 rounded-full" style={{ backgroundColor: row.color }} aria-hidden />
              {row.label}
            </span>
            <span className="font-mono text-navy-950 font-bold tabular-nums">{formatMoneyShort(row.value)}</span>
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
          <span className="text-navy-800 font-medium">{item.label}</span>
          {typeof item.value === 'number' ? (
            <span className="font-mono text-navy-950 font-bold tabular-nums">{formatMoneyShort(item.value)}</span>
          ) : null}
        </li>
      ))}
    </ul>
  )
}

