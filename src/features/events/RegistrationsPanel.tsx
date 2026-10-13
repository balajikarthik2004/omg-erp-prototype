import { useState } from 'react'
import { ScanLine, Ticket, UserPlus, Users } from 'lucide-react'

import { formatDateTime } from '@/lib/format'
import { Button } from '@/components/ui/Button'
import { Card, CardHeader } from '@/components/ui/Card'
import { Drawer } from '@/components/ui/Drawer'
import { EmptyState } from '@/components/ui/EmptyState'
import { Input } from '@/components/ui/Input'
import { Money } from '@/components/ui/Money'
import { Stat } from '@/components/ui/Stat'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { Table, type Column } from '@/components/ui/Table'
import { useDb } from '@/store/db'
import { currentUser, useSession } from '@/store/session'
import type { EventRegistration } from '@/types'
import { REGISTRATION_STATES, seatsTaken } from './logic/rules'
import { TicketQr } from './TicketQr'
import type { EventView } from './useEvent'

/** Step 5: who has tickets. Opening a row shows the ticket QR the volunteer scans at the door. */
export function RegistrationsPanel({ view }: { view: EventView }) {
  const { event, registrations } = view
  const db = useDb()
  const personaId = useSession((s) => s.personaId)
  const user = currentUser(personaId)
  const register = useDb((s) => s.registerAttendee)
  const checkIn = useDb((s) => s.checkInTicket)
  const [openId, setOpenId] = useState<string>()
  const [form, setForm] = useState({ name: '', phone: '', qty: '1' })
  const [error, setError] = useState<string>()

  const open = registrations.find((r) => r.id === openId)
  const taken = seatsTaken(db, event.id)
  const inside = registrations.filter((r) => r.checkedInAt && r.status === 'active').reduce((s, r) => s + r.qty, 0)
  const canRegister = REGISTRATION_STATES.includes(event.status)

  const columns: Column<EventRegistration>[] = [
    { key: 'name', header: 'Name', primary: true, cell: (r) => <span className="text-stone-900">{r.name}</span> },
    { key: 'phone', header: 'Phone', hideOnMobile: true, cell: (r) => <span className="font-mono text-[13px] tabular-nums">{r.phone}</span> },
    { key: 'qty', header: 'Tickets', align: 'right', cell: (r) => r.qty },
    { key: 'paid', header: 'Paid', align: 'right', cell: (r) => (r.amountPaid > 0 ? <Money value={r.amountPaid} /> : <span className="text-stone-500">Free</span>) },
    { key: 'status', header: 'Entry', cell: (r) => (r.status !== 'active' ? <StatusBadge status={r.status} /> : r.checkedInAt ? <StatusBadge status="confirmed" /> : <span className="text-[13px] text-stone-500">Not yet</span>) },
  ]

  return (
    <div className="flex flex-col gap-6">
      <div className="grid gap-4 sm:grid-cols-3">
        <Stat label="Seats taken" value={event.capacity ? `${taken} / ${event.capacity}` : taken} accentClass="bg-turmeric-500" icon={<Users className="size-4" aria-hidden />} />
        <Stat label="Checked in" value={inside} sub={taken > 0 ? `${Math.round((inside / taken) * 100)}% of those registered` : undefined} accentClass="bg-tulsi-500" icon={<ScanLine className="size-4" aria-hidden />} />
        <Stat label="Ticket income" value={<Money value={view.pnl.ticketIncome} />} accentClass="bg-kumkum-600" icon={<Ticket className="size-4" aria-hidden />} />
      </div>

      {registrations.length === 0 ? (
        <EmptyState icon={<Ticket className="size-6" aria-hidden />} title="No registrations yet" message={canRegister ? 'Share the poster. Registrations appear here as they arrive.' : 'Registration opens once the poster is approved.'} />
      ) : (
        <Table columns={columns} rows={registrations} rowKey={(r) => r.id} onRowClick={(r) => setOpenId(r.id)} />
      )}

      {canRegister ? (
        <Card>
          <CardHeader title="Register at the desk" description="For someone who walks up. Online registrations arrive on their own." />
          <div className="mt-3 grid gap-3 sm:grid-cols-[1fr_1fr_100px_auto] sm:items-end">
            <Input label="Name" value={form.name} onChange={(e) => { setForm({ ...form, name: e.target.value }); setError(undefined) }} />
            <Input label="Phone" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
            <Input label="Tickets" inputMode="numeric" value={form.qty} onChange={(e) => setForm({ ...form, qty: e.target.value.replace(/\D/g, '') })} />
            <Button icon={<UserPlus className="size-4" aria-hidden />} onClick={() => {
              const r = register(event.id, { name: form.name, phone: form.phone, qty: Number(form.qty) }, user)
              if (!r.ok) setError(r.error)
              else setForm({ name: '', phone: '', qty: '1' })
            }}>Register</Button>
          </div>
          {error ? <p role="alert" className="mt-2 text-[13px] text-danger-600">{error}</p> : null}
        </Card>
      ) : null}

      <Drawer open={Boolean(open)} onClose={() => setOpenId(undefined)} title={open?.name ?? ''} subtitle={open ? `${open.qty} ticket${open.qty === 1 ? '' : 's'} · registered ${formatDateTime(open.createdAt)}` : undefined}
        footer={open && event.status === 'live' && open.status === 'active' ? (
          <Button fullWidth icon={<ScanLine className="size-4" aria-hidden />} disabled={Boolean(open.checkedInAt)} onClick={() => checkIn(event.id, open.ticketToken, user)}>
            {open.checkedInAt ? 'Already checked in' : 'Scan this ticket'}
          </Button>
        ) : null}>
        {open ? (
          <div className="flex flex-col items-center gap-4">
            <TicketQr token={open.ticketToken} />
            <p className="max-w-full break-all rounded-lg bg-sandal-100 px-3 py-2 text-center font-mono text-[12px] text-stone-700">{open.ticketToken}</p>
            <dl className="w-full space-y-2 text-[14px]">
              <div className="flex justify-between"><dt className="text-stone-700">Phone</dt><dd className="font-mono tabular-nums">{open.phone}</dd></div>
              <div className="flex justify-between"><dt className="text-stone-700">Paid</dt><dd>{open.amountPaid > 0 ? <Money value={open.amountPaid} /> : 'Free'}</dd></div>
              <div className="flex justify-between"><dt className="text-stone-700">Entry</dt><dd>{open.checkedInAt ? `Scanned ${formatDateTime(open.checkedInAt)}` : 'Not scanned'}</dd></div>
            </dl>
            <p className="text-center text-[12px] text-stone-500">One signed code per registration. A second scan is refused.</p>
          </div>
        ) : null}
      </Drawer>
    </div>
  )
}
