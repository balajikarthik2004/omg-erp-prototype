/**
 * Times in the viewer's own zone.
 *
 * Everything on the Gaushala calendar is stored UTC. A donor in New Jersey and
 * one in Madurai are looking at the same festival, and both should be told when
 * it starts where *they* are, with the zone named so there is no doubt. That is
 * the whole job of this file: format, never store.
 */

export function viewerTimeZone(): string {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC'
  } catch {
    return 'UTC'
  }
}

/** "GMT+5:30" / "EDT" — whatever the platform calls the viewer's zone. */
export function timeZoneLabel(at: string | Date = new Date()): string {
  const date = typeof at === 'string' ? new Date(at) : at
  try {
    const part = new Intl.DateTimeFormat(undefined, { timeZoneName: 'short' })
      .formatToParts(date)
      .find((p) => p.type === 'timeZoneName')
    return part?.value ?? viewerTimeZone()
  } catch {
    return viewerTimeZone()
  }
}

/** "Sun, 8 Nov 2026 · 6:30 am" in the viewer's zone. */
export function formatInViewerZone(at: string | Date): string {
  const date = typeof at === 'string' ? new Date(at) : at
  try {
    return new Intl.DateTimeFormat(undefined, {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    }).format(date)
  } catch {
    return date.toISOString()
  }
}

/** Just the clock part, for a start–end pair that shares a day. */
export function formatTimeInViewerZone(at: string | Date): string {
  const date = typeof at === 'string' ? new Date(at) : at
  try {
    return new Intl.DateTimeFormat(undefined, { hour: 'numeric', minute: '2-digit' }).format(date)
  } catch {
    return date.toISOString().slice(11, 16)
  }
}

/** Whether two instants fall on the same day in the viewer's zone. */
export function sameViewerDay(a: string | Date, b: string | Date): boolean {
  const fmt = new Intl.DateTimeFormat(undefined, { year: 'numeric', month: '2-digit', day: '2-digit' })
  return fmt.format(new Date(a as string)) === fmt.format(new Date(b as string))
}

/** "in 3 weeks" / "2 days ago", from the viewer's own clock. */
export function relativeToNow(at: string | Date): string {
  const date = typeof at === 'string' ? new Date(at) : at
  const diffMs = date.getTime() - Date.now()
  const abs = Math.abs(diffMs)
  const units: [Intl.RelativeTimeFormatUnit, number][] = [
    ['year', 365 * 24 * 3600_000],
    ['month', 30 * 24 * 3600_000],
    ['week', 7 * 24 * 3600_000],
    ['day', 24 * 3600_000],
    ['hour', 3600_000],
    ['minute', 60_000],
  ]
  try {
    const rtf = new Intl.RelativeTimeFormat(undefined, { numeric: 'auto' })
    for (const [unit, ms] of units) {
      if (abs >= ms) return rtf.format(Math.round(diffMs / ms), unit)
    }
    return rtf.format(0, 'minute')
  } catch {
    return date.toDateString()
  }
}
