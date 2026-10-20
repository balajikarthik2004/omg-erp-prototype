import { useMemo, useState } from 'react'
import { CalendarPlus, Info, Radio, Users, XCircle } from 'lucide-react'

import { PageHeader } from '@/components/layout/PageHeader'
import { Button } from '@/components/ui/Button'
import { Drawer } from '@/components/ui/Drawer'
import { EmptyState } from '@/components/ui/EmptyState'
import { Input, Textarea } from '@/components/ui/Input'
import { Money } from '@/components/ui/Money'
import { Select } from '@/components/ui/Select'
import { Stat } from '@/components/ui/Stat'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { Table, type Column } from '@/components/ui/Table'
import { formatNumber } from '@/lib/format'
import { toast } from '@/lib/toast'
import { formatInViewerZone, timeZoneLabel, viewerTimeZone } from '@/lib/zone'
import { useDb } from '@/store/db'
import { useCurrentUser } from '@/store/session'
import type { GaushalaEvent, GaushalaEventRsvp } from '@/types'

const LOADED_AT = Date.now()

/** Datetime-local wants the viewer's wall clock, not a UTC string. */
function toLocalInput(iso: string): string {
  const d = new Date(iso)
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

export function GaushalaEventsConsolePage() {
  const db = useDb()
  const [editing, setEditing] = useState<GaushalaEvent | 'new' | null>(null)
  const [registrationsFor, setRegistrationsFor] = useState<GaushalaEvent | null>(null)

  const upcoming = db.gaushalaEvents.filter(
    (e) => new Date(e.startAt).getTime() >= LOADED_AT && e.status !== 'cancelled',
  )
  const totalRegistered = upcoming.reduce((t, e) => t + e.registered, 0)
  const paidTake = db.eventRsvps
    .filter((r) => r.status !== 'cancelled')
    .reduce((t, r) => t + r.amount, 0)

  const columns: Column<GaushalaEvent>[] = [
    {
      key: 'name',
      header: 'Festival',
      primary: true,
      cell: (e) => (
        <div className="min-w-0">
          <p className="truncate font-semibold text-navy-950">{e.name}</p>
          {e.tamil ? <p className="truncate text-[12.5px] text-navy-600">{e.tamil}</p> : null}
        </div>
      ),
    },
    { key: 'when', header: 'Starts', cell: (e) => formatInViewerZone(e.startAt) },
    {
      key: 'reg',
      header: 'Registered',
      align: 'right',
      cell: (e) => (
        <span className="font-mono tabular-nums">
          {formatNumber(e.registered)}
          {e.capacity ? <span className="text-navy-600"> / {formatNumber(e.capacity)}</span> : null}
        </span>
      ),
    },
    {
      key: 'price',
      header: 'Entry',
      align: 'right',
      hideOnMobile: true,
      cell: (e) => (e.isPaid ? <Money value={e.ticketPrice ?? 0} /> : <span className="text-navy-600">Free</span>),
    },
    {
      key: 'live',
      header: 'Stream',
      hideOnMobile: true,
      cell: (e) =>
        e.livestreamUrl ? (
          <span className="inline-flex items-center gap-1.5 text-[13px] text-tulsi-700">
            <Radio className="size-3.5" aria-hidden />
            Linked
          </span>
        ) : (
          <span className="text-navy-600">—</span>
        ),
    },
    { key: 'status', header: 'Status', cell: (e) => <StatusBadge status={e.status} /> },
    {
      key: 'act',
      header: '',
      align: 'right',
      cell: (e) => (
        <Button
          size="sm"
          variant="ghost"
          icon={<Users className="size-4" aria-hidden />}
          onClick={(ev) => {
            ev.stopPropagation()
            setRegistrationsFor(e)
          }}
        >
          {formatNumber(db.eventRsvps.filter((r) => r.eventId === e.id).length)}
        </Button>
      ),
    },
  ]

  return (
    <div>
      <PageHeader
        title="Gaushala festivals"
        actions={
          <Button icon={<CalendarPlus className="size-4" aria-hidden />} onClick={() => setEditing('new')}>
            Add a festival
          </Button>
        }
      />

      <div className="mb-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Stat label="On the calendar" value={formatNumber(db.gaushalaEvents.length)} accentClass="bg-peacock-500" />
        <Stat label="Still to come" value={formatNumber(upcoming.length)} accentClass="bg-turmeric-500" />
        <Stat label="People registered" value={formatNumber(totalRegistered)} sub="across the upcoming festivals" accentClass="bg-tulsi-500" />
        <Stat label="Registration income" value={<Money value={paidTake} />} sub="paid festivals only" accentClass="bg-kumkum-500" />
      </div>

      <p className="mb-5 flex items-start gap-2.5 rounded-xl border border-navy-100 bg-navy-50/60 px-4 py-3 text-[13.5px] leading-relaxed text-navy-800">
        <Info className="mt-0.5 size-4 shrink-0 text-navy-600" aria-hidden />
        <span>
          These are calendar entries with an RSVP, deliberately without budgets, posters or approval gates. A
          festival that needs money voted for it is raised in the <strong>Events</strong> module instead, where it
          goes through the ordinary budget and CA approval route.
        </span>
      </p>

      <Table
        columns={columns}
        rows={db.gaushalaEvents}
        rowKey={(e) => e.id}
        onRowClick={(e) => setEditing(e)}
        empty={<EmptyState title="Nothing on the calendar" message="Add the first festival." />}
      />

      <EventDrawer event={editing} onClose={() => setEditing(null)} />
      <RegistrationsDrawer event={registrationsFor} onClose={() => setRegistrationsFor(null)} />
    </div>
  )
}

function EventDrawer({ event, onClose }: { event: GaushalaEvent | 'new' | null; onClose: () => void }) {
  const saveGaushalaEvent = useDb((s) => s.saveGaushalaEvent)
  const actor = useCurrentUser()
  const existing = event && event !== 'new' ? event : null

  const [loaded, setLoaded] = useState<string | null>(null)
  const [name, setName] = useState('')
  const [tamil, setTamil] = useState('')
  const [startAt, setStartAt] = useState('')
  const [endAt, setEndAt] = useState('')
  const [venue, setVenue] = useState('OMG Gaushala, Madurai')
  const [summary, setSummary] = useState('')
  const [rituals, setRituals] = useState('')
  const [isPaid, setIsPaid] = useState(false)
  const [price, setPrice] = useState('11')
  const [capacity, setCapacity] = useState('')
  const [livestreamUrl, setLivestreamUrl] = useState('')
  const [status, setStatus] = useState<GaushalaEvent['status']>('draft')

  // Load the row into the form once per festival opened.
  const key = existing?.id ?? (event === 'new' ? 'new' : null)
  if (key && loaded !== key) {
    setLoaded(key)
    setName(existing?.name ?? '')
    setTamil(existing?.tamil ?? '')
    setStartAt(existing ? toLocalInput(existing.startAt) : '')
    setEndAt(existing ? toLocalInput(existing.endAt) : '')
    setVenue(existing?.venue ?? 'OMG Gaushala, Madurai')
    setSummary(existing?.summary ?? '')
    setRituals((existing?.rituals ?? []).join('\n'))
    setIsPaid(existing?.isPaid ?? false)
    setPrice(existing?.ticketPrice ? String(existing.ticketPrice / 100) : '11')
    setCapacity(existing?.capacity ? String(existing.capacity) : '')
    setLivestreamUrl(existing?.livestreamUrl ?? '')
    setStatus(existing?.status ?? 'draft')
  }

  if (!event) return null

  function save() {
    const result = saveGaushalaEvent(
      {
        id: existing?.id,
        name,
        tamil,
        startAt,
        endAt,
        venue,
        summary,
        rituals: rituals.split('\n').map((r) => r.trim()).filter(Boolean),
        isPaid,
        ticketPrice: isPaid ? Math.round((Number(price) || 0) * 100) : undefined,
        capacity: capacity ? Number(capacity) : undefined,
        livestreamUrl,
        status,
      },
      actor,
    )
    if (!result.ok) {
      toast.danger('Could not save it', result.error)
      return
    }
    onClose()
  }

  return (
    <Drawer
      open
      onClose={onClose}
      title={existing ? existing.name : 'Add a festival'}
      subtitle={`Times are entered in your own zone, ${viewerTimeZone()} (${timeZoneLabel()}), and stored UTC.`}
      width="lg"
      footer={
        <div className="flex gap-2">
          <Button onClick={save}>{existing ? 'Save changes' : 'Add to the calendar'}</Button>
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
        </div>
      }
    >
      <div className="space-y-4">
        <Input label="Name" value={name} onChange={(e) => setName(e.target.value)} />
        <Input label="Name in Tamil" value={tamil} onChange={(e) => setTamil(e.target.value)} />
        <div className="grid gap-4 sm:grid-cols-2">
          <Input label="Starts" type="datetime-local" value={startAt} onChange={(e) => setStartAt(e.target.value)} />
          <Input label="Ends" type="datetime-local" value={endAt} onChange={(e) => setEndAt(e.target.value)} />
        </div>
        <Input label="Venue" value={venue} onChange={(e) => setVenue(e.target.value)} />
        <Textarea label="What it is" value={summary} onChange={(e) => setSummary(e.target.value)} />
        <Textarea
          label="Rituals"
          value={rituals}
          onChange={(e) => setRituals(e.target.value)}
          hint="One per line. These show as chips on the public page."
        />

        <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-navy-100 p-3.5 text-[13.5px] text-navy-800">
          <input
            type="checkbox"
            checked={isPaid}
            onChange={(e) => setIsPaid(e.target.checked)}
            className="mt-0.5 size-4 shrink-0 accent-kumkum-600"
          />
          <span>Paid registration</span>
        </label>

        <div className="grid gap-4 sm:grid-cols-2">
          {isPaid ? (
            <Input
              label="Price per head"
              type="number"
              min={0}
              step="0.01"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              hint="In dollars."
            />
          ) : null}
          <Input
            label="Capacity"
            type="number"
            min={0}
            value={capacity}
            onChange={(e) => setCapacity(e.target.value)}
            hint="Leave empty for no limit."
          />
        </div>

        <Input
          label="Live stream link"
          value={livestreamUrl}
          onChange={(e) => setLivestreamUrl(e.target.value)}
          hint="Shown to anyone who registers, an hour before it starts."
        />

        <Select
          label="Status"
          value={status}
          onChange={(e) => setStatus(e.target.value as GaushalaEvent['status'])}
          options={[
            { value: 'draft', label: 'Draft — not on the public page' },
            { value: 'published', label: 'Published' },
            { value: 'live', label: 'Live now' },
            { value: 'completed', label: 'Completed' },
            { value: 'cancelled', label: 'Cancelled' },
          ]}
        />
      </div>
    </Drawer>
  )
}

function RegistrationsDrawer({ event, onClose }: { event: GaushalaEvent | null; onClose: () => void }) {
  const db = useDb()
  const actor = useCurrentUser()
  const cancelRsvp = useDb((s) => s.cancelRsvp)

  const rows = useMemo(
    () => (event ? db.eventRsvps.filter((r) => r.eventId === event.id) : []),
    [db.eventRsvps, event],
  )

  if (!event) return null
  const people = rows.filter((r) => r.status !== 'cancelled').reduce((t, r) => t + r.people, 0)

  return (
    <Drawer
      open
      onClose={onClose}
      title={`${event.name} — registrations`}
      subtitle={`${people} people across ${rows.length} registrations`}
      width="lg"
    >
      <div className="space-y-4">
        {rows.length === 0 ? (
          <EmptyState title="Nobody yet" message="No one has registered for this one." />
        ) : (
          <ul className="space-y-2.5">
            {rows.map((rsvp: GaushalaEventRsvp) => (
              <li key={rsvp.id} className="rounded-xl border border-navy-100 bg-white px-3.5 py-3">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="truncate text-[14px] font-semibold text-navy-950">{rsvp.name}</p>
                    <p className="truncate text-[12.5px] break-all text-navy-600">{rsvp.email}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <StatusBadge status={rsvp.status === 'going' ? 'confirmed' : rsvp.status === 'attended' ? 'done' : 'cancelled'} />
                    {rsvp.status === 'going' ? (
                      <Button
                        size="sm"
                        variant="ghost"
                        aria-label={`Cancel ${rsvp.name}`}
                        icon={<XCircle className="size-4" aria-hidden />}
                        onClick={() => {
                          const r = cancelRsvp(rsvp.id, actor)
                          if (!r.ok) toast.danger('Could not cancel', r.error)
                        }}
                      />
                    ) : null}
                  </div>
                </div>
                <p className="mt-1 text-[12.5px] text-navy-600">
                  {rsvp.people} {rsvp.people === 1 ? 'person' : 'people'}
                  {rsvp.amount > 0 ? <> · paid <Money value={rsvp.amount} /></> : ' · free'} ·{' '}
                  <span className="font-mono">{rsvp.qrToken}</span>
                </p>
              </li>
            ))}
          </ul>
        )}
      </div>
    </Drawer>
  )
}
