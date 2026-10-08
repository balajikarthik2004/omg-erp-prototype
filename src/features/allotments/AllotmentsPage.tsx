import { useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Plus } from 'lucide-react'

import { approvalTierLabel } from '@/config'
import { formatAge, formatDate, formatMoney } from '@/lib/format'
import { Button } from '@/components/ui/Button'
import { Dialog } from '@/components/ui/Dialog'
import { Drawer } from '@/components/ui/Drawer'
import { EmptyState } from '@/components/ui/EmptyState'
import { Input, Textarea } from '@/components/ui/Input'
import { Money } from '@/components/ui/Money'
import { Select } from '@/components/ui/Select'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { Table, type Column } from '@/components/ui/Table'
import { TableSkeleton } from '@/components/ui/Skeleton'
import { Tabs } from '@/components/ui/Tabs'
import { PageHeader } from '@/components/layout/PageHeader'
import { SectorChip } from '@/components/layout/PhaseChip'
import { ApprovalTimeline } from '@/components/flow/ApprovalTimeline'
import { MakerCheckerNote } from '@/components/flow/MakerCheckerNote'
import { BudgetBar } from '@/components/flow/BudgetBar'
import { allotmentFundError, approvalBlock, available, useDb } from '@/store/db'
import { currentUser, useSession } from '@/store/session'
import { inSector } from '@/store/selectors'
import { userName } from '@/mock/seed'
import type { Allotment } from '@/types'

export function AllotmentsPage() {
  const db = useDb()
  const filter = useSession((s) => s.sectorFilter)
  const personaId = useSession((s) => s.personaId)
  const user = currentUser(personaId)
  const decideAllotment = useDb((s) => s.decideAllotment)

  const [params, setParams] = useSearchParams()
  const [tab, setTab] = useState('pending')
  const [composing, setComposing] = useState(false)
  const [comment, setComment] = useState('')

  const all = useMemo(() => inSector(db.allotments, filter), [db.allotments, filter])
  const pending = all.filter((a) => a.status === 'pending')
  const decided = all.filter((a) => a.status !== 'pending')
  const rows = tab === 'pending' ? pending : decided

  const focusId = params.get('focus')
  const focused = db.allotments.find((a) => a.id === focusId)
  const focusHead = focused ? db.budgets.find((b) => b.id === focused.toBudgetHeadId) : undefined
  const block = focused ? approvalBlock(user, focused.preparedBy, focused.amount, focused.approvals) : null

  const columns: Column<Allotment>[] = [
    {
      key: 'id',
      header: 'Ref.',
      primary: true,
      cell: (a) => <span className="font-mono text-[13px] text-stone-900 tabular-nums">{a.id}</span>,
    },
    {
      key: 'from',
      header: 'From fund',
      cell: (a) => db.funds.find((f) => f.id === a.fromFundId)?.name ?? a.fromFundId,
    },
    {
      key: 'to',
      header: 'To budget head',
      cell: (a) => db.budgets.find((b) => b.id === a.toBudgetHeadId)?.name ?? a.toBudgetHeadId,
    },
    { key: 'sector', header: 'Sector', cell: (a) => <SectorChip sectorId={a.sectorId} /> },
    {
      key: 'prepared',
      header: 'Prepared',
      hideOnMobile: true,
      cell: (a) => (
        <span className="text-[13px] text-stone-500">
          {userName(a.preparedBy)} · {formatAge(a.preparedAt)}
        </span>
      ),
    },
    { key: 'status', header: 'Status', cell: (a) => <StatusBadge status={a.status} /> },
    { key: 'amount', header: 'Amount', align: 'right', primary: true, cell: (a) => <Money value={a.amount} /> },
  ]

  return (
    <div>
      <PageHeader
        phase="control"
        title="Fund allotments"
        description="Moving money from a fund into a budget head. One person prepares it, another approves it."
        actions={
          <Button icon={<Plus className="size-4" aria-hidden />} onClick={() => setComposing(true)}>
            New allotment
          </Button>
        }
      >
        <Tabs
          value={tab}
          onChange={setTab}
          items={[
            { id: 'pending', label: 'Awaiting approval', count: pending.length },
            { id: 'decided', label: 'Decided', count: decided.length },
          ]}
        />
      </PageHeader>

      {!db.ready ? (
        <TableSkeleton rows={8} cols={7} />
      ) : rows.length === 0 ? (
        <EmptyState
          title={tab === 'pending' ? 'Nothing waiting' : 'No decisions yet'}
          message={
            tab === 'pending'
              ? 'Every allotment has been signed off. Prepare a new one when a budget head needs more.'
              : 'Approved and rejected allotments will be listed here.'
          }
          action={
            tab === 'pending' ? (
              <Button onClick={() => setComposing(true)}>Prepare an allotment</Button>
            ) : undefined
          }
        />
      ) : (
        <Table columns={columns} rows={rows} rowKey={(a) => a.id} onRowClick={(a) => setParams({ focus: a.id })} />
      )}

      {/* Detail + approve */}
      <Drawer
        open={Boolean(focused)}
        onClose={() => {
          setParams({})
          setComment('')
        }}
        title={focusHead ? `Allot to ${focusHead.name}` : 'Allotment'}
        subtitle={focused ? `${focused.id} · prepared ${formatDate(focused.preparedAt)}` : undefined}
        width="lg"
        footer={
          focused?.status === 'pending' ? (
            <div className="flex flex-col gap-3">
              <MakerCheckerNote preparedBy={focused.preparedBy} block={block} />
              <Textarea
                label="Comment (required to reject)"
                placeholder="Why are you approving or rejecting this?"
                value={comment}
                onChange={(e) => setComment(e.target.value)}
              />
              <div className="flex gap-2">
                <Button
                  fullWidth
                  variant="success"
                  disabled={Boolean(block)}
                  title={block ?? undefined}
                  onClick={() => {
                    decideAllotment(focused.id, 'approved', user, comment || undefined)
                    setParams({})
                    setComment('')
                  }}
                >
                  Approve allotment
                </Button>
                <Button
                  fullWidth
                  variant="secondary"
                  disabled={comment.trim().length < 5}
                  title={comment.trim().length < 5 ? 'Add a comment explaining the rejection.' : undefined}
                  onClick={() => {
                    decideAllotment(focused.id, 'rejected', user, comment)
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
              <p className="text-[11px] font-semibold tracking-[0.12em] text-stone-500 uppercase">Amount</p>
              <Money value={focused.amount} className="mt-1 font-display text-[30px] text-stone-900" />
              <p className="mt-1 text-[13px] text-stone-500">Requires {approvalTierLabel(focused.amount)}</p>
            </div>

            <dl className="grid grid-cols-1 gap-3 text-[14px] sm:grid-cols-2">
              <div>
                <dt className="text-[11px] font-semibold tracking-[0.12em] text-stone-500 uppercase">From fund</dt>
                <dd className="mt-0.5 text-stone-900">
                  {db.funds.find((f) => f.id === focused.fromFundId)?.name}
                  <span className="block text-[13px] text-stone-500">
                    Balance {formatMoney(db.funds.find((f) => f.id === focused.fromFundId)?.balance ?? 0)}
                  </span>
                </dd>
              </div>
              <div>
                <dt className="text-[11px] font-semibold tracking-[0.12em] text-stone-500 uppercase">To budget head</dt>
                <dd className="mt-0.5 text-stone-900">{focusHead?.name}</dd>
              </div>
              <div className="sm:col-span-2">
                <dt className="text-[11px] font-semibold tracking-[0.12em] text-stone-500 uppercase">Reason</dt>
                <dd className="mt-0.5 text-stone-700">{focused.reason}</dd>
              </div>
            </dl>

            {focusHead ? (
              <section>
                <h3 className="mb-2 text-[11px] font-semibold tracking-[0.12em] text-stone-500 uppercase">
                  Effect on {focusHead.name}
                </h3>
                <BudgetBar head={focusHead} />
                <p className="mt-2 text-[13px] text-stone-500">
                  Available now {formatMoney(available(focusHead))} ·{' '}
                  <span className="text-tulsi-700">
                    {formatMoney(available(focusHead) + focused.amount)} if approved
                  </span>
                </p>
              </section>
            ) : null}

            <ApprovalTimeline steps={focused.approvals} amount={focused.amount} />
          </div>
        ) : null}
      </Drawer>

      <NewAllotmentDialog open={composing} onClose={() => setComposing(false)} />
    </div>
  )
}

function NewAllotmentDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const db = useDb()
  const personaId = useSession((s) => s.personaId)
  const createAllotment = useDb((s) => s.createAllotment)

  const [fromFundId, setFromFundId] = useState('')
  const [toBudgetHeadId, setToBudgetHeadId] = useState('')
  const [amount, setAmount] = useState('')
  const [reason, setReason] = useState('')
  const [error, setError] = useState<string>()

  const fund = db.funds.find((f) => f.id === fromFundId)
  const head = db.budgets.find((b) => b.id === toBudgetHeadId)
  const liveError = fromFundId && toBudgetHeadId ? allotmentFundError(fund, head) : null
  const cents = Math.round(Number(amount.replace(/[^0-9.]/g, '')) * 100)

  function submit() {
    const result = createAllotment({
      fromFundId,
      toBudgetHeadId,
      amount: cents,
      reason,
      actor: currentUser(personaId),
    })
    if (!result.ok) {
      setError(result.error)
      return
    }
    setError(undefined)
    setFromFundId('')
    setToBudgetHeadId('')
    setAmount('')
    setReason('')
    onClose()
  }

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title="New fund allotment"
      description="You are preparing this. Somebody else will have to approve it before the budget moves."
      footer={
        <div className="flex gap-2">
          <Button fullWidth onClick={submit}>
            Send for approval
          </Button>
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
        </div>
      }
    >
      <div className="flex flex-col gap-4">
        <Select
          label="From fund"
          value={fromFundId}
          onChange={(e) => setFromFundId(e.target.value)}
          options={[
            { value: '', label: 'Choose a fund' },
            ...db.funds.map((f) => ({ value: f.id, label: `${f.name} — ${formatMoney(f.balance)}` })),
          ]}
        />
        <Select
          label="To budget head"
          value={toBudgetHeadId}
          onChange={(e) => setToBudgetHeadId(e.target.value)}
          options={[
            { value: '', label: 'Choose a budget head' },
            ...db.budgets.map((b) => ({ value: b.id, label: `${b.name} (${b.sectorId})` })),
          ]}
        />

        {liveError ? (
          <p className="rounded-lg border border-danger-50 bg-danger-50 px-3 py-2 text-[13px] text-danger-600">
            {liveError}
          </p>
        ) : null}

        <Input
          label="Amount"
          inputMode="decimal"
          placeholder="0.00"
          leading={<span className="text-[15px]">$</span>}
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          className="font-mono tabular-nums"
          hint={cents > 0 ? `Will need ${approvalTierLabel(cents)} to approve.` : undefined}
        />
        <Textarea
          label="Reason"
          placeholder="Why does this budget head need the money now?"
          value={reason}
          onChange={(e) => setReason(e.target.value)}
        />

        {error ? (
          <p className="rounded-lg border border-danger-50 bg-danger-50 px-3 py-2 text-[13px] text-danger-600">
            {error}
          </p>
        ) : null}
      </div>
    </Dialog>
  )
}
