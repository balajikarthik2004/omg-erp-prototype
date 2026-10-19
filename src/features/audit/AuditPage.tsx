import { useMemo, useState } from 'react'
import { format, isToday, isYesterday, parseISO } from 'date-fns'
import { ArrowRight, History, Lock, Search, Users } from 'lucide-react'

import { ROLE_LABEL, USERS } from '@/mock/seed'
import { formatDateTime, initials } from '@/lib/format'
import { cn } from '@/lib/cn'
import { Button } from '@/components/ui/Button'
import { EmptyState } from '@/components/ui/EmptyState'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { Stat } from '@/components/ui/Stat'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { Skeleton } from '@/components/ui/Skeleton'
import { PageHeader } from '@/components/layout/PageHeader'
import { SectorChip } from '@/components/layout/PhaseChip'
import { useDb } from '@/store/db'
import { useSession } from '@/store/session'
import type { AuditEvent } from '@/types'

const PAGE_SIZE = 25

type Range = 'all' | '7d' | '30d' | '90d'

const RANGE_DAYS: Record<Range, number | null> = { all: null, '7d': 7, '30d': 30, '90d': 90 }

/** "Today", "Yesterday", then the date — how a log is read back. */
function dayLabel(iso: string): string {
  const date = parseISO(iso)
  if (isToday(date)) return 'Today'
  if (isYesterday(date)) return 'Yesterday'
  return format(date, 'EEEE, d MMM yyyy')
}

export function AuditPage() {
  const db = useDb()
  const filter = useSession((s) => s.sectorFilter)
  const [query, setQuery] = useState('')
  const [userId, setUserId] = useState('all')
  const [range, setRange] = useState<Range>('all')
  const [page, setPage] = useState(0)

  const reset = () => {
    setQuery('')
    setUserId('all')
    setRange('all')
    setPage(0)
  }

  const inScope = useMemo(
    () => db.audit.filter((e) => filter === 'all' || e.sectorId === filter),
    [db.audit, filter],
  )

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase()
    const days = RANGE_DAYS[range]
    const cutoff = days === null ? null : Date.now() - days * 86_400_000
    return inScope.filter((event) => {
      if (userId !== 'all' && event.userId !== userId) return false
      if (cutoff !== null && parseISO(event.at).getTime() < cutoff) return false
      if (q === '') return true
      return (
        event.action.toLowerCase().includes(q) ||
        event.entity.toLowerCase().includes(q) ||
        event.entityId.toLowerCase().includes(q) ||
        event.userName.toLowerCase().includes(q)
      )
    })
  }, [inScope, userId, query, range])

  const paged = rows.slice(page * PAGE_SIZE, page * PAGE_SIZE + PAGE_SIZE)

  // One heading per day, so a reader never reads the same date twice.
  const days = useMemo(() => {
    const groups: { label: string; events: AuditEvent[] }[] = []
    for (const event of paged) {
      const label = dayLabel(event.at)
      const last = groups.at(-1)
      if (last && last.label === label) last.events.push(event)
      else groups.push({ label, events: [event] })
    }
    return groups
  }, [paged])

  const todayCount = inScope.filter((e) => isToday(parseISO(e.at))).length
  const people = new Set(inScope.map((e) => e.userId)).size

  return (
    <div>
      <PageHeader
        title="Audit log"
        description="Every action anyone has taken, with who did it, when, and what changed. The log is written once and never edited — it is the record the books are defended with."
        actions={
          <span className="inline-flex items-center gap-1.5 rounded-full border border-sandal-200 bg-sandal-50 px-3 py-1 text-[12px] font-semibold text-stone-700 shadow-2xs">
            <Lock className="size-3.5 text-stone-500" aria-hidden />
            Append-only
          </span>
        }
      >
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-[1fr_200px_180px]">
          <Input
            aria-label="Search the audit log"
            placeholder="Search action, reference or person"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value)
              setPage(0)
            }}
            leading={<Search className="size-4 text-stone-500" aria-hidden />}
          />
          <Select
            aria-label="Filter by person"
            value={userId}
            onChange={(e) => {
              setUserId(e.target.value)
              setPage(0)
            }}
            options={[
              { value: 'all', label: 'Everyone' },
              ...USERS.filter((u) => u.role !== 'devotee').map((u) => ({ value: u.id, label: u.name })),
            ]}
          />
          <Select
            aria-label="Filter by period"
            value={range}
            onChange={(e) => {
              setRange(e.target.value as Range)
              setPage(0)
            }}
            options={[
              { value: 'all', label: 'All time' },
              { value: '7d', label: 'Last 7 days' },
              { value: '30d', label: 'Last 30 days' },
              { value: '90d', label: 'Last 90 days' },
            ]}
          />
        </div>
      </PageHeader>

      {!db.ready ? (
        <div className="flex flex-col gap-3">
          {Array.from({ length: 10 }).map((_, i) => (
            <Skeleton key={i} className="h-16 w-full" />
          ))}
        </div>
      ) : (
        <div className="flex flex-col gap-6">
          <div className="grid gap-4 sm:grid-cols-3">
            <Stat
              label="Events recorded"
              value={inScope.length.toLocaleString()}
              sub="none of them editable"
              accentClass="bg-peacock-500"
              icon={<History className="size-4" aria-hidden />}
            />
            <Stat
              label="Today"
              value={todayCount}
              sub="actions since midnight"
              accentClass="bg-turmeric-500"
            />
            <Stat
              label="People active"
              value={people}
              sub="appear in this log"
              accentClass="bg-navy-600"
              icon={<Users className="size-4" aria-hidden />}
            />
          </div>

          {rows.length === 0 ? (
            <EmptyState
              title="No events match"
              message="Try a different person or period, or clear the search box."
              action={
                <Button variant="secondary" onClick={reset}>
                  Clear filters
                </Button>
              }
            />
          ) : (
            <>
              <div className="flex flex-col gap-5">
                {days.map((day) => (
                  <section key={day.label}>
                    <div className="mb-2 flex items-baseline gap-2">
                      <h2 className="text-[11px] font-bold uppercase tracking-[0.12em] text-stone-500">{day.label}</h2>
                      <span className="h-px flex-1 bg-sandal-200" aria-hidden />
                      <span className="font-mono text-[11.5px] tabular-nums text-stone-500">
                        {day.events.length} event{day.events.length === 1 ? '' : 's'}
                      </span>
                    </div>
                    <ul className="overflow-hidden rounded-card border border-sandal-200 bg-sandal-50 shadow-flat">
                      {day.events.map((event, i) => (
                        <li key={event.id}>
                          <AuditRow event={event} first={i === 0} />
                        </li>
                      ))}
                    </ul>
                  </section>
                ))}
              </div>

              <nav className="flex flex-col items-center justify-between gap-3 sm:flex-row" aria-label="Pagination">
                <p className="text-[13px] text-stone-500">
                  Showing {page * PAGE_SIZE + 1}–{Math.min(rows.length, (page + 1) * PAGE_SIZE)} of{' '}
                  {rows.length.toLocaleString()}
                </p>
                <div className="flex items-center gap-2">
                  <Button size="sm" variant="secondary" disabled={page === 0} onClick={() => setPage((p) => p - 1)}>
                    Previous
                  </Button>
                  <span className="px-1 text-[12.5px] font-medium text-stone-500">
                    Page {page + 1} of {Math.max(1, Math.ceil(rows.length / PAGE_SIZE))}
                  </span>
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
      )}
    </div>
  )
}

/**
 * One entry, read as a sentence: who, what they did, and to which record.
 * The time leads in a fixed column so the left edge stays a clock, and the
 * before/after sits at the end where a reader checks it last.
 */
function AuditRow({ event, first }: { event: AuditEvent; first: boolean }) {
  return (
    <div
      className={cn(
        'flex flex-wrap items-start gap-x-3 gap-y-2 px-3 py-2.5 transition-colors hover:bg-sandal-100 sm:flex-nowrap sm:px-4',
        !first && 'border-t border-sandal-200',
      )}
      title={formatDateTime(event.at)}
    >
      <span className="w-13 shrink-0 pt-0.5 font-mono text-[12.5px] tabular-nums text-stone-500">
        {format(parseISO(event.at), 'HH:mm')}
      </span>

      <span
        className="flex size-7 shrink-0 items-center justify-center rounded-full bg-navy-50 font-mono text-[11px] font-bold text-navy-700 ring-1 ring-navy-100"
        aria-hidden
      >
        {initials(event.userName)}
      </span>

      <span className="min-w-0 flex-1">
        <span className="block text-[14px] leading-snug text-stone-900">
          <span className="font-semibold">{event.userName}</span>
          <span className="text-stone-500"> · {ROLE_LABEL[event.role]}</span>
        </span>
        <span className="block text-[14px] leading-snug text-stone-700">{event.action}</span>
        <span className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-1">
          <span className="font-mono text-[12px] tabular-nums text-stone-900">{event.entityId}</span>
          <span className="text-[12px] text-stone-500">{event.entity}</span>
          {event.sectorId ? <SectorChip sectorId={event.sectorId} /> : null}
        </span>
      </span>

      {event.before || event.after ? (
        <span className="flex shrink-0 items-center gap-1.5 pt-0.5">
          {event.before ? <StatusBadge status={event.before} compact /> : null}
          {event.before && event.after ? (
            <ArrowRight className="size-3 shrink-0 text-stone-500" aria-hidden />
          ) : null}
          {event.after ? <StatusBadge status={event.after} compact /> : null}
        </span>
      ) : null}
    </div>
  )
}
