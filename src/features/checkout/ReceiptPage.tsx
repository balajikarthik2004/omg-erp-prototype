import { Link, useParams } from 'react-router-dom'
import { ArrowRight, CheckCircle2, Download, Printer } from 'lucide-react'

import { SECTORS } from '@/config'
import { formatDate, formatDateTime, formatMoney, titleCase } from '@/lib/format'
import { Button } from '@/components/ui/Button'
import { EmptyState } from '@/components/ui/EmptyState'
import { Money } from '@/components/ui/Money'
import { toast } from '@/lib/toast'
import { ArchMark, Divider, Kolam, OmgMark } from '@/components/ui/Ornament'
import { CATALOG, FUNDS } from '@/mock/seed'
import { useDb } from '@/store/db'

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
  const settled = donation.status !== 'pending' && donation.status !== 'paid'

  return (
    <div className="mx-auto max-w-2xl px-4 py-12 sm:px-6">
      <div className="no-print mb-8 flex flex-col items-center text-center">
        <span className="flex size-14 items-center justify-center rounded-full border border-tulsi-500/25 bg-tulsi-50">
          <CheckCircle2 className="size-7 text-tulsi-700" aria-hidden />
        </span>
        <h1 className="mt-4 font-display text-[30px] leading-tight text-stone-900 sm:text-[34px]">
          {settled ? 'Your offering is received' : donation.status === 'paid' ? 'Payment confirmed' : 'Waiting for Square'}
        </h1>
        <p className="mt-2 max-w-md text-[15px] text-stone-500">
          {settled
            ? 'A copy has gone to your email. Keep the receipt number for your records.'
            : 'The receipt is issued once Square confirms the payment.'}
        </p>
      </div>

      {/* Printable receipt */}
      <article className="overflow-hidden rounded-card border border-sandal-200 bg-sandal-50 shadow-card">
        <header className="relative isolate overflow-hidden surface-sanctum px-6 py-7 text-sandal-50 sm:px-8">
          <ArchMark className="pointer-events-none absolute -right-4 -bottom-10 text-turmeric-400/20" size={150} />
          <div className="relative flex items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-2.5">
                <OmgMark size={30} />
                <span className="font-display text-[17px] tracking-wide">{tenantName}</span>
              </div>
              <p className="mt-4 font-display text-[24px] leading-tight sm:text-[27px]">
                {sector.name}
                <span className="ml-2.5 text-turmeric-400/90">{sector.tamil}</span>
              </p>
              <p className="mt-1 text-[11px] tracking-[0.14em] text-turmeric-400/80 uppercase">
                Official donation receipt
              </p>
            </div>
            <div className="shrink-0 text-right">
              <p className="text-[11px] tracking-[0.12em] text-sandal-200/70 uppercase">Receipt no.</p>
              <p className="mt-1 font-mono text-[15px] tabular-nums">{donation.receiptNo}</p>
            </div>
          </div>
        </header>

        <div className="px-6 py-6 sm:px-8">
          <dl className="grid grid-cols-2 gap-x-6 gap-y-4 sm:grid-cols-3">
            <Field label="Received" value={formatDateTime(donation.createdAt)} />
            <Field label="Method" value={titleCase(donation.method)} />
            <Field label="Donation ref." value={donation.id} mono />
            <Field label="From" value={donor?.name ?? 'Anonymous devotee'} className="col-span-2 sm:col-span-1" />
            <Field label="Credited to fund" value={fund?.name ?? '—'} className="col-span-2" />
          </dl>

          <Divider className="my-6" tone="quiet" />

          <table className="w-full border-collapse text-[14px]">
            <thead>
              <tr>
                <th className="pb-2 text-left text-[11px] tracking-[0.12em] text-stone-500 uppercase">Offering</th>
                <th className="pb-2 text-right text-[11px] tracking-[0.12em] text-stone-500 uppercase">Amount</th>
              </tr>
            </thead>
            <tbody>
              {donation.lines.map((line, i) => {
                const item = CATALOG.find((c) => c.id === line.itemId)
                return (
                  <tr key={`${line.itemId}-${i}`} className="border-t border-sandal-200">
                    <td className="py-3 pr-4">
                      <p className="text-[15px] text-stone-900">
                        {item?.name ?? line.itemId}
                        {line.quantity && line.quantity > 1 ? ` × ${line.quantity} tickets` : ''}
                      </p>
                      {line.recurring ? (
                        <p className="mt-1 text-[13px] text-stone-500">
                          Renews {line.recurring === 'annual' ? 'every year' : 'every month'} until you stop it.
                        </p>
                      ) : null}
                      {line.dedication ? (
                        <p className="mt-1 text-[13px] leading-relaxed text-stone-500">
                          For {line.dedication.name}
                          {line.dedication.nakshatra ? ` · ${line.dedication.nakshatra}` : ''}
                          {line.dedication.gothram ? ` · ${line.dedication.gothram} gothram` : ''}
                          {line.dedication.date ? ` · ${formatDate(line.dedication.date)}` : ''}
                        </p>
                      ) : null}
                    </td>
                    <td className="py-3 text-right align-top">
                      <Money value={line.amount} className="text-[15px]" />
                    </td>
                  </tr>
                )
              })}
            </tbody>
            <tfoot>
              <tr className="border-t-2 border-turmeric-400/50">
                <td className="pt-3 text-right text-[14px] font-medium text-stone-900">Total received</td>
                <td className="pt-3 text-right">
                  <Money value={donation.gross} className="font-display text-[22px]" />
                </td>
              </tr>
            </tfoot>
          </table>

          <div className="mt-7 rounded-card bg-sandal-100 px-5 py-5 texture-sandal">
            <div className="flex items-end justify-between gap-4">
              <div>
                <p className="font-display text-[22px] leading-tight text-stone-900">நன்றி</p>
                <p className="mt-1 text-[15px] text-stone-700">
                  Thank you. May your offering return to you as peace and good health.
                </p>
              </div>
              <Kolam className="hidden shrink-0 text-turmeric-500/70 sm:block" size={64} />
            </div>
          </div>

          <p className="mt-5 text-[12px] leading-relaxed text-stone-500">
            This organisation is recognised as a tax-exempt charity. No goods or services were provided in exchange
            for this contribution beyond intangible religious benefits. Retain this receipt for your tax records.{' '}
            {formatMoney(donation.net)} reaches the fund after a {formatMoney(donation.fee)} processing fee, which
            the organisation absorbs.
          </p>
        </div>
      </article>

      <div className="no-print mt-7 flex flex-wrap items-center justify-center gap-3">
        <Button
          variant="secondary"
          icon={<Download className="size-4" aria-hidden />}
          onClick={() => toast.info('Coming in the next build', 'PDF receipts are generated server-side.')}
        >
          Download PDF
        </Button>
        <Button variant="secondary" icon={<Printer className="size-4" aria-hidden />} onClick={() => window.print()}>
          Print
        </Button>
        <Link to="/my/donations">
          <Button variant="ghost" rightIcon={<ArrowRight className="size-4" aria-hidden />}>View all my donations</Button>
        </Link>
      </div>
    </div>
  )
}

function Field({
  label,
  value,
  mono,
  className,
}: {
  label: string
  value: string
  mono?: boolean
  className?: string
}) {
  return (
    <div className={className}>
      <dt className="text-[11px] tracking-[0.12em] text-stone-500 uppercase">{label}</dt>
      <dd className={`mt-1 text-[14px] text-stone-900 ${mono ? 'font-mono tabular-nums' : ''}`}>{value}</dd>
    </div>
  )
}
