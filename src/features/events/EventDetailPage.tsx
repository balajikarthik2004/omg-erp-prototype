import { useState } from 'react'
import { Link, useParams, useSearchParams } from 'react-router-dom'
import { ArrowLeft, Ban, Eye } from 'lucide-react'

import { Button } from '@/components/ui/Button'
import { Dialog } from '@/components/ui/Dialog'
import { EmptyState } from '@/components/ui/EmptyState'
import { Skeleton } from '@/components/ui/Skeleton'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { Textarea } from '@/components/ui/Input'
import { Tabs } from '@/components/ui/Tabs'
import { PageHeader } from '@/components/layout/PageHeader'
import { SectorChip } from '@/components/layout/PhaseChip'
import { FlowStepper } from '@/components/flow/FlowStepper'
import { formatDateTime } from '@/lib/format'
import { useDb } from '@/store/db'
import { currentUser, useSession } from '@/store/session'
import { AuditTab } from './AuditTab'
import { BudgetTab } from './BudgetTab'
import { CloseTab } from './CloseTab'
import { EVENT_STEPS, stepIndex } from './logic/rules'
import { gateBlock } from './logic/rules'
import { OverviewTab } from './OverviewTab'
import { PosterTab } from './PosterTab'
import { RegistrationsPanel } from './RegistrationsPanel'
import { CheckInPanel } from './CheckInPanel'
import { IncomePanel } from './IncomePanel'
import { OrdersPanel } from './OrdersPanel'
import { SPEND_STATES } from './logic/rules'
import { useEvent } from './useEvent'

/** One event, from draft to close, with the six steps of the flow across the top. */
export function EventDetailPage() {
  const { eventId } = useParams<{ eventId: string }>()
  const [params, setParams] = useSearchParams()
  const ready = useDb((s) => s.ready)
  const cancelEvent = useDb((s) => s.cancelEvent)
  const personaId = useSession((s) => s.personaId)
  const user = currentUser(personaId)
  const view = useEvent(eventId)
  const [cancelling, setCancelling] = useState(false)
  const [reason, setReason] = useState('')
  const [error, setError] = useState<string>()

  if (!ready) return <Skeleton className="h-96 w-full" />
  if (!view) {
    return (
      <EmptyState title="Event not found" message="It may belong to another customer, or the prototype reloaded." action={<Link to="/console/events"><Button>Back to events</Button></Link>} />
    )
  }

  const { event } = view
  const rawTab = params.get('tab') ?? 'overview'
  const tab = ({ run: 'registrations', close: 'pnl' } as Record<string, string>)[rawTab] ?? rawTab
  const openForBusiness = SPEND_STATES.includes(event.status) || event.status === 'closed'
  const goTo = (id: string) => setParams({ tab: id })
  const cancelBlock = gateBlock(event, { type: 'CANCEL_EVENT', reason: 'x' }, user)

  return (
    <div>
      <PageHeader
        title={event.name}
        description={`${formatDateTime(event.startAt)} · ${event.venue}`}
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <Link to="/console/events"><Button variant="ghost" icon={<ArrowLeft className="size-4" aria-hidden />}>All events</Button></Link>
            <a href={`/register/${event.id}`} target="_blank" rel="noreferrer"><Button variant="secondary" icon={<Eye className="size-4" aria-hidden />}>Preview event</Button></a>
            {!cancelBlock ? <Button variant="secondary" icon={<Ban className="size-4" aria-hidden />} onClick={() => setCancelling(true)}>Cancel event</Button> : null}
          </div>
        }
      >
        <div className="flex flex-wrap items-center gap-2">
          <StatusBadge status={event.status} />
          <SectorChip sectorId={event.sectorId} />
          {event.posterStatus === 'stale' ? <StatusBadge status="stale" /> : null}
        </div>
      </PageHeader>

      <div className="mb-6 rounded-card border border-sandal-200 bg-sandal-50 p-5">
        {event.status === 'cancelled' ? (
          <p className="text-[14px] text-danger-600">Cancelled: {event.cancelReason}</p>
        ) : (
          <FlowStepper steps={EVENT_STEPS.map((s) => ({ id: s.id, label: s.label, hint: s.gate ? `${s.who} · ${s.gate}` : s.who }))} current={stepIndex(event.status)} />
        )}
      </div>

      <Tabs
        className="mb-6"
        value={tab}
        onChange={goTo}
        items={[
          { id: 'overview', label: 'Overview' },
          { id: 'budget', label: 'Budget workspace', count: view.lines.length },
          { id: 'poster', label: 'AI poster studio', count: view.designs.length > 0 ? view.designs.length : undefined },
          { id: 'registrations', label: 'Registrations and QR', count: view.registrations.length },
          { id: 'purchases', label: 'Purchases and sponsors', count: view.orders.length },
          { id: 'pnl', label: 'Event P&L' },
          { id: 'audit', label: 'Audit trail' },
        ]}
      />

      {tab === 'overview' ? <OverviewTab view={view} goTo={goTo} /> : null}
      {tab === 'budget' ? <BudgetTab key={`${event.id}-${event.status}-${view.lines.length}`} view={view} /> : null}
      {tab === 'poster' ? <PosterTab view={view} /> : null}
      {tab === 'registrations' ? (openForBusiness ? <div className="flex flex-col gap-6"><RegistrationsPanel view={view} /><CheckInPanel view={view} /></div> : <EmptyState title="Not open yet" message="Registrations open once the poster is approved." />) : null}
      {tab === 'purchases' ? (openForBusiness ? <div className="flex flex-col gap-6"><OrdersPanel view={view} /><IncomePanel view={view} /></div> : <EmptyState title="Not open yet" message="Orders and sponsors open once the event is confirmed." />) : null}
      {tab === 'pnl' ? <CloseTab view={view} /> : null}
      {tab === 'audit' ? <AuditTab view={view} /> : null}

      <Dialog
        open={cancelling}
        onClose={() => setCancelling(false)}
        title="Cancel this event?"
        description="The event fund goes back to the sector, open orders are cancelled and paid tickets are marked for refund. This cannot be undone."
        footer={
          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setCancelling(false)}>Keep event</Button>
            <Button variant="danger" disabled={reason.trim().length < 5} onClick={() => { const r = cancelEvent(event.id, reason, user); if (r.ok) setCancelling(false); else setError(r.error) }}>Cancel event</Button>
          </div>
        }
      >
        <Textarea label="Reason" value={reason} onChange={(e) => { setReason(e.target.value); setError(undefined) }} />
        {error ? <p role="alert" className="mt-2 text-[13px] text-danger-600">{error}</p> : null}
      </Dialog>
    </div>
  )
}
