import { create } from 'zustand'

import { APP, MATCH_TOLERANCE, OVERRIDE_REASON_MIN, requiredApprovals } from '@/config'
import { formatMoney } from '@/lib/format'
import { toast } from '@/lib/toast'
import { api, type Database } from '@/mock/api'
import { CATALOG, userById, userName } from '@/mock/seed'
import type {
  Allotment,
  ApprovalStep,
  AuditEvent,
  BudgetHead,
  Donation,
  DonationLine,
  Fund,
  GoodsReceipt,
  InventoryRequest,
  JournalEntry,
  PaymentMethod,
  POLine,
  PurchaseOrder,
  SectorId,
  SupplierInvoice,
  User,
} from '@/types'
import type { CartLine } from './session'

const EMPTY: Database = {
  donors: [], donations: [], funds: [], projects: [], journal: [], budgets: [], allotments: [],
  inventory: [], inventoryRequests: [], suppliers: [], purchaseOrders: [], goodsReceipts: [],
  invoices: [], payouts: [], audit: [],
}

export interface DbState extends Database {
  ready: boolean
  loading: boolean

  load: () => Promise<void>

  /* collect */
  recordDonation: (input: {
    lines: CartLine[]
    method: PaymentMethod
    donorName: string
    actor: User
  }) => Donation

  /* control */
  createAllotment: (input: {
    fromFundId: string
    toBudgetHeadId: string
    amount: number
    reason: string
    actor: User
  }) => { ok: boolean; error?: string }
  decideAllotment: (id: string, decision: 'approved' | 'rejected', actor: User, comment?: string) => void
  matchPayout: (payoutId: string, actor: User) => void

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
  return { id, date, sectorId, memo, lines, sourceRef }
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

  load: async () => {
    if (get().ready || get().loading) return
    set({ loading: true })
    const data = await api.fetchAll()
    set({ ...data, ready: true, loading: false })
  },

  /* ------------------------------------------------------------ collect */

  recordDonation: ({ lines, method, donorName, actor }) => {
    const state = get()
    const sectorId = lines[0]?.sectorId ?? 'temple'
    const first = CATALOG.find((c) => c.id === lines[0]?.itemId)
    const fundId = first?.fundId ?? 'fund-tmp-gen'
    const gross = lines.reduce((sum, l) => sum + l.amount, 0)
    const isCardType = method === 'card' || method === 'apple_pay' || method === 'google_pay'
    const fee = isCardType ? cardFee(gross) : 0

    const year = new Date().getFullYear()
    const seq = state.donations.length + 1
    const code = sectorId === 'temple' ? 'TMP' : sectorId === 'sevalaya' ? 'SEV' : 'SGM'
    const receiptSeq = state.donations.filter((d) => d.sectorId === sectorId).length + 2000

    const donationLines: DonationLine[] = lines.map((l) => {
      const item = CATALOG.find((c) => c.id === l.itemId)
      return {
        itemId: l.itemId,
        category: item?.category ?? 'hundi',
        amount: l.amount,
        dedication: l.dedication,
      }
    })

    const donation: Donation = {
      id: `DN-${year}-${String(seq).padStart(6, '0')}`,
      receiptNo: `RCP-${code}-${String(year).slice(2)}-${String(receiptSeq).padStart(5, '0')}`,
      sectorId,
      donorId: 'dnr-live',
      lines: donationLines,
      gross,
      fee,
      net: gross - fee,
      method,
      status: 'receipted',
      createdAt: new Date().toISOString(),
      squarePaymentId: isCardType ? `sqpmt_${Date.now().toString(36).toUpperCase()}` : undefined,
      fundId,
    }

    set((s) => {
      const donors = s.donors.some((d) => d.id === 'dnr-live')
        ? s.donors
        : [
            ...s.donors,
            {
              id: 'dnr-live',
              name: donorName || 'You',
              email: '',
              phone: '',
              city: '',
              anonymous: false,
              since: new Date().toISOString(),
            },
          ]

      // Project totals move with the gift.
      const projects = s.projects.map((p) =>
        p.fundId === fundId ? { ...p, raised: p.raised + donation.net } : p,
      )

      return {
        donors,
        projects,
        donations: [donation, ...s.donations],
        funds: s.funds.map((f) => (f.id === fundId ? { ...f, balance: f.balance + donation.net } : f)),
        journal: [
          journalEntry(
            `je-${donation.id}`,
            donation.createdAt,
            sectorId,
            `Donation received — ${donation.receiptNo}`,
            [
              { account: 'Bank', fundId, debit: donation.net, credit: 0 },
              ...(fee > 0 ? [{ account: 'Payment processing fees', fundId, debit: fee, credit: 0 }] : []),
              { account: 'Donation income', fundId, debit: 0, credit: gross },
            ],
            donation.id,
          ),
          ...s.journal,
        ],
        audit: [
          audit(actor, 'Recorded donation', 'Donation', donation.receiptNo, { sectorId, after: 'receipted' }),
          ...s.audit,
        ],
      }
    })

    return donation
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

  matchPayout: (payoutId, actor) => {
    const payout = get().payouts.find((p) => p.id === payoutId)
    if (!payout) return
    set((s) => ({
      payouts: s.payouts.map((p) => (p.id === payoutId ? { ...p, status: 'matched', note: undefined } : p)),
      donations: s.donations.map((d) =>
        payout.donationIds.includes(d.id) && d.status !== 'refunded' && d.status !== 'failed'
          ? { ...d, status: 'reconciled' }
          : d,
      ),
      audit: [audit(actor, 'Reconciled Square payout', 'Payout', payout.payoutRef, { after: 'matched' }), ...s.audit],
    }))
    toast.success(
      `${payout.payoutRef} reconciled`,
      `${payout.donationIds.length} donations marked reconciled, ${formatMoney(payout.net)} net.`,
    )
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
    if (decision === 'approved' && request.requestedBy === actor.id) {
      toast.warning('Cannot approve', 'You prepared this. Another approver must review it.')
      return
    }
    const item = get().inventory.find((i) => i.id === request.itemId)
    set((s) => ({
      inventoryRequests: s.inventoryRequests.map((r) => (r.id === id ? { ...r, status: decision } : r)),
      audit: [
        audit(actor, decision === 'approved' ? 'Approved inventory request' : 'Rejected inventory request', 'Inventory request', id, {
          sectorId: request.sectorId,
          before: 'pending',
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
    const head = state.budgets.find((b) => b.id === po.budgetHeadId)

    set((s) => ({
      invoices: s.invoices.map((i) =>
        i.id === invoiceId
          ? { ...i, approvals, status: decision === 'rejected' ? 'rejected' : fullyApproved ? 'paid' : 'payment_pending' }
          : i,
      ),
      purchaseOrders: s.purchaseOrders.map((p) =>
        p.id === po.id
          ? {
              ...p,
              status: decision === 'rejected' ? p.status : fullyApproved ? 'paid' : 'payment_pending',
              timeline: [
                ...p.timeline,
                {
                  at,
                  by: actor.id,
                  action: decision === 'rejected' ? 'Payment rejected' : fullyApproved ? 'Payment approved and released' : 'Payment approval step recorded',
                  note: comment,
                },
              ],
            }
          : p,
      ),
      budgets: fullyApproved
        ? s.budgets.map((b) =>
            b.id === po.budgetHeadId
              ? { ...b, committed: Math.max(0, b.committed - po.total), spent: b.spent + invoice.total }
              : b,
          )
        : s.budgets,
      journal: fullyApproved
        ? [
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
          ]
        : s.journal,
      audit: [
        audit(actor, decision === 'approved' ? 'Approved supplier payment' : 'Rejected supplier payment', 'Invoice', invoice.invoiceNo, {
          sectorId: invoice.sectorId,
          before: 'payment_pending',
          after: decision === 'rejected' ? 'rejected' : fullyApproved ? 'paid' : 'payment_pending',
        }),
        ...s.audit,
      ],
    }))

    if (decision === 'rejected') {
      toast.danger(`${invoice.invoiceNo} rejected`, comment || 'Payment will not be released.')
    } else if (fullyApproved) {
      toast.success(
        `${invoice.invoiceNo} paid`,
        `${formatMoney(invoice.total)} released. ${formatMoney(po.total)} released from committed, ${formatMoney(invoice.total)} recorded as spent on ${head?.name ?? 'the budget head'}.`,
      )
    } else {
      const next = approvals.find((s) => !s.decision)
      toast.info('Your approval is recorded', `Now waiting on ${roleLabel(next?.role ?? 'the next approver')}.`)
    }
  },
}))

export { userById, userName }
