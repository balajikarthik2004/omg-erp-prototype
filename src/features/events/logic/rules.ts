import { formatMoney } from '@/lib/format'
import type { EventBudgetLine, EventOrder, EventRecord, EventStatus, EventsData, User } from '@/types'
import { isAdmin, isCA, transition, type EventAction } from './stateMachine'

/** Statuses in which money can be committed and income recorded: after money is set aside, before close. */
export const SPEND_STATES: EventStatus[] = ['confirmed', 'poster_pending', 'published', 'live', 'completed']
/** Statuses in which the public registration page is open. */
export const REGISTRATION_STATES: EventStatus[] = ['published', 'live']

export interface EventStep {
  id: string
  label: string
  hint: string
  who: string
  gate?: string
}

/** The six steps of the Events flow, in order. */
export const EVENT_STEPS: EventStep[] = [
  { id: 'create', label: 'Create', hint: 'Name, date, venue, guest, capacity', who: 'Sector admin' },
  { id: 'budget', label: 'Set budget', hint: 'Cost lines, pre-filled from past years', who: 'Sector admin', gate: 'CA + Trustees approve' },
  { id: 'confirm', label: 'Confirm', hint: 'Date, venue, guest fixed; money set aside', who: 'Sector admin' },
  { id: 'poster', label: 'Make poster', hint: 'Three designs; exact text, logo and QR', who: 'Sector admin', gate: 'Admin approves' },
  { id: 'run', label: 'Run event', hint: 'Tickets, sponsors, orders, check-in', who: 'Admin, store and CA', gate: 'CA approves orders' },
  { id: 'close', label: 'Close', hint: 'Spent vs budget, profit or loss', who: 'CA team' },
]

/** Zero-based index of the step the event is on. 6 means every step is done. */
export function stepIndex(status: EventStatus): number {
  switch (status) {
    case 'draft':
    case 'budget_submitted':
    case 'budget_ca_ok':
      return 1
    case 'budget_approved':
      return 2
    case 'confirmed':
    case 'poster_pending':
      return 3
    case 'published':
    case 'live':
      return 4
    case 'completed':
      return 5
    case 'closed':
      return 6
    case 'cancelled':
      return -1
  }
}

/** Why this person cannot take this action on this event, or null when they can. Dry-runs the state machine. */
export function gateBlock(event: EventRecord, action: EventAction, user: User): string | null {
  const result = transition(event, action, user)
  return result.success ? null : (result.error ?? 'Not allowed.')
}

/* ---------------------------------------------------------------- orders */

export const lineLimit = (line: EventBudgetLine) => line.approvedAmount ?? line.requestedAmount

/** Money already promised against a line: every order that is not rejected or cancelled. */
export function committedOnLine(orders: EventOrder[], lineId: string, excludeOrderId?: string): number {
  return orders
    .filter((o) => o.budgetLineId === lineId && o.id !== excludeOrderId && o.status !== 'rejected' && o.status !== 'cancelled')
    .reduce((sum, o) => sum + o.amount, 0)
}

export function overrunMessage(line: EventBudgetLine, committed: number, amount: number): string {
  return `${formatMoney(amount)} is more than is left on ${line.category} (limit ${formatMoney(lineLimit(line))}, already committed ${formatMoney(committed)}). Raise a budget revision instead.`
}

export function orderRaiseBlock(user: User, event: EventRecord): string | null {
  if (!isAdmin(user)) return 'Only a Sector Admin can raise an event order.'
  if (!SPEND_STATES.includes(event.status)) return 'Orders open once the event is confirmed and close when it is closed.'
  return null
}

export function orderDecideBlock(user: User, order: EventOrder): string | null {
  if (!isCA(user)) return 'Only the CA team approves event orders.'
  if (order.preparedBy === user.id) return 'You raised this order. Another approver must review it.'
  return null
}

export function orderPayBlock(user: User, order: EventOrder): string | null {
  if (!isCA(user)) return 'Only the CA team pays an order.'
  if (order.decidedBy === user.id) return 'You approved this order. A different person must pay it.'
  return null
}

export function checkInBlock(user: User): string | null {
  return isAdmin(user) || user.role === 'store_keeper' ? null : 'Check-in is done by a sector admin or a volunteer from the store team.'
}

export function recordBlock(user: User): string | null {
  return isAdmin(user) ? null : 'Only a Sector Admin records sponsors and event donations.'
}

export function seatsTaken(data: Pick<EventsData, 'eventRegistrations'>, eventId: string): number {
  return data.eventRegistrations
    .filter((r) => r.eventId === eventId && r.status === 'active')
    .reduce((sum, r) => sum + r.qty, 0)
}
