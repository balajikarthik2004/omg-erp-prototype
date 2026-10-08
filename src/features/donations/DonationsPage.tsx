import { useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Download, Search } from 'lucide-react'

import { formatDate, formatDateTime, formatMoney, titleCase } from '@/lib/format'
import { Button } from '@/components/ui/Button'
import { Drawer } from '@/components/ui/Drawer'
import { EmptyState } from '@/components/ui/EmptyState'
import { Input } from '@/components/ui/Input'
import { Money } from '@/components/ui/Money'
import { Select } from '@/components/ui/Select'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { Table, type Column } from '@/components/ui/Table'
import { TableSkeleton } from '@/components/ui/Skeleton'
import { toast } from '@/lib/toast'
import { PageHeader } from '@/components/layout/PageHeader'
import { SectorChip } from '@/components/layout/PhaseChip'
import { CATALOG, FUNDS } from '@/mock/seed'
import { useDb } from '@/store/db'
import { useSession } from '@/store/session'
import { donorName, inSector } from '@/store/selectors'
import type { Donation } from '@/types'

const PAGE_SIZE = 25

export function DonationsPage() {
  const db = useDb()
  const filter = useSession((s) => s.sectorFilter)
  const [params, setParams] = useSearchParams()

  const [query, setQuery] = useState('')
  const [status, setStatus] = useState('all')
  const [method, setMethod] = useState('all')
  const [page, setPage] = useState(0)

  const focusId = params.get('focus')
  const focused = db.donations.find((d) => d.id === focusId)

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase()
    return inSector(db.donations, filter).filter((d) => {
      if (status !== 'all' && d.status !== status) return false
      if (method !== 'all' && d.method !== method) return false
      if (q === '') return true
      const name = donorName(db, d.donorId).toLowerCase()
      return (
        d.receiptNo.toLowerCase().includes(q) ||
        d.id.toLowerCase().includes(q) ||
        name.includes(q)
      )
    })
  }, [db, filter, query, status, method])

  const total = rows.reduce((sum, d) => sum + (d.status === 'refunded' ? 0 : d.gross), 0)
  const paged = rows.slice(page * PAGE_SIZE, page * PAGE_SIZE + PAGE_SIZE)

  const columns: Column<Donation>[] = [
    {
      key: 'receipt',
      header: 'Receipt',
      primary: true,
      cell: (d) => <span className="font-mono text-[13px] text-stone-900 tabular-nums">{d.receiptNo}</span>,
    },
    {
      key: 'date',
      header: 'Date',
      cell: (d) => <span className="font-mono text-[13px] tabular-nums">{formatDate(d.createdAt)}</span>,
    },
    { key: 'donor', header: 'Donor', cell: (d) => donorName(db, d.donorId) },
    {
      key: 'item',
      header: 'Offering',
      hideOnMobile: true,
      cell: (d) => CATALOG.find((c) => c.id === d.lines[0]?.itemId)?.name ?? '—',
    },
    { key: 'sector', header: 'Sector', cell: (d) => <SectorChip sectorId={d.sectorId} /> },
    { key: 'method', header: 'Method', cell: (d) => <span className="text-[14px]">{titleCase(d.method)}</span> },
    { key: 'status', header: 'Status', cell: (d) => <StatusBadge status={d.disputed ? 'disputed' : d.status} /> },
    { key: 'amount', header: 'Amount', align: 'right', primary: true, cell: (d) => <Money value={d.gross} /> },
  ]

  return (
    <div>
      <PageHeader
        phase="collect"
        title="Donations"
        description={`${rows.length.toLocaleString()} donations · ${formatMoney(total)} received`}
        actions={
          <Button
            variant="secondary"
            icon={<Download className="size-4" aria-hidden />}
            onClick={() => toast.info('Coming in the next build', 'Exports run against the live ledger.')}
          >
            Export
          </Button>
        }
      >
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-[1fr_200px_200px]">
          <Input
            aria-label="Search donations"
            placeholder="Search receipt no., ref. or donor"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value)
              setPage(0)
            }}
            leading={<Search className="size-4" aria-hidden />}
          />
          <Select
            aria-label="Filter by status"
            value={status}
            onChange={(e) => {
              setStatus(e.target.value)
              setPage(0)
            }}
            options={[
              { value: 'all', label: 'All statuses' },
              { value: 'paid', label: 'Paid' },
              { value: 'receipted', label: 'Receipted' },
              { value: 'reconciled', label: 'Reconciled' },
              { value: 'allotted', label: 'Allotted' },
              { value: 'refunded', label: 'Refunded' },
              { value: 'failed', label: 'Failed' },
            ]}
          />
          <Select
            aria-label="Filter by method"
            value={method}
            onChange={(e) => {
              setMethod(e.target.value)
              setPage(0)
            }}
            options={[
              { value: 'all', label: 'All methods' },
              { value: 'card', label: 'Card' },
              { value: 'apple_pay', label: 'Apple Pay' },
              { value: 'google_pay', label: 'Google Pay' },
              { value: 'cash', label: 'Cash' },
              { value: 'cheque', label: 'Cheque' },
            ]}
          />
        </div>
      </PageHeader>

      {!db.ready ? (
        <TableSkeleton rows={10} cols={8} />
      ) : rows.length === 0 ? (
        <EmptyState
          title="No donations match these filters"
          message="Clear the search box or widen the status filter to see more."
          action={
            <Button
              variant="secondary"
              onClick={() => {
                setQuery('')
                setStatus('all')
                setMethod('all')
              }}
            >
              Clear filters
            </Button>
          }
        />
      ) : (
        <>
          <Table
            columns={columns}
            rows={paged}
            rowKey={(d) => d.id}
            onRowClick={(d) => setParams({ focus: d.id })}
            rowClassName={(d) => (d.disputed ? 'bg-danger-50' : undefined)}
          />
          <nav className="mt-4 flex items-center justify-between gap-3" aria-label="Pagination">
            <p className="text-[13px] text-stone-500">
              Showing {page * PAGE_SIZE + 1}–{Math.min(rows.length, (page + 1) * PAGE_SIZE)} of{' '}
              {rows.length.toLocaleString()}
            </p>
            <div className="flex gap-2">
              <Button size="sm" variant="secondary" disabled={page === 0} onClick={() => setPage((p) => p - 1)}>
                Previous
              </Button>
              <Button
                size="sm"
                variant="secondary"
                disabled={(page + 1) * PAGE_SIZE >= rows.length}
                onClick={() => setPage((p) => p + 1)}
              >
                Next
              </Button>
            </div>
          </nav>
        </>
      )}

      <Drawer
        open={Boolean(focused)}
        onClose={() => setParams({})}
        title={focused?.receiptNo ?? ''}
        subtitle={focused ? formatDateTime(focused.createdAt) : undefined}
      >
        {focused ? (
          <div className="flex flex-col gap-5">
            <div className="flex flex-wrap items-center gap-2">
              <StatusBadge status={focused.disputed ? 'disputed' : focused.status} />
              <SectorChip sectorId={focused.sectorId} withTamil />
            </div>

            {focused.disputed ? (
              <div className="rounded-lg border border-danger-50 bg-danger-50 px-3 py-2.5 text-[13px] text-danger-600">
                The card issuer has raised a dispute on this charge. Decide whether to contest it with evidence or
                refund the donor before the deadline.
              </div>
            ) : null}

            <dl className="grid grid-cols-2 gap-x-4 gap-y-3 text-[14px]">
              <Field label="Donation ref." value={<span className="font-mono tabular-nums">{focused.id}</span>} />
              <Field label="Donor" value={donorName(db, focused.donorId)} />
              <Field label="Method" value={titleCase(focused.method)} />
              <Field
                label="Square payment"
                value={<span className="font-mono text-[13px] tabular-nums">{focused.squarePaymentId ?? '—'}</span>}
              />
              <Field label="Fund" value={FUNDS.find((f) => f.id === focused.fundId)?.name ?? '—'} />
            </dl>

            <div className="rounded-card border border-sandal-200 bg-sandal-100 p-4">
              <dl className="space-y-2 text-[14px]">
                <Row label="Gross" value={<Money value={focused.gross} />} />
                <Row label="Processing fee" value={<Money value={focused.fee} tone="muted" />} />
                <Row
                  label="Net to fund"
                  value={<Money value={focused.net} tone="in" className="font-medium" />}
                  strong
                />
              </dl>
            </div>

            <section>
              <h3 className="mb-2 text-[11px] font-semibold tracking-[0.12em] text-stone-500 uppercase">Lines</h3>
              <ul className="flex flex-col gap-2">
                {focused.lines.map((line, i) => (
                  <li key={i} className="rounded-lg border border-sandal-200 p-3">
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-[14px] text-stone-900">
                        {CATALOG.find((c) => c.id === line.itemId)?.name ?? line.itemId}
                      </span>
                      <Money value={line.amount} />
                    </div>
                    {line.dedication ? (
                      <p className="mt-1 text-[13px] text-stone-500">
                        For {line.dedication.name}
                        {line.dedication.nakshatra ? ` · ${line.dedication.nakshatra}` : ''}
                        {line.dedication.gothram ? ` · ${line.dedication.gothram} gothram` : ''}
                        {line.dedication.date ? ` · ${formatDate(line.dedication.date)}` : ''}
                      </p>
                    ) : null}
                  </li>
                ))}
              </ul>
            </section>
          </div>
        ) : null}
      </Drawer>
    </div>
  )
}

function Field({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <dt className="text-[11px] font-semibold tracking-[0.12em] text-stone-500 uppercase">{label}</dt>
      <dd className="mt-0.5 text-stone-900">{value}</dd>
    </div>
  )
}

function Row({ label, value, strong }: { label: string; value: React.ReactNode; strong?: boolean }) {
  return (
    <div className={strong ? 'flex justify-between border-t border-sandal-200 pt-2' : 'flex justify-between'}>
      <dt className={strong ? 'font-medium text-stone-900' : 'text-stone-700'}>{label}</dt>
      <dd>{value}</dd>
    </div>
  )
}
