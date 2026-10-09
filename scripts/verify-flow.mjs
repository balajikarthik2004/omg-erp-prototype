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

console.log(`\n${pass} passed, ${fail} failed`)
await server.close()
process.exit(fail ? 1 : 0)
