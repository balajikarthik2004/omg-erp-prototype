import { useState } from 'react'
import { HandCoins, Handshake } from 'lucide-react'

import { formatDate, formatMoney } from '@/lib/format'
import { Button } from '@/components/ui/Button'
import { Card, CardHeader } from '@/components/ui/Card'
import { Input } from '@/components/ui/Input'
import { Money } from '@/components/ui/Money'
import { Select } from '@/components/ui/Select'
import { useDb } from '@/store/db'
import { currentUser, useSession } from '@/store/session'
import { recordBlock, SPEND_STATES } from './logic/rules'
import { toCents, type EventView } from './useEvent'

/** Sponsors and event donations. Cash goes into the event fund; in-kind is shown separately and never counted as cash. */
export function IncomePanel({ view }: { view: EventView }) {
  const { event, sponsors, donations } = view
  const personaId = useSession((s) => s.personaId)
  const user = currentUser(personaId)
  const addSponsor = useDb((s) => s.addSponsor)
  const addDonation = useDb((s) => s.addEventDonation)
  const [sp, setSp] = useState({ name: '', kind: 'cash', amount: '', note: '' })
  const [dn, setDn] = useState({ name: '', amount: '' })
  const [spError, setSpError] = useState<string>()
  const [dnError, setDnError] = useState<string>()

  const block = recordBlock(user) ?? (SPEND_STATES.includes(event.status) ? null : 'Open once the event is confirmed.')

  return (
    <div className="grid gap-6 lg:grid-cols-2 lg:items-start">
      <Card>
        <CardHeader title="Sponsors" description={`Cash ${formatCash(view.pnl.sponsorIncome)} · in kind ${formatCash(view.pnl.inKindSponsorValue)}`} />
        <ul className="mt-3 divide-y divide-sandal-200">
          {sponsors.length === 0 ? <li className="py-3 text-[14px] text-stone-500">No sponsors yet.</li> : null}
          {sponsors.map((s) => (
            <li key={s.id} className="flex items-start justify-between gap-3 py-2.5 text-[14px]">
              <div>
                <p className="text-stone-900">{s.sponsorName}</p>
                <p className="text-[12px] text-stone-500">{s.kind === 'cash' ? 'Cash' : `In kind${s.description ? `: ${s.description}` : ''}`} · {formatDate(s.receivedAt)} · {s.receiptNo}</p>
              </div>
              <Money value={s.amount} tone={s.kind === 'cash' ? 'in' : 'muted'} />
            </li>
          ))}
        </ul>
        <div className="mt-4 grid gap-3 border-t border-sandal-200 pt-4 sm:grid-cols-2">
          <Input label="Sponsor" value={sp.name} onChange={(e) => { setSp({ ...sp, name: e.target.value }); setSpError(undefined) }} />
          <Select label="Kind" value={sp.kind} onChange={(e) => setSp({ ...sp, kind: e.target.value })} options={[{ value: 'cash', label: 'Cash' }, { value: 'in_kind', label: 'In kind' }]} />
          <Input label="Amount" inputMode="decimal" leading={<span>$</span>} value={sp.amount} onChange={(e) => setSp({ ...sp, amount: e.target.value })} className="font-mono tabular-nums" />
          <Input label="What was given (in kind)" value={sp.note} onChange={(e) => setSp({ ...sp, note: e.target.value })} />
        </div>
        {block ? <p className="mt-2 text-[13px] text-marigold-500">{block}</p> : null}
        {spError ? <p role="alert" className="mt-2 text-[13px] text-danger-600">{spError}</p> : null}
        <Button className="mt-3" icon={<Handshake className="size-4" aria-hidden />} disabled={Boolean(block)} onClick={() => {
          const r = addSponsor(event.id, { sponsorName: sp.name, kind: sp.kind as 'cash' | 'in_kind', amount: toCents(sp.amount), description: sp.note }, user)
          if (!r.ok) setSpError(r.error)
          else setSp({ name: '', kind: 'cash', amount: '', note: '' })
        }}>Record sponsor</Button>
      </Card>

      <Card>
        <CardHeader title="Event donations" description={`${formatCash(view.pnl.donationIncome)} tagged to this event. It goes into the event fund.`} />
        <ul className="mt-3 divide-y divide-sandal-200">
          {donations.length === 0 ? <li className="py-3 text-[14px] text-stone-500">No donations yet.</li> : null}
          {donations.map((d) => (
            <li key={d.id} className="flex items-start justify-between gap-3 py-2.5 text-[14px]">
              <div>
                <p className="text-stone-900">{d.donorName}</p>
                <p className="text-[12px] text-stone-500">{formatDate(d.receivedAt)} · {d.receiptNo}</p>
              </div>
              <Money value={d.amount} tone="in" />
            </li>
          ))}
        </ul>
        <div className="mt-4 grid gap-3 border-t border-sandal-200 pt-4 sm:grid-cols-2">
          <Input label="Donor" value={dn.name} onChange={(e) => { setDn({ ...dn, name: e.target.value }); setDnError(undefined) }} />
          <Input label="Amount" inputMode="decimal" leading={<span>$</span>} value={dn.amount} onChange={(e) => setDn({ ...dn, amount: e.target.value })} className="font-mono tabular-nums" />
        </div>
        {dnError ? <p role="alert" className="mt-2 text-[13px] text-danger-600">{dnError}</p> : null}
        <Button className="mt-3" icon={<HandCoins className="size-4" aria-hidden />} disabled={Boolean(block)} onClick={() => {
          const r = addDonation(event.id, { donorName: dn.name, amount: toCents(dn.amount) }, user)
          if (!r.ok) setDnError(r.error)
          else setDn({ name: '', amount: '' })
        }}>Record donation</Button>
      </Card>
    </div>
  )
}

const formatCash = formatMoney
