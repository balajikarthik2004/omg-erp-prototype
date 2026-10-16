import { useState } from 'react'
import { Link } from 'react-router-dom'
import { ShoppingCart } from 'lucide-react'

import { Button } from '@/components/ui/Button'
import { EmptyState } from '@/components/ui/EmptyState'
import { Skeleton } from '@/components/ui/Skeleton'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { Tabs } from '@/components/ui/Tabs'
import { PageHeader } from '@/components/layout/PageHeader'
import { useDb } from '@/store/db'
import { IncomePanel } from './IncomePanel'
import { OrdersPanel } from './OrdersPanel'
import { SPEND_STATES } from './logic/rules'
import { useEventPicker } from './useEventPicker'

/** Purchases on approved orders, plus sponsors and event donations, for one event at a time. */
export function PurchasesPage() {
  const ready = useDb((s) => s.ready)
  const [part, setPart] = useState('orders')
  const { picker, view, empty } = useEventPicker((e) => SPEND_STATES.includes(e.status) || e.status === 'closed')

  return (
    <div>
      <PageHeader title="Purchases and orders">
        {picker}
      </PageHeader>

      {!ready ? (
        <Skeleton className="h-96 w-full" />
      ) : empty || !view ? (
        <EmptyState icon={<ShoppingCart className="size-6" aria-hidden />} title="No event has money set aside yet" message="Orders open once the budget is approved and the event is confirmed." action={<Link to="/console/events"><Button variant="secondary">See all events</Button></Link>} />
      ) : (
        <div className="flex flex-col gap-6">
          <div className="flex flex-wrap items-center gap-2">
            <StatusBadge status={view.event.status} />
            <Link to={`/console/events/${view.event.id}`} className="text-[13px] text-kumkum-700 hover:underline">Open the workspace</Link>
          </div>
          <Tabs value={part} onChange={setPart} items={[{ id: 'orders', label: 'Purchases and orders', count: view.orders.length }, { id: 'income', label: 'Sponsors and donations', count: view.sponsors.length + view.donations.length }]} />
          {part === 'orders' ? <OrdersPanel key={view.event.id} view={view} /> : <IncomePanel key={view.event.id} view={view} />}
        </div>
      )}
    </div>
  )
}
