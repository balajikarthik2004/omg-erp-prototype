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
        'relative overflow-hidden rounded-card border border-sandal-200 bg-sandal-50 p-5 shadow-card',
        className,
      )}
    >
      {accentClass ? <div className={cn('absolute inset-x-0 top-0 h-1', accentClass)} aria-hidden /> : null}

      <div className="flex items-start justify-between gap-3">
        <p className="text-[11px] font-semibold tracking-[0.12em] text-stone-500 uppercase">{label}</p>
        {icon ? (
          <span className="flex size-7 items-center justify-center rounded-lg bg-sandal-100 text-stone-500">
            {icon}
          </span>
        ) : null}
      </div>

      <p className="mt-3 font-display text-[30px] leading-none text-stone-900">{value}</p>

      {typeof delta === 'number' || sub ? (
        <div className="mt-3 flex flex-wrap items-center gap-x-2 gap-y-1">
          {typeof delta === 'number' ? (
            <span
              className={cn(
                'inline-flex items-center gap-0.5 rounded-md px-1.5 py-0.5 font-mono text-[12px] tabular-nums',
                deltaMeaning === 'neutral'
                  ? 'bg-sandal-100 text-stone-700'
                  : up
                    ? 'bg-tulsi-50 text-tulsi-700'
                    : 'bg-danger-50 text-danger-600',
              )}
            >
              {up ? (
                <ArrowUpRight className="size-3" aria-hidden />
              ) : (
                <ArrowDownRight className="size-3" aria-hidden />
              )}
              {Math.abs(delta).toFixed(1)}%
            </span>
          ) : null}
          {sub ? <span className="text-[13px] text-stone-500">{sub}</span> : null}
        </div>
      ) : null}
    </div>
  )
}
