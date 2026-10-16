import type { ReactNode } from 'react'
import { Check, Sparkles, Star, TrendingDown, TrendingUp, TriangleAlert } from 'lucide-react'

import { CHART, PRICE_ALERT_THRESHOLD } from '@/config'
import { cn } from '@/lib/cn'
import { formatPct } from '@/lib/format'
import { Money } from '@/components/ui/Money'
import { Sparkline } from '@/components/charts/Sparkline'
import { SCORE_WEIGHTS, type SupplierScore } from './scoreSuppliers'

const CONFIDENCE: Record<SupplierScore['confidence'], { label: string; dot: string; text: string }> = {
  high: { label: 'High confidence', dot: 'bg-tulsi-500', text: 'text-tulsi-700' },
  medium: { label: 'Some evidence', dot: 'bg-turmeric-500', text: 'text-turmeric-700' },
  low: { label: 'Thin evidence', dot: 'bg-marigold-500', text: 'text-marigold-500' },
}

/** The five components behind a score, in weight order. */
function factorsOf(score: SupplierScore): number[] {
  const byKey: Record<string, number> = {
    price: score.priceScore,
    quality: score.qualityScore,
    onTime: score.onTimeScore,
    trend: score.trendScore,
    recency: score.recencyScore,
  }
  return SCORE_WEIGHTS.map((w) => byKey[w.key] ?? 0)
}

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
  const quoteCount = scores.reduce((sum, s) => sum + s.sampleSize, 0)

  return (
    <div>
      <div className="mb-3 flex flex-wrap items-baseline gap-x-2 gap-y-1">
        <span className="inline-flex items-center gap-1.5">
          <Sparkles className="size-4 text-turmeric-700" aria-hidden />
          <h3 className="text-[12px] font-semibold tracking-[0.1em] text-stone-900 uppercase">AI suggestion</h3>
        </span>
        <span className="text-[13px] text-stone-500">
          {quoteCount} quote{quoteCount === 1 ? '' : 's'} across {scores.length} supplier
          {scores.length === 1 ? '' : 's'}. You choose — the ranking is advice.
        </span>
      </div>

      <ul className="grid gap-3 lg:grid-cols-3">
        {top.map((score) => (
          <li key={score.supplier.id}>
            <SupplierCard
              score={score}
              selected={score.supplier.id === selectedId}
              onSelect={() => onSelect(score)}
              quotedPrice={quotedPrice}
            />
          </li>
        ))}
      </ul>

      <ScoreBreakdown scores={scores} selectedId={selectedId} onSelect={onSelect} />

      {rest.length > 0 ? (
        <details className="mt-2.5">
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

/**
 * One supplier, kept to what decides the choice: who, at what price, how
 * sure we are, and why. Everything that is evidence rather than decision —
 * the factor scores — sits in the shared table below, where the three can
 * actually be compared column by column.
 */
function SupplierCard({
  score,
  selected,
  onSelect,
  quotedPrice,
}: {
  score: SupplierScore
  selected: boolean
  onSelect: () => void
  quotedPrice?: number
}) {
  const lead = score.rank === 1
  const confidence = CONFIDENCE[score.confidence]
  const alert =
    quotedPrice !== undefined &&
    score.expectedPrice > 0 &&
    quotedPrice > score.expectedPrice * (1 + PRICE_ALERT_THRESHOLD)

  return (
    <button
      type="button"
      onClick={onSelect}
      aria-pressed={selected}
      className={cn(
        'flex h-full w-full flex-col rounded-card border bg-sandal-50 text-left transition-all duration-150',
        selected
          ? 'border-kumkum-600 shadow-lift ring-2 ring-kumkum-600/15'
          : 'border-sandal-200 shadow-flat hover:border-navy-300 hover:shadow-card',
      )}
    >
      {/* Rank strip. The recommendation says so in words; the runners-up
          carry a number and nothing more. */}
      <span
        className={cn(
          'flex items-center justify-between gap-2 rounded-t-card border-b px-4 py-2 text-[11px] font-bold uppercase tracking-[0.1em]',
          lead ? 'border-turmeric-500/30 bg-turmeric-50 text-turmeric-700' : 'border-sandal-200 bg-sandal-100 text-stone-500',
        )}
      >
        <span>{lead ? 'Recommended' : `Alternative ${score.rank}`}</span>
        {selected ? (
          <span className="inline-flex items-center gap-1 text-kumkum-700">
            <Check className="size-3.5 stroke-[3]" aria-hidden />
            Chosen
          </span>
        ) : (
          <span className="font-mono tabular-nums">{score.score.toFixed(0)}/100</span>
        )}
      </span>

      <span className="flex flex-1 flex-col p-4">
        <span className="block truncate font-display text-[17px] leading-tight text-stone-900">
          {score.supplier.name}
        </span>
        <span className="block text-[13px] text-stone-500">{score.supplier.city}</span>

        <span className="mt-3 flex items-end justify-between gap-2">
          <span className="block">
            <Money value={score.expectedPrice} className="text-[22px] font-semibold text-stone-900" />
            <span className="block text-[11.5px] font-semibold uppercase tracking-[0.1em] text-stone-500">
              expected unit price
            </span>
          </span>
          <Sparkline
            points={score.trendPoints}
            color={score.trendPct > 0 ? CHART.outgo : CHART.income}
            width={68}
            height={24}
          />
        </span>

        {Math.abs(score.vsMedianPct) >= 1 ? (
          <span
            className={cn(
              'mt-1.5 inline-flex w-fit items-center gap-1 rounded-md px-1.5 py-0.5 text-[12px] font-semibold',
              score.vsMedianPct < 0 ? 'bg-tulsi-50 text-tulsi-700' : 'bg-sandal-100 text-stone-700',
            )}
          >
            {score.vsMedianPct < 0 ? (
              <TrendingDown className="size-3" aria-hidden />
            ) : (
              <TrendingUp className="size-3" aria-hidden />
            )}
            {Math.abs(score.vsMedianPct).toFixed(0)}% {score.vsMedianPct < 0 ? 'below' : 'above'} median
          </span>
        ) : null}

        <span className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 border-t border-sandal-200 pt-3 font-mono text-[12.5px] tabular-nums text-stone-700">
          <span className="inline-flex items-center gap-1">
            <Star className="size-3 fill-turmeric-500 text-turmeric-500" aria-hidden />
            {score.supplier.rating}
          </span>
          <span className="text-sandal-300">|</span>
          <span>{formatPct(score.supplier.onTimePct, 0)} on time</span>
          <span className="text-sandal-300">|</span>
          <span>{score.supplier.orderCount} orders</span>
        </span>

        <span className="mt-2.5 block text-[13px] leading-snug text-stone-700">{score.why}</span>

        <span className="mt-auto flex items-center gap-1.5 pt-3 text-[11.5px] text-stone-500">
          <span className={cn('size-1.5 rounded-full', confidence.dot)} aria-hidden />
          <span className={cn('font-semibold', confidence.text)}>{confidence.label}</span>
          <span>
            · {score.sampleSize} quote{score.sampleSize === 1 ? '' : 's'},{' '}
            {score.daysSinceQuote <= 1 ? 'newest today' : `newest ${score.daysSinceQuote}d ago`}
          </span>
        </span>

        {alert ? (
          <span className="mt-2.5 flex items-start gap-1.5 rounded-lg bg-danger-50 px-2.5 py-2 text-[12px] text-danger-600">
            <TriangleAlert className="mt-0.5 size-3.5 shrink-0" aria-hidden />
            The quoted price is more than 10% above this expectation.
          </span>
        ) : null}
      </span>
    </button>
  )
}

/**
 * The working, once, for everybody. Three cards each carrying their own set
 * of bars is three things to read; one table is a comparison.
 */
function ScoreBreakdown({
  scores,
  selectedId,
  onSelect,
}: {
  scores: SupplierScore[]
  selectedId: string | null
  onSelect: (score: SupplierScore) => void
}) {
  return (
    <details className="mt-3 overflow-hidden rounded-card border border-sandal-200 bg-sandal-50">
      <summary className="cursor-pointer px-4 py-2.5 text-[13px] font-medium text-stone-700 hover:bg-sandal-100">
        How these were scored
      </summary>
      <div className="scrollbar-thin overflow-x-auto border-t border-sandal-200">
        <table className="w-full border-collapse text-[13px]">
          <thead>
            <tr className="bg-sandal-100">
              <Th className="text-left">Supplier</Th>
              {SCORE_WEIGHTS.map((w) => (
                <Th key={w.key}>
                  {w.label}
                  <span className="block font-normal normal-case tracking-normal text-stone-500">
                    {Math.round(w.weight * 100)}%
                  </span>
                </Th>
              ))}
              <Th>Score</Th>
            </tr>
          </thead>
          <tbody>
            {scores.map((score) => (
              <tr
                key={score.supplier.id}
                onClick={() => onSelect(score)}
                className={cn(
                  'cursor-pointer border-t border-sandal-200 transition-colors hover:bg-sandal-100',
                  score.supplier.id === selectedId && 'bg-kumkum-50',
                )}
              >
                <td className="px-3 py-2 text-stone-900">
                  <span className="text-stone-500">{score.rank}.</span> {score.supplier.name}
                </td>
                {factorsOf(score).map((value, i) => (
                  <td key={i} className="px-3 py-2">
                    <FactorBar value={value} />
                  </td>
                ))}
                <td className="px-3 py-2 text-right font-mono font-bold tabular-nums text-stone-900">
                  {score.score.toFixed(0)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="border-t border-sandal-200 px-4 py-2.5 text-[12px] leading-relaxed text-stone-500">
        Each factor is scored out of 100 and weighted as above. The expected price is a weighted average of the last
        90 days of quotes, leaned towards the newest, then adjusted for the three-month trend.
      </p>
    </details>
  )
}

function Th({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <th
      className={cn(
        'px-3 py-2 text-center text-[10.5px] font-semibold uppercase tracking-[0.1em] text-stone-500',
        className,
      )}
    >
      {children}
    </th>
  )
}

function FactorBar({ value }: { value: number }) {
  return (
    <span className="flex items-center gap-2">
      <span className="h-1.5 w-full min-w-[40px] overflow-hidden rounded-full bg-sandal-200">
        <span
          className={cn(
            'block h-full rounded-full',
            value >= 70 ? 'bg-tulsi-500' : value >= 40 ? 'bg-turmeric-500' : 'bg-sandal-300',
          )}
          style={{ width: `${Math.max(2, value)}%` }}
        />
      </span>
      <span className="w-6 shrink-0 text-right font-mono text-[11px] tabular-nums text-stone-500">
        {value.toFixed(0)}
      </span>
    </span>
  )
}
