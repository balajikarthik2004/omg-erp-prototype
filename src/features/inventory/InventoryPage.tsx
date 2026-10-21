import { useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { ArrowRight, Boxes, PackagePlus, Search, TriangleAlert } from 'lucide-react'

import { formatAge, formatDate, formatMoneyShort } from '@/lib/format'
import { Button } from '@/components/ui/Button'
import { Dialog } from '@/components/ui/Dialog'
import { Drawer } from '@/components/ui/Drawer'
import { EmptyState } from '@/components/ui/EmptyState'
import { Input, Textarea } from '@/components/ui/Input'
import { Money } from '@/components/ui/Money'
import { Select } from '@/components/ui/Select'
import { Stat } from '@/components/ui/Stat'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { Table, type Column } from '@/components/ui/Table'
import { TableSkeleton } from '@/components/ui/Skeleton'
import { Tabs } from '@/components/ui/Tabs'
import { PageHeader } from '@/components/layout/PageHeader'
import { SectorChip } from '@/components/layout/PhaseChip'
import { MakerCheckerNote } from '@/components/flow/MakerCheckerNote'
import { useDb } from '@/store/db'
import { inventoryApprovalBlock } from '@/store/rules'
import { currentUser, useSession } from '@/store/session'
import { inSector, lowStock } from '@/store/selectors'
import { userName } from '@/mock/seed'
import { StockLevel } from './StockLevel'
import type { InventoryItem, InventoryRequest } from '@/types'

/** Computed once, so a re-render never shifts the earliest selectable date. */
const TODAY = new Date().toISOString().slice(0, 10)

export function InventoryPage() {
  const db = useDb()
  const filter = useSession((s) => s.sectorFilter)
  const personaId = useSession((s) => s.personaId)
  const user = currentUser(personaId)
  const decideInventoryRequest = useDb((s) => s.decideInventoryRequest)

  const [params, setParams] = useSearchParams()
  const [tab, setTab] = useState('stock')
  const [query, setQuery] = useState('')
  const [category, setCategory] = useState('all')
  const [lowOnly, setLowOnly] = useState(false)
  const [requesting, setRequesting] = useState<InventoryItem | null>(null)

  // Everything this sector tracks, before the search box narrows it. The
  // counts above the table read off this, so filtering never makes the store
  // look emptier than it is.
  const allItems = useMemo(() => inSector(db.inventory, filter), [db.inventory, filter])

  const items = useMemo(() => {
    const q = query.trim().toLowerCase()
    return allItems.filter(
      (i) =>
        (category === 'all' || i.category === category) &&
        (!lowOnly || i.stock <= i.reorderLevel) &&
        (q === '' || i.name.toLowerCase().includes(q) || i.category.toLowerCase().includes(q)),
    )
  }, [allItems, query, category, lowOnly])

  const stockValue = allItems.reduce((sum, i) => sum + i.stock * i.lastUnitPrice, 0)

  const requests = useMemo(() => inSector(db.inventoryRequests, filter), [db.inventoryRequests, filter])
  const pendingRequests = requests.filter((r) => r.status === 'pending' || r.status === 'escalated')
  const low = lowStock(db, filter)
  const categories = [...new Set(db.inventory.map((i) => i.category))].sort()

  const focusId = params.get('focus')
  const focusedRequest = db.inventoryRequests.find((r) => r.id === focusId)
  const focusedItem = focusedRequest ? db.inventory.find((i) => i.id === focusedRequest.itemId) : undefined
  const reqBlock = focusedRequest ? inventoryApprovalBlock(user, focusedRequest) : null

  const itemColumns: Column<InventoryItem>[] = [
    {
      key: 'name',
      header: 'Item',
      primary: true,
      sortValue: (i) => i.name,
      cell: (i) => (
        <span className="block min-w-0">
          <span className="block truncate text-stone-900">{i.name}</span>
          <span className="block truncate text-[12.5px] text-stone-500">{i.category}</span>
        </span>
      ),
    },
    {
      key: 'sector',
      header: 'Sector',
      hideOnMobile: true,
      sortValue: (i) => i.sectorId,
      cell: (i) => <SectorChip sectorId={i.sectorId} />,
    },
    {
      key: 'stock',
      header: 'On the shelf',
      // Sorted by how close to running out, not by raw quantity: 4 coconuts
      // and 4 kilos of rice are not the same kind of low.
      sortValue: (i) => (i.reorderLevel > 0 ? i.stock / i.reorderLevel : i.stock),
      cell: (i) => <StockLevel item={i} />,
    },
    {
      key: 'price',
      header: 'Last price paid',
      align: 'right',
      hideOnMobile: true,
      sortValue: (i) => i.lastUnitPrice,
      cell: (i) => (
        <span className="whitespace-nowrap">
          <Money value={i.lastUnitPrice} />
          <span className="text-[12px] text-stone-500"> / {i.unit}</span>
        </span>
      ),
    },
    {
      key: 'value',
      header: 'Stock value',
      align: 'right',
      hideOnMobile: true,
      sortValue: (i) => i.stock * i.lastUnitPrice,
      cell: (i) => <Money value={i.stock * i.lastUnitPrice} tone="muted" />,
    },
    {
      key: 'status',
      header: 'Status',
      sortValue: (i) => (i.stock <= i.reorderLevel ? 0 : 1),
      cell: (i) => <StatusBadge status={i.stock <= i.reorderLevel ? 'low_stock' : 'in_stock'} />,
    },
    {
      key: 'action',
      header: '',
      align: 'right',
      cell: (i) => (
        <Button
          size="sm"
          variant="secondary"
          onClick={(e) => {
            e.stopPropagation()
            setRequesting(i)
          }}
        >
          Request stock
        </Button>
      ),
    },
  ]

  const requestColumns: Column<InventoryRequest>[] = [
    {
      key: 'item',
      header: 'Item',
      primary: true,
      cell: (r) => <span className="text-stone-900">{db.inventory.find((i) => i.id === r.itemId)?.name ?? r.itemId}</span>,
    },
    {
      key: 'qty',
      header: 'Quantity',
      align: 'right',
      cell: (r) => {
        const item = db.inventory.find((i) => i.id === r.itemId)
        return (
          <span className="font-mono tabular-nums">
            {r.qty} <span className="text-stone-500">{item?.unit}</span>
          </span>
        )
      },
    },
    { key: 'sector', header: 'Sector', cell: (r) => <SectorChip sectorId={r.sectorId} /> },
    {
      key: 'needed',
      header: 'Needed by',
      cell: (r) => <span className="font-mono text-[13px] tabular-nums">{formatDate(r.neededBy)}</span>,
    },
    {
      key: 'by',
      header: 'Raised by',
      hideOnMobile: true,
      cell: (r) => (
        <span className="text-[13px] text-stone-500">
          {userName(r.requestedBy)} · {formatAge(r.requestedAt)}
        </span>
      ),
    },
    { key: 'status', header: 'Status', cell: (r) => <StatusBadge status={r.status} /> },
  ]

  return (
    <div>
      <PageHeader
        title="Inventory"
        description="What the store holds, and the level each item must not fall below. When something runs low, raise a request — once a Sector Admin approves it, procurement turns it into a purchase order."
      >
        <div className="flex flex-col gap-3">
          <Tabs
            value={tab}
            onChange={setTab}
            items={[
              { id: 'stock', label: 'Stock', count: items.length },
              { id: 'requests', label: 'Requests', count: pendingRequests.length },
            ]}
          />
          {tab === 'stock' ? (
            <div className="grid gap-3 sm:grid-cols-[1fr_200px_auto]">
              <Input
                aria-label="Search inventory"
                placeholder="Search item or category"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                leading={<Search className="size-4" aria-hidden />}
              />
              <Select
                aria-label="Filter by category"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                options={[{ value: 'all', label: 'All categories' }, ...categories.map((c) => ({ value: c, label: c }))]}
              />
              <Button
                variant={lowOnly ? undefined : 'secondary'}
                icon={<TriangleAlert className="size-4" aria-hidden />}
                aria-pressed={lowOnly}
                onClick={() => setLowOnly((v) => !v)}
              >
                Low stock only
              </Button>
            </div>
          ) : null}
        </div>
      </PageHeader>

      {!db.ready ? (
        <TableSkeleton rows={10} cols={7} />
      ) : (
        <div className="flex flex-col gap-6">
          <div className="grid gap-4 sm:grid-cols-3">
            <Stat
              label="Below reorder level"
              value={low.length}
              sub="needs ordering now"
              accentClass={low.length > 0 ? 'bg-danger-600' : 'bg-tulsi-500'}
              icon={<TriangleAlert className="size-4" aria-hidden />}
            />
            <Stat
              label="Items tracked"
              value={allItems.length}
              sub={`${formatMoneyShort(stockValue)} of stock on hand`}
              accentClass="bg-tulsi-500"
              icon={<Boxes className="size-4" aria-hidden />}
            />
            <Stat
              label="Requests waiting"
              value={pendingRequests.length}
              sub="with a Sector Admin to approve"
              accentClass="bg-marigold-500"
              icon={<PackagePlus className="size-4" aria-hidden />}
            />
          </div>

          {low.length > 0 && tab === 'stock' ? (
            <div className="flex flex-wrap items-center gap-3 rounded-card border border-danger-50 bg-danger-50 px-4 py-3">
              <TriangleAlert className="size-4 shrink-0 text-danger-600" aria-hidden />
              <p className="flex-1 text-[14px] text-danger-600">
                {low.length} item{low.length === 1 ? ' is' : 's are'} at or below the reorder level:{' '}
                {low.slice(0, 3).map((i) => i.name).join(', ')}
                {low.length > 3 ? ` and ${low.length - 3} more` : ''}.
              </p>
              <Link to="/console/procurement">
                <Button size="sm" rightIcon={<ArrowRight className="size-3.5" aria-hidden />}>Start a purchase order</Button>
              </Link>
            </div>
          ) : null}

          {tab === 'stock' ? (
            items.length === 0 ? (
              <EmptyState
                title="No items match"
                message="Try a different category, or clear the search box."
                action={
                  <Button
                    variant="secondary"
                    onClick={() => {
                      setQuery('')
                      setCategory('all')
                      setLowOnly(false)
                    }}
                  >
                    Clear filters
                  </Button>
                }
              />
            ) : (
              <Table
                label="Stock on hand"
                columns={itemColumns}
                rows={items}
                rowKey={(i) => i.id}
                rowClassName={(i) => (i.stock <= i.reorderLevel ? 'bg-danger-50' : undefined)}
              />
            )
          ) : requests.length === 0 ? (
            <EmptyState
              icon={<PackagePlus className="size-6" aria-hidden />}
              title="No requests"
              message="When the store asks for stock it will appear here for approval."
            />
          ) : (
            <>
              <p className="-mb-2 text-[13.5px] text-stone-500">
                Stock the store has asked for. A Sector Admin approves it — never the person who raised it — and an
                approved request is what procurement builds a purchase order from. Open a row to decide it.
              </p>
              <Table
                label="Stock requests"
                columns={requestColumns}
                rows={requests}
                rowKey={(r) => r.id}
                onRowClick={(r) => setParams({ focus: r.id })}
                rowClassName={(r) => (r.status === 'escalated' ? 'bg-marigold-50' : undefined)}
              />
            </>
          )}
        </div>
      )}

      {/* Request detail */}
      <Drawer
        open={Boolean(focusedRequest)}
        onClose={() => setParams({})}
        title={focusedItem?.name ?? 'Request'}
        subtitle={focusedRequest ? `${focusedRequest.id} · raised ${formatDate(focusedRequest.requestedAt)}` : undefined}
        accent="tulsi"
        tone="canvas"
        headerExtra={
          focusedRequest ? (
            <>
              <StatusBadge status={focusedRequest.status} />
              <SectorChip sectorId={focusedRequest.sectorId} />
            </>
          ) : null
        }
        footer={
          focusedRequest && (focusedRequest.status === 'pending' || focusedRequest.status === 'escalated') ? (
            <div className="flex flex-col gap-3">
              <MakerCheckerNote preparedBy={focusedRequest.requestedBy} block={reqBlock} />
              <div className="flex gap-2">
                <Button
                  fullWidth
                  variant="success"
                  disabled={Boolean(reqBlock)}
                  title={reqBlock ?? undefined}
                  onClick={() => {
                    decideInventoryRequest(focusedRequest.id, 'approved', user)
                    setParams({})
                  }}
                >
                  Approve request
                </Button>
                <Button
                  fullWidth
                  variant="secondary"
                  disabled={Boolean(reqBlock)}
                  title={reqBlock ?? undefined}
                  onClick={() => {
                    decideInventoryRequest(focusedRequest.id, 'rejected', user)
                    setParams({})
                  }}
                >
                  Reject
                </Button>
              </div>
            </div>
          ) : null
        }
      >
        {focusedRequest && focusedItem ? (
          <div className="flex flex-col gap-5">
            {focusedRequest.note ? (
              <p className="rounded-lg border border-marigold-50 bg-marigold-50 px-3 py-2.5 text-[13px] text-marigold-500">
                {focusedRequest.note}
              </p>
            ) : null}

            <dl className="grid grid-cols-2 gap-4 rounded-card border border-sandal-200 bg-sandal-50 p-4 text-[14px] shadow-card">
              <div>
                <dt className="text-[11px] font-semibold tracking-[0.12em] text-stone-500 uppercase">Quantity</dt>
                <dd className="mt-0.5 font-mono text-stone-900 tabular-nums">
                  {focusedRequest.qty} {focusedItem.unit}
                </dd>
              </div>
              <div>
                <dt className="text-[11px] font-semibold tracking-[0.12em] text-stone-500 uppercase">Needed by</dt>
                <dd className="mt-0.5 text-stone-900">{formatDate(focusedRequest.neededBy)}</dd>
              </div>
              <div>
                <dt className="text-[11px] font-semibold tracking-[0.12em] text-stone-500 uppercase">Current stock</dt>
                <dd className="mt-0.5 font-mono text-stone-900 tabular-nums">
                  {focusedItem.stock} {focusedItem.unit}
                </dd>
              </div>
              <div>
                <dt className="text-[11px] font-semibold tracking-[0.12em] text-stone-500 uppercase">Indicative value</dt>
                <dd className="mt-0.5">
                  <Money value={focusedItem.lastUnitPrice * focusedRequest.qty} />
                </dd>
              </div>
            </dl>

            {focusedRequest.status === 'approved' && !focusedRequest.poId ? (
              <Link to="/console/procurement">
                <Button fullWidth variant="secondary" rightIcon={<ArrowRight className="size-4" aria-hidden />}>
                  Raise a purchase order from this request
                </Button>
              </Link>
            ) : null}
          </div>
        ) : null}
      </Drawer>

      <RequestDialog item={requesting} onClose={() => setRequesting(null)} />
    </div>
  )
}

function RequestDialog({ item, onClose }: { item: InventoryItem | null; onClose: () => void }) {
  const createInventoryRequest = useDb((s) => s.createInventoryRequest)
  const personaId = useSession((s) => s.personaId)
  const [qty, setQty] = useState('')
  const [neededBy, setNeededBy] = useState('')
  const [note, setNote] = useState('')

  const parsed = Number(qty)
  const valid = parsed > 0 && Boolean(neededBy)

  return (
    <Dialog
      open={Boolean(item)}
      onClose={onClose}
      title={`Request ${item?.name ?? ''}`}
      description="The store raises this. A different person has to approve it before an order can be placed."
      footer={
        <div className="flex gap-2">
          <Button
            fullWidth
            disabled={!valid}
            onClick={() => {
              if (!item || !valid) return
              createInventoryRequest({
                itemId: item.id,
                qty: parsed,
                neededBy: new Date(neededBy).toISOString(),
                note: note.trim() || undefined,
                actor: currentUser(personaId),
              })
              setQty('')
              setNeededBy('')
              setNote('')
              onClose()
            }}
          >
            Raise request
          </Button>
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
        </div>
      }
    >
      {item ? (
        <div className="flex flex-col gap-4">
          <p className="rounded-lg bg-sandal-100 px-3 py-2.5 text-[13px] text-stone-700">
            In stock now: <span className="font-mono tabular-nums">{item.stock} {item.unit}</span> · reorder level{' '}
            <span className="font-mono tabular-nums">{item.reorderLevel}</span>
          </p>
          <Input
            label={`Quantity (${item.unit})`}
            inputMode="numeric"
            placeholder={String(item.reorderLevel * 2)}
            value={qty}
            onChange={(e) => setQty(e.target.value.replace(/[^0-9]/g, ''))}
            className="font-mono tabular-nums"
          />
          <Input
            label="Needed by"
            type="date"
            min={TODAY}
            value={neededBy}
            onChange={(e) => setNeededBy(e.target.value)}
          />
          <Textarea
            label="Note (optional)"
            placeholder="Anything the approver should know"
            value={note}
            onChange={(e) => setNote(e.target.value)}
          />
        </div>
      ) : null}
    </Dialog>
  )
}
