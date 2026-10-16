import { useState } from 'react'
import { Link } from 'react-router-dom'
import { ImageIcon, Layers, Palette } from 'lucide-react'

import { Button } from '@/components/ui/Button'
import { EmptyState } from '@/components/ui/EmptyState'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { Skeleton } from '@/components/ui/Skeleton'
import { Tabs } from '@/components/ui/Tabs'
import { PageHeader } from '@/components/layout/PageHeader'
import { useDb } from '@/store/db'
import { PosterTab } from './PosterTab'
import { QuickPosterGenerator } from './QuickPosterGenerator'
import { useEventPicker } from './useEventPicker'

/**
 * The Poster Studio.
 * Decoupled from the budget approval workflow: generate, preview and download posters
 * at any time for any active event (draft, review, or confirmed), or generate on-the-fly posters.
 */
export function PosterStudioPage() {
  const ready = useDb((s) => s.ready)
  const [mode, setMode] = useState<'event' | 'quick'>('event')

  // Pick ANY active event (not cancelled) — including drafts and budget-pending events!
  const { picker, view, empty } = useEventPicker((e) => e.status !== 'cancelled')

  return (
    <div>
      <PageHeader
        title={
          <span className="flex items-center gap-3">
            Poster Studio
            <Palette className="size-6 text-turmeric-500" aria-hidden />
          </span>
        }
      >
        {mode === 'event' ? picker : null}
      </PageHeader>

      <Tabs
        className="mb-6"
        value={mode}
        onChange={(v) => setMode(v as 'event' | 'quick')}
        items={[
          { id: 'event', label: 'Event Posters', count: view?.designs.length },
          { id: 'quick', label: <span className="flex items-center gap-1.5"><Layers className="size-3.5" aria-hidden /> Quick Standalone Poster</span> },
        ]}
      />

      {mode === 'quick' ? (
        <QuickPosterGenerator />
      ) : !ready ? (
        <Skeleton className="h-96 w-full" />
      ) : empty || !view ? (
        <EmptyState
          icon={<ImageIcon className="size-6" aria-hidden />}
          title="No events found"
          message="Create an event to generate posters, or use the Quick Standalone Poster tab to create designs on the fly."
          action={
            <div className="flex gap-2">
              <Link to="/console/events">
                <Button variant="secondary">See all events</Button>
              </Link>
              <Button onClick={() => setMode('quick')}>
                Open Quick Generator
              </Button>
            </div>
          }
        />
      ) : (
        <div className="flex flex-col gap-5">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[13px] font-medium text-stone-500">Event stage:</span>
            <StatusBadge status={view.event.status} />
            {view.event.posterStatus === 'stale' ? <StatusBadge status="stale" /> : null}
            <Link to={`/console/events/${view.event.id}`} className="ml-2 text-[13px] text-kumkum-700 hover:underline">
              Open the event workspace
            </Link>
          </div>
          <PosterTab key={view.event.id} view={view} />
        </div>
      )}
    </div>
  )
}
