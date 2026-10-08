import { useMemo } from 'react'
import { useSearchParams } from 'react-router-dom'
import { AlertTriangle } from 'lucide-react'

import { formatDate, formatMoney, formatPct } from '@/lib/format'
import { Card } from '@/components/ui/Card'
import { Drawer } from '@/components/ui/Drawer'
import { EmptyState } from '@/components/ui/EmptyState'
import { Money } from '@/components/ui/Money'
import { Stat } from '@/components/ui/Stat'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { Skeleton } from '@/components/ui/Skeleton'
import { PageHeader } from '@/components/layout/PageHeader'
import { SectorChip } from '@/components/layout/PhaseChip'
import { BudgetBar } from '@/components/flow/BudgetBar'
import { available, budgetHealth, useDb, utilisation } from '@/store/db'
import { useSession } from '@/store/session'
import { inSector } from '@/store/selectors'
import { userName } from '@/mock/seed'

export function BudgetsPage() {
  const db = useDb()
  const filter = useSession((s) => s.sectorFilter)
  const [params, setParams] = useSearchParams()

  const heads = useMemo(
    () => inSector(db.budgets, filter).slice().sort((a, b) => utilisation(b) - utilisation(a)),
    [db.budgets, filter],
  )

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

  return (
    <div>
      <PageHeader
        phase="control"
        title="Budgets"
        description="Allocated, committed and spent for every head. Available is derived, never stored."
      />

      {!db.ready ? (
        <div className="grid gap-4 sm:grid-cols-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-40 w-full" />
          ))}
        </div>
      ) : (
        <div className="flex flex-col gap-6">
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <Stat label="Allocated" value={<Money value={totals.allocated} />} accentClass="bg-kumkum-600" />
            <Stat label="Committed" value={<Money value={totals.committed} />} sub="orders approved, not yet paid" accentClass="bg-turmeric-500" />
            <Stat label="Spent" value={<Money value={totals.spent} />} accentClass="bg-tulsi-500" />
            <Stat
              label="Available"
              value={<Money value={free} tone={free < 0 ? 'out' : 'default'} />}
              sub={overCount > 0 ? `${overCount} head${overCount === 1 ? '' : 's'} over budget` : 'all heads within limit'}
              accentClass={overCount > 0 ? 'bg-danger-600' : 'bg-peacock-500'}
              icon={overCount > 0 ? <AlertTriangle className="size-4 text-danger-600" aria-hidden /> : undefined}
            />
          </div>

          {heads.length === 0 ? (
            <EmptyState title="No budget heads" message="This sector has no budget heads set up yet." />
          ) : (
            <ul className="grid gap-4 lg:grid-cols-2">
              {heads.map((head) => {
                const health = budgetHealth(head)
                return (
                  <li key={head.id}>
                    <button
                      type="button"
                      onClick={() => setParams({ focus: head.id })}
                      className="w-full text-left"
                    >
                      <Card
                        accentClass={
                          health === 'over_budget'
                            ? 'bg-danger-600'
                            : health === 'near_limit'
                              ? 'bg-marigold-500'
                              : 'bg-tulsi-500'
                        }
                        className="h-full transition-colors duration-150 hover:border-turmeric-400"
                      >
                        <div className="mb-3 flex flex-wrap items-start justify-between gap-2">
                          <div className="min-w-0">
                            <h3 className="font-display text-[18px] leading-tight text-stone-900">{head.name}</h3>
                            <p className="mt-0.5 text-[13px] text-stone-500">{head.period}</p>
                          </div>
                          <div className="flex shrink-0 items-center gap-2">
                            <SectorChip sectorId={head.sectorId} />
                            <StatusBadge status={health} />
                          </div>
                        </div>

                        <div className="mb-3 flex items-baseline justify-between gap-3">
                          <Money value={head.allocated} className="font-display text-[22px] text-stone-900" />
                          <span className="font-mono text-[13px] text-stone-500 tabular-nums">
                            {formatPct(utilisation(head), 0)} used
                          </span>
                        </div>

                        <BudgetBar head={head} />
                      </Card>
                    </button>
                  </li>
                )
              })}
            </ul>
          )}
        </div>
      )}

      <Drawer
        open={Boolean(focused)}
        onClose={() => setParams({})}
        title={focused?.name ?? ''}
        subtitle={focused ? `${focused.period} · ${db.funds.find((f) => f.id === focused.fundId)?.name}` : undefined}
        width="lg"
      >
        {focused ? (
          <div className="flex flex-col gap-6">
            <div className="flex flex-wrap items-center gap-2">
              <SectorChip sectorId={focused.sectorId} withTamil />
              <StatusBadge status={budgetHealth(focused)} />
            </div>

            {budgetHealth(focused) === 'over_budget' ? (
              <div className="flex items-start gap-2.5 rounded-lg border border-danger-50 bg-danger-50 px-3 py-2.5 text-[13px] text-danger-600">
                <AlertTriangle className="mt-0.5 size-4 shrink-0" aria-hidden />
                <p>
                  This head is {formatMoney(Math.abs(available(focused)))} over its allocation. No new order can be
                  submitted against it until a re-allotment is approved.
                </p>
              </div>
            ) : null}

            <BudgetBar head={focused} />

            <dl className="grid grid-cols-2 gap-4 text-[14px]">
              {[
                { label: 'Allocated', value: focused.allocated },
                { label: 'Committed', value: focused.committed },
                { label: 'Spent', value: focused.spent },
                { label: 'Available', value: available(focused) },
              ].map((row) => (
                <div key={row.label} className="rounded-lg border border-sandal-200 bg-sandal-100 p-3">
                  <dt className="text-[11px] font-semibold tracking-[0.12em] text-stone-500 uppercase">{row.label}</dt>
                  <dd className="mt-1">
                    <Money value={row.value} className="text-[18px]" tone={row.value < 0 ? 'out' : 'default'} />
                  </dd>
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
