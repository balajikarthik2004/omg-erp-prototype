import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { ArrowLeft, PackageCheck, Send, Sparkles, TriangleAlert, XCircle } from 'lucide-react'

import { approvalTierLabel } from '@/config'
import { formatDate, formatDateTime, formatMoney } from '@/lib/format'
import { Button } from '@/components/ui/Button'
import { Card, CardHeader } from '@/components/ui/Card'
import { Dialog } from '@/components/ui/Dialog'
import { EmptyState } from '@/components/ui/EmptyState'
import { Input, Textarea } from '@/components/ui/Input'
import { Money } from '@/components/ui/Money'
import { Skeleton } from '@/components/ui/Skeleton'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { PageHeader } from '@/components/layout/PageHeader'
import { SectorChip } from '@/components/layout/PhaseChip'
import { ApprovalTimeline, EventTimeline } from '@/components/flow/ApprovalTimeline'
import { BudgetBar } from '@/components/flow/BudgetBar'
import { MakerCheckerNote } from '@/components/flow/MakerCheckerNote'
import { approvalBlock, available, useDb } from '@/store/db'
import { currentUser, useSession } from '@/store/session'
import { userName } from '@/mock/seed'

export function PurchaseOrderDetailPage() {
  const { poId } = useParams<{ poId: string }>()
  const db = useDb()
  const personaId = useSession((s) => s.personaId)
  const user = currentUser(personaId)

  const decidePurchaseOrder = useDb((s) => s.decidePurchaseOrder)
  const sendPurchaseOrder = useDb((s) => s.sendPurchaseOrder)
  const cancelPurchaseOrder = useDb((s) => s.cancelPurchaseOrder)
  const receiveGoods = useDb((s) => s.receiveGoods)
  const recordInvoice = useDb((s) => s.recordInvoice)

  const [comment, setComment] = useState('')
  const [cancelling, setCancelling] = useState(false)
  const [cancelReason, setCancelReason] = useState('')
  const [receiving, setReceiving] = useState(false)
  const [receiptQty, setReceiptQty] = useState<Record<string, string>>({})
  const [invoicing, setInvoicing] = useState(false)
  const [invoiceNo, setInvoiceNo] = useState('')

  const po = db.purchaseOrders.find((p) => p.id === poId)

  if (!db.ready) return <Skeleton className="h-96 w-full" />

  if (!po) {
    return (
      <EmptyState
        title="Purchase order not found"
        message="This order is not in the current data set. It may have been generated in an earlier session."
        action={
          <Link to="/console/purchase-orders">
            <Button>Back to purchase orders</Button>
          </Link>
        }
      />
    )
  }

  const supplier = db.suppliers.find((s) => s.id === po.supplierId)
  const head = db.budgets.find((b) => b.id === po.budgetHeadId)
  const grns = db.goodsReceipts.filter((g) => g.poId === po.id)
  const invoice = db.invoices.find((i) => i.poId === po.id)
  const block = approvalBlock(user, po.preparedBy, po.total, po.approvals)

  const receivedByItem: Record<string, number> = {}
  for (const grn of grns) {
    for (const line of grn.lines) receivedByItem[line.itemId] = (receivedByItem[line.itemId] ?? 0) + line.qtyReceived
  }

  return (
    <div>
      <Link
        to="/console/purchase-orders"
        className="mb-3 inline-flex items-center gap-1.5 text-[14px] text-stone-500 hover:text-stone-900"
      >
        <ArrowLeft className="size-4" aria-hidden />
        All purchase orders
      </Link>

      <PageHeader
        phase="spend"
        title={po.poNo}
        description={`${supplier?.name ?? 'Supplier'} · raised by ${userName(po.preparedBy)} on ${formatDate(po.createdAt)}`}
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <StatusBadge status={po.status} />
            <SectorChip sectorId={po.sectorId} />
          </div>
        }
      />

      <div className="grid gap-6 xl:grid-cols-[1.5fr_1fr] xl:items-start">
        <div className="flex flex-col gap-6">
          {/* Lines */}
          <Card padded={false}>
            <div className="p-5 pb-0">
              <CardHeader title="Order lines" description={`${po.lines.length} line${po.lines.length === 1 ? '' : 's'}`} />
            </div>
            <div className="scrollbar-thin overflow-x-auto">
              <table className="w-full border-collapse text-[14px]">
                <thead>
                  <tr className="bg-sandal-100">
                    {['Item', 'Ordered', 'Received', 'Unit price', 'Line total'].map((h, i) => (
                      <th
                        key={h}
                        className={`border-y border-sandal-200 px-4 py-2 text-[11px] font-semibold tracking-[0.12em] text-stone-500 uppercase ${i > 0 ? 'text-right' : 'text-left'}`}
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {po.lines.map((line) => {
                    const item = db.inventory.find((i) => i.id === line.itemId)
                    const received = receivedByItem[line.itemId] ?? 0
                    const short = received > 0 && received < line.qty
                    return (
                      <tr key={line.itemId} className="border-b border-sandal-200">
                        <td className="px-4 py-3 text-stone-900">{item?.name ?? line.itemId}</td>
                        <td className="px-4 py-3 text-right font-mono tabular-nums">
                          {line.qty} <span className="text-stone-500">{item?.unit}</span>
                        </td>
                        <td className="px-4 py-3 text-right font-mono tabular-nums">
                          {grns.length === 0 ? (
                            <span className="text-stone-500">—</span>
                          ) : (
                            <span className={short ? 'text-danger-600' : 'text-tulsi-700'}>{received}</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <Money value={line.unitPrice} />
                        </td>
                        <td className="px-4 py-3 text-right">
                          <Money value={line.qty * line.unitPrice} />
                        </td>
                      </tr>
                    )
                  })}
                  <tr className="bg-sandal-100">
                    <td className="px-4 py-3 text-right font-medium text-stone-900" colSpan={4}>
                      Order total
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Money value={po.total} className="text-[18px] font-medium" />
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </Card>

          {/* AI note */}
          {po.aiRank ? (
            <Card accentClass={po.aiRank === 1 ? 'bg-tulsi-500' : 'bg-marigold-500'}>
              <div className="flex items-start gap-3">
                <Sparkles className="mt-0.5 size-4 shrink-0 text-turmeric-700" aria-hidden />
                <div>
                  <p className="text-[14px] font-medium text-stone-900">
                    {po.aiRank === 1
                      ? 'The top-ranked supplier was chosen.'
                      : `Ranked ${po.aiRank} by the supplier model — this is an override.`}
                  </p>
                  {po.overrideReason ? (
                    <p className="mt-1 text-[14px] text-stone-700">{po.overrideReason}</p>
                  ) : po.aiRank !== 1 ? (
                    <p className="mt-1 text-[14px] text-stone-500">No override reason was recorded.</p>
                  ) : null}
                </div>
              </div>
            </Card>
          ) : null}

          {/* Goods receipts */}
          {grns.length > 0 ? (
            <Card>
              <CardHeader title="Goods receipts" description={`${grns.length} receipt${grns.length === 1 ? '' : 's'} against this order`} />
              <ul className="flex flex-col gap-3">
                {grns.map((grn) => (
                  <li key={grn.id} className="rounded-lg border border-sandal-200 p-3">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span className="font-mono text-[14px] text-stone-900 tabular-nums">{grn.grnNo}</span>
                      <span className="text-[13px] text-stone-500">
                        {userName(grn.receivedBy)} · {formatDate(grn.receivedAt)}
                      </span>
                    </div>
                    <ul className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-[13px] text-stone-700">
                      {grn.lines.map((line) => (
                        <li key={line.itemId} className="font-mono tabular-nums">
                          {db.inventory.find((i) => i.id === line.itemId)?.name}: {line.qtyReceived}
                        </li>
                      ))}
                    </ul>
                    {grn.note ? <p className="mt-2 text-[13px] text-marigold-500">{grn.note}</p> : null}
                  </li>
                ))}
              </ul>
            </Card>
          ) : null}

          {/* Lifecycle */}
          <Card>
            <CardHeader title="Lifecycle" description="Everything that has happened to this order." />
            <EventTimeline events={po.timeline} />
          </Card>
        </div>

        {/* Right column */}
        <div className="flex flex-col gap-6">
          <Card accentClass={head && po.total > available(head) ? 'bg-danger-600' : 'bg-tulsi-500'}>
            <CardHeader title="Budget impact" description={head?.name ?? '—'} />
            {head ? (
              <>
                <BudgetBar head={head} />
                <dl className="mt-4 space-y-2 text-[14px]">
                  <div className="flex justify-between">
                    <dt className="text-stone-700">Available now</dt>
                    <dd>
                      <Money value={available(head)} />
                    </dd>
                  </div>
                  <div className="flex justify-between border-t border-sandal-200 pt-2">
                    <dt className="font-medium text-stone-900">
                      {po.status === 'pending_ca' ? 'Available after approval' : 'Order value'}
                    </dt>
                    <dd>
                      <Money
                        value={po.status === 'pending_ca' ? available(head) - po.total : po.total}
                        className="font-medium"
                        tone={po.status === 'pending_ca' && available(head) - po.total < 0 ? 'out' : 'default'}
                      />
                    </dd>
                  </div>
                </dl>
                {po.status === 'pending_ca' && po.total > available(head) ? (
                  <p className="mt-3 flex items-start gap-2 rounded-lg bg-danger-50 px-3 py-2 text-[13px] text-danger-600">
                    <TriangleAlert className="mt-0.5 size-4 shrink-0" aria-hidden />
                    Over budget. Approve a re-allotment to {head.name} before this order can go through.
                  </p>
                ) : null}
              </>
            ) : null}
          </Card>

          {po.approvals.length > 0 ? (
            <Card>
              <ApprovalTimeline steps={po.approvals} amount={po.total} />
            </Card>
          ) : null}

          {/* Actions */}
          <Card>
            <CardHeader title="Actions" description={`This order needs ${approvalTierLabel(po.total)}.`} />

            {po.status === 'pending_ca' ? (
              <div className="flex flex-col gap-3">
                <MakerCheckerNote preparedBy={po.preparedBy} block={block} />
                <Textarea
                  label="Comment"
                  placeholder="Required when rejecting; optional when approving."
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                />
                <div className="flex flex-col gap-2 sm:flex-row">
                  <Button
                    fullWidth
                    variant="success"
                    disabled={Boolean(block)}
                    title={block ?? undefined}
                    onClick={() => {
                      decidePurchaseOrder(po.id, 'approved', user, comment || undefined)
                      setComment('')
                    }}
                  >
                    Approve PO
                  </Button>
                  <Button
                    fullWidth
                    variant="secondary"
                    icon={<XCircle className="size-4" aria-hidden />}
                    disabled={comment.trim().length < 5}
                    title={comment.trim().length < 5 ? 'Add a comment explaining the rejection.' : undefined}
                    onClick={() => {
                      decidePurchaseOrder(po.id, 'rejected', user, comment)
                      setComment('')
                    }}
                  >
                    Reject
                  </Button>
                </div>
              </div>
            ) : po.status === 'approved' ? (
              <Button
                fullWidth
                icon={<Send className="size-4" aria-hidden />}
                onClick={() => sendPurchaseOrder(po.id, user)}
              >
                Send to supplier
              </Button>
            ) : po.status === 'sent' || po.status === 'partially_received' ? (
              <Button
                fullWidth
                icon={<PackageCheck className="size-4" aria-hidden />}
                onClick={() => {
                  setReceiptQty(
                    Object.fromEntries(
                      po.lines.map((l) => [l.itemId, String(Math.max(0, l.qty - (receivedByItem[l.itemId] ?? 0)))]),
                    ),
                  )
                  setReceiving(true)
                }}
              >
                Record goods receipt
              </Button>
            ) : po.status === 'received' ? (
              <Button
                fullWidth
                onClick={() => {
                  setInvoiceNo(`INV-${(supplier?.name ?? 'SUP').slice(0, 3).toUpperCase()}-${Math.floor(Math.random() * 9000 + 1000)}`)
                  setInvoicing(true)
                }}
              >
                Record supplier invoice
              </Button>
            ) : invoice ? (
              <Link to={`/console/payments?focus=${invoice.id}`}>
                <Button fullWidth variant="secondary">
                  Open the payment for {invoice.invoiceNo}
                </Button>
              </Link>
            ) : (
              <p className="text-[14px] text-stone-500">
                No action is open on this order. Its status is {po.status.replace(/_/g, ' ')}.
              </p>
            )}

            {['approved', 'sent', 'pending_ca', 'draft'].includes(po.status) ? (
              <Button
                className="mt-3"
                fullWidth
                variant="ghost"
                onClick={() => setCancelling(true)}
              >
                Cancel this order
              </Button>
            ) : null}
          </Card>
        </div>
      </div>

      {/* Cancel */}
      <Dialog
        open={cancelling}
        onClose={() => setCancelling(false)}
        title={`Cancel ${po.poNo}?`}
        description="Anything committed to the budget head is released straight away."
        footer={
          <div className="flex gap-2">
            <Button
              fullWidth
              variant="danger"
              disabled={cancelReason.trim().length < 5}
              onClick={() => {
                cancelPurchaseOrder(po.id, user, cancelReason)
                setCancelling(false)
                setCancelReason('')
              }}
            >
              Cancel the order
            </Button>
            <Button variant="secondary" onClick={() => setCancelling(false)}>
              Keep it
            </Button>
          </div>
        }
      >
        <Textarea
          label="Reason"
          placeholder="Why is this order being cancelled?"
          value={cancelReason}
          onChange={(e) => setCancelReason(e.target.value)}
        />
      </Dialog>

      {/* Goods receipt */}
      <Dialog
        open={receiving}
        onClose={() => setReceiving(false)}
        title="Record goods receipt"
        description="Enter what actually arrived. Short deliveries are flagged in the 3-way match."
        footer={
          <div className="flex gap-2">
            <Button
              fullWidth
              onClick={() => {
                receiveGoods(
                  po.id,
                  po.lines.map((l) => ({
                    itemId: l.itemId,
                    qtyReceived: (receivedByItem[l.itemId] ?? 0) + (Number(receiptQty[l.itemId]) || 0),
                  })),
                  user,
                )
                setReceiving(false)
              }}
            >
              Record receipt
            </Button>
            <Button variant="secondary" onClick={() => setReceiving(false)}>
              Cancel
            </Button>
          </div>
        }
      >
        <div className="flex flex-col gap-4">
          {po.lines.map((line) => {
            const item = db.inventory.find((i) => i.id === line.itemId)
            const already = receivedByItem[line.itemId] ?? 0
            return (
              <Input
                key={line.itemId}
                label={`${item?.name ?? line.itemId} — ordered ${line.qty} ${item?.unit ?? ''}${already > 0 ? `, already received ${already}` : ''}`}
                inputMode="numeric"
                value={receiptQty[line.itemId] ?? ''}
                onChange={(e) => setReceiptQty({ ...receiptQty, [line.itemId]: e.target.value.replace(/[^0-9]/g, '') })}
                className="font-mono tabular-nums"
              />
            )
          })}
        </div>
      </Dialog>

      {/* Invoice */}
      <Dialog
        open={invoicing}
        onClose={() => setInvoicing(false)}
        title="Record supplier invoice"
        description="The invoice is matched against the order and the goods receipt before any payment is approved."
        footer={
          <div className="flex gap-2">
            <Button
              fullWidth
              disabled={invoiceNo.trim().length < 4}
              onClick={() => {
                recordInvoice(po.id, po.lines, invoiceNo.trim(), user)
                setInvoicing(false)
              }}
            >
              Record invoice
            </Button>
            <Button variant="secondary" onClick={() => setInvoicing(false)}>
              Cancel
            </Button>
          </div>
        }
      >
        <div className="flex flex-col gap-4">
          <Input
            label="Invoice number"
            value={invoiceNo}
            onChange={(e) => setInvoiceNo(e.target.value)}
            className="font-mono tabular-nums"
          />
          <p className="rounded-lg bg-sandal-100 px-3 py-2.5 text-[13px] text-stone-700">
            The invoice is recorded at the ordered quantities and prices, totalling{' '}
            <span className="font-mono tabular-nums">{formatMoney(po.total)}</span>. Any difference the supplier
            actually bills would show up in the 3-way match on the payments page.
          </p>
        </div>
      </Dialog>

      <p className="mt-6 text-[13px] text-stone-500">
        Last updated {formatDateTime(po.timeline.at(-1)?.at ?? po.createdAt)}
      </p>
    </div>
  )
}
