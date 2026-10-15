import { useMemo, useState } from 'react'
import { Download, PackageCheck, RefreshCw, ReceiptText, Search } from 'lucide-react'

import { PageHeader } from '@/components/layout/PageHeader'
import { Button } from '@/components/ui/Button'
import { Card, CardHeader } from '@/components/ui/Card'
import { Drawer } from '@/components/ui/Drawer'
import { EmptyState } from '@/components/ui/EmptyState'
import { Input } from '@/components/ui/Input'
import { Money } from '@/components/ui/Money'
import { Select } from '@/components/ui/Select'
import { Stat } from '@/components/ui/Stat'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { Table, type Column } from '@/components/ui/Table'
import { SETTLEMENT_CURRENCY, formatIn } from '@/lib/currency'
import { formatDate, formatDateTime, formatNumber, titleCase } from '@/lib/format'
import { toast } from '@/lib/toast'
import { GAUSHALA_ENTITIES, RECEIPT_TEMPLATES, gaushalaSewaById, receiptTemplateFor } from '@/mock/gaushala'
import { offeringName } from '@/mock/offerings'
import { FUNDS, GAUSHALA_FUND_IDS, USERS } from '@/mock/seed'
import { useDb } from '@/store/db'
import { useCurrentUser } from '@/store/session'
import type { Donation } from '@/types'

/** A gift waiting on the webhook is not "pending approval". It has its own label. */
function statusKey(d: Donation): string {
  if (d.disputed) return 'disputed'
  return d.status === 'pending' ? 'awaiting_webhook' : d.status
}

/** Replaying a webhook or issuing a receipt is not a caretaker's job. */
const WEBHOOK_ROLES = ['gaushala_admin', 'gaushala_accountant', 'sector_admin', 'ca_staff', 'ca_partner']

const STATUSES = ['pending', 'paid', 'receipted', 'reconciled', 'allotted', 'refunded', 'failed']

export function GaushalaDonationsPage() {
  const db = useDb()
  const [query, setQuery] = useState('')
  const [status, setStatus] = useState('all')
  const [fundId, setFundId] = useState('all')
  const [focusedId, setFocusedId] = useState<string | null>(null)

  const gaushalaFunds = FUNDS.filter((f) => GAUSHALA_FUND_IDS.includes(f.id))

  const all = useMemo(
    () => db.donations.filter((d) => GAUSHALA_FUND_IDS.includes(d.fundId)),
    [db.donations],
  )

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase()
    return all.filter((d) => {
      const donor = db.donors.find((x) => x.id === d.donorId)
      return (
        (status === 'all' || d.status === status) &&
        (fundId === 'all' || d.fundId === fundId) &&
        (q === '' ||
          d.id.toLowerCase().includes(q) ||
          d.receiptNo.toLowerCase().includes(q) ||
          (donor?.name ?? '').toLowerCase().includes(q))
      )
    })
  }, [all, db.donors, query, status, fundId])

  const totals = useMemo(() => {
    const gross = rows.reduce((t, d) => t + d.gross, 0)
    const fee = rows.reduce((t, d) => t + d.fee, 0)
    return { gross, fee, net: gross - fee }
  }, [rows])

  const columns: Column<Donation>[] = [
    {
      key: 'id',
      header: 'Donation',
      primary: true,
      cell: (d) => (
        <div className="min-w-0">
          <p className="font-mono text-[13px] text-navy-950">{d.id}</p>
          <p className="truncate text-[13px] text-navy-600">
            {db.donors.find((x) => x.id === d.donorId)?.name ?? 'Anonymous'}
          </p>
        </div>
      ),
    },
    { key: 'date', header: 'Date', cell: (d) => formatDate(d.createdAt) },
    {
      key: 'sewa',
      header: 'Sewa',
      hideOnMobile: true,
      cell: (d) => offeringName(d.lines[0]?.itemId),
    },
    {
      key: 'fund',
      header: 'Fund',
      hideOnMobile: true,
      cell: (d) => FUNDS.find((f) => f.id === d.fundId)?.name ?? '—',
    },
    {
      key: 'shown',
      header: 'Donor saw',
      align: 'right',
      hideOnMobile: true,
      cell: (d) =>
        d.donorCurrency && d.displayGross ? (
          <span className="font-mono text-[13.5px] text-navy-700 tabular-nums">
            {formatIn(d.displayGross, d.donorCurrency)}
          </span>
        ) : (
          <span className="text-[13px] text-navy-600">—</span>
        ),
    },
    { key: 'gross', header: 'Gross', align: 'right', cell: (d) => <Money value={d.gross} /> },
    { key: 'fee', header: 'Fee', align: 'right', hideOnMobile: true, cell: (d) => <Money value={d.fee} tone="muted" /> },
    { key: 'net', header: 'Net', align: 'right', cell: (d) => <Money value={d.net} tone="in" /> },
    { key: 'method', header: 'Method', hideOnMobile: true, cell: (d) => titleCase(d.method) },
    { key: 'status', header: 'Status', cell: (d) => <StatusBadge status={statusKey(d)} /> },
  ]

  const focused = focusedId ? all.find((d) => d.id === focusedId) ?? null : null

  /**
   * A real export runs server-side against the whole result set. This writes
   * the rows on screen, which is what a reconciliation actually needs.
   */
  function exportCsv() {
    const header = ['Donation', 'Date', 'Donor', 'Sewa', 'Fund', 'Gross', 'Fee', 'Net', 'Method', 'Status']
    const lines = rows.map((d) =>
      [
        d.id,
        formatDate(d.createdAt),
        db.donors.find((x) => x.id === d.donorId)?.name ?? 'Anonymous',
        offeringName(d.lines[0]?.itemId),
        FUNDS.find((f) => f.id === d.fundId)?.name ?? '',
        (d.gross / 100).toFixed(2),
        (d.fee / 100).toFixed(2),
        (d.net / 100).toFixed(2),
        d.method,
        d.status,
      ]
        .map((cell) => `"${String(cell).replace(/"/g, '""')}"`)
        .join(','),
    )
    const blob = new Blob([[header.join(','), ...lines].join('\n')], { type: 'text/csv;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `gaushala-donations-${new Date().toISOString().slice(0, 10)}.csv`
    a.click()
    URL.revokeObjectURL(url)
    toast.success('Exported', `${rows.length} rows written to CSV.`)
  }

  return (
    <div>
      <PageHeader
        title="Gaushala donations"
        description="Every gift that credited a Gaushala fund, with the fee the gateway took and what the donor was shown."
        phase="collect"
        actions={
          <Button
            variant="secondary"
            icon={<Download className="size-4" aria-hidden />}
            onClick={exportCsv}
            disabled={rows.length === 0}
          >
            Export CSV
          </Button>
        }
      >
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
          <div className="sm:w-72">
            <Input
              aria-label="Search donations"
              placeholder="Donation id, receipt no or donor"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              leading={<Search className="size-4" aria-hidden />}
            />
          </div>
          <div className="sm:w-52">
            <Select
              aria-label="Filter by status"
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              options={[
                { value: 'all', label: 'Every status' },
                ...STATUSES.map((s) => ({ value: s, label: titleCase(s) })),
              ]}
            />
          </div>
          <div className="sm:w-64">
            <Select
              aria-label="Filter by fund"
              value={fundId}
              onChange={(e) => setFundId(e.target.value)}
              options={[
                { value: 'all', label: 'Every Gaushala fund' },
                ...gaushalaFunds.map((f) => ({ value: f.id, label: f.name })),
              ]}
            />
          </div>
        </div>
      </PageHeader>

      <div className="mb-5 grid gap-4 sm:grid-cols-3">
        <Stat label="Gross" value={<Money value={totals.gross} />} sub={`${formatNumber(rows.length)} donations`} accentClass="bg-turmeric-500" />
        <Stat label="Gateway fees" value={<Money value={totals.fee} />} sub="taken before settlement" accentClass="bg-kumkum-500" />
        <Stat label="Net to the funds" value={<Money value={totals.net} />} sub="what the Gaushala actually received" accentClass="bg-tulsi-500" />
      </div>

      <Table
        columns={columns}
        rows={rows}
        rowKey={(d) => d.id}
        onRowClick={(d) => setFocusedId(d.id)}
        empty={
          <EmptyState
            title={db.ready ? 'No donation matches that' : 'Loading donations'}
            message={
              db.ready
                ? 'Try a shorter search, or clear the status and fund filters.'
                : 'One moment while the books load.'
            }
          />
        }
      />

      <ReceiptRules />

      <PaymentDrawer donation={focused} onClose={() => setFocusedId(null)} />
    </div>
  )
}

/**
 * One gift, end to end.
 *
 * Deliberately the same shape as the console's main Donations drawer — the
 * money took the identical route, so an accountant should not have to learn a
 * second screen for it. What is added is only what is specific to a sewa: the
 * currency the donor was shown, the receipt wording their country gets, and
 * whether the thing they paid for has actually been carried out yet.
 */
function PaymentDrawer({ donation, onClose }: { donation: Donation | null; onClose: () => void }) {
  const db = useDb()
  const actor = useCurrentUser()
  const confirmDonationPayment = useDb((s) => s.confirmDonationPayment)
  const issueReceipt = useDb((s) => s.issueReceipt)

  if (!donation) return null

  const mayAct = WEBHOOK_ROLES.includes(actor.role)
  const order = db.sewaOrders.find((o) => o.donationId === donation.id)
  const sewa = gaushalaSewaById(donation.lines[0]?.itemId ?? '')
  const template = donation.receiptTemplateId
    ? RECEIPT_TEMPLATES.find((t) => t.id === donation.receiptTemplateId)
    : undefined
  const entity = donation.entityId ? GAUSHALA_ENTITIES.find((e) => e.id === donation.entityId) : undefined

  return (
    <Drawer
      open
      onClose={onClose}
      title={donation.receiptNo !== '\u2014' ? donation.receiptNo : donation.id}
      subtitle={formatDateTime(donation.createdAt)}
      width="lg"
      footer={
        donation.status === 'pending' || (donation.status === 'paid' && donation.receiptNo === '\u2014') ? (
          <div className="flex flex-col gap-2">
            <p className="text-[13px] text-navy-600">
              {donation.status === 'pending'
                ? 'This is not Paid until the verified webhook arrives. If it never came, replay it.'
                : 'The payment is confirmed, but no receipt number has been issued yet.'}
            </p>
            <Button
              fullWidth
              disabled={!mayAct}
              title={mayAct ? undefined : 'Only a Gaushala admin, the accountant or the CA team can do this.'}
              icon={
                donation.status === 'pending' ? (
                  <RefreshCw className="size-4" aria-hidden />
                ) : (
                  <ReceiptText className="size-4" aria-hidden />
                )
              }
              onClick={() =>
                donation.status === 'pending'
                  ? confirmDonationPayment(donation.id, actor)
                  : issueReceipt(donation.id, actor)
              }
            >
              {donation.status === 'pending' ? 'Replay the webhook' : 'Issue receipt'}
            </Button>
          </div>
        ) : null
      }
    >
      <div className="space-y-5 px-6 py-5">
        <div className="flex flex-wrap items-center gap-2">
          <StatusBadge status={statusKey(donation)} />
          {order ? <StatusBadge status={order.status === 'completed' ? 'done' : order.status} /> : null}
        </div>

        {donation.disputed ? (
          <p className="rounded-xl border border-danger-50 bg-danger-50 px-3.5 py-2.5 text-[13px] leading-relaxed text-danger-600">
            The card issuer has raised a dispute on this charge. Contest it with the proof of sewa below, or refund
            the donor before the deadline.
          </p>
        ) : null}

        <dl className="grid grid-cols-2 gap-x-4 gap-y-3 text-[14px]">
          <Field label="Donation ref." value={<span className="font-mono tabular-nums">{donation.id}</span>} />
          <Field label="Sewa" value={sewa?.name ?? '\u2014'} />
          <Field label="Method" value={titleCase(donation.method)} />
          <Field
            label="Gateway payment"
            value={
              <span className="font-mono text-[13px] tabular-nums">
                {donation.gatewayPaymentId ?? donation.squarePaymentId ?? '\u2014'}
              </span>
            }
          />
          <Field label="Fund" value={FUNDS.find((f) => f.id === donation.fundId)?.name ?? '\u2014'} />
          <Field
            label="Webhook confirmed"
            value={
              donation.webhookAt
                ? formatDateTime(donation.webhookAt)
                : donation.squarePaymentId
                  ? 'Not yet'
                  : 'Not applicable'
            }
          />
        </dl>

        <div className="rounded-xl border border-navy-100 bg-navy-50/50 p-4">
          <dl className="space-y-2 text-[14px]">
            <Row label="Gross" value={<Money value={donation.gross} />} />
            <Row label="Processing fee" value={<Money value={donation.fee} tone="muted" />} />
            <Row label="Net to the fund" value={<Money value={donation.net} tone="in" />} strong />
          </dl>
        </div>

        {donation.donorCurrency && donation.donorCurrency !== SETTLEMENT_CURRENCY && donation.displayGross ? (
          <section className="rounded-xl border border-navy-100 bg-white p-4">
            <h4 className="text-[11.5px] font-extrabold tracking-[0.14em] text-navy-700 uppercase">
              What the donor saw
            </h4>
            <dl className="mt-2.5 space-y-2 text-[14px]">
              <Row
                label={`Shown in ${donation.donorCurrency}`}
                value={
                  <span className="font-mono tabular-nums">
                    {formatIn(donation.displayGross, donation.donorCurrency)}
                  </span>
                }
              />
              <Row
                label="Rate applied"
                value={
                  <span className="font-mono tabular-nums">
                    1 {SETTLEMENT_CURRENCY} = {donation.fxRate} {donation.donorCurrency}
                  </span>
                }
              />
              <Row label="Donor country" value={donation.donorCountry ?? '\u2014'} />
            </dl>
          </section>
        ) : null}

        {template ? (
          <section className="rounded-xl border border-navy-100 bg-white p-4">
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <h4 className="text-[11.5px] font-extrabold tracking-[0.14em] text-navy-700 uppercase">
                Receipted under
              </h4>
              <StatusBadge status={template.reviewed ? 'approved' : 'pending'} />
            </div>
            <p className="mt-2 text-[13.5px] font-semibold text-navy-950">{template.name}</p>
            {entity ? <p className="text-[12.5px] text-navy-600">{entity.name}</p> : null}
            <p className="mt-1.5 text-[12.5px] leading-relaxed text-navy-700 italic">{template.declaration}</p>
          </section>
        ) : null}

        {order ? (
          <section className="rounded-xl border border-navy-100 bg-white p-4">
            <h4 className="flex items-center gap-2 text-[11.5px] font-extrabold tracking-[0.14em] text-navy-700 uppercase">
              <PackageCheck className="size-4" aria-hidden />
              The sewa this paid for
            </h4>
            <dl className="mt-2.5 space-y-2 text-[14px]">
              <Row label="Order" value={<span className="font-mono tabular-nums">{order.id}</span>} />
              <Row label="Assigned to" value={order.assignedTo ? userNameOf(order.assignedTo) : 'Not yet assigned'} />
              {order.serviceDate ? <Row label="To be done on" value={formatDate(order.serviceDate)} /> : null}
              {order.completedAt ? <Row label="Carried out" value={formatDateTime(order.completedAt)} /> : null}
            </dl>

            {order.sankalpa?.gotra || order.sankalpa?.occasion ? (
              <p className="mt-3 text-[13px] leading-relaxed text-navy-700">
                Sankalpa for {order.sankalpa.name}
                {order.sankalpa.gotra ? ` \u00B7 ${order.sankalpa.gotra} gotra` : ''}
                {order.sankalpa.nakshatra ? ` \u00B7 ${order.sankalpa.nakshatra}` : ''}
                {order.sankalpa.occasion ? ` \u00B7 ${order.sankalpa.occasion}` : ''}
              </p>
            ) : null}

            {order.proofMedia && order.proofMedia.length > 0 ? (
              <ul className="mt-3 space-y-2">
                {order.proofMedia.map((proof, i) => (
                  <li key={i} className="rounded-lg border border-tulsi-50 bg-tulsi-50/50 px-3.5 py-2.5">
                    <p className="text-[13px] font-semibold text-tulsi-700">
                      Proof of sewa &middot; {proof.kind} sent to the donor
                    </p>
                    <p className="mt-0.5 text-[13px] leading-relaxed text-navy-700">{proof.caption}</p>
                  </li>
                ))}
              </ul>
            ) : order.status === 'cancelled' ? (
              <p className="mt-3 text-[13px] leading-relaxed text-danger-600">
                The gift was refunded or the card failed, so this sewa was cancelled. The fodder was not bought.
              </p>
            ) : (
              <p className="mt-3 text-[13px] leading-relaxed text-marigold-500">
                Not carried out yet. The donor is waiting on a photograph.
              </p>
            )}
          </section>
        ) : null}
      </div>
    </Drawer>
  )
}

function userNameOf(id: string): string {
  return USERS.find((u) => u.id === id)?.name ?? id
}

function Field({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <dt className="text-[11px] tracking-[0.12em] text-navy-600 uppercase">{label}</dt>
      <dd className="mt-1 text-[14px] text-navy-950">{value}</dd>
    </div>
  )
}

function Row({ label, value, strong }: { label: string; value: React.ReactNode; strong?: boolean }) {
  return (
    <div className="flex items-baseline justify-between gap-4">
      <dt className={strong ? 'font-semibold text-navy-950' : 'text-navy-700'}>{label}</dt>
      <dd className={strong ? 'font-semibold' : ''}>{value}</dd>
    </div>
  )
}

/**
 * Which receipt wording a donor gets, and the fact that none of it has been
 * through an accountant yet. That last part is the important one.
 */
function ReceiptRules() {
  const entities = useDb((s) => s.gaushalaEntities)
  const templates = useDb((s) => s.receiptTemplates)
  const unreviewed = templates.filter((t) => !t.reviewed)

  return (
    <Card className="mt-6">
      <CardHeader
        title="Receipts and tax wording"
        description="The template a donation is receipted under is chosen by the receiving entity and the donor's country."
      />

      {unreviewed.length > 0 ? (
        <p className="mb-4 rounded-xl border border-marigold-50 bg-marigold-50/60 px-3.5 py-2.5 text-[13.5px] leading-relaxed text-marigold-500">
          <strong className="font-bold">{unreviewed.length} template{unreviewed.length === 1 ? '' : 's'} need an accountant.</strong>{' '}
          The deductibility wording below is a starting draft. It must be reviewed by an accountant qualified in that
          country before a single receipt goes out, and the legal entity is not settled yet either.
        </p>
      ) : null}

      <div className="space-y-4">
        {entities.map((entity) => (
          <div key={entity.id} className="rounded-xl border border-navy-100 bg-navy-50/40 p-4">
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <h4 className="text-[15px] font-bold text-navy-950">{entity.name}</h4>
              <span className="text-[12.5px] text-navy-600">
                {entity.country} · settles in {entity.settlementCurrency} ·{' '}
                {entity.gateways.join(', ')}
                {entity.isDefault ? ' · default' : ''}
              </span>
            </div>
            <p className="mt-1 text-[13px] text-navy-600">{entity.address}</p>

            <dl className="mt-3 flex flex-wrap gap-x-5 gap-y-1.5">
              {entity.registrationNumbers.map((reg) => (
                <div key={reg.label} className="text-[12.5px]">
                  <dt className="inline font-bold tracking-wide text-navy-700 uppercase">{reg.label}: </dt>
                  <dd className="inline font-mono text-navy-900">{reg.value}</dd>
                </div>
              ))}
            </dl>

            <ul className="mt-3 space-y-2">
              {templates
                .filter((t) => t.entityId === entity.id)
                .map((t) => (
                  <li key={t.id} className="rounded-lg border border-navy-100 bg-white px-3.5 py-2.5">
                    <div className="flex flex-wrap items-baseline justify-between gap-2">
                      <span className="text-[13.5px] font-semibold text-navy-950">{t.name}</span>
                      <StatusBadge status={t.reviewed ? 'approved' : 'pending'} />
                    </div>
                    <p className="mt-1 text-[12.5px] text-navy-600">
                      Donors in {t.donorCountries.includes('*') ? 'every other country' : t.donorCountries.join(', ')}
                      {t.collectsDonorTaxId ? ' · asks for the donor tax id' : ''}
                    </p>
                    <p className="mt-1.5 text-[12.5px] leading-relaxed text-navy-700 italic">{t.declaration}</p>
                  </li>
                ))}
            </ul>
          </div>
        ))}
      </div>

      <p className="mt-4 text-[12.5px] leading-relaxed text-navy-600">
        Example: a donor in {receiptTemplateFor('IN').donorCountries.join('')} giving to the Indian trust is receipted
        under &ldquo;{receiptTemplateFor('IN').name}&rdquo;; a donor in a country with no local entity falls back to
        &ldquo;{receiptTemplateFor('ZZ').name}&rdquo;, which deliberately claims nothing about deductibility.
      </p>
      <p className="mt-2 text-[12.5px] text-navy-600">
        Regenerating a receipt, resending it and editing these templates arrive with Phase 2.
      </p>
    </Card>
  )
}
