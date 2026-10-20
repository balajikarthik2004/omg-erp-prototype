import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { CalendarCheck, CalendarDays, ExternalLink, HandCoins, HandHeart, HeartPulse, PackageCheck, Repeat, ShieldCheck } from 'lucide-react'

import { PageHeader } from '@/components/layout/PageHeader'
import { Card, CardHeader } from '@/components/ui/Card'
import { EmptyState } from '@/components/ui/EmptyState'
import { Money } from '@/components/ui/Money'
import { Stat } from '@/components/ui/Stat'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { formatAge, formatMoneyShort, formatNumber } from '@/lib/format'
import { relativeToNow } from '@/lib/zone'
import { cn } from '@/lib/cn'
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

    // The five programmes, at a glance.
    const today0 = new Date(START_OF_TODAY).toISOString().slice(0, 10)
    const activeAdoptions = db.adoptions.filter((a) => a.status === 'active')
    const renewalsDue = activeAdoptions.filter(
      (a) => new Date(a.renewsAt).getTime() - now < 30 * DAY,
    )
    const lapsedAdoptions = db.adoptions.filter((a) => a.status === 'lapsed')
    const todaysBookings = db.bookings.filter((b) => {
      const slot = db.slots.find((sl) => sl.id === b.slotId)
      return slot?.date === today0 && b.status !== 'cancelled'
    })
    const pendingBookings = db.bookings.filter((b) => b.status === 'pending')
    const nextFestival = db.gaushalaEvents
      .filter((e) => new Date(e.startAt).getTime() >= now && e.status !== 'cancelled')
      .sort((a, b) => a.startAt.localeCompare(b.startAt))[0]
    const pendingVolunteers = db.volunteers.filter((v) => v.status === 'pending')

    return {
      activeAdoptions,
      renewalsDue,
      lapsedAdoptions,
      todaysBookings,
      pendingBookings,
      nextFestival,
      pendingVolunteers,
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
  }, [
    db.donations,
    db.sewaOrders,
    db.cows,
    db.cowHealth,
    db.adoptions,
    db.bookings,
    db.slots,
    db.gaushalaEvents,
    db.volunteers,
  ])

  if (!db.ready) {
    return (
      <div>
        <PageHeader title="Gaushala" />
      </div>
    )
  }

  return (
    <div>
      <PageHeader
        title="Gaushala"
        description="The herd, the money given for it, and what is waiting on someone today."
        actions={
          <a
            href="/sevalaya/gaushala?tab=transparency"
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1.5 rounded-lg border border-sandal-200 bg-sandal-50 px-3 py-2 text-[13px] font-semibold text-stone-700 transition-colors duration-150 hover:border-sandal-300 hover:bg-sandal-100 focus-visible:ring-2 focus-visible:ring-navy-400 focus-visible:outline-none"
          >
            <ShieldCheck className="size-4 text-tulsi-700" aria-hidden />
            Public transparency page
            <ExternalLink className="size-3.5 text-stone-500" aria-hidden />
          </a>
        }
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

      <section className="mt-6">
        <h2 className="mb-3 font-heritage text-[18px] font-bold text-navy-950">The programmes</h2>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <ProgramTile
            to="/console/gaushala/adoptions"
            icon={<HeartPulse className="size-4" aria-hidden />}
            label="Adoptions"
            value={formatNumber(stats.activeAdoptions.length)}
            sub={
              stats.lapsedAdoptions.length > 0
                ? `${stats.lapsedAdoptions.length} lapsed, ${stats.renewalsDue.length} renewing soon`
                : `${stats.renewalsDue.length} renewing within 30 days`
            }
            warn={stats.lapsedAdoptions.length > 0}
          />
          <ProgramTile
            to="/console/gaushala/bookings"
            icon={<CalendarCheck className="size-4" aria-hidden />}
            label="Visits today"
            value={formatNumber(stats.todaysBookings.reduce((t, b) => t + b.people, 0))}
            sub={
              stats.pendingBookings.length > 0
                ? `${stats.pendingBookings.length} group request${stats.pendingBookings.length === 1 ? '' : 's'} to approve`
                : `${stats.todaysBookings.length} bookings`
            }
            warn={stats.pendingBookings.length > 0}
          />
          <ProgramTile
            to="/console/gaushala/events"
            icon={<CalendarDays className="size-4" aria-hidden />}
            label="Next festival"
            value={stats.nextFestival ? stats.nextFestival.name : '—'}
            sub={
              stats.nextFestival
                ? `${relativeToNow(stats.nextFestival.startAt)} · ${stats.nextFestival.registered} registered`
                : 'nothing on the calendar'
            }
            small
          />
          <ProgramTile
            to="/console/gaushala/volunteers"
            icon={<HandHeart className="size-4" aria-hidden />}
            label="Volunteers"
            value={formatNumber(stats.pendingVolunteers.length)}
            sub={
              stats.pendingVolunteers.length > 0
                ? 'applications waiting to hear back'
                : 'nothing waiting on a reply'
            }
            warn={stats.pendingVolunteers.length > 0}
          />
        </div>
      </section>

      <div className="mt-6 grid gap-5 lg:grid-cols-2">
        {/* the fulfilment queue, which is the one thing that needs doing today */}
        <Card>
          <CardHeader
            title="Paid, not yet carried out"
            description="Every one of these is someone who has already given. Assign it to a caretaker."
            action={
              <Link
                to="/console/gaushala/cows"
                className="text-[13px] font-semibold text-navy-600 hover:text-navy-800 hover:underline"
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
                    {formatMoneyShort(order.amount)}
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
                    className="flex items-center justify-between gap-3 rounded-xl border border-navy-100 bg-navy-50 px-3.5 py-2.5"
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

/**
 * One programme, with the number that decides whether anyone has to act on it
 * today. Every tile is a link, because the only useful next step is the page
 * behind it.
 */
function ProgramTile({
  to,
  icon,
  label,
  value,
  sub,
  warn,
  small,
}: {
  to: string
  icon: React.ReactNode
  label: string
  value: string
  sub: string
  warn?: boolean
  small?: boolean
}) {
  return (
    <Link
      to={to}
      className={cn(
        'group block rounded-2xl border-2 bg-sandal-50 p-5 shadow-card transition-all duration-200',
        'hover:-translate-y-0.5 hover:shadow-lift',
        warn ? 'border-marigold-50' : 'border-navy-100/90',
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <p className="text-[11.5px] font-extrabold tracking-[0.14em] text-navy-700 uppercase">{label}</p>
        <span
          className={cn(
            'flex size-8 items-center justify-center rounded-xl border shadow-2xs',
            warn ? 'border-marigold-50 bg-marigold-50 text-marigold-500' : 'border-navy-100 bg-navy-50 text-navy-600',
          )}
        >
          {icon}
        </span>
      </div>
      <p
        className={cn(
          'mt-3 font-heritage font-bold text-navy-950 leading-tight',
          small ? 'text-[18px]' : 'text-[30px] leading-none',
        )}
      >
        {value}
      </p>
      <p className="mt-2 text-[12.5px] leading-relaxed text-navy-600">{sub}</p>
    </Link>
  )
}
