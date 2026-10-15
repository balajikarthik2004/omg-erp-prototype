import { addDays, subDays } from 'date-fns'

import { suggestForCategory, growthDefaultFor } from '@/features/events/logic/budget'
import { calculatePnl } from '@/features/events/logic/pnl'
import { generateDesigns } from '@/features/events/logic/poster'
import { issueTicketToken } from '@/features/events/logic/tickets'
import { createRng, SEED } from '@/lib/rng'
import type {
  CategoryActual,
  EventApproval,
  EventBudgetLine,
  EventOrder,
  EventRecord,
  EventRegistration,
  EventsData,
  Fund,
  JournalEntry,
  PosterDesign,
  SectorId,
} from '@/types'
import { DONOR_FIRST, DONOR_LAST } from './seed'

/** Past spend per event type. The budget formula reads this; closing an event adds to it. */
const ACTUALS: CategoryActual[] = [
  // Navaratri 2025 totalled $7,100.00. One year of history each, so the formula applies the 10% default: $7,810.00.
  { eventType: 'NAVARATRI', year: 2025, category: 'Prasadam & Annadhanam', actual: 300_000 },
  { eventType: 'NAVARATRI', year: 2025, category: 'Decoration & Stage', actual: 160_000 },
  { eventType: 'NAVARATRI', year: 2025, category: 'Sound & Light', actual: 70_000 },
  { eventType: 'NAVARATRI', year: 2025, category: 'Flowers & Garlands', actual: 90_000 },
  { eventType: 'NAVARATRI', year: 2025, category: 'Priests & Archakas Dakshina', actual: 60_000 },
  { eventType: 'NAVARATRI', year: 2025, category: 'Printing & Notices', actual: 30_000 },
  // Programmes have two years of history, so the formula uses the real trend.
  { eventType: 'PROGRAM', year: 2024, category: 'Hall & venue', actual: 102_000 },
  { eventType: 'PROGRAM', year: 2025, category: 'Hall & venue', actual: 110_000 },
  { eventType: 'PROGRAM', year: 2024, category: 'Catering & refreshments', actual: 50_000 },
  { eventType: 'PROGRAM', year: 2025, category: 'Catering & refreshments', actual: 55_000 },
  { eventType: 'PROGRAM', year: 2025, category: 'Stage, decor & illumination', actual: 35_000 },
  { eventType: 'PROGRAM', year: 2025, category: 'Printing & promotional materials', actual: 18_000 },
  { eventType: 'PROGRAM', year: 2025, category: 'Audio & photography', actual: 9_000 },
  { eventType: 'SEVA', year: 2024, category: 'Food & Provisions', actual: 90_000 },
  { eventType: 'SEVA', year: 2025, category: 'Food & Provisions', actual: 100_000 },
  { eventType: 'SEVA', year: 2025, category: 'Education Kits', actual: 48_000 },
  { eventType: 'SEVA', year: 2025, category: 'Logistics & Travel', actual: 28_000 },
  { eventType: 'FESTIVAL', year: 2025, category: 'Prasadam & Annadhanam', actual: 200_000 },
  { eventType: 'FESTIVAL', year: 2025, category: 'Decoration & Stage', actual: 120_000 },
  { eventType: 'FESTIVAL', year: 2025, category: 'Flowers & Garlands', actual: 60_000 },
]

type LineDef = { category: string; requested?: number; approved?: number }

const GENERAL_FUND: Record<SectorId, string> = { temple: 'fund-tmp-gen', sevalaya: 'fund-sev-gen', sangam: 'fund-sgm-gen' }

export interface EventsSeed {
  data: EventsData
  /** Event funds to add to the ledger's fund list. */
  funds: Fund[]
  journal: JournalEntry[]
  /** How much each general fund gave up to set money aside for events. */
  generalFundDelta: Record<string, number>
}

export function makeEventsSeed(now: Date): EventsSeed {
  const rng = createRng(SEED + 7)
  const at = (days: number, hour = 10) => {
    const d = days >= 0 ? addDays(now, days) : subDays(now, -days)
    d.setHours(hour, 0, 0, 0)
    return d.toISOString()
  }

  const events: EventRecord[] = []
  const lines: EventBudgetLine[] = []
  const approvals: EventApproval[] = []
  const posters: PosterDesign[] = []
  const registrations: EventRegistration[] = []
  const sponsors: EventsData['eventSponsors'] = []
  const donations: EventsData['eventDonations'] = []
  const orders: EventOrder[] = []
  const funds: Fund[] = []
  const journal: JournalEntry[] = []
  const delta: Record<string, number> = {}

  const base = (e: Partial<EventRecord> & Pick<EventRecord, 'id' | 'sectorId' | 'eventType' | 'name' | 'startAt' | 'endAt' | 'venue' | 'status'>): EventRecord => ({
    contactName: 'Temple Office',
    contactPhone: '+1 555 0142',
    isPaid: false,
    posterStatus: 'none',
    createdBy: 'u-adm',
    createdAt: at(-60),
    updatedAt: at(-3),
    ...e,
  })

  /** Cost lines for an event, suggested by the same formula the app uses live. */
  function addLines(eventId: string, eventType: string, defs: LineDef[]): EventBudgetLine[] {
    const made = defs.map((d, i) => {
      const history = ACTUALS.filter((a) => a.eventType === eventType && a.category === d.category).map((a) => ({ year: a.year, actual: a.actual }))
      const s = suggestForCategory(d.category, history, { defaultSingleYearGrowth: growthDefaultFor(eventType) })
      return {
        id: `${eventId}-bl${i + 1}`,
        eventId,
        category: d.category,
        history: s.history,
        suggestedAmount: s.suggested ?? undefined,
        suggestionNote: s.note,
        requestedAmount: d.requested ?? s.suggested ?? 0,
        approvedAmount: d.approved,
      } satisfies EventBudgetLine
    })
    lines.push(...made)
    return made
  }

  function approve(eventId: string, step: 1 | 2, by: string, preparedBy: string, comment: string, when: string, d: 'approved' | 'rejected' = 'approved') {
    approvals.push({
      id: `appr-${eventId}-${approvals.length + 1}`,
      entityType: 'event_budget',
      entityId: eventId,
      step,
      requiredRole: step === 1 ? 'ca' : 'trustee',
      preparedBy,
      decidedBy: by,
      decision: d,
      comment,
      createdAt: when,
      decidedAt: when,
    })
  }

  function pending(eventId: string, type: EventApproval['entityType'], step: number, role: EventApproval['requiredRole'], preparedBy: string, when: string) {
    approvals.push({ id: `appr-${eventId}-${approvals.length + 1}`, entityType: type, entityId: eventId, step, requiredRole: role, preparedBy, createdAt: when })
  }

  function makePosters(event: EventRecord, selected: boolean): PosterDesign[] {
    let n = 0
    const designs = generateDesigns(event, 1, 'u-adm', () => `des-${event.id}-${++n}`)
    posters.push(...designs)
    if (selected) event.selectedPosterDesignId = designs[0]!.id
    return designs
  }

  function register(event: EventRecord, count: number, checkedIn: number) {
    for (let i = 0; i < count; i++) {
      const qty = rng.weighted([[1, 40], [2, 30], [3, 15], [4, 10], [5, 5]] as [number, number][])
      const id = `reg-${event.id.slice(4, 10)}-${i + 1}`
      registrations.push({
        id,
        eventId: event.id,
        name: `${rng.pick(DONOR_FIRST)} ${rng.pick(DONOR_LAST)}`,
        phone: `+1 ${rng.int(201, 989)} ${rng.int(200, 999)} ${rng.int(1000, 9999)}`,
        qty,
        amountPaid: event.isPaid ? (event.ticketPrice ?? 0) * qty : 0,
        paymentRef: event.isPaid ? `pay-${rng.int(100000, 999999)}` : undefined,
        ticketToken: issueTicketToken(event.id, id, qty),
        checkedInAt: i < checkedIn ? at(-1, 18 + (i % 3)) : undefined,
        status: 'active',
        createdAt: at(-rng.int(1, 14), rng.int(8, 21)),
      })
    }
  }

  function order(event: EventRecord, lineIndex: number, o: Pick<EventOrder, 'vendorName' | 'itemDescription' | 'amount' | 'status'> & Partial<EventOrder>) {
    const eventLines = lines.filter((l) => l.eventId === event.id)
    orders.push({
      id: `po-${event.id.slice(4, 10)}-${orders.filter((x) => x.eventId === event.id).length + 1}`,
      eventId: event.id,
      budgetLineId: eventLines[lineIndex]!.id,
      preparedBy: 'u-adm',
      createdAt: at(-8),
      ...o,
    })
  }

  /** Set money aside for a confirmed event, then book what has happened since into its fund and the ledger. */
  function fund(event: EventRecord, confirmedOn: string) {
    const budget = lines.filter((l) => l.eventId === event.id).reduce((s, l) => s + (l.approvedAmount ?? l.requestedAmount), 0)
    const id = `fund-evt-${event.id}`
    const general = GENERAL_FUND[event.sectorId]
    event.fundId = id
    delta[general] = (delta[general] ?? 0) + budget

    const pnl = calculatePnl({ events, eventBudgetLines: lines, eventApprovals: approvals, eventPosters: posters, eventRegistrations: registrations, eventSponsors: sponsors, eventDonations: donations, eventOrders: orders, eventActuals: ACTUALS }, event.id)
    const income = pnl.ticketIncome + pnl.sponsorIncome + pnl.donationIncome
    funds.push({ id, sectorId: event.sectorId, name: `${event.name} Fund`, type: 'restricted', eventId: event.id, balance: budget + income - pnl.expenses })

    const entry = (suffix: string, date: string, memo: string, l: JournalEntry['lines']) =>
      journal.push({ id: `je-evt-${event.id}-${suffix}`, date, sectorId: event.sectorId, memo, lines: l, sourceRef: event.id })
    entry('alloc', confirmedOn, `Event fund set aside — ${event.name}`, [
      { account: 'Fund allotted', fundId: general, debit: budget, credit: 0 },
      { account: 'Event fund allocation', fundId: id, debit: 0, credit: budget },
    ])
    const income1 = (suffix: string, amount: number, label: string) => {
      if (amount > 0) entry(suffix, at(-2), `${label} — ${event.name}`, [{ account: 'Bank', fundId: id, debit: amount, credit: 0 }, { account: 'Event income', fundId: id, debit: 0, credit: amount }])
    }
    income1('tickets', pnl.ticketIncome, 'Ticket sales')
    income1('sponsors', pnl.sponsorIncome, 'Cash sponsorship')
    income1('donations', pnl.donationIncome, 'Event donations')
    if (pnl.expenses > 0) {
      entry('spend', at(-3), `Event expenses paid — ${event.name}`, [
        { account: 'Event expenditure', fundId: id, debit: pnl.expenses, credit: 0 },
        { account: 'Bank', fundId: id, debit: 0, credit: pnl.expenses },
      ])
    }
  }

  /* 1. Last year's Navaratri: closed. Its actuals are what this year's suggestion is built from. */
  const navOld = base({ id: 'evt-navaratri-2025', sectorId: 'temple', eventType: 'NAVARATRI', name: 'Navaratri Mahotsavam 2025', startAt: at(-385, 18), endAt: at(-376, 21), venue: 'Main Mandapam', chiefGuest: 'Sri Ramanathan Iyer', status: 'closed', posterStatus: 'published', capacity: 1500, createdAt: at(-450) })
  events.push(navOld)
  addLines(navOld.id, 'NAVARATRI', ACTUALS.filter((a) => a.eventType === 'NAVARATRI').map((a) => ({ category: a.category })))
  lines.filter((l) => l.eventId === navOld.id).forEach((l) => {
    const actual = ACTUALS.find((a) => a.eventType === 'NAVARATRI' && a.category === l.category)!.actual
    l.requestedAmount = actual
    l.approvedAmount = actual + 10_000
    orders.push({ id: `po-nav25-${l.id}`, eventId: navOld.id, budgetLineId: l.id, vendorName: 'Various vendors', itemDescription: l.category, amount: actual, status: 'paid', preparedBy: 'u-adm', decidedBy: 'u-cas', paidBy: 'u-cap', createdAt: at(-400) })
  })
  sponsors.push({ id: 'spn-nav25-1', eventId: navOld.id, sponsorName: 'Subramanian & Sons', kind: 'cash', amount: 50_000, receiptNo: 'rcpt-nav25', receivedAt: at(-390) })
  donations.push({ id: 'don-nav25-1', eventId: navOld.id, donorName: 'Lakshmi Narayanan', amount: 20_000, receiptNo: 'dr-nav25', receivedAt: at(-388) })
  navOld.closurePnl = { ticketIncome: 0, sponsorIncome: 50_000, donationIncome: 20_000, expenses: 710_000, net: -640_000 }
  navOld.fundId = `fund-evt-${navOld.id}`
  funds.push({ id: navOld.fundId, sectorId: 'temple', name: `${navOld.name} Fund`, type: 'restricted', eventId: navOld.id, balance: 0 })

  /* 2. This year's Navaratri: live, with the whole flow behind it. Suggested $7,810, trustees approved $7,680. */
  const nav = base({ id: 'evt-navaratri-2026', sectorId: 'temple', eventType: 'NAVARATRI', name: 'Navaratri Mahotsavam 2026', startAt: at(-2, 18), endAt: at(6, 21), venue: 'Main Mandapam', chiefGuest: 'Sri Ramanathan Iyer', status: 'live', posterStatus: 'published', capacity: 1200, createdAt: at(-50), lastPreparerId: 'u-adm', image: '/images/catalogue/Navaratri.png' })
  events.push(nav)
  const approvedNav = [330_000, 172_000, 77_000, 97_000, 66_000, 26_000]
  addLines(nav.id, 'NAVARATRI', ACTUALS.filter((a) => a.eventType === 'NAVARATRI').map((a) => ({ category: a.category }))).forEach((l, i) => (l.approvedAmount = approvedNav[i]))
  approve(nav.id, 1, 'u-cas', 'u-adm', 'Lines follow last year plus the standard growth.', at(-45))
  approve(nav.id, 2, 'u-tru', 'u-adm', 'Approved with small trims on decoration and flowers.', at(-44))
  makePosters(nav, true)
  approvals.push({ id: 'appr-nav26-poster', entityType: 'event_poster', entityId: nav.id, step: 1, requiredRole: 'sector_admin', preparedBy: 'u-adm', decidedBy: 'u-adm2', decision: 'approved', comment: 'Text matches the event record.', createdAt: at(-30), decidedAt: at(-29) })
  register(nav, 40, 26)
  sponsors.push(
    { id: 'spn-nav26-1', eventId: nav.id, sponsorName: 'Raghavan Jewellers', kind: 'cash', amount: 25_000, receiptNo: 'rcpt-n1', receivedAt: at(-20) },
    { id: 'spn-nav26-2', eventId: nav.id, sponsorName: 'Kaveri Textiles', kind: 'cash', amount: 12_000, receiptNo: 'rcpt-n2', receivedAt: at(-18) },
    { id: 'spn-nav26-3', eventId: nav.id, sponsorName: 'Annapoorna Wholesale', kind: 'in_kind', amount: 40_000, description: '200 kg rice and 50 kg dal', receiptNo: 'rcpt-n3', receivedAt: at(-15) },
  )
  ;[5_000, 10_100, 2_100, 5_100, 25_100, 1_100].forEach((amount, i) =>
    donations.push({ id: `don-nav26-${i}`, eventId: nav.id, donorName: `${rng.pick(DONOR_FIRST)} ${rng.pick(DONOR_LAST)}`, amount, receiptNo: `dr-n${i}`, receivedAt: at(-rng.int(1, 12)) }),
  )
  order(nav, 0, { vendorName: 'Kaveri Foods', itemDescription: 'Rice, dal and ghee for annadhanam', amount: 120_000, status: 'paid', decidedBy: 'u-cas', paidBy: 'u-cap', paidAt: at(-5) })
  order(nav, 3, { vendorName: 'Jasmine Florals', itemDescription: 'Garlands for the nine evenings', amount: 45_000, status: 'approved', decidedBy: 'u-cas' })
  order(nav, 1, { vendorName: 'Murugan Pooja Stores', itemDescription: 'Golu stage and lighting', amount: 60_000, status: 'pending_ca' })
  order(nav, 2, { vendorName: 'Chennai Audio', itemDescription: 'Sound system hire', amount: 90_000, status: 'rejected', decidedBy: 'u-cap', comment: 'More than is left on this line. Revise the quote.' })
  fund(nav, at(-43))

  /* 3. Tamil Isai Evening: published and selling tickets. */
  const isai = base({ id: 'evt-isai-evening', sectorId: 'sangam', eventType: 'PROGRAM', name: 'Tamil Isai Evening', startAt: at(19, 18), endAt: at(19, 21), venue: 'Sangam Hall', chiefGuest: 'Smt. Meenakshi Sundaram', status: 'published', posterStatus: 'published', isPaid: true, ticketPrice: 1_500, capacity: 250, contactName: 'Sangam Office', createdAt: at(-40), lastPreparerId: 'u-adm' })
  events.push(isai)
  addLines(isai.id, 'PROGRAM', ['Hall & venue', 'Catering & refreshments', 'Stage, decor & illumination', 'Printing & promotional materials', 'Audio & photography'].map((category) => ({ category }))).forEach((l) => (l.approvedAmount = l.requestedAmount))
  approve(isai.id, 1, 'u-cas', 'u-adm', 'Within the two-year trend.', at(-36))
  approve(isai.id, 2, 'u-tru', 'u-adm', 'Approved.', at(-35))
  makePosters(isai, true)
  approvals.push({ id: 'appr-isai-poster', entityType: 'event_poster', entityId: isai.id, step: 1, requiredRole: 'sector_admin', preparedBy: 'u-adm', decidedBy: 'u-adm2', decision: 'approved', createdAt: at(-20), decidedAt: at(-19) })
  register(isai, 38, 0)
  order(isai, 0, { vendorName: 'Sangam Hall Trust', itemDescription: 'Hall booking deposit', amount: 60_000, status: 'paid', decidedBy: 'u-cas', paidBy: 'u-cap', paidAt: at(-8) })
  fund(isai, at(-34))

  /* 3b. Thirukalyanam Utsavam: published and selling tickets. */
  const kalyanam = base({ id: 'evt-kalyanam-2026', sectorId: 'temple', eventType: 'FESTIVAL', name: 'Thirukalyanam Utsavam 2026', startAt: at(14, 9), endAt: at(14, 14), venue: 'Main Temple Sanctum', chiefGuest: 'Thirukoil Sivachariyar', status: 'published', posterStatus: 'published', isPaid: true, ticketPrice: 2_500, capacity: 500, contactName: 'Temple Office', createdAt: at(-40), lastPreparerId: 'u-adm', image: '/images/catalogue/Thirukalyanam.png' })
  events.push(kalyanam)
  addLines(kalyanam.id, 'FESTIVAL', ['Prasadam & Annadhanam', 'Decoration & Stage', 'Flowers & Garlands'].map((category) => ({ category }))).forEach((l) => (l.approvedAmount = l.requestedAmount))
  approve(kalyanam.id, 1, 'u-cas', 'u-adm', 'Within the budget trend.', at(-35))
  approve(kalyanam.id, 2, 'u-tru', 'u-adm', 'Approved.', at(-34))
  makePosters(kalyanam, true)
  approvals.push({ id: 'appr-kalyanam-poster', entityType: 'event_poster', entityId: kalyanam.id, step: 1, requiredRole: 'sector_admin', preparedBy: 'u-adm', decidedBy: 'u-adm2', decision: 'approved', createdAt: at(-18), decidedAt: at(-17) })
  register(kalyanam, 45, 0)
  fund(kalyanam, at(-33))

  /* 4. Deepavali: confirmed, no history yet for this kind of event. */
  const diwali = base({ id: 'evt-deepavali-2026', sectorId: 'temple', eventType: 'DIWALI', name: 'Deepavali Celebration', startAt: at(26, 17), endAt: at(26, 21), venue: 'Temple Courtyard', chiefGuest: 'Sri Venkatesan', status: 'confirmed', capacity: 800, createdAt: at(-35), lastPreparerId: 'u-adm', image: '/images/catalogue/Deepavali Annadhanam.png' })
  events.push(diwali)
  addLines(diwali.id, 'DIWALI', [{ category: 'Lamps, oil & ghee', requested: 240_000, approved: 240_000 }, { category: 'Decoration & Stage', requested: 90_000, approved: 85_000 }, { category: 'Prasadam & Annadhanam', requested: 150_000, approved: 150_000 }, { category: 'Fireworks & safety', requested: 40_000, approved: 40_000 }])
  approve(diwali.id, 1, 'u-cap', 'u-adm', 'First Deepavali on the platform, so no history. Reviewed against quotes.', at(-28))
  approve(diwali.id, 2, 'u-tru', 'u-adm', 'Approved with a $50 trim on decoration.', at(-27))
  order(diwali, 0, { vendorName: 'Deepam Mart', itemDescription: 'Brass lamps and ghee', amount: 120_000, status: 'pending_ca' })
  fund(diwali, at(-26))

  /* 5. Karthigai Deepam: a poster has been chosen and is waiting for the second admin. */
  const karthigai = base({ id: 'evt-karthigai-deepam', sectorId: 'temple', eventType: 'FESTIVAL', name: 'Karthigai Deepam Mahotsavam', startAt: at(45, 18), endAt: at(45, 21), venue: 'Hill Temple', chiefGuest: 'Sri Natarajan', status: 'poster_pending', posterStatus: 'pending', capacity: 2000, createdAt: at(-30), lastPreparerId: 'u-adm' })
  events.push(karthigai)
  addLines(karthigai.id, 'FESTIVAL', ['Prasadam & Annadhanam', 'Decoration & Stage', 'Flowers & Garlands'].map((category) => ({ category }))).forEach((l) => (l.approvedAmount = l.requestedAmount))
  approve(karthigai.id, 1, 'u-cas', 'u-adm', 'OK.', at(-24))
  approve(karthigai.id, 2, 'u-tru', 'u-adm', 'OK.', at(-23))
  makePosters(karthigai, true)
  pending(karthigai.id, 'event_poster', 1, 'sector_admin', 'u-adm', at(-2))
  fund(karthigai, at(-22))

  /* 6. Pongal: budget with the CA. */
  const pongal = base({ id: 'evt-pongal-2027', sectorId: 'sangam', eventType: 'PONGAL', name: 'Thai Pongal Vizha 2027', startAt: at(93, 9), endAt: at(93, 14), venue: 'Sangam Grounds', status: 'budget_submitted', capacity: 600, isPaid: true, ticketPrice: 1_000, createdAt: at(-9), lastPreparerId: 'u-adm' })
  events.push(pongal)
  addLines(pongal.id, 'PONGAL', [{ category: 'Hall & venue', requested: 90_000 }, { category: 'Catering & refreshments', requested: 70_000 }, { category: 'Stage, decor & illumination', requested: 45_000 }])
  pending(pongal.id, 'event_budget', 1, 'ca', 'u-adm', at(-2))

  /* 7. Anniversary seva: CA has approved; the Trustee is next. */
  const seva = base({ id: 'evt-anniversary-seva', sectorId: 'sevalaya', eventType: 'SEVA', name: 'Annadhanam Anniversary Seva', startAt: at(30, 11), endAt: at(30, 15), venue: 'Sevalaya Hall', status: 'budget_ca_ok', capacity: 500, createdAt: at(-14), createdBy: 'u-adm2', lastPreparerId: 'u-adm2' })
  events.push(seva)
  addLines(seva.id, 'SEVA', ['Food & Provisions', 'Education Kits', 'Logistics & Travel', 'Stationery & Printing'].map((category) => ({ category })))
  approve(seva.id, 1, 'u-cap', 'u-adm2', 'Suggested amounts follow the last two years.', at(-3))
  pending(seva.id, 'event_budget', 2, 'trustee', 'u-adm2', at(-3))

  /* 8. Annual day: budget approved, the chief guest is still to be fixed, so it cannot be confirmed yet. */
  const annual = base({ id: 'evt-annual-day', sectorId: 'sangam', eventType: 'PROGRAM', name: 'Tamil School Annual Day', startAt: at(60, 17), endAt: at(60, 20), venue: 'Sangam Hall', status: 'budget_approved', capacity: 300, createdAt: at(-20), createdBy: 'u-adm2', lastPreparerId: 'u-adm2' })
  events.push(annual)
  addLines(annual.id, 'PROGRAM', ['Hall & venue', 'Catering & refreshments', 'Audio & photography'].map((category) => ({ category }))).forEach((l) => (l.approvedAmount = l.requestedAmount))
  approve(annual.id, 1, 'u-cas', 'u-adm2', 'OK.', at(-8))
  approve(annual.id, 2, 'u-tru', 'u-adm2', 'OK.', at(-6))

  /* 9. Vinayagar Chaturthi: over, waiting for the CA to close. */
  const vina = base({ id: 'evt-vinayagar-2026', sectorId: 'temple', eventType: 'FESTIVAL', name: 'Vinayagar Chaturthi Celebrations', startAt: at(-30, 8), endAt: at(-28, 20), venue: 'Main Mandapam', chiefGuest: 'Sri Gopalakrishnan', status: 'completed', posterStatus: 'published', capacity: 900, createdAt: at(-90), lastPreparerId: 'u-adm' })
  events.push(vina)
  addLines(vina.id, 'FESTIVAL', ['Prasadam & Annadhanam', 'Decoration & Stage', 'Flowers & Garlands'].map((category) => ({ category }))).forEach((l) => (l.approvedAmount = l.requestedAmount))
  approve(vina.id, 1, 'u-cas', 'u-adm', 'OK.', at(-80))
  approve(vina.id, 2, 'u-tru', 'u-adm', 'OK.', at(-79))
  makePosters(vina, true)
  register(vina, 22, 22)
  sponsors.push({ id: 'spn-vina-1', eventId: vina.id, sponsorName: 'Gopal Sweets', kind: 'cash', amount: 30_000, receiptNo: 'rcpt-v1', receivedAt: at(-40) })
  donations.push({ id: 'don-vina-1', eventId: vina.id, donorName: 'Priya Venkatesh', amount: 15_100, receiptNo: 'dr-v1', receivedAt: at(-35) })
  const vl = lines.filter((l) => l.eventId === vina.id)
  order(vina, 0, { vendorName: 'Annapoorna Wholesale', itemDescription: 'Modak and prasadam', amount: Math.round((vl[0]!.approvedAmount ?? 0) * 0.93), status: 'paid', decidedBy: 'u-cas', paidBy: 'u-cap', paidAt: at(-32) })
  order(vina, 1, { vendorName: 'Murugan Pooja Stores', itemDescription: 'Pandal and lights', amount: Math.round((vl[1]!.approvedAmount ?? 0) * 1.0), status: 'paid', decidedBy: 'u-cas', paidBy: 'u-cap', paidAt: at(-33) })
  order(vina, 2, { vendorName: 'Jasmine Florals', itemDescription: 'Garlands and flowers', amount: Math.round((vl[2]!.approvedAmount ?? 0) * 0.88), status: 'paid', decidedBy: 'u-cas', paidBy: 'u-cap', paidAt: at(-31) })
  fund(vina, at(-78))

  /* 10. Youth camp: sent back by the CA. The reason is on the record. */
  const camp = base({ id: 'evt-youth-camp', sectorId: 'sevalaya', eventType: 'SEVA', name: 'Youth Seva Orientation Camp', startAt: at(75, 9), endAt: at(76, 16), venue: 'Sevalaya Hall', status: 'draft', capacity: 120, createdAt: at(-16), lastPreparerId: 'u-adm' })
  events.push(camp)
  addLines(camp.id, 'SEVA', ['Food & Provisions', 'Logistics & Travel'].map((category) => ({ category })))
  approve(camp.id, 1, 'u-cas', 'u-adm', 'Add a transport line. The total is above last year without a reason.', at(-5), 'rejected')

  /* 11. A cancelled draft. */
  events.push(base({ id: 'evt-winter-concert', sectorId: 'sangam', eventType: 'PROGRAM', name: 'Winter Concert Series', startAt: at(40, 18), endAt: at(40, 21), venue: 'Sangam Hall', status: 'cancelled', cancelReason: 'The artist is unavailable. We will plan it again in the new year.', createdAt: at(-25) }))

  return {
    data: {
      events,
      eventBudgetLines: lines,
      eventApprovals: approvals,
      eventPosters: posters,
      eventRegistrations: registrations,
      eventSponsors: sponsors,
      eventDonations: donations,
      eventOrders: orders,
      eventActuals: ACTUALS,
    },
    funds,
    journal,
    generalFundDelta: delta,
  }
}
