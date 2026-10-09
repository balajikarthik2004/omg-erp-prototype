import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowLeft, ArrowRight, Download, Printer } from 'lucide-react'

import { SECTORS } from '@/config'
import { formatDate, formatMoney } from '@/lib/format'
import { Button } from '@/components/ui/Button'
import { EmptyState } from '@/components/ui/EmptyState'
import { Money } from '@/components/ui/Money'
import { Select } from '@/components/ui/Select'
import { TableSkeleton } from '@/components/ui/Skeleton'
import { Divider, OmgMark } from '@/components/ui/Ornament'
import { toast } from '@/lib/toast'
import { CATALOG, FUNDS } from '@/mock/seed'
import { useDb } from '@/store/db'
import { myDonorIds } from '@/store/selectors'

const SETTLED = ['paid', 'receipted', 'reconciled', 'allotted']
const THIS_YEAR = new Date().getFullYear()

/** Step 18: the donor's own annual statement, self-service and printable. */
export function StatementPage() {
  const ready = useDb((s) => s.ready)
  const donations = useDb((s) => s.donations)
  const donors = useDb((s) => s.donors)
  const tenantName = useDb((s) => s.tenants.find((t) => t.id === s.activeTenantId)?.name ?? 'OMG Platform')

  const thisYear = THIS_YEAR
  const [year, setYear] = useState(THIS_YEAR)

  const ids = useMemo(() => myDonorIds(donations, donors), [donations, donors])
  const rows = useMemo(
    () =>
      donations
        .filter((d) => ids.includes(d.donorId) && SETTLED.includes(d.status) && new Date(d.createdAt).getFullYear() === year)
        .sort((a, b) => a.createdAt.localeCompare(b.createdAt)),
    [donations, ids, year],
  )

  const total = rows.reduce((s, d) => s + d.gross, 0)
  const byFund = useMemo(() => {
    const map = new Map<string, number>()
    for (const d of rows) map.set(d.fundId, (map.get(d.fundId) ?? 0) + d.gross)
    return [...map.entries()].map(([fundId, value]) => ({ fundId, value })).sort((a, b) => b.value - a.value)
  }, [rows])

  const donor = donors.find((d) => ids.slice(1).includes(d.id)) ?? donors.find((d) => d.id === 'dnr-live')

  if (!ready) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6">
        <TableSkeleton rows={6} cols={5} />
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6">
      <div className="no-print mb-6 flex flex-wrap items-center justify-between gap-3">
        <Link to="/my/donations" className="inline-flex items-center gap-1.5 text-[14px] text-stone-500 hover:text-stone-900">
          <ArrowLeft className="size-4" aria-hidden />
          Back to my donations
        </Link>
        <div className="flex flex-wrap items-center gap-2">
          <div className="w-32">
            <Select
              aria-label="Statement year"
              value={String(year)}
              onChange={(e) => setYear(Number(e.target.value))}
              options={[thisYear, thisYear - 1, thisYear - 2].map((y) => ({ value: String(y), label: String(y) }))}
            />
          </div>
          <Button
            variant="secondary"
            icon={<Download className="size-4" aria-hidden />}
            onClick={() => toast.info('Statement ready', `The ${year} statement PDF is generated server-side in the live product.`)}
          >
            Download PDF
          </Button>
          <Button variant="secondary" icon={<Printer className="size-4" aria-hidden />} onClick={() => window.print()}>
            Print
          </Button>
        </div>
      </div>

      <article className="overflow-hidden rounded-card border border-sandal-200 bg-sandal-50 shadow-card">
        <header className="surface-sanctum px-6 py-7 text-sandal-50 sm:px-8">
          <div className="flex items-center gap-2.5">
            <OmgMark size={30} />
            <span className="font-display text-[17px] tracking-wide">{tenantName}</span>
          </div>
          <p className="mt-4 font-display text-[26px] leading-tight">Annual giving statement {year}</p>
          <p className="mt-1 text-[11px] tracking-[0.14em] text-turmeric-400/80 uppercase">For your tax records</p>
        </header>

        <div className="px-6 py-6 sm:px-8">
          <dl className="grid grid-cols-2 gap-x-6 gap-y-4 sm:grid-cols-3">
            <div>
              <dt className="text-[11px] tracking-[0.12em] text-stone-500 uppercase">Donor</dt>
              <dd className="mt-1 text-[14px] text-stone-900">{donor?.name ?? 'Devotee'}</dd>
            </div>
            <div>
              <dt className="text-[11px] tracking-[0.12em] text-stone-500 uppercase">Receipts</dt>
              <dd className="mt-1 font-mono text-[14px] text-stone-900 tabular-nums">{rows.length}</dd>
            </div>
            <div className="col-span-2 sm:col-span-1">
              <dt className="text-[11px] tracking-[0.12em] text-stone-500 uppercase">Total given</dt>
              <dd className="mt-1">
                <Money value={total} className="font-display text-[24px]" />
              </dd>
            </div>
          </dl>

          <Divider className="my-6" tone="quiet" />

          {rows.length === 0 ? (
            <EmptyState
              title={`No receipted gifts in ${year}`}
              message="Once a gift is receipted it is listed here. Pick another year, or make an offering."
              action={
                <Link to="/">
                  <Button rightIcon={<ArrowRight className="size-4" aria-hidden />}>Make an offering</Button>
                </Link>
              }
            />
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full border-collapse text-[14px]">
                  <thead>
                    <tr>
                      {['Date', 'Receipt', 'Offering', 'Fund'].map((h) => (
                        <th key={h} className="pb-2 text-left text-[11px] tracking-[0.12em] text-stone-500 uppercase">
                          {h}
                        </th>
                      ))}
                      <th className="pb-2 text-right text-[11px] tracking-[0.12em] text-stone-500 uppercase">Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((d) => (
                      <tr key={d.id} className="border-t border-sandal-200">
                        <td className="py-2.5 pr-3 font-mono text-[13px] whitespace-nowrap tabular-nums">{formatDate(d.createdAt)}</td>
                        <td className="py-2.5 pr-3 font-mono text-[13px] whitespace-nowrap tabular-nums">{d.receiptNo}</td>
                        <td className="py-2.5 pr-3">
                          {CATALOG.find((c) => c.id === d.lines[0]?.itemId)?.name ?? '—'}
                          <span className="block text-[12px] text-stone-500">{SECTORS[d.sectorId].name}</span>
                        </td>
                        <td className="py-2.5 pr-3 text-stone-700">{FUNDS.find((f) => f.id === d.fundId)?.name ?? '—'}</td>
                        <td className="py-2.5 text-right">
                          <Money value={d.gross} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="border-t-2 border-turmeric-400/50">
                      <td colSpan={4} className="pt-3 text-right font-medium text-stone-900">
                        Total for {year}
                      </td>
                      <td className="pt-3 text-right">
                        <Money value={total} className="font-display text-[20px]" />
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>

              <section className="mt-7">
                <h2 className="mb-2 text-[11px] font-semibold tracking-[0.12em] text-stone-500 uppercase">Where it went, by fund</h2>
                <ul className="flex flex-col divide-y divide-sandal-200 rounded-card border border-sandal-200">
                  {byFund.map((f) => (
                    <li key={f.fundId} className="flex items-center justify-between gap-3 px-4 py-2.5 text-[14px]">
                      <span className="text-stone-700">{FUNDS.find((x) => x.id === f.fundId)?.name ?? f.fundId}</span>
                      <Money value={f.value} />
                    </li>
                  ))}
                </ul>
              </section>
            </>
          )}

          <p className="mt-6 text-[12px] leading-relaxed text-stone-500">
            This organisation is recognised as a tax-exempt charity. No goods or services were provided in exchange for
            these contributions beyond intangible religious benefits. {formatMoney(total)} is the gross amount received.
          </p>
        </div>
      </article>
    </div>
  )
}
