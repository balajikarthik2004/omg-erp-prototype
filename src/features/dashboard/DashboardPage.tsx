import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight, Banknote, ClipboardList, PiggyBank, TrendingDown } from 'lucide-react'

import { formatAge, formatDue, formatMoney, greetingName } from '@/lib/format'
import { Card, CardHeader } from '@/components/ui/Card'
import { CardSkeleton, Skeleton } from '@/components/ui/Skeleton'
import { EmptyState } from '@/components/ui/EmptyState'
import { Money } from '@/components/ui/Money'
import { Stat } from '@/components/ui/Stat'
import { PageHeader } from '@/components/layout/PageHeader'
import { SectorChip } from '@/components/layout/PhaseChip'
import { FundDonut } from '@/components/charts/FundDonut'
import { IncomeOutgoChart } from '@/components/charts/IncomeOutgoChart'
import { UtilisationBars } from '@/components/charts/UtilisationBars'
import { useDb } from '@/store/db'
import { useCurrentUser, useSession } from '@/store/session'
import {
  approvalTasks,
  budgetsNearLimit,
  fundSlices,
  kpis,
  monthlySeries,
  recentActivity,
} from '@/store/selectors'
import { ROLE_LABEL, userName } from '@/mock/seed'

export function DashboardPage() {
  const db = useDb()
  const filter = useSession((s) => s.sectorFilter)
  const user = useCurrentUser()

  const data = useMemo(() => {
    if (!db.ready) return null
    return {
      kpi: kpis(db, filter),
      series: monthlySeries(db, filter),
      funds: fundSlices(db, filter),
      tasks: approvalTasks(db, filter),
      tight: budgetsNearLimit(db, filter),
      activity: recentActivity(db, filter),
    }
  }, [db, filter])

  return (
    <div>
      <PageHeader
        phase="report"
        title={`Good day, ${greetingName(user.name)}`}
        description={`Signed in as ${ROLE_LABEL[user.role]}. Here is where the money came from this month, where it went, and what is waiting on a signature.`}
      />

      {!data ? (
        <div className="flex flex-col gap-6">
          <CardSkeleton count={4} />
          <Skeleton className="h-72 w-full" />
        </div>
      ) : (
        <div className="flex flex-col gap-6">
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <Stat
              label="Income this month"
              value={<Money value={data.kpi.incomeMtd} />}
              delta={data.kpi.incomeDelta}
              sub="same days last month"
              accentClass="bg-turmeric-500"
              icon={<Banknote className="size-4" aria-hidden />}
            />
            <Stat
              label="Outgo this month"
              value={<Money value={data.kpi.outgoMtd} />}
              delta={data.kpi.outgoDelta}
              deltaMeaning="neutral"
              sub="supplier payments released"
              accentClass="bg-tulsi-500"
              icon={<TrendingDown className="size-4" aria-hidden />}
            />
            <Stat
              label="Net this month"
              value={<Money value={data.kpi.net} tone={data.kpi.net >= 0 ? 'in' : 'out'} />}
              sub={`${data.kpi.donationCountMtd} donations received`}
              accentClass="bg-peacock-500"
              icon={<PiggyBank className="size-4" aria-hidden />}
            />
            <Stat
              label="Pending approvals"
              value={data.kpi.pendingCount}
              sub={`${formatMoney(data.kpi.pendingValue)} held up`}
              accentClass="bg-kumkum-600"
              icon={<ClipboardList className="size-4" aria-hidden />}
            />
          </div>

          <div className="grid items-start gap-6 xl:grid-cols-[1.55fr_1fr]">
            <div className="flex flex-col gap-6">
              <Card>
                <CardHeader
                  title="Income against outgo"
                  description="Twelve months on one scale. Festival months lift income; procurement follows a month behind."
                />
                <IncomeOutgoChart data={data.series} />
              </Card>

              <Card>
                <CardHeader
                  title="Budget heads near the limit"
                  description="Anything above 85% of its allocation, worst first."
                  action={
                    <Link
                      to="/console/budgets"
                      className="inline-flex items-center gap-1 text-[13px] font-medium text-kumkum-700 hover:underline"
                    >
                      All budgets
                      <ArrowRight className="size-3.5" aria-hidden />
                    </Link>
                  }
                />
                {data.tight.length === 0 ? (
                  <EmptyState
                    title="All budgets are comfortable"
                    message="No head is above 85% of its allocation."
                  />
                ) : (
                  <UtilisationBars heads={data.tight} limit={6} />
                )}
              </Card>
            </div>

            <Card>
              <CardHeader
                title="Fund balances"
                description="What is held, by sector and by fund."
                action={
                  <Link
                    to="/console/allotments"
                    className="inline-flex items-center gap-1 text-[13px] font-medium text-kumkum-700 hover:underline"
                  >
                    Allot
                    <ArrowRight className="size-3.5" aria-hidden />
                  </Link>
                }
              />
              <FundDonut slices={data.funds} />
            </Card>
          </div>

          <div className="grid items-start gap-6 xl:grid-cols-2">
            <Card padded={false}>
              <div className="p-5 pb-0 sm:p-6 sm:pb-0">
                <CardHeader
                  title="Approval inbox"
                  description="Oldest first. Overdue items are flagged in red."
                  action={
                    <Link
                      to="/console/approvals"
                      className="inline-flex items-center gap-1 text-[13px] font-medium text-kumkum-700 hover:underline"
                    >
                      Open inbox
                      <ArrowRight className="size-3.5" aria-hidden />
                    </Link>
                  }
                />
              </div>
              {data.tasks.length === 0 ? (
                <div className="p-5 pt-0 sm:p-6 sm:pt-0">
                  <EmptyState
                    title="Nothing is waiting"
                    message="Every allotment, order and payment has been signed off."
                  />
                </div>
              ) : (
                <ul className="flex flex-col divide-y divide-sandal-200 border-t">
                  {data.tasks.slice(0, 6).map((task) => {
                    const due = formatDue(task.dueAt)
                    return (
                      <li key={`${task.kind}-${task.id}`}>
                        <Link
                          to={task.href}
                          className="flex items-start justify-between gap-4 px-5 py-3.5 transition-colors duration-150 hover:bg-turmeric-50 sm:px-6"
                        >
                          <div className="min-w-0">
                            <p className="truncate text-[14px] font-medium text-stone-900">{task.title}</p>
                            <p className="mt-0.5 truncate text-[13px] text-stone-500">{task.subtitle}</p>
                            <p className="mt-1.5 flex items-center gap-2">
                              <SectorChip sectorId={task.sectorId} />
                              <span className={due.overdue ? 'text-[12px] font-medium text-danger-600' : 'text-[12px] text-stone-500'}>
                                {due.label}
                              </span>
                            </p>
                          </div>
                          <Money value={task.amount} className="shrink-0 text-[15px]" />
                        </Link>
                      </li>
                    )
                  })}
                </ul>
              )}
            </Card>

            <Card padded={false}>
              <div className="p-5 pb-0 sm:p-6 sm:pb-0">
                <CardHeader
                  title="Recent activity"
                  description="Every action in the console is written to the audit log."
                  action={
                    <Link
                      to="/console/audit"
                      className="inline-flex items-center gap-1 text-[13px] font-medium text-kumkum-700 hover:underline"
                    >
                      Full audit log
                      <ArrowRight className="size-3.5" aria-hidden />
                    </Link>
                  }
                />
              </div>
              <ul className="flex flex-col divide-y divide-sandal-200 border-t">
                {data.activity.map((event) => (
                  <li
                    key={event.id}
                    className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1 px-5 py-2.5 sm:px-6"
                  >
                    <span className="min-w-0 text-[14px] text-stone-700">
                      <span className="font-medium text-stone-900">{userName(event.userId)}</span>{' '}
                      {event.action.toLowerCase()}{' '}
                      <span className="font-mono text-[13px] text-stone-900 tabular-nums">{event.entityId}</span>
                    </span>
                    <span className="shrink-0 text-[13px] text-stone-500">{formatAge(event.at)}</span>
                  </li>
                ))}
              </ul>
            </Card>
          </div>
        </div>
      )}
    </div>
  )
}
