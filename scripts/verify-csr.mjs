// Headless verification of the CSR Module. Run: npm run verify:csr
import { pathToFileURL } from 'node:url'
import path from 'node:path'

const root = process.cwd()
const { createServer } = await import(pathToFileURL(path.join(root, 'node_modules/vite/dist/node/index.js')).href)

const mem = new Map()
globalThis.localStorage = { getItem: (k) => mem.get(k) ?? null, setItem: (k, v) => mem.set(k, v), removeItem: (k) => mem.delete(k) }

const server = await createServer({ root, logLevel: 'error', server: { middlewareMode: true }, appType: 'custom' })
const load = (p) => server.ssrLoadModule(p)

const { useDb, allotmentFundError } = await load('/src/store/db.ts')
const { approvalTasks } = await load('/src/store/selectors.ts')
const seed = await load('/src/mock/seed.ts')
const csrSeed = await load('/src/mock/csrSeed.ts')

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

/* ------------------------------------------------------------- 1. Seed Integrity */
section('1. Seed Integrity & MCA Schedule VII mapping')

ok(csrSeed.CSR_SCHEDULE_VII_ITEMS.length >= 5, 'Schedule VII clauses (Hunger, Education, Gender, Environment, Heritage) present')
ok(db().csrEntities.length >= 3, 'Three implementing entities seeded')
ok(db().csrEntities.some((e) => e.readinessStatus === 'CSR_READY'), 'Sevalaya and Heritage trusts are CSR_READY')
ok(db().csrCompanies.length >= 4, 'Corporate partners (TVS, Murugappa, TCS, L&T) seeded')
ok(db().csrProjects.length >= 3, 'Compliant Schedule VII projects seeded')
ok(db().csrDeals.length >= 1, 'Active TVS Motor CSR deal seeded')

/* ------------------------------------------------------------- 2. Compliance Vault */
section('2. Compliance Vault & CA Verification Gate')

const sangam = db().csrEntities.find((e) => e.id === 'csr-ent-sangam')
ok(sangam.readinessStatus === 'DOCS_UPLOADED', 'Tamil Sangam starts with DOCS_UPLOADED')

// Devotee or storekeeper cannot verify compliance documents
const devRes = db().verifyCsrDocument('csr-doc-sgm-reg', 'verified', 'Looks good', U['u-dev'])
ok(!devRes.ok, 'Devotee / non-auditor cannot verify compliance documents')

// Upload new document for Tamil Sangam
const uploadRes = db().uploadCsrDocument({
  entityId: 'csr-ent-sangam',
  docType: 'AUDITED_ACCOUNTS',
  label: 'FY 2024-25 Audited Balance Sheet & P&L',
  filePath: '/vault/sangam-audit.pdf',
  uploadedBy: 'Auditor',
}, U['u-adm'])
ok(uploadRes.ok, 'Uploaded new compliance document to vault')

// CA verifies the document
const caRes = db().verifyCsrDocument(uploadRes.id, 'verified', 'Audited accounts verified', U['u-cap'])
ok(caRes.ok, 'CA Partner verified audited accounts document')
ok(db().csrDocuments.find((d) => d.id === uploadRes.id)?.status === 'verified', 'Document status is verified')

/* ------------------------------------------------------------- 3. Schedule VII Builder & Ritual Block */
section('3. Schedule VII Project Builder & Pooja Block Rules')

// Attempt creating a project with unblocked Pooja lines
const failPrjRes = db().createCsrProject({
  entityId: 'csr-ent-sevalaya',
  title: 'Pooja and Annadhanam Combined',
  scheduleViiCode: 'i',
  description: 'Test',
  state: 'Tamil Nadu',
  district: 'Thanjavur',
  beneficiaryType: 'Public',
  beneficiaryTarget: 1000,
  startDate: '2026-04-01',
  endDate: '2027-03-31',
  totalBudget: 10000000,
  budgetLines: [
    { id: 'l1', category: 'POOJA', description: 'Morning Archana & Rituals', amount: 5000000, blockedForCsr: false },
    { id: 'l2', category: 'MATERIALS', description: 'Rice and Dal', amount: 5000000 },
  ],
  createdBy: 'u-adm',
}, U['u-adm'])
ok(!failPrjRes.ok, 'Religious & Pooja ceremony heads are legally blocked for CSR under General Circular 21/2014')

// Creating project with compliant heads
const goodPrjRes = db().createCsrProject({
  entityId: 'csr-ent-sevalaya',
  title: 'Clean Drinking Water Plant for Villages',
  scheduleViiCode: 'i',
  description: 'RO water purification units in 5 rural hamlets',
  state: 'Tamil Nadu',
  district: 'Thanjavur',
  beneficiaryType: 'Villagers',
  beneficiaryTarget: 4000,
  startDate: '2026-05-01',
  endDate: '2027-04-30',
  totalBudget: 200000000,
  budgetLines: [
    { id: 'l1', category: 'EQUIPMENT', description: '5x Commercial RO purification units', amount: 160000000, isCapital: true },
    { id: 'l2', category: 'ADMIN_OVERHEAD', description: 'Administrative overhead (4%)', amount: 8000000, isCapital: false },
  ],
  createdBy: 'u-adm',
}, U['u-adm'])
ok(goodPrjRes.ok, 'Compliant CSR project submitted for sanction')
ok(db().csrProjects.find((p) => p.id === goodPrjRes.id)?.status === 'SUBMITTED', 'Project initial status is SUBMITTED')

// Trustee sanction
const sanctionRes = db().decideCsrProject(goodPrjRes.id, 'approved', U['u-tru'], 'Board approved')
ok(sanctionRes.ok, 'Trustee approved project')
ok(db().csrProjects.find((p) => p.id === goodPrjRes.id)?.status === 'OPEN_FOR_FUNDING', 'Project is now OPEN_FOR_FUNDING')

/* ------------------------------------------------------------- 4. 5% Admin Cap & Dual MoU Sign-Off */
section('4. 5% Admin Overhead Cap & Dual Sanction Gate')

// 5% Admin Cap check: 6.5% overhead should be blocked
const capFailDeal = db().createCsrDeal({
  projectId: goodPrjRes.id,
  companyId: 'csr-cmp-tvs',
  status: 'MOU_DRAFT',
  committedAmount: 100000000,
  adminCapPct: 6.5,
  needsImpactAssessment: false,
  ownerId: 'u-adm',
  tranches: [],
}, U['u-adm'])
ok(!capFailDeal.ok, 'Administrative overhead > 5.0% strictly blocked under Section 135(5)')

// Compliant deal with 4.8% overhead
const goodDeal = db().createCsrDeal({
  projectId: goodPrjRes.id,
  companyId: 'csr-cmp-tvs',
  status: 'MOU_DRAFT',
  committedAmount: 200000000,
  adminCapPct: 4.8,
  needsImpactAssessment: false,
  ownerId: 'u-adm',
  tranches: [
    {
      id: 'trn-test-1',
      dealId: '',
      seqNo: 1,
      amount: 100000000,
      dueDate: '2026-06-01',
      conditionText: 'Signed MoU',
      status: 'SCHEDULED',
    },
    {
      id: 'trn-test-2',
      dealId: '',
      seqNo: 2,
      amount: 100000000,
      dueDate: '2026-12-01',
      conditionText: 'Tranche 1 CA Utilisation Certificate',
      status: 'SCHEDULED',
    },
  ],
}, U['u-adm'])
ok(goodDeal.ok, 'MoU drafted with 4.8% admin overhead')

// CA Partner approves
db().decideCsrMoU(goodDeal.id, 'approved', U['u-cap'], 'MoU clauses audited')
ok(db().csrDeals.find((d) => d.id === goodDeal.id)?.status === 'MOU_DRAFT', 'Deal remains draft until both CA and Trustee approve')

// Trustee approves: transitions to ACTIVE
db().decideCsrMoU(goodDeal.id, 'approved', U['u-tru'], 'Board sanctioned')
ok(db().csrDeals.find((d) => d.id === goodDeal.id)?.status === 'ACTIVE', 'Dual approval complete: Deal is ACTIVE')

/* ------------------------------------------------------------- 5. Sequential UC Gate & Fund Credit */
section('5. Sequential Tranche Clearance & Utilisation Certificate')

// Signing created the deal's own restricted fund and project budget
const liveDeal = db().csrDeals.find((d) => d.id === goodDeal.id)
const dealFund = db().funds.find((f) => f.id === liveDeal.fundId)
ok(dealFund?.csrProjectId === goodPrjRes.id, 'Signed MoU created a restricted CSR fund tied to its project')
ok(db().budgets.some((b) => b.fundId === dealFund?.id && b.csrProjectId === goodPrjRes.id), 'Signed MoU created the project CSR budget head')

// Tranche 1 received
const r1 = db().receiveCsrTranche(goodDeal.id, 'trn-test-1', 'CMS/TVS/TEST1/UTR', U['u-adm'])
ok(r1.ok, 'Tranche #1 received and credited')
ok(db().funds.find((f) => f.id === dealFund.id)?.balance === 100000000, 'Dedicated restricted CSR fund balance increased by ₹10,00,000')
const je = db().journal.find((j) => j.id === 'je-csr-trn-test-1')
ok(je && je.lines.some((l) => l.account === 'Bank' && l.debit === 100000000) && je.lines.some((l) => l.account === 'CSR grant income' && l.credit === 100000000), 'Tranche receipt posted to the ledger (Bank / CSR grant income)')

// Attempt receiving Tranche 2 BEFORE Tranche 1 UC is signed: MUST FAIL
const r2Fail = db().receiveCsrTranche(goodDeal.id, 'trn-test-2', 'CMS/TVS/TEST2/UTR', U['u-adm'])
ok(!r2Fail.ok, 'Tranche #2 is hard-blocked: Tranche #1 Utilisation Certificate is not signed')

// Draft UC for Tranche 1
const ucRes = db().createCsrUc({
  dealId: goodDeal.id,
  trancheId: 'trn-test-1',
  trancheSeq: 1,
  amountReceived: 100000000,
  amountUtilised: 100000000,
  balanceRemaining: 0,
  preparedBy: 'Senior Accountant',
  narrative: '100% of Tranche #1 utilized for RO equipment procurement',
}, U['u-adm'])
ok(ucRes.ok, 'Utilisation Certificate drafted')

// Devotee cannot sign UC
const devSign = db().signCsrUc(ucRes.id, '26048912AAAAAA9812', '048912', U['u-dev'])
ok(!devSign.ok, 'Only Chartered Accountants can sign statutory Utilisation Certificates')

// Invalid UDIN fails
const badUdin = db().signCsrUc(ucRes.id, 'short', '048912', U['u-cap'])
ok(!badUdin.ok, 'Invalid / short UDIN rejected')

// CA signs with valid UDIN
const caSign = db().signCsrUc(ucRes.id, '26048912AAAAAA9812', '048912', U['u-cap'])
ok(caSign.ok, 'CA Partner signed Utilisation Certificate with ICAI UDIN: 26048912AAAAAA9812')
ok(db().csrUtilisationCertificates.find((u) => u.id === ucRes.id)?.status === 'signed', 'UC is officially signed')

// NOW Tranche 2 can be received!
const r2Success = db().receiveCsrTranche(goodDeal.id, 'trn-test-2', 'CMS/TVS/TEST2/UTR', U['u-adm'])
ok(r2Success.ok, 'Tranche #2 successfully released now that Tranche #1 UC is certified')

/* ------------------------------------------------------------- 6. Photo Evidence Milestone */
section('6. Photo Progress Evidence')

const progRes = db().addCsrProgressUpdate({
  projectId: goodPrjRes.id,
  periodStart: '2026-06-01',
  periodEnd: '2026-11-30',
  beneficiariesReached: 3800,
  narrative: 'RO water plant civil work and filtration membranes successfully tested.',
  photos: [
    { url: 'https://example.com/ro-plant.jpg', caption: 'Water distribution point', consentOk: true },
  ],
  createdBy: 'Field Supervisor',
}, U['u-adm'])
ok(progRes.ok, 'Photo progress update with beneficiary count logged')
ok(db().csrProgressUpdates.some((p) => p.id === progRes.id), 'Progress update exists in database')

/* ------------------------------------------------------------- 7. Seeded books */
section('7. Seeded CSR books tie to the ledger')

ok(!db().journal.some((j) => j.sourceRef === 'OPENING/fund-csr-tvs-anna'), 'CSR funds have no invented opening balance')
ok(db().journal.some((j) => j.id === 'je-csr-trn-1') && db().journal.some((j) => j.id === 'je-csr-trn-2'), 'Both TVS tranches are in the ledger')
const tvsFund = db().funds.find((f) => f.id === 'fund-csr-tvs-anna')
const tvsHead = db().budgets.find((b) => b.fundId === 'fund-csr-tvs-anna')
ok(tvsHead?.allocated === 150000000 && tvsHead?.spent === 150000000, 'Tranche 1 was allotted to the project budget and spent, as its UC certifies')
ok(tvsFund?.balance === 150000000, 'Tranche 2 waits unallotted in the TVS CSR fund')
ok(db().csrDeals.find((d) => d.id === 'csr-deal-murugappa-art')?.fundId === 'fund-csr-heritage', 'Murugappa deal is linked to its heritage CSR fund')

/* ------------------------------------------------------------- 8. CSR money only for its project */
section('8. CSR money is spent only on its own project')

const sevGen = db().funds.find((f) => f.id === 'fund-sev-gen')
const kitchen = db().budgets.find((b) => b.id === 'bh-sev-kitchen')
ok(Boolean(allotmentFundError(tvsFund, kitchen)), 'CSR fund cannot be allotted to an ordinary budget head')
ok(allotmentFundError(tvsFund, tvsHead) === null, 'CSR fund can be allotted to its own project budget')
ok(Boolean(allotmentFundError(sevGen, tvsHead)), 'General money cannot be mixed into a CSR project budget')

/* ------------------------------------------------------------- 9. Four-eyes at every gate */
section('9. One person prepares, a different person approves')

const ownDoc = db().uploadCsrDocument({ entityId: 'csr-ent-sangam', docType: 'ITR', label: 'ITR FY 2025-26', filePath: '/vault/itr.pdf', uploadedBy: 'u-cas' }, U['u-cas'])
ok(!db().verifyCsrDocument(ownDoc.id, 'verified', 'ok', U['u-cas']).ok, 'CA cannot verify a document they uploaded')
ok(!db().verifyCsrDocument(ownDoc.id, 'verified', 'ok', U['u-tru']).ok, 'Only the CA team verifies papers (Trustee refused)')
ok(db().verifyCsrDocument(ownDoc.id, 'verified', 'ok', U['u-cap']).ok, 'A different CA verifies it')

const lines = (cat, amt) => [{ id: 'b1', category: cat, description: 'Line', amount: amt }]
const trusteePrj = db().createCsrProject({ entityId: 'csr-ent-sevalaya', title: 'Village Library', scheduleViiCode: 'ii', description: 'Books', state: 'Tamil Nadu', district: 'Madurai', beneficiaryType: 'Children', beneficiaryTarget: 300, startDate: '2026-11-01', endDate: '2027-10-31', totalBudget: 5000000, budgetLines: lines('MATERIALS', 5000000), createdBy: 'u-tru' }, U['u-tru'])
ok(!db().decideCsrProject(trusteePrj.id, 'approved', U['u-tru']).ok, 'Trustee cannot approve a project they prepared')
ok(!db().decideCsrProject(trusteePrj.id, 'approved', U['u-cap']).ok, 'Only a Trustee approves a project (CA Partner refused)')

const deal = (projectId, ownerId, tranches = []) => ({ projectId, companyId: 'csr-cmp-lt', status: 'MOU_DRAFT', committedAmount: 20000000, adminCapPct: 3, needsImpactAssessment: false, ownerId, tranches })
ok(!db().createCsrDeal(deal(trusteePrj.id, 'u-adm'), U['u-adm']).ok, 'An unapproved project cannot be pitched')

const sgmPrj = db().createCsrProject({ entityId: 'csr-ent-sangam', title: 'Tamil Heritage Classes', scheduleViiCode: 'v', description: 'Classes', state: 'Tamil Nadu', district: 'Chennai', beneficiaryType: 'Students', beneficiaryTarget: 200, startDate: '2026-11-01', endDate: '2027-10-31', totalBudget: 4000000, budgetLines: lines('SALARIES', 4000000), createdBy: 'u-adm' }, U['u-adm'])
db().decideCsrProject(sgmPrj.id, 'approved', U['u-tru'])
ok(!db().createCsrDeal(deal(sgmPrj.id, 'u-adm'), U['u-adm']).ok, 'Tamil Sangam cannot be pitched until it is CSR_READY')

const draftDeal = db().createCsrDeal(deal(goodPrjRes.id, 'u-cap', [{ id: 'trn-d1', dealId: '', seqNo: 1, amount: 20000000, dueDate: '2027-01-01', conditionText: 'MoU', status: 'SCHEDULED' }]), U['u-cap'])
ok(draftDeal.ok, 'A second MoU is drafted by the CA Partner')
ok(!db().decideCsrMoU(draftDeal.id, 'approved', U['u-cap']).ok, 'The deal owner cannot sign their own MoU')
ok(!db().receiveCsrTranche(draftDeal.id, 'trn-d1', 'UTR/X', U['u-adm']).ok, 'No money can be received before the MoU is signed')

const ucDraft = db().createCsrUc({ dealId: goodDeal.id, trancheId: 'trn-test-2', trancheSeq: 2, amountReceived: 100000000, amountUtilised: 60000000, balanceRemaining: 40000000, preparedBy: 'u-cas' }, U['u-cas'])
ok(ucDraft.ok, 'CA Staff drafts the Tranche #2 certificate')
ok(!db().signCsrUc(ucDraft.id, '26048912AAAAAA9813', '048912', U['u-cas']).ok, 'CA Staff cannot sign a certificate they drafted')
ok(db().signCsrUc(ucDraft.id, '26048912AAAAAA9813', '048912', U['u-cap']).ok, 'A different CA signs it')

/* ------------------------------------------------------------- 10. Approvals inbox */
section('10. CSR gates appear in the approvals inbox')

const kinds = new Set(approvalTasks(db(), 'all').map((t) => t.kind))
ok(kinds.has('csr_document'), 'Pending compliance papers are in the inbox')
ok(kinds.has('csr_project'), 'Projects waiting for a Trustee are in the inbox')
ok(kinds.has('csr_mou'), 'MoUs waiting for signatures are in the inbox')

console.log(`\nCSR Verification complete: ${pass} passed, ${fail} failed.\n`)
process.exit(fail === 0 ? 0 : 1)
