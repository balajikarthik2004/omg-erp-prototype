import { useState } from 'react'
import { ShoppingCart } from 'lucide-react'

import { formatMoneyShort } from '@/lib/format'
import { Button } from '@/components/ui/Button'
import { Card, CardHeader } from '@/components/ui/Card'
import { Dialog } from '@/components/ui/Dialog'
import { EmptyState } from '@/components/ui/EmptyState'
import { Input, Textarea } from '@/components/ui/Input'
import { Money } from '@/components/ui/Money'
import { Select } from '@/components/ui/Select'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { Table, type Column } from '@/components/ui/Table'
import { userName } from '@/mock/seed'
import { useDb } from '@/store/db'
import { currentUser, useSession } from '@/store/session'
import type { EventOrder } from '@/types'
import { committedOnLine, lineLimit, orderDecideBlock, orderPayBlock, orderRaiseBlock } from './logic/rules'
import { toCents, type EventView } from './useEvent'

/**
 * Purchases for the event, against its approved budget lines. An admin raises, the CA approves (a different
 * person), and a CA pays. An order that would push a line over its limit is refused at both steps.
 */
export function OrdersPanel({ view }: { view: EventView }) {
  const { event, lines, orders } = view
  const personaId = useSession((s) => s.personaId)
  const user = currentUser(personaId)
  const raiseOrder = useDb((s) => s.raiseOrder)
  const decideOrder = useDb((s) => s.decideOrder)
  const payOrder = useDb((s) => s.payOrder)
  const [f, setF] = useState({ lineId: '', vendor: '', item: '', amount: '' })
  const [error, setError] = useState<string>()
  const [rejecting, setRejecting] = useState<EventOrder>()
  const [reason, setReason] = useState('')
  const [rowError, setRowError] = useState<string>()

  const raiseBlock = orderRaiseBlock(user, event)
  const lineId = f.lineId || lines[0]?.id || ''
  const lineName = (id: string) => lines.find((l) => l.id === id)?.category ?? '—'
  const left = (id: string) => {
    const l = lines.find((x) => x.id === id)
    return l ? lineLimit(l) - committedOnLine(orders, id) : 0
  }

  const columns: Column<EventOrder>[] = [
    { key: 'vendor', header: 'Order', primary: true, cell: (o) => (<div><p className="text-stone-900">{o.vendorName}</p><p className="text-[13px] text-stone-500">{o.itemDescription}</p></div>) },
    { key: 'line', header: 'Budget line', hideOnMobile: true, cell: (o) => lineName(o.budgetLineId) },
    { key: 'by', header: 'Raised by', hideOnMobile: true, cell: (o) => userName(o.preparedBy) },
    { key: 'status', header: 'Status', cell: (o) => <StatusBadge status={o.status} /> },
    { key: 'amount', header: 'Amount', align: 'right', primary: true, cell: (o) => <Money value={o.amount} /> },
    {
      key: 'act',
      header: '',
      align: 'right',
      cell: (o) => {
        if (o.status === 'pending_ca') {
          const block = orderDecideBlock(user, o)
          return (
            <span className="flex justify-end gap-2" onClick={(e) => e.stopPropagation()}>
              <Button size="sm" variant="success" disabled={Boolean(block)} title={block ?? undefined} onClick={() => { const r = decideOrder(event.id, o.id, 'approved', user); setRowError(r.ok ? undefined : r.error) }}>Approve</Button>
              <Button size="sm" variant="secondary" disabled={Boolean(block)} title={block ?? undefined} onClick={() => { setRejecting(o); setReason('') }}>Reject</Button>
            </span>
          )
        }
        if (o.status === 'approved') {
          const block = orderPayBlock(user, o)
          return (
            <span className="flex justify-end" onClick={(e) => e.stopPropagation()}>
              <Button size="sm" disabled={Boolean(block)} title={block ?? undefined} onClick={() => { const r = payOrder(event.id, o.id, user); setRowError(r.ok ? undefined : r.error) }}>Pay</Button>
            </span>
          )
        }
        return null
      },
    },
  ]

  return (
    <div className="flex flex-col gap-6">
      <Card padded={false}>
        <div className="border-b border-sandal-200 p-5">
          <h2 className="font-display text-[18px] text-stone-900">Budget lines</h2>
          <p className="mt-1 text-[13px] text-stone-500">What is left on each line decides what can be ordered.</p>
        </div>
        <ul className="grid gap-x-8 divide-y divide-sandal-200 px-5 sm:grid-cols-2 sm:divide-y-0">
          {lines.map((l) => {
            const remaining = left(l.id)
            return (
              <li key={l.id} className="flex items-center justify-between gap-3 py-2.5 text-[14px] sm:border-b sm:border-sandal-200">
                <span className="text-stone-900">{l.category}</span>
                <span className="font-mono text-[13px] tabular-nums text-stone-700">{formatMoneyShort(remaining)} left of {formatMoneyShort(lineLimit(l))}</span>
              </li>
            )
          })}
        </ul>
      </Card>

      {orders.length === 0 ? (
        <EmptyState icon={<ShoppingCart className="size-6" aria-hidden />} title="No orders yet" message="Raise an order below. The CA approves it before anything is bought." />
      ) : (
        <Table columns={columns} rows={orders} rowKey={(o) => o.id} />
      )}
      {rowError ? <p role="alert" className="text-[13px] text-danger-600">{rowError}</p> : null}

      <Card>
        <CardHeader title="Raise an order" description="Goes to the CA for approval. It cannot exceed what is left on the line." />
        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Select label="Budget line" value={lineId} onChange={(e) => setF({ ...f, lineId: e.target.value })} options={lines.map((l) => ({ value: l.id, label: `${l.category} (${formatMoneyShort(left(l.id))} left)` }))} />
          <Input label="Vendor" value={f.vendor} onChange={(e) => setF({ ...f, vendor: e.target.value })} />
          <Input label="What for" value={f.item} onChange={(e) => setF({ ...f, item: e.target.value })} />
          <Input label="Amount" inputMode="decimal" leading={<span>$</span>} value={f.amount} onChange={(e) => { setF({ ...f, amount: e.target.value }); setError(undefined) }} className="font-mono tabular-nums" />
        </div>
        {raiseBlock ? <p className="mt-2 text-[13px] text-marigold-500">{raiseBlock}</p> : null}
        {error ? <p role="alert" className="mt-2 text-[13px] text-danger-600">{error}</p> : null}
        <Button className="mt-3" disabled={Boolean(raiseBlock)} onClick={() => {
          const r = raiseOrder(event.id, { budgetLineId: lineId, vendorName: f.vendor, itemDescription: f.item, amount: toCents(f.amount) }, user)
          if (!r.ok) setError(r.error)
          else setF({ lineId: '', vendor: '', item: '', amount: '' })
        }}>Raise order</Button>
      </Card>

      <Dialog open={Boolean(rejecting)} onClose={() => setRejecting(undefined)} title="Reject this order" description={rejecting ? `${rejecting.vendorName}, ${formatMoneyShort(rejecting.amount)}` : undefined}
        footer={<div className="flex justify-end gap-2"><Button variant="ghost" onClick={() => setRejecting(undefined)}>Cancel</Button><Button variant="danger" disabled={reason.trim().length < 5} onClick={() => { const r = decideOrder(event.id, rejecting!.id, 'rejected', user, reason); setRowError(r.ok ? undefined : r.error); setRejecting(undefined) }}>Reject order</Button></div>}>
        <Textarea label="Why" value={reason} onChange={(e) => setReason(e.target.value)} />
      </Dialog>
    </div>
  )
}
