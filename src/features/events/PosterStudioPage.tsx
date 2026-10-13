import { Link } from 'react-router-dom'
import { ImageIcon, Sparkles } from 'lucide-react'

import { Button } from '@/components/ui/Button'
import { EmptyState } from '@/components/ui/EmptyState'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { Skeleton } from '@/components/ui/Skeleton'
import { PageHeader } from '@/components/layout/PageHeader'
import { useDb } from '@/store/db'
import { PosterTab } from './PosterTab'
import { useEventPicker } from './useEventPicker'

/**
 * The AI Poster Studio. Pick a confirmed event, make three designs, choose one, and a different admin approves it.
 * The poster goes out only after the budget is approved and the event is confirmed.
 */
export function PosterStudioPage() {
  const ready = useDb((s) => s.ready)
  const events = useDb((s) => s.events)
  const { picker, view, empty } = useEventPicker((e) => ['confirmed', 'poster_pending', 'published', 'live', 'completed', 'closed'].includes(e.status))

  const waiting = events.filter((e) => e.status === 'budget_approved')

  return (
    <div>
      <PageHeader
        phase="collect"
        title={<span className="flex items-center gap-3">AI Poster Studio<Sparkles className="size-6 text-turmeric-500" aria-hidden /></span>}
        description="Three background designs, made without any words. The app prints the exact event text, the logo and a QR code on each. A different admin approves the one you choose."
      >
        {picker}
      </PageHeader>

      {!ready ? (
        <Skeleton className="h-96 w-full" />
      ) : empty || !view ? (
        <EmptyState
          icon={<ImageIcon className="size-6" aria-hidden />}
          title="No event is ready for a poster"
          message="The poster goes out only after the budget is approved and the event is confirmed."
          action={waiting.length > 0 ? <Link to={`/console/events/${waiting[0]!.id}`}><Button>Confirm {waiting[0]!.name}</Button></Link> : <Link to="/console/events"><Button variant="secondary">See all events</Button></Link>}
        />
      ) : (
        <div className="flex flex-col gap-5">
          <div className="flex flex-wrap items-center gap-2">
            <StatusBadge status={view.event.status} />
            {view.event.posterStatus === 'stale' ? <StatusBadge status="stale" /> : null}
            <Link to={`/console/events/${view.event.id}`} className="text-[13px] text-kumkum-700 hover:underline">Open the workspace</Link>
          </div>
          <PosterTab key={view.event.id} view={view} />
        </div>
      )}
    </div>
  )
}
