import { useMemo, useState } from 'react'
import { CalendarDays, Clock, Info, MapPin, QrCode, Users } from 'lucide-react'

import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Drawer } from '@/components/ui/Drawer'
import { Input, Textarea } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { cn } from '@/lib/cn'
import { displayPrice, type Currency } from '@/lib/currency'
import { formatDate, formatMoney } from '@/lib/format'
import { VISIT_SERVICES } from '@/mock/gaushalaPrograms'
import { useDb } from '@/store/db'
import { currentUser, useSession } from '@/store/session'
import type { Slot, VisitService } from '@/types'

const DOS_AND_DONTS = {
  please: [
    'Come a few minutes early; the feed starts on time.',
    'Feed only what a caretaker hands you.',
    'Move slowly and let the cow come to you.',
    'Wear shoes you do not mind getting muddy.',
  ],
  never: [
    'No plastic of any kind in the yard. It is what puts most of these cows on the operating table.',
    'No flash photography near the sick bay.',
    'Do not feed an animal that is on a restricted diet — the caretaker will say which.',
    'No outside food for the cattle, however well meant.',
  ],
}

export function VisitBookTab({ currency }: { currency: Currency }) {
  const [booking, setBooking] = useState<VisitService | null>(null)
  const services = VISIT_SERVICES.filter((s) => s.active)

  return (
    <div>
      <div className="grid gap-6 lg:grid-cols-[1.5fr_1fr] lg:items-start">
        <div>
          <h2 className="font-display text-[22px] leading-tight text-stone-900">Come and see them</h2>
          <p className="mt-2 max-w-2xl text-[14.5px] leading-relaxed text-stone-700">
            Pick what you would like to do, choose a time, and you will get a QR code by email. Show it at the gate.
            Everything except darshan is paid for at booking, and a booking can be moved or cancelled up to
            24&nbsp;hours before.
          </p>
        </div>

        <aside className="rounded-card border border-sandal-200 bg-sandal-50 p-5 shadow-card">
          <h3 className="text-[11.5px] font-extrabold tracking-[0.14em] text-stone-500 uppercase">Visiting</h3>
          <dl className="mt-3 space-y-2.5 text-[13.5px] text-stone-700">
            <div className="flex items-start gap-2.5">
              <Clock className="mt-0.5 size-4 shrink-0 text-stone-500" aria-hidden />
              <span>6:30&nbsp;am&nbsp;–&nbsp;10:00&nbsp;am and 4:00&nbsp;pm&nbsp;–&nbsp;6:30&nbsp;pm</span>
            </div>
            <div className="flex items-start gap-2.5">
              <CalendarDays className="mt-0.5 size-4 shrink-0 text-stone-500" aria-hidden />
              <span>Closed every Tuesday, and on days marked closed below</span>
            </div>
            <div className="flex items-start gap-2.5">
              <MapPin className="mt-0.5 size-4 shrink-0 text-stone-500" aria-hidden />
              <span>Thiruparankundram Road, Madurai 625005</span>
            </div>
          </dl>
        </aside>
      </div>

      <ul className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {services.map((service) => (
          <li key={service.id}>
            <ServiceCard service={service} currency={currency} onBook={() => setBooking(service)} />
          </li>
        ))}
      </ul>

      <section className="mt-10 grid gap-5 lg:grid-cols-2">
        <div className="rounded-card border border-tulsi-50 bg-tulsi-50/40 p-5 sm:p-6">
          <h3 className="font-display text-[18px] text-stone-900">Please do</h3>
          <ul className="mt-3 space-y-2 text-[13.5px] leading-relaxed text-stone-700">
            {DOS_AND_DONTS.please.map((line) => (
              <li key={line} className="flex gap-2.5">
                <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-tulsi-500" aria-hidden />
                {line}
              </li>
            ))}
          </ul>
        </div>
        <div className="rounded-card border border-danger-50 bg-danger-50/40 p-5 sm:p-6">
          <h3 className="font-display text-[18px] text-stone-900">Please never</h3>
          <ul className="mt-3 space-y-2 text-[13.5px] leading-relaxed text-stone-700">
            {DOS_AND_DONTS.never.map((line) => (
              <li key={line} className="flex gap-2.5">
                <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-danger-600" aria-hidden />
                {line}
              </li>
            ))}
          </ul>
        </div>
      </section>

      <BookingDrawer service={booking} currency={currency} onClose={() => setBooking(null)} />
    </div>
  )
}

function ServiceCard({
  service,
  currency,
  onBook,
}: {
  service: VisitService
  currency: Currency
  onBook: () => void
}) {
  const free = service.pricePerPerson === 0
  return (
    <div
      className={cn(
        'flex h-full flex-col rounded-card border border-sandal-200 bg-sandal-50 p-5 shadow-card',
        'transition-all duration-200 hover:-translate-y-0.5 hover:border-navy-200 hover:shadow-lift',
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="font-display text-[19px] leading-snug text-stone-900">{service.name}</h3>
          {service.tamil ? <p className="mt-0.5 text-[13.5px] text-stone-500">{service.tamil}</p> : null}
        </div>
        {service.needsApproval ? <Badge>By request</Badge> : null}
      </div>

      <p className="mt-3 flex-1 text-[13.5px] leading-relaxed text-stone-700">{service.blurb}</p>

      <dl className="mt-3.5 flex flex-wrap gap-x-4 gap-y-1 text-[12.5px] text-stone-500">
        <div className="flex items-center gap-1.5">
          <Clock className="size-3.5" aria-hidden />
          {service.durationMins >= 120 ? `${Math.round(service.durationMins / 60)} hours` : `${service.durationMins} min`}
        </div>
        <div className="flex items-center gap-1.5">
          <Users className="size-3.5" aria-hidden />
          {service.minPeople}&ndash;{service.maxPeople} people
        </div>
      </dl>

      <div className="mt-4 flex items-end justify-between gap-3 border-t border-sandal-200 pt-4">
        <span className="font-mono text-[18px] leading-none text-stone-900 tabular-nums">
          {free ? <span className="font-display text-[18px]">Free</span> : displayPrice(service.pricePerPerson, currency)}
          {!free ? <span className="ml-1 font-sans text-[12px] text-stone-500">per person</span> : null}
        </span>
        <Button size="sm" onClick={onBook}>
          {service.needsApproval ? 'Request' : 'Book'}
        </Button>
      </div>
    </div>
  )
}

function BookingDrawer({
  service,
  currency,
  onClose,
}: {
  service: VisitService | null
  currency: Currency
  onClose: () => void
}) {
  const slots = useDb((s) => s.slots)
  const createBooking = useDb((s) => s.createBooking)
  const personaId = useSession((s) => s.personaId)

  const [slotId, setSlotId] = useState('')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [people, setPeople] = useState(1)
  const [note, setNote] = useState('')
  const [consent, setConsent] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [booked, setBooked] = useState<{ token: string; pending: boolean } | null>(null)

  // Grouped by day, so a closed day is visible rather than just missing.
  const byDay = useMemo(() => {
    if (!service) return []
    const mine = slots.filter((s) => s.serviceId === service.id)
    const days = new Map<string, Slot[]>()
    for (const slot of mine) {
      const list = days.get(slot.date) ?? []
      list.push(slot)
      days.set(slot.date, list)
    }
    return [...days.entries()].sort((a, b) => a[0].localeCompare(b[0])).slice(0, 14)
  }, [service, slots])

  if (!service) return null

  const chosen = slots.find((s) => s.id === slotId)
  const placesLeft = chosen ? chosen.capacity - chosen.booked : 0

  function submit() {
    const result = createBooking(
      { slotId, name, email, phone, people, consent, note },
      currentUser(personaId),
    )
    if (!result.ok) {
      setError(result.error)
      return
    }
    setError(null)
    setBooked({ token: result.booking.qrToken, pending: result.booking.status === 'pending' })
  }

  return (
    <Drawer
      open
      onClose={onClose}
      title={booked ? (booked.pending ? 'Request sent' : 'You are booked') : service.name}
      subtitle={booked ? undefined : service.blurb}
      width="lg"
      footer={
        booked ? (
          <Button fullWidth onClick={onClose}>
            Close
          </Button>
        ) : (
          <div className="flex gap-2">
            <Button onClick={submit}>{service.needsApproval ? 'Send request' : 'Confirm booking'}</Button>
            <Button variant="secondary" onClick={onClose}>
              Cancel
            </Button>
          </div>
        )
      }
    >
      <div className="space-y-5">
        {booked ? (
          <div className="space-y-4">
            {booked.pending ? (
              <p className="rounded-xl border border-marigold-50 bg-marigold-50/60 px-4 py-3 text-[13.5px] leading-relaxed text-marigold-500">
                A group visit is confirmed by a person, not automatically. The shelter will email you, usually within
                a day, and your QR code comes with that confirmation.
              </p>
            ) : (
              <>
                <p className="rounded-xl border border-tulsi-50 bg-tulsi-50/60 px-4 py-3 text-[13.5px] leading-relaxed text-tulsi-700">
                  Your QR code is below and a copy is on its way to {email}. Show it at the gate.
                </p>
                <div className="flex flex-col items-center gap-2.5 rounded-xl border border-navy-100 bg-white p-5">
                  <QrCode className="size-28 text-navy-950" aria-hidden />
                  <p className="font-mono text-[12px] break-all text-navy-700">{booked.token}</p>
                </div>
              </>
            )}
            <p className="text-[12.5px] leading-relaxed text-navy-600">
              You can move or cancel this up to 24 hours before. After that the fodder has been bought, so the
              booking stands.
            </p>
          </div>
        ) : (
          <>
            <fieldset>
              <legend className="text-[11.5px] font-extrabold tracking-[0.14em] text-navy-700 uppercase">
                Pick a day and time
              </legend>
              <ul className="mt-3 space-y-3">
                {byDay.map(([date, daySlots]) => {
                  const closed = daySlots.every((s) => s.blackout)
                  return (
                    <li key={date}>
                      <p className="flex items-baseline gap-2 text-[13px] font-semibold text-navy-950">
                        {formatDate(date)}
                        {closed ? (
                          <span className="text-[12px] font-normal text-danger-600">
                            {daySlots[0]?.blackoutReason ?? 'Closed'}
                          </span>
                        ) : null}
                      </p>
                      {!closed ? (
                        <div className="mt-1.5 flex flex-wrap gap-2">
                          {daySlots.map((slot) => {
                            const left = slot.capacity - slot.booked
                            const full = left <= 0
                            return (
                              <button
                                key={slot.id}
                                type="button"
                                disabled={Boolean(slot.blackout) || full}
                                onClick={() => setSlotId(slot.id)}
                                className={cn(
                                  'rounded-lg border px-3 py-1.5 text-[13px] font-medium transition-colors',
                                  slotId === slot.id
                                    ? 'border-kumkum-500 bg-kumkum-50 text-kumkum-700'
                                    : 'border-navy-200 bg-white text-navy-800 hover:bg-navy-50',
                                  (slot.blackout || full) && 'cursor-not-allowed opacity-40',
                                )}
                              >
                                {slot.startTime}
                                <span className="ml-1.5 text-[11.5px] text-navy-500">
                                  {full ? 'full' : `${left} left`}
                                </span>
                              </button>
                            )
                          })}
                        </div>
                      ) : null}
                    </li>
                  )
                })}
              </ul>
            </fieldset>

            <div className="grid gap-4 sm:grid-cols-2">
              <Input label="Name" value={name} onChange={(e) => setName(e.target.value)} autoComplete="name" />
              <Input
                label="Email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
                hint="Where the QR code goes."
              />
              <Input
                label="Phone"
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                autoComplete="tel"
                hint="Country code and number."
              />
              <Select
                label="How many people"
                value={String(people)}
                onChange={(e) => setPeople(Number(e.target.value))}
                options={Array.from({ length: service.maxPeople - service.minPeople + 1 }, (_, i) => {
                  const n = service.minPeople + i
                  return { value: String(n), label: `${n} ${n === 1 ? 'person' : 'people'}` }
                })}
              />
            </div>

            {service.needsApproval ? (
              <Textarea
                label="Anything we should know"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                hint="Ages of the children, mobility needs, what your team hopes to get out of the morning."
              />
            ) : null}

            <div className="rounded-xl border border-navy-100 bg-navy-50/50 p-4">
              <dl className="space-y-1.5 text-[13.5px]">
                <div className="flex justify-between">
                  <dt className="text-navy-700">
                    {service.pricePerPerson === 0 ? 'Darshan' : `${displayPrice(service.pricePerPerson, currency)} × ${people}`}
                  </dt>
                  <dd className="font-mono font-semibold text-navy-950 tabular-nums">
                    {service.pricePerPerson === 0 ? 'Free' : displayPrice(service.pricePerPerson * people, currency)}
                  </dd>
                </div>
                {chosen ? (
                  <p className="text-[12.5px] text-navy-600">
                    {formatDate(chosen.date)} at {chosen.startTime} · {placesLeft} place
                    {placesLeft === 1 ? '' : 's'} left
                  </p>
                ) : (
                  <p className="text-[12.5px] text-navy-600">Choose a time above.</p>
                )}
                {service.pricePerPerson > 0 ? (
                  <p className="text-[12px] text-navy-600">
                    Charged as {formatMoney(service.pricePerPerson * people)} at the shelter&rsquo;s settlement rate.
                  </p>
                ) : null}
              </dl>
            </div>

            <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-navy-100 p-3.5 text-[13.5px] leading-relaxed text-navy-800">
              <input
                type="checkbox"
                checked={consent}
                onChange={(e) => setConsent(e.target.checked)}
                className="mt-0.5 size-4 shrink-0 accent-kumkum-600"
              />
              <span>
                I have read the visitor safety rules above, I will follow a caretaker&rsquo;s instructions, and I
                understand these are large animals in a working shelter.
              </span>
            </label>

            {error ? (
              <p className="flex items-start gap-2 rounded-xl border border-danger-50 bg-danger-50 px-3.5 py-2.5 text-[13.5px] text-danger-600">
                <Info className="mt-0.5 size-4 shrink-0" aria-hidden />
                {error}
              </p>
            ) : null}
          </>
        )}
      </div>
    </Drawer>
  )
}
