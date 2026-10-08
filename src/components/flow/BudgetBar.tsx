import { cn } from '@/lib/cn'
import { formatMoney } from '@/lib/format'
import { available, utilisation } from '@/store/db'
import type { BudgetHead } from '@/types'

/** Stacked Spent | Committed | Available, in that reading order. */
export function BudgetBar({
  head,
  showLegend = true,
  className,
}: {
  head: BudgetHead
  showLegend?: boolean
  className?: string
}) {
  const total = Math.max(head.allocated, head.committed + head.spent)
  const pct = (value: number) => (total <= 0 ? 0 : (value / total) * 100)
  const free = Math.max(0, available(head))
  const over = utilisation(head) > 100

  return (
    <div className={className}>
      <div
        className="flex h-2.5 w-full overflow-hidden rounded-full bg-sandal-200"
        role="img"
        aria-label={`Spent ${formatMoney(head.spent)}, committed ${formatMoney(head.committed)}, available ${formatMoney(free)} of ${formatMoney(head.allocated)}`}
      >
        <span className={cn('h-full', over ? 'bg-danger-600' : 'bg-tulsi-500')} style={{ width: `${pct(head.spent)}%` }} />
        <span className="h-full bg-turmeric-500" style={{ width: `${pct(head.committed)}%` }} />
        <span className="h-full bg-sandal-300" style={{ width: `${pct(free)}%` }} />
      </div>

      {showLegend ? (
        <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-[12px]">
          <Legend swatch={over ? 'bg-danger-600' : 'bg-tulsi-500'} label="Spent" value={head.spent} />
          <Legend swatch="bg-turmeric-500" label="Committed" value={head.committed} />
          <Legend
            swatch={over ? 'bg-danger-50' : 'bg-sandal-300'}
            label={over ? 'Over budget' : 'Available'}
            value={over ? available(head) : free}
            tone={over ? 'danger' : undefined}
          />
        </div>
      ) : null}
    </div>
  )
}

function Legend({
  swatch,
  label,
  value,
  tone,
}: {
  swatch: string
  label: string
  value: number
  tone?: 'danger'
}) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <span className={cn('size-2 rounded-full', swatch)} aria-hidden />
      <span className="text-stone-500">{label}</span>
      <span className={cn('font-mono tabular-nums', tone === 'danger' ? 'text-danger-600' : 'text-stone-700')}>
        {formatMoney(value)}
      </span>
    </span>
  )
}
