# How to verify the prototype against the process-flow deck

The deck is `OMG_Platform_Process_Flow.pptx`. It has an onboarding phase (00) and 18 numbered steps in four phases. This guide
checks each one, first with automated checks, then by hand.

## 1. Automated checks

```bash
npm install
npm run build        # TypeScript strict + production build, must finish with no errors
npm run lint         # must print no warnings
npm run verify:flow  # 83 headless checks of the business rules behind the deck
```

`verify:flow` loads the real store and mock data and drives it as each persona. Every line must read `PASS`; the last line
reads `83 passed, 0 failed`. It covers the webhook-before-Paid rule, two-person cash, three-way reconciliation, period
close and lock, store-request approval, approve-then-release, escalation, and tenant isolation.

## 2. Manual walkthrough

Start the app with `npm run dev`. The **persona switcher** (top right in the console, marked *Demo control*) changes who you
are. The store resets to seed data on every reload, so reload to start clean.

| Persona | Name |
|---|---|
| Super Admin | Kavitha Ramesh |
| Sector Admin | Saravanan Pillai |
| Store Keeper | Vasanthi Murugan |
| Procurement Officer | Dinesh Kumar |
| CA Staff | Anitha Rajan |
| CA Partner | R. Balasubramanian |
| Trustee | Meenakshi Sundaram |

### 00 Onboard a customer (Super Admin)

1. Persona **Kavitha Ramesh**. Sidebar: **Platform → Customers**. One customer is live (OMG).
2. **Onboard a customer** and walk the seven steps: Customer, Verticals & modules, Catalog & prices, Square, Approvals,
   Users & roles, Go live.
   - Customer: name `Test Trust`, domain `give.testtrust.org`, pick a brand colour.
   - Verticals: tick only **Sevalaya**. Modules: untick **Inventory & suppliers**.
   - Square: enter `LTEST12345` and press **Verify connection**.
   - Approvals: CA Staff up to `500`, CA Partner up to `5000`.
   - Users: press **Fill the four approver roles with a demo team**.
   - Try **Next** with a missing field first: each step refuses to continue and says what to fix.
3. **Go live**. Expect a toast listing the funds, budget heads and stock items loaded from the template.
4. On **Customers**, press **View books** for Test Trust (or use the **Customer** dropdown in the top bar).
   - Pass: the sidebar shows the new name and a green sidebar, **Inventory** and **Suppliers** are gone, the sector filter
     shows only Sevalaya, and Donations, Ledger and Reconciliation are empty.
   - Pass: open the donor site (`/`). Only Sevalaya is offered, and `/donate/temple` redirects to Sevalaya.
5. Isolation and thresholds: give $2,000 on `/donate/sevalaya` (General Donation, using "Other amount"). As **Anitha Rajan**, open **Fund
   allotments** and prepare an $800 allotment. It needs **CA Partner**, because this customer's Staff limit is $500. Switch
   the **Customer** back to OMG: the $2,000 gift is not there, and an $800 allotment needs only CA Staff.

### 01 Collect

| Step | Do this | Expect |
|---|---|---|
| 1 Login | `/login`, press **Continue with Google** or **Apple** | Signed in, lands on My donations. OTP (`108108`) still works. |
| 2 Categories | `/donate/sangam` | Tabs: Hundi, Pooja, **Events**, **Membership**, Activities, Projects. Events have a ticket stepper (1 to 10). Membership has an auto-renew tick. Sevalaya has no Membership tab. |
| 3 Pay | Add a ticketed event, go to checkout, pay by card, Apple Pay or Google Pay | Four stages show in turn: card authorised, waiting for the Square webhook, webhook verified (Paid), receipt issued and journal posted. |
| 4 Webhook | Console **Donations** (as CA Staff), open the new gift | Shows *Webhook confirmed* with a time, status Receipted. |
| 5 Receipt and journal | Console **Ledger** | A new `Donation received` entry for that receipt number, and the fund balance rose by the net. |
| 3 Counter cash | **Vasanthi** → **Counter cash** → record `525.00` for Hundi | Row is *pending*. Open it: **Confirm** is disabled with *You counted this cash. A second person must confirm the count.* |
| | Switch to **Saravanan Pillai** (Sector Admin), open it, **Confirm the count** | Count becomes Confirmed. A cash donation appears in **Donations** and the Ledger. Procurement Officer cannot confirm. |

### 02 Control

| Step | Do this | Expect |
|---|---|---|
| 6 Reconciliation | **Anitha** → **Reconciliation** → *Needs attention* (3 payouts). Recent payouts are daily. | Each shows a **Three-way tie** of Square, bank and ledger. One is short at the bank, one is missing ledger entries. |
| | Open one, try to reconcile | Button stays disabled until you write a reason of 10 or more characters. Matched payouts tie exactly. |
| 7 Allotment | **Fund allotments** (unchanged) | Preparer cannot approve; restricted and corpus funds enforced. |
| 8 Budgets | **Budgets** (unchanged) | Allocated, Committed, Spent, Available. |
| 9 Period close | **Anitha** → **Period close** → open the **current month** | Refused: *Close September 2026 first.* Months close in order. |
| | Open **September 2026**, read the checklist, **Send for close** | Status Pending. Anitha cannot lock it. |
| | **R. Balasubramanian** → **Approvals** or **Period close** → **Close and lock** | September is Closed. Trustee cannot lock; only the Partner. |
| | Reconcile the 3 payouts and the cash counts, close October (Anitha prepares, Partner locks) | The checklist says what blocks the close until you clear it. |
| | As Anitha, approve a pending allotment | Refused: *October 2026 is closed.* Same for cash confirmation and payment release. |
| | As the Partner, **Reopen this month** with a reason | Reopens; approval now works; the reopen is in the **Audit log**. |

### 03 Spend

| Step | Do this | Expect |
|---|---|---|
| 10 Store request | **Inventory → Requests**, open a pending request | **Vasanthi**, **Dinesh**, CA roles: Approve is disabled and says only a Sector Admin approves. **Saravanan** can approve one he did not raise, not his own. |
| 11-13 | **New purchase order**, **Purchase orders** | AI ranking, PO approval (Committed), goods receipt, 3-way match: unchanged. |
| 14 Release | **Payments** → open the invoice marked **Approved, awaiting release** | Footer says approval alone moves no money. **Release payment** is disabled for the preparer and for anyone who approved it, enabled for another CA person. |
| | Release it, then open **Budgets** | Committed fell by the PO total, Spent rose by the invoice total, and a journal entry posted. |
| | Approve a fresh invoice through every step | Status is *Approved, awaiting release*, and the budget has not moved yet. |

### 04 Report

| Step | Do this | Expect |
|---|---|---|
| 15 | **Reports** | New table **Income and outgo by fund**. The category table now has Events and Membership rows. |
| 16 | **Dashboard**, **Budgets** | Fund balances and utilisation. |
| 17 | **Approvals** | Items show age and due-in, overdue in red. Overdue allotments and store requests have **Escalate**, and a header button escalates them all. They stay in the inbox marked *Escalated to the Trustee*. The inbox also holds cash counts, period closes and payments to release. |
| 18 | **Audit log**; donor site → **My donations** → **Annual statement** | Every action above is logged with who and when. The statement is per year, by fund, printable. |

## 3. Known limits of the mock

- Tenant isolation is simulated in the store: each customer's books are held separately and swapped in. There is no real
  row-level security, and the persona switcher is global rather than per customer.
- Online card gifts are posted by the Square webhook as system entries and are not blocked by a locked month. Admin postings
  (allotments, releases, cash counts, reconciliation) are.
- A donation only sits at *Awaiting Square* for about 2 seconds during checkout, so the webhook gap is checked by
  `npm run verify:flow`. In the UI, a stuck payment can be replayed from **Donations → Replay Square webhook**.
- Nothing persists across a page reload. That is by design.

## 4. Events module (the six-step Events flow)

Ported from the separate `OMG-Events` project (state machine, budget formula, poster composition, signed tickets, profit and loss).
Console: the **Events** group in the sidebar has Overview, All events, Budgets & approvals, **Approval center**, **Poster studio**, Registrations & QR, Purchases & orders and Financial reports (`/console/events/...`). Public: **Events** in the donor header (`/events`, `/register/:id`).
Seed data has eleven events, one in every status. A second Sector Admin, **Lakshmi Priya**, exists so a poster can be approved by a different admin.

### Automated

`npm run verify:flow` has a block of Events checks (create, budget formula, two approvals, confirm and fund, poster four-eyes, stale
poster, tickets, signed check-in, sponsors, orders against budget lines, close, P&L, actuals, cancel, tenant isolation).

### By hand

| Step | Do this | Expect |
|---|---|---|
| Seed | **Events** (any CA or admin persona) | 11 events across Planning, Confirmed, Public and live, Finished. The Approvals badge counts event budgets, posters and orders. |
| Budget example | Open **Navaratri Mahotsavam 2026** → **Budget** | Suggested lines total **$7,810.00** (last year $7,100.00 plus 10%). Approved total **$7,680.00**. Each line shows its past years and a plain reason. |
| No history | Open **Thai Pongal Vizha 2027** → **Budget** | *No suggestion* on every line. First-time events start empty. |
| 1 Create | **Saravanan** → **New event** | The form includes the **itemised service budget**: cost lines pre-filled from past events of that kind, a **Target** with **Auto-distribute**, a share per line and a live total. **Create event and save allocations** saves a draft with the budget lines. Only a Sector Admin can create. End before start, or a paid event with no price, is refused. |
| Approval center | **Events → Approval center** | Pending budgets and posters with stage (CA review, Trustee approval, Sector admin review), amount, who submitted, age and priority; tabs All, Budget reviews, Poster reviews, Audit trail; search and sort; the **Switch role** pills change persona in one click; **View details** opens the lines and the decision form; a timeline and the four-eyes guidance sit on the right. |
| Poster studio | **Events → Poster studio** | Generate posters anytime for any event (draft, review, confirmed) or generate on-the-fly with the Quick Standalone Generator. Make three designs, preview and download SVG/print directly, and a different admin approves chosen posters once confirmed. |
| 2 Budget | Draft → **Budget** | Lines pre-filled by formula. **Use this**, **Recalculate**, add or remove lines. **Submit for CA review** freezes the lines. |
| 2 Gates | Switch to **Saravanan** on the submitted budget | The review panel is disabled: *You prepared this budget.* **Meenakshi** (Trustee) cannot give the CA review either. |
| | **Anitha** (CA Staff) → **Pass to a Trustee** | Status *Awaiting Trustee*. Sending back needs a comment, and the draft shows the reason. |
| | **Meenakshi** → change an **Approved** amount → **Approve budget** | Status *Budget approved*. The Trustee may approve a different amount per line. |
| 3 Confirm | **Saravanan** → **Overview** → **Confirm event** | Refused until a chief guest is set. Then the approved total moves from the sector general fund into a new **Event Fund**. See it in **Ledger** and **Reports → by fund**. |
| | **Fund allotments** | An event fund cannot be allotted to a budget head. |
| 4 Poster | **Poster** → **Make three designs** | Three designs, each with the exact event text, a logo and a QR. A fourth set in one day is refused. |
| | **Use this design**, then try **Approve** as Saravanan | Refused: *You chose this poster.* **Lakshmi Priya** approves, and the event is *Published*. |
| | **Overview → Edit**, change the venue | The poster is taken down (*Poster out of date*) and the event is *Confirmed* again. Changing capacity does not. |
| 5 Run | `/events` → open the event → register | Free or paid (mock payment). A ticket with a QR and a signed code appears. Full events refuse more. |
| | **Run the event → Tickets** → open a registration | The ticket QR. Start the event (**Overview → Start event**), then **Scan this ticket**. |
| | **Check-in** | Paste the code: valid once. A second scan, an edited code, or another event's code is refused. |
| | **Sponsors and donations** | Cash adds to the event fund and the ledger. In-kind is listed separately and never counted as cash. |
| | **Orders** | Raise an order above what is left on a line: blocked. A CA approves (not the raiser) and a *different* CA pays. The fund falls and the ledger posts. |
| 6 Close | **Overview → End event**, then **Profit and loss** | Spent against budget per line, cash in, cash out, profit or loss. **Close event** is refused while an order is open. |
| | **Anitha** or **R. Balasubramanian** → **Close event** | Locked. Unspent fund returns to the sector, and the actual spend is saved. A new event of the same kind now sees this year in its past years. |
| Cancel | A draft, confirmed or published event → **Cancel event** | Needs a reason. The fund returns, open orders cancel, paid tickets are marked for refund. |

The event workspace tabs are Overview, Budget workspace, AI poster studio, Registrations and QR, Purchases and sponsors, Event P&L and Audit trail.

### Limits of the mock

- The poster art is drawn from bundled templates, not generated by Cloudflare or Pollinations (no keys or server). The prompt that would be sent is shown.
- Posters export as SVG. PNG and PDF need a server (the original used a headless browser).
- Ticket codes are signed with a keyed hash, not HMAC-SHA256, because there is no server secret.
- Event orders use their own CA approve-then-pay step against the event's budget lines. They do not run through the full purchase-order, goods-receipt and invoice-match pipeline.
- Budget revisions (asking for more money on a line mid-event) are not built. An order that overruns a line is refused.
