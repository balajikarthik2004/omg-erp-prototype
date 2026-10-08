import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, Search } from 'lucide-react'

import { formatDate, formatMoney } from '@/lib/format'
import { Button } from '@/components/ui/Button'
import { EmptyState } from '@/components/ui/EmptyState'
import { Input } from '@/components/ui/Input'
import { Money } from '@/components/ui/Money'
import { Select } from '@/components/ui/Select'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { Table, type Column } from '@/components/ui/Table'
import { TableSkeleton } from '@/components/ui/Skeleton'
import { PageHeader } from '@/components/layout/PageHeader'
import { SectorChip } from '@/components/layout/PhaseChip'
import { useDb } from '@/store/db'
import { useSession } from '@/store/session'
import { inSector } from '@/store/selectors'
import type { PurchaseOrder } from '@/types'

const PAGE_SIZE = 20

const STATUS_OPTIONS = [
  'all', 'draft', 'pending_ca', 'approved', 'sent', 'partially_received', 'received',
  'invoiced', 'payment_pending', 'paid', 'closed', 'rejected', 'cancelled',
]

export function PurchaseOrdersPage() {
  const db = useDb()
  const navigate = useNavigate()
  const filter = useSession((s) => s.sectorFilter)
  const [query, setQuery] = useState('')
  const [status, setStatus] = useState('all')
  const [page, setPage] = useState(0)

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase()
    return inSector(db.purchaseOrders, filter).filter((po) => {
      if (status !== 'all' && po.status !== status) return false
      if (q === '') return true
      const supplier = db.suppliers.find((s) => s.id === po.supplierId)?.name.toLowerCase() ?? ''
      return po.poNo.toLowerCase().includes(q) || supplier.includes(q)
    })
  }, [db.purchaseOrders, db.suppliers, filter, query, status])

  const paged = rows.slice(page * PAGE_SIZE, page * PAGE_SIZE + PAGE_SIZE)
  const openValue = rows
    .filter((po) => ['approved', 'sent', 'partially_received', 'received', 'invoiced', 'payment_pending'].includes(po.status))
    .reduce((s, po) => s + po.total, 0)

  const columns: Column<PurchaseOrder>[] = [
    {
      key: 'poNo',
      header: 'PO no.',
      primary: true,
      cell: (po) => <span className="font-mono text-[13px] text-stone-900 tabular-nums">{po.poNo}</span>,
    },
    {
      key: 'supplier',
      header: 'Supplier',
      cell: (po) => db.suppliers.find((s) => s.id === po.supplierId)?.name ?? '—',
    },
    {
      key: 'head',
      header: 'Budget head',
      hideOnMobile: true,
      cell: (po) => db.budgets.find((b) => b.id === po.budgetHeadId)?.name ?? '—',
    },
    { key: 'sector', header: 'Sector', cell: (po) => <SectorChip sectorId={po.sectorId} /> },
    {
      key: 'date',
      header: 'Raised',
      cell: (po) => <span className="font-mono text-[13px] tabular-nums">{formatDate(po.createdAt)}</span>,
    },
    { key: 'status', header: 'Status', cell: (po) => <StatusBadge status={po.status} /> },
    { key: 'total', header: 'Total', align: 'right', primary: true, cell: (po) => <Money value={po.total} /> },
  ]

  return (
    <div>
      <PageHeader
        phase="spend"
        title="Purchase orders"
        description={`${rows.length} orders · ${formatMoney(openValue)} committed but not yet paid`}
        actions={
          <Button icon={<Plus className="size-4" aria-hidden />} onClick={() => navigate('/console/procurement')}>
            New order
          </Button>
        }
      >
        <div className="grid gap-3 sm:grid-cols-[1fr_240px]">
          <Input
            aria-label="Search purchase orders"
            placeholder="Search PO number or supplier"
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
            options={STATUS_OPTIONS.map((value) => ({
              value,
              label: value === 'all' ? 'All statuses' : value.replace(/_/g, ' ').replace(/^\w/, (c) => c.toUpperCase()),
            }))}
          />
        </div>
      </PageHeader>

      {!db.ready ? (
        <TableSkeleton rows={10} cols={7} />
      ) : rows.length === 0 ? (
        <EmptyState
          title="No orders match"
          message="Widen the status filter, or clear the search box."
          action={
            <Button variant="secondary" onClick={() => { setQuery(''); setStatus('all') }}>
              Clear filters
            </Button>
          }
        />
      ) : (
        <>
          <Table
            columns={columns}
            rows={paged}
            rowKey={(po) => po.id}
            onRowClick={(po) => navigate(`/console/purchase-orders/${encodeURIComponent(po.id)}`)}
            rowClassName={(po) => (po.status === 'pending_ca' ? 'bg-marigold-50' : undefined)}
          />
          <nav className="mt-4 flex items-center justify-between gap-3" aria-label="Pagination">
            <p className="text-[13px] text-stone-500">
              Showing {page * PAGE_SIZE + 1}–{Math.min(rows.length, (page + 1) * PAGE_SIZE)} of {rows.length}
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
    </div>
  )
}
