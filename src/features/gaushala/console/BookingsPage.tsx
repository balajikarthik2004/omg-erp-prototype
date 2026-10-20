import { useMemo, useState } from 'react'
import { CalendarOff, CheckCircle2, QrCode, Search, Users, XCircle } from 'lucide-react'

import { PageHeader } from '@/components/layout/PageHeader'
import { Button } from '@/components/ui/Button'
import { Card, CardHeader } from '@/components/ui/Card'
import { Drawer } from '@/components/ui/Drawer'
import { EmptyState } from '@/components/ui/EmptyState'
import { Input } from '@/components/ui/Input'
import { Money } from '@/components/ui/Money'
import { Select } from '@/components/ui/Select'
import { Stat } from '@/components/ui/Stat'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { Table, type Column } from '@/components/ui/Table'
import { Tabs } from '@/components/ui/Tabs'
import { cn } from '@/lib/cn'
import { formatDate, formatNumber } from '@/lib/format'
import { toast } from '@/lib/toast'
import { visitServiceById } from '@/mock/gaushalaPrograms'
import { useDb } from '@/store/db'
import { useCurrentUser } from '@/store/session'
import type { Booking, Slot } from '@/types'

const TODAY = new Date().toISOString().slice(0, 10)

export function BookingsPage() {
  const db = useDb()
  const [view, setView] = useState<'bookings' | 'calendar' | 'checkin'>('bookings')

  const todays = db.bookings.filter((b) => {
    const slot = db.slots.find((s) => s.id === b.slotId)
    return slot?.date === TODAY && b.status !== 'cancelled'
  })
  const pending = db.bookings.filter((b) => b.status === 'pending')
  const expected = todays.reduce((t, b) => t + b.people, 0)

  return (
    <div>
      <PageHeader
        title="Visits & bookings"
      />

      <div className="mb-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Stat label="Expected today" value={formatNumber(expected)} sub={`${todays.length} bookings`} accentClass="bg-turmeric-500" />
        <Stat
          label="Awaiting approval"
          value={formatNumber(pending.length)}
          sub="school and corporate requests"
          deltaMeaning="neutral"
          accentClass="bg-marigold-500"
        />
        <Stat
          label="Checked in today"
          value={formatNumber(todays.filter((b) => b.status === 'checked_in').length)}
          accentClass="bg-tulsi-500"
        />
        <Stat
          label="Closed days ahead"
          value={formatNumber(new Set(db.slots.filter((s) => s.blackout).map((s) => s.date)).size)}
          sub="Tuesdays and hand-set closures"
          accentClass="bg-kumkum-500"
        />
      </div>

      <Tabs
        value={view}
        onChange={(id) => setView(id as typeof view)}
        items={[
          { id: 'bookings', label: 'Bookings', count: db.bookings.length },
          { id: 'calendar', label: 'Slots & closures' },
          { id: 'checkin', label: 'QR check-in' },
        ]}
      />

      <div className="mt-6">
        {view === 'bookings' ? <BookingList /> : view === 'calendar' ? <SlotCalendar /> : <CheckInPanel />}
      </div>
    </div>
  )
}

/* ------------------------------------------------------------- bookings */

function BookingList() {
  const db = useDb()
  const actor = useCurrentUser()
  const decideBooking = useDb((s) => s.decideBooking)
  const [query, setQuery] = useState('')
  const [status, setStatus] = useState('all')
  const [focused, setFocused] = useState<string | null>(null)

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase()
    return db.bookings.filter(
      (b) =>
        (status === 'all' || b.status === status) &&
        (q === '' || b.name.toLowerCase().includes(q) || b.email.toLowerCase().includes(q) || b.id.toLowerCase().includes(q)),
    )
  }, [db.bookings, query, status])

  const columns: Column<Booking>[] = [
    {
      key: 'who',
      header: 'Visitor',
      primary: true,
      cell: (b) => (
        <div className="min-w-0">
          <p className="truncate font-semibold text-navy-950">{b.name}</p>
          <p className="truncate text-[12.5px] text-navy-600">{visitServiceById(b.serviceId)?.name ?? b.serviceId}</p>
        </div>
      ),
    },
    {
      key: 'when',
      header: 'When',
      cell: (b) => {
        const slot = db.slots.find((s) => s.id === b.slotId)
        return slot ? `${formatDate(slot.date)} · ${slot.startTime}` : '—'
      },
    },
    { key: 'people', header: 'People', align: 'right', cell: (b) => formatNumber(b.people) },
    { key: 'amount', header: 'Paid', align: 'right', cell: (b) => (b.amount === 0 ? <span className="text-navy-600">Free</span> : <Money value={b.amount} />) },
    { key: 'status', header: 'Status', cell: (b) => <StatusBadge status={b.status === 'no_show' ? 'rejected' : b.status} /> },
    {
      key: 'act',
      header: '',
      align: 'right',
      cell: (b) =>
        b.status === 'pending' ? (
          <div className="flex justify-end gap-1">
            <Button
              size="sm"
              variant="success"
              onClick={(e) => {
                e.stopPropagation()
                const r = decideBooking(b.id, 'confirmed', actor)
                if (!r.ok) toast.danger('Could not confirm', r.error)
              }}
            >
              Confirm
            </Button>
            <Button
              size="sm"
              variant="secondary"
              onClick={(e) => {
                e.stopPropagation()
                const r = decideBooking(b.id, 'cancelled', actor)
                if (!r.ok) toast.danger('Could not decline', r.error)
              }}
            >
              Decline
            </Button>
          </div>
        ) : null,
    },
  ]

  const current = focused ? db.bookings.find((b) => b.id === focused) ?? null : null

  return (
    <div>
      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-end">
        <div className="sm:w-72">
          <Input
            aria-label="Search bookings"
            placeholder="Name, email or booking id"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            leading={<Search className="size-4" aria-hidden />}
          />
        </div>
        <div className="sm:w-52">
          <Select
            aria-label="Filter by status"
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            options={[
              { value: 'all', label: 'Every status' },
              { value: 'pending', label: 'Awaiting approval' },
              { value: 'confirmed', label: 'Confirmed' },
              { value: 'checked_in', label: 'Checked in' },
              { value: 'no_show', label: 'No show' },
              { value: 'cancelled', label: 'Cancelled' },
            ]}
          />
        </div>
      </div>

      <Table
        columns={columns}
        rows={rows}
        rowKey={(b) => b.id}
        onRowClick={(b) => setFocused(b.id)}
        empty={<EmptyState title="No booking matches that" message="Try a shorter search, or clear the filter." />}
      />

      <BookingDrawer booking={current} onClose={() => setFocused(null)} />
    </div>
  )
}

function BookingDrawer({ booking, onClose }: { booking: Booking | null; onClose: () => void }) {
  const db = useDb()
  const actor = useCurrentUser()
  const decideBooking = useDb((s) => s.decideBooking)

  if (!booking) return null
  const slot = db.slots.find((s) => s.id === booking.slotId)
  const service = visitServiceById(booking.serviceId)

  return (
    <Drawer
      open
      onClose={onClose}
      title={booking.name}
      subtitle={`${service?.name ?? booking.serviceId} · ${booking.id}`}
      accent="peacock"
      tone="canvas"
      headerExtra={<StatusBadge status={booking.status === 'no_show' ? 'rejected' : booking.status} />}
      footer={
        booking.status === 'confirmed' || booking.status === 'pending' ? (
          <Button
            variant="danger"
            fullWidth
            icon={<XCircle className="size-4" aria-hidden />}
            onClick={() => {
              const r = decideBooking(booking.id, 'cancelled', actor)
              if (!r.ok) toast.danger('Could not cancel', r.error)
              else onClose()
            }}
          >
            Cancel this booking
          </Button>
        ) : null
      }
    >
      <div className="space-y-5">

        <dl className="grid grid-cols-2 gap-x-4 gap-y-3 rounded-xl border border-navy-100 bg-sandal-50 p-4 shadow-flat text-[13.5px]">
          <Field label="When" value={slot ? `${formatDate(slot.date)} · ${slot.startTime}–${slot.endTime}` : '—'} />
          <Field label="People" value={formatNumber(booking.people)} />
          <Field label="Email" value={<span className="break-words">{booking.email}</span>} />
          <Field label="Phone" value={booking.phone || '—'} />
          <Field label="Paid" value={booking.amount === 0 ? 'Free' : <Money value={booking.amount} />} />
          <Field label="Booked" value={formatDate(booking.bookedAt)} />
        </dl>

        {booking.note ? (
          <p className="rounded-xl border border-navy-100 bg-sandal-50 px-3.5 py-2.5 text-[13.5px] leading-relaxed text-navy-800 shadow-flat">
            {booking.note}
          </p>
        ) : null}

        <div
          className={cn(
            'rounded-xl border px-3.5 py-2.5 text-[13px] leading-relaxed',
            booking.consentAcceptedAt
              ? 'border-tulsi-50 bg-tulsi-50 text-tulsi-700'
              : 'border-marigold-50 bg-marigold-50 text-marigold-500',
          )}
        >
          {booking.consentAcceptedAt
            ? `Safety waiver accepted ${formatDate(booking.consentAcceptedAt)}.`
            : 'The safety waiver has not been accepted. They cannot be checked in until it is.'}
        </div>

        <section className="rounded-xl border border-navy-100 bg-sandal-50 p-4 shadow-flat">
          <h4 className="flex items-center gap-2 text-[11.5px] font-extrabold tracking-[0.14em] text-navy-700 uppercase">
            <QrCode className="size-4" aria-hidden />
            Gate code
          </h4>
          <p className="mt-2 font-mono text-[12.5px] break-all text-navy-800">{booking.qrToken}</p>
          {booking.checkedInAt ? (
            <p className="mt-2 text-[13px] text-tulsi-700">Checked in {formatDate(booking.checkedInAt)}.</p>
          ) : null}
        </section>
      </div>
    </Drawer>
  )
}

/* -------------------------------------------------------- slots & closures */

function SlotCalendar() {
  const db = useDb()
  const actor = useCurrentUser()
  const setSlotBlackout = useDb((s) => s.setSlotBlackout)
  const [serviceId, setServiceId] = useState(db.visitServices[0]?.id ?? '')
  const [reason, setReason] = useState('Closed for maintenance')

  const days = useMemo(() => {
    const mine = db.slots.filter((s) => s.serviceId === serviceId)
    const map = new Map<string, Slot[]>()
    for (const slot of mine) {
      const list = map.get(slot.date) ?? []
      list.push(slot)
      map.set(slot.date, list)
    }
    return [...map.entries()].sort((a, b) => a[0].localeCompare(b[0]))
  }, [db.slots, serviceId])

  function toggleDay(slots: Slot[], blackout: boolean) {
    let failed = ''
    for (const slot of slots) {
      const r = setSlotBlackout(slot.id, blackout, reason, actor)
      if (!r.ok) failed = r.error
    }
    if (failed) toast.danger('Some slots were left open', failed)
  }

  return (
    <div>
      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-end">
        <div className="sm:w-64">
          <Select
            label="Service"
            value={serviceId}
            onChange={(e) => setServiceId(e.target.value)}
            options={db.visitServices.map((s) => ({ value: s.id, label: s.name }))}
          />
        </div>
        <div className="sm:w-72">
          <Input label="Reason for a closure" value={reason} onChange={(e) => setReason(e.target.value)} />
        </div>
      </div>

      <Card>
        <CardHeader
          title="The next three weeks"
          description="Closing a day gives the reason to anyone trying to book it. A day with bookings on it cannot be closed until those are cancelled."
        />
        <ul className="space-y-2.5">
          {days.map(([date, slots]) => {
            const closed = slots.every((s) => s.blackout)
            const booked = slots.reduce((t, s) => t + s.booked, 0)
            const capacity = slots.reduce((t, s) => t + s.capacity, 0)
            return (
              <li
                key={date}
                className={cn(
                  'flex flex-wrap items-center justify-between gap-3 rounded-xl border px-4 py-3',
                  closed ? 'border-danger-50 bg-danger-50/40' : 'border-navy-100 bg-white',
                )}
              >
                <div className="min-w-0">
                  <p className="text-[14px] font-semibold text-navy-950">{formatDate(date)}</p>
                  <p className="text-[12.5px] text-navy-600">
                    {closed ? (
                      slots[0]?.blackoutReason ?? 'Closed'
                    ) : (
                      <>
                        {slots.length} slot{slots.length === 1 ? '' : 's'} · {booked} of {capacity} places taken
                      </>
                    )}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  {!closed ? (
                    <span className="hidden items-center gap-1.5 text-[12.5px] text-navy-600 sm:flex">
                      <Users className="size-3.5" aria-hidden />
                      {capacity - booked} free
                    </span>
                  ) : null}
                  <Button
                    size="sm"
                    variant={closed ? 'secondary' : 'danger'}
                    icon={<CalendarOff className="size-4" aria-hidden />}
                    onClick={() => toggleDay(slots, !closed)}
                  >
                    {closed ? 'Reopen' : 'Close'}
                  </Button>
                </div>
              </li>
            )
          })}
        </ul>
      </Card>
    </div>
  )
}

/* ----------------------------------------------------------- QR check-in */

function CheckInPanel() {
  const db = useDb()
  const actor = useCurrentUser()
  const checkInBooking = useDb((s) => s.checkInBooking)
  const [token, setToken] = useState('')
  const [result, setResult] = useState<{ ok: boolean; message: string } | null>(null)

  const todays = db.bookings.filter((b) => {
    const slot = db.slots.find((s) => s.id === b.slotId)
    return slot?.date === TODAY
  })

  function scan() {
    const r = checkInBooking(token, actor)
    if (!r.ok) {
      setResult({ ok: false, message: r.error })
      return
    }
    setResult({ ok: true, message: `${r.booking.name} · ${r.booking.people} ${r.booking.people === 1 ? 'person' : 'people'}` })
    setToken('')
  }

  return (
    <div className="grid gap-5 lg:grid-cols-[1fr_1.2fr] lg:items-start">
      <Card>
        <CardHeader
          title="Check a visitor in"
          description="Scan the code on their phone, or paste it. The gate code is checked against the booking, the waiver and the slot."
        />
        <div className="space-y-3.5">
          <Input
            label="Gate code"
            value={token}
            onChange={(e) => setToken(e.target.value)}
            placeholder="gau-visit-…"
            className="font-mono"
          />
          <Button fullWidth icon={<QrCode className="size-4" aria-hidden />} onClick={scan}>
            Check in
          </Button>
        </div>

        {result ? (
          <p
            className={cn(
              'mt-4 flex items-start gap-2 rounded-xl border px-3.5 py-2.5 text-[13.5px] leading-relaxed',
              result.ok
                ? 'border-tulsi-50 bg-tulsi-50/60 text-tulsi-700'
                : 'border-danger-50 bg-danger-50 text-danger-600',
            )}
          >
            {result.ok ? (
              <CheckCircle2 className="mt-0.5 size-4 shrink-0" aria-hidden />
            ) : (
              <XCircle className="mt-0.5 size-4 shrink-0" aria-hidden />
            )}
            {result.message}
          </p>
        ) : null}
      </Card>

      <Card>
        <CardHeader title="Expected today" description={`${todays.length} bookings on ${formatDate(TODAY)}.`} />
        {todays.length === 0 ? (
          <EmptyState title="Nobody booked" message="No visits are expected today." />
        ) : (
          <ul className="divide-y divide-navy-100">
            {todays.map((b) => (
              <li key={b.id} className="flex items-center justify-between gap-3 py-3 first:pt-0">
                <div className="min-w-0">
                  <p className="truncate text-[14px] font-semibold text-navy-950">{b.name}</p>
                  <p className="truncate text-[12.5px] text-navy-600">
                    {visitServiceById(b.serviceId)?.name} · {b.people} {b.people === 1 ? 'person' : 'people'}
                  </p>
                </div>
                <StatusBadge status={b.status === 'no_show' ? 'rejected' : b.status} />
              </li>
            ))}
          </ul>
        )}
        <p className="mt-4 text-[12.5px] leading-relaxed text-navy-600">
          Paste a code from the list above into the box to try it — a cancelled booking, an unapproved group visit
          and a code that has already been used are all refused, with the reason.
        </p>
      </Card>
    </div>
  )
}

function Field({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <dt className="text-[11px] tracking-[0.12em] text-navy-600 uppercase">{label}</dt>
      <dd className="mt-0.5 text-navy-950">{value}</dd>
    </div>
  )
}
