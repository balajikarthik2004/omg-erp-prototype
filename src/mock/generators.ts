import { addDays, differenceInDays, endOfMonth, format, startOfMonth, subDays, subMonths } from 'date-fns'

import { APP, DEFAULT_THRESHOLDS } from '@/config'
import { createRng, SEED } from '@/lib/rng'
import type {
  Allotment,
  AuditEvent,
  BudgetHead,
  CashCount,
  Donation,
  DonationCategory,
  DonationLine,
  Donor,
  Fund,
  GoodsReceipt,
  InventoryItem,
  InventoryRequest,
  JournalEntry,
  PaymentMethod,
  PeriodClose,
  POStatus,
  Project,
  PurchaseOrder,
  SectorId,
  SquarePayout,
  Supplier,
  SupplierInvoice,
  Tenant,
} from '@/types'
import {
  BUDGET_SPECS,
  CATALOG,
  DONOR_CITIES,
  DONOR_FIRST,
  DONOR_LAST,
  FUNDS,
  INVENTORY,
  INVENTORY_SECTORS,
  PROJECTS,
  SUPPLIER_SPECS,
  USERS,
} from './seed'

export interface Database {
  donors: Donor[]
  donations: Donation[]
  funds: Fund[]
  projects: Project[]
  journal: JournalEntry[]
  budgets: BudgetHead[]
  allotments: Allotment[]
  inventory: InventoryItem[]
  inventoryRequests: InventoryRequest[]
  suppliers: Supplier[]
  purchaseOrders: PurchaseOrder[]
  goodsReceipts: GoodsReceipt[]
  invoices: SupplierInvoice[]
  payouts: SquarePayout[]
  audit: AuditEvent[]
  cashCounts: CashCount[]
  periodCloses: PeriodClose[]
  tenants: Tenant[]
}

/** The one customer the demo ships with. */
export const DEMO_TENANT_ID = 'ten-demo'

/* --------------------------------------------------------------- helpers */

const SECTOR_CODE: Record<SectorId, string> = { temple: 'TMP', sevalaya: 'SEV', sangam: 'SGM' }

/** Festival rhythm. Index 0 = January. */
const MONTH_WEIGHT = [1.5, 0.85, 0.8, 1.4, 0.8, 0.75, 0.8, 1.25, 1.45, 1.6, 1.5, 1.1]

const FESTIVAL_MONTHS = new Set([0, 3, 8, 9, 10])

const iso = (d: Date) => d.toISOString()

function supplierCode(name: string): string {
  return name
    .replace(/[^A-Za-z\s]/g, ' ')
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 3)
    .map((w) => w[0]!.toUpperCase())
    .join('')
    .padEnd(3, 'X')
}

function cardFee(gross: number): number {
  return Math.round(gross * APP.fee.percent) + APP.fee.fixedCents
}

/* ---------------------------------------------------------------- donors */

function makeDonors(rng: ReturnType<typeof createRng>, now: Date): Donor[] {
  const donors: Donor[] = []
  const seen = new Set<string>()

  for (let i = 0; i < 240; i++) {
    const anonymous = i % 40 === 17
    let name: string

    if (anonymous) {
      name = 'Anonymous devotee'
    } else {
      const first = rng.pick(DONOR_FIRST)
      const last = rng.pick(DONOR_LAST)
      const shape = rng.next()
      if (shape < 0.12) name = `${first} & ${rng.pick(DONOR_FIRST)} ${last}`
      else if (shape < 0.2) name = `${last} Family`
      else name = `${first} ${last}`
      let guard = 0
      while (seen.has(name) && guard < 6) {
        name = `${rng.pick(DONOR_FIRST)} ${rng.pick(DONOR_LAST)}`
        guard++
      }
      seen.add(name)
    }

    const slug = name.toLowerCase().replace(/[^a-z]+/g, '.').replace(/^\.|\.$/g, '')
    donors.push({
      id: `dnr-${String(i + 1).padStart(4, '0')}`,
      name,
      email: anonymous ? '' : `${slug}@example.com`,
      phone: anonymous ? '' : `+1 ${rng.int(201, 989)} ${rng.int(200, 999)} ${rng.int(1000, 9999)}`,
      city: rng.pick(DONOR_CITIES),
      anonymous,
      since: iso(subDays(now, rng.int(30, 2200))),
    })
  }

  return donors
}

/* ------------------------------------------------------------- donations */

const CATEGORY_WEIGHT: [DonationCategory, number][] = [
  ['hundi', 44],
  ['pooja', 25],
  ['event', 7],
  ['membership', 4],
  ['activity', 12],
  ['project', 8],
]

const SECTOR_WEIGHT: [SectorId, number][] = [
  ['temple', 60],
  ['sevalaya', 25],
  ['sangam', 15],
]

/** Natural giving amounts, in cents. */
const SMALL_AMOUNTS = [1100, 2100, 5100, 10100, 10800]
const MID_AMOUNTS = [10100, 15100, 20100, 25100, 31_00, 51_00]

function pickAmount(rng: ReturnType<typeof createRng>, category: DonationCategory): number {
  if (category === 'hundi') {
    return rng.weighted([
      [1100, 30],
      [2100, 24],
      [5100, 18],
      [10100, 14],
      [10800, 8],
      [25100, 4],
      [50100, 2],
    ])
  }
  if (category === 'project') {
    return rng.weighted([
      [10100, 22],
      [25100, 26],
      [50100, 22],
      [100100, 18],
      [111600, 8],
      [250100, 4],
    ])
  }
  if (category === 'activity') return rng.pick(MID_AMOUNTS)
  return rng.pick([...SMALL_AMOUNTS, ...MID_AMOUNTS])
}

const NAKSHATRAS = [
  'Ashwini', 'Bharani', 'Krittika', 'Rohini', 'Mrigashira', 'Thiruvathirai', 'Punarpoosam', 'Pooyam',
  'Ayilyam', 'Magam', 'Pooram', 'Uthiram', 'Hastham', 'Chithirai', 'Swathi', 'Visakam', 'Anusham',
  'Kettai', 'Moolam', 'Pooradam', 'Uthiradam', 'Thiruvonam', 'Avittam', 'Sadhayam', 'Revathi',
]

const GOTHRAMS = [
  'Bharadwaja', 'Kashyapa', 'Vasishta', 'Atri', 'Vishwamitra', 'Gautama', 'Jamadagni', 'Agastya',
  'Harita', 'Srivatsa', 'Kaundinya', 'Sandilya',
]

function makeDonations(
  rng: ReturnType<typeof createRng>,
  donors: Donor[],
  now: Date,
): Donation[] {
  const donations: Donation[] = []
  const windowStart = startOfMonth(subMonths(now, 11))
  let sequence = 1
  const receiptSeq: Record<SectorId, number> = { temple: 1840, sevalaya: 920, sangam: 410 }

  for (let m = 0; m < 12; m++) {
    const monthStart = startOfMonth(addMonthsSafe(windowStart, m))
    const monthEnd = endOfMonth(monthStart)
    const isCurrent = monthStart.getFullYear() === now.getFullYear() && monthStart.getMonth() === now.getMonth()
    const lastDay = isCurrent ? now.getDate() : monthEnd.getDate()

    const weight = MONTH_WEIGHT[monthStart.getMonth()]!
    const monthlyBase = 143
    const target = Math.round(monthlyBase * weight * (isCurrent ? lastDay / monthEnd.getDate() : 1))

    for (let i = 0; i < target; i++) {
      // Weekend-heavy day selection.
      let day = rng.int(1, lastDay)
      const probe = new Date(monthStart.getFullYear(), monthStart.getMonth(), day)
      if (probe.getDay() !== 0 && probe.getDay() !== 6 && rng.chance(0.3)) {
        day = Math.min(lastDay, Math.max(1, day + rng.int(-2, 2)))
      }

      const date = new Date(monthStart.getFullYear(), monthStart.getMonth(), day)
      const dow = date.getDay()

      const sectorId = rng.weighted(SECTOR_WEIGHT)
      const wantedCategory = rng.weighted(
        FESTIVAL_MONTHS.has(monthStart.getMonth())
          ? ([['hundi', 40], ['pooja', 24], ['event', 10], ['membership', 2], ['activity', 16], ['project', 8]] as [DonationCategory, number][])
          : CATEGORY_WEIGHT,
      )

      const pool = CATALOG.filter((c) => c.sectorId === sectorId && c.category === wantedCategory && c.active)
      const item = pool.length > 0 ? rng.pick(pool) : rng.pick(CATALOG.filter((c) => c.sectorId === sectorId && c.category === 'hundi'))
      const category = item.category

      const tickets = item.ticketed ? rng.weighted([[1, 45], [2, 30], [3, 15], [4, 10]] as [number, number][]) : 1
      const amount = (item.price ?? pickAmount(rng, category)) * tickets

      // Sunday hundi cash is counted and entered on the Monday.
      const sundayCash = dow === 1 && category === 'hundi' && rng.chance(0.28)
      const method: PaymentMethod = sundayCash
        ? 'cash'
        : rng.weighted([
            ['card', 52],
            ['apple_pay', 24],
            ['google_pay', 9],
            ['cash', 11],
            ['cheque', 4],
          ] as [PaymentMethod, number][])

      // Evening peak for the digital methods.
      const hour =
        method === 'cash' || method === 'cheque'
          ? rng.int(9, 13)
          : rng.weighted([
              [rng.int(6, 9), 18],
              [rng.int(10, 16), 26],
              [rng.int(17, 21), 44],
              [rng.int(22, 23), 12],
            ])
      date.setHours(hour, rng.int(0, 59), rng.int(0, 59), 0)

      const isCardType = method === 'card' || method === 'apple_pay' || method === 'google_pay'
      const fee = isCardType ? cardFee(amount) : 0

      const donor = rng.pick(donors)
      const line: DonationLine = { itemId: item.id, category, amount }
      if (item.ticketed) line.quantity = tickets
      if (item.recurring) line.recurring = item.recurring
      if (item.needsDedication) {
        line.dedication = {
          name: donor.anonymous ? 'Anonymous devotee' : donor.name,
          nakshatra: rng.pick(NAKSHATRAS),
          gothram: rng.chance(0.75) ? rng.pick(GOTHRAMS) : undefined,
          date: format(addDays(date, rng.int(1, 20)), 'yyyy-MM-dd'),
        }
      }

      const ageDays = differenceInDays(now, date)
      // Seed gifts already carry a receipt and a journal entry, so none of them is left at "paid".
      let status: Donation['status'] = ageDays > 20 ? 'reconciled' : 'receipted'
      if (ageDays > 60 && rng.chance(0.55)) status = 'allotted'

      const year = date.getFullYear()
      receiptSeq[sectorId] += 1

      donations.push({
        id: `DN-${year}-${String(sequence++).padStart(6, '0')}`,
        receiptNo: `RCP-${SECTOR_CODE[sectorId]}-${String(year).slice(2)}-${String(receiptSeq[sectorId]).padStart(5, '0')}`,
        sectorId,
        donorId: donor.id,
        lines: [line],
        gross: amount,
        fee,
        net: amount - fee,
        method,
        status,
        createdAt: iso(date),
        squarePaymentId: isCardType
          ? `sqpmt_${Math.floor(rng.next() * 1e9).toString(36).toUpperCase().padStart(7, '0')}`
          : undefined,
        fundId: item.fundId,
        webhookAt: isCardType ? iso(new Date(date.getTime() + 4_000)) : undefined,
      })
    }
  }

  donations.sort((a, b) => a.createdAt.localeCompare(b.createdAt))

  // A few messy but real cases.
  const recent = donations.filter((d) => differenceInDays(now, new Date(d.createdAt)) < 90)
  const cardRecent = recent.filter((d) => d.method === 'card')
  if (cardRecent[4]) cardRecent[4].status = 'refunded'
  if (cardRecent[19]) cardRecent[19].status = 'refunded'
  if (cardRecent[31]) cardRecent[31].disputed = true
  if (cardRecent[44]) cardRecent[44].status = 'failed'
  if (cardRecent[58]) cardRecent[58].status = 'failed'

  return donations
}

function addMonthsSafe(date: Date, months: number): Date {
  return new Date(date.getFullYear(), date.getMonth() + months, 1)
}

/* ------------------------------------------------------------- suppliers */

/** Ghee drifts up over the year; flowers spike around festivals. */
function priceDrift(item: InventoryItem, date: Date, now: Date, rng: ReturnType<typeof createRng>): number {
  const monthsAgo = Math.max(0, differenceInDays(now, date) / 30)
  let factor = 1

  if (item.name.startsWith('Ghee')) factor *= 1 - 0.06 * (monthsAgo / 12)
  else if (item.category === 'Kitchen') factor *= 1 - 0.035 * (monthsAgo / 12)
  else factor *= 1 - 0.02 * (monthsAgo / 12)

  if (item.category === 'Flowers' && FESTIVAL_MONTHS.has(date.getMonth())) factor *= 1.18
  if (item.category === 'Prasadam' && FESTIVAL_MONTHS.has(date.getMonth())) factor *= 1.07

  return factor * (1 + rng.around(0, 0.025))
}

function makeSuppliers(rng: ReturnType<typeof createRng>, now: Date): Supplier[] {
  return SUPPLIER_SPECS.map((spec) => {
    const items = INVENTORY.filter((i) => spec.categories.includes(i.category))
    const priceHistory = items.flatMap((item) => {
      const points = []
      for (let d = 360; d >= 0; d -= 15) {
        const date = subDays(now, d)
        const unitPrice = Math.max(
          10,
          Math.round(item.lastUnitPrice * spec.priceLevel * priceDrift(item, date, now, rng)),
        )
        points.push({ itemId: item.id, date: format(date, 'yyyy-MM-dd'), unitPrice })
      }
      return points
    })

    return {
      id: spec.id,
      name: spec.name,
      city: spec.city,
      items: items.map((i) => i.id),
      rating: spec.rating,
      onTimePct: spec.onTimePct,
      rejectionPct: spec.rejectionPct,
      status: spec.status ?? 'active',
      orderCount: spec.orderCount,
      since: spec.since,
      note: spec.note,
      priceHistory,
    }
  })
}

/* ----------------------------------------------------- purchase orders etc */

const PO_STATUS_BY_AGE: [POStatus, number][][] = [
  // 0: fresh (< 14 days)
  [
    ['draft', 12],
    ['pending_ca', 34],
    ['approved', 18],
    ['sent', 20],
    ['partially_received', 8],
    ['received', 8],
  ],
  // 1: recent (14–60 days)
  [
    ['sent', 10],
    ['received', 18],
    ['invoiced', 16],
    ['payment_pending', 24],
    ['paid', 26],
    ['rejected', 6],
  ],
  // 2: older (> 60 days)
  [
    ['paid', 54],
    ['closed', 38],
    ['rejected', 5],
    ['cancelled', 3],
  ],
]

interface PoBundle {
  purchaseOrders: PurchaseOrder[]
  goodsReceipts: GoodsReceipt[]
  invoices: SupplierInvoice[]
}

function makePurchaseOrders(
  rng: ReturnType<typeof createRng>,
  suppliers: Supplier[],
  budgets: BudgetHead[],
  now: Date,
): PoBundle {
  const purchaseOrders: PurchaseOrder[] = []
  const goodsReceipts: GoodsReceipt[] = []
  const invoices: SupplierInvoice[] = []
  let poSeq = 1
  let grnSeq = 1
  let invSeq = 7701

  const activeSuppliers = suppliers.filter((s) => s.status === 'active')

  for (let i = 0; i < 120; i++) {
    const ageDays = Math.round(Math.pow(rng.next(), 0.7) * 350)
    const createdAt = subDays(now, ageDays)
    createdAt.setHours(rng.int(9, 17), rng.int(0, 59), 0, 0)

    const supplier = rng.pick(activeSuppliers)
    const supplierItems = INVENTORY.filter((item) => supplier.items.includes(item.id))
    if (supplierItems.length === 0) continue

    const sectorId = rng.weighted(SECTOR_WEIGHT)
    const eligibleItems = supplierItems.filter((item) =>
      (INVENTORY_SECTORS[item.id] ?? []).includes(sectorId),
    )
    const itemPool = eligibleItems.length > 0 ? eligibleItems : supplierItems
    const resolvedSector = eligibleItems.length > 0 ? sectorId : (INVENTORY_SECTORS[itemPool[0]!.id]?.[0] ?? 'temple')

    const headPool = budgets.filter((b) => b.sectorId === resolvedSector)
    if (headPool.length === 0) continue
    const budgetHead = rng.pick(headPool)

    const lineCount = rng.int(1, 4)
    const chosen = rng.shuffle(itemPool).slice(0, lineCount)
    const lines = chosen.map((item) => {
      const basePrice = supplier.priceHistory
        .filter((p) => p.itemId === item.id)
        .at(-1)?.unitPrice ?? item.lastUnitPrice
      return {
        itemId: item.id,
        // Order a sensible value of each item rather than a flat count, so a
        // tin of ghee and a bag of rice both come out as a realistic line.
        qty: Math.max(1, Math.round(rng.int(22_000, 185_000) / Math.max(1, basePrice))),
        unitPrice: Math.round(basePrice * (1 + rng.around(0, 0.03))),
      }
    })

    const total = lines.reduce((sum, l) => sum + l.qty * l.unitPrice, 0)
    const bucket = ageDays < 14 ? 0 : ageDays < 60 ? 1 : 2
    const status = rng.weighted(PO_STATUS_BY_AGE[bucket]!)

    const year = createdAt.getFullYear()
    const poNo = `PO-${year}-${String(poSeq++).padStart(4, '0')}`
    const id = `po-${poNo}`
    const preparedBy = 'u-proc'
    const expectedBy = iso(addDays(createdAt, rng.int(5, 21)))

    const timeline: PurchaseOrder['timeline'] = [
      { at: iso(createdAt), by: preparedBy, action: 'Purchase order prepared' },
    ]
    const approvals: PurchaseOrder['approvals'] = []

    const approvedAt = addDays(createdAt, rng.int(1, 4))
    const past = (s: POStatus) =>
      ['approved', 'sent', 'partially_received', 'received', 'invoiced', 'payment_pending', 'paid', 'closed'].includes(s)

    if (status === 'pending_ca') {
      timeline.push({ at: iso(addDays(createdAt, 0.2)), by: preparedBy, action: 'Submitted for CA approval' })
      approvals.push({ role: total > 100_000 ? 'ca_partner' : 'ca_staff' })
    } else if (status === 'rejected') {
      timeline.push({ at: iso(approvedAt), by: 'u-cas', action: 'Rejected', note: 'Quote above the 90-day median. Get two more quotes.' })
      approvals.push({ role: 'ca_staff', userId: 'u-cas', decision: 'rejected', at: iso(approvedAt), comment: 'Quote above the 90-day median. Get two more quotes.' })
    } else if (status === 'cancelled') {
      timeline.push({ at: iso(approvedAt), by: preparedBy, action: 'Cancelled', note: 'Requirement withdrawn by the store.' })
    } else if (past(status)) {
      const approver = total > 1_000_000 ? 'u-cap' : total > 100_000 ? 'u-cap' : 'u-cas'
      timeline.push({ at: iso(approvedAt), by: approver, action: 'Approved by CA', note: 'Budget checked and committed.' })
      approvals.push({ role: total > 100_000 ? 'ca_partner' : 'ca_staff', userId: approver, decision: 'approved', at: iso(approvedAt) })
    }

    let sentAt: Date | null = null
    if (['sent', 'partially_received', 'received', 'invoiced', 'payment_pending', 'paid', 'closed'].includes(status)) {
      sentAt = addDays(approvedAt, rng.int(0, 2))
      timeline.push({ at: iso(sentAt), by: preparedBy, action: 'Sent to supplier' })
    }

    // Goods receipt
    if (['partially_received', 'received', 'invoiced', 'payment_pending', 'paid', 'closed'].includes(status)) {
      const receivedAt = addDays(sentAt ?? approvedAt, rng.int(3, 14))
      const partial = status === 'partially_received'
      const grnNo = `GRN-${receivedAt.getFullYear()}-${String(grnSeq++).padStart(4, '0')}`
      goodsReceipts.push({
        id: `grn-${grnNo}`,
        grnNo,
        poId: id,
        receivedAt: iso(receivedAt),
        receivedBy: 'u-store',
        lines: lines.map((l, idx) => ({
          itemId: l.itemId,
          qtyReceived: partial && idx === 0 ? Math.max(1, Math.floor(l.qty * 0.6)) : l.qty,
        })),
        note: partial ? 'Balance promised next week. Supplier short on stock.' : undefined,
      })
      timeline.push({
        at: iso(receivedAt),
        by: 'u-store',
        action: partial ? 'Goods partially received' : 'Goods received',
        note: grnNo,
      })
    }

    // Invoice
    if (['invoiced', 'payment_pending', 'paid', 'closed'].includes(status)) {
      const invDate = addDays(sentAt ?? approvedAt, rng.int(6, 18))
      const variance = rng.chance(0.07)
      const invLines = lines.map((l, idx) => ({
        ...l,
        unitPrice: variance && idx === 0 ? Math.round(l.unitPrice * 1.065) : l.unitPrice,
      }))
      const invTotal = invLines.reduce((sum, l) => sum + l.qty * l.unitPrice, 0)
      const invoiceNo = `INV-${supplierCode(supplier.name)}-${invSeq++}`

      invoices.push({
        id: `inv-${invoiceNo}`,
        invoiceNo,
        poId: id,
        supplierId: supplier.id,
        sectorId: resolvedSector,
        date: iso(invDate),
        dueDate: iso(addDays(invDate, 30)),
        lines: invLines,
        total: invTotal,
        status:
          status === 'paid' || status === 'closed'
            ? 'paid'
            : variance
              ? 'variance'
              : status === 'payment_pending'
                ? 'payment_pending'
                : 'matched',
        preparedBy: 'u-proc',
        approvals:
          status === 'paid' || status === 'closed'
            ? [{ role: invTotal > 100_000 ? 'ca_partner' : 'ca_staff', userId: invTotal > 100_000 ? 'u-cap' : 'u-cas', decision: 'approved', at: iso(addDays(invDate, 3)) }]
            : [{ role: invTotal > 100_000 ? 'ca_partner' : 'ca_staff' }],
      })
      timeline.push({ at: iso(invDate), by: 'u-proc', action: 'Invoice received', note: invoiceNo })

      if (status === 'paid' || status === 'closed') {
        const paidAt = addDays(invDate, rng.int(4, 25))
        timeline.push({ at: iso(paidAt), by: 'u-cap', action: 'Payment approved and released' })
      }
    }

    purchaseOrders.push({
      id,
      poNo,
      sectorId: resolvedSector,
      supplierId: supplier.id,
      budgetHeadId: budgetHead.id,
      lines,
      total,
      status,
      aiRank: rng.weighted([
        [1, 72],
        [2, 18],
        [3, 10],
      ]),
      timeline,
      createdAt: iso(createdAt),
      preparedBy,
      approvals,
      expectedBy,
    })
  }

  // One override with a reason, so the AI-override rule is visible in the data.
  const overridden = purchaseOrders.find((po) => po.aiRank === 3 && po.status !== 'draft')
  if (overridden) {
    overridden.overrideReason =
      'Rank 1 supplier could not deliver before the Navaratri weekend; this supplier confirmed stock in writing.'
  }

  purchaseOrders.sort((a, b) => b.createdAt.localeCompare(a.createdAt))
  return { purchaseOrders, goodsReceipts, invoices }
}

/* ------------------------------------------------------------- allotments */

function makeAllotments(
  rng: ReturnType<typeof createRng>,
  budgets: BudgetHead[],
  now: Date,
): Allotment[] {
  const allotments: Allotment[] = []
  let seq = 1

  // Historical, approved: these are what built up each head's allocation.
  for (const head of budgets) {
    const slices = rng.int(2, 3)
    let remaining = head.allocated
    for (let i = 0; i < slices; i++) {
      const last = i === slices - 1
      const amount = last ? remaining : Math.round(remaining * rng.around(0.45, 0.12))
      remaining -= amount
      if (amount <= 0) continue

      const at = subDays(now, rng.int(40, 330))
      const approver = amount > 1_000_000 ? 'u-cap' : amount > 100_000 ? 'u-cap' : 'u-cas'
      allotments.push({
        id: `alt-${String(seq++).padStart(4, '0')}`,
        sectorId: head.sectorId,
        fromFundId: head.fundId,
        toBudgetHeadId: head.id,
        amount,
        reason: `${head.period} allocation for ${head.name.toLowerCase()}`,
        preparedBy: 'u-adm',
        preparedAt: iso(at),
        status: 'approved',
        approvals: [
          { role: amount > 100_000 ? 'ca_partner' : 'ca_staff', userId: approver, decision: 'approved', at: iso(addDays(at, 1)) },
          ...(amount > 1_000_000
            ? [{ role: 'trustee', userId: 'u-tru', decision: 'approved' as const, at: iso(addDays(at, 2)) }]
            : []),
        ],
      })
    }
  }

  // Waiting on someone right now.
  const pendingHeads = rng.shuffle([...budgets]).slice(0, 8)
  for (const head of pendingHeads) {
    const at = subDays(now, rng.int(1, 11))
    const amount = rng.pick([150_000, 280_000, 420_000, 650_000, 1_100_000, 1_850_000])
    allotments.push({
      id: `alt-${String(seq++).padStart(4, '0')}`,
      sectorId: head.sectorId,
      fromFundId: head.fundId,
      toBudgetHeadId: head.id,
      amount,
      reason: rng.pick([
        'Festival season top-up; current allocation is nearly exhausted.',
        'Price increases on staples since the last allocation.',
        'Additional programme days approved by the trustees.',
        'Carry-forward of unspent restricted donations into this head.',
      ]),
      preparedBy: rng.pick(['u-adm', 'u-cas']),
      preparedAt: iso(at),
      status: 'pending',
      approvals: amount > 1_000_000
        ? [{ role: 'ca_partner' }, { role: 'trustee' }]
        : [{ role: amount > 100_000 ? 'ca_partner' : 'ca_staff' }],
    })
  }

  return allotments.sort((a, b) => b.preparedAt.localeCompare(a.preparedAt))
}

/* ----------------------------------------------------- inventory requests */

function makeInventoryRequests(rng: ReturnType<typeof createRng>, now: Date): InventoryRequest[] {
  const requests: InventoryRequest[] = []
  const low = INVENTORY.filter((i) => i.stock <= i.reorderLevel * 1.4)
  // One open request per item — two identical rows side by side read as a bug.
  const seen = new Set<string>()
  const pool = rng
    .shuffle([...low, ...rng.shuffle([...INVENTORY]).slice(0, 14)])
    .filter((item) => (seen.has(item.id) ? false : seen.add(item.id)))
    .slice(0, 22)

  pool.forEach((item, i) => {
    const at = subDays(now, rng.int(0, 45))
    const status: InventoryRequest['status'] = i < 9 ? 'pending' : rng.weighted([
      ['approved', 70],
      ['rejected', 10],
      ['draft', 20],
    ] as [InventoryRequest['status'], number][])

    requests.push({
      id: `req-${String(i + 1).padStart(4, '0')}`,
      sectorId: item.sectorId,
      itemId: item.id,
      qty: Math.max(item.reorderLevel, rng.int(item.reorderLevel, item.reorderLevel * 3)),
      neededBy: iso(addDays(at, rng.int(5, 20))),
      requestedBy: 'u-store',
      requestedAt: iso(at),
      status,
      note:
        item.stock < item.reorderLevel
          ? `Stock is below the reorder level (${item.stock} ${item.unit} left).`
          : undefined,
    })
  })

  return requests.sort((a, b) => b.requestedAt.localeCompare(a.requestedAt))
}

/* ---------------------------------------------------------------- payouts */

function makePayouts(rng: ReturnType<typeof createRng>, donations: Donation[], now: Date): SquarePayout[] {
  const payouts: SquarePayout[] = []
  const cardDonations = donations.filter(
    (d) => d.squarePaymentId && d.status !== 'failed' && d.status !== 'refunded',
  )

  // Weekly batches for older weeks, daily payouts for the last three weeks.
  const windows: { end: Date; start: Date; key: string }[] = []
  for (let w = 15; w >= 3; w--) {
    const end = subDays(now, w * 7)
    windows.push({ end, start: subDays(end, 7), key: `w${w}` })
  }
  for (let d = 20; d >= 1; d--) {
    const end = subDays(now, d)
    windows.push({ end, start: subDays(end, 1), key: `d${d}` })
  }
  for (const { end, start, key } of windows) {
    const batch = cardDonations.filter((d) => {
      const t = new Date(d.createdAt).getTime()
      return t >= start.getTime() && t < end.getTime()
    })
    if (batch.length === 0) continue

    const gross = batch.reduce((s, d) => s + d.gross, 0)
    const fee = batch.reduce((s, d) => s + d.fee, 0)
    payouts.push({
      id: `payout-${key}`,
      payoutRef: `SQ-PO-${format(end, 'yyyyMMdd')}-${String(rng.int(100, 999))}`,
      date: iso(end),
      gross,
      fee,
      net: gross - fee,
      donationIds: batch.map((d) => d.id),
      status: 'matched',
      ledgerNet: gross - fee,
      bankCredit: gross - fee,
      bankRef: `ACH-${format(end, 'MMdd')}-${rng.int(10000, 99999)}`,
      bankDate: iso(addDays(end, 1)),
    })
  }

  // Three payouts that do not tie out — the CA team has to chase these.
  const unmatchedNotes = [
    'Bank credit is $18.40 short of the Square statement. Chargeback fee suspected.',
    'Two card donations in this batch have no matching ledger entry.',
    'Payout split across two bank credits; only one has landed.',
  ]
  payouts.slice(-4, -1).forEach((payout, i) => {
    payout.status = i === 1 ? 'partial' : 'unmatched'
    payout.note = unmatchedNotes[i]
    // Each one breaks on a different side of the three-way tie.
    if (i === 0) payout.bankCredit = payout.net - 1840
    if (i === 1) payout.bankCredit = Math.round(payout.net * 0.55)
    if (i === 2) {
      const missing = donations.filter((d) => payout.donationIds.slice(0, 2).includes(d.id))
      payout.ledgerNet = payout.net - missing.reduce((s, d) => s + d.net, 0)
    }
  })

  return payouts.reverse()
}

/* ---------------------------------------------------------------- ledger */

function makeJournal(
  donations: Donation[],
  allotments: Allotment[],
  purchaseOrders: PurchaseOrder[],
  invoices: SupplierInvoice[],
  funds: Fund[],
  openingByFund: Record<string, number>,
): JournalEntry[] {
  const entries: JournalEntry[] = []

  for (const fund of funds) {
    const opening = openingByFund[fund.id] ?? 0
    if (opening <= 0) continue
    entries.push({
      id: `je-open-${fund.id}`,
      date: '2025-11-01T00:00:00.000Z',
      sectorId: fund.sectorId,
      memo: `Opening balance — ${fund.name}`,
      lines: [
        { account: 'Bank', fundId: fund.id, debit: opening, credit: 0 },
        { account: 'Fund balance', fundId: fund.id, debit: 0, credit: opening },
      ],
      sourceRef: `OPENING/${fund.id}`,
    })
  }

  for (const d of donations) {
    if (d.status === 'failed') continue
    const lines = [
      { account: 'Bank', fundId: d.fundId, debit: d.net, credit: 0 },
      ...(d.fee > 0 ? [{ account: 'Payment processing fees', fundId: d.fundId, debit: d.fee, credit: 0 }] : []),
      { account: 'Donation income', fundId: d.fundId, debit: 0, credit: d.gross },
    ]
    entries.push({
      id: `je-${d.id}`,
      date: d.createdAt,
      sectorId: d.sectorId,
      memo: `Donation received — ${d.receiptNo}`,
      lines,
      sourceRef: d.id,
    })

    if (d.status === 'refunded') {
      entries.push({
        id: `je-rev-${d.id}`,
        date: d.createdAt,
        sectorId: d.sectorId,
        memo: `Refund of ${d.receiptNo} — reversal entry`,
        lines: [
          { account: 'Donation income', fundId: d.fundId, debit: d.gross, credit: 0 },
          { account: 'Bank', fundId: d.fundId, debit: 0, credit: d.gross },
        ],
        sourceRef: d.id,
        reversalOf: `je-${d.id}`,
      })
    }
  }

  for (const a of allotments) {
    if (a.status !== 'approved') continue
    entries.push({
      id: `je-${a.id}`,
      date: a.approvals.at(-1)?.at ?? a.preparedAt,
      sectorId: a.sectorId,
      memo: `Fund allotment — ${a.reason}`,
      lines: [
        { account: 'Fund allotted', fundId: a.fromFundId, debit: a.amount, credit: 0 },
        { account: 'Budget allocation', fundId: a.fromFundId, debit: 0, credit: a.amount },
      ],
      sourceRef: a.id,
    })
  }

  const poById = new Map(purchaseOrders.map((po) => [po.id, po]))
  for (const inv of invoices) {
    if (inv.status !== 'paid') continue
    const po = poById.get(inv.poId)
    if (!po) continue
    entries.push({
      id: `je-${inv.id}`,
      date: inv.dueDate,
      sectorId: inv.sectorId,
      memo: `Supplier payment — ${inv.invoiceNo} against ${po.poNo}`,
      lines: [
        { account: 'Programme expenditure', fundId: po.budgetHeadId, debit: inv.total, credit: 0 },
        { account: 'Bank', fundId: po.budgetHeadId, debit: 0, credit: inv.total },
      ],
      sourceRef: inv.id,
    })
  }

  return entries.sort((a, b) => b.date.localeCompare(a.date))
}

/* ----------------------------------------------------------------- audit */

const AUDIT_ACTIONS: { action: string; entity: string }[] = [
  { action: 'Approved fund allotment', entity: 'Allotment' },
  { action: 'Approved purchase order', entity: 'Purchase order' },
  { action: 'Rejected purchase order', entity: 'Purchase order' },
  { action: 'Recorded goods receipt', entity: 'Goods receipt' },
  { action: 'Approved supplier payment', entity: 'Invoice' },
  { action: 'Reconciled Square payout', entity: 'Payout' },
  { action: 'Updated catalog item price', entity: 'Catalog item' },
  { action: 'Blocked supplier', entity: 'Supplier' },
  { action: 'Raised inventory request', entity: 'Inventory request' },
  { action: 'Issued refund', entity: 'Donation' },
]

function makeAudit(
  rng: ReturnType<typeof createRng>,
  purchaseOrders: PurchaseOrder[],
  allotments: Allotment[],
  now: Date,
): AuditEvent[] {
  const events: AuditEvent[] = []
  const actors = [
    { id: 'u-cas', name: 'Anitha Rajan', role: 'ca_staff' as const },
    { id: 'u-cap', name: 'R. Balasubramanian', role: 'ca_partner' as const },
    { id: 'u-proc', name: 'Dinesh Kumar', role: 'procurement_officer' as const },
    { id: 'u-store', name: 'Vasanthi Murugan', role: 'store_keeper' as const },
    { id: 'u-adm', name: 'Saravanan Pillai', role: 'sector_admin' as const },
    { id: 'u-tru', name: 'Meenakshi Sundaram', role: 'trustee' as const },
  ]

  for (let i = 0; i < 280; i++) {
    const at = subDays(now, Math.round(Math.pow(rng.next(), 1.6) * 300))
    at.setHours(rng.int(8, 19), rng.int(0, 59), rng.int(0, 59), 0)
    const spec = rng.pick(AUDIT_ACTIONS)
    const actor = rng.pick(actors)
    const ref =
      spec.entity === 'Purchase order'
        ? rng.pick(purchaseOrders).poNo
        : spec.entity === 'Allotment'
          ? rng.pick(allotments).id
          : `${spec.entity.slice(0, 3).toUpperCase()}-${rng.int(1000, 9999)}`

    events.push({
      id: `aud-${String(i + 1).padStart(5, '0')}`,
      at: iso(at),
      userId: actor.id,
      userName: actor.name,
      role: actor.role,
      action: spec.action,
      entity: spec.entity,
      entityId: ref,
      sectorId: rng.weighted(SECTOR_WEIGHT),
      before: spec.action.startsWith('Approved') ? 'pending' : undefined,
      after: spec.action.startsWith('Approved') ? 'approved' : undefined,
    })
  }

  return events.sort((a, b) => b.at.localeCompare(a.at))
}

/* ------------------------------------------------- the awkward real cases */

/**
 * Random data is too tidy. A real month always contains a part-delivery, a bill
 * that does not match, and something paid only last week. These are pinned so
 * the console always has a genuine problem to show, not just happy paths.
 */
function forceRealCases(
  purchaseOrders: PurchaseOrder[],
  goodsReceipts: GoodsReceipt[],
  invoices: SupplierInvoice[],
  now: Date,
): void {
  // One PO stuck half-delivered, with the balance still owed.
  const candidate =
    purchaseOrders.find((po) => po.status === 'sent' && po.lines.length > 1) ??
    purchaseOrders.find((po) => po.status === 'sent')
  if (candidate) {
    candidate.status = 'partially_received'
    const receivedAt = subDays(now, 4)
    const grnNo = `GRN-${receivedAt.getFullYear()}-0${goodsReceipts.length + 120}`
    goodsReceipts.push({
      id: `grn-${grnNo}`,
      grnNo,
      poId: candidate.id,
      receivedAt: iso(receivedAt),
      receivedBy: 'u-store',
      lines: candidate.lines.map((line, i) => ({
        itemId: line.itemId,
        qtyReceived: i === 0 ? Math.max(1, Math.floor(line.qty * 0.55)) : line.qty,
      })),
      note: 'Short by the balance on the first line. Supplier promised the rest next week.',
    })
    candidate.timeline.push({
      at: iso(receivedAt),
      by: 'u-store',
      action: 'Goods partially received',
      note: grnNo,
    })
  }

  // Keep some supplier payments landing inside the current month, so the
  // dashboard never opens on a month with no outgo at all.
  const recentlyPaid = invoices.filter((inv) => inv.status === 'paid').slice(0, 6)
  recentlyPaid.forEach((inv, i) => {
    const paidAt = subDays(now, 2 + i * 3)
    inv.date = iso(paidAt)
    inv.dueDate = iso(addDays(paidAt, 30))
  })

  // One bill that does not agree with the order, still open and still blocking
  // its own payment. Without this, a variance can hide behind an already-paid
  // invoice and the 3-way match never has anything to catch.
  const open = invoices.find((inv) => inv.status === 'payment_pending' || inv.status === 'matched')
  if (open && open.lines[0]) {
    open.lines[0] = { ...open.lines[0], unitPrice: Math.round(open.lines[0].unitPrice * 1.065) }
    open.total = open.lines.reduce((sum, l) => sum + l.qty * l.unitPrice, 0)
    open.status = 'variance'
  }
}

/* ------------------------------------------------------------ assembly */

export function generateDatabase(now = new Date()): Database {
  const rng = createRng(SEED)

  const donors = makeDonors(rng, now)
  const donations = makeDonations(rng, donors, now)
  const suppliers = makeSuppliers(rng, now)

  const period = `FY ${now.getFullYear()}`
  const budgets: BudgetHead[] = BUDGET_SPECS.map((spec) => ({
    id: spec.id,
    sectorId: spec.sectorId,
    name: spec.name,
    period,
    fundId: spec.fundId,
    allocated: spec.allocated,
    committed: 0,
    spent: 0,
    projectId: spec.projectId,
  }))

  const { purchaseOrders, goodsReceipts, invoices } = makePurchaseOrders(rng, suppliers, budgets, now)

  forceRealCases(purchaseOrders, goodsReceipts, invoices, now)
  stageReleaseCase(invoices)

  // Budget effects follow the same rules the store applies to live actions.
  const COMMITTED: POStatus[] = ['approved', 'sent', 'partially_received', 'received', 'invoiced', 'payment_pending']
  const SPENT: POStatus[] = ['paid', 'closed']
  const invoiceByPo = new Map(invoices.map((inv) => [inv.poId, inv]))

  for (const po of purchaseOrders) {
    const head = budgets.find((b) => b.id === po.budgetHeadId)
    if (!head) continue
    if (COMMITTED.includes(po.status)) head.committed += po.total
    else if (SPENT.includes(po.status)) head.spent += invoiceByPo.get(po.id)?.total ?? po.total
  }

  /*
   * Size each allocation to the year's actual activity. Fixed figures left
   * most heads sitting at 2% used, which told the CA nothing and made the
   * budget page look broken. Each head now lands in a believable band, and
   * the allotments below are generated to add up to it.
   */
  for (const head of budgets) {
    const used = head.committed + head.spent
    // Capital project heads are drawn down slowly and must keep enough headroom
    // for a single large order, so the Partner-plus-Trustee tier is reachable.
    const target = head.projectId ? rng.around(0.22, 0.06) : rng.around(0.68, 0.11)
    const floor = head.projectId ? 6_000_000 : 600_000
    head.allocated = Math.max(floor, Math.round(used / Math.max(0.15, target) / 10_000) * 10_000)
  }

  // Keep one head genuinely over budget, as a case the CA team must handle.
  const overHead = budgets.find((b) => b.id === 'bh-tmp-flowers')
  if (overHead) {
    overHead.allocated = Math.round(((overHead.committed + overHead.spent) / 1.13 / 10_000)) * 10_000
  }

  const allotments = makeAllotments(rng, budgets, now)

  const inventoryRequests = makeInventoryRequests(rng, now)
  const payouts = makePayouts(rng, donations, now)

  // Fund balances: opening + donations in − approved allotments out.
  const inflow: Record<string, number> = {}
  for (const d of donations) {
    if (d.status === 'failed' || d.status === 'refunded') continue
    inflow[d.fundId] = (inflow[d.fundId] ?? 0) + d.net
  }
  const outflow: Record<string, number> = {}
  for (const a of allotments) {
    if (a.status !== 'approved') continue
    outflow[a.fromFundId] = (outflow[a.fromFundId] ?? 0) + a.amount
  }

  const openingByFund: Record<string, number> = {}
  const funds: Fund[] = FUNDS.map((fund) => {
    const inn = inflow[fund.id] ?? 0
    const out = outflow[fund.id] ?? 0
    // Reserves carried in from earlier years, so each fund can actually cover
    // what has been allotted out of it and still show a working balance.
    const opening = Math.max(0, out - inn) + Math.round(rng.around(4_200_000, 1_600_000))
    openingByFund[fund.id] = opening
    return { ...fund, balance: opening + inn - out }
  })

  const journal = makeJournal(donations, allotments, purchaseOrders, invoices, funds, openingByFund)
  const audit = makeAudit(rng, purchaseOrders, allotments, now)
  const cashCounts = makeCashCounts(now)
  const periodCloses = makePeriodCloses(now)
  const tenants = makeTenants(now)

  const inventory = INVENTORY.map((item) => ({ ...item }))
  const projects: Project[] = PROJECTS.map((p) => ({ ...p }))

  const stamp = <T extends { tenantId?: string }>(rows: T[]): T[] =>
    rows.map((r) => ({ ...r, tenantId: DEMO_TENANT_ID }))

  return {
    donors,
    donations: stamp(donations),
    funds,
    projects,
    journal: stamp(journal),
    budgets,
    allotments: stamp(allotments),
    inventory,
    inventoryRequests,
    suppliers,
    purchaseOrders: stamp(purchaseOrders),
    goodsReceipts,
    invoices: stamp(invoices),
    payouts,
    audit: stamp(audit),
    cashCounts,
    periodCloses,
    tenants,
  }
}

/* ------------------------------------------------ flow-alignment seed data */

/** One invoice that is fully approved and waiting for someone to release the money. */
function stageReleaseCase(invoices: SupplierInvoice[]): void {
  const candidate = invoices.find((inv) => inv.status === 'payment_pending' && inv.approvals.every((a) => a.decision !== 'rejected'))
  if (!candidate) return
  candidate.approvals = candidate.approvals.map((step) => ({
    ...step,
    userId: step.role === 'trustee' ? 'u-tru' : step.role === 'ca_partner' ? 'u-cap' : 'u-cas',
    decision: 'approved' as const,
    at: candidate.date,
  }))
  candidate.status = 'approved'
}

/** Counter cash waiting for the second person to confirm the count. */
function makeCashCounts(now: Date): CashCount[] {
  const at = (hoursAgo: number) => iso(new Date(now.getTime() - hoursAgo * 3_600_000))
  return [
    { id: 'cc-seed-1', sectorId: 'temple', itemId: 'cat-tmp-hundi', amount: 184_200, note: 'Sunday hundi, main sanctum. Notes and coins counted together.', countedBy: 'u-store', countedAt: at(20), status: 'pending' },
    { id: 'cc-seed-2', sectorId: 'temple', itemId: 'cat-tmp-hundi', amount: 61_500, note: 'Annadhanam hall box.', countedBy: 'u-adm', countedAt: at(44), status: 'pending' },
    { id: 'cc-seed-3', sectorId: 'sangam', itemId: 'cat-sgm-support', amount: 38_000, note: 'Cash collected at the Sunday class counter.', countedBy: 'u-store', countedAt: at(70), status: 'pending' },
  ]
}

/** Twelve months of period state. The last month is still open for the CA to close. */
function makePeriodCloses(now: Date): PeriodClose[] {
  const closes: PeriodClose[] = []
  for (let i = 11; i >= 0; i--) {
    const start = startOfMonth(subMonths(now, i))
    const closedAt = addDays(endOfMonth(start), 4)
    const closed = i >= 2
    closes.push({
      id: `pc-${format(start, 'yyyy-MM')}`,
      period: format(start, 'yyyy-MM'),
      status: closed ? 'closed' : 'open',
      preparedBy: closed ? 'u-cas' : undefined,
      preparedAt: closed ? iso(subDays(closedAt, 1)) : undefined,
      closedBy: closed ? 'u-cap' : undefined,
      closedAt: closed ? iso(closedAt) : undefined,
    })
  }
  return closes
}

function makeTenants(now: Date): Tenant[] {
  return [
    {
      id: DEMO_TENANT_ID,
      name: 'Kaveri Heritage',
      address: '14 Temple Street, Madurai 625001',
      domain: 'give.kaveritrust.org',
      brand: 'kumkum',
      logoText: 'KH',
      verticals: ['temple', 'sevalaya', 'sangam'],
      modules: ['donations', 'reconciliation', 'budgets', 'inventory', 'procurement', 'payments', 'reports'],
      squareLocationId: 'L8K2M4Q7ZP',
      thresholds: { ...DEFAULT_THRESHOLDS },
      users: USERS.filter((u) => u.role !== 'devotee' && u.role !== 'super_admin').map((u) => ({
        id: u.id,
        name: u.name,
        email: u.email,
        role: u.role,
      })),
      catalogLoaded: true,
      status: 'live',
      createdAt: iso(subMonths(now, 14)),
    },
  ]
}
