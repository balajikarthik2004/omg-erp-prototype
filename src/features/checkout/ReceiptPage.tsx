import { Link, useParams } from 'react-router-dom'
import { ArrowRight, Download, Printer } from 'lucide-react'

import { SECTORS } from '@/config'
import { amountInWords, formatDate, formatDateTime, formatMoney, titleCase } from '@/lib/format'
import { Button } from '@/components/ui/Button'
import { EmptyState } from '@/components/ui/EmptyState'
import { toast } from '@/lib/toast'
import { Kolam, OmgMark } from '@/components/ui/Ornament'
import { offeringById } from '@/mock/offerings'
import { GAUSHALA_ENTITIES, RECEIPT_TEMPLATES } from '@/mock/gaushala'
import { SETTLEMENT_CURRENCY, formatIn } from '@/lib/currency'
import { FUNDS } from '@/mock/seed'
import { useDb } from '@/store/db'
import type { Donation } from '@/types'

/**
 * A printed donation receipt, laid out the way a real one is.
 *
 * Letterhead, a ruled particulars table, the total closed off by a double
 * rule with the amount spelled out beneath it, then the declaration and a
 * signature line. The order is fixed by convention, not by taste — someone
 * filing this for tax reads it top to bottom and expects each block where it
 * always is.
 *
 * The sheet is locked to the viewport so the whole receipt is readable
 * without scrolling, and the donor footer is suppressed for this route. Only
 * the particulars give way when a donation carries more lines than will fit:
 * clipping the total or the tax wording would make the receipt useless.
 * Printing unwinds the lock so a long receipt still prints in full.
 */
export function ReceiptPage() {
  const { donationId } = useParams<{ donationId: string }>()
  const donations = useDb((s) => s.donations)
  const donors = useDb((s) => s.donors)
  const donation = donations.find((d) => d.id === donationId)
  const tenantName = useDb((s) => s.tenants.find((t) => t.id === s.activeTenantId)?.name ?? 'OMG Platform')

  if (!donation) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-16 sm:px-6">
        <EmptyState
          title="Receipt not found"
          message="This receipt is not in this session. The prototype resets its data on every reload."
          action={
            <Link to="/">
              <Button>Back to the donor home</Button>
            </Link>
          }
        />
      </div>
    )
  }

  const sector = SECTORS[donation.sectorId]
  const donor = donors.find((d) => d.id === donation.donorId)
  const fund = FUNDS.find((f) => f.id === donation.fundId)
  const template = donation.receiptTemplateId
    ? RECEIPT_TEMPLATES.find((t) => t.id === donation.receiptTemplateId)
    : undefined
  const entity = template ? GAUSHALA_ENTITIES.find((e) => e.id === template.entityId) : undefined
  const settled = donation.status !== 'pending' && donation.status !== 'paid'

  return (
    <div
      className={[
        'mx-auto flex w-full max-w-[46rem] flex-col gap-3 px-4 py-4',
        'h-[calc(100dvh-4rem)] sm:h-[calc(100dvh-4.375rem)]',
        'print:block print:h-auto print:max-w-none print:p-0',
      ].join(' ')}
    >
      <div className="no-print flex shrink-0 flex-wrap items-center justify-between gap-x-4 gap-y-2">
        <p className="text-[13px] text-stone-500">
          {settled ? 'A copy has gone to your email. Keep this for your records.' : 'Issued once Square confirms the payment.'}
        </p>
        <div className="flex shrink-0 items-center gap-2">
          <Button
            size="sm"
            variant="secondary"
            icon={<Download className="size-4" aria-hidden />}
            onClick={() => toast.info('Coming in the next build', 'PDF receipts are generated server-side.')}
          >
            PDF
          </Button>
          <Button size="sm" variant="secondary" icon={<Printer className="size-4" aria-hidden />} onClick={() => window.print()}>
            Print
          </Button>
          <Link to="/my/donations">
            <Button size="sm" variant="ghost" rightIcon={<ArrowRight className="size-4" aria-hidden />}>
              My donations
            </Button>
          </Link>
        </div>
      </div>

      <article
        className={[
          'relative flex min-h-0 flex-1 flex-col overflow-hidden bg-sandal-50',
          'rounded-card border border-sandal-300 shadow-card',
          'print:block print:min-h-0 print:overflow-visible print:rounded-none print:border-0 print:shadow-none',
        ].join(' ')}
      >
        {/* A band of the sector colour across the head of the sheet. */}
        <div className="h-1 shrink-0 bg-navy-900" aria-hidden />

        {/* Letterhead ------------------------------------------------- */}
        <header className="flex shrink-0 items-start justify-between gap-5 border-b-2 border-navy-900 px-6 pb-3.5 pt-4 sm:px-8">
          <div className="flex min-w-0 items-start gap-3">
            <OmgMark size={38} />
            <div className="min-w-0">
              <p className="truncate font-display text-[17px] font-semibold leading-tight text-stone-900">
                {entity?.name ?? tenantName}
              </p>
              <p className="mt-0.5 text-[12px] leading-snug text-stone-500">
                {entity?.address ?? sector.name}
              </p>
            </div>
          </div>
          {template && template.fields.length > 0 ? (
            <dl className="hidden shrink-0 text-right sm:block">
              {template.fields.slice(0, 2).map((field) => (
                <div key={field.label} className="text-[11px] leading-snug">
                  <dt className="inline uppercase tracking-wide text-stone-500">{field.label}: </dt>
                  <dd className="inline font-mono text-stone-700">{field.value}</dd>
                </div>
              ))}
            </dl>
          ) : null}
        </header>

        {/* Document title --------------------------------------------- */}
        <p className="shrink-0 border-b border-sandal-200 bg-sandal-100 py-1.5 text-center text-[11px] font-bold uppercase tracking-[0.3em] text-stone-700">
          Donation Receipt
        </p>

        {/* Receipt metadata ------------------------------------------- */}
        <dl className="grid shrink-0 grid-cols-2 border-b border-sandal-200 sm:grid-cols-4">
          <Meta label="Receipt no." value={donation.receiptNo} strong />
          <Meta label="Date" value={formatDateTime(donation.createdAt)} />
          <Meta label="Reference" value={donation.id} />
          <Meta label="Method" value={titleCase(donation.method)} plain />
        </dl>

        {/* Received from ---------------------------------------------- */}
        <div className="flex shrink-0 flex-wrap items-baseline justify-between gap-x-6 gap-y-1 border-b border-sandal-200 px-6 py-3 sm:px-8">
          <div className="min-w-0">
            <p className="text-[10px] uppercase tracking-[0.14em] text-stone-500">Received with thanks from</p>
            <p className="mt-0.5 truncate font-display text-[17px] font-semibold text-stone-900">
              {donor?.name ?? 'Anonymous devotee'}
            </p>
          </div>
          <div className="text-right">
            <p className="text-[10px] uppercase tracking-[0.14em] text-stone-500">Credited to</p>
            <p className="mt-0.5 text-[13.5px] text-stone-900">{fund?.name ?? '—'}</p>
          </div>
        </div>

        {/* Particulars ------------------------------------------------- */}
        <div
          data-lenis-prevent
          className="scrollbar-thin min-h-0 flex-1 overflow-y-auto px-6 sm:px-8 print:overflow-visible"
        >
          <table className="w-full border-collapse">
            <thead>
              <tr className="border-b border-sandal-300">
                <th className="w-8 py-2 text-left text-[10px] font-bold uppercase tracking-[0.12em] text-stone-500">
                  #
                </th>
                <th className="py-2 text-left text-[10px] font-bold uppercase tracking-[0.12em] text-stone-500">
                  Particulars
                </th>
                <th className="py-2 text-right text-[10px] font-bold uppercase tracking-[0.12em] text-stone-500">
                  Amount
                </th>
              </tr>
            </thead>
            <tbody>
              {donation.lines.map((line, i) => {
                const item = offeringById(line.itemId)
                return (
                  <tr key={`${line.itemId}-${i}`} className="border-b border-dotted border-sandal-300 last:border-solid">
                    <td className="py-2.5 align-top font-mono text-[12.5px] tabular-nums text-stone-500">{i + 1}</td>
                    <td className="py-2.5 pr-4 align-top">
                      <p className="text-[14px] text-stone-900">
                        {item?.name ?? line.itemId}
                        {line.quantity && line.quantity > 1 ? ` × ${line.quantity} tickets` : ''}
                      </p>
                      {line.recurring ? (
                        <p className="mt-0.5 text-[12px] text-stone-500">
                          Renews {line.recurring === 'annual' ? 'every year' : 'every month'} until stopped.
                        </p>
                      ) : null}
                      {line.dedication ? (
                        <p className="mt-0.5 text-[12px] leading-relaxed text-stone-500">
                          For {line.dedication.name}
                          {line.dedication.nakshatra ? ` · ${line.dedication.nakshatra}` : ''}
                          {line.dedication.gothram ? ` · ${line.dedication.gothram} gothram` : ''}
                          {line.dedication.date ? ` · ${formatDate(line.dedication.date)}` : ''}
                        </p>
                      ) : null}
                    </td>
                    <td className="py-2.5 text-right align-top font-mono text-[14px] tabular-nums text-stone-900">
                      {formatMoney(line.amount)}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>

        {/* Total, closed off by a double rule, then spelled out --------- */}
        <div className="shrink-0 border-y-2 border-navy-900 bg-sandal-100 px-6 py-2.5 sm:px-8">
          <div className="flex items-baseline justify-between gap-4">
            <span className="text-[11px] font-bold uppercase tracking-[0.14em] text-stone-700">Total received</span>
            <span className="font-mono text-[21px] font-bold tabular-nums text-stone-900">
              {formatMoney(donation.gross)}
            </span>
          </div>
          <p className="mt-0.5 text-[12px] italic leading-snug text-stone-500">
            {amountInWords(donation.gross)}
          </p>
        </div>

        <ExchangeNote donation={donation} />

        {/* Declaration and signature ----------------------------------- */}
        <footer className="flex shrink-0 items-end justify-between gap-6 px-6 py-3 sm:px-8">
          <div className="min-w-0 flex-1">
            <p className="font-display text-[14px] text-stone-900">
              Thank you for your offering
            </p>
            <Declaration donation={donation} />
          </div>

          <div className="hidden shrink-0 text-center sm:block">
            <Kolam className="mx-auto text-navy-400/50" size={38} />
            <p className="mt-1 w-40 border-t border-stone-500 pt-1 text-[10px] uppercase tracking-[0.12em] text-stone-500">
              Authorised signatory
            </p>
          </div>
        </footer>
      </article>
    </div>
  )
}

/** One cell of the metadata strip, ruled like a paper form. */
function Meta({
  label,
  value,
  strong,
  plain,
}: {
  label: string
  value: string
  strong?: boolean
  plain?: boolean
}) {
  return (
    <div className="border-r border-sandal-200 px-6 py-2 last:border-r-0 sm:px-5 sm:last:border-r-0">
      <dt className="text-[10px] uppercase tracking-[0.14em] text-stone-500">{label}</dt>
      <dd
        className={[
          'mt-0.5 truncate text-stone-900',
          plain ? 'text-[13px]' : 'font-mono tabular-nums',
          strong ? 'text-[14px] font-bold' : 'text-[12.5px]',
        ].join(' ')}
      >
        {value}
      </dd>
    </div>
  )
}

/**
 * What the donor was shown, and the rate it was settled at.
 *
 * The Gaushala page tells people their card is charged in the home currency
 * and that the rate is printed on the receipt. This is where that promise is
 * kept, so it is rendered from the rate stored on the donation rather than
 * recomputed — the rate on the day of payment is the one that applies.
 */
function ExchangeNote({ donation }: { donation: Donation }) {
  if (!donation.donorCurrency || donation.donorCurrency === SETTLEMENT_CURRENCY) return null
  if (!donation.displayGross || !donation.fxRate) return null

  return (
    <dl className="flex shrink-0 flex-wrap items-baseline justify-between gap-x-6 gap-y-1 border-b border-sandal-200 px-6 py-2 sm:px-8">
      <div className="flex items-baseline gap-2">
        <dt className="text-[10px] uppercase tracking-[0.12em] text-stone-500">Shown to you as</dt>
        <dd className="font-mono text-[13px] tabular-nums text-stone-900">
          {formatIn(donation.displayGross, donation.donorCurrency)}
        </dd>
      </div>
      <p className="text-[11px] text-stone-500">
        Settled at 1 {SETTLEMENT_CURRENCY} = {donation.fxRate} {donation.donorCurrency} on the day of payment.
      </p>
    </dl>
  )
}

/**
 * The deductibility wording.
 *
 * A donation that carries a receipt template is printed under that template,
 * chosen by the receiving entity and the country the donor gave. Everything
 * else keeps the wording this receipt has always carried.
 */
function Declaration({ donation }: { donation: Donation }) {
  const template = donation.receiptTemplateId
    ? RECEIPT_TEMPLATES.find((t) => t.id === donation.receiptTemplateId)
    : undefined

  const feeLine = `${formatMoney(donation.net)} reaches the fund after a ${formatMoney(donation.fee)} processing fee, which the organisation absorbs.`

  return (
    <>
      <p className="mt-1 text-[11px] leading-relaxed text-stone-500">
        {template
          ? template.declaration
          : 'This organisation is recognised as a tax-exempt charity. No goods or services were provided in exchange for this contribution beyond intangible religious benefits.'}{' '}
        {feeLine}
      </p>
      {template && !template.reviewed ? (
        <p className="no-print mt-1 text-[11px] leading-relaxed text-marigold-500">
          Prototype: this tax wording has not been reviewed by an accountant qualified in{' '}
          {template.donorCountries.includes('*') ? 'the donor country' : template.donorCountries.join(', ')}.
        </p>
      ) : null}
    </>
  )
}
