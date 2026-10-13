import { useMemo } from 'react'

import { useDb } from '@/store/db'
import { calculatePnl } from './logic/pnl'

/** Everything the event pages need about one event, derived from the store. */
export function useEvent(eventId: string | undefined) {
  const db = useDb()
  return useMemo(() => {
    const event = db.events.find((e) => e.id === eventId)
    if (!event) return null
    const lines = db.eventBudgetLines.filter((l) => l.eventId === event.id)
    const orders = db.eventOrders.filter((o) => o.eventId === event.id)
    return {
      event,
      lines,
      orders,
      approvals: db.eventApprovals.filter((a) => a.entityId === event.id),
      designs: db.eventPosters.filter((d) => d.eventId === event.id),
      registrations: db.eventRegistrations.filter((r) => r.eventId === event.id),
      sponsors: db.eventSponsors.filter((s) => s.eventId === event.id),
      donations: db.eventDonations.filter((d) => d.eventId === event.id),
      fund: db.funds.find((f) => f.id === event.fundId),
      pnl: calculatePnl(db, event.id),
      requestedTotal: lines.reduce((s, l) => s + l.requestedAmount, 0),
      approvedTotal: lines.reduce((s, l) => s + (l.approvedAmount ?? 0), 0),
      organisation: db.tenants.find((t) => t.id === db.activeTenantId)?.name ?? 'OMG Platform',
    }
  }, [db, eventId])
}

export type EventView = NonNullable<ReturnType<typeof useEvent>>

/** The page a poster QR opens. */
export function registrationUrl(eventId: string): string {
  return `${window.location.origin}/register/${encodeURIComponent(eventId)}`
}

/** Dollars typed into a field, as cents. */
export function toCents(text: string): number {
  return Math.round(Number(text.replace(/[^0-9.]/g, '')) * 100)
}

/** Cents as the plain number a field shows: 12500 -> "125". */
export function toField(cents: number | undefined): string {
  if (cents === undefined) return ''
  return String(cents / 100)
}

/** The value a datetime-local input wants, from an ISO string. */
export function toLocalInput(iso: string): string {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ''
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

export function fromLocalInput(local: string): string {
  const d = new Date(local)
  return Number.isNaN(d.getTime()) ? '' : d.toISOString()
}

export const EVENT_TYPES = [
  { value: 'NAVARATRI', label: 'Navaratri' },
  { value: 'FESTIVAL', label: 'Festival' },
  { value: 'DIWALI', label: 'Deepavali' },
  { value: 'PONGAL', label: 'Pongal' },
  { value: 'PROGRAM', label: 'Cultural programme' },
  { value: 'SEVA', label: 'Seva and welfare' },
  { value: 'WORKSHOP', label: 'Class or workshop' },
  { value: 'GENERAL', label: 'Other' },
]
