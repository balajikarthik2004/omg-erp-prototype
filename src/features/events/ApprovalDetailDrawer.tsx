import { useState } from 'react'
import { Link } from 'react-router-dom'

import { formatDateTime, formatMoney } from '@/lib/format'
import { Drawer } from '@/components/ui/Drawer'
import { Input } from '@/components/ui/Input'
import { Money } from '@/components/ui/Money'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { SectorChip } from '@/components/layout/PhaseChip'
import { userName } from '@/mock/seed'
import { currentUser, useSession } from '@/store/session'
import { BudgetDecisionPanel } from './BudgetDecisionPanel'
import { isTrustee } from './logic/stateMachine'
import { PosterDecisionPanel } from './PosterDecisionPanel'
import { PosterPreview } from './PosterPreview'
import { toCents, toField, useEvent } from './useEvent'

/** Everything an approver needs to decide, without leaving the Approval Center. */
export function ApprovalDetailDrawer({ eventId, kind, onClose }: { eventId: string | undefined; kind: 'event_budget' | 'event_poster'; onClose: () => void }) {
  const view = useEvent(eventId)
  const personaId = useSession((s) => s.personaId)
  const user = currentUser(personaId)
  const [amounts, setAmounts] = useState<Record<string, string>>({})

  const event = view?.event
  const trusteeEditing = Boolean(event && event.status === 'budget_ca_ok' && isTrustee(user))
  const approvedMap = Object.fromEntries((view?.lines ?? []).map((l) => [l.id, toCents(amounts[l.id] ?? toField(l.approvedAmount ?? l.requestedAmount))]))
  const selected = view?.designs.find((d) => d.id === event?.selectedPosterDesignId)

  return (
    <Drawer
      open={Boolean(event)}
      onClose={onClose}
      width="lg"
      title={event ? `${event.name} · ${kind === 'event_poster' ? 'poster' : 'budget'}` : ''}
      subtitle={event ? `${formatDateTime(event.startAt)} · ${event.venue}` : undefined}
    >
      {view && event ? (
        <div className="flex flex-col gap-5">
          <div className="flex flex-wrap items-center gap-2">
            <StatusBadge status={event.status} />
            <SectorChip sectorId={event.sectorId} />
            <Link to={`/console/events/${event.id}`} className="text-[13px] text-kumkum-700 hover:underline">Open the full workspace</Link>
          </div>

          {kind === 'event_budget' ? (
            <>
              <div className="overflow-x-auto rounded-card border border-sandal-200">
                <table className="w-full min-w-[520px] border-collapse text-[14px]">
                  <thead>
                    <tr className="bg-sandal-100 text-left text-[11px] font-semibold tracking-[0.1em] text-stone-500 uppercase">
                      <th className="px-4 py-3">Cost line</th>
                      <th className="px-3 py-3 text-right">Suggested</th>
                      <th className="px-3 py-3 text-right">Requested</th>
                      <th className="px-3 py-3 text-right">Approved</th>
                    </tr>
                  </thead>
                  <tbody>
                    {view.lines.map((l) => (
                      <tr key={l.id} className="border-t border-sandal-200 align-top">
                        <td className="px-4 py-3">
                          <p className="text-stone-900">{l.category}</p>
                          <p className="text-[12px] text-stone-500">{l.history && l.history.length > 0 ? l.history.map((h) => `${h.year}: ${formatMoney(h.actual)}`).join(' · ') : 'No past events'}</p>
                        </td>
                        <td className="px-3 py-3 text-right">{l.suggestedAmount !== undefined ? <Money value={l.suggestedAmount} className="text-turmeric-700" /> : <span className="text-[13px] text-stone-500">None</span>}</td>
                        <td className="px-3 py-3 text-right"><Money value={l.requestedAmount} /></td>
                        <td className="px-3 py-3 text-right">
                          {trusteeEditing ? (
                            <div className="ml-auto w-28"><Input aria-label={`Approved amount for ${l.category}`} inputMode="decimal" leading={<span>$</span>} value={amounts[l.id] ?? toField(l.approvedAmount ?? l.requestedAmount)} onChange={(e) => setAmounts((a) => ({ ...a, [l.id]: e.target.value }))} className="text-right font-mono tabular-nums" /></div>
                          ) : l.approvedAmount !== undefined ? <Money value={l.approvedAmount} tone="in" /> : <span className="text-[13px] text-stone-500">Pending</span>}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="border-t-2 border-turmeric-400/50 bg-sandal-100 font-medium">
                      <td className="px-4 py-3 text-stone-900">Total</td>
                      <td className="px-3 py-3 text-right"><Money value={view.lines.reduce((s, l) => s + (l.suggestedAmount ?? 0), 0)} className="text-turmeric-700" /></td>
                      <td className="px-3 py-3 text-right"><Money value={view.requestedTotal} /></td>
                      <td className="px-3 py-3 text-right">{trusteeEditing ? <Money value={Object.values(approvedMap).reduce((s, v) => s + v, 0)} tone="in" /> : view.approvedTotal > 0 ? <Money value={view.approvedTotal} tone="in" /> : '—'}</td>
                    </tr>
                  </tfoot>
                </table>
              </div>
              {event.status === 'budget_submitted' || event.status === 'budget_ca_ok' ? (
                <BudgetDecisionPanel view={view} approved={approvedMap} />
              ) : (
                <p className="rounded-lg bg-sandal-100 px-3 py-2.5 text-[14px] text-stone-700">This budget is no longer waiting for a decision. It is {event.status.replace(/_/g, ' ')}.</p>
              )}
            </>
          ) : selected ? (
            <>
              <div className="mx-auto w-full max-w-[360px]"><PosterPreview event={event} design={selected} organisation={view.organisation} /></div>
              <p className="text-[13px] text-stone-500">Chosen by {userName(event.lastPreparerId ?? selected.createdBy)}. Every word on it comes from the event record.</p>
              {event.status === 'poster_pending' ? <PosterDecisionPanel view={view} /> : <p className="rounded-lg bg-sandal-100 px-3 py-2.5 text-[14px] text-stone-700">This poster is no longer waiting for a decision. The event is {event.status.replace(/_/g, ' ')}.</p>}
            </>
          ) : null}
        </div>
      ) : null}
    </Drawer>
  )
}
