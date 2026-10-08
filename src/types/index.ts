import type { SectorId } from '@/config'

export type { SectorId }

/** Money is always integer cents. Format only at display time. */
export type Money = number

export type Role =
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

export type DonationCategory = 'hundi' | 'pooja' | 'activity' | 'project'

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
  dedication?: Dedication
}

export type PaymentMethod = 'card' | 'apple_pay' | 'google_pay' | 'cash' | 'cheque'

export type DonationStatus =
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
  status: 'received' | 'matched' | 'variance' | 'payment_pending' | 'paid' | 'rejected'
  preparedBy: string
  approvals: ApprovalStep[]
  caComment?: string
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
}

/** Anything that can land in the unified approval inbox. */
export type ApprovalKind = 'allotment' | 'purchase_order' | 'payment' | 'refund' | 'inventory_request'

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
}
