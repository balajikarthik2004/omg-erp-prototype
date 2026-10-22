import { useMemo, useState } from 'react'
import {
  AlertCircle,
  CalendarDays,
  Check,
  ChevronLeft,
  ChevronRight,
  Clock,
  Info,
  MapPin,
  QrCode,
  Users,
} from 'lucide-react'
import {
  addMonths,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  isBefore,
  isSameMonth,
  isToday,
  startOfDay,
  startOfMonth,
  startOfWeek,
  subMonths,
} from 'date-fns'

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
            Pick what you would like to do, choose a date in the calendar to check available times, and you will get a QR
            code by email. Show it at the gate. Everything except darshan is paid for at booking, and a booking can be
            moved or cancelled up to 24&nbsp;hours before.
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
              <span>Closed every Tuesday, and on special maintenance days</span>
            </div>
            <div className="flex items-start gap-2.5">
              <MapPin className="mt-0.5 size-4 shrink-0 text-stone-500" aria-hidden />
              <span>Thiruparankundram Road, Madurai 625005</span>
            </div>
          </dl>
        </aside>
      </div>

      <ul className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
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
        'group flex h-full flex-col overflow-hidden rounded-2xl border border-sandal-200 bg-white shadow-card',
        'transition-all duration-300 hover:-translate-y-1 hover:border-navy-200 hover:shadow-lift',
      )}
    >
      {/* Top Image Container */}
      {service.image ? (
        <div className="relative aspect-[16/10] sm:aspect-[16/9.5] overflow-hidden bg-navy-950">
          <img
            src={service.image}
            alt={service.name}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
            loading="lazy"
          />
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/55 via-transparent to-black/20" />

          {/* Badges on image */}
          <div className="absolute top-3 right-3 flex items-center gap-1.5">
            {service.needsApproval ? (
              <span className="rounded-full bg-navy-950/85 px-2.5 py-0.5 text-[11px] font-semibold text-sandal-200 backdrop-blur-xs border border-sandal-200/30 shadow-xs">
                By request
              </span>
            ) : null}
          </div>

          <div className="absolute bottom-2.5 left-3 flex items-center gap-2">
            <span className="inline-flex items-center gap-1 rounded-full bg-black/65 px-2.5 py-0.5 text-[11px] font-medium text-white/95 backdrop-blur-xs">
              <Clock className="size-3 text-sandal-300" aria-hidden />
              {service.durationMins >= 120 ? `${Math.round(service.durationMins / 60)} hrs` : `${service.durationMins} min`}
            </span>
            <span className="inline-flex items-center gap-1 rounded-full bg-black/65 px-2.5 py-0.5 text-[11px] font-medium text-white/95 backdrop-blur-xs">
              <Users className="size-3 text-sandal-300" aria-hidden />
              {service.minPeople}&ndash;{service.maxPeople}
            </span>
          </div>
        </div>
      ) : null}

      <div className="flex flex-1 flex-col p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h3 className="font-display text-[19px] leading-snug text-stone-900 group-hover:text-kumkum-700 transition-colors">
              {service.name}
            </h3>
            {service.tamil ? <p className="mt-0.5 text-[13.5px] text-stone-500">{service.tamil}</p> : null}
          </div>
          {!service.image && service.needsApproval ? <Badge>By request</Badge> : null}
        </div>

        <p className="mt-3 flex-1 text-[13.5px] leading-relaxed text-stone-700">{service.blurb}</p>

        {!service.image ? (
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
        ) : null}

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
    </div>
  )
}

function parseDateKey(dateStr: string): Date {
  const [y, m, d] = dateStr.split('-').map(Number)
  return new Date(y, (m || 1) - 1, d || 1)
}

function toDateKey(d: Date): string {
  return format(d, 'yyyy-MM-dd')
}

const TODAY_START = startOfDay(new Date())
const TODAY_KEY = toDateKey(TODAY_START)

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

  // Service-specific slots
  const serviceSlots = useMemo(() => {
    if (!service) return []
    return slots.filter((s) => s.serviceId === service.id)
  }, [slots, service])

  // Find the earliest upcoming bookable date to default to
  const initialDate = useMemo(() => {
    const firstAvailable = serviceSlots.find((s) => {
      if (s.blackout || s.capacity <= s.booked) return false
      const slotD = parseDateKey(s.date)
      return !isBefore(slotD, TODAY_START)
    })
    return firstAvailable ? firstAvailable.date : TODAY_KEY
  }, [serviceSlots])

  const [selectedDate, setSelectedDate] = useState<string>(initialDate)
  const [currentMonth, setCurrentMonth] = useState<Date>(() => startOfMonth(parseDateKey(initialDate)))
  const [slotId, setSlotId] = useState<string>('')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [people, setPeople] = useState(1)
  const [note, setNote] = useState('')
  const [consent, setConsent] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [booked, setBooked] = useState<{ token: string; pending: boolean } | null>(null)

  // Map slots by date for O(1) calendar querying
  const dayMetaMap = useMemo(() => {
    const map = new Map<
      string,
      {
        slots: Slot[]
        isClosed: boolean
        reason?: string
        totalCapacity: number
        totalBooked: number
        availableCount: number
        isFull: boolean
      }
    >()

    for (const s of serviceSlots) {
      const existing = map.get(s.date) ?? {
        slots: [],
        isClosed: true,
        reason: undefined,
        totalCapacity: 0,
        totalBooked: 0,
        availableCount: 0,
        isFull: false,
      }
      existing.slots.push(s)
      existing.totalCapacity += s.capacity
      existing.totalBooked += s.booked
      if (!s.blackout && s.capacity > s.booked) {
        existing.availableCount += s.capacity - s.booked
      }
      if (!s.blackout) {
        existing.isClosed = false
      } else if (existing.isClosed && s.blackoutReason) {
        existing.reason = s.blackoutReason
      }
      map.set(s.date, existing)
    }

    for (const [, val] of map) {
      if (!val.isClosed && val.slots.length > 0 && val.slots.every((s) => s.blackout || s.capacity <= s.booked)) {
        val.isFull = true
      }
    }

    return map
  }, [serviceSlots])

  // Calendar dates matrix for currentMonth
  const calendarDays = useMemo(() => {
    const monthStart = startOfMonth(currentMonth)
    const monthEnd = endOfMonth(currentMonth)
    const calStart = startOfWeek(monthStart)
    const calEnd = endOfWeek(monthEnd)
    return eachDayOfInterval({ start: calStart, end: calEnd })
  }, [currentMonth])

  // Slots for currently selected date
  const selectedDateSlots = useMemo(() => {
    const meta = dayMetaMap.get(selectedDate)
    return meta?.slots ?? []
  }, [dayMetaMap, selectedDate])

  const selectedDateMeta = useMemo(() => {
    return dayMetaMap.get(selectedDate)
  }, [dayMetaMap, selectedDate])

  // When date is clicked on calendar
  const handleSelectDate = (dateKey: string) => {
    setSelectedDate(dateKey)
    setError(null)
    const meta = dayMetaMap.get(dateKey)
    const firstOpen = meta?.slots.find((s) => !s.blackout && s.capacity > s.booked)
    setSlotId(firstOpen?.id ?? '')
  }

  // Month navigation
  const canGoPrev = !isBefore(endOfMonth(subMonths(currentMonth, 1)), TODAY_START)

  const handlePrevMonth = () => {
    if (canGoPrev) {
      setCurrentMonth((prev) => subMonths(prev, 1))
    }
  }

  const handleNextMonth = () => {
    setCurrentMonth((prev) => addMonths(prev, 1))
  }

  const handleJumpToToday = () => {
    const todayMonth = startOfMonth(TODAY_START)
    setCurrentMonth(todayMonth)
    handleSelectDate(TODAY_KEY)
  }

  if (!service) return null

  const chosenSlot = serviceSlots.find((s) => s.id === slotId)
  const placesLeft = chosenSlot ? chosenSlot.capacity - chosenSlot.booked : 0

  function submit() {
    if (!slotId) {
      setError('Please choose an available time slot for your selected date.')
      return
    }
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
      <div className="space-y-6">
        {booked ? (
          <div className="space-y-4">
            {booked.pending ? (
              <p className="rounded-xl border border-marigold-50 bg-marigold-50/60 px-4 py-3 text-[13.5px] leading-relaxed text-marigold-700">
                A group visit is confirmed by a person, not automatically. The shelter will email you, usually within a
                day, and your QR code comes with that confirmation.
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
            <p className="text-[12.5px] leading-relaxed text-stone-600">
              You can move or cancel this up to 24 hours before. After that the fodder has been bought, so the booking
              stands.
            </p>
          </div>
        ) : (
          <>
            {/* Service Highlight Card */}
            <div className="flex items-center gap-3.5 rounded-2xl border border-sandal-200 bg-sandal-50/80 p-3.5 shadow-2xs">
              {service.image ? (
                <div className="relative size-16 shrink-0 overflow-hidden rounded-xl bg-navy-950 border border-sandal-200">
                  <img src={service.image} alt={service.name} className="h-full w-full object-cover" />
                </div>
              ) : null}
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <h4 className="font-display text-[16px] font-semibold text-stone-900 leading-snug">{service.name}</h4>
                  {service.needsApproval ? <Badge>By request</Badge> : null}
                </div>
                {service.tamil ? <p className="text-[12px] text-stone-500">{service.tamil}</p> : null}
                <div className="mt-1 flex items-center gap-3 text-[12px] text-stone-600">
                  <span className="flex items-center gap-1">
                    <Clock className="size-3 text-stone-400" />
                    {service.durationMins >= 120 ? `${Math.round(service.durationMins / 60)} hrs` : `${service.durationMins} min`}
                  </span>
                  <span>&middot;</span>
                  <span className="font-mono font-medium text-stone-900">
                    {service.pricePerPerson === 0 ? 'Free' : `${displayPrice(service.pricePerPerson, currency)} / person`}
                  </span>
                </div>
              </div>
            </div>

            {/* Interactive Calendar Section */}
            <div className="rounded-2xl border border-sandal-200 bg-white p-4 sm:p-5 shadow-card">
              <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-sandal-200">
                <div className="flex items-center gap-2">
                  <CalendarDays className="size-4 text-kumkum-600" aria-hidden />
                  <span className="font-display text-[17px] font-semibold text-stone-900">
                    {format(currentMonth, 'MMMM yyyy')}
                  </span>
                </div>

                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={handleJumpToToday}
                    className="mr-1 rounded-lg border border-sandal-200 px-2.5 py-1 text-[11.5px] font-medium text-stone-600 hover:bg-sandal-50 hover:text-stone-900 transition-colors"
                  >
                    Today
                  </button>
                  <button
                    type="button"
                    disabled={!canGoPrev}
                    onClick={handlePrevMonth}
                    aria-label="Previous month"
                    className="flex size-8 items-center justify-center rounded-lg border border-sandal-200 text-stone-600 hover:bg-sandal-50 hover:text-stone-900 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                  >
                    <ChevronLeft className="size-4" />
                  </button>
                  <button
                    type="button"
                    onClick={handleNextMonth}
                    aria-label="Next month"
                    className="flex size-8 items-center justify-center rounded-lg border border-sandal-200 text-stone-600 hover:bg-sandal-50 hover:text-stone-900 transition-colors"
                  >
                    <ChevronRight className="size-4" />
                  </button>
                </div>
              </div>

              {/* Day of Week Headers */}
              <div className="mt-3 grid grid-cols-7 gap-1 text-center text-[11.5px] font-semibold text-stone-500 uppercase tracking-wider">
                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((d) => (
                  <div key={d} className="py-1">
                    {d}
                  </div>
                ))}
              </div>

              {/* Days Grid */}
              <div className="mt-1.5 grid grid-cols-7 gap-1 sm:gap-1.5">
                {calendarDays.map((day) => {
                  const dateKey = toDateKey(day)
                  const isCurMonth = isSameMonth(day, currentMonth)
                  const isPast = isBefore(day, TODAY_START)
                  const meta = dayMetaMap.get(dateKey)
                  const isClosed = !meta || meta.isClosed || meta.slots.length === 0
                  const isFull = Boolean(meta?.isFull)
                  const hasAvailable = Boolean(meta && !meta.isClosed && meta.availableCount > 0)
                  const isSelected = selectedDate === dateKey
                  const isCurrentDay = isToday(day)

                  return (
                    <button
                      key={dateKey}
                      type="button"
                      disabled={isPast}
                      onClick={() => handleSelectDate(dateKey)}
                      title={
                        isPast
                          ? 'Past date'
                          : isClosed
                            ? meta?.reason ?? 'Closed'
                            : isFull
                              ? 'Fully booked'
                              : `${meta?.availableCount ?? 0} places available`
                      }
                      className={cn(
                        'relative flex min-h-[44px] flex-col items-center justify-center rounded-xl p-1.5 transition-all text-center',
                        isSelected
                          ? 'bg-kumkum-600 text-white font-bold ring-2 ring-kumkum-400 shadow-md'
                          : [
                              !isCurMonth && 'text-stone-300 opacity-40 hover:bg-stone-50',
                              isCurMonth && !isPast && !isClosed && !isFull && 'bg-white text-stone-900 border border-sandal-200 hover:border-kumkum-400 hover:bg-kumkum-50/50 font-semibold shadow-2xs',
                              isCurMonth && isPast && 'text-stone-300 cursor-not-allowed opacity-45',
                              isCurMonth && !isPast && isClosed && 'bg-red-50/40 text-stone-500 border border-dashed border-red-200/70 hover:bg-red-50',
                              isCurMonth && !isPast && isFull && 'bg-stone-100 text-stone-400 border border-stone-200',
                            ],
                      )}
                    >
                      <span className="text-[13px] sm:text-[14px] leading-none">
                        {format(day, 'd')}
                      </span>

                      {/* Status indicator dot */}
                      <span className="mt-1 flex items-center justify-center">
                        {isSelected ? (
                          <span className="size-1 rounded-full bg-white" />
                        ) : isPast ? null : isClosed ? (
                          <span className="size-1 rounded-full bg-red-400" />
                        ) : hasAvailable ? (
                          <span className="size-1 rounded-full bg-emerald-500" />
                        ) : isFull ? (
                          <span className="size-1 rounded-full bg-stone-400" />
                        ) : null}
                      </span>

                      {/* Current day outline */}
                      {isCurrentDay && !isSelected ? (
                        <span className="pointer-events-none absolute inset-0 rounded-xl ring-1 ring-inset ring-kumkum-400/50" />
                      ) : null}
                    </button>
                  )
                })}
              </div>

              {/* Legend */}
              <div className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-sandal-200 pt-3 text-[11.5px] text-stone-500">
                <div className="flex items-center gap-4">
                  <span className="flex items-center gap-1.5">
                    <span className="size-2 rounded-full bg-emerald-500" />
                    Available
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="size-2 rounded-full bg-red-400" />
                    Closed (Tuesdays / Maintenance)
                  </span>
                </div>
                <div className="flex items-center gap-1.5 text-stone-600 font-medium">
                  <span className="size-2 rounded-full bg-kumkum-600" />
                  Selected date
                </div>
              </div>
            </div>

            {/* Available Times for Selected Date */}
            <div className="rounded-2xl border border-sandal-200 bg-sandal-50/50 p-4 sm:p-5">
              <div className="flex items-center justify-between gap-2 pb-3 border-b border-sandal-200">
                <div>
                  <h4 className="text-[11.5px] font-extrabold tracking-[0.14em] text-stone-500 uppercase">
                    Available Times
                  </h4>
                  <p className="font-display text-[16px] font-semibold text-stone-900 mt-0.5">
                    {formatDate(selectedDate)}
                  </p>
                </div>
                <Clock className="size-4 text-stone-400" aria-hidden />
              </div>

              <div className="mt-3.5">
                {selectedDateMeta?.isClosed ? (
                  <div className="flex items-start gap-2.5 rounded-xl border border-red-200 bg-red-50/60 p-3.5 text-[13px] text-red-700">
                    <AlertCircle className="mt-0.5 size-4 shrink-0 text-red-600" aria-hidden />
                    <div>
                      <p className="font-semibold">Shelter closed on this day</p>
                      <p className="mt-0.5 text-[12px] text-red-600">
                        {selectedDateMeta.reason ?? 'Closed on Tuesdays. Please pick another date on the calendar above.'}
                      </p>
                    </div>
                  </div>
                ) : selectedDateMeta?.isFull ? (
                  <div className="flex items-start gap-2.5 rounded-xl border border-stone-200 bg-stone-100/70 p-3.5 text-[13px] text-stone-700">
                    <AlertCircle className="mt-0.5 size-4 shrink-0 text-stone-500" aria-hidden />
                    <p>All time slots for this date are fully booked. Please select another date on the calendar.</p>
                  </div>
                ) : selectedDateSlots.length === 0 ? (
                  <p className="text-[13px] text-stone-500">No time slots scheduled for this date.</p>
                ) : (
                  <div className="grid gap-2 sm:grid-cols-2">
                    {selectedDateSlots.map((slot) => {
                      const left = slot.capacity - slot.booked
                      const full = left <= 0
                      const isSlotChosen = slotId === slot.id

                      return (
                        <button
                          key={slot.id}
                          type="button"
                          disabled={Boolean(slot.blackout) || full}
                          onClick={() => setSlotId(slot.id)}
                          className={cn(
                            'group flex items-center justify-between rounded-xl border p-3 text-left transition-all',
                            isSlotChosen
                              ? 'border-kumkum-600 bg-kumkum-50/80 text-kumkum-900 ring-2 ring-kumkum-500/20 shadow-xs'
                              : 'border-sandal-200 bg-white text-stone-800 hover:border-kumkum-300 hover:bg-sandal-50/70',
                            (slot.blackout || full) && 'cursor-not-allowed opacity-40 bg-stone-50',
                          )}
                        >
                          <div>
                            <div className="flex items-center gap-1.5 font-semibold text-[13.5px]">
                              <Clock className="size-3.5 text-stone-400 group-hover:text-kumkum-600 transition-colors" />
                              <span>
                                {slot.startTime} &ndash; {slot.endTime}
                              </span>
                            </div>
                            <div className="mt-1 text-[11.5px]">
                              {full ? (
                                <span className="font-medium text-red-600">Fully booked</span>
                              ) : (
                                <span className={cn('font-medium', left <= 2 ? 'text-amber-700' : 'text-emerald-700')}>
                                  {left} {left === 1 ? 'place' : 'places'} left
                                </span>
                              )}
                            </div>
                          </div>

                          {isSlotChosen ? (
                            <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-kumkum-600 text-white shadow-2xs">
                              <Check className="size-3 stroke-[3]" />
                            </span>
                          ) : null}
                        </button>
                      )
                    })}
                  </div>
                )}
              </div>
            </div>

            {/* Guest & Contact Form */}
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

            {/* Pricing & Booking Breakdown */}
            <div className="rounded-xl border border-sandal-200 bg-sandal-50/70 p-4">
              <dl className="space-y-1.5 text-[13.5px]">
                <div className="flex justify-between">
                  <dt className="text-stone-700">
                    {service.pricePerPerson === 0 ? 'Darshan' : `${displayPrice(service.pricePerPerson, currency)} × ${people}`}
                  </dt>
                  <dd className="font-mono font-semibold text-stone-950 tabular-nums">
                    {service.pricePerPerson === 0 ? 'Free' : displayPrice(service.pricePerPerson * people, currency)}
                  </dd>
                </div>
                {chosenSlot ? (
                  <p className="text-[12.5px] text-stone-600 flex items-center gap-1.5">
                    <Clock className="size-3.5 text-stone-400" />
                    <span>
                      {formatDate(chosenSlot.date)} at {chosenSlot.startTime} &ndash; {chosenSlot.endTime} &middot;{' '}
                      {placesLeft} place{placesLeft === 1 ? '' : 's'} left
                    </span>
                  </p>
                ) : (
                  <p className="text-[12.5px] text-amber-700 font-medium">Please select a time slot above.</p>
                )}
                {service.pricePerPerson > 0 ? (
                  <p className="text-[12px] text-stone-500">
                    Charged as {formatMoney(service.pricePerPerson * people)} at the shelter&rsquo;s settlement rate.
                  </p>
                ) : null}
              </dl>
            </div>

            <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-sandal-200 bg-white p-3.5 text-[13.5px] leading-relaxed text-stone-800 hover:bg-sandal-50/50 transition-colors">
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
