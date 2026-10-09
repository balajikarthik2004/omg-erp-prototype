import { endOfMonth, format, isWithinInterval, startOfMonth, subMonths } from 'date-fns'

import { CATEGORY_COLORS, CATEGORY_LABEL, SECTORS } from '@/config'
import { CATALOG } from '@/mock/seed'
import type {
  ApprovalTask,
  BudgetHead,
  CatalogItem,
  Donation,
  SectorId,
  SupplierInvoice,
  User,
} from '@/types'
import { available, approvalBlock, budgetHealth, type DbState } from './db'
import { cashConfirmBlock, inventoryApprovalBlock, periodApproveBlock, releaseBlock } from './rules'
import type { SectorFilter } from './session'

export function inSector<T extends { sectorId: SectorId }>(rows: T[], filter: SectorFilter): T[] {
  return filter === 'all' ? rows : rows.filter((r) => r.sectorId === filter)
}

export function catalogItem(itemId: string): CatalogItem | undefined {
  return CATALOG.find((c) => c.id === itemId)
}

export function catalogName(itemId: string): string {
  return catalogItem(itemId)?.name ?? itemId
}

/** Donations that actually represent money kept. */
export function countedDonations(donations: Donation[]): Donation[] {
  return donations.filter((d) => d.status !== 'failed' && d.status !== 'refunded' && d.status !== 'pending')
}

/* ------------------------------------------------------------------- KPIs */

export interface MonthPoint {
  key: string
  label: string
  income: number
  outgo: number
  net: number
  temple: number
  sevalaya: number
  sangam: number
}

export function monthlySeries(db: DbState, filter: SectorFilter, months = 12): MonthPoint[] {
  const now = new Date()
  const points: MonthPoint[] = []

  const donations = countedDonations(inSector(db.donations, filter))
  const paidInvoices = inSector(
    db.invoices.filter((i) => i.status === 'paid'),
    filter,
  )

  for (let i = months - 1; i >= 0; i--) {
    const anchor = subMonths(now, i)
    const start = startOfMonth(anchor)
    const end = endOfMonth(anchor)
    const within = (iso: string) => isWithinInterval(new Date(iso), { start, end })

    const monthDonations = donations.filter((d) => within(d.createdAt))
    const income = monthDonations.reduce((s, d) => s + d.net, 0)
    const outgo = paidInvoices.filter((inv) => within(inv.date)).reduce((s, inv) => s + inv.total, 0)

    points.push({
      key: format(start, 'yyyy-MM'),
      label: format(start, 'MMM'),
      income,
      outgo,
      net: income - outgo,
      temple: monthDonations.filter((d) => d.sectorId === 'temple').reduce((s, d) => s + d.net, 0),
      sevalaya: monthDonations.filter((d) => d.sectorId === 'sevalaya').reduce((s, d) => s + d.net, 0),
      sangam: monthDonations.filter((d) => d.sectorId === 'sangam').reduce((s, d) => s + d.net, 0),
    })
  }

  return points
}

export interface Kpis {
  incomeMtd: number
  outgoMtd: number
  net: number
  incomeDelta: number
  outgoDelta: number
  pendingCount: number
  pendingValue: number
  donationCountMtd: number
}

export function kpis(db: DbState, filter: SectorFilter): Kpis {
  const tasks = approvalTasks(db, filter)
  const now = new Date()
  const dayOfMonth = now.getDate()

  // Month to date, against the same number of days last month. Comparing a
  // part-month against a whole one made income look as if it had collapsed.
  const thisStart = startOfMonth(now)
  const lastStart = startOfMonth(subMonths(now, 1))
  const lastCutoff = new Date(lastStart)
  lastCutoff.setDate(dayOfMonth)
  lastCutoff.setHours(now.getHours(), now.getMinutes(), 59, 999)

  const donations = countedDonations(inSector(db.donations, filter))
  const paidInvoices = inSector(db.invoices.filter((i) => i.status === 'paid'), filter)

  const sumBetween = <T,>(rows: T[], at: (row: T) => string, amount: (row: T) => number, from: Date, to: Date) =>
    rows.reduce((total, row) => {
      const when = new Date(at(row))
      return when >= from && when <= to ? total + amount(row) : total
    }, 0)

  const incomeMtd = sumBetween(donations, (d) => d.createdAt, (d) => d.net, thisStart, now)
  const incomeLast = sumBetween(donations, (d) => d.createdAt, (d) => d.net, lastStart, lastCutoff)
  const outgoMtd = sumBetween(paidInvoices, (i) => i.date, (i) => i.total, thisStart, now)
  const outgoLast = sumBetween(paidInvoices, (i) => i.date, (i) => i.total, lastStart, lastCutoff)

  const donationCountMtd = donations.filter((d) => new Date(d.createdAt) >= thisStart).length
  const pct = (a: number, b: number) => (b === 0 ? (a > 0 ? 100 : 0) : ((a - b) / b) * 100)

  return {
    incomeMtd,
    outgoMtd,
    net: incomeMtd - outgoMtd,
    incomeDelta: pct(incomeMtd, incomeLast),
    outgoDelta: pct(outgoMtd, outgoLast),
    pendingCount: tasks.length,
    pendingValue: tasks.reduce((s, t) => s + t.amount, 0),
    donationCountMtd,
  }
}

/* -------------------------------------------------------- approval inbox */

const DUE_DAYS: Record<ApprovalTask['kind'], number> = {
  allotment: 5,
  purchase_order: 3,
  payment: 7,
  payment_release: 3,
  refund: 2,
  inventory_request: 4,
  cash_count: 2,
  period_close: 5,
}

function dueFrom(iso: string, kind: ApprovalTask['kind']): string {
  return new Date(new Date(iso).getTime() + DUE_DAYS[kind] * 86_400_000).toISOString()
}

/** Everything waiting on somebody, across the whole flow. */
export function approvalTasks(db: DbState, filter: SectorFilter): ApprovalTask[] {
  const tasks: ApprovalTask[] = []

  for (const a of inSector(db.allotments, filter)) {
    if (a.status !== 'pending' && a.status !== 'escalated') continue
    const head = db.budgets.find((b) => b.id === a.toBudgetHeadId)
    tasks.push({
      kind: 'allotment',
      id: a.id,
      title: `Allot to ${head?.name ?? 'budget head'}`,
      subtitle: a.reason,
      sectorId: a.sectorId,
      amount: a.amount,
      preparedBy: a.preparedBy,
      preparedAt: a.preparedAt,
      dueAt: dueFrom(a.preparedAt, 'allotment'),
      href: `/console/allotments?focus=${a.id}`,
      escalated: a.status === 'escalated',
    })
  }

  for (const po of inSector(db.purchaseOrders, filter)) {
    if (po.status !== 'pending_ca') continue
    const supplier = db.suppliers.find((s) => s.id === po.supplierId)
    tasks.push({
      kind: 'purchase_order',
      id: po.id,
      title: `${po.poNo} · ${supplier?.name ?? 'Supplier'}`,
      subtitle: `${po.lines.length} line${po.lines.length === 1 ? '' : 's'} against ${db.budgets.find((b) => b.id === po.budgetHeadId)?.name ?? 'a budget head'}`,
      sectorId: po.sectorId,
      amount: po.total,
      preparedBy: po.preparedBy,
      preparedAt: po.createdAt,
      dueAt: dueFrom(po.createdAt, 'purchase_order'),
      href: `/console/purchase-orders/${po.id}`,
    })
  }

  for (const inv of inSector(db.invoices, filter)) {
    if (inv.status !== 'payment_pending' && inv.status !== 'variance') continue
    const supplier = db.suppliers.find((s) => s.id === inv.supplierId)
    tasks.push({
      kind: 'payment',
      id: inv.id,
      title: `${inv.invoiceNo} · ${supplier?.name ?? 'Supplier'}`,
      subtitle: inv.status === 'variance' ? 'Price mismatch — needs a CA comment before payment' : 'Matched and ready to pay',
      sectorId: inv.sectorId,
      amount: inv.total,
      preparedBy: inv.preparedBy,
      preparedAt: inv.date,
      dueAt: inv.dueDate,
      href: `/console/payments?focus=${inv.id}`,
    })
  }

  for (const req of inSector(db.inventoryRequests, filter)) {
    if (req.status !== 'pending' && req.status !== 'escalated') continue
    const item = db.inventory.find((i) => i.id === req.itemId)
    tasks.push({
      kind: 'inventory_request',
      id: req.id,
      title: `${item?.name ?? 'Item'} × ${req.qty} ${item?.unit ?? ''}`.trim(),
      subtitle: req.note ?? 'Store request awaiting approval',
      sectorId: req.sectorId,
      amount: (item?.lastUnitPrice ?? 0) * req.qty,
      preparedBy: req.requestedBy,
      preparedAt: req.requestedAt,
      dueAt: dueFrom(req.requestedAt, 'inventory_request'),
      href: `/console/inventory?focus=${req.id}`,
      escalated: req.status === 'escalated',
    })
  }

  for (const inv of inSector(db.invoices, filter)) {
    if (inv.status !== 'approved') continue
    const supplier = db.suppliers.find((s) => s.id === inv.supplierId)
    tasks.push({
      kind: 'payment_release',
      id: inv.id,
      title: `Release ${inv.invoiceNo} · ${supplier?.name ?? 'Supplier'}`,
      subtitle: 'Approved. A different person must release the money.',
      sectorId: inv.sectorId,
      amount: inv.total,
      preparedBy: inv.preparedBy,
      preparedAt: inv.date,
      dueAt: inv.dueDate,
      href: `/console/payments?focus=${inv.id}`,
    })
  }

  for (const c of inSector(db.cashCounts, filter)) {
    if (c.status !== 'pending') continue
    tasks.push({
      kind: 'cash_count',
      id: c.id,
      title: `Cash count · ${catalogName(c.itemId)}`,
      subtitle: c.note ?? 'Counter cash waiting for a second person',
      sectorId: c.sectorId,
      amount: c.amount,
      preparedBy: c.countedBy,
      preparedAt: c.countedAt,
      dueAt: dueFrom(c.countedAt, 'cash_count'),
      href: `/console/cash-counts?focus=${c.id}`,
    })
  }

  for (const p of db.periodCloses) {
    if (p.status !== 'pending') continue
    tasks.push({
      kind: 'period_close',
      id: p.period,
      title: `Close books for ${p.period}`,
      subtitle: p.note ?? 'Prepared by the CA team. The CA Partner locks the month.',
      sectorId: 'temple',
      amount: 0,
      preparedBy: p.preparedBy ?? '',
      preparedAt: p.preparedAt ?? new Date().toISOString(),
      dueAt: dueFrom(p.preparedAt ?? new Date().toISOString(), 'period_close'),
      href: `/console/period-close?focus=${p.period}`,
    })
  }

  for (const d of inSector(db.donations, filter)) {
    if (!d.disputed) continue
    tasks.push({
      kind: 'refund',
      id: d.id,
      title: `Disputed charge on ${d.receiptNo}`,
      subtitle: 'Card issuer raised a dispute. Decide whether to contest or refund.',
      sectorId: d.sectorId,
      amount: d.gross,
      preparedBy: 'u-cas',
      preparedAt: d.createdAt,
      dueAt: dueFrom(d.createdAt, 'refund'),
      href: `/console/donations?focus=${d.id}`,
    })
  }

  return tasks.sort((a, b) => a.dueAt.localeCompare(b.dueAt))
}

/** Why this person cannot act on a task, or null when they can. */
export function taskBlock(db: DbState, task: ApprovalTask, user: User): string | null {
  switch (task.kind) {
    case 'inventory_request': {
      const req = db.inventoryRequests.find((r) => r.id === task.id)
      return req ? inventoryApprovalBlock(user, req) : null
    }
    case 'cash_count': {
      const count = db.cashCounts.find((c) => c.id === task.id)
      return count ? cashConfirmBlock(user, count) : null
    }
    case 'period_close': {
      const row = db.periodCloses.find((p) => p.period === task.id)
      return row ? periodApproveBlock(user, row) : null
    }
    case 'payment_release': {
      const inv = db.invoices.find((i) => i.id === task.id)
      return inv ? releaseBlock(user, inv) : null
    }
    case 'refund':
      return user.role === 'ca_partner' || user.role === 'ca_staff' ? null : 'Refunds are decided by the CA team.'
    default:
      return approvalBlock(user, task.preparedBy, task.amount, approvalsForTask(db, task))
  }
}

/** The subset this persona can actually act on right now. */
export function actionableTasks(db: DbState, filter: SectorFilter, user: User): ApprovalTask[] {
  return approvalTasks(db, filter).filter((task) => taskBlock(db, task, user) === null)
}

export function approvalsForTask(db: DbState, task: ApprovalTask) {
  switch (task.kind) {
    case 'allotment':
      return db.allotments.find((a) => a.id === task.id)?.approvals ?? []
    case 'purchase_order':
      return db.purchaseOrders.find((p) => p.id === task.id)?.approvals ?? []
    case 'payment':
    case 'payment_release':
      return db.invoices.find((i) => i.id === task.id)?.approvals ?? []
    default:
      return []
  }
}

/* ------------------------------------------------------------- aggregates */

export interface FundSlice {
  id: string
  name: string
  sectorId: SectorId
  balance: number
  type: string
  color: string
}

export function fundSlices(db: DbState, filter: SectorFilter): FundSlice[] {
  return inSector(db.funds, filter)
    .map((f) => ({
      id: f.id,
      name: f.name,
      sectorId: f.sectorId,
      balance: f.balance,
      type: f.type,
      color: SECTORS[f.sectorId].chartColor,
    }))
    .sort((a, b) => b.balance - a.balance)
}

export function budgetsNearLimit(db: DbState, filter: SectorFilter): BudgetHead[] {
  return inSector(db.budgets, filter)
    .filter((b) => budgetHealth(b) !== 'healthy')
    .sort((a, b) => available(a) - available(b))
}

export function categoryBreakdown(db: DbState, filter: SectorFilter) {
  const totals: Record<string, number> = { hundi: 0, pooja: 0, event: 0, membership: 0, activity: 0, project: 0 }
  for (const d of countedDonations(inSector(db.donations, filter))) {
    for (const line of d.lines) totals[line.category] = (totals[line.category] ?? 0) + line.amount
  }
  return Object.keys(CATEGORY_LABEL).map((key) => ({
    key,
    label: CATEGORY_LABEL[key]!,
    value: totals[key] ?? 0,
    color: CATEGORY_COLORS[key]!,
  }))
}

export interface FundFlowRow {
  id: string
  name: string
  sectorId: SectorId
  type: string
  /** Net donations received into the fund. */
  income: number
  /** Approved allotments moved out to budget heads. */
  allotted: number
  /** Spent by the budget heads this fund pays for. */
  outgo: number
  balance: number
}

/** Income vs outgo by fund (deck step 15). */
export function fundFlow(db: DbState, filter: SectorFilter): FundFlowRow[] {
  const donations = countedDonations(inSector(db.donations, filter))
  return inSector(db.funds, filter)
    .map((fund) => ({
      id: fund.id,
      name: fund.name,
      sectorId: fund.sectorId,
      type: fund.type,
      income: donations.filter((d) => d.fundId === fund.id).reduce((s, d) => s + d.net, 0),
      allotted: db.allotments.filter((a) => a.status === 'approved' && a.fromFundId === fund.id).reduce((s, a) => s + a.amount, 0),
      outgo: db.budgets.filter((b) => b.fundId === fund.id).reduce((s, b) => s + b.spent, 0),
      balance: fund.balance,
    }))
    .sort((a, b) => b.income - a.income)
}

export function methodBreakdown(db: DbState, filter: SectorFilter) {
  const totals: Record<string, { count: number; value: number }> = {}
  for (const d of countedDonations(inSector(db.donations, filter))) {
    const entry = totals[d.method] ?? { count: 0, value: 0 }
    entry.count += 1
    entry.value += d.gross
    totals[d.method] = entry
  }
  const labels: Record<string, string> = {
    card: 'Card',
    apple_pay: 'Apple Pay',
    google_pay: 'Google Pay',
    cash: 'Cash',
    cheque: 'Cheque',
  }
  return Object.entries(totals)
    .map(([key, v]) => ({ key, label: labels[key] ?? key, ...v }))
    .sort((a, b) => b.value - a.value)
}

export function invoiceForPo(db: DbState, poId: string): SupplierInvoice | undefined {
  return db.invoices.find((i) => i.poId === poId)
}

export function lowStock(db: DbState, filter: SectorFilter) {
  return inSector(db.inventory, filter).filter((i) => i.stock <= i.reorderLevel)
}

/**
 * The signed-in devotee's gifts: this session's, plus the most generous seeded
 * donor's history, so the annual statement has a real year behind it.
 */
export function myDonorIds(donations: Donation[], donors: { id: string; anonymous: boolean }[]): string[] {
  const anonymous = new Set(donors.filter((d) => d.anonymous).map((d) => d.id))
  const counts = new Map<string, number>()
  for (const d of donations) {
    if (d.donorId === 'dnr-live' || d.donorId === 'dnr-counter' || anonymous.has(d.donorId)) continue
    counts.set(d.donorId, (counts.get(d.donorId) ?? 0) + 1)
  }
  let best = ''
  let most = 0
  for (const [id, n] of counts) {
    if (n > most) {
      best = id
      most = n
    }
  }
  return best ? ['dnr-live', best] : ['dnr-live']
}

export function donorName(db: DbState, donorId: string): string {
  return db.donors.find((d) => d.id === donorId)?.name ?? 'Unknown donor'
}

/** Recent activity feed for the dashboard. */
export function recentActivity(db: DbState, filter: SectorFilter, limit = 8) {
  return inSector(
    db.audit.filter((a) => a.sectorId !== undefined) as (typeof db.audit[number] & { sectorId: SectorId })[],
    filter,
  ).slice(0, limit)
}
