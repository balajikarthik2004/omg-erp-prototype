import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { CalendarDays, Plus, Radio, Search, Wallet } from 'lucide-react'

import { formatDate } from '@/lib/format'
import { Button } from '@/components/ui/Button'
import { EmptyState } from '@/components/ui/EmptyState'
import { Input } from '@/components/ui/Input'
import { Money } from '@/components/ui/Money'
import { Stat } from '@/components/ui/Stat'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { Table, type Column } from '@/components/ui/Table'
import { TableSkeleton } from '@/components/ui/Skeleton'
import { Tabs } from '@/components/ui/Tabs'
import { PageHeader } from '@/components/layout/PageHeader'
import { SectorChip } from '@/components/layout/PhaseChip'
import { useDb } from '@/store/db'
import { approvalTasks, inSector } from '@/store/selectors'
import { useSession } from '@/store/session'
import type { EventRecord, EventStatus } from '@/types'
import { CreateEventDrawer } from './CreateEventDrawer'
import { seatsTaken } from './logic/rules'

const GROUPS: { id: string; label: string; statuses: EventStatus[] | null }[] = [
  { id: 'all', label: 'All', statuses: null },
  { id: 'planning', label: 'Planning', statuses: ['draft', 'budget_submitted', 'budget_ca_ok', 'budget_approved'] },
  { id: 'ready', label: 'Confirmed', statuses: ['confirmed', 'poster_pending'] },
  { id: 'public', label: 'Public and live', statuses: ['published', 'live'] },
  { id: 'done', label: 'Finished', statuses: ['completed', 'closed', 'cancelled'] },
]

const RANK: Record<EventStatus, number> = {
  live: 0, published: 1, poster_pending: 2, confirmed: 3, budget_approved: 4, budget_ca_ok: 5, budget_submitted: 6,
  draft: 7, completed: 8, closed: 9, cancelled: 10,
}

/** Every event, from first draft to closed books. */
export function EventsPage() {
  const db = useDb()
  const filter = useSession((s) => s.sectorFilter)
  const navigate = useNavigate()
  const [tab, setTab] = useState('all')
  const [query, setQuery] = useState('')
  const [creating, setCreating] = useState(false)

  const all = useMemo(() => inSector(db.events, filter), [db.events, filter])
  const rows = useMemo(() => {
    const group = GROUPS.find((g) => g.id === tab)!
    const q = query.trim().toLowerCase()
    return all
      .filter((e) => (group.statuses ? group.statuses.includes(e.status) : true) && (q === '' || e.name.toLowerCase().includes(q) || e.venue.toLowerCase().includes(q)))
      .sort((a, b) => RANK[a.status] - RANK[b.status] || a.startAt.localeCompare(b.startAt))
  }, [all, tab, query])

  const waiting = db.ready ? approvalTasks(db, filter).filter((t) => t.kind.startsWith('event_')).length : 0
  const live = all.filter((e) => e.status === 'live').length
  const held = db.funds.filter((f) => f.eventId && all.some((e) => e.id === f.eventId && e.status !== 'closed' && e.status !== 'cancelled')).reduce((s, f) => s + f.balance, 0)

  const lineTotal = (id: string, key: 'approvedAmount' | 'requestedAmount') =>
    db.eventBudgetLines.filter((l) => l.eventId === id).reduce((s, l) => s + (l[key] ?? 0), 0)

  const columns: Column<EventRecord>[] = [
    {
      key: 'name',
      header: 'Event',
      primary: true,
      cell: (e) => (
        <div>
          <p className="text-stone-900">{e.name}</p>
          <p className="text-[13px] text-stone-500">{e.venue}</p>
        </div>
      ),
    },
    { key: 'sector', header: 'Sector', cell: (e) => <SectorChip sectorId={e.sectorId} /> },
    { key: 'when', header: 'Date', cell: (e) => <span className="font-mono text-[13px] tabular-nums">{formatDate(e.startAt)}</span> },
    { key: 'status', header: 'Status', cell: (e) => <StatusBadge status={e.status} /> },
    {
      key: 'budget',
      header: 'Budget',
      align: 'right',
      hideOnMobile: true,
      cell: (e) => {
        const approved = lineTotal(e.id, 'approvedAmount')
        return approved > 0 ? <Money value={approved} /> : <Money value={lineTotal(e.id, 'requestedAmount')} tone="muted" />
      },
    },
    {
      key: 'seats',
      header: 'Tickets',
      align: 'right',
      cell: (e) => {
        const taken = seatsTaken(db, e.id)
        return e.status === 'published' || e.status === 'live' || e.status === 'completed' || e.status === 'closed' ? (
          <span className="font-mono text-[13px] tabular-nums">
            {taken}
            {e.capacity ? ` / ${e.capacity}` : ''}
          </span>
        ) : (
          <span className="text-stone-500">—</span>
        )
      },
    },
  ]

  return (
    <div>
      <PageHeader title="Events">
        <div className="flex flex-col gap-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <Tabs
              value={tab}
              onChange={setTab}
              items={GROUPS.map((g) => ({
                id: g.id,
                label: g.label,
                count: g.statuses ? all.filter((e) => g.statuses!.includes(e.status)).length : all.length,
              }))}
            />
            <Button icon={<Plus className="size-4" aria-hidden />} onClick={() => setCreating(true)}>
              New event
            </Button>
          </div>
          <Input
            aria-label="Search events"
            placeholder="Search by name or venue"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            leading={<Search className="size-4" aria-hidden />}
          />
        </div>
      </PageHeader>

      {!db.ready ? (
        <TableSkeleton rows={8} cols={6} />
      ) : (
        <div className="flex flex-col gap-6">
          <div className="grid gap-4 sm:grid-cols-3">
            <Stat label="Waiting on an approver" value={waiting} sub="budgets, posters and orders" accentClass="bg-marigold-500" icon={<CalendarDays className="size-4" aria-hidden />} />
            <Stat label="Live now" value={live} accentClass="bg-tulsi-500" icon={<Radio className="size-4" aria-hidden />} />
            <Stat label="Held in event funds" value={<Money value={held} />} sub="set aside for events still running" accentClass="bg-turmeric-500" icon={<Wallet className="size-4" aria-hidden />} />
          </div>

          {rows.length === 0 ? (
            <EmptyState
              icon={<CalendarDays className="size-6" aria-hidden />}
              title={all.length === 0 ? 'No events yet' : 'No events match'}
              message={all.length === 0 ? 'Create the first event. It starts as a draft, and the budget comes next.' : 'Clear the search or pick another group.'}
              action={all.length === 0 ? <Button onClick={() => setCreating(true)}>New event</Button> : undefined}
            />
          ) : (
            <Table columns={columns} rows={rows} rowKey={(e) => e.id} onRowClick={(e) => navigate(`/console/events/${e.id}`)} />
          )}
        </div>
      )}

      <CreateEventDrawer open={creating} onClose={() => setCreating(false)} />
    </div>
  )
}
