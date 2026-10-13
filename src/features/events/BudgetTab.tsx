import { useState } from 'react'
import { Plus, RefreshCw, Send, Sparkles, Trash2 } from 'lucide-react'

import { formatMoney } from '@/lib/format'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Input } from '@/components/ui/Input'
import { Money } from '@/components/ui/Money'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { useDb } from '@/store/db'
import { currentUser, useSession } from '@/store/session'
import type { HistoryPoint } from '@/types'
import { BudgetDecisionPanel } from './BudgetDecisionPanel'
import { DEFAULT_CATEGORIES } from './logic/budget'
import { isAdmin, isTrustee } from './logic/stateMachine'
import { toCents, toField, type EventView } from './useEvent'

interface Row {
  key: string
  id?: string
  category: string
  requested: string
  suggested?: number
  note?: string
  history?: HistoryPoint[]
  approved?: number
}

/** Step 2: each cost line pre-filled from past years by formula, with a plain reason. The amount is always a person's decision. */
export function BudgetTab({ view }: { view: EventView }) {
  const { event } = view
  const personaId = useSession((s) => s.personaId)
  const user = currentUser(personaId)
  const suggestBudget = useDb((s) => s.suggestBudget)
  const saveBudgetLines = useDb((s) => s.saveBudgetLines)
  const submitBudget = useDb((s) => s.submitBudget)

  const [rows, setRows] = useState<Row[]>(() => {
    if (view.lines.length > 0) {
      return view.lines.map((l) => ({ key: l.id, id: l.id, category: l.category, requested: toField(l.requestedAmount), suggested: l.suggestedAmount, note: l.suggestionNote, history: l.history, approved: l.approvedAmount }))
    }
    const categories = DEFAULT_CATEGORIES[event.sectorId] ?? []
    return suggestBudget(event.id, categories).map((s) => ({ key: s.category, category: s.category, requested: toField(s.suggested ?? undefined), suggested: s.suggested ?? undefined, note: s.note, history: s.history }))
  })
  const [custom, setCustom] = useState('')
  const [error, setError] = useState<string>()
  const [trusteeAmounts, setTrusteeAmounts] = useState<Record<string, string>>({})

  const editable = event.status === 'draft' && isAdmin(user)
  const showApproved = view.lines.some((l) => l.approvedAmount !== undefined) || event.status === 'budget_ca_ok'
  const trusteeEditing = event.status === 'budget_ca_ok' && isTrustee(user)

  const patch = (key: string, p: Partial<Row>) => {
    setRows((rs) => rs.map((r) => (r.key === key ? { ...r, ...p } : r)))
    setError(undefined)
  }

  const requestedTotal = rows.reduce((s, r) => s + toCents(r.requested || '0'), 0)
  const suggestedTotal = rows.reduce((s, r) => s + (r.suggested ?? 0), 0)
  const unused = (DEFAULT_CATEGORIES[event.sectorId] ?? []).filter((c) => !rows.some((r) => r.category.toLowerCase() === c.toLowerCase()))

  function recalc() {
    const fresh = suggestBudget(event.id, rows.map((r) => r.category))
    setRows((rs) => rs.map((r, i) => ({ ...r, suggested: fresh[i]?.suggested ?? undefined, note: fresh[i]?.note, history: fresh[i]?.history })))
  }

  function addLine(category: string) {
    const name = category.trim()
    if (!name || rows.some((r) => r.category.toLowerCase() === name.toLowerCase())) return
    const s = suggestBudget(event.id, [name])[0]!
    setRows((rs) => [...rs, { key: `n-${name}-${rs.length}`, category: name, requested: toField(s.suggested ?? undefined), suggested: s.suggested ?? undefined, note: s.note, history: s.history }])
    setCustom('')
  }

  const toInputs = () => rows.map((r) => ({ id: r.id, category: r.category, requestedAmount: toCents(r.requested || '0'), suggestedAmount: r.suggested, suggestionNote: r.note, history: r.history }))

  function save(andSubmit: boolean) {
    const saved = saveBudgetLines(event.id, toInputs(), user)
    if (!saved.ok) return setError(saved.error)
    if (andSubmit) {
      const sent = submitBudget(event.id, user)
      if (!sent.ok) setError(sent.error)
    }
  }

  const approvedFor = (r: Row) => (trusteeEditing ? toCents(trusteeAmounts[r.key] ?? toField(r.approved ?? toCents(r.requested || '0'))) : (r.approved ?? 0))
  const approvedMap = Object.fromEntries(rows.filter((r) => r.id).map((r) => [r.id!, approvedFor(r)]))

  return (
    <div className="flex flex-col gap-6">
      <Card padded={false}>
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-sandal-200 p-5">
          <div>
            <h2 className="font-display text-[18px] text-stone-900">Cost lines</h2>
            <p className="mt-1 text-[13px] text-stone-500">
              Amounts are suggested by formula: last year’s spend plus growth, capped at 15%. The reason beside each is plain text. You decide the number.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <StatusBadge status={event.status} />
            {editable ? (
              <Button size="sm" variant="secondary" icon={<RefreshCw className="size-4" aria-hidden />} onClick={recalc}>Recalculate</Button>
            ) : null}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] border-collapse text-[14px]">
            <thead>
              <tr className="bg-sandal-100 text-left text-[11px] font-semibold tracking-[0.1em] text-stone-500 uppercase">
                <th className="px-4 py-3">Cost line</th>
                <th className="px-3 py-3">Past years</th>
                <th className="px-3 py-3 text-right">Suggested</th>
                <th className="px-3 py-3 text-right">Requested</th>
                {showApproved ? <th className="px-3 py-3 text-right">Approved</th> : null}
                {editable ? <th className="w-10" /> : null}
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.key} className="border-t border-sandal-200 align-top">
                  <td className="px-4 py-3">
                    {editable ? (
                      <input aria-label="Cost line" value={r.category} onChange={(e) => patch(r.key, { category: e.target.value })} className="w-full max-w-[240px] rounded-md border border-sandal-300 bg-sandal-50 px-2 py-1.5 text-[14px] text-stone-900 focus-visible:ring-2 focus-visible:ring-turmeric-400 focus-visible:outline-none" />
                    ) : (
                      <span className="text-stone-900">{r.category}</span>
                    )}
                    <p className="mt-1 flex max-w-[300px] items-start gap-1 text-[12px] leading-snug text-stone-500">
                      <Sparkles className="mt-0.5 size-3 shrink-0 text-turmeric-700" aria-hidden />
                      {r.note ?? 'Added by hand.'}
                    </p>
                  </td>
                  <td className="px-3 py-3">
                    {r.history && r.history.length > 0 ? (
                      <ul className="flex flex-col gap-0.5 font-mono text-[12px] text-stone-700 tabular-nums">
                        {r.history.map((h) => (
                          <li key={h.year}>{h.year} · {formatMoney(h.actual)}</li>
                        ))}
                      </ul>
                    ) : (
                      <span className="text-[13px] text-stone-500">None</span>
                    )}
                  </td>
                  <td className="px-3 py-3 text-right">
                    {r.suggested !== undefined ? (
                      <div className="flex flex-col items-end gap-1">
                        <Money value={r.suggested} className="text-turmeric-700" />
                        {editable ? (
                          <button type="button" onClick={() => patch(r.key, { requested: toField(r.suggested) })} className="text-[12px] text-kumkum-700 hover:underline">Use this</button>
                        ) : null}
                      </div>
                    ) : (
                      <span className="text-[13px] text-stone-500">No suggestion</span>
                    )}
                  </td>
                  <td className="px-3 py-3 text-right">
                    {editable ? (
                      <div className="ml-auto w-32">
                        <Input aria-label={`Requested amount for ${r.category}`} inputMode="decimal" leading={<span>$</span>} value={r.requested} onChange={(e) => patch(r.key, { requested: e.target.value })} className="text-right font-mono tabular-nums" />
                      </div>
                    ) : (
                      <Money value={toCents(r.requested || '0')} />
                    )}
                  </td>
                  {showApproved ? (
                    <td className="px-3 py-3 text-right">
                      {trusteeEditing ? (
                        <div className="ml-auto w-32">
                          <Input aria-label={`Approved amount for ${r.category}`} inputMode="decimal" leading={<span>$</span>} value={trusteeAmounts[r.key] ?? toField(r.approved ?? toCents(r.requested || '0'))} onChange={(e) => setTrusteeAmounts((t) => ({ ...t, [r.key]: e.target.value }))} className="text-right font-mono tabular-nums" />
                        </div>
                      ) : r.approved !== undefined ? (
                        <Money value={r.approved} tone="in" />
                      ) : (
                        <span className="text-[13px] text-stone-500">Pending</span>
                      )}
                    </td>
                  ) : null}
                  {editable ? (
                    <td className="px-2 py-3">
                      <button type="button" aria-label={`Remove ${r.category}`} disabled={rows.length <= 1} onClick={() => setRows((rs) => rs.filter((x) => x.key !== r.key))} className="rounded-lg p-1.5 text-stone-500 hover:bg-sandal-100 hover:text-danger-600 disabled:opacity-30">
                        <Trash2 className="size-4" aria-hidden />
                      </button>
                    </td>
                  ) : null}
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="border-t-2 border-turmeric-400/50 bg-sandal-100 font-medium">
                <td className="px-4 py-3 text-stone-900" colSpan={2}>Total</td>
                <td className="px-3 py-3 text-right"><Money value={suggestedTotal} className="text-turmeric-700" /></td>
                <td className="px-3 py-3 text-right"><Money value={requestedTotal} /></td>
                {showApproved ? <td className="px-3 py-3 text-right"><Money value={rows.reduce((s, r) => s + approvedFor(r), 0)} tone="in" /></td> : null}
                {editable ? <td /> : null}
              </tr>
            </tfoot>
          </table>
        </div>

        {editable ? (
          <div className="flex flex-col gap-3 border-t border-sandal-200 p-5">
            <div className="flex flex-wrap items-end gap-2">
              <div className="w-64"><Input aria-label="New cost line" placeholder="Add a cost line" value={custom} onChange={(e) => setCustom(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && addLine(custom)} /></div>
              <Button size="sm" variant="secondary" icon={<Plus className="size-4" aria-hidden />} disabled={!custom.trim()} onClick={() => addLine(custom)}>Add line</Button>
              {unused.map((c) => (
                <button key={c} type="button" onClick={() => addLine(c)} className="rounded-full border border-sandal-300 px-3 py-1 text-[13px] text-stone-700 hover:border-turmeric-400 hover:bg-turmeric-50">+ {c}</button>
              ))}
            </div>
            {error ? <p role="alert" className="text-[13px] text-danger-600">{error}</p> : null}
            <div className="flex flex-wrap gap-2">
              <Button variant="secondary" onClick={() => save(false)}>Save draft</Button>
              <Button icon={<Send className="size-4" aria-hidden />} disabled={requestedTotal <= 0} onClick={() => save(true)}>Submit for CA review</Button>
            </div>
          </div>
        ) : (
          <p className="border-t border-sandal-200 px-5 py-3 text-[13px] text-stone-500">
            {event.status === 'draft' ? 'Only a Sector Admin edits the budget.' : 'The budget is locked while it is reviewed. The approvers see exactly what was sent.'}
          </p>
        )}
      </Card>

      {event.status === 'budget_submitted' || event.status === 'budget_ca_ok' ? <BudgetDecisionPanel view={view} approved={approvedMap} /> : null}
    </div>
  )
}
