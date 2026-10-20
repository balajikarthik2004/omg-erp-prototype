import { TrendingUp } from 'lucide-react'

import { formatPct } from '@/lib/format'
import { available, utilisation } from '@/store/db'
import { Money } from '@/components/ui/Money'
import { BudgetBar, BudgetLegend } from '@/components/flow/BudgetBar'
import type { BudgetHead } from '@/types'

/**
 * Before and after, on one scale. An approved allotment raises `allocated`,
 * which is the only field it touches — so the second bar is the real shape of
 * the head after a yes, not an illustration of one.
 */
export function AllotmentEffect({ head, amount }: { head: BudgetHead; amount: number }) {
  const after: BudgetHead = { ...head, allocated: head.allocated + amount }
  const scale = Math.max(after.allocated, after.committed + after.spent)

  return (
    <section>
      <h3 className="mb-3 text-[11px] font-semibold tracking-[0.12em] text-stone-500 uppercase">
        Effect on {head.name}
      </h3>

      <div className="rounded-card border border-sandal-200 bg-sandal-50 p-4 shadow-flat">
        <Row label="Now" head={head} scale={scale} />
        <Row label="If approved" head={after} scale={scale} emphasis />

        <div className="mt-4 border-t border-sandal-200 pt-3">
          <BudgetLegend head={after} />
        </div>

        <p className="mt-3 inline-flex items-center gap-1.5 text-[13px] text-stone-700">
          <TrendingUp className="size-3.5 text-tulsi-700" aria-hidden />
          Available rises from <Money value={available(head)} tone="muted" /> to{' '}
          <Money value={available(after)} className="font-semibold text-tulsi-700" />
        </p>
      </div>
    </section>
  )
}

function Row({
  label,
  head,
  scale,
  emphasis,
}: {
  label: string
  head: BudgetHead
  scale: number
  emphasis?: boolean
}) {
  return (
    <div className={emphasis ? 'mt-3.5' : undefined}>
      <div className="mb-1.5 flex items-baseline justify-between gap-3 text-[12px]">
        <span className={emphasis ? 'font-semibold text-stone-900' : 'text-stone-500'}>{label}</span>
        <span className="font-mono text-stone-500 tabular-nums">
          {formatPct(utilisation(head), 0)} used of <Money value={head.allocated} tone="muted" />
        </span>
      </div>
      <BudgetBar head={head} scaleTo={scale} showLegend={false} />
    </div>
  )
}
