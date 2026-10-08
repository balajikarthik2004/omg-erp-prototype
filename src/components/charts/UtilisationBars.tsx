import { Link } from 'react-router-dom'

import { cn } from '@/lib/cn'
import { formatMoney, formatPct } from '@/lib/format'
import { available, utilisation } from '@/store/db'
import type { BudgetHead } from '@/types'

/**
 * Horizontal utilisation, drawn as plain elements rather than a chart library:
 * every row is directly labelled, which is what the colour contrast needs.
 */
export function UtilisationBars({
  heads,
  limit,
  className,
}: {
  heads: BudgetHead[]
  limit?: number
  className?: string
}) {
  const rows = (limit ? heads.slice(0, limit) : heads).map((head) => ({
    head,
    used: utilisation(head),
    free: available(head),
  }))

  if (rows.length === 0) {
    return <p className="py-8 text-center text-[14px] text-stone-500">No budget heads match this filter.</p>
  }

  return (
    <ul className={cn('flex flex-col gap-3.5', className)}>
      {rows.map(({ head, used, free }) => {
        const over = used > 100
        const near = used >= 85 && used <= 100
        return (
          <li key={head.id}>
            <div className="mb-1.5 flex items-baseline justify-between gap-3">
              <Link
                to={`/console/budgets?focus=${head.id}`}
                className="truncate text-[14px] text-stone-900 hover:text-kumkum-700"
              >
                {head.name}
              </Link>
              <span
                className={cn(
                  'shrink-0 font-mono text-[13px] tabular-nums',
                  over ? 'text-danger-600' : near ? 'text-marigold-500' : 'text-stone-500',
                )}
              >
                {formatPct(used, 0)}
              </span>
            </div>
            <div className="h-2 w-full overflow-hidden rounded-full bg-sandal-200">
              <span
                className={cn('block h-full rounded-full', over ? 'bg-danger-600' : near ? 'bg-marigold-500' : 'bg-tulsi-500')}
                style={{ width: `${Math.min(100, used)}%` }}
              />
            </div>
            <p className="mt-1 text-[12px] text-stone-500">
              {over ? (
                <span className="text-danger-600">{formatMoney(Math.abs(free))} over the allocation</span>
              ) : (
                <>
                  {formatMoney(free)} available of {formatMoney(head.allocated)}
                </>
              )}
            </p>
          </li>
        )
      })}
    </ul>
  )
}
