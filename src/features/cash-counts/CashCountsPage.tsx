import { useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Coins, HandCoins } from 'lucide-react'

import { SECTORS, SECTOR_IDS, type SectorId } from '@/config'
import { formatDateTime } from '@/lib/format'
import { Button } from '@/components/ui/Button'
import { Card, CardHeader } from '@/components/ui/Card'
import { Drawer } from '@/components/ui/Drawer'
import { EmptyState } from '@/components/ui/EmptyState'
import { Input, Textarea } from '@/components/ui/Input'
import { Money } from '@/components/ui/Money'
import { Select } from '@/components/ui/Select'
import { Stat } from '@/components/ui/Stat'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { Table, type Column } from '@/components/ui/Table'
import { TableSkeleton } from '@/components/ui/Skeleton'
import { Tabs } from '@/components/ui/Tabs'
import { PageHeader } from '@/components/layout/PageHeader'
import { SectorChip } from '@/components/layout/PhaseChip'
import { MakerCheckerNote } from '@/components/flow/MakerCheckerNote'
import { CATALOG, userName } from '@/mock/seed'
import { useDb } from '@/store/db'
import { cashConfirmBlock, cashCountBlock } from '@/store/rules'
import { currentUser, useSession } from '@/store/session'
import { catalogName, inSector } from '@/store/selectors'
import type { CashCount } from '@/types'

/** Step 3 (counter cash): two people count, the second confirms, and only then does the gift post. */
export function CashCountsPage() {
  const db = useDb()
  const filter = useSession((s) => s.sectorFilter)
  const personaId = useSession((s) => s.personaId)
  const user = currentUser(personaId)
  const createCashCount = useDb((s) => s.createCashCount)
  const decideCashCount = useDb((s) => s.decideCashCount)
  const [params, setParams] = useSearchParams()

  const tenant = db.tenants.find((t) => t.id === db.activeTenantId)
  const sectors = tenant?.verticals ?? SECTOR_IDS

  const [tab, setTab] = useState('pending')
  const [sectorId, setSectorId] = useState<SectorId>('temple')
  const [itemId, setItemId] = useState('')
  const [amount, setAmount] = useState('')
  const [note, setNote] = useState('')
  const [comment, setComment] = useState('')
  const [error, setError] = useState<string>()

  const activeSector = sectors.includes(sectorId) ? sectorId : (sectors[0] ?? 'temple')
  const items = CATALOG.filter((c) => c.sectorId === activeSector && c.category === 'hundi' && c.active)
  const activeItem = items.some((i) => i.id === itemId) ? itemId : (items[0]?.id ?? '')

  const all = useMemo(() => inSector(db.cashCounts, filter), [db.cashCounts, filter])
  const pending = all.filter((c) => c.status === 'pending')
  const history = all.filter((c) => c.status !== 'pending')
  const rows = tab === 'pending' ? pending : history

  const focused = db.cashCounts.find((c) => c.id === params.get('focus'))
  const focusBlock = focused ? cashConfirmBlock(user, focused) : null
  const countBlock = cashCountBlock(user)

  const columns: Column<CashCount>[] = [
    {
      key: 'when',
      header: 'Counted',
      primary: true,
      cell: (c) => <span className="font-mono text-[13px] tabular-nums">{formatDateTime(c.countedAt)}</span>,
    },
    { key: 'item', header: 'Offering', cell: (c) => catalogName(c.itemId) },
    { key: 'sector', header: 'Sector', cell: (c) => <SectorChip sectorId={c.sectorId} /> },
    { key: 'by', header: 'Counted by', hideOnMobile: true, cell: (c) => userName(c.countedBy) },
    { key: 'status', header: 'Status', cell: (c) => <StatusBadge status={c.status} /> },
    { key: 'amount', header: 'Amount', align: 'right', primary: true, cell: (c) => <Money value={c.amount} /> },
  ]

  function record() {
    const cents = Math.round(Number(amount.replace(/[^0-9.]/g, '')) * 100)
    const result = createCashCount({ sectorId: activeSector, itemId: activeItem, amount: cents, note, actor: user })
    if (!result.ok) {
      setError(result.error)
      return
    }
    setError(undefined)
    setAmount('')
    setNote('')
    setTab('pending')
  }

  return (
    <div>
      <PageHeader
        phase="collect"
        title="Counter cash"
        description="Cash from the hundi and the counters is counted by one person and confirmed by another. Nothing posts to a fund until the second person agrees."
      >
        <Tabs
          value={tab}
          onChange={setTab}
          items={[
            { id: 'pending', label: 'Waiting for a second person', count: pending.length },
            { id: 'history', label: 'History', count: history.length },
          ]}
        />
      </PageHeader>

      {!db.ready ? (
        <TableSkeleton rows={6} cols={6} />
      ) : (
        <div className="grid gap-6 xl:grid-cols-[1fr_340px] xl:items-start">
          <div className="flex flex-col gap-6">
            <div className="grid gap-4 sm:grid-cols-2">
              <Stat label="Waiting to be confirmed" value={pending.length} accentClass="bg-marigold-500" icon={<Coins className="size-4" aria-hidden />} />
              <Stat
                label="Cash not yet posted"
                value={<Money value={pending.reduce((s, c) => s + c.amount, 0)} />}
                sub="held until confirmed"
                accentClass="bg-turmeric-500"
              />
            </div>

            {rows.length === 0 ? (
              <EmptyState
                icon={<HandCoins className="size-6" aria-hidden />}
                title={tab === 'pending' ? 'No cash is waiting' : 'No history yet'}
                message={
                  tab === 'pending'
                    ? 'Record a count on the right. A second person then confirms it from here or from the approvals inbox.'
                    : 'Confirmed and rejected counts will be listed here.'
                }
              />
            ) : (
              <Table columns={columns} rows={rows} rowKey={(c) => c.id} onRowClick={(c) => setParams({ focus: c.id })} />
            )}
          </div>

          <Card accentClass="bg-turmeric-500">
            <CardHeader title="Record a count" description="You are the first counter. Someone else confirms." />
            <div className="mt-4 flex flex-col gap-4">
              <Select
                label="Sector"
                value={activeSector}
                onChange={(e) => setSectorId(e.target.value as SectorId)}
                options={sectors.map((id) => ({ value: id, label: SECTORS[id].name }))}
              />
              <Select
                label="Offering"
                value={activeItem}
                onChange={(e) => setItemId(e.target.value)}
                options={items.map((i) => ({ value: i.id, label: i.name }))}
              />
              <Input
                label="Amount counted"
                inputMode="decimal"
                placeholder="0.00"
                leading={<span className="text-[15px]">$</span>}
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="font-mono tabular-nums"
              />
              <Textarea label="Note (optional)" value={note} onChange={(e) => setNote(e.target.value)} placeholder="Which box, which day" />
              {countBlock ? <p className="text-[13px] text-marigold-500">{countBlock}</p> : null}
              {error ? <p className="text-[13px] text-danger-600">{error}</p> : null}
              <Button onClick={record} disabled={Boolean(countBlock)} title={countBlock ?? undefined}>
                Record count
              </Button>
            </div>
          </Card>
        </div>
      )}

      <Drawer
        open={Boolean(focused)}
        onClose={() => {
          setParams({})
          setComment('')
        }}
        title={focused ? catalogName(focused.itemId) : ''}
        subtitle={focused ? `Counted ${formatDateTime(focused.countedAt)}` : undefined}
        footer={
          focused?.status === 'pending' ? (
            <div className="flex flex-col gap-3">
              <MakerCheckerNote preparedBy={focused.countedBy} block={focusBlock} />
              <Textarea
                label="Comment"
                placeholder="Required when rejecting a count."
                value={comment}
                onChange={(e) => setComment(e.target.value)}
              />
              <div className="flex gap-2">
                <Button
                  fullWidth
                  variant="success"
                  disabled={Boolean(focusBlock)}
                  title={focusBlock ?? undefined}
                  onClick={() => {
                    decideCashCount(focused.id, 'approved', user)
                    setParams({})
                  }}
                >
                  Confirm the count
                </Button>
                <Button
                  fullWidth
                  variant="secondary"
                  disabled={comment.trim().length < 5}
                  title={comment.trim().length < 5 ? 'Add a comment explaining the rejection.' : undefined}
                  onClick={() => {
                    decideCashCount(focused.id, 'rejected', user, comment.trim())
                    setParams({})
                    setComment('')
                  }}
                >
                  Reject
                </Button>
              </div>
            </div>
          ) : null
        }
      >
        {focused ? (
          <div className="flex flex-col gap-5">
            <div className="flex flex-wrap items-center gap-2">
              <StatusBadge status={focused.status} />
              <SectorChip sectorId={focused.sectorId} />
            </div>
            <div className="rounded-card border border-sandal-200 bg-sandal-100 p-4">
              <p className="text-[11px] font-semibold tracking-[0.12em] text-stone-500 uppercase">Counted</p>
              <Money value={focused.amount} className="mt-1 font-display text-[30px] text-stone-900" />
            </div>
            <dl className="grid grid-cols-2 gap-x-4 gap-y-3 text-[14px]">
              <div>
                <dt className="text-[11px] font-semibold tracking-[0.12em] text-stone-500 uppercase">First counter</dt>
                <dd className="mt-0.5 text-stone-900">{userName(focused.countedBy)}</dd>
              </div>
              <div>
                <dt className="text-[11px] font-semibold tracking-[0.12em] text-stone-500 uppercase">Second person</dt>
                <dd className="mt-0.5 text-stone-900">{focused.confirmedBy ? userName(focused.confirmedBy) : 'Not yet'}</dd>
              </div>
              {focused.donationId ? (
                <div className="col-span-2">
                  <dt className="text-[11px] font-semibold tracking-[0.12em] text-stone-500 uppercase">Posted as</dt>
                  <dd className="mt-0.5 font-mono text-stone-900 tabular-nums">{focused.donationId}</dd>
                </div>
              ) : null}
            </dl>
            {focused.note ? <p className="rounded-lg bg-sandal-100 px-3 py-2.5 text-[14px] text-stone-700">{focused.note}</p> : null}
          </div>
        ) : null}
      </Drawer>
    </div>
  )
}
