import { useMemo, useState } from 'react'
import { Ban, Search, Star } from 'lucide-react'

import { CHART } from '@/config'
import { cn } from '@/lib/cn'
import { formatDate, formatPct } from '@/lib/format'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Drawer } from '@/components/ui/Drawer'
import { EmptyState } from '@/components/ui/EmptyState'
import { Input } from '@/components/ui/Input'
import { Money } from '@/components/ui/Money'
import { Select } from '@/components/ui/Select'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { CardSkeleton } from '@/components/ui/Skeleton'
import { PageHeader } from '@/components/layout/PageHeader'
import { Sparkline } from '@/components/charts/Sparkline'
import { useDb } from '@/store/db'
import type { Supplier } from '@/types'

export function SuppliersPage() {
  const db = useDb()
  const [query, setQuery] = useState('')
  const [status, setStatus] = useState('all')
  const [openId, setOpenId] = useState<string | null>(null)

  const suppliers = useMemo(() => {
    const q = query.trim().toLowerCase()
    return db.suppliers
      .filter(
        (s) =>
          (status === 'all' || s.status === status) &&
          (q === '' || s.name.toLowerCase().includes(q) || s.city.toLowerCase().includes(q)),
      )
      .sort((a, b) => b.rating - a.rating)
  }, [db.suppliers, query, status])

  const open = db.suppliers.find((s) => s.id === openId)

  return (
    <div>
      <PageHeader
        phase="spend"
        title="Suppliers"
        description="Who we buy from, how they have actually performed, and what they have charged."
      >
        <div className="grid gap-3 sm:grid-cols-[1fr_220px]">
          <Input
            aria-label="Search suppliers"
            placeholder="Search name or city"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            leading={<Search className="size-4" aria-hidden />}
          />
          <Select
            aria-label="Filter by status"
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            options={[
              { value: 'all', label: 'All suppliers' },
              { value: 'active', label: 'Active' },
              { value: 'blocked', label: 'Blocked' },
            ]}
          />
        </div>
      </PageHeader>

      {!db.ready ? (
        <CardSkeleton count={6} />
      ) : suppliers.length === 0 ? (
        <EmptyState
          title="No suppliers match"
          message="Try a shorter search, or show all statuses."
          action={
            <Button variant="secondary" onClick={() => { setQuery(''); setStatus('all') }}>
              Clear filters
            </Button>
          }
        />
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {suppliers.map((supplier) => (
            <li key={supplier.id}>
              <button type="button" onClick={() => setOpenId(supplier.id)} className="w-full text-left">
                <SupplierCard supplier={supplier} />
              </button>
            </li>
          ))}
        </ul>
      )}

      <Drawer
        open={Boolean(open)}
        onClose={() => setOpenId(null)}
        title={open?.name ?? ''}
        subtitle={open ? `${open.city} · supplying since ${formatDate(open.since)}` : undefined}
        width="lg"
      >
        {open ? <SupplierProfile supplier={open} /> : null}
      </Drawer>
    </div>
  )
}

function SupplierCard({ supplier }: { supplier: Supplier }) {
  const blocked = supplier.status === 'blocked'
  return (
    <Card
      accentClass={blocked ? 'bg-danger-600' : supplier.rating >= 4.5 ? 'bg-tulsi-500' : 'bg-turmeric-500'}
      className={cn('h-full transition-colors duration-150 hover:border-turmeric-400', blocked && 'opacity-80')}
    >
      <div className="mb-2 flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="font-display text-[18px] leading-tight text-stone-900">{supplier.name}</h3>
          <p className="text-[13px] text-stone-500">{supplier.city}</p>
        </div>
        <StatusBadge status={supplier.status} />
      </div>

      <p className="mb-3 line-clamp-2 text-[13px] text-stone-700">{supplier.note}</p>

      <dl className="grid grid-cols-3 gap-2 border-t border-sandal-200 pt-3 text-center">
        <Metric label="Rating" value={`${supplier.rating}`} icon={<Star className="size-3 fill-turmeric-500 text-turmeric-500" aria-hidden />} />
        <Metric label="On time" value={formatPct(supplier.onTimePct, 0)} tone={supplier.onTimePct >= 90 ? 'good' : 'warn'} />
        <Metric label="Rejected" value={formatPct(supplier.rejectionPct)} tone={supplier.rejectionPct <= 2 ? 'good' : 'warn'} />
      </dl>
    </Card>
  )
}

function Metric({
  label,
  value,
  tone,
  icon,
}: {
  label: string
  value: string
  tone?: 'good' | 'warn'
  icon?: React.ReactNode
}) {
  return (
    <div>
      <dt className="text-[11px] font-semibold tracking-[0.12em] text-stone-500 uppercase">{label}</dt>
      <dd
        className={cn(
          'mt-0.5 inline-flex items-center gap-1 font-mono text-[15px] tabular-nums',
          tone === 'good' && 'text-tulsi-700',
          tone === 'warn' && 'text-marigold-500',
          !tone && 'text-stone-900',
        )}
      >
        {icon}
        {value}
      </dd>
    </div>
  )
}

function SupplierProfile({ supplier }: { supplier: Supplier }) {
  const db = useDb()
  const orders = db.purchaseOrders.filter((p) => p.supplierId === supplier.id)
  const itemIds = [...new Set(supplier.priceHistory.map((p) => p.itemId))]

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center gap-2">
        <StatusBadge status={supplier.status} />
        <span className="inline-flex items-center gap-1 rounded-full border border-sandal-200 bg-sandal-100 px-2.5 py-0.5 text-[12px] text-stone-700">
          <Star className="size-3 fill-turmeric-500 text-turmeric-500" aria-hidden />
          {supplier.rating} of 5
        </span>
        <span className="rounded-full border border-sandal-200 bg-sandal-100 px-2.5 py-0.5 text-[12px] text-stone-700">
          {supplier.orderCount} orders
        </span>
      </div>

      {supplier.status === 'blocked' ? (
        <div className="flex items-start gap-2.5 rounded-lg border border-danger-50 bg-danger-50 px-3 py-2.5 text-[13px] text-danger-600">
          <Ban className="mt-0.5 size-4 shrink-0" aria-hidden />
          <p>
            This supplier is blocked and is excluded from every AI suggestion. {supplier.note}
          </p>
        </div>
      ) : (
        <p className="text-[14px] text-stone-700">{supplier.note}</p>
      )}

      <dl className="grid grid-cols-3 gap-3">
        {[
          { label: 'On time', value: formatPct(supplier.onTimePct, 0) },
          { label: 'Rejection', value: formatPct(supplier.rejectionPct) },
          { label: 'Items carried', value: String(supplier.items.length) },
        ].map((row) => (
          <div key={row.label} className="rounded-lg border border-sandal-200 bg-sandal-100 p-3">
            <dt className="text-[11px] font-semibold tracking-[0.12em] text-stone-500 uppercase">{row.label}</dt>
            <dd className="mt-1 font-mono text-[18px] text-stone-900 tabular-nums">{row.value}</dd>
          </div>
        ))}
      </dl>

      <section>
        <h3 className="mb-2 text-[11px] font-semibold tracking-[0.12em] text-stone-500 uppercase">
          Price history — last twelve months
        </h3>
        <ul className="flex flex-col divide-y divide-sandal-200 rounded-card border border-sandal-200">
          {itemIds.slice(0, 12).map((itemId) => {
            const points = supplier.priceHistory.filter((p) => p.itemId === itemId)
            const prices = points.map((p) => p.unitPrice)
            const first = prices[0] ?? 0
            const last = prices.at(-1) ?? 0
            const change = first > 0 ? ((last - first) / first) * 100 : 0
            return (
              <li key={itemId} className="flex items-center justify-between gap-3 px-3 py-2.5">
                <span className="min-w-0 flex-1 truncate text-[14px] text-stone-900">
                  {db.inventory.find((i) => i.id === itemId)?.name ?? itemId}
                </span>
                <Sparkline points={prices} color={change > 0 ? CHART.outgo : CHART.income} width={80} height={24} />
                <span className="w-24 shrink-0 text-right">
                  <Money value={last} className="text-[14px]" />
                  <span
                    className={cn(
                      'block font-mono text-[12px] tabular-nums',
                      change > 0 ? 'text-danger-600' : 'text-tulsi-700',
                    )}
                  >
                    {change > 0 ? '+' : ''}
                    {change.toFixed(1)}%
                  </span>
                </span>
              </li>
            )
          })}
        </ul>
      </section>

      <section>
        <h3 className="mb-2 text-[11px] font-semibold tracking-[0.12em] text-stone-500 uppercase">Recent orders</h3>
        {orders.length === 0 ? (
          <p className="text-[14px] text-stone-500">No purchase orders with this supplier yet.</p>
        ) : (
          <ul className="flex flex-col divide-y divide-sandal-200 rounded-card border border-sandal-200">
            {orders.slice(0, 8).map((po) => (
              <li key={po.id} className="flex items-center justify-between gap-3 px-3 py-2.5">
                <div className="min-w-0">
                  <p className="font-mono text-[13px] text-stone-900 tabular-nums">{po.poNo}</p>
                  <p className="text-[12px] text-stone-500">{formatDate(po.createdAt)}</p>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <StatusBadge status={po.status} compact />
                  <Money value={po.total} className="text-[14px]" />
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  )
}
