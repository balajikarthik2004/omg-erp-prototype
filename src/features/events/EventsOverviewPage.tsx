import { useMemo } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ArrowRight, CalendarDays, ClipboardCheck, Radio, Users } from 'lucide-react'

import { formatDate } from '@/lib/format'
import { Button } from '@/components/ui/Button'
import { Card, CardHeader } from '@/components/ui/Card'
import { EmptyState } from '@/components/ui/EmptyState'
import { Money } from '@/components/ui/Money'
import { Skeleton } from '@/components/ui/Skeleton'
import { Stat } from '@/components/ui/Stat'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { PageHeader } from '@/components/layout/PageHeader'
import { SectorChip } from '@/components/layout/PhaseChip'
import { BudgetBar } from '@/components/flow/BudgetBar'
import { useDb } from '@/store/db'
import { approvalTasks, inSector } from '@/store/selectors'
import { useSession } from '@/store/session'
import { summarise } from './eventSummary'

/** The Events front page: what is coming, what is waiting on a person, and how the event money is being used. */
export function EventsOverviewPage() {
  const db = useDb()
  const filter = useSession((s) => s.sectorFilter)
  const navigate = useNavigate()

  const data = useMemo(() => {
    if (!db.ready) return null
    const all = inSector(db.events, filter)
    const running = all.filter((e) => !['closed', 'cancelled'].includes(e.status))
    const rows = running.map((e) => summarise(db, e))
    return {
      all,
      running: running.sort((a, b) => a.startAt.localeCompare(b.startAt)),
      live: all.filter((e) => e.status === 'live').length,
      upcoming: all.filter((e) => ['published', 'confirmed', 'poster_pending'].includes(e.status)).length,
      completed: all.filter((e) => e.status === 'completed' || e.status === 'closed').length,
      seats: rows.filter((r) => ['published', 'live'].includes(r.event.status)).reduce((s, r) => s + r.seats, 0),
      approvedTotal: rows.reduce((s, r) => s + r.approved, 0),
      committed: rows.reduce((s, r) => s + r.committed, 0),
      spent: rows.reduce((s, r) => s + r.spent, 0),
      tasks: approvalTasks(db, filter).filter((t) => t.kind.startsWith('event_')),
    }
  }, [db, filter])

  if (!data) return <Skeleton className="h-96 w-full" />

  return (
    <div>
      <PageHeader title="Events overview" actions={<Link to="/console/events"><Button variant="secondary" rightIcon={<ArrowRight className="size-4" aria-hidden />}>All events</Button></Link>} />

      <div className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Stat label="Total events" value={data.all.length} sub={`${data.upcoming} upcoming · ${data.live} live · ${data.completed} completed`} accentClass="bg-turmeric-500" icon={<CalendarDays className="size-4" aria-hidden />} />
        <Stat label="Live now" value={data.live} accentClass="bg-tulsi-500" icon={<Radio className="size-4" aria-hidden />} />
        <Stat label="Pending approvals" value={data.tasks.length} sub={<Link to="/console/events/approvals" className="text-kumkum-700 hover:underline">Open the Approval Center</Link>} accentClass="bg-marigold-500" icon={<ClipboardCheck className="size-4" aria-hidden />} />
        <Stat label="Active registrations" value={data.seats} sub="seats across public events" accentClass="bg-peacock-500" icon={<Users className="size-4" aria-hidden />} />
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.4fr_1fr] xl:items-start">
        <Card>
          <CardHeader title="Upcoming and active" description="Events still running, soonest first." />
          {data.running.length === 0 ? (
            <div className="mt-4"><EmptyState title="No events are running" message="Create the first event from All events." /></div>
          ) : (
            <ul className="mt-3 divide-y divide-sandal-200">
              {data.running.slice(0, 7).map((e) => (
                <li key={e.id}>
                  <button type="button" onClick={() => navigate(`/console/events/${e.id}`)} className="flex w-full items-center justify-between gap-3 py-3 text-left transition-colors duration-150 hover:bg-sandal-100">
                    <span className="min-w-0">
                      <span className="block truncate text-[15px] text-stone-900">{e.name}</span>
                      <span className="mt-0.5 flex flex-wrap items-center gap-2 text-[13px] text-stone-500">{formatDate(e.startAt)} · {e.venue}<SectorChip sectorId={e.sectorId} /></span>
                    </span>
                    <StatusBadge status={e.status} />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <div className="flex flex-col gap-6">
          <Card>
            <CardHeader title="Pending approvals" action={<Link to="/console/events/approvals" className="text-[13px] text-kumkum-700 hover:underline">View all</Link>} />
            {data.tasks.length === 0 ? (
              <p className="mt-3 text-[14px] text-stone-500">Nothing is waiting.</p>
            ) : (
              <ul className="mt-3 divide-y divide-sandal-200">
                {data.tasks.slice(0, 5).map((t) => (
                  <li key={`${t.kind}-${t.id}`}>
                    <Link to={t.href} className="flex items-start justify-between gap-3 py-2.5 hover:bg-sandal-100">
                      <span className="min-w-0 text-[14px]"><span className="block truncate text-stone-900">{t.title}</span><span className="block truncate text-[12px] text-stone-500">{t.subtitle}</span></span>
                      {t.amount > 0 ? <Money value={t.amount} className="shrink-0 text-[14px]" /> : null}
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </Card>

          <Card>
            <CardHeader title="Budget utilisation" description="Approved event budgets, for events still running." />
            <div className="mt-4"><BudgetBar head={{ id: 'events', sectorId: 'temple', name: 'Events', period: '', fundId: '', allocated: data.approvedTotal, committed: data.committed - 0, spent: data.spent }} showLegend /></div>
            <p className="mt-3 text-[13px] text-stone-500">Approved <Money value={data.approvedTotal} className="text-[13px]" />. Spent counts only paid orders.</p>
          </Card>
        </div>
      </div>
    </div>
  )
}
