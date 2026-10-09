import { create } from 'zustand'

import { format } from 'date-fns'

import { APP, applyThresholds, MATCH_TOLERANCE, OVERRIDE_REASON_MIN, requiredApprovals } from '@/config'
import { formatMoney } from '@/lib/format'
import { toast } from '@/lib/toast'
import { api, loadDatabase, type Database } from '@/mock/api'
import { DEMO_TENANT_ID } from '@/mock/generators'
import { BUDGET_SPECS, CATALOG, FUNDS, INVENTORY, PROJECTS, userById, userName } from '@/mock/seed'
import {
  cashConfirmBlock,
  cashCountBlock,
  closedPeriodError,
  inventoryApprovalBlock,
  payoutVariance,
  periodApproveBlock,
  periodChecks,
  periodLabel,
  periodPrepareBlock,
  periodSequenceError,
  releaseBlock,
} from './rules'
import type {
  Allotment,
  ApprovalKind,
  ApprovalStep,
  AuditEvent,
  BudgetHead,
  CashCount,
  Donation,
  DonationLine,
  Donor,
  Fund,
  GoodsReceipt,
  InventoryRequest,
  JournalEntry,
  PaymentMethod,
  POLine,
  PurchaseOrder,
  Role,
  SectorId,
  SupplierInvoice,
  Tenant,
  User,
} from '@/types'
import type { CartLine } from './session'

const EMPTY_DATA = {
  donors: [], donations: [], funds: [], projects: [], journal: [], budgets: [], allotments: [],
  inventory: [], inventoryRequests: [], suppliers: [], purchaseOrders: [], goodsReceipts: [],
  invoices: [], payouts: [], audit: [], cashCounts: [], periodCloses: [],
} satisfies Omit<Database, 'tenants'>

const EMPTY: Database = { ...EMPTY_DATA, tenants: [] }

export interface DbState extends Database {
  ready: boolean
  loading: boolean
  /** The customer whose books are on screen. */
  activeTenantId: string
  /** Other customers' books, parked while one is active. */
  vault: Record<string, Omit<Database, 'tenants'>>

  load: () => Promise<void>

  /* collect */
  recordDonation: (input: {
    lines: CartLine[]
    method: PaymentMethod
    donorName: string
    actor: User
  }) => Donation
  confirmDonationPayment: (id: string, actor: User) => void
  issueReceipt: (id: string, actor: User) => void
  createCashCount: (input: {
    sectorId: SectorId
    itemId: string
    amount: number
    note?: string
    actor: User
  }) => { ok: boolean; error?: string }
  decideCashCount: (id: string, decision: 'approved' | 'rejected', actor: User, comment?: string) => void

  /* control */
  createAllotment: (input: {
    fromFundId: string
    toBudgetHeadId: string
    amount: number
    reason: string
    actor: User
  }) => { ok: boolean; error?: string }
  decideAllotment: (id: string, decision: 'approved' | 'rejected', actor: User, comment?: string) => void
  matchPayout: (payoutId: string, actor: User, resolution?: string) => void
  preparePeriodClose: (period: string, actor: User, note?: string) => { ok: boolean; error?: string }
  decidePeriodClose: (period: string, decision: 'approved' | 'rejected', actor: User, comment?: string) => void
  reopenPeriod: (period: string, actor: User, reason: string) => { ok: boolean; error?: string }
  escalateTask: (kind: ApprovalKind, id: string, actor: User) => void

  /* spend */
  createInventoryRequest: (input: {
    itemId: string
    qty: number
    neededBy: string
    note?: string
    actor: User
  }) => void
  decideInventoryRequest: (id: string, decision: 'approved' | 'rejected', actor: User) => void

  createPurchaseOrder: (input: {
    supplierId: string
    sectorId: SectorId
    budgetHeadId: string
    lines: POLine[]
    aiRank: number
    overrideReason?: string
    requestId?: string
    expectedBy: string
    actor: User
  }) => { ok: boolean; error?: string; poNo?: string }
  decidePurchaseOrder: (id: string, decision: 'approved' | 'rejected', actor: User, comment?: string) => void
  sendPurchaseOrder: (id: string, actor: User) => void
  cancelPurchaseOrder: (id: string, actor: User, reason: string) => void
  receiveGoods: (poId: string, lines: { itemId: string; qtyReceived: number }[], actor: User, note?: string) => void
  recordInvoice: (poId: string, lines: POLine[], invoiceNo: string, actor: User) => void
  addCaComment: (invoiceId: string, comment: string, actor: User) => void
  decidePayment: (invoiceId: string, decision: 'approved' | 'rejected', actor: User, comment?: string) => void
  releasePayment: (invoiceId: string, actor: User) => void

  /* onboarding */
  onboardTenant: (
    input: Omit<Tenant, 'id' | 'createdAt' | 'status' | 'catalogLoaded'>,
    actor: User,
  ) => { ok: boolean; error?: string; tenantId?: string }
  switchTenant: (id: string) => void
}

/* --------------------------------------------------------------- helpers */

let auditSeq = 90_000

function audit(
  actor: User,
  action: string,
  entity: string,
  entityId: string,
  extra?: { sectorId?: SectorId; before?: string; after?: string },
): AuditEvent {
  auditSeq += 1
  return {
    id: `aud-${auditSeq}`,
    at: new Date().toISOString(),
    userId: actor.id,
    userName: actor.name,
    role: actor.role,
    action,
    entity,
    entityId,
    sectorId: extra?.sectorId,
    before: extra?.before,
    after: extra?.after,
    tenantId: useDb.getState().activeTenantId,
  }
}

function journalEntry(
  id: string,
  date: string,
  sectorId: SectorId,
  memo: string,
  lines: JournalEntry['lines'],
  sourceRef: string,
): JournalEntry {
  return { id, date, sectorId, memo, lines, sourceRef, tenantId: useDb.getState().activeTenantId }
}


const SECTOR_CODE: Record<SectorId, string> = { temple: 'TMP', sevalaya: 'SEV', sangam: 'SGM' }

/** Four-eyes needs every approver role filled before a customer can go live. */
const REQUIRED_TENANT_ROLES: Role[] = ['sector_admin', 'ca_staff', 'ca_partner', 'trustee']

export type TenantData = Omit<Database, 'tenants'>

function pickTenantData(s: DbState): TenantData {
  return {
    donors: s.donors, donations: s.donations, funds: s.funds, projects: s.projects, journal: s.journal,
    budgets: s.budgets, allotments: s.allotments, inventory: s.inventory, inventoryRequests: s.inventoryRequests,
    suppliers: s.suppliers, purchaseOrders: s.purchaseOrders, goodsReceipts: s.goodsReceipts, invoices: s.invoices,
    payouts: s.payouts, audit: s.audit, cashCounts: s.cashCounts, periodCloses: s.periodCloses,
  }
}

/** Template load for a new customer: their verticals' funds, budget heads, stock and the supplier master, all at zero. */
function buildTenantData(tenant: Tenant): TenantData {
  const year = new Date().getFullYear()
  const now = new Date()
  const key = (d: Date) => format(d, 'yyyy-MM')
  const prev = new Date(now.getFullYear(), now.getMonth() - 1, 1)
  return {
    ...EMPTY_DATA,
    funds: FUNDS.filter((f) => tenant.verticals.includes(f.sectorId)).map((f) => ({ ...f, balance: 0 })),
    projects: PROJECTS.filter((p) => tenant.verticals.includes(p.sectorId)).map((p) => ({ ...p, raised: 0 })),
    budgets: BUDGET_SPECS.filter((b) => tenant.verticals.includes(b.sectorId)).map((b) => ({
      id: b.id, sectorId: b.sectorId, name: b.name, period: `FY ${year}`, fundId: b.fundId,
      allocated: 0, committed: 0, spent: 0, projectId: b.projectId,
    })),
    inventory: INVENTORY.filter((i) => tenant.verticals.includes(i.sectorId)).map((i) => ({ ...i, stock: 0 })),
    suppliers: loadDatabase().suppliers.filter((s) => s.status !== 'blocked'),
    periodCloses: [prev, now].map((d) => ({ id: `pc-${key(d)}`, period: key(d), status: 'open' as const })),
  }
}

function ensureDonor(donors: Donor[], id: string, name: string, anonymous: boolean): Donor[] {
  if (donors.some((d) => d.id === id)) return donors
  return [...donors, { id, name, email: '', phone: '', city: '', anonymous, since: new Date().toISOString() }]
}

function nextReceiptNo(donations: Donation[], sectorId: SectorId): string {
  const year = new Date().getFullYear()
  const seq = donations.filter((d) => d.sectorId === sectorId && d.receiptNo !== PENDING_RECEIPT).length + 2000
  return `RCP-${SECTOR_CODE[sectorId]}-${String(year).slice(2)}-${String(seq).padStart(5, '0')}`
}

/** A receipt number is only issued once the payment is Paid. Until then the donation carries this placeholder. */
export const PENDING_RECEIPT = '—'

function buildDonation(
  existing: Donation[],
  input: {
    sectorId: SectorId
    fundId: string
    method: PaymentMethod
    donorId: string
    status: Donation['status']
    lines: DonationLine[]
  },
): Donation {
  const gross = input.lines.reduce((sum, l) => sum + l.amount, 0)
  const isCardType = input.method === 'card' || input.method === 'apple_pay' || input.method === 'google_pay'
  const fee = isCardType ? cardFee(gross) : 0
  const year = new Date().getFullYear()
  return {
    id: `DN-${year}-${String(existing.length + 1).padStart(6, '0')}`,
    receiptNo: PENDING_RECEIPT,
    sectorId: input.sectorId,
    donorId: input.donorId,
    lines: input.lines,
    gross,
    fee,
    net: gross - fee,
    method: input.method,
    status: input.status,
    createdAt: new Date().toISOString(),
    squarePaymentId: isCardType ? `sqpmt_${Date.now().toString(36).toUpperCase()}` : undefined,
    fundId: input.fundId,
    tenantId: useDb.getState().activeTenantId,
  }
}

/** Fund balance, project total and journal for a donation that now has a receipt. */
function postDonation(s: DbState, donation: Donation): Pick<DbState, 'funds' | 'projects' | 'journal'> {
  const { fundId, gross, fee, net } = donation
  return {
    projects: s.projects.map((p) => (p.fundId === fundId ? { ...p, raised: p.raised + net } : p)),
    funds: s.funds.map((f) => (f.id === fundId ? { ...f, balance: f.balance + net } : f)),
    journal: [
      journalEntry(
        `je-${donation.id}`,
        new Date().toISOString(),
        donation.sectorId,
        `Donation received — ${donation.receiptNo}`,
        [
          { account: 'Bank', fundId, debit: net, credit: 0 },
          ...(fee > 0 ? [{ account: 'Payment processing fees', fundId, debit: fee, credit: 0 }] : []),
          { account: 'Donation income', fundId, debit: 0, credit: gross },
        ],
        donation.id,
      ),
      ...s.journal,
    ],
  }
}

function cardFee(gross: number): number {
  return Math.round(gross * APP.fee.percent) + APP.fee.fixedCents
}

/** available = allocated − committed − spent. Never stored. */
export function available(head: BudgetHead): number {
  return head.allocated - head.committed - head.spent
}

export function utilisation(head: BudgetHead): number {
  if (head.allocated <= 0) return 0
  return ((head.committed + head.spent) / head.allocated) * 100
}

export function budgetHealth(head: BudgetHead): 'healthy' | 'near_limit' | 'over_budget' {
  const u = utilisation(head)
  if (u > 100) return 'over_budget'
  if (u >= 85) return 'near_limit'
  return 'healthy'
}

/** Maker-checker. Returns null when this user may approve. */
export function approvalBlock(
  actor: User,
  preparedBy: string,
  amount: number,
  approvals: ApprovalStep[],
): string | null {
  if (actor.id === preparedBy) {
    return 'You prepared this. Another approver must review it.'
  }
  const needed = requiredApprovals(amount)
  const nextRole = needed.find((role) => !approvals.some((a) => a.role === role && a.decision === 'approved'))
  if (!nextRole) return 'This is already fully approved.'
  if (actor.role !== nextRole) {
    return `This step needs ${roleLabel(nextRole)}. You are signed in as ${roleLabel(actor.role)}.`
  }
  return null
}

export function roleLabel(role: string): string {
  return role.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
}

/** A restricted project fund may only be allotted to its own project head. */
export function allotmentFundError(fund: Fund | undefined, head: BudgetHead | undefined): string | null {
  if (!fund || !head) return 'Pick a fund and a budget head.'
  if (fund.sectorId !== head.sectorId) return 'The fund and the budget head belong to different sectors.'
  if (fund.projectId && head.projectId !== fund.projectId) {
    return `${fund.name} is restricted to its own project. It cannot be allotted to ${head.name}.`
  }
  if (fund.type === 'corpus') return 'Corpus funds cannot be allotted. Only income from the corpus may be spent.'
  return null
}

export interface MatchRow {
  itemId: string
  poQty: number
  poUnitPrice: number
  grnQty: number
  invQty: number
  invUnitPrice: number
  qtyVariance: number
  priceVariance: number
  flagged: boolean
}

/** 3-way match: PO vs GRN vs invoice, flagged beyond 2%. */
export function threeWayMatch(
  po: PurchaseOrder,
  grns: GoodsReceipt[],
  invoice: SupplierInvoice | undefined,
): { rows: MatchRow[]; flagged: boolean } {
  const received: Record<string, number> = {}
  for (const grn of grns) {
    for (const line of grn.lines) received[line.itemId] = (received[line.itemId] ?? 0) + line.qtyReceived
  }

  const rows: MatchRow[] = po.lines.map((line) => {
    const invLine = invoice?.lines.find((l) => l.itemId === line.itemId)
    const grnQty = received[line.itemId] ?? 0
    const invQty = invLine?.qty ?? 0
    const invUnitPrice = invLine?.unitPrice ?? 0
    const qtyVariance = line.qty === 0 ? 0 : (grnQty - line.qty) / line.qty
    const priceVariance =
      line.unitPrice === 0 || !invLine ? 0 : (invUnitPrice - line.unitPrice) / line.unitPrice
    return {
      itemId: line.itemId,
      poQty: line.qty,
      poUnitPrice: line.unitPrice,
      grnQty,
      invQty,
      invUnitPrice,
      qtyVariance,
      priceVariance,
      flagged: Math.abs(qtyVariance) > MATCH_TOLERANCE || Math.abs(priceVariance) > MATCH_TOLERANCE,
    }
  })

  return { rows, flagged: rows.some((r) => r.flagged) }
}

const PO_COMMITTED_STATUSES = ['approved', 'sent', 'partially_received', 'received', 'invoiced', 'payment_pending']

/* ----------------------------------------------------------------- store */

export const useDb = create<DbState>((set, get) => ({
  ...EMPTY,
  ready: false,
  loading: false,
  activeTenantId: DEMO_TENANT_ID,
  vault: {},

  load: async () => {
    if (get().ready || get().loading) return
    set({ loading: true })
    const data = await api.fetchAll()
    const tenant = data.tenants.find((t) => t.id === DEMO_TENANT_ID)
    if (tenant) applyThresholds(tenant.thresholds.staffMax, tenant.thresholds.partnerMax)
    set({ ...data, ready: true, loading: false, activeTenantId: DEMO_TENANT_ID, vault: {} })
  },

  /* ------------------------------------------------------------ collect */

  recordDonation: ({ lines, method, donorName, actor }) => {
    const state = get()
    const sectorId = lines[0]?.sectorId ?? 'temple'
    const first = CATALOG.find((c) => c.id === lines[0]?.itemId)
    const donation = buildDonation(state.donations, {
      sectorId,
      fundId: first?.fundId ?? 'fund-tmp-gen',
      method,
      donorId: 'dnr-live',
      status: 'pending',
      lines: lines.map((l) => ({
        itemId: l.itemId,
        category: CATALOG.find((c) => c.id === l.itemId)?.category ?? 'hundi',
        amount: l.amount,
        dedication: l.dedication,
        quantity: l.quantity,
        recurring: l.recurring,
      })),
    })

    set((s) => ({
      donors: ensureDonor(s.donors, 'dnr-live', donorName || 'You', false),
      donations: [donation, ...s.donations],
      audit: [
        audit(actor, 'Payment started, waiting for Square', 'Donation', donation.id, { sectorId, after: 'pending' }),
        ...s.audit,
      ],
    }))

    return donation
  },

  /** Step 4: the verified Square webhook is the only thing that makes a donation Paid. */
  confirmDonationPayment: (id, actor) => {
    const donation = get().donations.find((d) => d.id === id)
    if (!donation || donation.status !== 'pending') return
    const at = new Date().toISOString()
    set((s) => ({
      donations: s.donations.map((d) => (d.id === id ? { ...d, status: 'paid', webhookAt: at } : d)),
      audit: [
        audit(actor, 'Square webhook verified, payment marked Paid', 'Donation', donation.id, {
          sectorId: donation.sectorId,
          before: 'pending',
          after: 'paid',
        }),
        ...s.audit,
      ],
    }))
    toast.success('Payment confirmed', `Square confirmed ${formatMoney(donation.gross)} for ${donation.id}. It is now Paid.`)
  },

  /** Step 5: receipt number issued and the journal posted to the right fund. */
  issueReceipt: (id, actor) => {
    const donation = get().donations.find((d) => d.id === id)
    if (!donation || donation.status !== 'paid' || donation.receiptNo !== PENDING_RECEIPT) return
    const receiptNo = nextReceiptNo(get().donations, donation.sectorId)
    const receipted: Donation = { ...donation, receiptNo, status: 'receipted' }
    set((s) => ({
      donations: s.donations.map((d) => (d.id === id ? receipted : d)),
      ...postDonation(s, receipted),
      audit: [
        audit(actor, 'Receipt issued and journal posted', 'Donation', receiptNo, {
          sectorId: donation.sectorId,
          before: 'paid',
          after: 'receipted',
        }),
        ...s.audit,
      ],
    }))
  },

  createCashCount: ({ sectorId, itemId, amount, note, actor }) => {
    const block = cashCountBlock(actor)
    if (block) return { ok: false, error: block }
    const item = CATALOG.find((c) => c.id === itemId)
    if (!item || item.sectorId !== sectorId) return { ok: false, error: 'Pick an offering that belongs to this sector.' }
    if (!(amount > 0)) return { ok: false, error: 'Enter the amount you counted, above zero.' }

    const count: CashCount = {
      id: `cc-${Date.now().toString(36)}`,
      sectorId,
      itemId,
      amount,
      note: note?.trim() || undefined,
      countedBy: actor.id,
      countedAt: new Date().toISOString(),
      status: 'pending',
    }
    set((s) => ({
      cashCounts: [count, ...s.cashCounts],
      audit: [audit(actor, 'Recorded counter cash count', 'Cash count', count.id, { sectorId, after: 'pending' }), ...s.audit],
    }))
    toast.success('Count recorded', `${formatMoney(amount)} is waiting for a second person to confirm it.`)
    return { ok: true }
  },

  decideCashCount: (id, decision, actor, comment) => {
    const state = get()
    const count = state.cashCounts.find((c) => c.id === id)
    if (!count || count.status !== 'pending') return

    if (decision === 'approved') {
      const block = cashConfirmBlock(actor, count)
      if (block) {
        toast.warning('Cannot confirm', block)
        return
      }
      const at = new Date().toISOString()
      const closed = closedPeriodError(state.periodCloses, at)
      if (closed) {
        toast.danger('Period is closed', closed)
        return
      }
      const item = CATALOG.find((c) => c.id === count.itemId)
      const base = buildDonation(state.donations, {
        sectorId: count.sectorId,
        fundId: item?.fundId ?? 'fund-tmp-gen',
        method: 'cash',
        donorId: 'dnr-counter',
        status: 'receipted',
        lines: [{ itemId: count.itemId, category: item?.category ?? 'hundi', amount: count.amount }],
      })
      const donation: Donation = { ...base, receiptNo: nextReceiptNo(state.donations, count.sectorId), cashCountId: id }
      set((s) => ({
        donors: ensureDonor(s.donors, 'dnr-counter', 'Counter cash', true),
        donations: [donation, ...s.donations],
        cashCounts: s.cashCounts.map((c) =>
          c.id === id ? { ...c, status: 'confirmed', confirmedBy: actor.id, confirmedAt: at, donationId: donation.id } : c,
        ),
        ...postDonation(s, donation),
        audit: [
          audit(actor, 'Confirmed counter cash count', 'Cash count', id, { sectorId: count.sectorId, before: 'pending', after: 'confirmed' }),
          ...s.audit,
        ],
      }))
      toast.success('Cash count confirmed', `${formatMoney(count.amount)} posted to ${item?.name ?? 'the fund'} as ${donation.receiptNo}.`)
      return
    }

    set((s) => ({
      cashCounts: s.cashCounts.map((c) =>
        c.id === id
          ? { ...c, status: 'rejected', confirmedBy: actor.id, confirmedAt: new Date().toISOString(), note: comment ? `${c.note ?? ''} Rejected: ${comment}`.trim() : c.note }
          : c,
      ),
      audit: [
        audit(actor, 'Rejected counter cash count', 'Cash count', id, { sectorId: count.sectorId, before: 'pending', after: 'rejected' }),
        ...s.audit,
      ],
    }))
    toast.danger('Cash count rejected', 'The count will be redone. Nothing was posted.')
  },

  /* ------------------------------------------------------------ control */

  createAllotment: ({ fromFundId, toBudgetHeadId, amount, reason, actor }) => {
    const state = get()
    const fund = state.funds.find((f) => f.id === fromFundId)
    const head = state.budgets.find((b) => b.id === toBudgetHeadId)

    const fundError = allotmentFundError(fund, head)
    if (fundError) return { ok: false, error: fundError }
    if (amount <= 0) return { ok: false, error: 'Enter an amount above zero.' }
    if (amount > (fund?.balance ?? 0)) {
      return { ok: false, error: `${fund!.name} holds only ${formatMoney(fund!.balance)}. Reduce the amount.` }
    }
    if (reason.trim().length < 10) return { ok: false, error: 'Give a reason of at least 10 characters.' }

    const id = `alt-${Date.now().toString(36)}`
    const allotment: Allotment = {
      id,
      sectorId: head!.sectorId,
      fromFundId,
      toBudgetHeadId,
      amount,
      reason: reason.trim(),
      preparedBy: actor.id,
      preparedAt: new Date().toISOString(),
      status: 'pending',
      approvals: requiredApprovals(amount).map((role) => ({ role })),
      tenantId: state.activeTenantId,
    }

    set((s) => ({
      allotments: [allotment, ...s.allotments],
      audit: [
        audit(actor, 'Prepared fund allotment', 'Allotment', id, { sectorId: head!.sectorId, after: 'pending' }),
        ...s.audit,
      ],
    }))

    toast.success(
      'Allotment sent for approval',
      `${formatMoney(amount)} from ${fund!.name} to ${head!.name}. Waiting on ${roleLabel(allotment.approvals[0]!.role)}.`,
    )
    return { ok: true }
  },

  decideAllotment: (id, decision, actor, comment) => {
    const state = get()
    const allotment = state.allotments.find((a) => a.id === id)
    if (!allotment) return

    const block = approvalBlock(actor, allotment.preparedBy, allotment.amount, allotment.approvals)
    if (decision === 'approved' && block) {
      toast.warning('Cannot approve', block)
      return
    }

    const at = new Date().toISOString()
    const closed = decision === 'approved' ? closedPeriodError(state.periodCloses, at) : null
    if (closed) {
      toast.danger('Period is closed', closed)
      return
    }
    const approvals = allotment.approvals.map((step) =>
      step.role === actor.role && !step.decision
        ? { ...step, userId: actor.id, decision, at, comment }
        : step,
    )
    const fullyApproved = decision === 'approved' && approvals.every((s) => s.decision === 'approved')
    const nextStatus: Allotment['status'] =
      decision === 'rejected' ? 'rejected' : fullyApproved ? 'approved' : 'pending'

    const head = state.budgets.find((b) => b.id === allotment.toBudgetHeadId)

    set((s) => ({
      allotments: s.allotments.map((a) => (a.id === id ? { ...a, approvals, status: nextStatus } : a)),
      budgets: fullyApproved
        ? s.budgets.map((b) =>
            b.id === allotment.toBudgetHeadId ? { ...b, allocated: b.allocated + allotment.amount } : b,
          )
        : s.budgets,
      funds: fullyApproved
        ? s.funds.map((f) =>
            f.id === allotment.fromFundId ? { ...f, balance: f.balance - allotment.amount } : f,
          )
        : s.funds,
      journal: fullyApproved
        ? [
            journalEntry(
              `je-${id}`,
              at,
              allotment.sectorId,
              `Fund allotment — ${allotment.reason}`,
              [
                { account: 'Fund allotted', fundId: allotment.fromFundId, debit: allotment.amount, credit: 0 },
                { account: 'Budget allocation', fundId: allotment.fromFundId, debit: 0, credit: allotment.amount },
              ],
              id,
            ),
            ...s.journal,
          ]
        : s.journal,
      audit: [
        audit(actor, decision === 'approved' ? 'Approved fund allotment' : 'Rejected fund allotment', 'Allotment', id, {
          sectorId: allotment.sectorId,
          before: 'pending',
          after: nextStatus,
        }),
        ...s.audit,
      ],
    }))

    if (decision === 'rejected') {
      toast.danger('Allotment rejected', `${formatMoney(allotment.amount)} to ${head?.name ?? 'budget head'} was not approved.`)
    } else if (fullyApproved) {
      toast.success(
        'Allotment approved',
        `${formatMoney(allotment.amount)} allocated to ${head?.name ?? 'budget head'}.`,
      )
    } else {
      const next = approvals.find((s) => !s.decision)
      toast.info('Your approval is recorded', `Now waiting on ${roleLabel(next?.role ?? 'the next approver')}.`)
    }
  },

  matchPayout: (payoutId, actor, resolution) => {
    const state = get()
    const payout = state.payouts.find((p) => p.id === payoutId)
    if (!payout) return

    const closed = closedPeriodError(state.periodCloses, payout.date)
    if (closed) {
      toast.danger('Period is closed', closed)
      return
    }

    const variance = payoutVariance(payout)
    if (!variance.tied && (resolution ?? '').trim().length < 10) {
      toast.danger(
        'Does not tie out',
        'Square, the bank and the ledger disagree. Write down why (at least 10 characters) before you reconcile it.',
      )
      return
    }

    set((s) => ({
      payouts: s.payouts.map((p) =>
        p.id === payoutId
          ? { ...p, status: 'matched', note: undefined, resolution: variance.tied ? undefined : resolution?.trim() }
          : p,
      ),
      donations: s.donations.map((d) =>
        payout.donationIds.includes(d.id) && d.status !== 'refunded' && d.status !== 'failed' && d.status !== 'pending'
          ? { ...d, status: 'reconciled' }
          : d,
      ),
      audit: [
        audit(actor, 'Reconciled Square payout', 'Payout', payout.payoutRef, {
          before: payout.status,
          after: variance.tied ? 'matched' : `matched with explained difference: ${resolution?.trim()}`,
        }),
        ...s.audit,
      ],
    }))
    toast.success(
      `${payout.payoutRef} reconciled`,
      `${payout.donationIds.length} donations marked reconciled, ${formatMoney(payout.net)} net.`,
    )
  },

  preparePeriodClose: (period, actor, note) => {
    const state = get()
    const row = state.periodCloses.find((p) => p.period === period)
    if (!row || row.status !== 'open') return { ok: false, error: 'This period is not open.' }
    const roleBlock = periodPrepareBlock(actor)
    if (roleBlock) return { ok: false, error: roleBlock }
    const sequence = periodSequenceError(state.periodCloses, period)
    if (sequence) return { ok: false, error: sequence }
    const blockers = periodChecks(state, period).filter((c) => c.blocking && !c.ok)
    if (blockers.length > 0) {
      return { ok: false, error: `Clear these first: ${blockers.map((b) => b.label.toLowerCase()).join('; ')}.` }
    }

    const at = new Date().toISOString()
    set((s) => ({
      periodCloses: s.periodCloses.map((p) =>
        p.period === period ? { ...p, status: 'pending', preparedBy: actor.id, preparedAt: at, note: note?.trim() || undefined } : p,
      ),
      audit: [audit(actor, 'Prepared period close', 'Period', period, { before: 'open', after: 'pending' }), ...s.audit],
    }))
    toast.success(`${periodLabel(period)} sent for close`, 'The CA Partner must review and lock it.')
    return { ok: true }
  },

  decidePeriodClose: (period, decision, actor, comment) => {
    const state = get()
    const row = state.periodCloses.find((p) => p.period === period)
    if (!row || row.status !== 'pending') return

    if (decision === 'approved') {
      const block = periodApproveBlock(actor, row)
      if (block) {
        toast.warning('Cannot close', block)
        return
      }
      const blockers = periodChecks(state, period).filter((c) => c.blocking && !c.ok)
      if (blockers.length > 0) {
        toast.danger('Cannot close', `Something changed since this was prepared: ${blockers.map((b) => b.label.toLowerCase()).join('; ')}.`)
        return
      }
    }

    const at = new Date().toISOString()
    set((s) => ({
      periodCloses: s.periodCloses.map((p) =>
        p.period === period
          ? decision === 'approved'
            ? { ...p, status: 'closed', closedBy: actor.id, closedAt: at }
            : { ...p, status: 'open', note: comment?.trim() ? `Returned: ${comment.trim()}` : p.note }
          : p,
      ),
      audit: [
        audit(actor, decision === 'approved' ? 'Closed and locked period' : 'Returned period close', 'Period', period, {
          before: 'pending',
          after: decision === 'approved' ? 'closed' : 'open',
        }),
        ...s.audit,
      ],
    }))
    if (decision === 'approved') {
      toast.success(`${periodLabel(period)} closed`, 'The month is locked. Nothing more can be posted to it.')
    } else {
      toast.info(`${periodLabel(period)} returned`, 'The period is open again for the preparer to fix.')
    }
  },

  reopenPeriod: (period, actor, reason) => {
    const state = get()
    const row = state.periodCloses.find((p) => p.period === period)
    if (!row || row.status !== 'closed') return { ok: false, error: 'This period is not closed.' }
    if (actor.role !== 'ca_partner') return { ok: false, error: 'Only a CA Partner can reopen a closed period.' }
    if (reason.trim().length < 10) return { ok: false, error: 'Give a reason of at least 10 characters.' }
    const later = state.periodCloses.find((p) => p.period > period && p.status === 'closed')
    if (later) return { ok: false, error: `${periodLabel(later.period)} is also closed. Reopen the latest closed month first.` }

    set((s) => ({
      periodCloses: s.periodCloses.map((p) =>
        p.period === period
          ? { ...p, status: 'open', closedBy: undefined, closedAt: undefined, preparedBy: undefined, preparedAt: undefined, note: `Reopened: ${reason.trim()}` }
          : p,
      ),
      audit: [audit(actor, 'Reopened closed period', 'Period', period, { before: 'closed', after: `open (${reason.trim()})` }), ...s.audit],
    }))
    toast.warning(`${periodLabel(period)} reopened`, 'This is recorded in the audit log.')
    return { ok: true }
  },

  escalateTask: (kind, id, actor) => {
    const at = new Date().toISOString()
    if (kind === 'allotment') {
      const a = get().allotments.find((x) => x.id === id)
      if (!a || a.status !== 'pending') return
      set((s) => ({
        allotments: s.allotments.map((x) => (x.id === id ? { ...x, status: 'escalated', escalatedAt: at } : x)),
        audit: [audit(actor, 'Escalated overdue allotment to the Trustee', 'Allotment', id, { sectorId: a.sectorId, before: 'pending', after: 'escalated' }), ...s.audit],
      }))
    } else if (kind === 'inventory_request') {
      const r = get().inventoryRequests.find((x) => x.id === id)
      if (!r || r.status !== 'pending') return
      set((s) => ({
        inventoryRequests: s.inventoryRequests.map((x) => (x.id === id ? { ...x, status: 'escalated', escalatedAt: at } : x)),
        audit: [audit(actor, 'Escalated overdue store request to the Trustee', 'Inventory request', id, { sectorId: r.sectorId, before: 'pending', after: 'escalated' }), ...s.audit],
      }))
    } else {
      toast.info('Not escalated', 'Only allotments and store requests can be escalated.')
      return
    }
    toast.warning('Escalated', 'The Trustee has been notified. The item stays in the inbox, marked escalated.')
  },

  /* -------------------------------------------------------------- spend */

  createInventoryRequest: ({ itemId, qty, neededBy, note, actor }) => {
    const item = get().inventory.find((i) => i.id === itemId)
    if (!item) return
    const id = `req-${Date.now().toString(36)}`
    const request: InventoryRequest = {
      id,
      sectorId: item.sectorId,
      itemId,
      qty,
      neededBy,
      requestedBy: actor.id,
      requestedAt: new Date().toISOString(),
      status: 'pending',
      note,
    }
    set((s) => ({
      inventoryRequests: [request, ...s.inventoryRequests],
      audit: [audit(actor, 'Raised inventory request', 'Inventory request', id, { sectorId: item.sectorId, after: 'pending' }), ...s.audit],
    }))
    toast.success('Request raised', `${qty} ${item.unit} of ${item.name} sent for approval.`)
  },

  decideInventoryRequest: (id, decision, actor) => {
    const request = get().inventoryRequests.find((r) => r.id === id)
    if (!request) return
    const block = inventoryApprovalBlock(actor, request)
    if (block) {
      toast.warning('Cannot decide', block)
      return
    }
    const item = get().inventory.find((i) => i.id === request.itemId)
    set((s) => ({
      inventoryRequests: s.inventoryRequests.map((r) => (r.id === id ? { ...r, status: decision } : r)),
      audit: [
        audit(actor, decision === 'approved' ? 'Approved inventory request' : 'Rejected inventory request', 'Inventory request', id, {
          sectorId: request.sectorId,
          before: request.status,
          after: decision,
        }),
        ...s.audit,
      ],
    }))
    if (decision === 'approved') {
      toast.success('Request approved', `${item?.name ?? 'Item'} can now go into a purchase order.`)
    } else {
      toast.danger('Request rejected', `${item?.name ?? 'Item'} will not be ordered.`)
    }
  },

  createPurchaseOrder: ({
    supplierId, sectorId, budgetHeadId, lines, aiRank, overrideReason, requestId, expectedBy, actor,
  }) => {
    const state = get()
    const head = state.budgets.find((b) => b.id === budgetHeadId)
    const supplier = state.suppliers.find((s) => s.id === supplierId)
    if (!head || !supplier) return { ok: false, error: 'Pick a supplier and a budget head.' }
    if (lines.length === 0) return { ok: false, error: 'Add at least one line to the order.' }

    if (aiRank !== 1 && (overrideReason ?? '').trim().length < OVERRIDE_REASON_MIN) {
      return {
        ok: false,
        error: `${supplier.name} is not the top-ranked supplier. Give a reason of at least ${OVERRIDE_REASON_MIN} characters.`,
      }
    }

    const total = lines.reduce((sum, l) => sum + l.qty * l.unitPrice, 0)
    if (total > available(head)) {
      return {
        ok: false,
        error: `${head.name} has ${formatMoney(available(head))} available. This order is ${formatMoney(total)}.`,
      }
    }

    const year = new Date().getFullYear()
    const poSeq = state.purchaseOrders.length + 1
    const poNo = `PO-${year}-${String(poSeq).padStart(4, '0')}`
    const id = `po-${poNo}`
    const at = new Date().toISOString()

    const po: PurchaseOrder = {
      id,
      poNo,
      sectorId,
      supplierId,
      budgetHeadId,
      lines,
      total,
      status: 'pending_ca',
      aiRank,
      overrideReason: overrideReason?.trim() || undefined,
      timeline: [
        { at, by: actor.id, action: 'Purchase order prepared' },
        { at, by: actor.id, action: 'Submitted for CA approval' },
      ],
      createdAt: at,
      preparedBy: actor.id,
      approvals: requiredApprovals(total).map((role) => ({ role })),
      requestId,
      expectedBy,
      tenantId: state.activeTenantId,
    }

    set((s) => ({
      purchaseOrders: [po, ...s.purchaseOrders],
      inventoryRequests: requestId
        ? s.inventoryRequests.map((r) => (r.id === requestId ? { ...r, poId: id } : r))
        : s.inventoryRequests,
      audit: [audit(actor, 'Submitted purchase order', 'Purchase order', poNo, { sectorId, after: 'pending_ca' }), ...s.audit],
    }))

    toast.success(
      `${poNo} submitted`,
      `${formatMoney(total)} to ${supplier.name}, waiting on ${roleLabel(po.approvals[0]!.role)}.`,
    )
    return { ok: true, poNo }
  },

  decidePurchaseOrder: (id, decision, actor, comment) => {
    const state = get()
    const po = state.purchaseOrders.find((p) => p.id === id)
    if (!po) return

    const block = approvalBlock(actor, po.preparedBy, po.total, po.approvals)
    if (decision === 'approved' && block) {
      toast.warning('Cannot approve', block)
      return
    }

    const head = state.budgets.find((b) => b.id === po.budgetHeadId)
    if (decision === 'approved' && head && po.total > available(head)) {
      toast.danger(
        'Over budget',
        `${head.name} has only ${formatMoney(available(head))} available. Request a re-allotment first.`,
      )
      return
    }

    const at = new Date().toISOString()
    const approvals = po.approvals.map((step) =>
      step.role === actor.role && !step.decision ? { ...step, userId: actor.id, decision, at, comment } : step,
    )
    const fullyApproved = decision === 'approved' && approvals.every((s) => s.decision === 'approved')
    const status: PurchaseOrder['status'] =
      decision === 'rejected' ? 'rejected' : fullyApproved ? 'approved' : 'pending_ca'

    set((s) => ({
      purchaseOrders: s.purchaseOrders.map((p) =>
        p.id === id
          ? {
              ...p,
              approvals,
              status,
              timeline: [
                ...p.timeline,
                {
                  at,
                  by: actor.id,
                  action: decision === 'approved' ? (fullyApproved ? 'Approved by CA' : 'Approval step recorded') : 'Rejected',
                  note: comment,
                },
              ],
            }
          : p,
      ),
      budgets: fullyApproved
        ? s.budgets.map((b) => (b.id === po.budgetHeadId ? { ...b, committed: b.committed + po.total } : b))
        : s.budgets,
      audit: [
        audit(actor, decision === 'approved' ? 'Approved purchase order' : 'Rejected purchase order', 'Purchase order', po.poNo, {
          sectorId: po.sectorId,
          before: 'pending_ca',
          after: status,
        }),
        ...s.audit,
      ],
    }))

    if (decision === 'rejected') {
      toast.danger(`${po.poNo} rejected`, comment || 'The order will not go to the supplier.')
    } else if (fullyApproved) {
      toast.success(`${po.poNo} approved`, `${formatMoney(po.total)} committed to ${head?.name ?? 'the budget head'}.`)
    } else {
      const next = approvals.find((s) => !s.decision)
      toast.info('Your approval is recorded', `${po.poNo} now waits on ${roleLabel(next?.role ?? 'the next approver')}.`)
    }
  },

  sendPurchaseOrder: (id, actor) => {
    const po = get().purchaseOrders.find((p) => p.id === id)
    if (!po) return
    const supplier = get().suppliers.find((s) => s.id === po.supplierId)
    const at = new Date().toISOString()
    set((s) => ({
      purchaseOrders: s.purchaseOrders.map((p) =>
        p.id === id
          ? { ...p, status: 'sent', timeline: [...p.timeline, { at, by: actor.id, action: 'Sent to supplier' }] }
          : p,
      ),
      audit: [audit(actor, 'Sent purchase order to supplier', 'Purchase order', po.poNo, { sectorId: po.sectorId, before: 'approved', after: 'sent' }), ...s.audit],
    }))
    toast.success(`${po.poNo} sent`, `Order is with ${supplier?.name ?? 'the supplier'}, expected by ${new Date(po.expectedBy).toDateString()}.`)
  },

  cancelPurchaseOrder: (id, actor, reason) => {
    const po = get().purchaseOrders.find((p) => p.id === id)
    if (!po) return
    const wasCommitted = PO_COMMITTED_STATUSES.includes(po.status)
    const at = new Date().toISOString()
    set((s) => ({
      purchaseOrders: s.purchaseOrders.map((p) =>
        p.id === id
          ? { ...p, status: 'cancelled', timeline: [...p.timeline, { at, by: actor.id, action: 'Cancelled', note: reason }] }
          : p,
      ),
      budgets: wasCommitted
        ? s.budgets.map((b) => (b.id === po.budgetHeadId ? { ...b, committed: Math.max(0, b.committed - po.total) } : b))
        : s.budgets,
      audit: [audit(actor, 'Cancelled purchase order', 'Purchase order', po.poNo, { sectorId: po.sectorId, before: po.status, after: 'cancelled' }), ...s.audit],
    }))
    toast.warning(`${po.poNo} cancelled`, wasCommitted ? `${formatMoney(po.total)} released back to the budget head.` : reason)
  },

  receiveGoods: (poId, lines, actor, note) => {
    const po = get().purchaseOrders.find((p) => p.id === poId)
    if (!po) return
    const at = new Date().toISOString()
    const full = po.lines.every((l) => (lines.find((r) => r.itemId === l.itemId)?.qtyReceived ?? 0) >= l.qty)
    const grnSeq = get().goodsReceipts.length + 1
    const grnNo = `GRN-${new Date().getFullYear()}-${String(grnSeq).padStart(4, '0')}`

    const grn: GoodsReceipt = {
      id: `grn-${grnNo}`,
      grnNo,
      poId,
      receivedAt: at,
      receivedBy: actor.id,
      lines,
      note,
    }

    set((s) => ({
      goodsReceipts: [grn, ...s.goodsReceipts],
      purchaseOrders: s.purchaseOrders.map((p) =>
        p.id === poId
          ? {
              ...p,
              status: full ? 'received' : 'partially_received',
              timeline: [...p.timeline, { at, by: actor.id, action: full ? 'Goods received' : 'Goods partially received', note: grnNo }],
            }
          : p,
      ),
      inventory: s.inventory.map((item) => {
        const line = lines.find((l) => l.itemId === item.id)
        return line ? { ...item, stock: item.stock + line.qtyReceived } : item
      }),
      audit: [audit(actor, 'Recorded goods receipt', 'Goods receipt', grnNo, { sectorId: po.sectorId, after: full ? 'received' : 'partially_received' }), ...s.audit],
    }))

    toast.success(`${grnNo} recorded`, `${po.poNo} marked ${full ? 'received' : 'partially received'}. Stock updated.`)
  },

  recordInvoice: (poId, lines, invoiceNo, actor) => {
    const po = get().purchaseOrders.find((p) => p.id === poId)
    if (!po) return
    const total = lines.reduce((sum, l) => sum + l.qty * l.unitPrice, 0)
    const at = new Date().toISOString()
    const invoice: SupplierInvoice = {
      id: `inv-${invoiceNo}`,
      invoiceNo,
      poId,
      supplierId: po.supplierId,
      sectorId: po.sectorId,
      date: at,
      dueDate: new Date(Date.now() + 30 * 86_400_000).toISOString(),
      lines,
      total,
      status: 'received',
      preparedBy: actor.id,
      approvals: requiredApprovals(total).map((role) => ({ role })),
      tenantId: get().activeTenantId,
    }
    set((s) => ({
      invoices: [invoice, ...s.invoices],
      purchaseOrders: s.purchaseOrders.map((p) =>
        p.id === poId
          ? { ...p, status: 'invoiced', timeline: [...p.timeline, { at, by: actor.id, action: 'Invoice received', note: invoiceNo }] }
          : p,
      ),
      audit: [audit(actor, 'Recorded supplier invoice', 'Invoice', invoiceNo, { sectorId: po.sectorId, after: 'received' }), ...s.audit],
    }))
    toast.success(`${invoiceNo} recorded`, `${formatMoney(total)} against ${po.poNo}. Ready for 3-way match.`)
  },

  addCaComment: (invoiceId, comment, actor) => {
    const invoice = get().invoices.find((i) => i.id === invoiceId)
    if (!invoice) return
    set((s) => ({
      invoices: s.invoices.map((i) => (i.id === invoiceId ? { ...i, caComment: comment } : i)),
      audit: [audit(actor, 'Added CA comment on variance', 'Invoice', invoice.invoiceNo, { sectorId: invoice.sectorId }), ...s.audit],
    }))
    toast.info('Comment saved', `The variance on ${invoice.invoiceNo} is now explained. Payment can be approved.`)
  },

  decidePayment: (invoiceId, decision, actor, comment) => {
    const state = get()
    const invoice = state.invoices.find((i) => i.id === invoiceId)
    if (!invoice) return
    const po = state.purchaseOrders.find((p) => p.id === invoice.poId)
    if (!po) return

    const block = approvalBlock(actor, invoice.preparedBy, invoice.total, invoice.approvals)
    if (decision === 'approved' && block) {
      toast.warning('Cannot approve', block)
      return
    }

    const grns = state.goodsReceipts.filter((g) => g.poId === po.id)
    const { flagged } = threeWayMatch(po, grns, invoice)
    if (decision === 'approved' && flagged && !invoice.caComment) {
      toast.danger(
        'Payment blocked',
        'The 3-way match is outside the 2% tolerance. A CA comment explaining the variance is required first.',
      )
      return
    }

    const at = new Date().toISOString()
    const approvals = invoice.approvals.map((step) =>
      step.role === actor.role && !step.decision ? { ...step, userId: actor.id, decision, at, comment } : step,
    )
    const fullyApproved = decision === 'approved' && approvals.every((s) => s.decision === 'approved')
    const nextStatus: SupplierInvoice['status'] =
      decision === 'rejected' ? 'rejected' : fullyApproved ? 'approved' : 'payment_pending'
    const head = state.budgets.find((b) => b.id === po.budgetHeadId)

    // Approval alone moves no money. Budget and ledger change only on release.
    set((s) => ({
      invoices: s.invoices.map((i) => (i.id === invoiceId ? { ...i, approvals, status: nextStatus } : i)),
      purchaseOrders: s.purchaseOrders.map((p) =>
        p.id === po.id
          ? {
              ...p,
              status: decision === 'rejected' ? p.status : 'payment_pending',
              timeline: [
                ...p.timeline,
                {
                  at,
                  by: actor.id,
                  action:
                    decision === 'rejected'
                      ? 'Payment rejected'
                      : fullyApproved
                        ? 'Payment approved, waiting for release'
                        : 'Payment approval step recorded',
                  note: comment,
                },
              ],
            }
          : p,
      ),
      audit: [
        audit(actor, decision === 'approved' ? 'Approved supplier payment' : 'Rejected supplier payment', 'Invoice', invoice.invoiceNo, {
          sectorId: invoice.sectorId,
          before: invoice.status,
          after: nextStatus,
        }),
        ...s.audit,
      ],
    }))

    if (decision === 'rejected') {
      toast.danger(`${invoice.invoiceNo} rejected`, comment || 'Payment will not be released.')
    } else if (fullyApproved) {
      toast.success(
        `${invoice.invoiceNo} approved`,
        `${formatMoney(invoice.total)} to ${head?.name ?? 'the supplier'} is approved. A different person must release it.`,
      )
    } else {
      const next = approvals.find((s) => !s.decision)
      toast.info('Your approval is recorded', `Now waiting on ${roleLabel(next?.role ?? 'the next approver')}.`)
    }
  },

  /** Step 14: release. Committed falls, Spent rises, the ledger posts. */
  releasePayment: (invoiceId, actor) => {
    const state = get()
    const invoice = state.invoices.find((i) => i.id === invoiceId)
    if (!invoice || invoice.status !== 'approved') return
    const po = state.purchaseOrders.find((p) => p.id === invoice.poId)
    if (!po) return

    const block = releaseBlock(actor, invoice)
    if (block) {
      toast.warning('Cannot release', block)
      return
    }
    const at = new Date().toISOString()
    const closed = closedPeriodError(state.periodCloses, at)
    if (closed) {
      toast.danger('Period is closed', closed)
      return
    }
    const head = state.budgets.find((b) => b.id === po.budgetHeadId)

    set((s) => ({
      invoices: s.invoices.map((i) => (i.id === invoiceId ? { ...i, status: 'paid', releasedBy: actor.id, releasedAt: at } : i)),
      purchaseOrders: s.purchaseOrders.map((p) =>
        p.id === po.id
          ? { ...p, status: 'paid', timeline: [...p.timeline, { at, by: actor.id, action: 'Payment released', note: invoice.invoiceNo }] }
          : p,
      ),
      budgets: s.budgets.map((b) =>
        b.id === po.budgetHeadId ? { ...b, committed: Math.max(0, b.committed - po.total), spent: b.spent + invoice.total } : b,
      ),
      journal: [
        journalEntry(
          `je-${invoice.id}`,
          at,
          invoice.sectorId,
          `Supplier payment — ${invoice.invoiceNo} against ${po.poNo}`,
          [
            { account: 'Programme expenditure', fundId: head?.fundId ?? po.budgetHeadId, debit: invoice.total, credit: 0 },
            { account: 'Bank', fundId: head?.fundId ?? po.budgetHeadId, debit: 0, credit: invoice.total },
          ],
          invoice.id,
        ),
        ...s.journal,
      ],
      audit: [
        audit(actor, 'Released supplier payment', 'Invoice', invoice.invoiceNo, {
          sectorId: invoice.sectorId,
          before: 'approved',
          after: 'paid',
        }),
        ...s.audit,
      ],
    }))

    toast.success(
      `${invoice.invoiceNo} released`,
      `${formatMoney(invoice.total)} paid. ${formatMoney(po.total)} left committed, ${formatMoney(invoice.total)} recorded as spent on ${head?.name ?? 'the budget head'}.`,
    )
  },

  /* ------------------------------------------------------------ tenants */

  onboardTenant: (input, actor) => {
    const state = get()
    const name = input.name.trim()
    if (name.length < 3) return { ok: false, error: 'Give the customer a name of at least 3 characters.' }
    if (input.verticals.length === 0) return { ok: false, error: 'Enable at least one vertical.' }
    if (input.modules.length === 0) return { ok: false, error: 'Enable at least one module.' }
    if (input.squareLocationId.trim().length < 6) return { ok: false, error: 'Enter the Square location ID.' }
    if (!(input.thresholds.staffMax > 0) || input.thresholds.partnerMax <= input.thresholds.staffMax) {
      return { ok: false, error: 'The Partner threshold must be higher than the Staff threshold.' }
    }
    const domain = input.domain.trim().toLowerCase()
    if (domain.length < 4 || !domain.includes('.')) return { ok: false, error: 'Enter a domain such as give.example.org.' }
    if (state.tenants.some((t) => t.domain === domain)) return { ok: false, error: `${domain} is already used by another customer.` }
    const missing = REQUIRED_TENANT_ROLES.filter((role) => !input.users.some((u) => u.role === role))
    if (missing.length > 0) {
      return {
        ok: false,
        error: `Add a user for ${missing.map(roleLabel).join(', ')}. Four-eyes control needs every approver role filled.`,
      }
    }

    const id = `ten-${Date.now().toString(36)}`
    const tenant: Tenant = {
      ...input,
      id,
      name,
      domain,
      catalogLoaded: true,
      status: 'live',
      createdAt: new Date().toISOString(),
    }
    const data = buildTenantData(tenant)

    set((s) => ({
      tenants: [...s.tenants, tenant],
      vault: { ...s.vault, [id]: data },
      audit: [audit(actor, 'Onboarded customer', 'Tenant', name, { after: 'live' }), ...s.audit],
    }))
    toast.success(
      `${name} is live`,
      `${data.funds.length} funds, ${data.budgets.length} budget heads and ${data.inventory.length} stock items loaded from the template.`,
    )
    return { ok: true, tenantId: id }
  },

  switchTenant: (id) => {
    const s = get()
    if (id === s.activeTenantId) return
    const target = s.tenants.find((t) => t.id === id)
    const data = s.vault[id]
    if (!target || !data) return
    const vault = { ...s.vault, [s.activeTenantId]: pickTenantData(s) }
    applyThresholds(target.thresholds.staffMax, target.thresholds.partnerMax)
    set({ ...data, vault, activeTenantId: id })
    toast.info(`Switched to ${target.name}`, 'Every screen now shows only this customer’s books, users and approvers.')
  },
}))

export { userById, userName }
