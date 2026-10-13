import { useMemo, useState } from 'react'
import { AlertTriangle, Link2 } from 'lucide-react'

import { formatDate, formatMoney } from '@/lib/format'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Drawer } from '@/components/ui/Drawer'
import { Textarea } from '@/components/ui/Input'
import { EmptyState } from '@/components/ui/EmptyState'
import { Money } from '@/components/ui/Money'
import { Stat } from '@/components/ui/Stat'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { Table, type Column } from '@/components/ui/Table'
import { TableSkeleton } from '@/components/ui/Skeleton'
import { Tabs } from '@/components/ui/Tabs'
import { PageHeader } from '@/components/layout/PageHeader'
import { useDb } from '@/store/db'
import { payoutVariance } from '@/store/rules'
import { currentUser, useSession } from '@/store/session'
import { donorName } from '@/store/selectors'
import type { SquarePayout } from '@/types'

export function ReconciliationPage() {
  const db = useDb()
  const personaId = useSession((s) => s.personaId)
  const matchPayout = useDb((s) => s.matchPayout)
  const [tab, setTab] = useState('unmatched')
  const [openId, setOpenId] = useState<string | null>(null)
  const [resolution, setResolution] = useState('')

  const unmatched = useMemo(() => db.payouts.filter((p) => p.status !== 'matched'), [db.payouts])
  const matched = useMemo(() => db.payouts.filter((p) => p.status === 'matched'), [db.payouts])
  const rows = tab === 'unmatched' ? unmatched : matched

  const open = db.payouts.find((p) => p.id === openId)
  const openDonations = open ? db.donations.filter((d) => open.donationIds.includes(d.id)) : []
  const variance = open ? payoutVariance(open) : null

  const columns: Column<SquarePayout>[] = [
    {
      key: 'ref',
      header: 'Payout',
      primary: true,
      cell: (p) => <span className="font-mono text-[13px] text-stone-900 tabular-nums">{p.payoutRef}</span>,
    },
    {
      key: 'date',
      header: 'Date',
      cell: (p) => <span className="font-mono text-[13px] tabular-nums">{formatDate(p.date)}</span>,
    },
    { key: 'count', header: 'Donations', align: 'right', cell: (p) => p.donationIds.length },
    { key: 'gross', header: 'Gross', align: 'right', cell: (p) => <Money value={p.gross} /> },
    { key: 'fee', header: 'Fee', align: 'right', hideOnMobile: true, cell: (p) => <Money value={p.fee} tone="muted" /> },
    { key: 'net', header: 'Net', align: 'right', primary: true, cell: (p) => <Money value={p.net} tone="in" /> },
    {
      key: 'bank',
      header: 'Bank credit',
      align: 'right',
      hideOnMobile: true,
      cell: (p) => <Money value={p.bankCredit ?? p.net} tone={payoutVariance(p).bank === 0 ? undefined : 'out'} />,
    },
    { key: 'status', header: 'Status', cell: (p) => <StatusBadge status={p.status} /> },
  ]

  const unmatchedValue = unmatched.reduce((s, p) => s + p.net, 0)

  return (
    <div>
      <PageHeader
        phase="control"
        title="Reconciliation"
        description="Each day's Square payout is set against the bank credit and the ledger. Anything that does not tie out stays here until someone explains it."
      >
        <Tabs
          value={tab}
          onChange={setTab}
          items={[
            { id: 'unmatched', label: 'Needs attention', count: unmatched.length },
            { id: 'matched', label: 'Matched', count: matched.length },
          ]}
        />
      </PageHeader>

      {!db.ready ? (
        <TableSkeleton rows={8} cols={7} />
      ) : (
        <div className="flex flex-col gap-6">
          <div className="grid gap-4 sm:grid-cols-3">
            <Stat
              label="Payouts to resolve"
              value={unmatched.length}
              sub={`${formatMoney(unmatchedValue)} unconfirmed`}
              accentClass="bg-marigold-500"
              icon={<AlertTriangle className="size-4" aria-hidden />}
            />
            <Stat label="Matched this period" value={matched.length} accentClass="bg-tulsi-500" />
            <Stat
              label="Fees absorbed"
              value={<Money value={db.payouts.reduce((s, p) => s + p.fee, 0)} />}
              sub="across all payouts"
              accentClass="bg-kumkum-600"
            />
          </div>

          {rows.length === 0 ? (
            <EmptyState
              title={tab === 'unmatched' ? 'Everything ties out' : 'No matched payouts yet'}
              message={
                tab === 'unmatched'
                  ? 'Every Square payout agrees with the ledger. Nothing needs chasing.'
                  : 'Once a payout is reconciled it moves here.'
              }
            />
          ) : (
            <Table
              columns={columns}
              rows={rows}
              rowKey={(p) => p.id}
              onRowClick={(p) => setOpenId(p.id)}
              rowClassName={(p) => (p.status === 'unmatched' ? 'bg-danger-50' : undefined)}
            />
          )}
        </div>
      )}

      <Drawer
        open={Boolean(open)}
        onClose={() => {
          setOpenId(null)
          setResolution('')
        }}
        title={open?.payoutRef ?? ''}
        subtitle={open ? `${formatDate(open.date)} · ${open.donationIds.length} donations` : undefined}
        width="lg"
        footer={
          open && open.status !== 'matched' && variance ? (
            <div className="flex flex-col gap-3">
              {variance.tied ? null : (
                <Textarea
                  label="Why does it differ?"
                  placeholder="e.g. Chargeback fee of $18.40 confirmed on the Square statement."
                  value={resolution}
                  onChange={(e) => setResolution(e.target.value)}
                  hint="At least 10 characters. It is written to the audit log."
                />
              )}
              <Button
                fullWidth
                icon={<Link2 className="size-4" aria-hidden />}
                disabled={!variance.tied && resolution.trim().length < 10}
                onClick={() => {
                  matchPayout(open.id, currentUser(personaId), resolution)
                  setOpenId(null)
                  setResolution('')
                }}
              >
                {variance.tied ? 'Mark reconciled' : 'Reconcile with explained difference'}
              </Button>
            </div>
          ) : null
        }
      >
        {open && variance ? (
          <div className="flex flex-col gap-5">
            <StatusBadge status={open.status} />

            {open.note ? (
              <div className="rounded-lg border border-marigold-50 bg-marigold-50 px-3 py-2.5 text-[13px] text-marigold-500">
                {open.note}
              </div>
            ) : null}

            <Card className="bg-sandal-100">
              <h3 className="mb-3 text-[11px] font-semibold tracking-[0.12em] text-stone-500 uppercase">Three-way tie</h3>
              <dl className="space-y-2 text-[14px]">
                <div className="flex justify-between">
                  <dt className="text-stone-700">Square net payout</dt>
                  <dd>
                    <Money value={open.net} />
                  </dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-stone-700">
                    Bank credit
                    {open.bankRef ? <span className="ml-2 font-mono text-[12px] text-stone-500">{open.bankRef}</span> : null}
                  </dt>
                  <dd className="flex items-center gap-2">
                    {variance.bank !== 0 ? <Money value={variance.bank} tone="out" className="text-[13px]" /> : null}
                    <Money value={open.bankCredit ?? open.net} />
                  </dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-stone-700">Ledger</dt>
                  <dd className="flex items-center gap-2">
                    {variance.ledger !== 0 ? <Money value={variance.ledger} tone="out" className="text-[13px]" /> : null}
                    <Money value={open.ledgerNet ?? open.net} />
                  </dd>
                </div>
                <div className="flex justify-between border-t border-sandal-200 pt-2">
                  <dt className="font-medium text-stone-900">Result</dt>
                  <dd className={variance.tied ? 'font-medium text-tulsi-700' : 'font-medium text-danger-600'}>
                    {variance.tied ? 'Ties out' : 'Does not tie out'}
                  </dd>
                </div>
              </dl>
            </Card>

            {open.resolution ? (
              <p className="rounded-lg bg-sandal-100 px-3 py-2.5 text-[13px] text-stone-700">
                <span className="font-medium">Accepted difference:</span> {open.resolution}
              </p>
            ) : null}

            <Card className="bg-sandal-100">
              <dl className="space-y-2 text-[14px]">
                <div className="flex justify-between">
                  <dt className="text-stone-700">Gross in Square</dt>
                  <dd>
                    <Money value={open.gross} />
                  </dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-stone-700">Processing fees</dt>
                  <dd>
                    <Money value={open.fee} tone="muted" />
                  </dd>
                </div>
                <div className="flex justify-between border-t border-sandal-200 pt-2">
                  <dt className="font-medium text-stone-900">Expected in bank</dt>
                  <dd>
                    <Money value={open.net} className="font-medium" />
                  </dd>
                </div>
              </dl>
            </Card>

            <section>
              <h3 className="mb-2 text-[11px] font-semibold tracking-[0.12em] text-stone-500 uppercase">
                Donations in this payout
              </h3>
              <ul className="flex flex-col divide-y divide-sandal-200 rounded-card border">
                {openDonations.slice(0, 30).map((d) => (
                  <li key={d.id} className="flex items-center justify-between gap-3 px-3 py-2.5">
                    <div className="min-w-0">
                      <p className="truncate font-mono text-[13px] text-stone-900 tabular-nums">{d.receiptNo}</p>
                      <p className="truncate text-[13px] text-stone-500">{donorName(db, d.donorId)}</p>
                    </div>
                    <Money value={d.gross} className="shrink-0 text-[14px]" />
                  </li>
                ))}
              </ul>
              {openDonations.length > 30 ? (
                <p className="mt-2 text-[13px] text-stone-500">
                  and {openDonations.length - 30} more in this batch.
                </p>
              ) : null}
            </section>
          </div>
        ) : null}
      </Drawer>
    </div>
  )
}
