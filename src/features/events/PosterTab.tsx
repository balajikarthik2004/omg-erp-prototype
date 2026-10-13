import { useState } from 'react'
import { Download, ExternalLink, ImageIcon, Sparkles } from 'lucide-react'

import { Button } from '@/components/ui/Button'
import { Card, CardHeader } from '@/components/ui/Card'
import { EmptyState } from '@/components/ui/EmptyState'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { userName } from '@/mock/seed'
import { useDb } from '@/store/db'
import { currentUser, useSession } from '@/store/session'
import type { PosterDesign } from '@/types'
import { canGeneratePoster, isAdmin } from './logic/stateMachine'
import { VARIANTS } from './logic/poster'
import { PosterDecisionPanel } from './PosterDecisionPanel'
import { PosterPreview } from './PosterPreview'
import { downloadSvg, openSvg, posterIsStale } from './posterTools'
import { registrationUrl, type EventView } from './useEvent'

const label = (v: PosterDesign['variant']) => VARIANTS.find((x) => x.id === v)?.label ?? v

/** Step 4: three designs, the exact text and QR added by the app, then a different admin approves. */
export function PosterTab({ view }: { view: EventView }) {
  const { event, designs, organisation } = view
  const personaId = useSession((s) => s.personaId)
  const user = currentUser(personaId)
  const generatePosters = useDb((s) => s.generatePosters)
  const selectPoster = useDb((s) => s.selectPoster)
  const [error, setError] = useState<string>()
  const [svg, setSvg] = useState('')

  const guard = canGeneratePoster(event)
  const batches = [...new Set(designs.map((d) => d.batchNo))].sort((a, b) => b - a)
  const latest = designs.filter((d) => d.batchNo === batches[0])
  const earlier = designs.filter((d) => d.batchNo !== batches[0])
  const selected = designs.find((d) => d.id === event.selectedPosterDesignId)
  const slug = event.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')

  const run = (r: { ok: boolean; error?: string }) => setError(r.ok ? undefined : r.error)

  if (!guard.allowed && !selected && designs.length === 0) {
    return (
      <EmptyState
        icon={<ImageIcon className="size-6" aria-hidden />}
        title="The poster comes after the budget"
        message={guard.reason ?? 'Confirm the event first.'}
      />
    )
  }

  /* waiting for, or past, approval */
  if (selected && (event.status === 'poster_pending' || event.status === 'published' || event.status === 'live' || event.status === 'completed' || event.status === 'closed')) {
    const stale = posterIsStale(event, selected)
    return (
      <div className="grid gap-6 lg:grid-cols-[minmax(0,380px)_1fr] lg:items-start">
        <PosterPreview event={event} design={selected} organisation={organisation} onSvg={setSvg} />
        <div className="flex flex-col gap-6">
          <Card accentClass={event.status === 'poster_pending' ? 'bg-marigold-500' : 'bg-tulsi-500'}>
            <CardHeader title={event.status === 'poster_pending' ? 'Waiting for approval' : 'Poster is public'} description={`${label(selected.variant)} design, chosen by ${userName(event.lastPreparerId ?? selected.createdBy)}`} />
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <StatusBadge status={event.posterStatus === 'none' ? 'draft' : event.posterStatus} />
              {stale ? <span className="text-[13px] text-danger-600">The event details changed after this was made.</span> : null}
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
    )
  }

  /* choosing a design */
  return (
    <div className="flex flex-col gap-6">
      {event.posterStatus === 'stale' ? (
        <p className="rounded-lg border border-danger-50 bg-danger-50 px-4 py-3 text-[14px] text-danger-600">
          The poster was taken down because something printed on it changed. Make a new one and have it approved again.
        </p>
      ) : null}

      <Card>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="font-display text-[18px] text-stone-900">{designs.length === 0 ? 'Make the poster' : 'Designs'}</h2>
            <p className="mt-1 max-w-2xl text-[13px] text-stone-500">
              Three background designs are made without any words. The app then prints the exact text from the event record, the logo and a QR code on each. To fix a typo, edit the event, not the poster.
            </p>
          </div>
          <Button icon={<Sparkles className="size-4" aria-hidden />} disabled={!isAdmin(user) || !guard.allowed} title={isAdmin(user) ? guard.reason : 'Only a Sector Admin makes a poster.'} onClick={() => run(generatePosters(event.id, user))}>
            {designs.length === 0 ? 'Make three designs' : 'Make three more'}
          </Button>
        </div>
        {error ? <p role="alert" className="mt-3 text-[13px] text-danger-600">{error}</p> : null}
      </Card>

      {latest.length > 0 ? (
        <div className="grid gap-5 md:grid-cols-3">
          {latest.map((d) => (
            <Card key={d.id} className="flex flex-col gap-3">
              <PosterPreview event={event} design={d} organisation={organisation} />
              <div>
                <p className="text-[15px] font-medium text-stone-900">{label(d.variant)}</p>
                <p className="text-[12px] text-stone-500">Offline template art · set {d.batchNo}</p>
                <details className="mt-2 text-[12px] text-stone-500">
                  <summary className="cursor-pointer text-kumkum-700">The prompt for the art</summary>
                  <p className="mt-1 leading-relaxed">{d.prompt}</p>
                </details>
              </div>
              <Button fullWidth disabled={!isAdmin(user)} title={isAdmin(user) ? undefined : 'Only a Sector Admin chooses a design.'} onClick={() => run(selectPoster(event.id, d.id, user))}>Use this design</Button>
            </Card>
          ))}
        </div>
      ) : null}

      {earlier.length > 0 ? (
        <details className="rounded-card border border-sandal-200 bg-sandal-50 p-4">
          <summary className="cursor-pointer text-[14px] text-stone-700">{earlier.length} earlier designs</summary>
          <div className="mt-4 grid gap-4 sm:grid-cols-3 lg:grid-cols-6">
            {earlier.map((d) => (
              <button key={d.id} type="button" disabled={!isAdmin(user)} onClick={() => run(selectPoster(event.id, d.id, user))} className="text-left" aria-label={`Use the ${label(d.variant)} design from set ${d.batchNo}`}>
                <PosterPreview event={event} design={d} organisation={organisation} />
                <p className="mt-1 text-[12px] text-stone-500">{label(d.variant)} · set {d.batchNo}</p>
              </button>
            ))}
          </div>
        </details>
      ) : null}
    </div>
  )
}
