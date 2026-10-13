import { useState } from 'react'

import { EmptyState } from '@/components/ui/EmptyState'
import { Tabs } from '@/components/ui/Tabs'
import { CalendarClock } from 'lucide-react'
import { CheckInPanel } from './CheckInPanel'
import { IncomePanel } from './IncomePanel'
import { OrdersPanel } from './OrdersPanel'
import { RegistrationsPanel } from './RegistrationsPanel'
import { SPEND_STATES } from './logic/rules'
import type { EventView } from './useEvent'

/** Step 5: run the event. Registrations and tickets, check-in, sponsors and donations, and purchases on approved orders. */
export function RunTab({ view }: { view: EventView }) {
  const { event } = view
  const [part, setPart] = useState('tickets')

  if (!SPEND_STATES.includes(event.status) && event.status !== 'closed') {
    return (
      <EmptyState
        icon={<CalendarClock className="size-6" aria-hidden />}
        title="Not open yet"
        message="Tickets, sponsors and orders open once the budget is approved and the event is confirmed."
      />
    )
  }

  return (
    <div className="flex flex-col gap-6">
      <Tabs
        value={part}
        onChange={setPart}
        items={[
          { id: 'tickets', label: 'Tickets', count: view.registrations.length },
          { id: 'checkin', label: 'Check-in' },
          { id: 'income', label: 'Sponsors and donations', count: view.sponsors.length + view.donations.length },
          { id: 'orders', label: 'Orders', count: view.orders.length },
        ]}
      />
      {part === 'tickets' ? <RegistrationsPanel view={view} /> : null}
      {part === 'checkin' ? <CheckInPanel view={view} /> : null}
      {part === 'income' ? <IncomePanel view={view} /> : null}
      {part === 'orders' ? <OrdersPanel view={view} /> : null}
    </div>
  )
}
