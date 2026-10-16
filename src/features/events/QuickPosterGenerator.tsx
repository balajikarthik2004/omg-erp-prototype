import { useMemo, useState } from 'react'
import { Download, ExternalLink, Palette } from 'lucide-react'

import { Button } from '@/components/ui/Button'
import { Card, CardHeader } from '@/components/ui/Card'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { formatDate } from '@/lib/format'
import { inSector } from '@/store/selectors'
import { useDb } from '@/store/db'
import { useSession } from '@/store/session'
import type { EventRecord, PosterDesign, SectorId } from '@/types'
import { generateDesigns, renderPosterSvg, VARIANTS } from './logic/poster'
import { selectPosterTheme } from './logic/posterThemes'
import { downloadSvg, openSvg } from './posterTools'
import { PosterPreview } from './PosterPreview'
import { AUTO_POSTER_STYLE, PosterStyleControls, type PosterStyle } from './PosterStyleControls'

const label = (v: PosterDesign['variant']) => VARIANTS.find((x) => x.id === v)?.label ?? v

/** A datetime-local value, rounded to the next whole hour. */
function localInput(date: Date): string {
  const d = new Date(date)
  d.setMinutes(0, 0, 0)
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

/** An ISO instant as the value a datetime-local field shows, in the browser's own zone. */
function isoToLocalInput(iso: string): string {
  const d = new Date(iso)
  return Number.isNaN(d.getTime()) ? '' : localInput(d).slice(0, 16)
}

interface QuickForm {
  sectorId: SectorId
  eventType: string
  eventName: string
  startAt: string
  endAt: string
  venue: string
  chiefGuest: string
  ticketPrice: string
  isPaid: boolean
  contactName: string
  contactPhone: string
}

export function QuickPosterGenerator() {
  const filter = useSession((s) => s.sectorFilter)
  const db = useDb()
  const tenantName = db.tenants.find((t) => t.id === db.activeTenantId)?.name ?? 'OMG Platform'

  const events = useMemo(
    () => inSector(db.events, filter).filter((e) => e.status !== 'cancelled').sort((a, b) => a.startAt.localeCompare(b.startAt)),
    [db.events, filter],
  )

  /* Nothing about an event is baked in: an empty sheet, or the real values of a
     real event pulled from the store. */
  const [prefillId, setPrefillId] = useState('')
  const [form, setForm] = useState<QuickForm>(() => {
    const start = new Date()
    start.setDate(start.getDate() + 21)
    start.setHours(18, 0, 0, 0)
    const end = new Date(start)
    end.setHours(21, 0, 0, 0)
    return {
      sectorId: filter === 'all' ? 'temple' : filter,
      eventType: 'FESTIVAL',
      eventName: '',
      startAt: localInput(start),
      endAt: localInput(end),
      venue: '',
      chiefGuest: '',
      ticketPrice: '',
      isPaid: false,
      contactName: '',
      contactPhone: '',
    }
  })

  const [style, setStyle] = useState<PosterStyle>(AUTO_POSTER_STYLE)
  const [designs, setDesigns] = useState<PosterDesign[]>([])
  const [currentEvent, setCurrentEvent] = useState<EventRecord | null>(null)
  const [batchNo, setBatchNo] = useState(1)
  const [downloadingId, setDownloadingId] = useState<string>()

  const set = <K extends keyof QuickForm>(key: K, value: QuickForm[K]) => setForm((f) => ({ ...f, [key]: value }))

  /** Loads a real event's stored values into the sheet. The poster never reads the record directly. */
  const handlePrefill = (id: string) => {
    setPrefillId(id)
    const source = events.find((e) => e.id === id)
    if (!source) return
    setForm({
      sectorId: source.sectorId,
      eventType: source.eventType,
      eventName: source.name,
      startAt: isoToLocalInput(source.startAt),
      endAt: isoToLocalInput(source.endAt),
      venue: source.venue,
      chiefGuest: source.chiefGuest ?? '',
      ticketPrice: source.ticketPrice ? String(source.ticketPrice / 100) : '',
      isPaid: source.isPaid,
      contactName: source.contactName,
      contactPhone: source.contactPhone,
    })
    setStyle(AUTO_POSTER_STYLE)
  }

  /* The theme preview follows whatever is typed, before anything is generated. */
  const draftEvent = { eventType: form.eventType, name: form.eventName, image: undefined }
  const autoTheme = selectPosterTheme(draftEvent).theme

  const handleGenerate = () => {
    const now = new Date().toISOString()
    const adHoc: EventRecord = {
      id: `quick-${Date.now()}`,
      sectorId: form.sectorId,
      eventType: form.eventType || 'GENERAL',
      name: form.eventName.trim(),
      startAt: new Date(form.startAt).toISOString(),
      endAt: new Date(form.endAt).toISOString(),
      venue: form.venue.trim(),
      chiefGuest: form.chiefGuest.trim() || undefined,
      contactName: form.contactName.trim() || tenantName,
      contactPhone: form.contactPhone.trim(),
      isPaid: form.isPaid,
      ticketPrice: form.isPaid && form.ticketPrice ? Math.round(parseFloat(form.ticketPrice) * 100) : undefined,
      status: 'draft',
      posterStatus: 'none',
      createdBy: 'quick-generator',
      createdAt: now,
      updatedAt: now,
    }

    let idCount = 0
    const nextDesigns = generateDesigns(adHoc, batchNo, 'quick-generator', () => `quick-des-${batchNo}-${++idCount}`)
    setCurrentEvent(adHoc)
    setDesigns(nextDesigns)
    setBatchNo((b) => b + 1)
  }

  const renderArgs = (design: PosterDesign) => ({
    event: currentEvent!,
    design,
    organisation: tenantName,
    registrationUrl: `${window.location.origin}/events`,
    photoSrc: style.photoSrc,
  })

  const handleDownload = async (design: PosterDesign) => {
    if (!currentEvent) return
    setDownloadingId(design.id)
    try {
      const rendered = await renderPosterSvg(renderArgs(design))
      const slug = currentEvent.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'poster'
      downloadSvg(rendered, `${slug}-${design.variant}-poster.svg`)
    } finally {
      setDownloadingId(undefined)
    }
  }

  const handlePrint = async (design: PosterDesign) => {
    if (!currentEvent) return
    openSvg(await renderPosterSvg(renderArgs(design)))
  }

  /** A hand-picked photo only belongs to the design whose theme owns that photo. */
  const photoFor = (design: PosterDesign) => (design.variant === (style.themeId === 'auto' ? autoTheme.id : style.themeId) ? style.photoSrc : undefined)

  return (
    <div className="flex flex-col gap-6">
      <Card>
        <CardHeader
          title="Quick Standalone Poster Generator"
          description="Create and export print-ready promotional posters on the fly whenever required, without creating an ERP event or waiting for budget approval."
        />

        <div className="mt-5 max-w-md">
          <Select
            label="Start from an existing event (optional)"
            hint="Pulls that event's stored name, dates, venue, guest, price and contact into the sheet below."
            value={prefillId}
            onChange={(e) => handlePrefill(e.target.value)}
            options={[
              { value: '', label: 'Blank sheet' },
              ...events.map((e) => ({ value: e.id, label: `${e.name} · ${formatDate(e.startAt)}` })),
            ]}
          />
        </div>

        <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Input
            label="Event Name"
            value={form.eventName}
            onChange={(e) => set('eventName', e.target.value)}
            placeholder="e.g. Navaratri Vizha"
          />

          <Select
            label="Sector"
            value={form.sectorId}
            onChange={(e) => set('sectorId', e.target.value as SectorId)}
            options={[
              { value: 'temple', label: 'Temple (கோயில்)' },
              { value: 'sevalaya', label: 'Sevalaya (சேவாலயா)' },
              { value: 'sangam', label: 'Tamil Heritage (தமிழ்ச் சங்கம்)' },
            ]}
          />

          <Select
            label="Celebration Type"
            hint={`Sets the theme: ${autoTheme.label}`}
            value={form.eventType}
            onChange={(e) => set('eventType', e.target.value)}
            options={[
              { value: 'FESTIVAL', label: 'Festival / திருவிழா' },
              { value: 'NAVARATRI', label: 'Navaratri / நவராத்திரி' },
              { value: 'PONGAL', label: 'Thai Pongal / பொங்கல்' },
              { value: 'DIWALI', label: 'Deepavali / தீபாவளி' },
              { value: 'PUTHANDU', label: 'Puthandu / புத்தாண்டு' },
              { value: 'CAR_FESTIVAL', label: 'Car Festival / தேர்' },
              { value: 'PROGRAM', label: 'Cultural Program / நிகழ்ச்சி' },
              { value: 'POOJA', label: 'Pooja & Archana / பூஜை' },
              { value: 'KALYANAM', label: 'Thirukalyanam / திருக்கல்யாணம்' },
              { value: 'SEVA', label: 'Seva & Annadhanam / சேவை' },
              { value: 'WORKSHOP', label: 'Workshop / பயிலரங்கம்' },
              { value: 'SEMINAR', label: 'Seminar / கருத்தரங்கம்' },
              { value: 'CHARITY', label: 'Charity Dinner / நன்கொடை விருந்து' },
            ]}
          />

          <Input
            label="Start Date & Time"
            type="datetime-local"
            value={form.startAt}
            onChange={(e) => set('startAt', e.target.value)}
          />

          <Input
            label="End Date & Time"
            type="datetime-local"
            value={form.endAt}
            onChange={(e) => set('endAt', e.target.value)}
          />

          <Input
            label="Venue / Location"
            value={form.venue}
            onChange={(e) => set('venue', e.target.value)}
            placeholder="e.g. Main Mandapam"
          />

          <Input
            label="Chief Guest / Artist (Optional)"
            value={form.chiefGuest}
            onChange={(e) => set('chiefGuest', e.target.value)}
            placeholder="e.g. Padma Bhushan Dr. Raman"
          />

          <div className="flex gap-2">
            <div className="w-28">
              <Select
                label="Entry"
                value={form.isPaid ? 'paid' : 'free'}
                onChange={(e) => set('isPaid', e.target.value === 'paid')}
                options={[
                  { value: 'paid', label: 'Ticketed' },
                  { value: 'free', label: 'Free entry' },
                ]}
              />
            </div>
            <div className="flex-1">
              <Input
                label="Ticket Price ($)"
                value={form.ticketPrice}
                onChange={(e) => set('ticketPrice', e.target.value)}
                disabled={!form.isPaid}
                placeholder="20.00"
              />
            </div>
          </div>

          <div className="flex gap-2">
            <div className="flex-1">
              <Input
                label="Contact Name"
                value={form.contactName}
                onChange={(e) => set('contactName', e.target.value)}
                placeholder="e.g. Festival Office"
              />
            </div>
            <div className="flex-1">
              <Input
                label="Contact Phone"
                value={form.contactPhone}
                onChange={(e) => set('contactPhone', e.target.value)}
                placeholder="+91 98400 12345"
              />
            </div>
          </div>
        </div>

        <PosterStyleControls
          className="mt-6 border-t border-sandal-200 pt-5"
          event={draftEvent}
          value={style}
          onChange={setStyle}
        />

        <div className="mt-5 flex justify-end">
          <Button
            icon={<Palette className="size-4" aria-hidden />}
            disabled={!form.eventName.trim() || !form.venue.trim()}
            onClick={handleGenerate}
          >
            {designs.length === 0 ? 'Generate 3 Poster Designs' : 'Regenerate 3 Designs'}
          </Button>
        </div>
      </Card>

      {designs.length > 0 && currentEvent ? (
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <h3 className="font-display text-[18px] text-stone-900">Generated Designs for &ldquo;{currentEvent.name}&rdquo;</h3>
            <span className="text-[13px] text-stone-500">Print ready · 1024 × 1448</span>
          </div>

          <div className="grid gap-5 md:grid-cols-3">
            {designs.map((d) => (
              <Card key={d.id} className="flex flex-col gap-3">
                <PosterPreview
                  event={currentEvent}
                  design={d}
                  organisation={tenantName}
                  photoSrc={photoFor(d)}
                />
                <div>
                  <div className="flex items-center justify-between">
                    <p className="text-[15px] font-medium text-stone-900">{label(d.variant)}</p>
                    {d.variant === autoTheme.id ? (
                      <span className="rounded bg-turmeric-100 px-2 py-0.5 text-[11px] font-medium text-turmeric-700">Recommended</span>
                    ) : null}
                  </div>
                  <p className="text-[12px] text-stone-500">Real photograph, words drawn on top</p>
                  <details className="mt-2 text-[12px] text-stone-500">
                    <summary className="cursor-pointer text-kumkum-700">The photo brief</summary>
                    <p className="mt-1 leading-relaxed">{d.prompt}</p>
                  </details>
                </div>
                <div className="flex gap-2 pt-1">
                  <Button
                    size="sm"
                    variant="secondary"
                    className="flex-1"
                    disabled={downloadingId === d.id}
                    icon={<Download className="size-3.5" aria-hidden />}
                    onClick={() => handleDownload(d)}
                  >
                    Download SVG
                  </Button>
                  <Button
                    size="sm"
                    variant="secondary"
                    className="flex-1"
                    icon={<ExternalLink className="size-3.5" aria-hidden />}
                    onClick={() => handlePrint(d)}
                  >
                    Open to Print
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  )
}
