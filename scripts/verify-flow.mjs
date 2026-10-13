// Headless check of the business rules behind the process-flow deck. Run: npm run verify:flow
import { pathToFileURL } from 'node:url'
import path from 'node:path'

const root = process.cwd()
const { createServer } = await import(pathToFileURL(path.join(root, 'node_modules/vite/dist/node/index.js')).href)

// Minimal browser shims for the stores.
const mem = new Map()
globalThis.localStorage = { getItem: (k) => mem.get(k) ?? null, setItem: (k, v) => mem.set(k, v), removeItem: (k) => mem.delete(k) }

const server = await createServer({ root, logLevel: 'error', server: { middlewareMode: true }, appType: 'custom' })
const load = (p) => server.ssrLoadModule(p)

const { useDb } = await load('/src/store/db.ts')
const seed = await load('/src/mock/seed.ts')
const cfg = await load('/src/config.ts')
const rules = await load('/src/store/rules.ts')
const sel = await load('/src/store/selectors.ts')

const U = Object.fromEntries(seed.USERS.map((u) => [u.id, u]))
let pass = 0
let fail = 0
const ok = (cond, label) => {
  if (cond) {
    pass++
    console.log('  PASS', label)
  } else {
    fail++
    console.log('  FAIL', label)
  }
}
const db = () => useDb.getState()
const section = (t) => console.log('\n' + t)

await db().load()
ok(db().ready, 'database loaded')

/* ---------------------------------------------------------------- COLLECT */
section('Step 4-5: webhook before Paid, receipt before journal')
{
  const before = db().funds.find((f) => f.id === 'fund-tmp-gen').balance
  const jBefore = db().journal.length
  const line = { key: 'k', itemId: 'cat-tmp-hundi', sectorId: 'temple', amount: 10100 }
  const d = db().recordDonation({ lines: [line], method: 'card', donorName: 'Test Devotee', actor: U['u-dev'] })
  ok(d.status === 'pending' && d.receiptNo === '—', 'new donation is pending with no receipt number')
  ok(db().journal.length === jBefore && db().funds.find((f) => f.id === 'fund-tmp-gen').balance === before, 'nothing posted before the webhook')
  ok(!sel.countedDonations(db().donations).some((x) => x.id === d.id), 'pending donation not counted as income')

  db().confirmDonationPayment(d.id, seed.SQUARE_WEBHOOK)
  const paid = db().donations.find((x) => x.id === d.id)
  ok(paid.status === 'paid' && paid.webhookAt, 'webhook marks it Paid with a timestamp')
  ok(db().journal.length === jBefore, 'still no journal at Paid')

  db().issueReceipt(d.id, seed.SQUARE_WEBHOOK)
  const rec = db().donations.find((x) => x.id === d.id)
  ok(rec.status === 'receipted' && /^RCP-TMP-/.test(rec.receiptNo), 'receipt issued: ' + rec.receiptNo)
  ok(db().journal.length === jBefore + 1, 'journal entry posted')
  ok(db().funds.find((f) => f.id === 'fund-tmp-gen').balance === before + rec.net, 'fund balance rose by the net')
  db().confirmDonationPayment(d.id, seed.SQUARE_WEBHOOK)
  ok(db().donations.find((x) => x.id === d.id).status === 'receipted', 'replaying a webhook on a receipted gift does nothing')
}

section('Step 2: events and memberships')
{
  const cats = new Set(seed.CATALOG.map((c) => c.category))
  ok(cats.has('event') && cats.has('membership'), 'catalog has event and membership categories')
  ok(seed.CATALOG.some((c) => c.ticketed) && seed.CATALOG.some((c) => c.recurring === 'annual'), 'ticketed events and recurring memberships exist')
  const cb = sel.categoryBreakdown(db(), 'all')
  ok(cb.length === 6 && cb.find((c) => c.key === 'event').value > 0 && cb.find((c) => c.key === 'membership').value > 0, 'seed data has event and membership income')
}

section('Step 3: counter cash needs two people')
{
  const jBefore = db().journal.length
  ok(!db().createCashCount({ sectorId: 'temple', itemId: 'cat-tmp-hundi', amount: 0, actor: U['u-store'] }).ok, 'zero amount refused')
  ok(!db().createCashCount({ sectorId: 'temple', itemId: 'cat-tmp-hundi', amount: 5000, actor: U['u-proc'] }).ok, 'procurement officer cannot count cash')
  const r = db().createCashCount({ sectorId: 'temple', itemId: 'cat-tmp-hundi', amount: 52500, note: 'test box', actor: U['u-store'] })
  ok(r.ok, 'store keeper records a count')
  const cc = db().cashCounts[0]
  ok(cc.status === 'pending' && db().journal.length === jBefore, 'count is pending and nothing posted')
  db().decideCashCount(cc.id, 'approved', U['u-store'])
  ok(db().cashCounts.find((c) => c.id === cc.id).status === 'pending', 'the counter cannot confirm their own count')
  db().decideCashCount(cc.id, 'approved', U['u-proc'])
  ok(db().cashCounts.find((c) => c.id === cc.id).status === 'pending', 'procurement officer cannot confirm')
  const before = db().funds.find((f) => f.id === 'fund-tmp-gen').balance
  db().decideCashCount(cc.id, 'approved', U['u-adm'])
  const after = db().cashCounts.find((c) => c.id === cc.id)
  ok(after.status === 'confirmed' && after.donationId, 'sector admin confirms: count confirmed and linked to a donation')
  const don = db().donations.find((x) => x.id === after.donationId)
  ok(don.method === 'cash' && don.status === 'receipted' && don.cashCountId === cc.id, 'cash donation receipted with the count id')
  ok(db().funds.find((f) => f.id === 'fund-tmp-gen').balance === before + 52500, 'fund credited by the counted amount')
  const seeded = db().cashCounts.find((c) => c.id === 'cc-seed-1')
  db().decideCashCount(seeded.id, 'rejected', U['u-cas'], 'recount needed')
  ok(db().cashCounts.find((c) => c.id === 'cc-seed-1').status === 'rejected', 'a count can be rejected, nothing posted')
}

/* ---------------------------------------------------------------- CONTROL */
section('Step 6: three-way reconciliation')
{
  const unmatched = db().payouts.filter((p) => p.status !== 'matched')
  ok(unmatched.length === 3, '3 payouts need attention (got ' + unmatched.length + ')')
  const kinds = unmatched.map((p) => rules.payoutVariance(p))
  ok(kinds.some((v) => v.bank !== 0 && v.ledger === 0) && kinds.some((v) => v.ledger !== 0 && v.bank === 0), 'one breaks on the bank side, one on the ledger side')
  const matchedOne = db().payouts.find((p) => p.status === 'matched')
  ok(rules.payoutVariance(matchedOne).tied && Boolean(matchedOne.bankRef), 'matched payouts tie across Square, bank and ledger')
  const daily = db().payouts.filter((p) => p.id.startsWith('payout-d')).length
  ok(daily >= 10, 'recent payouts are daily (' + daily + ' daily payouts)')

  const p = unmatched[0]
  db().matchPayout(p.id, U['u-cas'])
  ok(db().payouts.find((x) => x.id === p.id).status !== 'matched', 'untied payout cannot be reconciled without a reason')
  db().matchPayout(p.id, U['u-cas'], 'short')
  ok(db().payouts.find((x) => x.id === p.id).status !== 'matched', 'a 5-character reason is not enough')
  db().matchPayout(p.id, U['u-cas'], 'Chargeback fee confirmed on the Square statement')
  const done = db().payouts.find((x) => x.id === p.id)
  ok(done.status === 'matched' && done.resolution, 'reconciled with an explained difference, reason stored')
}

section('Step 9: period close')
{
  const now = new Date()
  const key = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
  const cur = key(now)
  const prev = key(new Date(now.getFullYear(), now.getMonth() - 1, 1))
  ok(db().periodCloses.find((p) => p.period === cur).status === 'open', 'current month open')
  ok(db().periodCloses.filter((p) => p.status === 'closed').length >= 9, 'older months are already closed')

  const seq = db().preparePeriodClose(cur, U['u-cas'])
  ok(!seq.ok && /first/i.test(seq.error), 'cannot close this month before last month: ' + seq.error)
  const staffOnly = db().preparePeriodClose(prev, U['u-adm'])
  ok(!staffOnly.ok, 'sector admin cannot prepare a close')

  // Clear anything blocking last month.
  const blocking = rules.periodChecks(db(), prev).filter((c) => c.blocking && !c.ok)
  console.log('   (blockers for last month:', blocking.map((b) => b.id).join(',') || 'none', ')')
  for (const pay of db().payouts.filter((x) => x.status !== 'matched' && new Date(x.date).getMonth() === new Date(now.getFullYear(), now.getMonth() - 1, 1).getMonth()))
    db().matchPayout(pay.id, U['u-cas'], 'Cleared for month end in test')

  const prep = db().preparePeriodClose(prev, U['u-cas'], 'Looks right')
  ok(prep.ok, 'CA staff prepares last month: ' + (prep.error ?? 'ok'))
  db().decidePeriodClose(prev, 'approved', U['u-cas'])
  ok(db().periodCloses.find((p) => p.period === prev).status === 'pending', 'preparer cannot lock their own close')
  db().decidePeriodClose(prev, 'approved', U['u-tru'])
  ok(db().periodCloses.find((p) => p.period === prev).status === 'pending', 'only the CA Partner can lock')
  db().decidePeriodClose(prev, 'approved', U['u-cap'])
  ok(db().periodCloses.find((p) => p.period === prev).status === 'closed', 'CA Partner locks last month')

  // Current month: unmatched payouts block it
  const curBlock = rules.periodChecks(db(), cur).filter((c) => c.blocking && !c.ok)
  console.log('   (blockers for this month:', curBlock.map((b) => b.id).join(',') || 'none', ')')
  for (const pay of db().payouts.filter((x) => x.status !== 'matched')) db().matchPayout(pay.id, U['u-cas'], 'Cleared in test for the close')
  for (const c of db().cashCounts.filter((x) => x.status === 'pending')) db().decideCashCount(c.id, 'rejected', U['u-cap'], 'cleared in test')
  for (const d of db().donations.filter((x) => x.status === 'pending')) db().confirmDonationPayment(d.id, U['u-cas'])
  const prepCur = db().preparePeriodClose(cur, U['u-cap'], 'Early close for test')
  ok(prepCur.ok, 'this month can be prepared once blockers clear: ' + (prepCur.error ?? 'ok'))
  db().decidePeriodClose(cur, 'approved', U['u-cap'])
  ok(db().periodCloses.find((p) => p.period === cur).status === 'pending', 'partner cannot lock a close they prepared')

  // allotment prepared before the lock, approved after -> refused
  const fund = db().funds.find((f) => f.id === 'fund-tmp-gen')
  const head = db().budgets.find((b) => b.id === 'bh-tmp-maint')
  const a = db().createAllotment({ fromFundId: fund.id, toBudgetHeadId: head.id, amount: 50000, reason: 'Roof repair top up', actor: U['u-adm'] })
  ok(a.ok, 'allotment prepared')
  const alt = db().allotments[0]
  // lock current month via a different partner? only one partner persona; reopen flow tested on prev instead
  db().decidePeriodClose(cur, 'rejected', U['u-cap'], 'Returned for test')
  ok(db().periodCloses.find((p) => p.period === cur).status === 'open', 'a pending close can be returned')

  // Lock the current month using staff to prepare and partner to approve
  db().preparePeriodClose(cur, U['u-cas'], 'Close it')
  db().decidePeriodClose(cur, 'approved', U['u-cap'])
  ok(db().periodCloses.find((p) => p.period === cur).status === 'closed', 'current month locked (staff prepared, partner locked)')

  const allotBefore = db().budgets.find((b) => b.id === head.id).allocated
  db().decideAllotment(alt.id, 'approved', U['u-cas'])
  ok(db().allotments.find((x) => x.id === alt.id).status === 'pending' && db().budgets.find((b) => b.id === head.id).allocated === allotBefore, 'allotment approval refused in a locked month')

  db().createCashCount({ sectorId: 'temple', itemId: 'cat-tmp-hundi', amount: 1000, actor: U['u-store'] })
  db().decideCashCount(db().cashCounts[0].id, 'approved', U['u-adm'])
  ok(db().cashCounts[0].status === 'pending', 'cash confirmation refused in a locked month')

  ok(!db().reopenPeriod(cur, U['u-cas'], 'staff trying to reopen it').ok, 'CA staff cannot reopen')
  ok(!db().reopenPeriod(cur, U['u-cap'], 'short').ok, 'reopen needs a real reason')
  ok(!db().reopenPeriod(prev, U['u-cap'], 'reopen the earlier month first').ok, 'cannot reopen an earlier month while a later one is closed')
  ok(db().reopenPeriod(cur, U['u-cap'], 'Late invoice found, reopen to post it').ok, 'partner reopens the latest closed month')
  db().decideAllotment(alt.id, 'approved', U['u-cas'])
  ok(db().allotments.find((x) => x.id === alt.id).status === 'approved', 'allotment now approves after the reopen')
  ok(db().audit.some((e) => e.action === 'Reopened closed period'), 'reopen is in the audit log')
}

/* ------------------------------------------------------------------ SPEND */
section('Step 10: store request approved by Sector Admin')
{
  const req = db().inventoryRequests.find((r) => r.status === 'pending')
  ok(Boolean(req), 'a pending store request exists')
  db().decideInventoryRequest(req.id, 'approved', U['u-cap'])
  ok(db().inventoryRequests.find((r) => r.id === req.id).status === 'pending', 'CA Partner cannot approve a store request')
  db().decideInventoryRequest(req.id, 'approved', U['u-store'])
  ok(db().inventoryRequests.find((r) => r.id === req.id).status === 'pending', 'store keeper cannot approve')
  db().createInventoryRequest({ itemId: seed.USERS && db().inventory[0].id, qty: 3, neededBy: '2026-12-01', actor: U['u-adm'] })
  const mine = db().inventoryRequests[0]
  db().decideInventoryRequest(mine.id, 'approved', U['u-adm'])
  ok(db().inventoryRequests.find((r) => r.id === mine.id).status === 'pending', 'sector admin cannot approve their own request')
  db().decideInventoryRequest(req.id, 'approved', U['u-adm'])
  ok(db().inventoryRequests.find((r) => r.id === req.id).status === 'approved', 'sector admin approves a store keeper request')
}

section('Step 14: approve, then release (Committed to Spent)')
{
  const inv = db().invoices.find((i) => i.status === 'approved')
  ok(Boolean(inv), 'a fully approved invoice is waiting for release')
  const po = db().purchaseOrders.find((p) => p.id === inv.poId)
  const head = () => db().budgets.find((b) => b.id === po.budgetHeadId)
  const c0 = head().committed
  const s0 = head().spent
  db().releasePayment(inv.id, U['u-proc'])
  ok(db().invoices.find((i) => i.id === inv.id).status === 'approved', 'procurement officer cannot release')
  const approverId = inv.approvals.find((a) => a.userId)?.userId
  if (approverId && (approverId === 'u-cas' || approverId === 'u-cap')) {
    db().releasePayment(inv.id, U[approverId])
    ok(db().invoices.find((i) => i.id === inv.id).status === 'approved', 'an approver cannot release their own approval')
  }
  const releaser = ['u-cas', 'u-cap'].find((id) => !inv.approvals.some((a) => a.userId === id) && id !== inv.preparedBy)
  const jb = db().journal.length
  db().releasePayment(inv.id, U[releaser])
  const rel = db().invoices.find((i) => i.id === inv.id)
  ok(rel.status === 'paid' && rel.releasedBy === releaser, 'released by a different person: ' + releaser)
  ok(head().committed === Math.max(0, c0 - po.total) && head().spent === s0 + inv.total, 'committed fell by PO total, spent rose by invoice total')
  ok(db().journal.length === jb + 1, 'expenditure journal posted on release')
}
{
  // a fresh invoice: approval alone moves no money
  const po = db().purchaseOrders.find((p) => p.status === 'received' || p.status === 'partially_received') ?? db().purchaseOrders.find((p) => p.status === 'sent')
  if (po) {
    db().recordInvoice(po.id, po.lines, 'INV-TEST-1', U['u-proc'])
    const inv = db().invoices[0]
    const head = () => db().budgets.find((b) => b.id === po.budgetHeadId)
    const s0 = head().spent
    // satisfy all required approval roles with distinct approvers
    for (const role of cfgRoles(inv.total)) {
      const approver = role === 'ca_staff' ? U['u-cas'] : role === 'ca_partner' ? U['u-cap'] : U['u-tru']
      db().addCaComment(inv.id, 'Variance explained by supplier note', U['u-cap'])
      db().decidePayment(inv.id, 'approved', approver)
    }
    const after = db().invoices.find((i) => i.id === inv.id)
    ok(after.status === 'approved' && head().spent === s0, 'full approval leaves status approved and spent unchanged')
  }
}
function cfgRoles(amount) {
  return cfg.requiredApprovals(amount)
}

section('Step 17: escalation of overdue items')
{
  const overdue = sel.approvalTasks(db(), 'all').find((t) => t.kind === 'allotment' && new Date(t.dueAt) < new Date())
  if (overdue) {
    db().escalateTask('allotment', overdue.id, U['u-cap'])
    ok(db().allotments.find((a) => a.id === overdue.id).status === 'escalated', 'overdue allotment escalated')
    ok(sel.approvalTasks(db(), 'all').some((t) => t.id === overdue.id && t.escalated), 'escalated task stays in the inbox, flagged')
  } else {
    console.log('  (no overdue allotment in seed, skipped)')
  }
  const taskKinds = new Set(sel.approvalTasks(db(), 'all').map((t) => t.kind))
  console.log('   task kinds in inbox:', [...taskKinds].join(', '))
}

/* ----------------------------------------------------------------- TENANT */
section('Step 00: onboarding and tenant isolation')
{
  const base = { name: 'Test Trust', address: '1 Road', domain: 'give.testtrust.org', brand: 'tulsi', logoText: 'TT', verticals: ['sevalaya'], modules: ['donations', 'budgets'], squareLocationId: 'LTEST12345', thresholds: { staffMax: 50_000, partnerMax: 200_000 }, users: [] }
  ok(!db().onboardTenant(base, U['u-sup']).ok, 'refused without approver users')
  ok(!db().onboardTenant({ ...base, thresholds: { staffMax: 500, partnerMax: 400 } }, U['u-sup']).ok, 'refused when partner limit is below staff limit')
  ok(!db().onboardTenant({ ...base, domain: 'give.omgtrust.org' }, U['u-sup']).ok, 'refused for a duplicate domain')
  const users = [
    { id: 'a', name: 'A', email: 'a@x', role: 'sector_admin' },
    { id: 'b', name: 'B', email: 'b@x', role: 'ca_staff' },
    { id: 'c', name: 'C', email: 'c@x', role: 'ca_partner' },
    { id: 'd', name: 'D', email: 'd@x', role: 'trustee' },
  ]
  const res = db().onboardTenant({ ...base, users }, U['u-sup'])
  ok(res.ok, 'onboarding succeeds: ' + (res.error ?? res.tenantId))
  ok(db().tenants.length === 2, 'two customers now')

  const demoDonations = db().donations.length
  const demoFunds = db().funds.length
  db().switchTenant(res.tenantId)
  ok(db().activeTenantId === res.tenantId, 'switched to the new customer')
  ok(db().donations.length === 0 && db().journal.length === 0 && db().payouts.length === 0, 'new customer has no donations, journal or payouts (nothing leaks)')
  ok(db().funds.length > 0 && db().funds.every((f) => f.sectorId === 'sevalaya' && f.balance === 0), 'funds loaded only for its vertical, at zero')
  ok(db().budgets.every((b) => b.sectorId === 'sevalaya' && b.allocated === 0), 'budget heads loaded at zero')
  ok(cfg.requiredApprovals(30_000).join() === 'ca_staff', 'thresholds: $300 needs CA Staff under its limits')
  ok(cfg.requiredApprovals(80_000).join() === 'ca_partner', 'thresholds: $800 needs the Partner here (staff limit is $500), though the demo customer would accept Staff')
  ok(cfg.requiredApprovals(300_000).join() === 'ca_partner,trustee', 'thresholds: $3,000 needs Partner + Trustee here')

  const sevFund = db().funds.find((f) => f.id === 'fund-sev-gen')
  const dn = db().recordDonation({ lines: [{ key: 'k', itemId: 'cat-sev-general', sectorId: 'sevalaya', amount: 20000 }], method: 'card', donorName: 'N', actor: U['u-dev'] })
  db().confirmDonationPayment(dn.id, seed.SQUARE_WEBHOOK)
  db().issueReceipt(dn.id, seed.SQUARE_WEBHOOK)
  ok(db().funds.find((f) => f.id === 'fund-sev-gen').balance > sevFund.balance, 'a donation is booked to the new customer')
  ok(db().audit.every((a) => a.tenantId === res.tenantId), 'audit events here are stamped with the new tenant id')

  db().switchTenant('ten-demo')
  ok(db().donations.length === demoDonations, 'back on the demo customer: its donations are intact (' + db().donations.length + ')')
  ok(db().funds.length === demoFunds, 'demo funds intact')
  ok(!db().donations.some((d) => d.id === dn.id), "the new customer's donation did not leak into the demo books")
  ok(cfg.requiredApprovals(80_000).join() === 'ca_staff', 'demo thresholds restored ($800 needs CA Staff again)')
}


/* ----------------------------------------------------------------- EVENTS */
section('Events: seed and the budget formula')
{
  const d = db()
  ok(d.events.length === 11, 'eleven seeded events (got ' + d.events.length + ')')
  const statuses = new Set(d.events.map((e) => e.status))
  ok(['draft', 'budget_submitted', 'budget_ca_ok', 'budget_approved', 'confirmed', 'poster_pending', 'published', 'live', 'completed', 'closed', 'cancelled'].every((s) => statuses.has(s)), 'every status is represented')
  const nav = d.events.find((e) => e.id === 'evt-navaratri-2026')
  const cats = d.eventBudgetLines.filter((l) => l.eventId === nav.id).map((l) => l.category)
  const sug = db().suggestBudget(nav.id, cats)
  ok(sug.reduce((s, x) => s + x.suggested, 0) === 781000, 'Navaratri: last year $7,100.00 suggests $7,810.00')
  ok(d.eventBudgetLines.filter((l) => l.eventId === nav.id).reduce((s, l) => s + l.approvedAmount, 0) === 768000, 'Navaratri: Trustees approved $7,680.00')
  const noHistory = db().suggestBudget(nav.id, ['Something never budgeted'])[0]
  ok(noHistory.suggested === null && /No past events/.test(noHistory.note), 'a category with no history gets no suggestion')
  const twoYear = db().suggestBudget('evt-isai-evening', ['Hall & venue'])[0]
  ok(twoYear.suggested === 119000 && Math.abs(twoYear.growth - 8 / 102) < 1e-9, 'two years of history use the real trend (7.8%), rounded to $10')
  ok(d.funds.some((f) => f.id === 'fund-evt-evt-navaratri-2026' && f.eventId === nav.id), 'a confirmed event has its fund in the ledger')
}

section('Events: create, budget, two approvals, confirm')
let evId
{
  ok(!db().createEvent({ name: 'X', sectorId: 'temple', eventType: 'general', startAt: '2026-12-01T10:00', endAt: '2026-12-01T12:00', venue: 'Hall', contactName: 'A', contactPhone: '1', isPaid: false }, U['u-cas']).ok, 'only a Sector Admin can create an event')
  const bad = db().createEvent({ name: 'Bad', sectorId: 'temple', eventType: 'general', startAt: '2026-12-02T10:00', endAt: '2026-12-01T12:00', venue: 'Hall', contactName: 'A', contactPhone: '1', isPaid: false }, U['u-adm'])
  ok(!bad.ok, 'end before start is refused')
  ok(!db().createEvent({ name: 'Paid', sectorId: 'temple', eventType: 'general', startAt: '2026-12-01T10:00', endAt: '2026-12-01T12:00', venue: 'Hall', contactName: 'A', contactPhone: '1', isPaid: true }, U['u-adm']).ok, 'a paid event needs a ticket price')
  const r = db().createEvent({ name: 'Margazhi Music Festival', sectorId: 'temple', eventType: 'FESTIVAL', startAt: '2026-12-20T17:00', endAt: '2026-12-20T21:00', venue: 'Temple Hall', contactName: 'Temple Office', contactPhone: '+1 555 0100', capacity: 3, isPaid: true, ticketPrice: 2000 }, U['u-adm'])
  ok(r.ok, 'sector admin creates a draft')
  evId = r.id
  const ev = () => db().events.find((e) => e.id === evId)
  ok(ev().status === 'draft', 'status is draft')

  ok(!db().submitBudget(evId, U['u-adm']).ok, 'cannot submit with no budget lines')
  const sug = db().suggestBudget(evId, ['Prasadam & Annadhanam', 'Decoration & Stage', 'Brand new line'])
  ok(sug[0].suggested === 216000 && sug[2].suggested === null, 'suggestions: FESTIVAL history applies, a new line has none')
  const lines = sug.map((s) => ({ category: s.category, requestedAmount: s.suggested ?? 50000, suggestedAmount: s.suggested ?? undefined, suggestionNote: s.note, history: s.history }))
  ok(db().saveBudgetLines(evId, lines, U['u-adm']).ok, 'budget lines saved')
  ok(!db().saveBudgetLines(evId, lines, U['u-cas']).ok, 'only a Sector Admin edits the budget')
  const total = db().eventBudgetLines.filter((l) => l.eventId === evId).reduce((s, l) => s + l.requestedAmount, 0)
  ok(db().submitBudget(evId, U['u-adm']).ok && ev().status === 'budget_submitted', 'budget submitted to the CA, total ' + total)
  ok(!db().saveBudgetLines(evId, lines, U['u-adm']).ok, 'budget is frozen once submitted')
  ok(db().eventApprovals.some((a) => a.entityId === evId && a.step === 1 && !a.decision), 'a CA approval step is open')

  db().decideBudget(evId, 'approved', U['u-adm'])
  ok(ev().status === 'budget_submitted', 'a Sector Admin cannot give the CA review')
  db().decideBudget(evId, 'approved', U['u-tru'])
  ok(ev().status === 'budget_submitted', 'a Trustee cannot give the CA review')
  db().decideBudget(evId, 'rejected', U['u-cas'])
  ok(ev().status === 'budget_submitted', 'rejecting needs a comment')
  db().decideBudget(evId, 'rejected', U['u-cas'], { comment: 'Add a sound line.' })
  ok(ev().status === 'draft' && db().eventApprovals.some((a) => a.entityId === evId && a.decision === 'rejected' && a.comment === 'Add a sound line.'), 'CA rejects: back to draft, reason on record')
  db().submitBudget(evId, U['u-adm'])
  db().decideBudget(evId, 'approved', U['u-cas'], { comment: 'ok' })
  ok(ev().status === 'budget_ca_ok', 'CA approves, now waiting for a Trustee')
  ok(db().eventApprovals.some((a) => a.entityId === evId && a.step === 2 && !a.decision), 'a Trustee step is open')
  db().decideBudget(evId, 'approved', U['u-cap'])
  ok(ev().status === 'budget_ca_ok', 'the CA cannot also give the Trustee approval')
  const first = db().eventBudgetLines.find((l) => l.eventId === evId)
  db().decideBudget(evId, 'approved', U['u-tru'], { approvedLines: { [first.id]: first.requestedAmount - 10000 } })
  ok(ev().status === 'budget_approved', 'Trustee approves')
  ok(db().eventBudgetLines.find((l) => l.id === first.id).approvedAmount === first.requestedAmount - 10000, 'the Trustee can approve a different amount per line')

  const draftEv = db().events.find((e) => e.status === 'draft')
  ok(db().generatePosters(draftEv.id, U['u-adm']).ok, 'poster can be generated on draft event without waiting for budget approval')
  const gen0 = db().funds.find((f) => f.id === 'fund-tmp-gen').balance
  const c1 = db().confirmEvent(evId, U['u-adm'])
  ok(!c1.ok && /chief guest/.test(c1.error), 'cannot confirm without a chief guest: ' + c1.error)
  ok(!db().confirmEvent(evId, U['u-cas'], { chiefGuest: 'Dr. Raman' }).ok, 'only a Sector Admin confirms')
  const c2 = db().confirmEvent(evId, U['u-adm'], { chiefGuest: 'Dr. Raman' })
  ok(c2.ok && ev().status === 'confirmed', 'confirmed with the guest fixed')
  const approvedTotal = db().eventBudgetLines.filter((l) => l.eventId === evId).reduce((s, l) => s + l.approvedAmount, 0)
  const fund = db().funds.find((f) => f.id === ev().fundId)
  ok(fund && fund.balance === approvedTotal && fund.eventId === evId, 'event fund holds the approved total')
  ok(db().funds.find((f) => f.id === 'fund-tmp-gen').balance === gen0 - approvedTotal, 'the same amount left the sector general fund')
  ok(db().journal.some((j) => j.sourceRef === evId && /set aside/.test(j.memo)), 'a journal entry records the set-aside')
  const alt = db().createAllotment({ fromFundId: fund.id, toBudgetHeadId: 'bh-tmp-maint', amount: 1000, reason: 'trying to spend the event fund', actor: U['u-adm'] })
  ok(!alt.ok && /event orders/.test(alt.error), 'an event fund cannot be allotted to a budget head')
}

section('Events: poster, four-eyes, public page')
{
  const ev = () => db().events.find((e) => e.id === evId)
  ok(db().generatePosters(evId, U['u-adm']).ok, 'three designs generated')
  ok(db().eventPosters.filter((d) => d.eventId === evId).length === 3, 'exactly three designs')
  const d1 = db().eventPosters.filter((d) => d.eventId === evId)[0]
  ok(/No text, no letters/.test(d1.prompt) && /no deities/.test(d1.prompt), 'the prompt forbids text, faces and deities')
  ok(d1.provider === 'template', 'the prototype provider is the offline template one')
  ok(db().generatePosters(evId, U['u-adm']).ok && db().generatePosters(evId, U['u-adm']).ok, 'a second and third set are allowed')
  ok(!db().generatePosters(evId, U['u-adm']).ok, 'a fourth set in a day is refused (rate limit)')
  ok(!db().selectPoster(evId, 'nope', U['u-adm']).ok, 'cannot select a design from another event')
  ok(db().selectPoster(evId, d1.id, U['u-adm']).ok && ev().status === 'poster_pending', 'design chosen, now waiting for approval')
  ok(!db().generatePosters(evId, U['u-adm']).ok, 'no new designs while one awaits approval')
  db().decidePoster(evId, 'approved', U['u-adm'])
  ok(ev().status === 'poster_pending', 'the admin who chose the poster cannot approve it')
  db().decidePoster(evId, 'rejected', U['u-adm2'])
  ok(ev().status === 'poster_pending', 'sending a poster back needs a comment')
  db().decidePoster(evId, 'rejected', U['u-adm2'], 'Venue text is too small.')
  ok(ev().status === 'confirmed' && ev().posterStatus === 'none', 'rejected poster returns the event to confirmed')
  const d2 = db().eventPosters.filter((d) => d.eventId === evId)[1]
  db().selectPoster(evId, d2.id, U['u-adm'])
  ok(!db().registerAttendee(evId, { name: 'Early Bird', phone: '1', qty: 1 }, U['u-adm']).ok, 'registration is closed until the poster is approved')
  db().decidePoster(evId, 'approved', U['u-adm2'], 'Looks right.')
  ok(ev().status === 'published' && ev().posterStatus === 'published', 'a different admin approves: published')

  const poster = await load('/src/features/events/logic/poster.ts')
  const svg = await poster.renderPosterSvg({ event: ev(), design: db().eventPosters.find((x) => x.id === d2.id), organisation: 'Kaveri Heritage', registrationUrl: 'http://x/register/' + evId })
  ok(svg.includes('Margazhi Music Festival') && svg.includes('Dr. Raman') && svg.includes('Temple Hall') && svg.includes('+1 555 0100'), 'poster carries the exact event text')
  ok(/shape-rendering="crispEdges"/.test(svg), 'poster carries a QR code')
  ok(svg.includes('$20.00 per person'), 'poster shows the ticket price')

  const edit = db().updateEvent(evId, { venue: 'Temple Main Hall' }, U['u-adm'])
  ok(edit.ok && ev().status === 'confirmed' && ev().posterStatus === 'stale', 'changing the venue after publishing makes the poster stale and unpublishes it')
  db().selectPoster(evId, d2.id, U['u-adm'])
  db().decidePoster(evId, 'approved', U['u-adm2'], 'Re-approved with the new venue.')
  ok(ev().status === 'published', 'remade and re-approved')
  ok(db().updateEvent(evId, { capacity: 3 }, U['u-adm']).ok && ev().status === 'published', 'changing capacity does not touch the poster')
}

section('Events: tickets, sponsors, donations, check-in')
{
  const ev = () => db().events.find((e) => e.id === evId)
  const fundBal = () => db().funds.find((f) => f.id === ev().fundId).balance
  const f0 = fundBal()
  ok(!db().registerAttendee(evId, { name: '', phone: '1', qty: 1 }, U['u-adm']).ok, 'a name is required')
  ok(!db().registerAttendee(evId, { name: 'A', phone: '1', qty: 11 }, U['u-adm']).ok, 'at most ten tickets at once')
  const a = db().registerAttendee(evId, { name: 'Asha Raman', phone: '+1 555 0111', qty: 2 }, U['u-adm'])
  ok(a.ok && a.registration.amountPaid === 4000, 'two paid tickets: $40.00')
  ok(fundBal() === f0 + 4000, 'ticket income went into the event fund')
  ok(!db().registerAttendee(evId, { name: 'Too Many', phone: '1', qty: 2 }, U['u-adm']).ok, 'capacity (3) is enforced: only 1 seat left')
  const b = db().registerAttendee(evId, { name: 'Bala', phone: '+1 555 0112', qty: 1 }, U['u-adm'])
  ok(b.ok, 'the last seat is sold')
  ok(!db().registerAttendee(evId, { name: 'Late', phone: '1', qty: 1 }, U['u-adm']).ok, 'a full event refuses more')

  ok(!db().checkInTicket(evId, a.registration.ticketToken, U['u-adm']).ok, 'check-in is closed until the event is live')
  ok(db().startEvent(evId, U['u-adm']).ok && ev().status === 'live', 'event goes live')
  ok(!db().checkInTicket(evId, a.registration.ticketToken, U['u-cap']).ok, 'a CA cannot run the check-in desk')
  ok(db().checkInTicket(evId, a.registration.ticketToken, U['u-store']).ok, 'a store volunteer checks in a valid ticket')
  const again = db().checkInTicket(evId, a.registration.ticketToken, U['u-adm'])
  ok(!again.ok && /Already scanned/.test(again.error), 'a ticket cannot check in twice')
  const tampered = a.registration.ticketToken.slice(0, -2) + 'zz'
  ok(!db().checkInTicket(evId, tampered, U['u-adm']).ok, 'a tampered ticket is refused')
  ok(!db().checkInTicket(evId, 'tkt-nonsense.abc', U['u-adm']).ok, 'a made-up ticket is refused')
  const otherEvent = db().eventRegistrations.find((r) => r.eventId === 'evt-isai-evening')
  ok(!db().checkInTicket(evId, otherEvent.ticketToken, U['u-adm']).ok, "another event's ticket is refused here")

  const f1 = fundBal()
  ok(db().addSponsor(evId, { sponsorName: 'Raghavan Jewellers', kind: 'cash', amount: 30000 }, U['u-adm']).ok && fundBal() === f1 + 30000, 'a cash sponsor adds to the fund')
  ok(db().addSponsor(evId, { sponsorName: 'Mill Co', kind: 'in_kind', amount: 50000, description: 'Rice' }, U['u-adm']).ok && fundBal() === f1 + 30000, 'an in-kind sponsor does not add cash')
  ok(!db().addSponsor(evId, { sponsorName: 'X', kind: 'cash', amount: 1000 }, U['u-cas']).ok, 'only a Sector Admin records sponsors')
  ok(db().addEventDonation(evId, { donorName: 'Priya', amount: 5000 }, U['u-adm']).ok && fundBal() === f1 + 35000, 'an event donation adds to the fund')
}

section('Events: orders against budget lines')
{
  const ev = () => db().events.find((e) => e.id === evId)
  const line = db().eventBudgetLines.filter((l) => l.eventId === evId)[0]
  const limit = line.approvedAmount
  ok(!db().raiseOrder(evId, { budgetLineId: line.id, vendorName: 'V', itemDescription: 'i', amount: limit + 1 }, U['u-adm']).ok, 'an order above the line limit is blocked')
  ok(!db().raiseOrder(evId, { budgetLineId: line.id, vendorName: 'V', itemDescription: 'i', amount: 5000 }, U['u-cas']).ok, 'only a Sector Admin raises an order')
  ok(db().raiseOrder(evId, { budgetLineId: line.id, vendorName: 'Kaveri Foods', itemDescription: 'Ghee', amount: limit - 20000 }, U['u-adm']).ok, 'an order within the line is accepted')
  const po1 = db().eventOrders.filter((o) => o.eventId === evId)[0]
  const over = db().raiseOrder(evId, { budgetLineId: line.id, vendorName: 'V', itemDescription: 'more', amount: 30000 }, U['u-adm'])
  ok(!over.ok && /left on/.test(over.error), 'committed amounts count: a second order that overruns the line is blocked')
  ok(!db().decideOrder(evId, po1.id, 'approved', U['u-adm']).ok, 'a Sector Admin cannot approve an order')
  ok(!db().decideOrder(evId, po1.id, 'rejected', U['u-cas']).ok, 'rejecting an order needs a comment')
  ok(!db().payOrder(evId, po1.id, U['u-cap']).ok, 'an order cannot be paid before it is approved')
  ok(db().decideOrder(evId, po1.id, 'approved', U['u-cas']).ok, 'CA approves the order')
  ok(!db().payOrder(evId, po1.id, U['u-cas']).ok, 'the CA who approved cannot also pay it')
  const fb = db().funds.find((f) => f.id === ev().fundId).balance
  ok(db().payOrder(evId, po1.id, U['u-cap']).ok, 'a different CA pays it')
  ok(db().funds.find((f) => f.id === ev().fundId).balance === fb - po1.amount, 'the fund fell by the amount paid')
  ok(db().journal.some((j) => j.sourceRef === po1.id && /expense paid/.test(j.memo)), 'the payment is in the ledger')

  const taskKinds = new Set(sel.approvalTasks(db(), 'all').map((t) => t.kind))
  ok(['event_budget', 'event_poster', 'event_order'].every((k) => taskKinds.has(k)), 'the inbox lists event budgets, posters and orders')
}

section('Events: close, P&L, actuals, cancel')
{
  const ev = () => db().events.find((e) => e.id === evId)
  const open = db().raiseOrder(evId, { budgetLineId: db().eventBudgetLines.filter((l) => l.eventId === evId)[1].id, vendorName: 'V', itemDescription: 'open one', amount: 10000 }, U['u-adm'])
  ok(open.ok, 'another order is raised')
  ok(!db().closeEvent(evId, U['u-cap']).ok, 'cannot close an event that is not completed')
  ok(db().endEvent(evId, U['u-adm']).ok && ev().status === 'completed', 'event completed')
  const c = db().closeEvent(evId, U['u-cap'])
  ok(!c.ok && /still open/.test(c.error), 'cannot close while an order is open: ' + c.error)
  const po2 = db().eventOrders.find((o) => o.eventId === evId && o.status === 'pending_ca')
  db().decideOrder(evId, po2.id, 'rejected', U['u-cas'], 'Not needed now.')
  ok(!db().closeEvent(evId, U['u-adm']).ok, 'only the CA closes an event')

  const pnl = (await load('/src/features/events/logic/pnl.ts')).calculatePnl(db(), evId)
  ok(pnl.ticketIncome === 4000 + 2000 && pnl.sponsorIncome === 30000 && pnl.donationIncome === 5000, 'P&L income: tickets $60, cash sponsors $300, donations $50')
  ok(pnl.inKindSponsorValue === 50000, 'in-kind sponsorship is shown separately')
  ok(pnl.net === pnl.ticketIncome + pnl.sponsorIncome + pnl.donationIncome - pnl.expenses, 'net = cash in minus cash out')

  const fundId = ev().fundId
  const before = db().funds.find((f) => f.id === fundId).balance
  const gen = db().funds.find((f) => f.id === 'fund-tmp-gen').balance
  ok(db().closeEvent(evId, U['u-cap']).ok && ev().status === 'closed', 'the CA closes the event')
  ok(db().funds.find((f) => f.id === fundId).balance === 0 && db().funds.find((f) => f.id === 'fund-tmp-gen').balance === gen + before, 'the unspent balance returned to the sector general fund')
  ok(ev().closurePnl && ev().closurePnl.net === pnl.net, 'the P&L is locked on the event')
  ok(db().eventActuals.some((a) => a.eventType === 'FESTIVAL' && a.year === 2026 && a.category === 'Prasadam & Annadhanam'), 'actuals were archived for next year')
  ok(!db().updateEvent(evId, { venue: 'Elsewhere' }, U['u-adm']).ok, 'a closed event is read-only')
  const lineId = db().eventBudgetLines.find((l) => l.eventId === evId).id
  ok(!db().raiseOrder(evId, { budgetLineId: lineId, vendorName: 'V', itemDescription: 'i', amount: 100 }, U['u-adm']).ok, 'no new orders on a closed event')
  ok(!db().cancelEvent(evId, 'too late', U['u-adm']).ok, 'a closed event cannot be cancelled')
  const next = db().suggestBudget('evt-karthigai-deepam', ['Prasadam & Annadhanam'])[0]
  ok(next.history.some((h) => h.year === 2026), "next year's formula sees this year's actual spend")

  const fund0 = db().funds.find((f) => f.id === 'fund-evt-evt-deepavali-2026').balance
  const g0 = db().funds.find((f) => f.id === 'fund-tmp-gen').balance
  const diwaliOpen = db().eventOrders.filter((o) => o.eventId === 'evt-deepavali-2026' && o.status === 'pending_ca').length
  ok(diwaliOpen > 0, 'Deepavali has an open order to cancel')
  ok(!db().cancelEvent('evt-deepavali-2026', '', U['u-adm']).ok, 'cancelling needs a reason')
  ok(db().cancelEvent('evt-deepavali-2026', 'Hall unavailable', U['u-adm']).ok, 'Deepavali is cancelled')
  ok(db().funds.find((f) => f.id === 'fund-evt-evt-deepavali-2026').balance === 0 && db().funds.find((f) => f.id === 'fund-tmp-gen').balance === g0 + fund0, 'its fund went back to the sector')
  ok(db().eventOrders.filter((o) => o.eventId === 'evt-deepavali-2026').every((o) => o.status !== 'pending_ca' && o.status !== 'approved'), 'its open orders were cancelled')
  ok(!db().cancelEvent('evt-navaratri-2026', 'no', U['u-adm']).ok, 'a live event cannot be cancelled')
}

section('Events: a new customer starts with no events')
{
  const before = db().events.length
  const users = [
    { id: 'a', name: 'A', email: 'a@x', role: 'sector_admin' }, { id: 'b', name: 'B', email: 'b@x', role: 'ca_staff' },
    { id: 'c', name: 'C', email: 'c@x', role: 'ca_partner' }, { id: 'd', name: 'D', email: 'd@x', role: 'trustee' },
  ]
  const res = db().onboardTenant({ name: 'Events Trust', address: '1 Road', domain: 'give.eventstrust.org', brand: 'peacock', logoText: 'ET', verticals: ['sangam'], modules: ['donations', 'events'], squareLocationId: 'LEVENTS123', thresholds: { staffMax: 100000, partnerMax: 1000000 }, users }, U['u-sup'])
  db().switchTenant(res.tenantId)
  ok(db().events.length === 0 && db().eventActuals.length === 0 && db().eventRegistrations.length === 0, 'a new customer starts with no events, history or tickets')
  db().switchTenant('ten-demo')
  ok(db().events.length === before, "the demo customer's events are intact")
}

console.log(`\n${pass} passed, ${fail} failed`)
await server.close()
process.exit(fail ? 1 : 0)
