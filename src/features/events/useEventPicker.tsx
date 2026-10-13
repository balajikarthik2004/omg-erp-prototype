import { useSearchParams } from 'react-router-dom'

import { formatDate } from '@/lib/format'
import { Select } from '@/components/ui/Select'
import { inSector } from '@/store/selectors'
import { useDb } from '@/store/db'
import { useSession } from '@/store/session'
import type { EventRecord } from '@/types'
import { useEvent } from './useEvent'

/**
 * Cross-event pages (poster studio, registrations, purchases) work on one event at a time.
 * The choice lives in the address (`?event=`), so a link from the approval centre lands on the right event.
 */
export function useEventPicker(eligible: (e: EventRecord) => boolean, label = 'Event') {
  const db = useDb()
  const filter = useSession((s) => s.sectorFilter)
  const [params, setParams] = useSearchParams()
  const options = inSector(db.events, filter).filter(eligible).sort((a, b) => a.startAt.localeCompare(b.startAt))
  const wanted = params.get('event')
  const selectedId = options.some((e) => e.id === wanted) ? (wanted ?? undefined) : options[0]?.id
  const view = useEvent(selectedId)

  const picker = (
    <div className="w-full max-w-md">
      <Select
        label={label}
        value={selectedId ?? ''}
        onChange={(e) => setParams((p) => { const n = new URLSearchParams(p); n.set('event', e.target.value); return n })}
        options={options.length === 0 ? [{ value: '', label: 'No event is ready' }] : options.map((e) => ({ value: e.id, label: `${e.name} · ${formatDate(e.startAt)}` }))}
        disabled={options.length === 0}
      />
    </div>
  )

  return { picker, view, empty: options.length === 0, options }
}
