import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { CalendarCheck, HandCoins, HeartPulse, PackageCheck, Repeat } from 'lucide-react'

import { PageHeader } from '@/components/layout/PageHeader'
import { Card, CardHeader } from '@/components/ui/Card'
import { EmptyState } from '@/components/ui/EmptyState'
import { Money } from '@/components/ui/Money'
import { Stat } from '@/components/ui/Stat'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { formatAge, formatMoney, formatNumber } from '@/lib/format'
import { gaushalaSewaById } from '@/mock/gaushala'
import { GAUSHALA_FUND_IDS, userName } from '@/mock/seed'
import { useDb } from '@/store/db'

const DAY = 24 * 60 * 60 * 1000

/**
 * The period boundaries are fixed at load. The mock database is generated once
 * per page load too, so recomputing them on every render would only make the
 * figures jitter without ever making them more current.
 */
const LOADED_AT = Date.now()
const START_OF_TODAY = (() => {
  const d = new Date(LOADED_AT)
  d.setHours(0, 0, 0, 0)
  return d.getTime()
})()
const START_OF_MONTH = (() => {
  const d = new Date(LOADED_AT)
  d.setDate(1)
  d.setHours(0, 0, 0, 0)
  return d.getTime()
})()

export function GaushalaDashboardPage() {
  const db = useDb()

  const stats = useMemo(() => {
    const now = LOADED_AT

    // Only the Gaushala's own funds. The rest of Sevalaya is not ours to count.
    const gaushalaDonations = db.donations.filter((d) => GAUSHALA_FUND_IDS.includes(d.fundId))
    const sum = (rows: typeof gaushalaDonations) => rows.reduce((t, d) => t + d.gross, 0)

    const today = gaushalaDonations.filter((d) => new Date(d.createdAt).getTime() >= START_OF_TODAY)
    const month = gaushalaDonations.filter((d) => new Date(d.createdAt).getTime() >= START_OF_MONTH)

    const awaiting = db.sewaOrders.filter((o) => o.status === 'paid')
    const assigned = db.sewaOrders.filter((o) => o.status === 'assigned')
    const living = db.cows.filter((c) => c.status !== 'deceased')
    const unwell = living.filter((c) => c.status === 'sick' || c.status === 'recovering')

    // A recurring sewa taken in the last year is counted as still running.
    const recurring = gaushalaDonations.filter((d) =>
      d.lines.some((l) => l.recurring) && now - new Date(d.createdAt).getTime() < 365 * DAY,
    )

    const vaccinationsDue = db.cowHealth.filter(
      (h) => h.nextDueAt && new Date(h.nextDueAt).getTime() - now < 30 * DAY && new Date(h.nextDueAt).getTime() > now,
    )

    return {
      today: sum(today),
      todayCount: today.length,
      month: sum(month),
      monthCount: month.length,
      awaiting,
      assigned,
      living,
      unwell,
      recurring: recurring.length,
      vaccinationsDue,
    }
  }, [db.donations, db.sewaOrders, db.cows, db.cowHealth])

  if (!db.ready) {
    return (
      <div>
        <PageHeader title="Gaushala" description="Loading the shelter's books." phase="report" />
      </div>
    )
  }

  return (
    <div>
      <PageHeader
        title="Gaushala"
        description="The cow shelter at a glance: what came in, what is waiting to be carried out, and who needs a vet."
        phase="report"
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Stat
          label="Given today"
          value={<Money value={stats.today} />}
          sub={`${stats.todayCount} ${stats.todayCount === 1 ? 'gift' : 'gifts'}`}
          accentClass="bg-turmeric-500"
          icon={<HandCoins className="size-4" aria-hidden />}
        />
        <Stat
          label="This month"
          value={<Money value={stats.month} />}
          sub={`${stats.monthCount} gifts to Gaushala funds`}
          accentClass="bg-kumkum-500"
          icon={<CalendarCheck className="size-4" aria-hidden />}
        />
        <Stat
          label="The herd"
          value={formatNumber(stats.living.length)}
          sub={
            stats.unwell.length > 0
              ? `${stats.unwell.length} under treatment`
              : 'everyone well'
          }
          accentClass="bg-tulsi-500"
          icon={<HeartPulse className="size-4" aria-hidden />}
        />
        <Stat
          label="Awaiting fulfilment"
          value={formatNumber(stats.awaiting.length)}
          sub={`${stats.assigned.length} assigned and in progress`}
          deltaMeaning="neutral"
          accentClass="bg-peacock-500"
          icon={<PackageCheck className="size-4" aria-hidden />}
        />
      </div>

      <div className="mt-6 grid gap-5 lg:grid-cols-2">
        {/* the fulfilment queue, which is the one thing that needs doing today */}
        <Card>
          <CardHeader
            title="Paid, not yet carried out"
            description="Every one of these is someone who has already given. Assign it to a caretaker."
            action={
              <Link
                to="/console/gaushala/cows"
                className="text-[13px] font-semibold text-kumkum-700 hover:underline"
              >
                Cow register
              </Link>
            }
          />
          {stats.awaiting.length === 0 ? (
            <EmptyState
              title="Nothing waiting"
              message="Every paid sewa has been assigned to someone."
            />
          ) : (
            <ul className="divide-y divide-navy-100">
              {stats.awaiting.slice(0, 6).map((order) => (
                <li key={order.id} className="flex items-center justify-between gap-4 py-3 first:pt-0">
                  <div className="min-w-0">
                    <p className="truncate text-[14px] font-semibold text-navy-950">
                      {gaushalaSewaById(order.sewaId)?.name ?? order.sewaId}
                    </p>
                    <p className="truncate text-[13px] text-navy-600">
                      {order.donorName} · {formatAge(order.placedAt)}
                    </p>
                  </div>
                  <span className="shrink-0 font-mono text-[14px] text-navy-900 tabular-nums">
                    {formatMoney(order.amount)}
                  </span>
                </li>
              ))}
            </ul>
          )}
          {stats.awaiting.length > 6 ? (
            <p className="mt-3 text-[13px] text-navy-600">
              and {stats.awaiting.length - 6} more. The full queue opens in the next release.
            </p>
          ) : null}
        </Card>

        <div className="space-y-5">
          <Card>
            <CardHeader
              title="Who needs a vet"
              description="Animals under treatment, and vaccinations falling due inside a month."
            />
            {stats.unwell.length === 0 && stats.vaccinationsDue.length === 0 ? (
              <EmptyState title="All well" message="Nothing outstanding on the health register." />
            ) : (
              <ul className="space-y-2.5">
                {stats.unwell.map((cow) => (
                  <li
                    key={cow.id}
                    className="flex items-center justify-between gap-3 rounded-xl border border-navy-100 bg-navy-50/50 px-3.5 py-2.5"
                  >
                    <span className="min-w-0">
                      <span className="block truncate text-[14px] font-semibold text-navy-950">{cow.name}</span>
                      <span className="block truncate text-[13px] text-navy-600">
                        {cow.healthNote ?? cow.breed} · {userName(cow.caretakerId)}
                      </span>
                    </span>
                    <StatusBadge status={cow.status} />
                  </li>
                ))}
                {stats.vaccinationsDue.length > 0 ? (
                  <li className="px-1 pt-1 text-[13px] text-navy-600">
                    {stats.vaccinationsDue.length} vaccination
                    {stats.vaccinationsDue.length === 1 ? '' : 's'} fall due in the next 30 days.
                  </li>
                ) : null}
              </ul>
            )}
          </Card>

          <Card>
            <CardHeader title="Recurring sewas" description="Gau Grass and monthly care, still running." />
            <div className="flex items-center gap-3">
              <span className="flex size-11 items-center justify-center rounded-xl border border-navy-100 bg-navy-50 text-navy-600">
                <Repeat className="size-5" aria-hidden />
              </span>
              <div>
                <p className="font-heritage text-[28px] leading-none font-bold text-navy-950">
                  {formatNumber(stats.recurring)}
                </p>
                <p className="mt-1 text-[13px] text-navy-600">
                  taken in the last twelve months
                </p>
              </div>
            </div>
            <p className="mt-4 text-[13px] leading-relaxed text-navy-600">
              Gateway-backed subscriptions, renewals and failed-payment handling arrive with Phase 2. These are the
              recurring sewas taken through the ordinary checkout so far.
            </p>
          </Card>
        </div>
      </div>
    </div>
  )
}
