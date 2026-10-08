import { Check, Sparkles, Star, TrendingDown, TrendingUp, TriangleAlert } from 'lucide-react'

import { CHART, PRICE_ALERT_THRESHOLD } from '@/config'
import { cn } from '@/lib/cn'
import { formatPct } from '@/lib/format'
import { Money } from '@/components/ui/Money'
import { Sparkline } from '@/components/charts/Sparkline'
import type { SupplierScore } from './scoreSuppliers'

export function SupplierSuggestions({
  scores,
  selectedId,
  onSelect,
  quotedPrice,
}: {
  scores: SupplierScore[]
  selectedId: string | null
  onSelect: (score: SupplierScore) => void
  /** The price actually being entered, to check against expectation. */
  quotedPrice?: number
}) {
  if (scores.length === 0) {
    return (
      <p className="rounded-card border border-dashed border-sandal-300 px-4 py-8 text-center text-[14px] text-stone-500">
        No active supplier carries this item. Add one on the suppliers page first.
      </p>
    )
  }

  const top = scores.slice(0, 3)
  const rest = scores.slice(3)

  return (
    <div>
      <div className="mb-3 flex items-center gap-2">
        <Sparkles className="size-4 text-turmeric-700" aria-hidden />
        <h3 className="text-[12px] font-medium tracking-[0.06em] text-stone-900 uppercase">AI suggestion</h3>
        <span className="text-[13px] text-stone-500">— you choose; the ranking is only advice.</span>
      </div>

      <ul className="grid gap-3 lg:grid-cols-3">
        {top.map((score) => {
          const selected = score.supplier.id === selectedId
          const alert =
            quotedPrice !== undefined &&
            score.expectedPrice > 0 &&
            quotedPrice > score.expectedPrice * (1 + PRICE_ALERT_THRESHOLD)

          return (
            <li key={score.supplier.id}>
              <button
                type="button"
                onClick={() => onSelect(score)}
                aria-pressed={selected}
                className={cn(
                  'flex h-full w-full flex-col rounded-card border bg-sandal-50 p-4 text-left transition-colors duration-150',
                  selected ? 'border-kumkum-600 ring-2 ring-kumkum-600/20' : 'border-sandal-200 hover:border-turmeric-400',
                )}
              >
                <div className="mb-2 flex items-start justify-between gap-2">
                  <span
                    className={cn(
                      'inline-flex size-6 shrink-0 items-center justify-center rounded-full font-mono text-[12px]',
                      score.rank === 1 ? 'bg-turmeric-500 text-stone-900' : 'bg-sandal-200 text-stone-700',
                    )}
                  >
                    {score.rank}
                  </span>
                  {selected ? (
                    <span className="inline-flex items-center gap-1 rounded-full bg-kumkum-50 px-2 py-0.5 text-[12px] font-medium text-kumkum-700">
                      <Check className="size-3" aria-hidden />
                      Chosen
                    </span>
                  ) : null}
                </div>

                <h4 className="font-display text-[18px] leading-tight text-stone-900">{score.supplier.name}</h4>
                <p className="text-[13px] text-stone-500">{score.supplier.city}</p>

                <div className="mt-3 flex items-end justify-between gap-2">
                  <div>
                    <p className="text-[11px] font-semibold tracking-[0.12em] text-stone-500 uppercase">Expected unit price</p>
                    <Money value={score.expectedPrice} className="text-[18px] text-stone-900" />
                  </div>
                  <Sparkline
                    points={score.trendPoints}
                    color={score.trendPct > 0 ? CHART.outgo : CHART.income}
                    width={72}
                    height={26}
                  />
                </div>

                <dl className="mt-3 grid grid-cols-2 gap-x-3 gap-y-1.5 border-t border-sandal-200 pt-3 text-[12px]">
                  <Row label="Last paid" value={<Money value={score.lastPaidPrice} className="text-[13px]" />} />
                  <Row
                    label="Quality"
                    value={
                      <span className="inline-flex items-center gap-1 font-mono text-[13px] tabular-nums">
                        <Star className="size-3 fill-turmeric-500 text-turmeric-500" aria-hidden />
                        {score.supplier.rating}
                      </span>
                    }
                  />
                  <Row
                    label="On time"
                    value={<span className="font-mono text-[13px] tabular-nums">{formatPct(score.supplier.onTimePct, 0)}</span>}
                  />
                  <Row
                    label="Orders"
                    value={<span className="font-mono text-[13px] tabular-nums">{score.supplier.orderCount}</span>}
                  />
                </dl>

                <p className="mt-3 flex items-start gap-1.5 text-[13px] leading-snug text-stone-700">
                  {score.trendPct > 0 ? (
                    <TrendingUp className="mt-0.5 size-3.5 shrink-0 text-danger-600" aria-hidden />
                  ) : (
                    <TrendingDown className="mt-0.5 size-3.5 shrink-0 text-tulsi-700" aria-hidden />
                  )}
                  <span>
                    <span className="font-medium text-stone-900">Why this pick: </span>
                    {score.why}
                  </span>
                </p>

                {alert ? (
                  <p className="mt-2 flex items-start gap-1.5 rounded-lg bg-danger-50 px-2.5 py-2 text-[12px] text-danger-600">
                    <TriangleAlert className="mt-0.5 size-3.5 shrink-0" aria-hidden />
                    The quoted price is more than 10% above the expected price.
                  </p>
                ) : null}
              </button>
            </li>
          )
        })}
      </ul>

      {rest.length > 0 ? (
        <details className="mt-3">
          <summary className="cursor-pointer text-[13px] text-stone-500 hover:text-stone-900">
            {rest.length} other supplier{rest.length === 1 ? '' : 's'} carry this item
          </summary>
          <ul className="mt-2 flex flex-col divide-y divide-sandal-200 rounded-card border border-sandal-200">
            {rest.map((score) => (
              <li key={score.supplier.id}>
                <button
                  type="button"
                  onClick={() => onSelect(score)}
                  className="flex w-full items-center justify-between gap-3 px-3 py-2.5 text-left transition-colors duration-150 hover:bg-sandal-100"
                >
                  <span className="min-w-0">
                    <span className="block truncate text-[14px] text-stone-900">
                      {score.rank}. {score.supplier.name}
                    </span>
                    <span className="block truncate text-[12px] text-stone-500">{score.why}</span>
                  </span>
                  <Money value={score.expectedPrice} className="shrink-0 text-[14px]" />
                </button>
              </li>
            ))}
          </ul>
        </details>
      ) : null}
    </div>
  )
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-2">
      <dt className="text-stone-500">{label}</dt>
      <dd>{value}</dd>
    </div>
  )
}
