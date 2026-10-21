import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search } from 'lucide-react'

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
import { inSector } from '@/store/selectors'
import { useSession } from '@/store/session'
import { summarise, type EventSummary } from './eventSummary'

const GROUPS = [
  { id: 'all', label: 'All', match: () => true },
  { id: 'draft', label: 'Being prepared', match: (s: string) => s === 'draft' },
  { id: 'review', label: 'In approval', match: (s: string) => s === 'budget_submitted' || s === 'budget_ca_ok' },
  { id: 'approved', label: 'Approved', match: (s: string) => !['draft', 'budget_submitted', 'budget_ca_ok', 'cancelled'].includes(s) },
]

/** Budgets and financial planning: every event's suggested, requested, approved, committed and spent amounts side by side. */
export function BudgetsPlanningPage() {
  const db = useDb()
  const filter = useSession((s) => s.sectorFilter)
  const navigate = useNavigate()
  const [tab, setTab] = useState('all')
  const [query, setQuery] = useState('')

  const rows = useMemo(() => (db.ready ? inSector(db.events, filter).filter((e) => e.status !== 'cancelled').map((e) => summarise(db, e)) : []), [db, filter])
  const shown = rows.filter((r) => GROUPS.find((g) => g.id === tab)!.match(r.event.status) && (query.trim() === '' || r.event.name.toLowerCase().includes(query.trim().toLowerCase())))
  const total = (k: 'requested' | 'approved' | 'committed' | 'spent') => rows.reduce((s, r) => s + r[k], 0)

  const columns: Column<EventSummary>[] = [
    { key: 'name', header: 'Event', primary: true, cell: (r) => (<div><p className="text-stone-900">{r.event.name}</p><p className="text-[13px] text-stone-500">{r.event.venue}</p></div>) },
    { key: 'sector', header: 'Sector', hideOnMobile: true, cell: (r) => <SectorChip sectorId={r.event.sectorId} /> },
    { key: 'status', header: 'Lifecycle', cell: (r) => <StatusBadge status={r.event.status} /> },
    { key: 'sug', header: 'Suggested', align: 'right', hideOnMobile: true, cell: (r) => (r.suggested > 0 ? <Money value={r.suggested} tone="muted" /> : <span className="text-stone-500">—</span>) },
    { key: 'req', header: 'Requested', align: 'right', cell: (r) => <Money value={r.requested} /> },
    { key: 'app', header: 'Approved', align: 'right', cell: (r) => (r.approved > 0 ? <Money value={r.approved} tone="in" /> : <span className="text-stone-500">Pending</span>) },
    { key: 'spent', header: 'Spent', align: 'right', hideOnMobile: true, cell: (r) => <Money value={r.spent} tone="out" /> },
  ]

  return (
    <div>
      <PageHeader
        title="Budgets and financial planning"
        description="Every event budget in one table: what was asked for, what a CA approved, and what has actually been paid. Open a row for the line-by-line workspace."
      >
        <div className="flex flex-col gap-3">
          <Tabs value={tab} onChange={setTab} items={GROUPS.map((g) => ({ id: g.id, label: g.label, count: rows.filter((r) => g.match(r.event.status)).length }))} />
          <Input aria-label="Search events" placeholder="Search events" value={query} onChange={(e) => setQuery(e.target.value)} leading={<Search className="size-4" aria-hidden />} />
        </div>
      </PageHeader>

      {!db.ready ? <TableSkeleton rows={8} cols={7} /> : (
        <div className="flex flex-col gap-6">
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <Stat label="Requested" value={<Money value={total('requested')} />} accentClass="bg-turmeric-500" />
            <Stat label="Approved" value={<Money value={total('approved')} tone="in" />} accentClass="bg-tulsi-500" />
            <Stat label="Committed" value={<Money value={total('committed')} />} sub="orders approved or waiting" accentClass="bg-marigold-500" />
            <Stat label="Spent" value={<Money value={total('spent')} tone="out" />} sub="paid orders only" accentClass="bg-kumkum-600" />
          </div>
          {shown.length === 0 ? <EmptyState title="No events match" message="Clear the search or pick another group." /> : <Table columns={columns} rows={shown} rowKey={(r) => r.event.id} onRowClick={(r) => navigate(`/console/events/${r.event.id}?tab=budget`)} />}
        </div>
      )}
    </div>
  )
}
