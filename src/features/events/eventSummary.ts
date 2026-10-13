import type { DbState } from '@/store/db'
import type { EventRecord, Money } from '@/types'
import { calculatePnl } from './logic/pnl'
import { seatsTaken } from './logic/rules'

export interface EventSummary {
  event: EventRecord
  requested: Money
  suggested: Money
  approved: Money
  committed: Money
  spent: Money
  cashIn: Money
  net: Money
  seats: number
}

/** One row per event for the cross-event pages: what was asked, approved, committed, spent and earned. */
export function summarise(db: DbState, event: EventRecord): EventSummary {
  const lines = db.eventBudgetLines.filter((l) => l.eventId === event.id)
  const pnl = calculatePnl(db, event.id)
  return {
    event,
    requested: lines.reduce((s, l) => s + l.requestedAmount, 0),
    suggested: lines.reduce((s, l) => s + (l.suggestedAmount ?? 0), 0),
    approved: lines.reduce((s, l) => s + (l.approvedAmount ?? 0), 0),
    committed: pnl.totalCommitted,
    spent: pnl.totalSpent,
    cashIn: pnl.ticketIncome + pnl.sponsorIncome + pnl.donationIncome,
    net: pnl.net,
    seats: seatsTaken(db, event.id),
  }
}
