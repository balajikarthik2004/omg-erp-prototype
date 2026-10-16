import { useState } from 'react'
import { Lock, TrendingDown, TrendingUp } from 'lucide-react'

import { cn } from '@/lib/cn'
import { formatMoneyShort } from '@/lib/format'
import { Button } from '@/components/ui/Button'
import { Card, CardHeader } from '@/components/ui/Card'
import { Dialog } from '@/components/ui/Dialog'
import { Money } from '@/components/ui/Money'
import { Stat } from '@/components/ui/Stat'
import { useDb } from '@/store/db'
import { currentUser, useSession } from '@/store/session'
import { gateBlock } from './logic/rules'
import type { EventView } from './useEvent'

/** Step 6: spent against budget, profit or loss, and the CA's close. Closing locks the event and feeds next year's budget. */
export function CloseTab({ view }: { view: EventView }) {
  const { event, pnl } = view
  const personaId = useSession((s) => s.personaId)
  const user = currentUser(personaId)
  const closeEvent = useDb((s) => s.closeEvent)
  const [confirming, setConfirming] = useState(false)
  const [error, setError] = useState<string>()

  const closed = event.status === 'closed'
  const shown = closed && event.closurePnl ? event.closurePnl : null
  const cashIn = shown ? shown.ticketIncome + shown.sponsorIncome + shown.donationIncome : pnl.ticketIncome + pnl.sponsorIncome + pnl.donationIncome
  const out = shown ? shown.expenses : pnl.expenses
  const net = shown ? shown.net : pnl.net
  const block = gateBlock(event, { type: 'CLOSE_EVENT', pnl: undefined }, user)
  const openOrders = view.orders.filter((o) => o.status === 'pending_ca' || o.status === 'approved').length

  return (
    <div className="flex flex-col gap-6">
      <div className="grid gap-4 sm:grid-cols-3">
        <Stat label="Cash in" value={<Money value={cashIn} tone="in" />} sub="tickets, cash sponsors, donations" accentClass="bg-tulsi-500" />
        <Stat label="Paid out" value={<Money value={out} tone="out" />} sub="paid orders only" accentClass="bg-kumkum-600" />
        <Stat
          label={net >= 0 ? 'Profit' : 'Loss'}
          value={<Money value={Math.abs(net)} tone={net >= 0 ? 'in' : 'out'} />}
          sub={closed ? 'Locked at close' : 'So far'}
          accentClass={net >= 0 ? 'bg-tulsi-500' : 'bg-danger-600'}
          icon={net >= 0 ? <TrendingUp className="size-4" aria-hidden /> : <TrendingDown className="size-4" aria-hidden />}
        />
      </div>

      <Card padded={false}>
        <div className="border-b border-sandal-200 p-5">
          <h2 className="font-display text-[18px] text-stone-900">Spent against budget</h2>
          <p className="mt-1 text-[13px] text-stone-500">Only paid orders count as spent. Committed is approved or waiting, and still counts against the line.</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] border-collapse text-[14px]">
            <thead>
              <tr className="bg-sandal-100 text-left text-[11px] font-semibold tracking-[0.1em] text-stone-500 uppercase">
                <th className="px-4 py-3">Cost line</th>
                <th className="w-44 px-3 py-3">Used</th>
                <th className="px-3 py-3 text-right">Budget</th>
                <th className="px-3 py-3 text-right">Committed</th>
                <th className="px-3 py-3 text-right">Spent</th>
                <th className="px-3 py-3 text-right">Left</th>
              </tr>
            </thead>
            <tbody>
              {pnl.lines.map((l) => {
                const pct = l.budget > 0 ? Math.min(100, (l.spent / l.budget) * 100) : 0
                return (
                  <tr key={l.lineId} className="border-t border-sandal-200">
                    <td className="px-4 py-3 text-stone-900">{l.category}</td>
                    <td className="px-3 py-3">
                      <div className="h-2 w-full overflow-hidden rounded-full bg-sandal-200" role="img" aria-label={`${Math.round(pct)}% spent`}>
                        <span className={cn('block h-full rounded-full', pct >= 100 ? 'bg-danger-600' : 'bg-tulsi-500')} style={{ width: `${pct}%` }} />
                      </div>
                    </td>
                    <td className="px-3 py-3 text-right"><Money value={l.budget} /></td>
                    <td className="px-3 py-3 text-right"><Money value={l.committed} tone="muted" /></td>
                    <td className="px-3 py-3 text-right"><Money value={l.spent} /></td>
                    <td className="px-3 py-3 text-right"><Money value={l.variance} tone={l.variance < 0 ? 'out' : 'default'} /></td>
                  </tr>
                )
              })}
            </tbody>
            <tfoot>
              <tr className="border-t-2 border-turmeric-400/50 bg-sandal-100 font-medium">
                <td className="px-4 py-3 text-stone-900" colSpan={2}>Total</td>
                <td className="px-3 py-3 text-right"><Money value={pnl.totalBudget} /></td>
                <td className="px-3 py-3 text-right"><Money value={pnl.totalCommitted} tone="muted" /></td>
                <td className="px-3 py-3 text-right"><Money value={pnl.totalSpent} /></td>
                <td className="px-3 py-3 text-right"><Money value={pnl.budgetVariance} tone={pnl.budgetVariance < 0 ? 'out' : 'default'} /></td>
              </tr>
            </tfoot>
          </table>
        </div>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2 lg:items-start">
        <Card>
          <CardHeader title="Income" />
          <dl className="mt-3 space-y-2 text-[14px]">
            <div className="flex justify-between"><dt className="text-stone-700">Tickets</dt><dd><Money value={shown?.ticketIncome ?? pnl.ticketIncome} /></dd></div>
            <div className="flex justify-between"><dt className="text-stone-700">Cash sponsors</dt><dd><Money value={shown?.sponsorIncome ?? pnl.sponsorIncome} /></dd></div>
            <div className="flex justify-between"><dt className="text-stone-700">Event donations</dt><dd><Money value={shown?.donationIncome ?? pnl.donationIncome} /></dd></div>
            <div className="flex justify-between border-t border-sandal-200 pt-2"><dt className="font-medium text-stone-900">Cash in</dt><dd><Money value={cashIn} tone="in" className="font-medium" /></dd></div>
            <div className="flex justify-between text-stone-500"><dt>In-kind sponsorship (not cash)</dt><dd><Money value={pnl.inKindSponsorValue} tone="muted" /></dd></div>
          </dl>
        </Card>

        <Card accentClass={closed ? 'bg-tulsi-500' : 'bg-turmeric-500'}>
          <CardHeader title={closed ? 'Closed and locked' : 'Close the event'} description={closed ? 'Nothing can change now. The actual spend per line is saved and will pre-fill next year’s budget.' : 'The CA team closes the event after reviewing the figures.'} />
          {!closed ? (
            <div className="mt-4 flex flex-col gap-3">
              {event.status !== 'completed' ? <p className="text-[13px] text-stone-500">The event must be ended first. Right now it is {event.status.replace(/_/g, ' ')}.</p> : null}
              {openOrders > 0 ? <p className="text-[13px] text-marigold-500">{openOrders} order{openOrders === 1 ? ' is' : 's are'} still open. Pay, reject or cancel them first.</p> : null}
              {block && event.status === 'completed' ? <p className="text-[13px] text-marigold-500">{block}</p> : null}
              {error ? <p role="alert" className="text-[13px] text-danger-600">{error}</p> : null}
              <Button icon={<Lock className="size-4" aria-hidden />} disabled={Boolean(block)} title={block ?? undefined} onClick={() => setConfirming(true)}>Close event</Button>
            </div>
          ) : null}
        </Card>
      </div>

      <Dialog open={confirming} onClose={() => setConfirming(false)} title="Close this event?" description={`${event.name} will be locked. ${net >= 0 ? 'Profit' : 'Loss'} of ${formatMoneyShort(Math.abs(net))}. Any money still in the event fund goes back to the sector.`}
        footer={<div className="flex justify-end gap-2"><Button variant="ghost" onClick={() => setConfirming(false)}>Not yet</Button><Button onClick={() => { const r = closeEvent(event.id, user); setConfirming(false); setError(r.ok ? undefined : r.error) }}>Close and lock</Button></div>} />
    </div>
  )
}
