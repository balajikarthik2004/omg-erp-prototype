import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, SlidersHorizontal, Trash2 } from 'lucide-react'

import { SECTORS, SECTOR_IDS, type SectorId } from '@/config'
import { formatMoneyShort, formatPct } from '@/lib/format'
import { Button } from '@/components/ui/Button'
import { Drawer } from '@/components/ui/Drawer'
import { Input } from '@/components/ui/Input'
import { Money } from '@/components/ui/Money'
import { Select } from '@/components/ui/Select'
import { useDb } from '@/store/db'
import { currentUser, useSession } from '@/store/session'
import { DEFAULT_CATEGORIES, growthDefaultFor, suggestForCategory } from './logic/budget'
import { EVENT_TYPES, fromLocalInput, toCents, toField } from './useEvent'

interface Line {
  key: string
  category: string
  amount: string
}

/** Step 1 of the Events flow, with the itemised budget quoted at the same time: each cost line pre-filled from past events of the same kind. */
export function CreateEventDrawer({ open, onClose }: { open: boolean; onClose: () => void }) {
  const navigate = useNavigate()
  const personaId = useSession((s) => s.personaId)
  const user = currentUser(personaId)
  const createEvent = useDb((s) => s.createEvent)
  const saveBudgetLines = useDb((s) => s.saveBudgetLines)
  const actuals = useDb((s) => s.eventActuals)
  const tenant = useDb((s) => s.tenants.find((t) => t.id === s.activeTenantId))
  const sectors = SECTOR_IDS.filter((id) => !tenant || tenant.verticals.includes(id))

  const suggest = useMemo(
    () => (category: string, eventType: string) =>
      suggestForCategory(
        category,
        actuals.filter((a) => a.eventType === eventType && a.category === category).map((a) => ({ year: a.year, actual: a.actual })),
        { defaultSingleYearGrowth: growthDefaultFor(eventType) },
      ),
    [actuals],
  )

  const starter = (sectorId: SectorId, eventType: string): Line[] =>
    (DEFAULT_CATEGORIES[sectorId] ?? []).map((category) => ({ key: category, category, amount: toField(suggest(category, eventType).suggested ?? undefined) }))

  const [f, setF] = useState({
    name: '', sectorId: (sectors[0] ?? 'temple') as SectorId, eventType: 'FESTIVAL', start: '', end: '', venue: '',
    chiefGuest: '', contactName: '', contactPhone: '', capacity: '', paid: 'free', price: '', tax: '', target: '',
  })
  const [lines, setLines] = useState<Line[]>(() => starter(sectors[0] ?? 'temple', 'FESTIVAL'))
  const [error, setError] = useState<string>()
  const set = (patch: Partial<typeof f>) => {
    setF((v) => ({ ...v, ...patch }))
    setError(undefined)
  }

  /** The cost lines follow the sector and kind of event, since each has its own past spend. */
  const retarget = (sectorId: SectorId, eventType: string) => {
    setLines(starter(sectorId, eventType))
    set({ sectorId, eventType })
  }

  const total = lines.reduce((s, l) => s + toCents(l.amount || '0'), 0)
  const patch = (key: string, p: Partial<Line>) => setLines((ls) => ls.map((l) => (l.key === key ? { ...l, ...p } : l)))

  function autoDistribute() {
    const target = toCents(f.target || '0')
    if (!(target > 0) || lines.length === 0) return
    const weights = lines.map((l) => suggest(l.category, f.eventType).suggested ?? 0)
    const sum = weights.reduce((s, w) => s + w, 0)
    const shares = lines.map((_, i) => (sum > 0 ? weights[i]! / sum : 1 / lines.length))
    const cents = shares.map((s) => Math.round((target * s) / 100) * 100)
    cents[0] = cents[0]! + (target - cents.reduce((s, c) => s + c, 0))
    setLines((ls) => ls.map((l, i) => ({ ...l, amount: toField(cents[i]) })))
  }

  function submit() {
    const result = createEvent(
      {
        name: f.name, sectorId: f.sectorId, eventType: f.eventType, startAt: fromLocalInput(f.start), endAt: fromLocalInput(f.end),
        venue: f.venue, chiefGuest: f.chiefGuest, contactName: f.contactName, contactPhone: f.contactPhone,
        capacity: f.capacity ? Number(f.capacity) : undefined, isPaid: f.paid === 'paid', ticketPrice: f.paid === 'paid' ? toCents(f.price) : undefined, ticketTaxNote: f.tax,
      },
      user,
    )
    if (!result.ok) {
      setError(result.error)
      return
    }
    if (total > 0) {
      saveBudgetLines(
        result.id,
        lines
          .filter((l) => l.category.trim())
          .map((l) => {
            const s = suggest(l.category, f.eventType)
            return { category: l.category, requestedAmount: toCents(l.amount || '0'), suggestedAmount: s.suggested ?? undefined, suggestionNote: s.note, history: s.history }
          }),
        user,
      )
    }
    onClose()
    navigate(`/console/events/${result.id}?tab=budget`)
  }

  const blocked = user.role !== 'sector_admin'

  return (
    <Drawer
      open={open}
      onClose={onClose}
      title="Create new event"
      subtitle="Step 1 of 6. Set the details, and quote the budget line by line."
      width="lg"
      footer={
        <div className="flex flex-col gap-3">
          {blocked ? <p className="text-[13px] text-marigold-500">Only a Sector Admin can create an event. Switch persona in the top bar (Saravanan Pillai or Lakshmi Priya).</p> : null}
          {error ? <p role="alert" className="text-[13px] text-danger-600">{error}</p> : null}
          <Button fullWidth disabled={blocked} onClick={submit}>Create event and save allocations</Button>
        </div>
      }
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="sm:col-span-2"><Input label="Event name" placeholder="Margazhi Music Festival" value={f.name} onChange={(e) => set({ name: e.target.value })} /></div>
        <Select label="Sector" value={f.sectorId} onChange={(e) => retarget(e.target.value as SectorId, f.eventType)} options={sectors.map((id) => ({ value: id, label: SECTORS[id].name }))} />
        <Select label="Kind of event" value={f.eventType} onChange={(e) => retarget(f.sectorId, e.target.value)} options={EVENT_TYPES} hint="Past events of the same kind pre-fill the budget." />
        <Input label="Starts" type="datetime-local" value={f.start} onChange={(e) => set({ start: e.target.value })} />
        <Input label="Ends" type="datetime-local" value={f.end} onChange={(e) => set({ end: e.target.value })} />
        <div className="sm:col-span-2"><Input label="Venue" placeholder="Main Mandapam" value={f.venue} onChange={(e) => set({ venue: e.target.value })} /></div>
        <Input label="Chief guest" placeholder="Fixed at confirm" value={f.chiefGuest} onChange={(e) => set({ chiefGuest: e.target.value })} hint="Can be left empty now, but must be set before the event is confirmed." />
        <Input label="Capacity" inputMode="numeric" placeholder="No limit" value={f.capacity} onChange={(e) => set({ capacity: e.target.value.replace(/\D/g, '') })} />
        <Input label="Contact name" value={f.contactName} onChange={(e) => set({ contactName: e.target.value })} />
        <Input label="Contact phone" value={f.contactPhone} onChange={(e) => set({ contactPhone: e.target.value })} />
        <Select label="Entry" value={f.paid} onChange={(e) => set({ paid: e.target.value })} options={[{ value: 'free', label: 'Free entry' }, { value: 'paid', label: 'Paid tickets' }]} />
        {f.paid === 'paid' ? <Input label="Ticket price" inputMode="decimal" leading={<span>$</span>} value={f.price} onChange={(e) => set({ price: e.target.value })} className="font-mono tabular-nums" /> : <span />}
        {f.paid === 'paid' ? <div className="sm:col-span-2"><Input label="Tax note (optional)" value={f.tax} onChange={(e) => set({ tax: e.target.value })} hint="Recorded only. Tax is not calculated; the CA team decides it." /></div> : null}
      </div>

      <section className="mt-8 rounded-card border border-sandal-200">
        <div className="border-b border-sandal-200 bg-sandal-100 px-5 py-4">
          <h3 className="font-display text-[18px] text-stone-900">Itemised service budget</h3>
          <p className="mt-1 text-[13px] text-stone-500">Every cost line is the source of truth. The total is the sum of the lines. Amounts are pre-filled from past events of this kind.</p>
          <div className="mt-4 flex flex-wrap items-end gap-3">
            <div className="w-48">
              <Input
                label="Target budget"
                inputMode="decimal"
                leading={<span>$</span>}
                placeholder="2500"
                value={f.target}
                onChange={(e) => set({ target: e.target.value })}
                className="font-mono tabular-nums"
              />
            </div>
            <Button
              size="sm"
              icon={<SlidersHorizontal className="size-4" aria-hidden />}
              disabled={!(toCents(f.target || '0') > 0)}
              onClick={autoDistribute}
            >
              Auto-distribute
            </Button>
          </div>
        </div>

        <ul className="divide-y divide-sandal-200">
          {lines.map((l) => {
            const share = total > 0 ? (toCents(l.amount || '0') / total) * 100 : 0
            const s = suggest(l.category, f.eventType)
            return (
              <li key={l.key} className="grid grid-cols-[1fr_130px_52px_32px] items-start gap-3 px-5 py-3">
                <div>
                  <input aria-label="Cost line" value={l.category} onChange={(e) => patch(l.key, { category: e.target.value })} className="w-full rounded-md border border-sandal-300 bg-sandal-50 px-2 py-1.5 text-[14px] text-stone-900 focus-visible:ring-2 focus-visible:ring-turmeric-400 focus-visible:outline-none" />
                  <p className="mt-1 text-[12px] text-stone-500">{s.suggested !== null ? `Suggested ${formatMoneyShort(s.suggested)}` : 'No past events of this kind'}</p>
                </div>
                <Input aria-label={`Amount for ${l.category}`} inputMode="decimal" leading={<span>$</span>} value={l.amount} onChange={(e) => patch(l.key, { amount: e.target.value })} className="text-right font-mono tabular-nums" />
                <span className="pt-2 text-right font-mono text-[12px] text-stone-500 tabular-nums">{formatPct(share, 0)}</span>
                <button type="button" aria-label={`Remove ${l.category}`} onClick={() => setLines((ls) => ls.filter((x) => x.key !== l.key))} className="mt-1 rounded-lg p-1.5 text-stone-500 hover:bg-sandal-100 hover:text-danger-600"><Trash2 className="size-4" aria-hidden /></button>
              </li>
            )
          })}
        </ul>

        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-sandal-200 bg-turmeric-50 px-5 py-4">
          <Button size="sm" variant="secondary" icon={<Plus className="size-4" aria-hidden />} onClick={() => setLines((ls) => [...ls, { key: `n${ls.length}-${Date.now()}`, category: 'New cost line', amount: '' }])}>Add expense line</Button>
          <div className="text-right">
            <p className="text-[11px] font-semibold tracking-[0.12em] text-stone-500 uppercase">Total requested budget</p>
            <Money value={total} className="font-display text-[26px] text-stone-900" />
            <p className="text-[12px] text-stone-500">{lines.filter((l) => toCents(l.amount || '0') > 0).length} cost lines</p>
          </div>
        </div>
      </section>
    </Drawer>
  )
}
