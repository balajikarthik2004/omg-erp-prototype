import { useState } from 'react'
import { ArrowRight, CircleCheck, CircleX, Pencil } from 'lucide-react'

import { formatDateTime, formatMoney } from '@/lib/format'
import { Button } from '@/components/ui/Button'
import { Card, CardHeader } from '@/components/ui/Card'
import { Input } from '@/components/ui/Input'
import { Money } from '@/components/ui/Money'
import { MakerCheckerNote } from '@/components/flow/MakerCheckerNote'
import { userName } from '@/mock/seed'
import { useDb } from '@/store/db'
import { currentUser, useSession } from '@/store/session'
import { EditEventDrawer } from './EditEventDrawer'
import { gateBlock } from './logic/rules'
import { isAdmin } from './logic/stateMachine'
import { registrationUrl, type EventView } from './useEvent'

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="grid grid-cols-[130px_1fr] gap-3 py-2.5 text-[14px]">
      <dt className="text-[11px] font-semibold tracking-[0.12em] text-stone-500 uppercase">{label}</dt>
      <dd className="text-stone-900">{children}</dd>
    </div>
  )
}

/** Details, the next thing to do, who decided what, and the money set aside. */
export function OverviewTab({ view, goTo }: { view: EventView; goTo: (tab: string) => void }) {
  const { event, approvals, fund } = view
  const personaId = useSession((s) => s.personaId)
  const user = currentUser(personaId)
  const confirmEvent = useDb((s) => s.confirmEvent)
  const startEvent = useDb((s) => s.startEvent)
  const endEvent = useDb((s) => s.endEvent)
  const general = useDb((s) => s.funds.find((f) => f.sectorId === event.sectorId && f.type === 'unrestricted'))
  const [editing, setEditing] = useState(false)
  const [guest, setGuest] = useState(event.chiefGuest ?? '')
  const [error, setError] = useState<string>()

  const editable = isAdmin(user) && !['closed', 'cancelled'].includes(event.status)
  const lastReject = [...approvals].reverse().find((a) => a.decision === 'rejected')
  const confirmBlock = gateBlock({ ...event, chiefGuest: guest.trim() || event.chiefGuest }, { type: 'CONFIRM_EVENT', fundId: 'x' }, user)

  let next: React.ReactNode = null
  switch (event.status) {
    case 'draft':
      next = (
        <>
          <p className="text-[14px] text-stone-700">Set the cost lines, then send the budget to the CA.</p>
          {lastReject ? (
            <p className="mt-3 rounded-lg border border-danger-50 bg-danger-50 px-3 py-2.5 text-[13px] text-danger-600">
              Sent back by {userName(lastReject.decidedBy ?? '')}: {lastReject.comment}
            </p>
          ) : null}
          <div className="mt-4 flex flex-wrap gap-2">
            <Button icon={<ArrowRight className="size-4" aria-hidden />} onClick={() => goTo('budget')}>Open the budget</Button>
            <Button variant="secondary" onClick={() => goTo('poster')}>Design poster</Button>
          </div>
        </>
      )
      break
    case 'budget_submitted':
    case 'budget_ca_ok':
      next = (
        <>
          <p className="text-[14px] text-stone-700">{event.status === 'budget_submitted' ? 'The budget is with the CA for review.' : 'The CA has reviewed it. A Trustee gives the final approval.'}</p>
          <div className="mt-4 flex flex-wrap gap-2">
            <Button variant="secondary" onClick={() => goTo('budget')}>View the budget</Button>
            <Button variant="secondary" onClick={() => goTo('poster')}>Preview poster</Button>
          </div>
        </>
      )
      break
    case 'budget_approved':
      next = (
        <>
          <p className="text-[14px] text-stone-700">
            The budget is approved. Confirming fixes the date, venue and chief guest, and sets {formatMoney(view.approvedTotal)} aside from {general?.name ?? 'the general fund'}
            {general ? ` (holding ${formatMoney(general.balance)})` : ''}.
          </p>
          {!event.chiefGuest ? (
            <div className="mt-3 max-w-sm">
              <Input label="Chief guest" value={guest} onChange={(e) => { setGuest(e.target.value); setError(undefined) }} placeholder="Required before confirming" />
            </div>
          ) : null}
          {confirmBlock && isAdmin(user) && (event.chiefGuest || guest.trim()) ? <p className="mt-3 text-[13px] text-marigold-500">{confirmBlock}</p> : null}
          {error ? <p role="alert" className="mt-3 text-[13px] text-danger-600">{error}</p> : null}
          <Button
            className="mt-4"
            disabled={!isAdmin(user)}
            title={isAdmin(user) ? undefined : 'Only a Sector Admin confirms an event.'}
            onClick={() => {
              const r = confirmEvent(event.id, user, { chiefGuest: guest })
              if (!r.ok) setError(r.error)
            }}
          >
            Confirm event
          </Button>
        </>
      )
      break
    case 'confirmed':
      next = (
        <>
          <p className="text-[14px] text-stone-700">The event is confirmed and its fund exists. Next, make the poster.</p>
          <Button className="mt-4" icon={<ArrowRight className="size-4" aria-hidden />} onClick={() => goTo('poster')}>Make the poster</Button>
        </>
      )
      break
    case 'poster_pending':
      next = (
        <>
          <p className="text-[14px] text-stone-700">A design is chosen and waits for a different admin to approve it.</p>
          <Button className="mt-4" variant="secondary" onClick={() => goTo('poster')}>Open the poster</Button>
        </>
      )
      break
    case 'published':
      next = (
        <>
          <p className="text-[14px] text-stone-700">The poster is out and registration is open at <span className="font-mono text-[13px]">{registrationUrl(event.id)}</span>.</p>
          <div className="mt-4 flex flex-wrap gap-2">
            <Button variant="secondary" onClick={() => goTo('registrations')}>Tickets and orders</Button>
            <Button disabled={!isAdmin(user)} title={isAdmin(user) ? undefined : 'Only a Sector Admin starts the event.'} onClick={() => startEvent(event.id, user)}>Start event (event day)</Button>
          </div>
        </>
      )
      break
    case 'live':
      next = (
        <>
          <p className="text-[14px] text-stone-700">The event is live. Check-in is open.</p>
          <div className="mt-4 flex flex-wrap gap-2">
            <Button onClick={() => goTo('registrations')}>Open check-in</Button>
            <Button variant="secondary" disabled={!isAdmin(user)} title={isAdmin(user) ? undefined : 'Only a Sector Admin ends the event.'} onClick={() => endEvent(event.id, user)}>End event</Button>
          </div>
        </>
      )
      break
    case 'completed':
      next = (
        <>
          <p className="text-[14px] text-stone-700">The event is over. The CA team reviews the figures and closes it.</p>
          <Button className="mt-4" onClick={() => goTo('pnl')}>Review profit and loss</Button>
        </>
      )
      break
    case 'closed':
      next = <p className="text-[14px] text-stone-700">Closed and locked. The actual spend now guides next year’s budget.</p>
      break
    case 'cancelled':
      next = <p className="text-[14px] text-stone-700">Cancelled. {event.cancelReason}</p>
      break
  }

  return (
    <div className="grid gap-6 xl:grid-cols-[1.2fr_1fr] xl:items-start">
      <Card>
        <CardHeader title="Details" action={editable ? <Button size="sm" variant="secondary" icon={<Pencil className="size-4" aria-hidden />} onClick={() => setEditing(true)}>Edit</Button> : undefined} />
        <dl className="mt-2 divide-y divide-sandal-200">
          <Row label="When">{formatDateTime(event.startAt)} to {formatDateTime(event.endAt)}</Row>
          <Row label="Venue">{event.venue}</Row>
          <Row label="Chief guest">{event.chiefGuest ?? <span className="text-marigold-500">Not fixed yet</span>}</Row>
          <Row label="Contact">{event.contactName} · {event.contactPhone}</Row>
          <Row label="Capacity">{event.capacity ?? 'No limit'}</Row>
          <Row label="Entry">{event.isPaid ? <Money value={event.ticketPrice ?? 0} /> : 'Free'}{event.ticketTaxNote ? <span className="ml-2 text-[13px] text-stone-500">({event.ticketTaxNote})</span> : null}</Row>
          <Row label="Prepared by">{userName(event.createdBy)}</Row>
        </dl>
      </Card>

      <div className="flex flex-col gap-6">
        <Card accentClass="bg-turmeric-500">
          <CardHeader title="What happens next" />
          <div className="mt-3">{next}</div>
          {event.status === 'budget_submitted' || event.status === 'budget_ca_ok' || event.status === 'poster_pending' ? (
            <MakerCheckerNote
              className="mt-4"
              preparedBy={event.lastPreparerId ?? event.createdBy}
              block={gateBlock(event, event.status === 'budget_submitted' ? { type: 'APPROVE_BUDGET_CA' } : event.status === 'budget_ca_ok' ? { type: 'APPROVE_BUDGET_TRUSTEE' } : { type: 'APPROVE_POSTER' }, user)}
            />
          ) : null}
        </Card>

        {fund ? (
          <Card>
            <CardHeader title="Event fund" description={fund.name} />
            <dl className="mt-3 space-y-2 text-[14px]">
              <div className="flex justify-between"><dt className="text-stone-700">Set aside</dt><dd><Money value={view.approvedTotal} /></dd></div>
              <div className="flex justify-between"><dt className="text-stone-700">Income since</dt><dd><Money value={view.pnl.ticketIncome + view.pnl.sponsorIncome + view.pnl.donationIncome} tone="in" /></dd></div>
              <div className="flex justify-between"><dt className="text-stone-700">Paid out</dt><dd><Money value={view.pnl.expenses} tone="out" /></dd></div>
              <div className="flex justify-between border-t border-sandal-200 pt-2"><dt className="font-medium text-stone-900">Balance</dt><dd><Money value={fund.balance} className="font-medium" /></dd></div>
            </dl>
          </Card>
        ) : null}

        {approvals.length > 0 ? (
          <Card>
            <CardHeader title="Decisions" description="Who approved what, and why." />
            <ul className="mt-3 flex flex-col gap-3">
              {approvals.map((a) => {
                const Icon = a.decision === 'rejected' ? CircleX : a.decision ? CircleCheck : null
                const what = a.entityType === 'event_poster' ? 'Poster' : a.step === 1 ? 'Budget, CA review' : 'Budget, Trustee'
                return (
                  <li key={a.id} className="flex items-start gap-3 text-[14px]">
                    {Icon ? <Icon className={a.decision === 'rejected' ? 'mt-0.5 size-4 shrink-0 text-danger-600' : 'mt-0.5 size-4 shrink-0 text-tulsi-700'} aria-hidden /> : <span className="mt-1.5 size-2.5 shrink-0 rounded-full bg-marigold-500" aria-hidden />}
                    <div>
                      <p className="text-stone-900">{what}: {a.decision ? (a.decision === 'approved' ? 'approved' : 'sent back') : 'waiting'}{a.decidedBy ? ` by ${userName(a.decidedBy)}` : ''}</p>
                      {a.comment ? <p className="text-[13px] text-stone-500">{a.comment}</p> : null}
                    </div>
                  </li>
                )
              })}
            </ul>
          </Card>
        ) : null}
      </div>

      {editing ? <EditEventDrawer event={event} open onClose={() => setEditing(false)} /> : null}
    </div>
  )
}
