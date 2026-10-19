import type { EventRecord, EventsData } from '@/types'
import { calculatePnl, type EventPnl } from './pnl'

/**
 * Finding the earlier editions of an event that comes round every year.
 *
 * The ERP has no "series" column, so an edition is recognised from what it
 * already stores: the same sector, the same event type, and a finished run that
 * started before this one. The name is used only to tell how confident that is
 * — "Navaratri Mahotsavam 2026" and "Navaratri Mahotsavam 2025" are obviously
 * the same thing, while two different FESTIVAL events are only the same kind.
 */

/** The name with the edition markers taken off, so one series collapses to one key. */
export function seriesKey(name: string): string {
  return name
    .toLowerCase()
    .replace(/\b(19|20)\d{2}\b/g, ' ')
    .replace(/\b\d{1,3}(st|nd|rd|th)\b/g, ' ')
    .replace(/[^a-z஀-௿]+/g, ' ')
    .trim()
    .replace(/\s+/g, ' ')
}

export interface PriorEdition {
  event: EventRecord
  /** Calendar year the edition started in. */
  year: number
  pnl: EventPnl
  /** True when the name matches too, not just the event type. */
  sameSeries: boolean
}

/** An edition only counts once its money is real: budgeted, spent and closed off. */
const FINISHED = new Set(['completed', 'closed'])

/**
 * Earlier finished editions of this event, newest last.
 *
 * Same sector and event type is the floor, because that is what the budget
 * history is already keyed on. `sameSeries` says whether the name agrees, and
 * the agent leans on that when it decides how sure to sound.
 */
export function findPriorEditions(data: EventsData, event: EventRecord): PriorEdition[] {
  const key = seriesKey(event.name)
  const startedAt = new Date(event.startAt).getTime()

  return data.events
    .filter(
      (e) =>
        e.id !== event.id &&
        e.sectorId === event.sectorId &&
        e.eventType === event.eventType &&
        FINISHED.has(e.status) &&
        new Date(e.startAt).getTime() < startedAt,
    )
    .map((e) => ({
      event: e,
      year: new Date(e.startAt).getFullYear(),
      pnl: calculatePnl(data, e.id),
      sameSeries: seriesKey(e.name) === key,
    }))
    .sort((a, b) => a.year - b.year)
}

export interface Recurrence {
  recurring: boolean
  editions: PriorEdition[]
  /** True when at least one earlier edition carries the same name. */
  sameSeries: boolean
}

export function detectRecurrence(data: EventsData, event: EventRecord): Recurrence {
  const editions = findPriorEditions(data, event)
  return {
    recurring: editions.length > 0,
    editions,
    sameSeries: editions.some((e) => e.sameSeries),
  }
}
