import { useState } from 'react'
import { Check, Download, ExternalLink, ImageIcon, Sparkles } from 'lucide-react'

import { Button } from '@/components/ui/Button'
import { Card, CardHeader } from '@/components/ui/Card'
import { EmptyState } from '@/components/ui/EmptyState'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { userName } from '@/mock/seed'
import { useDb } from '@/store/db'
import { currentUser, useSession } from '@/store/session'
import type { PosterDesign } from '@/types'
import { canGeneratePoster, isAdmin } from './logic/stateMachine'
import { renderPosterSvg, VARIANTS } from './logic/poster'
import { PosterDecisionPanel } from './PosterDecisionPanel'
import { PosterPreview } from './PosterPreview'
import { downloadSvg, openSvg, posterIsStale } from './posterTools'
import { registrationUrl, type EventView } from './useEvent'

const label = (v: PosterDesign['variant']) => VARIANTS.find((x) => x.id === v)?.label ?? v

/** Independent poster generation and selection: create designs anytime, preview, export, and submit for four-eyes approval when confirmed. */
export function PosterTab({ view }: { view: EventView }) {
  const { event, designs, organisation } = view
  const personaId = useSession((s) => s.personaId)
  const user = currentUser(personaId)
  const generatePosters = useDb((s) => s.generatePosters)
  const selectPoster = useDb((s) => s.selectPoster)
  const [error, setError] = useState<string>()
  const [svg, setSvg] = useState('')
  const [downloadingId, setDownloadingId] = useState<string>()

  const guard = canGeneratePoster(event)
  const batches = [...new Set(designs.map((d) => d.batchNo))].sort((a, b) => b - a)
  const latest = designs.filter((d) => d.batchNo === batches[0])
  const earlier = designs.filter((d) => d.batchNo !== batches[0])
  const selected = designs.find((d) => d.id === event.selectedPosterDesignId)
  const slug = event.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')

  const run = (r: { ok: boolean; error?: string }) => setError(r.ok ? undefined : r.error)

  const handleDownload = async (design: PosterDesign) => {
    setDownloadingId(design.id)
    try {
      const rendered = await renderPosterSvg({ event, design, organisation, registrationUrl: registrationUrl(event.id) })
      downloadSvg(rendered, `${slug}-${design.variant}-poster.svg`)
    } finally {
      setDownloadingId(undefined)
    }
  }

  const handlePrint = async (design: PosterDesign) => {
    const rendered = await renderPosterSvg({ event, design, organisation, registrationUrl: registrationUrl(event.id) })
    openSvg(rendered)
  }

  if (!guard.allowed && !selected && designs.length === 0) {
    return (
      <EmptyState
        icon={<ImageIcon className="size-6" aria-hidden />}
        title="Posters cannot be modified"
        message={guard.reason ?? `Posters cannot be created for an event that is ${event.status}.`}
      />
    )
  }

  /* waiting for, or past, approval */
  const inApprovalOrPublished = selected && (event.status === 'poster_pending' || event.status === 'published' || event.status === 'live' || event.status === 'completed' || event.status === 'closed')

  return (
    <div className="flex flex-col gap-6">
      {event.posterStatus === 'stale' ? (
        <p className="rounded-lg border border-danger-50 bg-danger-50 px-4 py-3 text-[14px] text-danger-600">
          The poster was taken down because something printed on it changed. Make a new one and have it approved again.
        </p>
      ) : null}

      {inApprovalOrPublished && selected ? (
        <div className="grid gap-6 lg:grid-cols-[minmax(0,380px)_1fr] lg:items-start">
          <PosterPreview event={event} design={selected} organisation={organisation} onSvg={setSvg} />
          <div className="flex flex-col gap-6">
            <Card accentClass={event.status === 'poster_pending' ? 'bg-marigold-500' : 'bg-tulsi-500'}>
              <CardHeader title={event.status === 'poster_pending' ? 'Waiting for approval' : 'Poster is public'} description={`${label(selected.variant)} design, chosen by ${userName(event.lastPreparerId ?? selected.createdBy)}`} />
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <StatusBadge status={event.posterStatus === 'none' ? 'draft' : event.posterStatus} />
                {posterIsStale(event, selected) ? <span className="text-[13px] text-danger-600">The event details changed after this was made.</span> : null}
              </div>

              {event.status === 'poster_pending' ? <div className="mt-4"><PosterDecisionPanel view={view} /></div> : null}
            </Card>

            <Card>
              <CardHeader title="Public page" description="The QR on the poster opens this page. Registration is open once the poster is approved." />
              <p className="mt-3 break-all rounded-lg bg-sandal-100 px-3 py-2 font-mono text-[13px] text-stone-700">{registrationUrl(event.id)}</p>
              <div className="mt-4 flex flex-wrap gap-2">
                <Button size="sm" variant="secondary" disabled={!svg} icon={<Download className="size-4" aria-hidden />} onClick={() => downloadSvg(svg, `${slug}-poster.svg`)}>Download SVG</Button>
                <Button size="sm" variant="secondary" disabled={!svg} icon={<ExternalLink className="size-4" aria-hidden />} onClick={() => openSvg(svg)}>Open to print</Button>
                <a href={`/register/${event.id}`} target="_blank" rel="noreferrer"><Button size="sm" variant="ghost">Open the public page</Button></a>
              </div>
              <p className="mt-3 text-[12px] text-stone-500">PNG and PDF export need a server. The SVG prints at any size.</p>
            </Card>
          </div>
        </div>
      ) : null}

      {/* Selected design notice for planning / confirmed stages before poster_pending */}
      {selected && !inApprovalOrPublished ? (
        <Card accentClass="bg-turmeric-500">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-display text-[16px] text-stone-900">Selected Design: {label(selected.variant)} (Set {selected.batchNo})</h3>
                <span className="inline-flex items-center gap-1 rounded-full bg-turmeric-100 px-2.5 py-0.5 text-[12px] font-medium text-turmeric-700">
                  <Check className="size-3" aria-hidden /> Preferred poster
                </span>
              </div>
              <p className="mt-1 text-[13px] text-stone-600">
                {event.status === 'confirmed'
                  ? 'The event is confirmed. Submit this design for four-eyes approval so another admin can review and publish it.'
                  : 'Design selected during planning. You can download and print it immediately. Official publishing approval opens once the event budget is confirmed.'}
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Button size="sm" variant="secondary" icon={<Download className="size-4" aria-hidden />} onClick={() => handleDownload(selected)}>
                Download SVG
              </Button>
              <Button size="sm" variant="secondary" icon={<ExternalLink className="size-4" aria-hidden />} onClick={() => handlePrint(selected)}>
                Open to print
              </Button>
              {event.status === 'confirmed' && (
                <Button size="sm" disabled={!isAdmin(user)} onClick={() => run(selectPoster(event.id, selected.id, user))}>
                  Submit for approval
                </Button>
              )}
            </div>
          </div>
        </Card>
      ) : null}

      {/* Generator action header */}
      <Card>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="font-display text-[18px] text-stone-900">{designs.length === 0 ? 'Make the poster' : 'Poster studio designs'}</h2>
            <p className="mt-1 max-w-2xl text-[13px] text-stone-500">
              Posters can be generated anytime, without waiting for budget approval. Three background designs are rendered with the exact event typography, logo and registration QR code. You can download or print any design immediately.
            </p>
          </div>
          <Button icon={<Sparkles className="size-4" aria-hidden />} disabled={!isAdmin(user) || !guard.allowed} title={isAdmin(user) ? guard.reason : 'Only a Sector Admin makes a poster.'} onClick={() => run(generatePosters(event.id, user))}>
            {designs.length === 0 ? 'Make three designs' : 'Make three more'}
          </Button>
        </div>
        {error ? <p role="alert" className="mt-3 text-[13px] text-danger-600">{error}</p> : null}
      </Card>

      {/* Latest batch of designs */}
      {latest.length > 0 ? (
        <div className="grid gap-5 md:grid-cols-3">
          {latest.map((d) => {
            const isChosen = selected?.id === d.id
            return (
              <Card key={d.id} className={`flex flex-col gap-3 transition-all ${isChosen ? 'ring-2 ring-turmeric-500' : ''}`}>
                <PosterPreview event={event} design={d} organisation={organisation} />
                <div>
                  <div className="flex items-center justify-between">
                    <p className="text-[15px] font-medium text-stone-900">{label(d.variant)}</p>
                    {isChosen ? (
                      <span className="inline-flex items-center gap-1 rounded bg-tulsi-50 px-2 py-0.5 text-[11px] font-medium text-tulsi-700">
                        <Check className="size-3" aria-hidden /> Selected
                      </span>
                    ) : null}
                  </div>
                  <p className="text-[12px] text-stone-500">Offline template art · set {d.batchNo}</p>
                  <details className="mt-2 text-[12px] text-stone-500">
                    <summary className="cursor-pointer text-kumkum-700">The prompt for the art</summary>
                    <p className="mt-1 leading-relaxed">{d.prompt}</p>
                  </details>
                </div>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="secondary"
                    className="flex-1"
                    disabled={downloadingId === d.id}
                    icon={<Download className="size-3.5" aria-hidden />}
                    onClick={() => handleDownload(d)}
                  >
                    SVG
                  </Button>
                  <Button
                    size="sm"
                    variant="secondary"
                    className="flex-1"
                    icon={<ExternalLink className="size-3.5" aria-hidden />}
                    onClick={() => handlePrint(d)}
                  >
                    Print
                  </Button>
                </div>
                <Button
                  fullWidth
                  variant={isChosen ? 'secondary' : 'primary'}
                  disabled={!isAdmin(user) || isChosen}
                  title={isAdmin(user) ? undefined : 'Only a Sector Admin chooses a design.'}
                  onClick={() => run(selectPoster(event.id, d.id, user))}
                >
                  {isChosen ? 'Selected design' : 'Use this design'}
                </Button>
              </Card>
            )
          })}
        </div>
      ) : null}

      {/* Earlier batch designs */}
      {earlier.length > 0 ? (
        <details className="rounded-card border border-sandal-200 bg-sandal-50 p-4">
          <summary className="cursor-pointer text-[14px] font-medium text-stone-700">{earlier.length} earlier designs</summary>
          <div className="mt-4 grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6">
            {earlier.map((d) => (
              <div key={d.id} className="flex flex-col gap-2 rounded-lg border border-sandal-200 bg-white p-2 text-left">
                <PosterPreview event={event} design={d} organisation={organisation} />
                <div className="flex items-center justify-between text-[11px] text-stone-600">
                  <span className="font-medium">{label(d.variant)}</span>
                  <span>set {d.batchNo}</span>
                </div>
                <div className="flex gap-1">
                  <Button size="sm" variant="ghost" className="h-7 flex-1 px-1 text-[11px]" icon={<Download className="size-3" aria-hidden />} onClick={() => handleDownload(d)}>
                    SVG
                  </Button>
                  <Button size="sm" variant="ghost" className="h-7 flex-1 px-1 text-[11px]" icon={<ExternalLink className="size-3" aria-hidden />} onClick={() => handlePrint(d)}>
                    Print
                  </Button>
                </div>
                <Button
                  size="sm"
                  variant={selected?.id === d.id ? 'secondary' : 'ghost'}
                  disabled={!isAdmin(user) || selected?.id === d.id}
                  onClick={() => run(selectPoster(event.id, d.id, user))}
                >
                  {selected?.id === d.id ? 'Chosen' : 'Select'}
                </Button>
              </div>
            ))}
          </div>
        </details>
      ) : null}
    </div>
  )
}

