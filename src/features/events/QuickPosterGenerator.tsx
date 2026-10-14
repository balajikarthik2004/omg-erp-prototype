import { useState } from 'react'
import { Download, ExternalLink, Palette } from 'lucide-react'

import { Button } from '@/components/ui/Button'
import { Card, CardHeader } from '@/components/ui/Card'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { useDb } from '@/store/db'
import { useSession } from '@/store/session'
import type { EventRecord, PosterDesign, SectorId } from '@/types'
import { generateDesigns, renderPosterSvg, VARIANTS } from './logic/poster'
import { downloadSvg, openSvg } from './posterTools'
import { PosterPreview } from './PosterPreview'

const label = (v: PosterDesign['variant']) => VARIANTS.find((x) => x.id === v)?.label ?? v

export function QuickPosterGenerator() {
  const filter = useSession((s) => s.sectorFilter)
  const db = useDb()
  const tenantName = db.tenants.find((t) => t.id === db.activeTenantId)?.name ?? 'OMG Platform'

  const [sectorId, setSectorId] = useState<SectorId>(filter === 'all' ? 'temple' : filter)
  const [eventType, setEventType] = useState('FESTIVAL')
  const [eventName, setEventName] = useState('Margazhi Classical Music & Dance Festival')
  const [startAt, setStartAt] = useState('2026-12-15T18:00')
  const [endAt, setEndAt] = useState('2026-12-15T21:30')
  const [venue, setVenue] = useState('Kaveri Cultural Auditorium, Chennai')
  const [chiefGuest, setChiefGuest] = useState('Dr. T. V. Sankaranarayanan')
  const [ticketPrice, setTicketPrice] = useState('20')
  const [isPaid, setIsPaid] = useState(true)
  const [contactName, setContactName] = useState('Festival Office')
  const [contactPhone, setContactPhone] = useState('+91 98400 12345')

  const [designs, setDesigns] = useState<PosterDesign[]>([])
  const [currentEvent, setCurrentEvent] = useState<EventRecord | null>(null)
  const [batchNo, setBatchNo] = useState(1)
  const [downloadingId, setDownloadingId] = useState<string>()

  const handleGenerate = () => {
    const dummyEvent: EventRecord = {
      id: `quick-${Date.now()}`,
      sectorId,
      eventType: eventType || 'GENERAL',
      name: eventName.trim() || 'Community Festival',
      startAt: new Date(startAt).toISOString(),
      endAt: new Date(endAt).toISOString(),
      venue: venue.trim() || 'Community Hall',
      chiefGuest: chiefGuest.trim() || undefined,
      contactName: contactName.trim() || 'Organizer',
      contactPhone: contactPhone.trim() || '+1 555 0100',
      isPaid,
      ticketPrice: isPaid && ticketPrice ? Math.round(parseFloat(ticketPrice) * 100) : undefined,
      status: 'draft',
      posterStatus: 'none',
      createdBy: 'quick-generator',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }

    let idCount = 0
    const nextDesigns = generateDesigns(dummyEvent, batchNo, 'quick-generator', () => `quick-des-${batchNo}-${++idCount}`)
    setCurrentEvent(dummyEvent)
    setDesigns(nextDesigns)
    setBatchNo((b) => b + 1)
  }

  const handleDownload = async (design: PosterDesign) => {
    if (!currentEvent) return
    setDownloadingId(design.id)
    try {
      const rendered = await renderPosterSvg({
        event: currentEvent,
        design,
        organisation: tenantName,
        registrationUrl: window.location.origin + '/events',
      })
      const slug = currentEvent.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
      downloadSvg(rendered, `${slug}-${design.variant}-poster.svg`)
    } finally {
      setDownloadingId(undefined)
    }
  }

  const handlePrint = async (design: PosterDesign) => {
    if (!currentEvent) return
    const rendered = await renderPosterSvg({
      event: currentEvent,
      design,
      organisation: tenantName,
      registrationUrl: window.location.origin + '/events',
    })
    openSvg(rendered)
  }

  return (
    <div className="flex flex-col gap-6">
      <Card>
        <CardHeader
          title="Quick Standalone Poster Generator"
          description="Create and export print-ready promotional posters on the fly whenever required, without creating an ERP event or waiting for budget approval."
        />

        <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Input
            label="Event Name"
            value={eventName}
            onChange={(e) => setEventName(e.target.value)}
            placeholder="e.g. Navaratri Vizha"
          />

          <Select
            label="Sector"
            value={sectorId}
            onChange={(e) => setSectorId(e.target.value as SectorId)}
            options={[
              { value: 'temple', label: 'Temple (கோயில்)' },
              { value: 'sevalaya', label: 'Sevalaya (சேவாலயா)' },
              { value: 'sangam', label: 'Tamil Sangam (தமிழ்ச் சங்கம்)' },
            ]}
          />

          <Select
            label="Celebration Type"
            value={eventType}
            onChange={(e) => setEventType(e.target.value)}
            options={[
              { value: 'FESTIVAL', label: 'Festival / திருவிழா' },
              { value: 'NAVARATRI', label: 'Navaratri / நவராத்திரி' },
              { value: 'PROGRAM', label: 'Cultural Program / நிகழ்ச்சி' },
              { value: 'SEVA', label: 'Seva & Annadhanam / சேவை' },
              { value: 'PONGAL', label: 'Thai Pongal / பொங்கல்' },
              { value: 'DIWALI', label: 'Deepavali / தீபாவளி' },
            ]}
          />

          <Input
            label="Start Date & Time"
            type="datetime-local"
            value={startAt}
            onChange={(e) => setStartAt(e.target.value)}
          />

          <Input
            label="End Date & Time"
            type="datetime-local"
            value={endAt}
            onChange={(e) => setEndAt(e.target.value)}
          />

          <Input
            label="Venue / Location"
            value={venue}
            onChange={(e) => setVenue(e.target.value)}
            placeholder="e.g. Main Mandapam"
          />

          <Input
            label="Chief Guest / Artist (Optional)"
            value={chiefGuest}
            onChange={(e) => setChiefGuest(e.target.value)}
            placeholder="e.g. Padma Bhushan Dr. Raman"
          />

          <div className="flex gap-2">
            <div className="w-28">
              <Select
                label="Entry"
                value={isPaid ? 'paid' : 'free'}
                onChange={(e) => setIsPaid(e.target.value === 'paid')}
                options={[
                  { value: 'paid', label: 'Ticketed' },
                  { value: 'free', label: 'Free entry' },
                ]}
              />
            </div>
            <div className="flex-1">
              <Input
                label="Ticket Price ($)"
                value={ticketPrice}
                onChange={(e) => setTicketPrice(e.target.value)}
                disabled={!isPaid}
                placeholder="20.00"
              />
            </div>
          </div>

          <div className="flex gap-2">
            <div className="flex-1">
              <Input
                label="Contact Name"
                value={contactName}
                onChange={(e) => setContactName(e.target.value)}
              />
            </div>
            <div className="flex-1">
              <Input
                label="Contact Phone"
                value={contactPhone}
                onChange={(e) => setContactPhone(e.target.value)}
              />
            </div>
          </div>
        </div>

        <div className="mt-5 flex justify-end">
          <Button
            icon={<Palette className="size-4" aria-hidden />}
            disabled={!eventName.trim() || !venue.trim()}
            onClick={handleGenerate}
          >
            {designs.length === 0 ? 'Generate 3 Poster Designs' : 'Regenerate 3 Designs'}
          </Button>
        </div>
      </Card>

      {designs.length > 0 && currentEvent ? (
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <h3 className="font-display text-[18px] text-stone-900">Generated Designs for "{currentEvent.name}"</h3>
            <span className="text-[13px] text-stone-500">Vector SVG print ready · 1024 × 1448</span>
          </div>

          <div className="grid gap-5 md:grid-cols-3">
            {designs.map((d) => (
              <Card key={d.id} className="flex flex-col gap-3">
                <PosterPreview
                  event={currentEvent}
                  design={d}
                  organisation={tenantName}
                />
                <div>
                  <p className="text-[15px] font-medium text-stone-900">{label(d.variant)}</p>
                  <p className="text-[12px] text-stone-500">High-resolution template art</p>
                  <details className="mt-2 text-[12px] text-stone-500">
                    <summary className="cursor-pointer text-kumkum-700">Art prompt details</summary>
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
