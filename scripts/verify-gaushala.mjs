// Headless check of the Gaushala module. Run: npm run verify:gaushala
import { pathToFileURL } from 'node:url'
import path from 'node:path'

const root = process.cwd()
const { createServer } = await import(pathToFileURL(path.join(root, 'node_modules/vite/dist/node/index.js')).href)

const mem = new Map()
globalThis.localStorage = { getItem: (k) => mem.get(k) ?? null, setItem: (k, v) => mem.set(k, v), removeItem: (k) => mem.delete(k) }

const server = await createServer({ root, logLevel: 'error', server: { middlewareMode: true }, appType: 'custom' })
const load = (p) => server.ssrLoadModule(p)

const { useDb } = await load('/src/store/db.ts')
const seed = await load('/src/mock/seed.ts')
const gau = await load('/src/mock/gaushala.ts')
const offerings = await load('/src/mock/offerings.ts')
const currency = await load('/src/lib/currency.ts')
const cfg = await load('/src/config.ts')
const prog = await load('/src/mock/gaushalaPrograms.ts')

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

/* ------------------------------------------------- the Seva page is intact */
section('The existing Seva catalog is untouched')

const sevaItems = seed.CATALOG.filter((c) => c.sectorId === 'sevalaya')
ok(sevaItems.length > 0, `Sevalaya still has ${sevaItems.length} offerings`)
ok(
  sevaItems.every((c) => !c.gaushala),
  'not one Gaushala sewa leaked into the Sevalaya catalog',
)
ok(
  seed.CATALOG.every((c) => !c.gaushala),
  'CATALOG is free of Gaushala sewas entirely, so no sector page can show one',
)
ok(
  sevaItems.some((c) => c.id === 'cat-sev-annadhanam') && sevaItems.some((c) => c.id === 'cat-sev-meal'),
  'the Annadhanam offerings are still there',
)

/* ------------------------------------------------------------- the catalog */
section('Gaushala sewa catalogue')

const sewas = gau.GAUSHALA_SEWAS
ok(sewas.length >= 25, `${sewas.length} sewas seeded`)
ok(sewas.every((s) => s.gaushala === true), 'every sewa is flagged as Gaushala')
ok(sewas.every((s) => s.sectorId === 'sevalaya'), 'every sewa sits inside the Sevalaya sector')
ok(
  sewas.every((s) => seed.FUNDS.some((f) => f.id === s.fundId)),
  'every sewa credits a fund that exists',
)
ok(
  sewas.every((s) => seed.GAUSHALA_FUND_IDS.includes(s.fundId)),
  'every sewa credits a Gaushala fund, never a Sevalaya one',
)
ok(
  new Set(sewas.map((s) => s.id)).size === sewas.length,
  'no duplicate sewa ids',
)
for (const cat of ['fodder', 'cow_care', 'medical', 'infrastructure', 'general', 'occasion']) {
  ok(sewas.some((s) => s.gaushalaCategory === cat && s.active), `the ${cat} tab has at least one live sewa`)
}
ok(
  sewas.every((s) => !s.needsDedication || s.needsDate),
  'every sankalpa sewa also asks for the date it is to be done',
)

/* --------------------------------------------------- the cart can hold one */
section('A sewa goes through the existing cart and ledger')

ok(offerings.offeringById('gau-green-grass')?.name === 'Green Grass', 'a Gaushala sewa resolves by id')
ok(offerings.offeringById('cat-sev-meal')?.name === 'Sponsor One Meal', 'a Seva offering still resolves by id')
ok(offerings.offeringById('nope') === undefined, 'an unknown id resolves to nothing')
ok(
  offerings.OFFERINGS.length === seed.CATALOG.length + sewas.length,
  'the combined list is exactly both catalogs',
)

const fodderFundBefore = db().funds.find((f) => f.id === 'fund-gau-fodder').balance

const donation = db().recordDonation({
  lines: [{ key: 'k1', itemId: 'gau-green-grass', sectorId: 'sevalaya', amount: 2700 }],
  method: 'card',
  donorName: 'Test Donor',
  actor: U['u-dev'],
  donorCountry: 'GB',
  displayCurrency: 'GBP',
})
ok(donation.fundId === 'fund-gau-fodder', 'the donation credited the Gaushala Fodder Fund, not the Sevalaya general fund')
ok(donation.gross === 2700, 'the gross is what was given')
ok(donation.status === 'pending', 'it starts pending, waiting on the gateway')
ok(donation.lines[0].category === 'activity', 'the line carries the accounting category the ledger understands')

db().confirmDonationPayment(donation.id, seed.SQUARE_WEBHOOK)
ok(db().donations.find((d) => d.id === donation.id).status === 'paid', 'the webhook marks it paid')

db().issueReceipt(donation.id, U['u-cas'])
const receipted = db().donations.find((d) => d.id === donation.id)
ok(receipted.status === 'receipted', 'a receipt number was issued')
ok(receipted.receiptNo !== '—', `receipt no ${receipted.receiptNo}`)

ok(receipted.donorCurrency === 'GBP', 'a live gift records the currency the donor was shown')
ok(receipted.fxRate === currency.fxRate('GBP'), 'and the rate it was settled at')
ok(receipted.donorCountry === 'GB', 'and the country they gave')
ok(receipted.receiptTemplateId === gau.receiptTemplateFor('GB').id, 'and which receipt wording applies to them')
ok(Boolean(receipted.entityId), 'and which legal entity received it')
ok(receipted.gateway === 'square', 'the gateway is the one the rest of the site uses')
ok(receipted.gatewayPaymentId === receipted.squarePaymentId, 'the gateway payment id is the Square one')

const fodderFundAfter = db().funds.find((f) => f.id === 'fund-gau-fodder').balance
ok(fodderFundAfter === fodderFundBefore + receipted.net, 'the Fodder Fund rose by the net amount')
ok(
  db().journal.some((j) => j.sourceRef === donation.id),
  'the ledger has a journal entry for it',
)

/* ----------------------------------------- the seeded money, end to end */
section('Gaushala money runs through the same pipeline as everything else')

const gaushalaDonations = db().donations.filter((d) => seed.GAUSHALA_FUND_IDS.includes(d.fundId))
ok(gaushalaDonations.length > 150, `${gaushalaDonations.length} Gaushala gifts seeded into the main donations table`)
ok(
  gaushalaDonations.every((d) => d.sectorId === 'sevalaya'),
  'every one is booked to Sevalaya, the sector the Gaushala lives in',
)

// Ids and receipt numbers share a namespace with every other gift.
const allIds = db().donations.map((d) => d.id)
ok(new Set(allIds).size === allIds.length, 'no donation id collides with another')
const receipts = db().donations.map((d) => d.receiptNo).filter((r) => r !== '—')
ok(new Set(receipts).size === receipts.length, 'no receipt number collides with another')
ok(
  gaushalaDonations.every((d) => d.receiptNo.startsWith('RCP-GAU-')),
  'the shelter has its own receipt series',
)

// The payment lifecycle, exactly as the rest of the app records it.
const cardKinds = ['card', 'apple_pay', 'google_pay']
const cardGifts = gaushalaDonations.filter((d) => cardKinds.includes(d.method))
const offlineGifts = gaushalaDonations.filter((d) => !cardKinds.includes(d.method))
ok(cardGifts.length > 0 && offlineGifts.length > 0, 'both online and counter gifts are represented')
ok(
  cardGifts.every((d) => d.squarePaymentId && d.webhookAt),
  'every card gift carries a gateway payment id and the webhook timestamp',
)
ok(
  offlineGifts.every((d) => !d.squarePaymentId && d.fee === 0),
  'cash and cheque carry no gateway id and no processing fee',
)
const expectedFee = (gross) => Math.round(gross * cfg.APP.fee.percent) + cfg.APP.fee.fixedCents
ok(
  cardGifts.every((d) => d.fee === expectedFee(d.gross)),
  'the processing fee uses the same formula as every other donation',
)
ok(
  gaushalaDonations.every((d) => d.net === d.gross - d.fee),
  'net is gross minus the fee on every gift',
)
ok(
  gaushalaDonations.some((d) => d.status === 'reconciled') &&
    gaushalaDonations.some((d) => d.status === 'allotted'),
  'the gifts age through receipted, reconciled and allotted like the others',
)
ok(
  gaushalaDonations.some((d) => d.status === 'refunded') && gaushalaDonations.some((d) => d.status === 'failed'),
  'a refund and a failed card are seeded, so those paths have rows',
)

// Payouts, fund balances and the ledger all pick them up with no special case.
const inPayouts = db().payouts.filter((p) =>
  p.donationIds.some((id) => gaushalaDonations.some((d) => d.id === id)),
)
ok(inPayouts.length > 5, `${inPayouts.length} Square payouts include Gaushala money`)
ok(
  db().journal.filter((j) => j.lines.some((l) => seed.GAUSHALA_FUND_IDS.includes(l.fundId))).length > 100,
  'the ledger carries a journal entry for the Gaushala gifts',
)
for (const fundId of seed.GAUSHALA_FUND_IDS) {
  const credited = gaushalaDonations
    .filter((d) => d.fundId === fundId && d.status !== 'failed' && d.status !== 'refunded')
    .reduce((t, d) => t + d.net, 0)
  ok(credited > 0, `${fundId} actually received money`)
}

// International fields travel with the gift; the ledger never sees a rate.
ok(
  gaushalaDonations.every((d) => d.donorCurrency && d.fxRate && d.donorCountry && d.entityId && d.receiptTemplateId),
  'every Gaushala gift records the currency shown, the rate, the country, the entity and the receipt template',
)
ok(
  new Set(gaushalaDonations.map((d) => d.donorCurrency)).size > 3,
  'donors are spread across several currencies',
)
const abroad = gaushalaDonations.find((d) => d.donorCurrency === 'INR')
ok(
  abroad && abroad.displayGross === (gau.gaushalaSewaById(abroad.lines[0].itemId)?.prices?.INR ?? currency.convert(abroad.gross, 'INR')),
  'what the donor was shown matches the explicit price, or the converted one',
)
ok(
  gaushalaDonations.every((d) => Number.isInteger(d.gross) && Number.isInteger(d.net)),
  'the stored amounts are still whole settlement cents',
)

// Every sewa order is backed by a gift that actually paid for it.
ok(
  db().sewaOrders.every((o) => o.donationId),
  'no sewa order exists without a donation behind it',
)
ok(
  db().sewaOrders.every((o) => db().donations.some((d) => d.id === o.donationId)),
  'every one points at a donation that exists',
)
ok(
  db().sewaOrders.every((o) => {
    const d = db().donations.find((x) => x.id === o.donationId)
    return d && d.gross === o.amount
  }),
  'the order is for the amount that was actually paid',
)
ok(
  db().sewaOrders.filter((o) => o.status === 'cancelled').every((o) => {
    const d = db().donations.find((x) => x.id === o.donationId)
    return d && (d.status === 'refunded' || d.status === 'failed')
  }),
  'a cancelled sewa is always one whose money came back or never arrived',
)
ok(
  db().sewaOrders.filter((o) => o.status === 'paid').length > 0 &&
    db().sewaOrders.filter((o) => o.status === 'assigned').length > 0,
  'the fulfilment queue has work waiting and work in progress',
)

/* ------------------------------------------------------------- the herd */
section('The herd and its health record')

const cows = db().cows
ok(cows.length >= 12, `${cows.length} animals on the register`)
ok(cows.every((c) => c.name && c.breed && c.story), 'every cow has a name, a breed and a story')
ok(cows.some((c) => c.kind === 'calf'), 'there are calves')
ok(cows.some((c) => c.kind === 'bull' || c.kind === 'ox'), 'there are bulls')
ok(cows.some((c) => c.status === 'sick' || c.status === 'recovering'), 'at least one animal is under treatment')
ok(
  cows.every((c) => seed.USERS.some((u) => u.id === c.caretakerId)),
  'every cow is assigned to a caretaker who exists',
)
ok(
  db().cowHealth.every((h) => cows.some((c) => c.id === h.cowId)),
  'every health record belongs to a cow on the register',
)
ok(
  cows.every((c) => db().cowHealth.some((h) => h.cowId === c.id)),
  'every cow has at least one health record',
)

const beforeCows = db().cows.length
const created = db().createCow(
  {
    name: 'Test Cow', kind: 'cow', breed: 'Kangayam', gender: 'female', ageYears: 5,
    status: 'adoptable', story: 'Added by the verification run.',
    rescuedAt: new Date().toISOString(), caretakerId: 'u-gau-care', monthlyCare: 6500,
  },
  U['u-gau-adm'],
)
ok(created.ok && db().cows.length === beforeCows + 1, 'a Gaushala admin can add a cow')
ok(!db().createCow({ name: 'X', kind: 'cow', breed: '', gender: 'female', ageYears: 1, status: 'adoptable', story: '', rescuedAt: new Date().toISOString(), caretakerId: 'u-gau-care', monthlyCare: 0 }, U['u-gau-adm']).ok, 'a one-letter name is rejected')

const newCow = db().cows[0]
ok(db().updateCow(newCow.id, { status: 'sick' }, U['u-gau-adm']).ok, 'her status can be changed')
ok(db().cows.find((c) => c.id === newCow.id).status === 'sick', 'the change stuck')
ok(!db().updateCow('cow-nope', { status: 'sick' }, U['u-gau-adm']).ok, 'an unknown cow is rejected')

const healthBefore = db().cowHealth.length
ok(
  db().addCowHealthRecord({ cowId: newCow.id, kind: 'vaccination', note: 'FMD booster given.', vet: 'Dr. Test', cost: 2400 }, U['u-gau-care']).ok,
  'a caretaker can log a vaccination',
)
ok(db().cowHealth.length === healthBefore + 1, 'the record was added')
ok(
  !db().addCowHealthRecord({ cowId: newCow.id, kind: 'checkup', note: 'x', vet: 'Dr. Test', cost: 0 }, U['u-gau-care']).ok,
  'a record with no real note is rejected',
)

/* ---------------------------------------------------- the fulfilment queue */
section('Proof of sewa: paid, assigned, completed')

const orders = db().sewaOrders
ok(orders.length >= 30, `${orders.length} sewa orders seeded`)
ok(
  orders.every((o) => gau.gaushalaSewaById(o.sewaId)),
  'every order points at a sewa that exists',
)
ok(orders.some((o) => o.status === 'paid'), 'some are paid and waiting')
ok(orders.some((o) => o.status === 'assigned'), 'some are assigned')
ok(orders.some((o) => o.status === 'completed'), 'some are completed')
ok(
  orders.filter((o) => o.status === 'completed').every((o) => o.proofMedia && o.proofMedia.length > 0),
  'every completed sewa carries proof media',
)

const waiting = db().sewaOrders.find((o) => o.status === 'paid')
ok(!db().assignSewaOrder(waiting.id, '', U['u-gau-adm']).ok, 'assigning with no caretaker is refused')
ok(db().assignSewaOrder(waiting.id, 'u-gau-care', U['u-gau-adm']).ok, 'it can be assigned to a caretaker')
ok(db().sewaOrders.find((o) => o.id === waiting.id).status === 'assigned', 'it is now assigned')
ok(!db().assignSewaOrder(waiting.id, 'u-gau-care', U['u-gau-adm']).ok, 'it cannot be assigned twice')

ok(
  !db().completeSewaOrder(waiting.id, { kind: 'photo', caption: 'ok', at: '', art: 0 }, U['u-gau-care']).ok,
  'completing without a real caption is refused',
)
ok(
  db().completeSewaOrder(
    waiting.id,
    { kind: 'photo', caption: 'Green fodder offered at the morning feed.', at: '', art: 0 },
    U['u-gau-care'],
  ).ok,
  'it completes with a photograph and a caption',
)
const done = db().sewaOrders.find((o) => o.id === waiting.id)
ok(done.status === 'completed' && done.proofMedia.length > 0, 'the proof is on the order')
ok(!!done.completedAt, 'the completion was timestamped')

const stillPaid = db().sewaOrders.find((o) => o.status === 'paid')
ok(Boolean(stillPaid), 'the queue still holds paid sewas waiting on their service date')
ok(
  !db().completeSewaOrder(stillPaid?.id ?? 'SO-nope', { kind: 'photo', caption: 'Done already somehow.', at: '', art: 0 }, U['u-gau-care']).ok,
  'a paid sewa cannot skip straight to completed',
)

/* ------------------------------------------------------------- currencies */
section('Multi-currency display')

ok(currency.SETTLEMENT_CURRENCY === 'USD', 'the books settle in USD')
ok(currency.currencyForCountry('IN') === 'INR', 'a donor in India is shown rupees')
ok(currency.currencyForCountry('DE') === 'EUR', 'a donor in Germany is shown euro')
ok(currency.currencyForCountry(undefined) === 'USD', 'an unknown country falls back to the settlement currency')
ok(currency.currencyForCountry('ZZ') === 'USD', 'so does a country with no mapping')
ok(currency.convert(10_000, 'USD') === 10_000, 'converting to the settlement currency is a no-op')
ok(currency.convert(10_000, 'INR') === Math.round(10_000 * currency.fxRate('INR')), 'conversion uses the stored rate')

const grass = gau.gaushalaSewaById('gau-green-grass')
ok(grass.prices.INR === 75_000, 'green grass has an explicit rupee price')
ok(
  currency.displayPrice(grass.price, 'INR', grass.prices) === currency.formatIn(75_000, 'INR'),
  'the explicit price wins over the converted one',
)
ok(
  currency.displayPrice(grass.price, 'AUD', grass.prices) === currency.formatIn(currency.convert(grass.price, 'AUD'), 'AUD'),
  'a currency with no explicit price falls back to conversion',
)

/* -------------------------------------------------------- receipts, roles */
section('Entities, receipts and roles')

ok(db().gaushalaEntities.length >= 2, 'more than one legal entity is configured, since the country is not settled')
ok(db().gaushalaEntities.filter((e) => e.isDefault).length === 1, 'exactly one is the default')
ok(gau.receiptTemplateFor('US').id === 'rt-us-501c3', 'a US donor gets the 501(c)(3) wording')
ok(gau.receiptTemplateFor('IN').id === 'rt-in-80g', 'an Indian donor gets the 80G wording')
ok(gau.receiptTemplateFor('ZZ').id === 'rt-generic', 'everyone else gets the generic acknowledgement')
ok(gau.receiptTemplateFor(undefined).id === 'rt-generic', 'so does a donor who gave no country')
ok(
  gau.RECEIPT_TEMPLATES.filter((t) => t.donorCountries.includes('*')).length === 1,
  'there is exactly one fallback template',
)
ok(
  gau.RECEIPT_TEMPLATES.some((t) => !t.reviewed),
  'the country-specific wordings are flagged as needing an accountant',
)

for (const role of ['gaushala_admin', 'gaushala_accountant', 'gaushala_caretaker', 'gaushala_content_editor']) {
  ok(seed.USERS.some((u) => u.role === role), `there is a demo persona for ${role}`)
  ok(!!seed.ROLE_LABEL[role], `${role} has a display label`)
}
ok(
  seed.USERS.filter((u) => u.role.startsWith('gaushala_')).every((u) => u.sectorIds.length === 1 && u.sectorIds[0] === 'sevalaya'),
  'every Gaushala role is scoped to Sevalaya alone',
)

/* ------------------------------------------------------- content for demo */
section('Content seeded for the demo')

ok(db().rescues.length >= 3, `${db().rescues.length} rescue stories`)
ok(db().rescues.every((r) => r.treatmentRaised <= r.treatmentGoal), 'no rescue is over-funded')
ok(db().rescues.some((r) => r.treatmentRaised < r.treatmentGoal), 'at least one still needs funding, so the button has a job')
ok(db().gaushalaGallery.length >= 10, `${db().gaushalaGallery.length} gallery items`)
ok(
  new Set(db().gaushalaGallery.map((g) => g.category)).size >= 4,
  'the gallery covers several categories',
)
ok(db().gaushalaExpenses.length === 72, '12 months of expenses across 6 categories')

section('A Seva gift is untouched by any of this')

const sevaGift = db().recordDonation({
  lines: [{ key: 'k2', itemId: 'cat-sev-meal', sectorId: 'sevalaya', amount: 1100 }],
  method: 'card',
  donorName: 'Test Donor',
  actor: U['u-dev'],
  donorCountry: 'GB',
  displayCurrency: 'GBP',
})
ok(sevaGift.fundId === 'fund-sev-anna', 'it still credits the Annadhanam fund')
ok(sevaGift.donorCurrency === undefined, 'no currency is stamped on it')
ok(sevaGift.receiptTemplateId === undefined, 'and no Gaushala receipt template')
ok(sevaGift.fee === Math.round(1100 * cfg.APP.fee.percent) + cfg.APP.fee.fixedCents, 'the fee is unchanged')

/* --------------------------------------------------------- adopt a cow */
section('Adopt a cow')

ok(db().adoptions.length > 0, `${db().adoptions.length} sponsorships seeded`)
ok(
  db().adoptions.every((a) => db().cows.some((c) => c.id === a.cowId)),
  'every sponsorship is for a cow on the register',
)
ok(
  db().adoptions.every((a) => a.certificateNo.startsWith('GAU-ADP-')),
  'every one has a certificate number',
)
ok(db().adoptions.some((a) => a.status === 'lapsed'), 'one has lapsed, so the renewals screen has work')
ok(
  db().adoptions.filter((a) => a.status === 'active').every((a) => a.updates.length > 0),
  'every active adopter has had at least one update sent',
)

// The price comes off the cow's own monthly care figure.
const sampleCow = db().cows.find((c) => c.status === 'adoptable')
ok(prog.adoptionPrice(sampleCow, 'full_monthly') === sampleCow.monthlyCare, 'a full monthly tier is her whole keep')
ok(prog.adoptionPrice(sampleCow, 'shared_monthly') === Math.round(sampleCow.monthlyCare * 0.25), 'a shared tier is a quarter')
ok(prog.adoptionPrice(sampleCow, 'full_yearly') === sampleCow.monthlyCare * 11, 'a yearly tier is eleven months, not twelve')

const freeCow = db().cows.find(
  (c) => c.status === 'adoptable' && db().adoptions.filter((a) => a.cowId === c.id && a.status === 'active').length === 0,
)
ok(!db().adoptCow(freeCow.id, 'full_monthly', { name: 'X', email: 'a@b.com' }, U['u-dev']).ok, 'a one-letter name is refused')
ok(!db().adoptCow(freeCow.id, 'full_monthly', { name: 'Test Adopter', email: 'nope' }, U['u-dev']).ok, 'a bad email is refused')

const adopted = db().adoptCow(freeCow.id, 'full_monthly', { name: 'Test Adopter', email: 'test@example.com' }, U['u-dev'])
ok(adopted.ok, 'a cow can be adopted')
ok(db().cows.find((c) => c.id === freeCow.id).status === 'adopted', 'she is marked adopted on the register')
ok(
  !db().adoptCow(freeCow.id, 'full_monthly', { name: 'Someone Else', email: 'two@example.com' }, U['u-dev']).ok,
  'a fully sponsored cow cannot be adopted twice',
)

const beforeRenew = db().adoptions.find((a) => a.id === adopted.adoption.id).renewsAt
ok(db().renewAdoption(adopted.adoption.id, U['u-gau-adm']).ok, 'it can be renewed')
ok(
  new Date(db().adoptions.find((a) => a.id === adopted.adoption.id).renewsAt) > new Date(beforeRenew),
  'the renewal date moved forward',
)
ok(!db().postAdopterUpdate(adopted.adoption.id, { kind: 'photo', title: 'x', body: 'y', art: 0 }, U['u-gau-adm']).ok, 'an empty update is refused')
ok(
  db().postAdopterUpdate(adopted.adoption.id, { kind: 'photo', title: 'At the feed', body: 'She was first to the trough again today.', art: 0 }, U['u-gau-adm']).ok,
  'a real update is sent',
)
ok(db().cancelAdoption(adopted.adoption.id, U['u-gau-adm']).ok, 'it can be cancelled')
ok(db().cows.find((c) => c.id === freeCow.id).status === 'adoptable', 'she goes back on the public list')

/* ------------------------------------------------------- visit & book */
section('Visit & book')

ok(db().visitServices.length >= 6, `${db().visitServices.length} visit services`)
ok(db().visitServices.some((v) => v.pricePerPerson === 0), 'darshan is free')
ok(db().visitServices.some((v) => v.needsApproval), 'group visits are confirmed by hand')
ok(db().slots.length > 100, `${db().slots.length} slots over the next three weeks`)
ok(
  db().slots.every((sl) => db().visitServices.some((v) => v.id === sl.serviceId)),
  'every slot belongs to a service that exists',
)
ok(db().slots.some((sl) => sl.blackout), 'closed days are in the calendar')
ok(
  db().slots.filter((sl) => sl.blackout).every((sl) => sl.blackoutReason),
  'every closure says why',
)
ok(
  db().slots.every((sl) => sl.booked <= sl.capacity),
  'no slot is booked past its capacity',
)
ok(
  db().bookings.every((b) => db().slots.some((sl) => sl.id === b.slotId)),
  'every booking points at a slot that exists',
)

const openSlot = db().slots.find((sl) => !sl.blackout && sl.capacity - sl.booked >= 2)
const openService = prog.visitServiceById(openSlot.serviceId)
ok(
  !db().createBooking({ slotId: openSlot.id, name: 'Test Visitor', email: 'v@example.com', phone: '1', people: openService.minPeople, consent: false }, U['u-dev']).ok,
  'a booking without the safety waiver is refused',
)
ok(
  !db().createBooking({ slotId: openSlot.id, name: 'Test Visitor', email: 'bad', phone: '1', people: openService.minPeople, consent: true }, U['u-dev']).ok,
  'a bad email is refused',
)
ok(
  !db().createBooking({ slotId: openSlot.id, name: 'Test Visitor', email: 'v@example.com', phone: '1', people: openService.maxPeople + 1, consent: true }, U['u-dev']).ok,
  'more people than the service takes is refused',
)

const bookedBefore = db().slots.find((sl) => sl.id === openSlot.id).booked
const made = db().createBooking(
  { slotId: openSlot.id, name: 'Test Visitor', email: 'v@example.com', phone: '1', people: openService.minPeople, consent: true },
  U['u-dev'],
)
ok(made.ok, 'a valid booking goes through')
ok(
  db().slots.find((sl) => sl.id === openSlot.id).booked === bookedBefore + openService.minPeople,
  'the places came off the slot',
)
ok(Boolean(made.booking.consentAcceptedAt), 'the waiver acceptance is timestamped')

const closedSlot = db().slots.find((sl) => sl.blackout)
ok(
  !db().createBooking({ slotId: closedSlot.id, name: 'Test', email: 'v@example.com', phone: '1', people: 1, consent: true }, U['u-dev']).ok,
  'a closed day cannot be booked',
)

if (made.booking.status === 'confirmed') {
  ok(!db().checkInBooking('nonsense', U['u-gau-care']).ok, 'an unknown gate code is refused')
  ok(db().checkInBooking(made.booking.qrToken, U['u-gau-care']).ok, 'a valid gate code checks the visitor in')
  ok(!db().checkInBooking(made.booking.qrToken, U['u-gau-care']).ok, 'the same code cannot be used twice')
} else {
  ok(
    !db().checkInBooking(made.booking.qrToken, U['u-gau-care']).ok,
    'an unapproved group visit cannot be checked in',
  )
}

const busySlot = db().slots.find((sl) => !sl.blackout && sl.booked > 0)
ok(
  !db().setSlotBlackout(busySlot.id, true, 'Closing it', U['u-gau-adm']).ok,
  'a slot with bookings on it cannot be closed',
)
const emptySlot = db().slots.find((sl) => !sl.blackout && sl.booked === 0)
ok(db().setSlotBlackout(emptySlot.id, true, 'Shed repair', U['u-gau-adm']).ok, 'an empty slot can be closed')
ok(db().slots.find((sl) => sl.id === emptySlot.id).blackoutReason === 'Shed repair', 'the reason is recorded')

/* ------------------------------------------------------------ events */
section('Festivals')

ok(db().gaushalaEvents.length >= 5, `${db().gaushalaEvents.length} festivals on the calendar`)
ok(
  db().gaushalaEvents.some((e) => new Date(e.startAt) > new Date()) &&
    db().gaushalaEvents.some((e) => new Date(e.startAt) < new Date()),
  'the calendar straddles today, so both tabs have content',
)
ok(
  db().gaushalaEvents.every((e) => new Date(e.endAt) > new Date(e.startAt)),
  'every festival ends after it starts',
)
ok(
  db().gaushalaEvents.every((e) => e.startAt.endsWith('Z')),
  'times are stored UTC, to be shown in the viewer zone',
)
ok(db().gaushalaEvents.some((e) => e.livestreamUrl), 'some carry a live stream link')
ok(db().gaushalaEvents.some((e) => e.isPaid), 'some are paid registrations')
ok(
  db().gaushalaEvents.filter((e) => e.isPaid).every((e) => e.ticketPrice > 0),
  'a paid festival always has a price',
)
ok(
  db().eventRsvps.every((r) => db().gaushalaEvents.some((e) => e.id === r.eventId)),
  'every registration points at a festival that exists',
)
ok(
  db().gaushalaEvents.filter((e) => e.status === 'completed').every((e) => e.galleryArt.length > 0),
  'a past festival has pictures from it',
)

const upcomingEvent = db().gaushalaEvents.find((e) => new Date(e.startAt) > new Date() && e.status === 'published')
ok(!db().rsvpGaushalaEvent({ eventId: upcomingEvent.id, name: 'X', email: 'a@b.com', people: 1 }, U['u-dev']).ok, 'a one-letter name is refused')
ok(!db().rsvpGaushalaEvent({ eventId: upcomingEvent.id, name: 'Test Guest', email: 'nope', people: 1 }, U['u-dev']).ok, 'a bad email is refused')

const regBefore = db().gaushalaEvents.find((e) => e.id === upcomingEvent.id).registered
const rsvp = db().rsvpGaushalaEvent({ eventId: upcomingEvent.id, name: 'Test Guest', email: 'g@example.com', people: 2 }, U['u-dev'])
ok(rsvp.ok, 'a registration goes through')
ok(db().gaushalaEvents.find((e) => e.id === upcomingEvent.id).registered === regBefore + 2, 'the headcount went up by two')
ok(db().cancelRsvp(rsvp.rsvp.id, U['u-gau-adm']).ok, 'it can be cancelled')
ok(db().gaushalaEvents.find((e) => e.id === upcomingEvent.id).registered === regBefore, 'the places went back')

const pastEvent = db().gaushalaEvents.find((e) => e.status === 'completed')
ok(
  !db().rsvpGaushalaEvent({ eventId: pastEvent.id, name: 'Test Guest', email: 'g@example.com', people: 1 }, U['u-dev']).ok,
  'a festival already held cannot be registered for',
)

ok(!db().saveGaushalaEvent({ name: 'Too short' }, U['u-gau-adm']).ok, 'a festival with no dates is refused')
const badOrder = db().saveGaushalaEvent(
  { name: 'Backwards Festival', startAt: '2027-01-02T06:00:00Z', endAt: '2027-01-01T06:00:00Z' },
  U['u-gau-adm'],
)
ok(!badOrder.ok, 'a festival that ends before it starts is refused')
const madeEvent = db().saveGaushalaEvent(
  { name: 'Test Festival', startAt: '2027-03-01T01:00:00Z', endAt: '2027-03-01T05:00:00Z', summary: 'A test.', status: 'published' },
  U['u-gau-adm'],
)
ok(madeEvent.ok, 'a valid festival is added')
ok(db().gaushalaEvents.some((e) => e.id === madeEvent.event.id), 'it is on the calendar')

/* --------------------------------------------------------- volunteer */
section('Volunteers')

ok(db().volunteers.length >= 10, `${db().volunteers.length} applications seeded`)
ok(db().volunteers.some((v) => v.status === 'pending'), 'some are waiting to be reviewed')
ok(db().volunteers.some((v) => v.isGroup), 'some are groups or companies')
ok(
  db().volunteers.filter((v) => v.isGroup).every((v) => v.groupSize > 1),
  'a group always says how many are coming',
)
ok(
  db().volunteerShifts.every((sh) => db().volunteers.some((v) => v.id === sh.volunteerId)),
  'every shift belongs to a volunteer who exists',
)
ok(
  db().volunteers.filter((v) => v.status === 'approved').every((v) => {
    const logged = db().volunteerShifts.filter((sh) => sh.volunteerId === v.id).reduce((t, sh) => t + sh.hours, 0)
    return v.hours === logged
  }),
  'the hours on a volunteer match the shifts logged for them',
)

ok(!db().applyVolunteer({ name: 'X', email: 'a@b.com', phone: '', city: '', skills: '', availability: 'Weekends', interests: ['cow_care'], isGroup: false }, U['u-dev']).ok, 'a one-letter name is refused')
ok(!db().applyVolunteer({ name: 'Test Helper', email: 'a@b.com', phone: '', city: '', skills: '', availability: 'Weekends', interests: [], isGroup: false }, U['u-dev']).ok, 'an application with no chosen area is refused')

const applied = db().applyVolunteer(
  { name: 'Test Helper', email: 'h@example.com', phone: '123', city: 'Madurai', skills: 'Lifting', availability: 'Saturday mornings', interests: ['cleaning'], isGroup: false },
  U['u-dev'],
)
ok(applied.ok, 'a valid application goes through')
ok(applied.volunteer.status === 'pending', 'it starts pending')
ok(
  !db().logVolunteerShift({ volunteerId: applied.volunteer.id, date: '2026-10-01', area: 'cleaning', hours: 4 }, U['u-gau-care']).ok,
  'a volunteer who is not approved cannot be put on a shift',
)
ok(!db().decideVolunteer(applied.volunteer.id, 'rejected', U['u-gau-adm'], '').ok, 'declining without a reason is refused')
ok(db().decideVolunteer(applied.volunteer.id, 'approved', U['u-gau-adm']).ok, 'they can be approved')
ok(
  !db().issueVolunteerCertificate(applied.volunteer.id, U['u-gau-adm']).ok,
  'a certificate is refused before the hours are done',
)
ok(!db().logVolunteerShift({ volunteerId: applied.volunteer.id, date: '2026-10-01', area: 'cleaning', hours: 20 }, U['u-gau-care']).ok, 'a 20-hour shift is refused')
for (let i = 0; i < 5; i++) {
  db().logVolunteerShift({ volunteerId: applied.volunteer.id, date: '2026-10-0' + (i + 1), area: 'cleaning', hours: 5 }, U['u-gau-care'])
}
ok(db().volunteers.find((v) => v.id === applied.volunteer.id).hours === 25, '25 hours logged across five shifts')
ok(db().issueVolunteerCertificate(applied.volunteer.id, U['u-gau-adm']).ok, 'the certificate is issued once the hours are there')

/* ------------------------------------------------------ transparency */
section('Transparency')

ok(db().transparencyDocs.length >= 6, `${db().transparencyDocs.length} documents on the shelf`)
ok(db().transparencyDocs.some((d) => d.kind === 'annual_report'), 'annual reports are published')
ok(db().transparencyDocs.some((d) => d.kind === 'audited_accounts'), 'audited accounts are published')
ok(db().transparencyDocs.some((d) => d.kind === 'registration'), 'the registration certificates are there')
ok(db().transparencyDocs.some((d) => !d.audited), 'the current year is still with the auditor, and says so')
ok(db().gaushalaExpenses.length === 72, '12 months of expenses across 6 categories')
ok(
  new Set(db().gaushalaExpenses.map((e) => e.category)).size === 6,
  'six expense categories, which is what the bars show',
)
ok(
  db().gaushalaExpenses.every((e) => e.amount > 0),
  'no expense row is zero or negative',
)
const fodderShare =
  db().gaushalaExpenses.filter((e) => e.category === 'Fodder & feed').reduce((t, e) => t + e.amount, 0) /
  db().gaushalaExpenses.reduce((t, e) => t + e.amount, 0)
ok(fodderShare > 0.4, 'fodder is the largest line, as the page claims')
ok(prog.DAILY_ROUTINE.length >= 8, 'the daily routine is published')
ok(prog.FEED_SCHEDULE.length >= 5, 'the feed schedule is published')

console.log(`\n${pass} passed, ${fail} failed`)
await server.close()
process.exit(fail === 0 ? 0 : 1)
