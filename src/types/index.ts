import type { SectorId } from '@/config'

export type { SectorId }

/** Money is always integer cents. Format only at display time. */
export type Money = number

export type Role =
  | 'super_admin'
  | 'devotee'
  | 'sector_admin'
  | 'store_keeper'
  | 'procurement_officer'
  | 'ca_staff'
  | 'ca_partner'
  | 'trustee'

export interface User {
  id: string
  name: string
  role: Role
  email: string
  sectorIds: SectorId[]
}

export interface Donor {
  id: string
  name: string
  email: string
  phone: string
  city: string
  anonymous: boolean
  since: string
}

export type DonationCategory = 'hundi' | 'pooja' | 'event' | 'membership' | 'activity' | 'project'

export interface Dedication {
  name: string
  nakshatra?: string
  gothram?: string
  date?: string
}

export interface DonationLine {
  itemId: string
  category: DonationCategory
  amount: Money
  /** Tickets for an event, otherwise 1. */
  quantity?: number
  /** Membership renewal plan chosen at checkout. */
  recurring?: 'monthly' | 'annual'
  dedication?: Dedication
}

export type PaymentMethod = 'card' | 'apple_pay' | 'google_pay' | 'cash' | 'cheque'

export type DonationStatus =
  | 'pending'
  | 'paid'
  | 'receipted'
  | 'reconciled'
  | 'allotted'
  | 'refunded'
  | 'failed'

export interface Donation {
  id: string
  receiptNo: string
  sectorId: SectorId
  donorId: string
  lines: DonationLine[]
  gross: Money
  fee: Money
  net: Money
  method: PaymentMethod
  status: DonationStatus
  createdAt: string
  squarePaymentId?: string
  disputed?: boolean
  fundId: string
  tenantId?: string
  /** When the verified Square webhook confirmed the payment. */
  webhookAt?: string
  /** Set for counter cash that passed the 2-person count. */
  cashCountId?: string
}

export interface CatalogItem {
  id: string
  sectorId: SectorId
  category: DonationCategory
  name: string
  tamil?: string
  description: string
  /** null means "any amount". */
  price: Money | null
  presets?: Money[]
  needsDedication?: boolean
  needsDate?: boolean
  projectId?: string
  fundId: string
  active: boolean
  popular?: boolean
  /** Membership renewal cadence. */
  recurring?: 'monthly' | 'annual'
  /** Event with tickets (quantity picker). */
  ticketed?: boolean
}

export interface Project {
  id: string
  sectorId: SectorId
  name: string
  summary: string
  goal: Money
  raised: Money
  fundId: string
  startedAt: string
}

export type FundType = 'unrestricted' | 'restricted' | 'corpus'

export interface Fund {
  id: string
  sectorId: SectorId
  name: string
  type: FundType
  projectId?: string
  balance: Money
}

export interface JournalLine {
  account: string
  fundId: string
  debit: Money
  credit: Money
}

export interface JournalEntry {
  id: string
  date: string
  sectorId: SectorId
  memo: string
  lines: JournalLine[]
  sourceRef: string
  reversalOf?: string
  tenantId?: string
}

export interface BudgetHead {
  id: string
  sectorId: SectorId
  name: string
  period: string
  fundId: string
  allocated: Money
  committed: Money
  spent: Money
  projectId?: string
}

export type ApprovalStatus = 'draft' | 'pending' | 'approved' | 'rejected' | 'escalated'

export interface ApprovalStep {
  role: string
  userId?: string
  decision?: 'approved' | 'rejected'
  at?: string
  comment?: string
}

export interface Allotment {
  id: string
  sectorId: SectorId
  fromFundId: string
  toBudgetHeadId: string
  amount: Money
  reason: string
  preparedBy: string
  preparedAt: string
  status: ApprovalStatus
  approvals: ApprovalStep[]
  tenantId?: string
  escalatedAt?: string
}

export interface InventoryItem {
  id: string
  sectorId: SectorId
  name: string
  unit: string
  stock: number
  reorderLevel: number
  category: string
  lastUnitPrice: Money
}

export interface InventoryRequest {
  id: string
  sectorId: SectorId
  itemId: string
  qty: number
  neededBy: string
  requestedBy: string
  requestedAt: string
  status: ApprovalStatus
  note?: string
  /** PO raised from this request, if any. */
  poId?: string
  escalatedAt?: string
}

export interface SupplierPricePoint {
  itemId: string
  date: string
  unitPrice: Money
}

export interface Supplier {
  id: string
  name: string
  city: string
  items: string[]
  rating: number
  onTimePct: number
  rejectionPct: number
  status: 'active' | 'blocked'
  orderCount: number
  since: string
  note: string
  priceHistory: SupplierPricePoint[]
}

export type POStatus =
  | 'draft'
  | 'pending_ca'
  | 'approved'
  | 'sent'
  | 'partially_received'
  | 'received'
  | 'invoiced'
  | 'payment_pending'
  | 'paid'
  | 'closed'
  | 'rejected'
  | 'cancelled'

export interface POLine {
  itemId: string
  qty: number
  unitPrice: Money
}

export interface TimelineEvent {
  at: string
  by: string
  action: string
  note?: string
}

export interface PurchaseOrder {
  id: string
  poNo: string
  sectorId: SectorId
  supplierId: string
  budgetHeadId: string
  lines: POLine[]
  total: Money
  status: POStatus
  aiRank?: number
  overrideReason?: string
  timeline: TimelineEvent[]
  createdAt: string
  preparedBy: string
  approvals: ApprovalStep[]
  requestId?: string
  expectedBy: string
  tenantId?: string
}

export interface GoodsReceipt {
  id: string
  grnNo: string
  poId: string
  receivedAt: string
  receivedBy: string
  lines: { itemId: string; qtyReceived: number }[]
  note?: string
}

export interface SupplierInvoice {
  id: string
  invoiceNo: string
  poId: string
  supplierId: string
  sectorId: SectorId
  date: string
  dueDate: string
  lines: POLine[]
  total: Money
  status: 'received' | 'matched' | 'variance' | 'payment_pending' | 'approved' | 'paid' | 'rejected'
  preparedBy: string
  approvals: ApprovalStep[]
  caComment?: string
  /** Releasing the money is a separate act after approval. */
  releasedBy?: string
  releasedAt?: string
  tenantId?: string
}

export interface SquarePayout {
  id: string
  payoutRef: string
  date: string
  gross: Money
  fee: Money
  net: Money
  donationIds: string[]
  status: 'matched' | 'unmatched' | 'partial'
  note?: string
  /** Reason a CA gave for accepting a difference. */
  resolution?: string
  /** What the ledger recorded for the donations in this payout. */
  ledgerNet?: Money
  /** What the bank statement shows for this payout. */
  bankCredit?: Money
  bankRef?: string
  bankDate?: string
}

export interface AuditEvent {
  id: string
  at: string
  userId: string
  userName: string
  role: Role
  action: string
  entity: string
  entityId: string
  sectorId?: SectorId
  before?: string
  after?: string
  tenantId?: string
}

/** Anything that can land in the unified approval inbox. */
export type ApprovalKind =
  | 'allotment'
  | 'purchase_order'
  | 'payment'
  | 'payment_release'
  | 'refund'
  | 'inventory_request'
  | 'cash_count'
  | 'period_close'

export interface ApprovalTask {
  kind: ApprovalKind
  id: string
  title: string
  subtitle: string
  sectorId: SectorId
  amount: Money
  preparedBy: string
  preparedAt: string
  dueAt: string
  href: string
  escalated?: boolean
}

/* ------------------------------------------------- counter cash (2-person) */

export interface CashCount {
  id: string
  sectorId: SectorId
  itemId: string
  amount: Money
  note?: string
  countedBy: string
  countedAt: string
  confirmedBy?: string
  confirmedAt?: string
  status: 'pending' | 'confirmed' | 'rejected'
  donationId?: string
}

/* ------------------------------------------------------------ period close */

export interface PeriodClose {
  id: string
  /** yyyy-MM */
  period: string
  status: 'open' | 'pending' | 'closed'
  preparedBy?: string
  preparedAt?: string
  closedBy?: string
  closedAt?: string
  note?: string
}

/* ------------------------------------------------------------------ tenant */

export type ModuleKey =
  | 'donations'
  | 'reconciliation'
  | 'budgets'
  | 'inventory'
  | 'procurement'
  | 'payments'
  | 'reports'

export interface TenantUser {
  id: string
  name: string
  email: string
  role: Role
}

export interface Tenant {
  id: string
  name: string
  address: string
  domain: string
  /** A colour family from the theme, never a hex value. */
  brand: 'kumkum' | 'tulsi' | 'peacock' | 'turmeric'
  logoText: string
  verticals: SectorId[]
  modules: ModuleKey[]
  squareLocationId: string
  /** Approval matrix, in cents: staff up to staffMax, partner up to partnerMax, above needs Trustee too. */
  thresholds: { staffMax: Money; partnerMax: Money }
  users: TenantUser[]
  catalogLoaded: boolean
  status: 'draft' | 'live'
  createdAt: string
}

