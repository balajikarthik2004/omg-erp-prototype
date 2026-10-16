import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { CalendarDays, CircleCheck, Loader2, MapPin, Minus, Plus, Ticket, UserRound } from 'lucide-react'

import { formatDateTime, formatMoney } from '@/lib/format'
import { Button } from '@/components/ui/Button'
import { EmptyState } from '@/components/ui/EmptyState'
import { Input } from '@/components/ui/Input'
import { Skeleton } from '@/components/ui/Skeleton'
import { SectorChip } from '@/components/layout/PhaseChip'
import { api } from '@/mock/api'
import { PUBLIC_REGISTRATION } from '@/mock/seed'
import { useDb } from '@/store/db'
import type { EventRegistration } from '@/types'
import { REGISTRATION_STATES, seatsTaken } from './logic/rules'
import { TicketQr } from './TicketQr'

/** The page the poster QR opens. It is open only after the poster is approved. Paid tickets show a mock payment step. */
export function RegisterPage() {
  const { eventId } = useParams<{ eventId: string }>()
  const db = useDb()
  const register = useDb((s) => s.registerAttendee)
  const event = db.events.find((e) => e.id === eventId)
  const [f, setF] = useState({ name: '', phone: '', email: '' })
  const [qty, setQty] = useState(1)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string>()
  const [ticket, setTicket] = useState<EventRegistration>()

  if (!db.ready) return <div className="mx-auto max-w-3xl px-5 py-12"><Skeleton className="h-96 w-full" /></div>
  if (!event) {
    return <div className="mx-auto max-w-2xl px-5 py-16"><EmptyState title="Event not found" message="This link may be old, or the prototype reloaded." action={<Link to="/events"><Button>See all events</Button></Link>} /></div>
  }

  const open = REGISTRATION_STATES.includes(event.status)
  const left = event.capacity ? Math.max(0, event.capacity - seatsTaken(db, event.id)) : null
  const total = event.isPaid ? (event.ticketPrice ?? 0) * qty : 0

  async function submit() {
    setBusy(true)
    if (event!.isPaid) await api.process(1200)
    const r = register(event!.id, { name: f.name, phone: f.phone, email: f.email, qty }, PUBLIC_REGISTRATION)
    setBusy(false)
    if (!r.ok) setError(r.error)
    else setTicket(r.registration)
  }

  return (
    <div className="mx-auto max-w-3xl px-5 py-12 sm:px-8">
      <SectorChip sectorId={event.sectorId} withTamil />
      <h1 className="mt-3 font-heritage text-[40px] leading-[1.05] font-semibold text-stone-900 sm:text-[52px]">{event.name}</h1>
      {event.image ? (
        <div className="my-6 aspect-[16/10] max-h-80 w-full overflow-hidden rounded-2xl border border-sandal-200 bg-navy-950 shadow-md">
          <img src={event.image} alt={event.name} className="h-full w-full object-cover" />
        </div>
      ) : null}
      <ul className="mt-5 flex flex-col gap-2 text-[15px] text-stone-700">
        <li className="flex items-start gap-2.5"><CalendarDays className="mt-0.5 size-[18px] shrink-0 text-turmeric-700" aria-hidden />{formatDateTime(event.startAt)}</li>
        <li className="flex items-start gap-2.5"><MapPin className="mt-0.5 size-[18px] shrink-0 text-turmeric-700" aria-hidden />{event.venue}</li>
        {event.chiefGuest ? <li className="flex items-start gap-2.5"><UserRound className="mt-0.5 size-[18px] shrink-0 text-turmeric-700" aria-hidden />Chief guest: {event.chiefGuest}</li> : null}
        <li className="flex items-start gap-2.5"><Ticket className="mt-0.5 size-[18px] shrink-0 text-turmeric-700" aria-hidden />{event.isPaid ? `${formatMoney(event.ticketPrice ?? 0)} per ticket` : 'Free entry'}{left !== null ? ` · ${left} seats left` : ''}</li>
      </ul>

      {ticket ? (
        <section className="mt-8 overflow-hidden rounded-card border border-sandal-200 bg-sandal-50 shadow-card" aria-live="polite">
          <div className="flex items-center gap-3 border-b border-sandal-200 bg-tulsi-50 px-6 py-4 text-tulsi-700">
            <CircleCheck className="size-5" aria-hidden />
            <p className="text-[15px] font-medium">You are registered, {ticket.name}. Keep this ticket for the door.</p>
          </div>
          <div className="flex flex-col items-center gap-5 p-6 sm:flex-row sm:items-start">
            <TicketQr token={ticket.ticketToken} />
            <div className="min-w-0 flex-1">
              <p className="font-heritage text-[28px] leading-tight font-semibold text-stone-900">{event.name}</p>
              <p className="mt-1 text-[14px] text-stone-700">{ticket.qty} ticket{ticket.qty === 1 ? '' : 's'}{ticket.amountPaid > 0 ? ` · paid ${formatMoney(ticket.amountPaid)}` : ' · free'}</p>
              <p className="mt-3 break-all rounded-lg bg-sandal-100 px-3 py-2 font-mono text-[12px] text-stone-700">{ticket.ticketToken}</p>
              <p className="mt-3 text-[13px] text-stone-500">One code per registration. It is scanned once. A copy is refused.</p>
              <Button className="mt-4" variant="secondary" onClick={() => { setTicket(undefined); setF({ name: '', phone: '', email: '' }); setQty(1) }}>Register someone else</Button>
            </div>
          </div>
        </section>
      ) : !open ? (
        <div className="mt-8"><EmptyState icon={<CalendarDays className="size-6" aria-hidden />} title={event.status === 'cancelled' ? 'This event was cancelled' : event.status === 'closed' || event.status === 'completed' ? 'This event is over' : 'Registration is not open yet'} message={event.status === 'cancelled' ? (event.cancelReason ?? '') : 'Registration opens once the poster is approved. Please check back soon.'} action={<Link to="/events"><Button variant="secondary">See other events</Button></Link>} /></div>
      ) : left === 0 ? (
        <div className="mt-8"><EmptyState title="This event is full" message="Every seat is taken. Please look at our other events." action={<Link to="/events"><Button variant="secondary">See other events</Button></Link>} /></div>
      ) : (
        <section className="mt-8 rounded-card border border-sandal-200 bg-sandal-50 p-6 shadow-card">
          <h2 className="font-heritage text-[26px] font-semibold text-stone-900">Register</h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <Input label="Your name" value={f.name} onChange={(e) => { setF({ ...f, name: e.target.value }); setError(undefined) }} />
            <Input label="Phone" value={f.phone} onChange={(e) => setF({ ...f, phone: e.target.value })} />
            <div className="sm:col-span-2"><Input label="Email (optional)" type="email" value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} /></div>
          </div>

          <div className="mt-5 flex items-center gap-4">
            <span className="text-[14px] font-medium text-stone-700">Tickets</span>
            <button type="button" aria-label="Fewer tickets" disabled={qty <= 1} onClick={() => setQty((q) => q - 1)} className="flex size-10 items-center justify-center rounded-lg border border-sandal-300 text-stone-700 hover:border-turmeric-400 disabled:opacity-40"><Minus className="size-4" aria-hidden /></button>
            <span className="w-8 text-center font-mono text-[18px] tabular-nums" aria-live="polite">{qty}</span>
            <button type="button" aria-label="More tickets" disabled={qty >= Math.min(10, left ?? 10)} onClick={() => setQty((q) => q + 1)} className="flex size-10 items-center justify-center rounded-lg border border-sandal-300 text-stone-700 hover:border-turmeric-400 disabled:opacity-40"><Plus className="size-4" aria-hidden /></button>
          </div>

          {error ? <p role="alert" className="mt-4 text-[14px] text-danger-600">{error}</p> : null}
          <Button className="mt-5" size="lg" fullWidth disabled={busy} icon={busy ? <Loader2 className="size-4 animate-spin" aria-hidden /> : undefined} onClick={() => void submit()}>
            {busy ? 'Processing' : event.isPaid ? `Pay ${formatMoney(total)} and register` : 'Register'}
          </Button>
          {event.isPaid ? <p className="mt-3 text-center text-[12px] text-stone-500">Prototype: no real payment is taken. {event.ticketTaxNote ?? ''}</p> : null}
        </section>
      )}
    </div>
  )
}
