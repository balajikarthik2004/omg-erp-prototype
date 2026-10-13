import type { Money, SectorId } from './index'

/**
 * Events module domain types. Ported from the OMG Events service and kept
 * name-for-name where possible, so the real backend can reuse them. Money is
 * integer cents like everywhere else in the app.
 */

export type EventStatus =
  | 'draft'
  | 'budget_submitted'
  | 'budget_ca_ok'
  | 'budget_approved'
  | 'confirmed'
  | 'poster_pending'
  | 'published'
  | 'live'
  | 'completed'
  | 'closed'
  | 'cancelled'

export type PosterStatus = 'none' | 'pending' | 'published' | 'stale'

export interface ClosurePnl {
  ticketIncome: Money
  sponsorIncome: Money
  donationIncome: Money
  expenses: Money
  net: Money
}

export interface EventRecord {
  id: string
  sectorId: SectorId
  /** NAVARATRI, PROGRAM, SEVA… Drives the budget history lookup. */
  eventType: string
  name: string
  startAt: string
  endAt: string
  venue: string
  chiefGuest?: string
  contactName: string
  contactPhone: string
  capacity?: number
  isPaid: boolean
  ticketPrice?: Money
  ticketTaxNote?: string
  status: EventStatus
  posterStatus: PosterStatus
  /** Created at confirm. The money itself lives in the ledger as a normal fund. */
  fundId?: string
  createdBy: string
  createdAt: string
  updatedAt: string
  /** Whoever last prepared a gate (submitted the budget, picked the poster). Never allowed to approve it. */
  lastPreparerId?: string
  selectedPosterDesignId?: string
  cancelReason?: string
  closurePnl?: ClosurePnl
  tenantId?: string
}

export interface HistoryPoint {
  year: number
  actual: Money
}

export interface EventBudgetLine {
  id: string
  eventId: string
  category: string
  history?: HistoryPoint[]
  suggestedAmount?: Money
  suggestionNote?: string
  requestedAmount: Money
  approvedAmount?: Money
}

export type EventApprovalType = 'event_budget' | 'event_poster'
export type EventApprovalDecision = 'approved' | 'rejected'

export interface EventApproval {
  id: string
  entityType: EventApprovalType
  entityId: string
  /** 1 = CA review, 2 = Trustee (budget); 1 = second admin (poster). */
  step: number
  requiredRole: 'ca' | 'trustee' | 'sector_admin'
  preparedBy: string
  decidedBy?: string
  decision?: EventApprovalDecision
  comment?: string
  createdAt: string
  decidedAt?: string
}

export type PosterVariant = 'traditional' | 'modern' | 'festive'
export type ImageProviderType = 'cloudflare' | 'pollinations' | 'gemini' | 'template'

export interface PosterDesign {
  id: string
  eventId: string
  batchNo: number
  variant: PosterVariant
  provider: ImageProviderType
  prompt: string
  seed: number
  /** The exact words printed, frozen so we can later show what went out. */
  textSnapshot: {
    eventName: string
    startAt: string
    endAt: string
    venue: string
    chiefGuest?: string
    ticketPrice?: Money
    contact: string
  }
  createdBy: string
  createdAt: string
}

export interface EventRegistration {
  id: string
  eventId: string
  name: string
  phone: string
  email?: string
  qty: number
  amountPaid: Money
  paymentRef?: string
  ticketToken: string
  checkedInAt?: string
  status: 'active' | 'cancelled' | 'refunded'
  createdAt: string
}

export interface EventSponsor {
  id: string
  eventId: string
  sponsorName: string
  kind: 'cash' | 'in_kind'
  amount: Money
  description?: string
  receiptNo: string
  receivedAt: string
}

export interface EventDonation {
  id: string
  eventId: string
  donorName: string
  amount: Money
  note?: string
  receiptNo: string
  receivedAt: string
}

export type EventOrderStatus = 'pending_ca' | 'approved' | 'paid' | 'rejected' | 'cancelled'

export interface EventOrder {
  id: string
  eventId: string
  budgetLineId: string
  vendorName: string
  itemDescription: string
  amount: Money
  status: EventOrderStatus
  preparedBy: string
  decidedBy?: string
  decidedAt?: string
  comment?: string
  paidBy?: string
  paidAt?: string
  createdAt: string
}

/** What an event type actually cost in a past year. Written at close, read by the budget formula. */
export interface CategoryActual {
  eventType: string
  year: number
  category: string
  actual: Money
}

export interface EventsData {
  events: EventRecord[]
  eventBudgetLines: EventBudgetLine[]
  eventApprovals: EventApproval[]
  eventPosters: PosterDesign[]
  eventRegistrations: EventRegistration[]
  eventSponsors: EventSponsor[]
  eventDonations: EventDonation[]
  eventOrders: EventOrder[]
  eventActuals: CategoryActual[]
}
