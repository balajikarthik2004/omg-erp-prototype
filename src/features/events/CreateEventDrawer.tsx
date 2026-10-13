import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

import { SECTORS, SECTOR_IDS, type SectorId } from '@/config'
import { Button } from '@/components/ui/Button'
import { Drawer } from '@/components/ui/Drawer'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { useDb } from '@/store/db'
import { currentUser, useSession } from '@/store/session'
import { EVENT_TYPES, fromLocalInput, toCents } from './useEvent'

/** Step 1 of the Events flow: name, date, venue, guest, contact, capacity, free or paid. */
export function CreateEventDrawer({ open, onClose }: { open: boolean; onClose: () => void }) {
  const navigate = useNavigate()
  const personaId = useSession((s) => s.personaId)
  const user = currentUser(personaId)
  const createEvent = useDb((s) => s.createEvent)
  const tenant = useDb((s) => s.tenants.find((t) => t.id === s.activeTenantId))
  const sectors = SECTOR_IDS.filter((id) => !tenant || tenant.verticals.includes(id))

  const [f, setF] = useState({
    name: '', sectorId: (sectors[0] ?? 'temple') as SectorId, eventType: 'FESTIVAL', start: '', end: '', venue: '',
    chiefGuest: '', contactName: '', contactPhone: '', capacity: '', paid: 'free', price: '', tax: '',
  })
  const [error, setError] = useState<string>()
  const set = (patch: Partial<typeof f>) => {
    setF((v) => ({ ...v, ...patch }))
    setError(undefined)
  }

  function submit() {
    const result = createEvent(
      {
        name: f.name,
        sectorId: f.sectorId,
        eventType: f.eventType,
        startAt: fromLocalInput(f.start),
        endAt: fromLocalInput(f.end),
        venue: f.venue,
        chiefGuest: f.chiefGuest,
        contactName: f.contactName,
        contactPhone: f.contactPhone,
        capacity: f.capacity ? Number(f.capacity) : undefined,
        isPaid: f.paid === 'paid',
        ticketPrice: f.paid === 'paid' ? toCents(f.price) : undefined,
        ticketTaxNote: f.tax,
      },
      user,
    )
    if (!result.ok) {
      setError(result.error)
      return
    }
    onClose()
    navigate(`/console/events/${result.id}?tab=budget`)
  }

  const blocked = user.role !== 'sector_admin'

  return (
    <Drawer
      open={open}
      onClose={onClose}
      title="New event"
      subtitle="Step 1 of 6. The budget comes next."
      width="lg"
      footer={
        <div className="flex flex-col gap-3">
          {blocked ? <p className="text-[13px] text-marigold-500">Only a Sector Admin can create an event. Switch persona in the top bar.</p> : null}
          {error ? <p role="alert" className="text-[13px] text-danger-600">{error}</p> : null}
          <Button fullWidth disabled={blocked} onClick={submit}>
            Create draft
          </Button>
        </div>
      }
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <Input label="Event name" placeholder="Margazhi Music Festival" value={f.name} onChange={(e) => set({ name: e.target.value })} />
        </div>
        <Select label="Sector" value={f.sectorId} onChange={(e) => set({ sectorId: e.target.value as SectorId })} options={sectors.map((id) => ({ value: id, label: SECTORS[id].name }))} />
        <Select label="Kind of event" value={f.eventType} onChange={(e) => set({ eventType: e.target.value })} options={EVENT_TYPES} hint="Past events of the same kind pre-fill the budget." />
        <Input label="Starts" type="datetime-local" value={f.start} onChange={(e) => set({ start: e.target.value })} />
        <Input label="Ends" type="datetime-local" value={f.end} onChange={(e) => set({ end: e.target.value })} />
        <div className="sm:col-span-2">
          <Input label="Venue" placeholder="Main Mandapam" value={f.venue} onChange={(e) => set({ venue: e.target.value })} />
        </div>
        <Input label="Chief guest" placeholder="Fixed at confirm" value={f.chiefGuest} onChange={(e) => set({ chiefGuest: e.target.value })} hint="Can be left empty now, but must be set before the event is confirmed." />
        <Input label="Capacity" inputMode="numeric" placeholder="No limit" value={f.capacity} onChange={(e) => set({ capacity: e.target.value.replace(/\D/g, '') })} />
        <Input label="Contact name" value={f.contactName} onChange={(e) => set({ contactName: e.target.value })} />
        <Input label="Contact phone" value={f.contactPhone} onChange={(e) => set({ contactPhone: e.target.value })} />
        <Select label="Entry" value={f.paid} onChange={(e) => set({ paid: e.target.value })} options={[{ value: 'free', label: 'Free entry' }, { value: 'paid', label: 'Paid tickets' }]} />
        {f.paid === 'paid' ? (
          <Input label="Ticket price" inputMode="decimal" leading={<span>$</span>} value={f.price} onChange={(e) => set({ price: e.target.value })} className="font-mono tabular-nums" />
        ) : (
          <span />
        )}
        {f.paid === 'paid' ? (
          <div className="sm:col-span-2">
            <Input label="Tax note (optional)" value={f.tax} onChange={(e) => set({ tax: e.target.value })} hint="Recorded only. Tax is not calculated; the CA team decides it." />
          </div>
        ) : null}
      </div>
    </Drawer>
  )
}
