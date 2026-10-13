import { useState } from 'react'

import { Button } from '@/components/ui/Button'
import { Drawer } from '@/components/ui/Drawer'
import { Input } from '@/components/ui/Input'
import { useDb } from '@/store/db'
import { currentUser, useSession } from '@/store/session'
import type { EventRecord } from '@/types'
import { fromLocalInput, toCents, toField, toLocalInput } from './useEvent'

/** Edit what the event record says. Anything printed on a published poster takes the poster down. */
export function EditEventDrawer({ event, open, onClose }: { event: EventRecord; open: boolean; onClose: () => void }) {
  const personaId = useSession((s) => s.personaId)
  const user = currentUser(personaId)
  const updateEvent = useDb((s) => s.updateEvent)
  const [f, setF] = useState({
    name: event.name, start: toLocalInput(event.startAt), end: toLocalInput(event.endAt), venue: event.venue, chiefGuest: event.chiefGuest ?? '',
    contactName: event.contactName, contactPhone: event.contactPhone, capacity: event.capacity ? String(event.capacity) : '',
    price: toField(event.ticketPrice), tax: event.ticketTaxNote ?? '',
  })
  const [error, setError] = useState<string>()
  const set = (patch: Partial<typeof f>) => {
    setF((v) => ({ ...v, ...patch }))
    setError(undefined)
  }

  const live = event.status === 'published' || event.status === 'poster_pending'

  function save() {
    const result = updateEvent(
      event.id,
      {
        name: f.name.trim(),
        startAt: fromLocalInput(f.start) || event.startAt,
        endAt: fromLocalInput(f.end) || event.endAt,
        venue: f.venue.trim(),
        chiefGuest: f.chiefGuest.trim() || undefined,
        contactName: f.contactName.trim(),
        contactPhone: f.contactPhone.trim(),
        capacity: f.capacity ? Number(f.capacity) : undefined,
        ticketPrice: event.isPaid ? toCents(f.price) : undefined,
        ticketTaxNote: f.tax.trim() || undefined,
      },
      user,
    )
    if (!result.ok) setError(result.error)
    else onClose()
  }

  return (
    <Drawer
      open={open}
      onClose={onClose}
      title="Edit event"
      subtitle={event.name}
      width="lg"
      footer={
        <div className="flex flex-col gap-3">
          {live ? (
            <p className="rounded-lg border border-marigold-50 bg-marigold-50 px-3 py-2.5 text-[13px] text-marigold-500">
              The name, date, venue, guest, contact and price are printed on the poster. Changing any of them takes the poster down until a new one is made and approved.
            </p>
          ) : null}
          {error ? <p role="alert" className="text-[13px] text-danger-600">{error}</p> : null}
          <Button fullWidth onClick={save}>Save changes</Button>
        </div>
      }
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="sm:col-span-2"><Input label="Event name" value={f.name} onChange={(e) => set({ name: e.target.value })} /></div>
        <Input label="Starts" type="datetime-local" value={f.start} onChange={(e) => set({ start: e.target.value })} />
        <Input label="Ends" type="datetime-local" value={f.end} onChange={(e) => set({ end: e.target.value })} />
        <div className="sm:col-span-2"><Input label="Venue" value={f.venue} onChange={(e) => set({ venue: e.target.value })} /></div>
        <Input label="Chief guest" value={f.chiefGuest} onChange={(e) => set({ chiefGuest: e.target.value })} />
        <Input label="Capacity" inputMode="numeric" value={f.capacity} onChange={(e) => set({ capacity: e.target.value.replace(/\D/g, '') })} />
        <Input label="Contact name" value={f.contactName} onChange={(e) => set({ contactName: e.target.value })} />
        <Input label="Contact phone" value={f.contactPhone} onChange={(e) => set({ contactPhone: e.target.value })} />
        {event.isPaid ? (
          <>
            <Input label="Ticket price" inputMode="decimal" leading={<span>$</span>} value={f.price} onChange={(e) => set({ price: e.target.value })} className="font-mono tabular-nums" />
            <Input label="Tax note" value={f.tax} onChange={(e) => set({ tax: e.target.value })} />
          </>
        ) : null}
      </div>
    </Drawer>
  )
}
