import { useMemo } from 'react'
import { AlertTriangle, Check, Info, Sparkles, TrendingDown, TrendingUp } from 'lucide-react'

import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Money } from '@/components/ui/Money'
import { cn } from '@/lib/cn'
import { useDb } from '@/store/db'
import type { EventRecord } from '@/types'
import { analyseBudget, type BudgetFinding, type DraftLine, type FindingKind, type Severity } from './logic/budgetAgent'

const ICON: Record<FindingKind, typeof Info> = {
  missing_line: AlertTriangle,
  stale_line: Info,
  underspend: TrendingDown,
  overspend: TrendingUp,
}

const TONE: Record<Severity, string> = {
  high: 'border-danger-200 bg-danger-50 text-danger-600',
  medium: 'border-marigold-200 bg-marigold-50 text-marigold-700',
  low: 'border-sandal-300 bg-sandal-50 text-stone-600',
}

/**
 * The recurring-event budget review.
 *
 * Every amount it offers is arithmetic on what earlier editions actually paid,
 * and the figures behind each one are printed beside it. Nothing is applied
 * until someone presses the button.
 */
export function BudgetAgentPanel({
  event,
  draft,
  editable,
  onUseAmount,
  onAddLine,
}: {
  event: EventRecord
  draft: DraftLine[]
  editable: boolean
  /** Put this amount in an existing line's Requested box. */
  onUseAmount: (category: string, amount: number) => void
  /** Add a cost line that is missing, at this amount. */
  onAddLine: (category: string, amount: number) => void
}) {
  const db = useDb()
  const advice = useMemo(() => analyseBudget(db, event, draft), [db, event, draft])

  if (!advice.recurring) return null

  const apply = (f: BudgetFinding) => {
    if (f.suggestedAmount === undefined) return
    if (f.kind === 'missing_line') onAddLine(f.category, f.suggestedAmount)
    else onUseAmount(f.category, f.suggestedAmount)
  }

  return (
    <Card padded={false}>
      <div className="flex flex-wrap items-start justify-between gap-3 border-b border-sandal-200 p-5">
        <div>
          <h2 className="flex items-center gap-2 font-display text-[18px] text-stone-900">
            <Sparkles className="size-4 text-turmeric-500" aria-hidden />
            Recurring event review
          </h2>
          <p className="mt-1 max-w-2xl text-[13px] text-stone-500">{advice.summary}</p>
        </div>
        <span className="rounded-full border border-sandal-300 px-2.5 py-0.5 text-[11px] text-stone-500">
          {advice.years.join(' · ')}
        </span>
      </div>

      {advice.findings.length === 0 ? (
        <p className="flex items-center gap-2 px-5 py-4 text-[13px] text-tulsi-700">
          <Check className="size-4" aria-hidden />
          No gaps found against the earlier figures.
        </p>
      ) : (
        <ul className="flex flex-col divide-y divide-sandal-200">
          {advice.findings.map((f) => {
            const Icon = ICON[f.kind]
            return (
              <li key={f.id} className="flex flex-wrap items-start gap-4 p-5 sm:flex-nowrap">
                <span className={cn('mt-0.5 shrink-0 rounded-lg border p-1.5', TONE[f.severity])}>
                  <Icon className="size-4" aria-hidden />
                </span>

                <div className="min-w-0 flex-1">
                  <p className="text-[15px] font-medium text-stone-900">{f.headline}</p>
                  <p className="mt-1 text-[13px] leading-relaxed text-stone-600">{f.detail}</p>

                  <ul className="mt-2 flex flex-wrap gap-x-4 gap-y-1 font-mono text-[12px] text-stone-500 tabular-nums">
                    {f.evidence.map((e) => (
                      <li key={e.year}>
                        {e.year} ·{' '}
                        {e.budget !== undefined ? (
                          <>
                            budget <Money value={e.budget} /> → spent <Money value={e.spent} />
                          </>
                        ) : (
                          <>
                            spent <Money value={e.spent} />
                          </>
                        )}
                      </li>
                    ))}
                  </ul>
                </div>

                {f.action && f.suggestedAmount !== undefined ? (
                  <Button
                    size="sm"
                    variant="secondary"
                    className="shrink-0"
                    disabled={!editable}
                    title={editable ? undefined : 'The budget is locked at this stage.'}
                    onClick={() => apply(f)}
                  >
                    {f.action}
                  </Button>
                ) : null}
              </li>
            )
          })}
        </ul>
      )}

      <p className="border-t border-sandal-200 px-5 py-3 text-[12px] text-stone-500">
        Amounts come from what earlier editions actually paid, never from a guess. Nothing changes until you apply it.
      </p>
    </Card>
  )
}
