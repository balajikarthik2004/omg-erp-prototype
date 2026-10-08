import { useMemo, useState } from 'react'
import { Lock, Search, Undo2 } from 'lucide-react'

import { formatDate, formatMoney } from '@/lib/format'
import { Button } from '@/components/ui/Button'
import { EmptyState } from '@/components/ui/EmptyState'
import { Input } from '@/components/ui/Input'
import { Money } from '@/components/ui/Money'
import { Select } from '@/components/ui/Select'
import { Skeleton } from '@/components/ui/Skeleton'
import { PageHeader } from '@/components/layout/PageHeader'
import { SectorChip } from '@/components/layout/PhaseChip'
import { FUNDS } from '@/mock/seed'
import { useDb } from '@/store/db'
import { useSession } from '@/store/session'
import { inSector } from '@/store/selectors'

const PAGE_SIZE = 20

export function LedgerPage() {
  const db = useDb()
  const filter = useSession((s) => s.sectorFilter)
  const [query, setQuery] = useState('')
  const [fundId, setFundId] = useState('all')
  const [page, setPage] = useState(0)

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase()
    return inSector(db.journal, filter).filter((entry) => {
      if (fundId !== 'all' && !entry.lines.some((l) => l.fundId === fundId)) return false
      if (q === '') return true
      return entry.memo.toLowerCase().includes(q) || entry.sourceRef.toLowerCase().includes(q)
    })
  }, [db.journal, filter, query, fundId])

  const paged = rows.slice(page * PAGE_SIZE, page * PAGE_SIZE + PAGE_SIZE)

  return (
    <div>
      <PageHeader
        phase="control"
        title="Ledger"
        description="Every entry, in the order it happened. Entries are never edited or deleted — a mistake is corrected with a reversal."
        actions={
          <span className="inline-flex items-center gap-1.5 rounded-full border border-sandal-200 bg-sandal-100 px-3 py-1 text-[12px] text-stone-700">
            <Lock className="size-3.5" aria-hidden />
            Append-only
          </span>
        }
      >
        <div className="grid gap-3 sm:grid-cols-[1fr_260px]">
          <Input
            aria-label="Search the ledger"
            placeholder="Search memo or source reference"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value)
              setPage(0)
            }}
            leading={<Search className="size-4" aria-hidden />}
          />
          <Select
            aria-label="Filter by fund"
            value={fundId}
            onChange={(e) => {
              setFundId(e.target.value)
              setPage(0)
            }}
            options={[{ value: 'all', label: 'All funds' }, ...FUNDS.map((f) => ({ value: f.id, label: f.name }))]}
          />
        </div>
      </PageHeader>

      {!db.ready ? (
        <div className="flex flex-col gap-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-28 w-full" />
          ))}
        </div>
      ) : rows.length === 0 ? (
        <EmptyState
          title="No entries match"
          message="Try a different fund, or clear the search box."
          action={
            <Button
              variant="secondary"
              onClick={() => {
                setQuery('')
                setFundId('all')
              }}
            >
              Clear filters
            </Button>
          }
        />
      ) : (
        <>
          <ul className="flex flex-col gap-3">
            {paged.map((entry) => {
              const debit = entry.lines.reduce((s, l) => s + l.debit, 0)
              const credit = entry.lines.reduce((s, l) => s + l.credit, 0)
              const balanced = debit === credit

              return (
                <li
                  key={entry.id}
                  className="overflow-hidden rounded-card border border-sandal-200 bg-sandal-50"
                >
                  <div className="flex flex-wrap items-start justify-between gap-x-4 gap-y-2 border-b border-sandal-200 bg-sandal-100 px-4 py-2.5">
                    <div className="min-w-0">
                      <p className="flex flex-wrap items-center gap-2 text-[14px] font-medium text-stone-900">
                        {entry.memo}
                        {entry.reversalOf ? (
                          <span className="inline-flex items-center gap-1 rounded-full bg-danger-50 px-2 py-0.5 text-[12px] text-danger-600">
                            <Undo2 className="size-3" aria-hidden />
                            Reversal
                          </span>
                        ) : null}
                      </p>
                      <p className="mt-0.5 font-mono text-[12px] text-stone-500 tabular-nums">
                        {entry.id} · source {entry.sourceRef}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <SectorChip sectorId={entry.sectorId} />
                      <span className="font-mono text-[13px] text-stone-500 tabular-nums">
                        {formatDate(entry.date)}
                      </span>
                    </div>
                  </div>

                  <div className="scrollbar-thin overflow-x-auto">
                    <table className="w-full border-collapse text-[14px]">
                      <thead>
                        <tr>
                          {['Account', 'Fund', 'Debit', 'Credit'].map((h, i) => (
                            <th
                              key={h}
                              className={`px-4 py-2 text-[11px] font-semibold tracking-[0.12em] text-stone-500 uppercase ${i > 1 ? 'text-right' : 'text-left'}`}
                            >
                              {h}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {entry.lines.map((line, i) => (
                          <tr key={i} className="border-t border-sandal-200">
                            <td className="px-4 py-2 text-stone-900">{line.account}</td>
                            <td className="px-4 py-2 text-stone-500">
                              {FUNDS.find((f) => f.id === line.fundId)?.name ?? line.fundId}
                            </td>
                            <td className="px-4 py-2 text-right">
                              {line.debit > 0 ? <Money value={line.debit} /> : <span className="text-stone-500">—</span>}
                            </td>
                            <td className="px-4 py-2 text-right">
                              {line.credit > 0 ? <Money value={line.credit} /> : <span className="text-stone-500">—</span>}
                            </td>
                          </tr>
                        ))}
                        <tr className="border-t border-sandal-200 bg-sandal-100">
                          <td className="px-4 py-2 text-[13px] text-stone-500" colSpan={2}>
                            {balanced ? 'Balanced' : 'Out of balance — needs review'}
                          </td>
                          <td className="px-4 py-2 text-right">
                            <Money value={debit} className="font-medium" />
                          </td>
                          <td className="px-4 py-2 text-right">
                            <Money value={credit} className="font-medium" />
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </li>
              )
            })}
          </ul>

          <nav className="mt-4 flex items-center justify-between gap-3" aria-label="Pagination">
            <p className="text-[13px] text-stone-500">
              Showing {page * PAGE_SIZE + 1}–{Math.min(rows.length, (page + 1) * PAGE_SIZE)} of{' '}
              {rows.length.toLocaleString()} entries
              {' · '}
              {formatMoney(rows.reduce((s, e) => s + e.lines.reduce((t, l) => t + l.debit, 0), 0))} debited in view
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
