import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { FileText, HandCoins } from 'lucide-react'

import { SECTORS } from '@/config'
import { formatDate, formatMoney } from '@/lib/format'
import { Button } from '@/components/ui/Button'
import { EmptyState } from '@/components/ui/EmptyState'
import { Money } from '@/components/ui/Money'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { Table, type Column } from '@/components/ui/Table'
import { TableSkeleton } from '@/components/ui/Skeleton'
import { toast } from '@/lib/toast'
import { SectorChip } from '@/components/layout/PhaseChip'
import { CATALOG } from '@/mock/seed'
import { useDb } from '@/store/db'
import { useSession } from '@/store/session'
import type { Donation } from '@/types'

export function MyDonationsPage() {
  const ready = useDb((s) => s.ready)
  const donations = useDb((s) => s.donations)
  const signedIn = useSession((s) => s.signedIn)

  /** In this prototype "mine" means the gifts made in this session. */
  const mine = useMemo(() => donations.filter((d) => d.donorId === 'dnr-live'), [donations])

  const yearTotal = mine.reduce((sum, d) => sum + (d.status === 'refunded' ? 0 : d.gross), 0)

  const columns: Column<Donation>[] = [
    {
      key: 'date',
      header: 'Date',
      primary: true,
      cell: (d) => <span className="font-mono text-[14px] tabular-nums">{formatDate(d.createdAt)}</span>,
    },
    {
      key: 'item',
      header: 'Offering',
      cell: (d) => (
        <div>
          <p className="text-stone-900">{CATALOG.find((c) => c.id === d.lines[0]?.itemId)?.name ?? '—'}</p>
          {d.lines[0]?.dedication ? (
            <p className="text-[13px] text-stone-500">For {d.lines[0].dedication.name}</p>
          ) : null}
        </div>
      ),
    },
    { key: 'sector', header: 'Sector', cell: (d) => <SectorChip sectorId={d.sectorId} /> },
    {
      key: 'receipt',
      header: 'Receipt',
      cell: (d) => (
        <Link to={`/receipt/${encodeURIComponent(d.id)}`} className="font-mono text-[13px] text-kumkum-700 tabular-nums hover:underline">
          {d.receiptNo}
        </Link>
      ),
    },
    { key: 'status', header: 'Status', cell: (d) => <StatusBadge status={d.status} /> },
    { key: 'amount', header: 'Amount', align: 'right', primary: true, cell: (d) => <Money value={d.gross} /> },
  ]

  if (!ready) {
    return (
      <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6">
        <TableSkeleton rows={5} cols={6} />
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6">
      <header className="mb-6">
        <p className="text-[11px] font-semibold tracking-[0.14em] text-turmeric-700 uppercase">Collect</p>
        <div className="mt-2 flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="font-display text-[30px] leading-tight text-stone-900">My donations</h1>
            <p className="mt-1 text-[15px] text-stone-500">
              {signedIn ? 'Signed in. ' : ''}Every receipt you have taken through this prototype.
            </p>
          </div>
          <Button
            variant="secondary"
            icon={<FileText className="size-4" aria-hidden />}
            onClick={() => toast.info('Coming in the next build', 'Annual statements are compiled at year end.')}
          >
            Annual statement
          </Button>
        </div>
        <div className="gold-rule mt-4" />
      </header>

      {mine.length > 0 ? (
        <div className="mb-6 grid gap-4 sm:grid-cols-3">
          <div className="rounded-card border border-sandal-200 bg-sandal-50 p-4">
            <p className="text-[11px] font-semibold tracking-[0.12em] text-stone-500 uppercase">Given this session</p>
            <p className="mt-1.5 font-display text-[30px] leading-none text-stone-900">{formatMoney(yearTotal)}</p>
          </div>
          <div className="rounded-card border border-sandal-200 bg-sandal-50 p-4">
            <p className="text-[11px] font-semibold tracking-[0.12em] text-stone-500 uppercase">Receipts</p>
            <p className="mt-1.5 font-display text-[30px] leading-none text-stone-900">{mine.length}</p>
          </div>
          <div className="rounded-card border border-sandal-200 bg-sandal-50 p-4">
            <p className="text-[11px] font-semibold tracking-[0.12em] text-stone-500 uppercase">Sectors supported</p>
            <p className="mt-1.5 font-display text-[30px] leading-none text-stone-900">
              {new Set(mine.map((d) => d.sectorId)).size}
            </p>
            <p className="mt-1 text-[13px] text-stone-500">
              {[...new Set(mine.map((d) => d.sectorId))].map((s) => SECTORS[s].name).join(', ') || '—'}
            </p>
          </div>
        </div>
      ) : null}

      {mine.length === 0 ? (
        <EmptyState
          icon={<HandCoins className="size-6" aria-hidden />}
          title="No donations yet"
          message="Once you complete an offering it will appear here with its receipt. The prototype resets on reload."
          action={
            <Link to="/">
              <Button>Make an offering</Button>
            </Link>
          }
        />
      ) : (
        <Table columns={columns} rows={mine} rowKey={(d) => d.id} />
      )}
    </div>
  )
}
