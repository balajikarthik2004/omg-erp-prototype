import { useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { AlertTriangle, Banknote, FileClock, PiggyBank, Search, Wallet } from 'lucide-react'

import { formatDate, formatMoneyShort, formatPct } from '@/lib/format'
import { Button } from '@/components/ui/Button'
import { Drawer } from '@/components/ui/Drawer'
import { EmptyState } from '@/components/ui/EmptyState'
import { Input } from '@/components/ui/Input'
import { Money } from '@/components/ui/Money'
import { Select } from '@/components/ui/Select'
import { Stat } from '@/components/ui/Stat'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { Table, type Column } from '@/components/ui/Table'
import { TableSkeleton } from '@/components/ui/Skeleton'
import { PageHeader } from '@/components/layout/PageHeader'
import { SectorChip } from '@/components/layout/PhaseChip'
import { BudgetBar } from '@/components/flow/BudgetBar'
import { available, budgetHealth, useDb, utilisation } from '@/store/db'
import { useSession } from '@/store/session'
import { inSector } from '@/store/selectors'
import { userName } from '@/mock/seed'
import type { BudgetHead } from '@/types'

type HealthFilter = 'all' | 'healthy' | 'near_limit' | 'over_budget'

export function BudgetsPage() {
  const db = useDb()
  const filter = useSession((s) => s.sectorFilter)
  const [params, setParams] = useSearchParams()

  const [query, setQuery] = useState('')
  const [health, setHealth] = useState<HealthFilter>('all')

  const heads = useMemo(
    () => inSector(db.budgets, filter).slice().sort((a, b) => utilisation(b) - utilisation(a)),
    [db.budgets, filter],
  )

  // The heads on screen. The totals above stay on the sector's full set, so
  // searching never makes the organisation look like it holds less money.
  const rows = useMemo(() => {
    const q = query.trim().toLowerCase()
    return heads.filter((h) => {
      if (health !== 'all' && budgetHealth(h) !== health) return false
      if (!q) return true
      const fund = db.funds.find((f) => f.id === h.fundId)?.name ?? ''
      return `${h.name} ${fund}`.toLowerCase().includes(q)
    })
  }, [heads, health, query, db.funds])

  const totals = heads.reduce(
    (acc, h) => ({
      allocated: acc.allocated + h.allocated,
      committed: acc.committed + h.committed,
      spent: acc.spent + h.spent,
    }),
    { allocated: 0, committed: 0, spent: 0 },
  )
  const free = totals.allocated - totals.committed - totals.spent
  const overCount = heads.filter((h) => budgetHealth(h) === 'over_budget').length

  const focusId = params.get('focus')
  const focused = heads.find((h) => h.id === focusId)

  // Movements that touched the focused head.
  const movements = useMemo(() => {
    if (!focused) return { allotments: [], orders: [] }
    return {
      allotments: db.allotments.filter((a) => a.toBudgetHeadId === focused.id),
      orders: db.purchaseOrders.filter((p) => p.budgetHeadId === focused.id),
    }
  }, [db.allotments, db.purchaseOrders, focused])

  const columns: Column<BudgetHead>[] = [
    {
      key: 'name',
      header: 'Budget head',
      primary: true,
      sortValue: (h) => h.name,
      cell: (h) => (
        <span className="block min-w-0">
          <span className="block truncate font-medium text-stone-900">{h.name}</span>
          <span className="block truncate text-[12.5px] text-stone-500">
            {db.funds.find((f) => f.id === h.fundId)?.name ?? h.fundId} · {h.period}
          </span>
        </span>
      ),
    },
    {
      key: 'sector',
      header: 'Sector',
      hideOnMobile: true,
      sortValue: (h) => h.sectorId,
      cell: (h) => <SectorChip sectorId={h.sectorId} />,
    },
    {
      key: 'use',
      header: 'Utilisation',
      className: 'w-[220px]',
      sortValue: (h) => utilisation(h),
      cell: (h) => (
        <span className="block">
          <BudgetBar head={h} showLegend={false} />
          <span className="mt-1.5 block font-mono text-[12px] tabular-nums text-stone-500">
            {formatPct(utilisation(h), 0)} of {formatMoneyShort(h.allocated)} used
          </span>
        </span>
      ),
    },
    {
      key: 'allocated',
      header: 'Allocated',
      align: 'right',
      hideOnMobile: true,
      sortValue: (h) => h.allocated,
      cell: (h) => <Money value={h.allocated} />,
    },
    {
      key: 'committed',
      header: 'Committed',
      align: 'right',
      hideOnMobile: true,
      sortValue: (h) => h.committed,
      cell: (h) => <Money value={h.committed} tone="muted" />,
    },
    {
      key: 'spent',
      header: 'Spent',
      align: 'right',
      hideOnMobile: true,
      sortValue: (h) => h.spent,
      cell: (h) => <Money value={h.spent} />,
    },
    {
      key: 'available',
      header: 'Available',
      align: 'right',
      primary: true,
      sortValue: (h) => available(h),
      cell: (h) => <Money value={available(h)} tone={available(h) < 0 ? 'out' : 'in'} />,
    },
    {
      key: 'health',
      header: 'Status',
      sortValue: (h) => utilisation(h),
      cell: (h) => <StatusBadge status={budgetHealth(h)} />,
    },
  ]

  return (
    <div>
      <PageHeader
        title="Budgets"
        description="What each budget head was given, what is already promised to suppliers, and what is left to spend. Available is never stored — it is Allocated less Committed less Spent, worked out fresh every time."
      >
        <div className="grid gap-3 sm:grid-cols-[1fr_200px]">
          <Input
            aria-label="Search budget heads"
            placeholder="Search a head or its fund"
            leading={<Search className="size-4 text-stone-500" aria-hidden />}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <Select
            aria-label="Filter by status"
            value={health}
            onChange={(e) => setHealth(e.target.value as HealthFilter)}
            options={[
              { value: 'all', label: 'All heads' },
              { value: 'over_budget', label: 'Over budget' },
              { value: 'near_limit', label: 'Near the limit' },
              { value: 'healthy', label: 'Within limit' },
            ]}
          />
        </div>
      </PageHeader>

      {!db.ready ? (
        <TableSkeleton rows={8} cols={7} />
      ) : (
        <div className="flex flex-col gap-6">
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <Stat
              label="Allocated"
              value={<Money value={totals.allocated} />}
              sub={`across ${heads.length} head${heads.length === 1 ? '' : 's'}`}
              accentClass="bg-kumkum-600"
              icon={<Wallet className="size-4" aria-hidden />}
            />
            <Stat
              label="Committed"
              value={<Money value={totals.committed} />}
              sub="orders approved, not yet paid"
              accentClass="bg-turmeric-500"
              icon={<FileClock className="size-4" aria-hidden />}
            />
            <Stat
              label="Spent"
              value={<Money value={totals.spent} />}
              sub="money already released"
              accentClass="bg-tulsi-500"
              icon={<Banknote className="size-4" aria-hidden />}
            />
            <Stat
              label="Available"
              value={<Money value={free} tone={free < 0 ? 'out' : 'default'} />}
              sub={overCount > 0 ? `${overCount} head${overCount === 1 ? '' : 's'} over budget` : 'every head within limit'}
              accentClass={overCount > 0 ? 'bg-danger-600' : 'bg-peacock-500'}
              icon={overCount > 0 ? <AlertTriangle className="size-4" aria-hidden /> : <PiggyBank className="size-4" aria-hidden />}
            />
          </div>

          {rows.length === 0 ? (
            <EmptyState
              title={heads.length === 0 ? 'No budget heads' : 'Nothing matches those filters'}
              message={
                heads.length === 0
                  ? 'This sector has no budget heads set up yet.'
                  : 'Clear the search or choose a different status.'
              }
              action={
                heads.length > 0 ? (
                  <Button
                    variant="secondary"
                    onClick={() => {
                      setQuery('')
                      setHealth('all')
                    }}
                  >
                    Clear filters
                  </Button>
                ) : undefined
              }
            />
          ) : (
            <Table
              label="Budget heads"
              columns={columns}
              rows={rows}
              rowKey={(h) => h.id}
              onRowClick={(h) => setParams({ focus: h.id })}
              rowClassName={(h) => (budgetHealth(h) === 'over_budget' ? 'bg-danger-50' : undefined)}
            />
          )}
        </div>
      )}

      <Drawer
        open={Boolean(focused)}
        onClose={() => setParams({})}
        title={focused?.name ?? ''}
        subtitle={focused ? `${focused.period} · ${db.funds.find((f) => f.id === focused.fundId)?.name}` : undefined}
        width="lg"
        accent="kumkum"
        tone="canvas"
        headerExtra={
          focused ? (
            <>
              <SectorChip sectorId={focused.sectorId} withTamil />
              <StatusBadge status={budgetHealth(focused)} />
            </>
          ) : null
        }
      >
        {focused ? (
          <div className="flex flex-col gap-6">
            {budgetHealth(focused) === 'over_budget' ? (
              <div className="flex items-start gap-2.5 rounded-lg border border-danger-50 bg-danger-50 px-3 py-2.5 text-[13px] text-danger-600">
                <AlertTriangle className="mt-0.5 size-4 shrink-0" aria-hidden />
                <p>
                  This head is {formatMoneyShort(Math.abs(available(focused)))} over its allocation. No new order can be
                  submitted against it until a re-allotment is approved.
                </p>
              </div>
            ) : null}

            <div className="rounded-card border border-sandal-200 bg-sandal-50 p-4 shadow-card">
              <BudgetBar head={focused} />
            </div>

            <dl className="grid grid-cols-2 gap-3 text-[14px]">
              {[
                { label: 'Allocated', value: focused.allocated, hint: 'approved for this head' },
                { label: 'Committed', value: focused.committed, hint: 'ordered, not yet paid' },
                { label: 'Spent', value: focused.spent, hint: 'money released' },
                {
                  label: 'Available',
                  value: available(focused),
                  hint: 'what a new order may draw on',
                  lead: true,
                },
              ].map((row) => (
                <div
                  key={row.label}
                  className={
                    row.lead
                      ? 'rounded-lg border border-navy-200 bg-sandal-50 p-3 shadow-card'
                      : 'rounded-lg border border-sandal-200 bg-sandal-50 p-3 shadow-flat'
                  }
                >
                  <dt className="text-[11px] font-semibold tracking-[0.12em] text-stone-500 uppercase">{row.label}</dt>
                  <dd className="mt-1">
                    <Money
                      value={row.value}
                      className={row.lead ? 'text-[20px] font-semibold' : 'text-[18px]'}
                      tone={row.value < 0 ? 'out' : row.lead ? 'in' : 'default'}
                    />
                  </dd>
                  <dd className="mt-0.5 text-[12px] text-stone-500">{row.hint}</dd>
                </div>
              ))}
            </dl>

            <section>
              <h3 className="mb-2 text-[11px] font-semibold tracking-[0.12em] text-stone-500 uppercase">
                Allotments into this head
              </h3>
              {movements.allotments.length === 0 ? (
                <p className="text-[14px] text-stone-500">Nothing has been allotted to this head yet.</p>
              ) : (
                <ul className="flex flex-col divide-y divide-sandal-200 rounded-card border border-sandal-200">
                  {movements.allotments.slice(0, 10).map((a) => (
                    <li key={a.id} className="flex items-start justify-between gap-3 px-3 py-2.5">
                      <div className="min-w-0">
                        <p className="truncate text-[14px] text-stone-900">{a.reason}</p>
                        <p className="text-[12px] text-stone-500">
                          {userName(a.preparedBy)} · {formatDate(a.preparedAt)}
                        </p>
                      </div>
                      <div className="flex shrink-0 items-center gap-2">
                        <StatusBadge status={a.status} compact />
                        <Money value={a.amount} className="text-[14px]" />
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </section>

            <section>
              <h3 className="mb-2 text-[11px] font-semibold tracking-[0.12em] text-stone-500 uppercase">
                Orders against this head
              </h3>
              {movements.orders.length === 0 ? (
                <p className="text-[14px] text-stone-500">No purchase orders drawn on this head.</p>
              ) : (
                <ul className="flex flex-col divide-y divide-sandal-200 rounded-card border border-sandal-200">
                  {movements.orders.slice(0, 10).map((po) => (
                    <li key={po.id} className="flex items-center justify-between gap-3 px-3 py-2.5">
                      <div className="min-w-0">
                        <p className="truncate font-mono text-[13px] text-stone-900 tabular-nums">{po.poNo}</p>
                        <p className="truncate text-[12px] text-stone-500">
                          {db.suppliers.find((s) => s.id === po.supplierId)?.name}
                        </p>
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
        ) : null}
      </Drawer>
    </div>
  )
}
