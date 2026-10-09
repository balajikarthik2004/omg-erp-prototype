import { useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { AlertTriangle, CheckCircle2, Circle, LockKeyhole, LockKeyholeOpen } from 'lucide-react'

import { cn } from '@/lib/cn'
import { formatDateTime } from '@/lib/format'
import { Button } from '@/components/ui/Button'
import { Drawer } from '@/components/ui/Drawer'
import { Input, Textarea } from '@/components/ui/Input'
import { Stat } from '@/components/ui/Stat'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { Table, type Column } from '@/components/ui/Table'
import { TableSkeleton } from '@/components/ui/Skeleton'
import { PageHeader } from '@/components/layout/PageHeader'
import { MakerCheckerNote } from '@/components/flow/MakerCheckerNote'
import { userName } from '@/mock/seed'
import { useDb } from '@/store/db'
import { periodApproveBlock, periodChecks, periodLabel, periodPrepareBlock, periodSequenceError } from '@/store/rules'
import { currentUser, useSession } from '@/store/session'
import type { PeriodClose } from '@/types'

/** Step 9: month-end close. The CA team prepares, the CA Partner locks. A locked month refuses new postings. */
export function PeriodClosePage() {
  const db = useDb()
  const personaId = useSession((s) => s.personaId)
  const user = currentUser(personaId)
  const preparePeriodClose = useDb((s) => s.preparePeriodClose)
  const decidePeriodClose = useDb((s) => s.decidePeriodClose)
  const reopenPeriod = useDb((s) => s.reopenPeriod)
  const [params, setParams] = useSearchParams()

  const [note, setNote] = useState('')
  const [reason, setReason] = useState('')
  const [error, setError] = useState<string>()

  const rows = useMemo(() => db.periodCloses.slice().sort((a, b) => b.period.localeCompare(a.period)), [db.periodCloses])
  const focused = db.periodCloses.find((p) => p.period === params.get('focus'))

  const checks = focused ? periodChecks(db, focused.period) : []
  const blockers = checks.filter((c) => c.blocking && !c.ok)
  const sequence = focused ? periodSequenceError(db.periodCloses, focused.period) : null
  const prepareBlock = focused ? periodPrepareBlock(user) : null
  const approveBlock = focused ? periodApproveBlock(user, focused) : null

  const closed = rows.filter((r) => r.status === 'closed').length
  const open = rows.filter((r) => r.status === 'open').length
  const pending = rows.filter((r) => r.status === 'pending').length

  function close() {
    setParams({})
    setNote('')
    setReason('')
    setError(undefined)
  }

  const columns: Column<PeriodClose>[] = [
    { key: 'period', header: 'Month', primary: true, cell: (p) => <span className="text-stone-900">{periodLabel(p.period)}</span> },
    { key: 'status', header: 'Status', cell: (p) => <StatusBadge status={p.status === 'pending' ? 'pending' : p.status} /> },
    { key: 'prep', header: 'Prepared by', hideOnMobile: true, cell: (p) => (p.preparedBy ? userName(p.preparedBy) : '—') },
    { key: 'by', header: 'Locked by', hideOnMobile: true, cell: (p) => (p.closedBy ? userName(p.closedBy) : '—') },
    {
      key: 'at',
      header: 'Locked on',
      cell: (p) => <span className="font-mono text-[13px] tabular-nums">{p.closedAt ? formatDateTime(p.closedAt) : '—'}</span>,
    },
  ]

  return (
    <div>
      <PageHeader
        phase="control"
        title="Period close"
        description="Each month is closed in order. The CA team prepares the close, the CA Partner locks it, and nothing can be posted to a locked month."
      />

      {!db.ready ? (
        <TableSkeleton rows={8} cols={5} />
      ) : (
        <div className="flex flex-col gap-6">
          <div className="grid gap-4 sm:grid-cols-3">
            <Stat label="Locked months" value={closed} accentClass="bg-tulsi-500" icon={<LockKeyhole className="size-4" aria-hidden />} />
            <Stat label="Open months" value={open} accentClass="bg-marigold-500" />
            <Stat label="Waiting for the Partner" value={pending} accentClass="bg-kumkum-600" />
          </div>
          <Table columns={columns} rows={rows} rowKey={(p) => p.id} onRowClick={(p) => setParams({ focus: p.period })} />
        </div>
      )}

      <Drawer
        open={Boolean(focused)}
        onClose={close}
        title={focused ? periodLabel(focused.period) : ''}
        subtitle={focused ? 'Month-end close' : undefined}
        width="lg"
        footer={
          focused?.status === 'open' ? (
            <div className="flex flex-col gap-3">
              {error ? <p className="text-[13px] text-danger-600">{error}</p> : null}
              {prepareBlock ? <p className="text-[13px] text-marigold-500">{prepareBlock}</p> : null}
              {sequence ? <p className="text-[13px] text-marigold-500">{sequence}</p> : null}
              <Input aria-label="Note for the Partner" placeholder="Note for the Partner (optional)" value={note} onChange={(e) => setNote(e.target.value)} />
              <Button
                fullWidth
                disabled={Boolean(prepareBlock) || Boolean(sequence) || blockers.length > 0}
                title={prepareBlock ?? sequence ?? (blockers.length > 0 ? 'Clear the blocking checks first.' : undefined)}
                onClick={() => {
                  const result = preparePeriodClose(focused.period, user, note)
                  if (!result.ok) setError(result.error)
                  else close()
                }}
              >
                Send for close
              </Button>
            </div>
          ) : focused?.status === 'pending' ? (
            <div className="flex flex-col gap-3">
              <MakerCheckerNote preparedBy={focused.preparedBy ?? ''} block={approveBlock} />
              <div className="flex gap-2">
                <Button
                  fullWidth
                  variant="success"
                  disabled={Boolean(approveBlock)}
                  title={approveBlock ?? undefined}
                  icon={<LockKeyhole className="size-4" aria-hidden />}
                  onClick={() => {
                    decidePeriodClose(focused.period, 'approved', user)
                    close()
                  }}
                >
                  Close and lock
                </Button>
                <Button
                  fullWidth
                  variant="secondary"
                  onClick={() => {
                    decidePeriodClose(focused.period, 'rejected', user, 'Returned for another look')
                    close()
                  }}
                >
                  Return
                </Button>
              </div>
            </div>
          ) : focused?.status === 'closed' ? (
            <div className="flex flex-col gap-3">
              {error ? <p className="text-[13px] text-danger-600">{error}</p> : null}
              <Textarea
                label="Reason to reopen"
                placeholder="At least 10 characters. This is written to the audit log."
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                hint={user.role === 'ca_partner' ? undefined : 'Only a CA Partner can reopen a locked month.'}
              />
              <Button
                fullWidth
                variant="secondary"
                disabled={user.role !== 'ca_partner' || reason.trim().length < 10}
                icon={<LockKeyholeOpen className="size-4" aria-hidden />}
                onClick={() => {
                  const result = reopenPeriod(focused.period, user, reason)
                  if (!result.ok) setError(result.error)
                  else close()
                }}
              >
                Reopen this month
              </Button>
            </div>
          ) : null
        }
      >
        {focused ? (
          <div className="flex flex-col gap-5">
            <StatusBadge status={focused.status} />
            {focused.status === 'closed' ? (
              <p className="rounded-lg bg-tulsi-50 px-3 py-2.5 text-[14px] text-tulsi-700">
                Locked by {focused.closedBy ? userName(focused.closedBy) : 'the CA Partner'}
                {focused.closedAt ? ` on ${formatDateTime(focused.closedAt)}` : ''}. Allotments, payment releases, cash counts and
                reconciliations dated in this month are refused.
              </p>
            ) : null}
            {focused.note ? <p className="rounded-lg bg-sandal-100 px-3 py-2.5 text-[14px] text-stone-700">{focused.note}</p> : null}

            <section>
              <h3 className="mb-2 text-[11px] font-semibold tracking-[0.12em] text-stone-500 uppercase">Close checklist</h3>
              <ul className="flex flex-col divide-y divide-sandal-200 rounded-card border border-sandal-200">
                {checks.map((c) => {
                  const Icon = c.ok ? CheckCircle2 : c.blocking ? AlertTriangle : Circle
                  return (
                    <li key={c.id} className="flex items-start gap-3 px-4 py-3">
                      <Icon
                        className={cn('mt-0.5 size-4 shrink-0', c.ok ? 'text-tulsi-700' : c.blocking ? 'text-danger-600' : 'text-marigold-500')}
                        aria-hidden
                      />
                      <div className="min-w-0">
                        <p className="text-[14px] text-stone-900">
                          {c.label}
                          {!c.ok && c.blocking ? <span className="ml-2 text-[12px] font-medium text-danger-600">Blocks the close</span> : null}
                          {!c.ok && !c.blocking ? <span className="ml-2 text-[12px] font-medium text-marigold-500">Warning</span> : null}
                        </p>
                        <p className="text-[13px] text-stone-500">{c.detail}</p>
                      </div>
                    </li>
                  )
                })}
              </ul>
            </section>
          </div>
        ) : null}
      </Drawer>
    </div>
  )
}
