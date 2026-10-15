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
  accentClass?: string
  icon?: ReactNode
  className?: string
}) {
  const up = (delta ?? 0) >= 0
  return (
    <div
      className={cn(
        'relative overflow-hidden rounded-xl border border-navy-100/90 bg-white p-4 sm:p-4.5 shadow-card hover:shadow-lift transition-all duration-200',
        className,
      )}
    >
      {accentClass ? <div className={cn('absolute inset-x-0 top-0 h-1', accentClass)} aria-hidden /> : null}

      <div className="flex items-start justify-between gap-2.5">
        <p className="text-[11px] font-bold tracking-[0.12em] text-navy-700 uppercase">{label}</p>
        {icon ? (
          <span className="flex size-7.5 shrink-0 items-center justify-center rounded-lg bg-navy-50 text-navy-600 border border-navy-100 shadow-2xs">
            {icon}
          </span>
        ) : null}
      </div>

      <p className="mt-2 sm:mt-2.5 font-heritage text-[20px] sm:text-[24px] lg:text-[26px] leading-tight font-bold text-navy-950 tracking-tight">
        {value}
      </p>

      {typeof delta === 'number' || sub ? (
        <div className="mt-2 sm:mt-2.5 flex flex-wrap items-center gap-x-2 gap-y-1">
          {typeof delta === 'number' ? (
            <span
              className={cn(
                'inline-flex items-center gap-0.5 rounded-lg px-2 py-0.5 font-mono text-[11px] font-bold tabular-nums border shadow-2xs',
                deltaMeaning === 'neutral'
                  ? 'bg-navy-50 text-navy-800 border-navy-200'
                  : up
                    ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                    : 'bg-rose-50 text-rose-800 border-rose-200',
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
