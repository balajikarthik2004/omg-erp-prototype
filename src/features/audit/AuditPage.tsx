import { useMemo, useState } from 'react'
import { History, Search } from 'lucide-react'

import { ROLE_LABEL, USERS } from '@/mock/seed'
import { formatDateTime } from '@/lib/format'
import { Button } from '@/components/ui/Button'
import { EmptyState } from '@/components/ui/EmptyState'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { Table, type Column } from '@/components/ui/Table'
import { TableSkeleton } from '@/components/ui/Skeleton'
import { PageHeader } from '@/components/layout/PageHeader'
import { SectorChip } from '@/components/layout/PhaseChip'
import { useDb } from '@/store/db'
import { useSession } from '@/store/session'
import type { AuditEvent } from '@/types'

const PAGE_SIZE = 25

export function AuditPage() {
  const db = useDb()
  const filter = useSession((s) => s.sectorFilter)
  const [query, setQuery] = useState('')
  const [userId, setUserId] = useState('all')
  const [page, setPage] = useState(0)

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase()
    return db.audit.filter((event) => {
      if (filter !== 'all' && event.sectorId !== filter) return false
      if (userId !== 'all' && event.userId !== userId) return false
      if (q === '') return true
      return (
        event.action.toLowerCase().includes(q) ||
        event.entity.toLowerCase().includes(q) ||
        event.entityId.toLowerCase().includes(q) ||
        event.userName.toLowerCase().includes(q)
      )
    })
  }, [db.audit, filter, userId, query])

  const paged = rows.slice(page * PAGE_SIZE, page * PAGE_SIZE + PAGE_SIZE)

  const columns: Column<AuditEvent>[] = [
    {
      key: 'at',
      header: 'When',
      primary: true,
      cell: (e) => <span className="font-mono text-[13px] tabular-nums">{formatDateTime(e.at)}</span>,
    },
    {
      key: 'who',
      header: 'Who',
      cell: (e) => (
        <div>
          <p className="text-stone-900">{e.userName}</p>
          <p className="text-[12px] text-stone-500">{ROLE_LABEL[e.role]}</p>
        </div>
      ),
    },
    { key: 'action', header: 'Action', cell: (e) => e.action },
    {
      key: 'entity',
      header: 'On',
      cell: (e) => (
        <div>
          <p className="font-mono text-[13px] text-stone-900 tabular-nums">{e.entityId}</p>
          <p className="text-[12px] text-stone-500">{e.entity}</p>
        </div>
      ),
    },
    {
      key: 'sector',
      header: 'Sector',
      cell: (e) => (e.sectorId ? <SectorChip sectorId={e.sectorId} /> : <span className="text-stone-500">—</span>),
    },
    {
      key: 'change',
      header: 'Before → after',
      align: 'right',
      cell: (e) =>
        e.before || e.after ? (
          <span className="inline-flex items-center gap-1.5">
            {e.before ? <StatusBadge status={e.before} compact /> : null}
            <span className="text-stone-500">→</span>
            {e.after ? <StatusBadge status={e.after} compact /> : null}
          </span>
        ) : (
          <span className="text-stone-500">—</span>
        ),
    },
  ]

  return (
    <div>
      <PageHeader
        phase="report"
        title="Audit log"
        description="Who did what, when, and what changed. Entries are written automatically and cannot be edited."
        actions={
          <span className="inline-flex items-center gap-1.5 rounded-full border border-sandal-200 bg-sandal-100 px-3 py-1 text-[12px] text-stone-700">
            <History className="size-3.5" aria-hidden />
            {db.audit.length.toLocaleString()} events
          </span>
        }
      >
        <div className="grid gap-3 sm:grid-cols-[1fr_240px]">
          <Input
            aria-label="Search the audit log"
            placeholder="Search action, reference or person"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value)
              setPage(0)
            }}
            leading={<Search className="size-4" aria-hidden />}
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
        </div>
      </PageHeader>

      {!db.ready ? (
        <TableSkeleton rows={12} cols={6} />
      ) : rows.length === 0 ? (
        <EmptyState
          title="No events match"
          message="Try a different person, or clear the search box."
          action={
            <Button variant="secondary" onClick={() => { setQuery(''); setUserId('all') }}>
              Clear filters
            </Button>
          }
        />
      ) : (
        <>
          <Table columns={columns} rows={paged} rowKey={(e) => e.id} />
          <nav className="mt-4 flex items-center justify-between gap-3" aria-label="Pagination">
            <p className="text-[13px] text-stone-500">
              Showing {page * PAGE_SIZE + 1}–{Math.min(rows.length, (page + 1) * PAGE_SIZE)} of{' '}
              {rows.length.toLocaleString()}
            </p>
            <div className="flex gap-2">
              <Button size="sm" variant="secondary" disabled={page === 0} onClick={() => setPage((p) => p - 1)}>
                Previous
              </Button>
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
  )
}
