import { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { FileDown, Table2 } from 'lucide-react'

import { toast } from '@/lib/toast'
import { Button } from '@/components/ui/Button'
import { EmptyState } from '@/components/ui/EmptyState'
import { Money } from '@/components/ui/Money'
import { Stat } from '@/components/ui/Stat'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { Table, type Column } from '@/components/ui/Table'
import { TableSkeleton } from '@/components/ui/Skeleton'
import { PageHeader } from '@/components/layout/PageHeader'
import { SectorChip } from '@/components/layout/PhaseChip'
import { useDb } from '@/store/db'
import { inSector } from '@/store/selectors'
import { useSession } from '@/store/session'
import { summarise, type EventSummary } from './eventSummary'

/** Profit and loss for every event. A closed event shows the figures locked at close; the others show them so far. */
export function EventReportsPage() {
  const db = useDb()
  const filter = useSession((s) => s.sectorFilter)
  const navigate = useNavigate()

  const rows = useMemo(
    () => (db.ready ? inSector(db.events, filter).filter((e) => !['draft', 'cancelled', 'budget_submitted', 'budget_ca_ok', 'budget_approved'].includes(e.status)).map((e) => summarise(db, e)) : []),
    [db, filter],
  )
  const sum = (k: 'cashIn' | 'spent' | 'net') => rows.reduce((s, r) => s + r[k], 0)

  const columns: Column<EventSummary>[] = [
    { key: 'name', header: 'Event', primary: true, cell: (r) => <span className="text-stone-900">{r.event.name}</span> },
    { key: 'sector', header: 'Sector', hideOnMobile: true, cell: (r) => <SectorChip sectorId={r.event.sectorId} /> },
    { key: 'status', header: 'Status', cell: (r) => <StatusBadge status={r.event.status} /> },
    { key: 'budget', header: 'Approved budget', align: 'right', hideOnMobile: true, cell: (r) => <Money value={r.approved} /> },
    { key: 'in', header: 'Cash in', align: 'right', cell: (r) => <Money value={r.event.closurePnl ? r.event.closurePnl.ticketIncome + r.event.closurePnl.sponsorIncome + r.event.closurePnl.donationIncome : r.cashIn} tone="in" /> },
    { key: 'out', header: 'Paid out', align: 'right', cell: (r) => <Money value={r.event.closurePnl?.expenses ?? r.spent} tone="out" /> },
    { key: 'net', header: 'Profit / loss', align: 'right', primary: true, cell: (r) => <Money value={r.event.closurePnl?.net ?? r.net} signed tone={(r.event.closurePnl?.net ?? r.net) >= 0 ? 'in' : 'out'} /> },
  ]

  return (
    <div>
      <PageHeader
        phase="report"
        title="Event financial reports"
        description="Cash in from tickets, cash sponsors and donations, less what was paid out. In-kind sponsorship is never counted as cash."
        actions={<div className="flex gap-2"><Button variant="secondary" icon={<Table2 className="size-4" aria-hidden />} onClick={() => toast.info('Coming in the next build', 'Excel export runs against the live ledger.')}>Export to Excel</Button><Button variant="secondary" icon={<FileDown className="size-4" aria-hidden />} onClick={() => toast.info('Coming in the next build', 'PDF reports are rendered server-side.')}>Export to PDF</Button></div>}
      />
      {!db.ready ? <TableSkeleton rows={6} cols={7} /> : (
        <div className="flex flex-col gap-6">
          <div className="grid gap-4 sm:grid-cols-3">
            <Stat label="Cash in" value={<Money value={sum('cashIn')} tone="in" />} accentClass="bg-tulsi-500" />
            <Stat label="Paid out" value={<Money value={sum('spent')} tone="out" />} accentClass="bg-kumkum-600" />
            <Stat label={sum('net') >= 0 ? 'Net profit' : 'Net loss'} value={<Money value={Math.abs(sum('net'))} tone={sum('net') >= 0 ? 'in' : 'out'} />} accentClass={sum('net') >= 0 ? 'bg-tulsi-500' : 'bg-danger-600'} />
          </div>
          {rows.length === 0 ? <EmptyState title="No event has money moving yet" message="Figures appear once an event is confirmed." /> : <Table columns={columns} rows={rows} rowKey={(r) => r.event.id} onRowClick={(r) => navigate(`/console/events/${r.event.id}?tab=pnl`)} />}
        </div>
      )}
    </div>
  )
}
