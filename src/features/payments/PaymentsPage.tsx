import { useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { MessageSquarePlus, Search, TriangleAlert } from 'lucide-react'

import { approvalTierLabel } from '@/config'
import { formatDate, formatDue, formatMoney } from '@/lib/format'
import { Button } from '@/components/ui/Button'
import { Drawer } from '@/components/ui/Drawer'
import { EmptyState } from '@/components/ui/EmptyState'
import { Input, Textarea } from '@/components/ui/Input'
import { Money } from '@/components/ui/Money'
import { Stat } from '@/components/ui/Stat'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { Table, type Column } from '@/components/ui/Table'
import { TableSkeleton } from '@/components/ui/Skeleton'
import { Tabs } from '@/components/ui/Tabs'
import { PageHeader } from '@/components/layout/PageHeader'
import { SectorChip } from '@/components/layout/PhaseChip'
import { ApprovalTimeline } from '@/components/flow/ApprovalTimeline'
import { MakerCheckerNote } from '@/components/flow/MakerCheckerNote'
import { approvalBlock, threeWayMatch, useDb } from '@/store/db'
import { currentUser, useSession } from '@/store/session'
import { inSector } from '@/store/selectors'
import type { SupplierInvoice } from '@/types'
import { ThreeWayMatch } from './ThreeWayMatch'

export function PaymentsPage() {
  const db = useDb()
  const filter = useSession((s) => s.sectorFilter)
  const personaId = useSession((s) => s.personaId)
  const user = currentUser(personaId)
  const decidePayment = useDb((s) => s.decidePayment)
  const addCaComment = useDb((s) => s.addCaComment)

  const [params, setParams] = useSearchParams()
  const [tab, setTab] = useState('open')
  const [query, setQuery] = useState('')
  const [comment, setComment] = useState('')
  const [caNote, setCaNote] = useState('')

  const all = useMemo(() => inSector(db.invoices, filter), [db.invoices, filter])
  const open = all.filter((i) => ['received', 'matched', 'variance', 'payment_pending'].includes(i.status))
  const settled = all.filter((i) => ['paid', 'rejected'].includes(i.status))

  const rows = useMemo(() => {
    const source = tab === 'open' ? open : settled
    const q = query.trim().toLowerCase()
    if (q === '') return source
    return source.filter((inv) => {
      const supplier = db.suppliers.find((s) => s.id === inv.supplierId)?.name.toLowerCase() ?? ''
      return inv.invoiceNo.toLowerCase().includes(q) || supplier.includes(q)
    })
  }, [tab, open, settled, query, db.suppliers])

  const focusId = params.get('focus')
  const focused = db.invoices.find((i) => i.id === focusId)
  const focusPo = focused ? db.purchaseOrders.find((p) => p.id === focused.poId) : undefined
  const focusGrns = focusPo ? db.goodsReceipts.filter((g) => g.poId === focusPo.id) : []
  const match = focusPo ? threeWayMatch(focusPo, focusGrns, focused) : null
  const block = focused ? approvalBlock(user, focused.preparedBy, focused.total, focused.approvals) : null
  const blockedByVariance = Boolean(match?.flagged && !focused?.caComment)

  const columns: Column<SupplierInvoice>[] = [
    {
      key: 'invoiceNo',
      header: 'Invoice',
      primary: true,
      cell: (i) => <span className="font-mono text-[13px] text-stone-900 tabular-nums">{i.invoiceNo}</span>,
    },
    {
      key: 'supplier',
      header: 'Supplier',
      cell: (i) => db.suppliers.find((s) => s.id === i.supplierId)?.name ?? '—',
    },
    {
      key: 'po',
      header: 'Against PO',
      hideOnMobile: true,
      cell: (i) => (
        <span className="font-mono text-[13px] tabular-nums">
          {db.purchaseOrders.find((p) => p.id === i.poId)?.poNo ?? '—'}
        </span>
      ),
    },
    { key: 'sector', header: 'Sector', cell: (i) => <SectorChip sectorId={i.sectorId} /> },
    {
      key: 'due',
      header: 'Due',
      cell: (i) => {
        const due = formatDue(i.dueDate)
        return (
          <span className={due.overdue && i.status !== 'paid' ? 'text-danger-600' : 'text-stone-700'}>
            {formatDate(i.dueDate)}
          </span>
        )
      },
    },
    { key: 'status', header: 'Status', cell: (i) => <StatusBadge status={i.status} /> },
    { key: 'total', header: 'Total', align: 'right', primary: true, cell: (i) => <Money value={i.total} /> },
  ]

  const openValue = open.reduce((s, i) => s + i.total, 0)
  const variances = open.filter((i) => i.status === 'variance').length

  return (
    <div>
      <PageHeader
        phase="spend"
        title="Payments"
        description="Supplier invoices matched against the order and the goods receipt. Nothing is paid on one person's say-so."
      >
        <div className="flex flex-col gap-3">
          <Tabs
            value={tab}
            onChange={setTab}
            items={[
              { id: 'open', label: 'Open', count: open.length },
              { id: 'settled', label: 'Settled', count: settled.length },
            ]}
          />
          <Input
            aria-label="Search invoices"
            placeholder="Search invoice number or supplier"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            leading={<Search className="size-4" aria-hidden />}
          />
        </div>
      </PageHeader>

      {!db.ready ? (
        <TableSkeleton rows={8} cols={7} />
      ) : (
        <div className="flex flex-col gap-6">
          <div className="grid gap-4 sm:grid-cols-3">
            <Stat label="Open invoices" value={open.length} sub={formatMoney(openValue)} accentClass="bg-marigold-500" />
            <Stat
              label="Price mismatches"
              value={variances}
              sub="blocked until a CA explains them"
              accentClass={variances > 0 ? 'bg-danger-600' : 'bg-tulsi-500'}
              icon={<TriangleAlert className="size-4" aria-hidden />}
            />
            <Stat label="Settled" value={settled.length} accentClass="bg-tulsi-500" />
          </div>

          {rows.length === 0 ? (
            <EmptyState
              title={tab === 'open' ? 'No invoices waiting' : 'Nothing settled yet'}
              message={
                tab === 'open'
                  ? 'Every supplier invoice has been dealt with. New ones appear once goods are received and billed.'
                  : 'Paid and rejected invoices will be listed here.'
              }
            />
          ) : (
            <Table
              columns={columns}
              rows={rows}
              rowKey={(i) => i.id}
              onRowClick={(i) => setParams({ focus: i.id })}
              rowClassName={(i) => (i.status === 'variance' ? 'bg-danger-50' : undefined)}
            />
          )}
        </div>
      )}

      <Drawer
        open={Boolean(focused)}
        onClose={() => {
          setParams({})
          setComment('')
          setCaNote('')
        }}
        title={focused?.invoiceNo ?? ''}
        subtitle={
          focused
            ? `${db.suppliers.find((s) => s.id === focused.supplierId)?.name} · due ${formatDate(focused.dueDate)}`
            : undefined
        }
        width="lg"
        footer={
          focused && ['received', 'matched', 'variance', 'payment_pending'].includes(focused.status) ? (
            <div className="flex flex-col gap-3">
              <MakerCheckerNote preparedBy={focused.preparedBy} block={block} />
              {blockedByVariance ? (
                <p className="flex items-start gap-2 rounded-lg border border-danger-50 bg-danger-50 px-3 py-2.5 text-[13px] text-danger-600">
                  <TriangleAlert className="mt-0.5 size-4 shrink-0" aria-hidden />
                  The 3-way match is outside the 2% tolerance. Add a CA comment explaining the difference before
                  this payment can be approved.
                </p>
              ) : null}
              <Textarea
                label="Comment"
                placeholder="Required when rejecting; optional when approving."
                value={comment}
                onChange={(e) => setComment(e.target.value)}
              />
              <div className="flex gap-2">
                <Button
                  fullWidth
                  variant="success"
                  disabled={Boolean(block) || blockedByVariance}
                  title={block ?? (blockedByVariance ? 'A CA comment on the variance is required first.' : undefined)}
                  onClick={() => {
                    decidePayment(focused.id, 'approved', user, comment || undefined)
                    setParams({})
                    setComment('')
                  }}
                >
                  Approve payment
                </Button>
                <Button
                  fullWidth
                  variant="secondary"
                  disabled={comment.trim().length < 5}
                  title={comment.trim().length < 5 ? 'Add a comment explaining the rejection.' : undefined}
                  onClick={() => {
                    decidePayment(focused.id, 'rejected', user, comment)
                    setParams({})
                    setComment('')
                  }}
                >
                  Reject
                </Button>
              </div>
            </div>
          ) : null
        }
      >
        {focused && focusPo && match ? (
          <div className="flex flex-col gap-5">
            <div className="flex flex-wrap items-center gap-2">
              <StatusBadge status={focused.status} />
              <SectorChip sectorId={focused.sectorId} />
              <Link
                to={`/console/purchase-orders/${encodeURIComponent(focusPo.id)}`}
                className="font-mono text-[13px] text-kumkum-700 tabular-nums hover:underline"
              >
                {focusPo.poNo}
              </Link>
            </div>

            <div className="rounded-card border border-sandal-200 bg-sandal-100 p-4">
              <div className="flex items-end justify-between gap-3">
                <div>
                  <p className="text-[11px] font-semibold tracking-[0.12em] text-stone-500 uppercase">Invoice total</p>
                  <Money value={focused.total} className="mt-1 font-display text-[30px] text-stone-900" />
                </div>
                <div className="text-right">
                  <p className="text-[11px] font-semibold tracking-[0.12em] text-stone-500 uppercase">Ordered</p>
                  <Money value={focusPo.total} className="mt-1 text-[18px]" />
                </div>
              </div>
              <p className="mt-2 text-[13px] text-stone-500">Requires {approvalTierLabel(focused.total)}</p>
            </div>

            <section>
              <h3 className="mb-2 text-[11px] font-semibold tracking-[0.12em] text-stone-500 uppercase">3-way match</h3>
              <ThreeWayMatch rows={match.rows} />
              <p className="mt-2 text-[13px] text-stone-500">
                Order, goods receipt and invoice compared line by line. Anything more than 2% apart is flagged.
              </p>
            </section>

            {match.flagged ? (
              <section className="rounded-card border border-danger-50 bg-danger-50 p-4">
                <h3 className="mb-2 flex items-center gap-1.5 text-[13px] font-medium text-danger-600">
                  <TriangleAlert className="size-4" aria-hidden />
                  Variance needs a CA comment
                </h3>
                {focused.caComment ? (
                  <p className="rounded-lg bg-sandal-50 px-3 py-2.5 text-[13px] text-stone-700">{focused.caComment}</p>
                ) : (
                  <div className="flex flex-col gap-2">
                    <Input
                      aria-label="CA comment on the variance"
                      placeholder="e.g. Supplier confirmed a 6% ghee price rise in writing on 2 Oct."
                      value={caNote}
                      onChange={(e) => setCaNote(e.target.value)}
                    />
                    <Button
                      size="sm"
                      icon={<MessageSquarePlus className="size-4" aria-hidden />}
                      disabled={caNote.trim().length < 10}
                      onClick={() => {
                        addCaComment(focused.id, caNote.trim(), user)
                        setCaNote('')
                      }}
                    >
                      Save comment
                    </Button>
                  </div>
                )}
              </section>
            ) : null}

            <ApprovalTimeline steps={focused.approvals} amount={focused.total} />
          </div>
        ) : null}
      </Drawer>
    </div>
  )
}
