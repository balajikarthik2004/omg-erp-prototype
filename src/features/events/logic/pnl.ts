import type { EventsData, Money } from '@/types'
import { committedOnLine, lineLimit } from './rules'

export interface LinePnl {
  lineId: string
  category: string
  budget: Money
  committed: Money
  spent: Money
  variance: Money
}

export interface EventPnl {
  eventId: string
  totalBudget: Money
  totalCommitted: Money
  totalSpent: Money
  budgetVariance: Money
  lines: LinePnl[]
  ticketIncome: Money
  sponsorIncome: Money
  inKindSponsorValue: Money
  donationIncome: Money
  expenses: Money
  /** Cash in minus cash out. In-kind sponsorship is shown separately, never counted as cash. */
  net: Money
}

/** Live profit and loss: (tickets + cash sponsors + event donations) minus paid expenses. */
export function calculatePnl(data: EventsData, eventId: string): EventPnl {
  const orders = data.eventOrders.filter((o) => o.eventId === eventId)
  const paid = orders.filter((o) => o.status === 'paid')

  const ticketIncome = data.eventRegistrations
    .filter((r) => r.eventId === eventId && r.status === 'active')
    .reduce((s, r) => s + r.amountPaid, 0)
  const sponsors = data.eventSponsors.filter((s) => s.eventId === eventId)
  const sponsorIncome = sponsors.filter((s) => s.kind === 'cash').reduce((s, x) => s + x.amount, 0)
  const inKindSponsorValue = sponsors.filter((s) => s.kind === 'in_kind').reduce((s, x) => s + x.amount, 0)
  const donationIncome = data.eventDonations.filter((d) => d.eventId === eventId).reduce((s, d) => s + d.amount, 0)
  const expenses = paid.reduce((s, o) => s + o.amount, 0)

  const lines: LinePnl[] = data.eventBudgetLines
    .filter((l) => l.eventId === eventId)
    .map((l) => {
      const spent = paid.filter((o) => o.budgetLineId === l.id).reduce((s, o) => s + o.amount, 0)
      return {
        lineId: l.id,
        category: l.category,
        budget: lineLimit(l),
        committed: committedOnLine(orders, l.id),
        spent,
        variance: lineLimit(l) - spent,
      }
    })

  const totalBudget = lines.reduce((s, l) => s + l.budget, 0)
  return {
    eventId,
    totalBudget,
    totalCommitted: lines.reduce((s, l) => s + l.committed, 0),
    totalSpent: expenses,
    budgetVariance: totalBudget - expenses,
    lines,
    ticketIncome,
    sponsorIncome,
    inKindSponsorValue,
    donationIncome,
    expenses,
    net: ticketIncome + sponsorIncome + donationIncome - expenses,
  }
}
