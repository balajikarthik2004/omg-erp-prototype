import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Ticket } from 'lucide-react'

import { Button } from '@/components/ui/Button'
import { EmptyState } from '@/components/ui/EmptyState'
import { Skeleton } from '@/components/ui/Skeleton'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { Tabs } from '@/components/ui/Tabs'
import { PageHeader } from '@/components/layout/PageHeader'
import { useDb } from '@/store/db'
import { CheckInPanel } from './CheckInPanel'
import { RegistrationsPanel } from './RegistrationsPanel'
import { useEventPicker } from './useEventPicker'

/** Tickets, QR codes and the check-in desk for one event at a time. */
export function RegistrationsPage() {
  const ready = useDb((s) => s.ready)
  const [part, setPart] = useState('tickets')
  const { picker, view, empty } = useEventPicker((e) => ['published', 'live', 'completed', 'closed'].includes(e.status))

  return (
    <div>
      <PageHeader phase="collect" title="Registrations and QR" description="Who has tickets, the signed QR on each ticket, and the check-in desk for event day. Registration opens once the poster is approved.">
        {picker}
      </PageHeader>

      {!ready ? (
        <Skeleton className="h-96 w-full" />
      ) : empty || !view ? (
        <EmptyState icon={<Ticket className="size-6" aria-hidden />} title="No event is open for registration" message="An event opens for registration once its poster is approved." action={<Link to="/console/events"><Button variant="secondary">See all events</Button></Link>} />
      ) : (
        <div className="flex flex-col gap-6">
          <div className="flex flex-wrap items-center gap-2">
            <StatusBadge status={view.event.status} />
            <Link to={`/console/events/${view.event.id}`} className="text-[13px] text-kumkum-700 hover:underline">Open the workspace</Link>
          </div>
          <Tabs value={part} onChange={setPart} items={[{ id: 'tickets', label: 'Registrations', count: view.registrations.length }, { id: 'checkin', label: 'Check-in' }]} />
          {part === 'tickets' ? <RegistrationsPanel key={view.event.id} view={view} /> : <CheckInPanel key={view.event.id} view={view} />}
        </div>
      )}
    </div>
  )
}
