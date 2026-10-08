# OMG Platform — prototype

A web application for three sectors that share one money flow: **Temple** (கோவில்),
**Sevalaya** (சேவாலயா) and **Tamil Sangam** (தமிழ்ச் சங்கம்).

Mock data only. No backend, no real payments. Built to look and behave like the real thing.

## Running it

```bash
npm install
npm run dev     # http://localhost:5173
npm run build   # typechecks, then builds
npm run lint
```

## The flow

| Phase | Colour | Screens |
|---|---|---|
| **Collect** | turmeric | Donor home, catalog, checkout, receipt, donations, catalog manager |
| **Control** | kumkum | Reconciliation, ledger, fund allotments, budgets, approvals |
| **Spend** | tulsi | Inventory, suppliers, procurement wizard, purchase orders, payments |
| **Report** | peacock | Dashboard, reports, audit log |

## Two surfaces

- **Donor site** at `/` — warm, mobile-first, no sign-in needed to browse.
  Sign-in uses a mock OTP: the code is always **108108**.
- **Admin console** at `/console` — sidebar layout, sector filter in the top bar.

### The persona switcher

Top right of the console. It is a **demo control**: it changes the visible menu and,
more importantly, which approve buttons are live. The four-eyes rule is enforced in
the store, not just in the UI, so switching persona is the way to walk a transaction
all the way through.

A worked example:

1. As **Procurement Officer**, go to Inventory, request an item, then approve that
   request as **Store Keeper** or **Sector Admin**.
2. Still as Procurement Officer, open **New purchase order**, pick the approved
   request, take an AI suggestion and submit it.
3. Switch to **CA Staff** or **CA Partner** and approve it on the PO detail page.
   Watch the budget bar move from available to committed.
4. Send it to the supplier, record a goods receipt, record the invoice.
5. In **Payments**, approve it. Committed falls, spent rises, and the ledger gains
   an entry.

Try approving your own work at any step — the button is disabled and says why.

## What is enforced

1. **Maker-checker** — the preparer can never approve. Checked in `store/db.ts`.
2. **Approval matrix** (`config.ts`) — up to $1,000 CA Staff; to $10,000 CA Partner;
   above that CA Partner **and** Trustee, in two steps.
3. **Budget effects** — allotment approved raises `allocated`; PO approved raises
   `committed`; payment approved moves `committed` into `spent`; cancelling a PO
   releases `committed`.
4. **Budget guard** — a PO over the available balance cannot be submitted, and the
   over-budget banner offers a re-allotment.
5. **Restricted funds** — a project fund only reaches its own project head. Corpus
   funds cannot be allotted at all.
6. **3-way match** — PO against goods receipt against invoice. Anything past 2% is
   flagged red and blocks payment until a CA comments on it.
7. **AI override** — choosing a supplier that is not ranked #1 needs a reason of at
   least 10 characters, stored on the order and shown to the approver.
8. **Append-only ledger** — no edit or delete. Corrections are reversal entries.
9. **Audit trail** — every action records who, what, when and before/after.

## Mock data

Generated once per page load from a seeded RNG (mulberry32, seed `108`), so every
reload gives identical data. Covers the last 12 months: ~1,800 donations, 240 donors,
45 inventory items, 14 suppliers, 120 purchase orders, 18 budget heads and roughly 25
pending approvals.

Festival months lift income visibly — Pongal, Tamil New Year, Vinayaka Chaturthi,
Navaratri, Deepavali and Karthigai Deepam.

It also carries the awkward cases on purpose: 3 unreconciled Square payouts, 2 refunds,
a disputed charge, a partially received PO, an invoice that does not match its order,
a blocked supplier, and one budget head genuinely over its allocation.

The store resets to seed on reload. Only the persona and sector filter persist.

## Layout

```
src/
  config.ts          currency, sectors, phases, approval matrix, chart palette
  lib/               cn, format (money/date), status map, seeded rng, toast store
  types/             domain types, shared with the future backend
  mock/              seed.ts (reference data), generators.ts, api.ts (fake latency)
  store/             db.ts (entities + actions), selectors.ts, session.ts
  components/        ui/, layout/, flow/, charts/
  features/          one folder per module
```

Pages read data through `store/db.ts` and `store/selectors.ts`, never by importing
seed files, so swapping in a real API is a change in one place.

## A note on the chart palette

Sector identity in the UI uses the design tokens exactly as specified. Chart series
use the same colours with one change: peacock is nudged from `#1C6E8C` to `#1A6FA8`.
The specified trio fails a colour-blind separation check against tulsi green; the
nudged set passes every check. Chart colours live in `config.ts` under `CHART`, so no
raw hex appears in JSX. Turmeric sits below 3:1 contrast against the page, so anything
drawn in it always carries a visible label or a table beside it.

## The mark

The logo is a gopuram in a brass-edged seal, lit at the sanctum door, drawn in
`OmgMark` (`src/components/ui/Ornament.tsx`) with a matching `public/favicon.svg`.
It is built for the smallest size it must survive — three bold tiers, overhanging
cornices, a plinth and a kalasam, and nothing finer — so it still reads as a temple
at 16px. Checked at 16/20/24/32/44/64/96/160 on both warm paper and the dark
sidebar.

If you edit the standalone `favicon.svg`, note that SVG's default fill is black:
the outer hairline rect needs an explicit `fill="none"` or it paints over the mark.

## Photography

Four images live in `public/images`, referenced through `src/lib/photos.ts`:

| File | Used on |
|---|---|
| `temple-gopuram.webp` | donor hero, Temple card and banner |
| `sevalaya-annadhanam.webp` | Sevalaya card and banner |
| `sangam-hall.webp` | Tamil Sangam card and banner |
| `project-rajagopuram.webp` | the featured project card |

All four carry one grade and one warm wash (`PHOTO_GRADE` / `PHOTO_WASH` in
`src/lib/photos.ts`), so separately sourced pictures read as a single
commissioned set rather than four stock shots. Each placement sets its own crop
via `position`, because a tall frame cut to a wide banner otherwise lands on
whatever happens to be in the middle.

They were generated with an image model and compressed to WebP (7.1 MB of PNG
down to 479 KB). To swap in real photography, drop replacements at the same
paths and update the alt text in `src/lib/photos.ts` — nothing else changes.
The hero loads eagerly; the rest are lazy.

## Looking at it

The design was iterated against real screenshots, not guessed. To do that again:

```bash
npm i -D playwright && npx playwright install chromium
```

Then drive `http://localhost:5173` with a short script, capturing `/`,
`/donate/temple`, `/console`, `/console/budgets` and `/console/procurement`
at 1440px and 390px. Both dependencies were removed again after use, so nothing
test-only ships in `package.json`.
