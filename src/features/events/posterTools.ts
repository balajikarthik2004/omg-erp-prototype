import type { EventRecord, PosterDesign } from '@/types'

/** True when something printed on the poster no longer matches the event record. */
export function posterIsStale(event: EventRecord, design: PosterDesign): boolean {
  const t = design.textSnapshot
  return (
    t.eventName !== event.name || t.startAt !== event.startAt || t.endAt !== event.endAt || t.venue !== event.venue ||
    t.chiefGuest !== event.chiefGuest || t.ticketPrice !== event.ticketPrice || t.contact !== `${event.contactName} ${event.contactPhone}`
  )
}

export function downloadSvg(svg: string, fileName: string) {
  const url = URL.createObjectURL(new Blob([svg], { type: 'image/svg+xml' }))
  const a = document.createElement('a')
  a.href = url
  a.download = fileName
  a.click()
  URL.revokeObjectURL(url)
}

export function openSvg(svg: string) {
  const url = URL.createObjectURL(new Blob([svg], { type: 'image/svg+xml' }))
  window.open(url, '_blank', 'noopener')
}
