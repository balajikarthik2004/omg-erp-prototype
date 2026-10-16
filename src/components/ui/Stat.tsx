import type { ReactNode } from 'react'
import { ArrowDownRight, ArrowUpRight } from 'lucide-react'
import { cn } from '@/lib/cn'

export function Stat({
  label,
  value,
  sub,
  delta,
  deltaMeaning = 'auto',
  accentClass,
  icon,
  className,
}: {
  label: string
  value: ReactNode
  sub?: ReactNode
  /** Percentage change against the previous period. */
  delta?: number
  /** 'auto' reads up as good. Use 'neutral' where a rise is not good news. */
  deltaMeaning?: 'auto' | 'neutral'
  /**
   * The phase or status colour, as a `bg-*` class. It reads as a pip beside
   * the label rather than a rule across the top: four KPI cards in a row were
   * four slabs of colour competing with the figures they were labelling.
   */
  accentClass?: string
  icon?: ReactNode
  className?: string
}) {
  const up = (delta ?? 0) >= 0
  return (
    <div
      className={cn(
        'group flex flex-col rounded-xl border border-navy-200/70 bg-white p-4 sm:p-4.5',
        'shadow-card hover:border-navy-200 hover:shadow-lift transition-all duration-200',
        className,
      )}
    >
      <div className="flex items-start justify-between gap-2.5">
        <p className="flex min-w-0 items-center gap-1.5 text-[11px] font-bold tracking-[0.12em] text-navy-700 uppercase">
          {accentClass ? (
            <span className={cn('size-1.5 shrink-0 rounded-full', accentClass)} aria-hidden />
          ) : null}
          <span className="truncate">{label}</span>
        </p>
        {icon ? (
          <span className="flex size-7.5 shrink-0 items-center justify-center rounded-lg border border-navy-100 bg-navy-50 text-navy-600 shadow-2xs transition-colors duration-200 group-hover:border-navy-200 group-hover:bg-navy-100/70">
            {icon}
          </span>
        ) : null}
      </div>

      <p className="mt-2.5 font-heritage text-[22px] sm:text-[26px] lg:text-[28px] leading-none font-bold tracking-tight text-navy-950">
        {value}
      </p>

      {typeof delta === 'number' || sub ? (
        <div className="mt-2.5 flex flex-wrap items-center gap-x-2 gap-y-1">
          {typeof delta === 'number' ? (
            <span
              className={cn(
                'inline-flex items-center gap-0.5 rounded-md px-1.5 py-0.5 font-mono text-[11px] font-bold tabular-nums',
                deltaMeaning === 'neutral'
                  ? 'bg-sandal-100 text-stone-700'
                  : up
                    ? 'bg-tulsi-50 text-tulsi-700'
                    : 'bg-danger-50 text-danger-600',
              )}
            >
              {up ? (
                <ArrowUpRight className="size-3 stroke-3" aria-hidden />
              ) : (
                <ArrowDownRight className="size-3 stroke-3" aria-hidden />
              )}
              {Math.abs(delta).toFixed(1)}%
            </span>
          ) : null}
          {sub ? <span className="text-[12px] sm:text-[12.5px] font-medium text-stone-600">{sub}</span> : null}
        </div>
      ) : null}
    </div>
  )
}
