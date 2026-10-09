import { format } from 'date-fns'

import type { CashCount, InventoryRequest, PeriodClose, Role, SquarePayout, SupplierInvoice, User } from '@/types'
import type { DbState } from './db'

/**
 * Pure rule checks for the flow-alignment features: counter cash, period close,
 * payment release and store-request approval. Each returns the message the UI
 * shows when the action is not allowed, or null when it is.
 */

export const CASH_COUNTER_ROLES: Role[] = ['store_keeper', 'sector_admin', 'ca_staff']
export const CASH_CONFIRM_ROLES: Role[] = ['sector_admin', 'ca_staff', 'ca_partner', 'trustee']
export const RELEASE_ROLES: Role[] = ['ca_staff', 'ca_partner']
export const PERIOD_PREPARE_ROLES: Role[] = ['ca_staff', 'ca_partner']

function roleName(role: string): string {
  return role.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
}

/* ---------------------------------------------------------------- periods */

export function periodOf(iso: string): string {
  return format(new Date(iso), 'yyyy-MM')
}

export function periodLabel(period: string): string {
  return format(new Date(`${period}-01T12:00:00`), 'MMMM yyyy')
}

/** Anything posted into a closed month is refused. Corrections go in the next open one. */
export function closedPeriodError(periods: PeriodClose[], iso: string): string | null {
  const key = periodOf(iso)
  const closed = periods.find((p) => p.period === key && p.status === 'closed')
  return closed
    ? `${periodLabel(key)} is closed by the CA. A CA Partner must reopen it before anything is posted to it.`
    : null
}

export interface PeriodCheck {
  id: string
  label: string
  detail: string
  /** A blocking check stops the close until it is cleared. */
  blocking: boolean
  ok: boolean
}

export function periodChecks(db: DbState, period: string): PeriodCheck[] {
  const inPeriod = (iso: string) => periodOf(iso) === period

  const openPayouts = db.payouts.filter((p) => inPeriod(p.date) && p.status !== 'matched')
  const awaitingWebhook = db.donations.filter((d) => inPeriod(d.createdAt) && d.status === 'pending')
  const uncountedCash = db.cashCounts.filter((c) => inPeriod(c.countedAt) && c.status === 'pending')
  const waitingApprovals =
    db.allotments.filter((a) => (a.status === 'pending' || a.status === 'escalated') && inPeriod(a.preparedAt)).length +
    db.purchaseOrders.filter((p) => p.status === 'pending_ca' && inPeriod(p.createdAt)).length +
    db.inventoryRequests.filter((r) => (r.status === 'pending' || r.status === 'escalated') && inPeriod(r.requestedAt)).length
  const unreleased = db.invoices.filter((i) => i.status === 'approved' && inPeriod(i.date))

  const now = format(new Date(), 'yyyy-MM')

  return [
    {
      id: 'payouts',
      label: 'Square payouts reconciled',
      detail:
        openPayouts.length === 0
          ? 'Every payout in the month ties to the bank and the ledger.'
          : `${openPayouts.length} payout${openPayouts.length === 1 ? '' : 's'} still need reconciling.`,
      blocking: true,
      ok: openPayouts.length === 0,
    },
    {
      id: 'webhooks',
      label: 'No payments waiting for a webhook',
      detail:
        awaitingWebhook.length === 0
          ? 'Every card payment was confirmed by Square.'
          : `${awaitingWebhook.length} payment${awaitingWebhook.length === 1 ? ' is' : 's are'} not yet confirmed as Paid.`,
      blocking: true,
      ok: awaitingWebhook.length === 0,
    },
    {
      id: 'cash',
      label: 'Counter cash counted by two people',
      detail:
        uncountedCash.length === 0
          ? 'No cash counts are waiting for a second person.'
          : `${uncountedCash.length} cash count${uncountedCash.length === 1 ? ' is' : 's are'} waiting for confirmation.`,
      blocking: true,
      ok: uncountedCash.length === 0,
    },
    {
      id: 'release',
      label: 'Approved payments released',
      detail:
        unreleased.length === 0
          ? 'No approved supplier payments are waiting to be released.'
          : `${unreleased.length} approved payment${unreleased.length === 1 ? ' is' : 's are'} not yet released.`,
      blocking: false,
      ok: unreleased.length === 0,
    },
    {
      id: 'approvals',
      label: 'Approvals cleared',
      detail:
        waitingApprovals === 0
          ? 'Nothing prepared this month is still waiting for a signature.'
          : `${waitingApprovals} item${waitingApprovals === 1 ? '' : 's'} prepared this month still wait for a signature. They will carry into the next period.`,
      blocking: false,
      ok: waitingApprovals === 0,
    },
    {
      id: 'monthend',
      label: 'Month has ended',
      detail:
        period >= now
          ? 'This month is still running. Closing early locks it against late entries.'
          : 'The month has ended.',
      blocking: false,
      ok: period < now,
    },
  ]
}

/** Months close in order. An earlier open month blocks a later one. */
export function periodSequenceError(periods: PeriodClose[], period: string): string | null {
  const earlier = periods.filter((p) => p.period < period && p.status !== 'closed').sort((a, b) => a.period.localeCompare(b.period))
  const first = earlier[0]
  return first ? `Close ${periodLabel(first.period)} first. Months are closed in order.` : null
}

export function periodPrepareBlock(actor: User): string | null {
  return PERIOD_PREPARE_ROLES.includes(actor.role) ? null : 'Only the CA team can prepare a period close.'
}

export function periodApproveBlock(actor: User, period: PeriodClose): string | null {
  if (actor.id === period.preparedBy) return 'You prepared this close. Another approver must review it.'
  if (actor.role !== 'ca_partner') return `Closing the books needs the CA Partner. You are signed in as ${roleName(actor.role)}.`
  return null
}

/* ---------------------------------------------------------- counter cash */

export function cashCountBlock(actor: User): string | null {
  return CASH_COUNTER_ROLES.includes(actor.role)
    ? null
    : `${roleName(actor.role)} cannot count counter cash. Ask the store keeper or sector admin.`
}

export function cashConfirmBlock(actor: User, count: CashCount): string | null {
  if (actor.id === count.countedBy) return 'You counted this cash. A second person must confirm the count.'
  if (!CASH_CONFIRM_ROLES.includes(actor.role)) {
    return `${roleName(actor.role)} cannot confirm a cash count. It needs a sector admin or the CA team.`
  }
  return null
}

/* ------------------------------------------------------ store requests */

export function inventoryApprovalBlock(actor: User, request: InventoryRequest): string | null {
  if (actor.id === request.requestedBy) return 'You prepared this. Another approver must review it.'
  if (actor.role !== 'sector_admin') {
    return `A store request is approved by the Sector Admin. You are signed in as ${roleName(actor.role)}.`
  }
  return null
}

/* ------------------------------------------------------------ release */

/** Approved is not paid. A different person releases the money. */
export function releaseBlock(actor: User, invoice: SupplierInvoice): string | null {
  if (!RELEASE_ROLES.includes(actor.role)) {
    return `Only the CA team can release a payment. You are signed in as ${roleName(actor.role)}.`
  }
  if (actor.id === invoice.preparedBy) return 'You prepared this. Another person must release it.'
  if (invoice.approvals.some((a) => a.userId === actor.id)) {
    return 'You approved this payment. A different person must release it.'
  }
  return null
}

/* ------------------------------------------------------ reconciliation */

export interface PayoutVariance {
  /** Bank credit minus the Square net. Negative means the bank is short. */
  bank: number
  /** Ledger total minus the Square net. Negative means the ledger is missing money. */
  ledger: number
  tied: boolean
}

export function payoutVariance(payout: SquarePayout): PayoutVariance {
  const bank = (payout.bankCredit ?? payout.net) - payout.net
  const ledger = (payout.ledgerNet ?? payout.net) - payout.net
  return { bank, ledger, tied: bank === 0 && ledger === 0 }
}
