import { useMemo, useState } from 'react'
import { Download, FileText, ShieldCheck } from 'lucide-react'

import { Badge } from '@/components/ui/Badge'
import { Select } from '@/components/ui/Select'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { cn } from '@/lib/cn'
import { formatDate, formatMoney, formatNumber, formatPct, titleCase } from '@/lib/format'
import { toast } from '@/lib/toast'
import { DAILY_ROUTINE, FEED_SCHEDULE } from '@/mock/gaushalaPrograms'
import { GAUSHALA_FUND_IDS } from '@/mock/seed'
import { useDb } from '@/store/db'
import type { GaushalaExpense, TransparencyDoc } from '@/types'

export function TransparencyTab() {
  const db = useDb()
  const expenses = db.gaushalaExpenses
  const docs = db.transparencyDocs
  const cows = db.cows

  const months = useMemo(
    () => [...new Set(expenses.map((e) => e.month))].sort((a, b) => b.localeCompare(a)),
    [expenses],
  )
  const [month, setMonth] = useState<string>('all')

  const rows = useMemo(() => {
    const scoped = month === 'all' ? expenses : expenses.filter((e) => e.month === month)
    const byCategory = new Map<string, number>()
    for (const e of scoped) byCategory.set(e.category, (byCategory.get(e.category) ?? 0) + e.amount)
    return [...byCategory.entries()]
      .map(([category, amount]) => ({ category, amount }))
      .sort((a, b) => b.amount - a.amount)
  }, [expenses, month])

  const total = rows.reduce((t, r) => t + r.amount, 0)

  // What came in against what went out, on the Gaushala's own funds.
  const received = db.donations
    .filter((d) => GAUSHALA_FUND_IDS.includes(d.fundId) && d.status !== 'failed' && d.status !== 'refunded')
    .reduce((t, d) => t + d.net, 0)

  const census = useMemo(() => {
    const living = cows.filter((c) => c.status !== 'deceased')
    const by = (kind: string) => living.filter((c) => c.kind === kind).length
    return {
      total: living.length,
      cows: by('cow'),
      calves: by('calf'),
      bulls: by('bull') + by('ox'),
      milking: living.filter((c) => (c.milkYield ?? 0) > 0).length,
      underTreatment: living.filter((c) => c.status === 'sick' || c.status === 'recovering').length,
      adopted: living.filter((c) => c.status === 'adopted').length,
    }
  }, [cows])

  const entity = db.gaushalaEntities.find((e) => e.isDefault) ?? db.gaushalaEntities[0]

  return (
    <div className="space-y-10">
      <div>
        <h2 className="font-display text-[22px] leading-tight text-stone-900">Where the money goes</h2>
        <p className="mt-2 max-w-2xl text-[14.5px] leading-relaxed text-stone-700">
          Every figure here comes out of the same ledger the accountants close each month. Nothing is rounded up for
          the website.
        </p>
      </div>

      {/* income against outgo */}
      <section className="grid gap-4 sm:grid-cols-3">
        <Headline label="Received into Gaushala funds" value={formatMoney(received)} sub="last twelve months, net of fees" />
        <Headline label="Spent on the herd" value={formatMoney(total === 0 ? 0 : expenses.reduce((t, e) => t + e.amount, 0))} sub="across twelve months" />
        <Headline
          label="Fodder as a share of spend"
          value={formatPct(shareOf(expenses, 'Fodder & feed'), 0)}
          sub="the largest line, every single month"
        />
      </section>

      {/* expense breakdown */}
      <section>
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h3 className="font-display text-[19px] text-stone-900">Monthly expense breakdown</h3>
            <p className="mt-1 text-[13.5px] text-stone-500">
              {month === 'all' ? 'Totalled across twelve months.' : `For ${monthLabel(month)}.`}
            </p>
          </div>
          <div className="w-52">
            <Select
              aria-label="Choose a month"
              value={month}
              onChange={(e) => setMonth(e.target.value)}
              options={[
                { value: 'all', label: 'All twelve months' },
                ...months.map((m) => ({ value: m, label: monthLabel(m) })),
              ]}
            />
          </div>
        </div>

        <ExpenseBars rows={rows} total={total} className="mt-5" />
      </section>

      {/* census */}
      <section>
        <h3 className="font-display text-[19px] text-stone-900">The herd, counted</h3>
        <dl className="mt-4 grid gap-3 sm:grid-cols-3 lg:grid-cols-6">
          <Census label="Animals" value={census.total} />
          <Census label="Cows" value={census.cows} />
          <Census label="Calves" value={census.calves} />
          <Census label="Bulls & oxen" value={census.bulls} />
          <Census label="Milking" value={census.milking} />
          <Census label="Under treatment" value={census.underTreatment} tone={census.underTreatment > 0 ? 'warn' : undefined} />
        </dl>
        <p className="mt-3 text-[13px] text-stone-500">
          {census.adopted} of them are sponsored. Not one animal has ever been sold, worked or moved on.
        </p>
      </section>

      {/* documents */}
      <section>
        <h3 className="font-display text-[19px] text-stone-900">Reports and accounts</h3>
        <ul className="mt-4 grid gap-3 lg:grid-cols-2">
          {docs.map((doc) => (
            <li key={doc.id}>
              <DocRow doc={doc} />
            </li>
          ))}
        </ul>
      </section>

      {/* registration */}
      {entity ? (
        <section className="rounded-card border border-sandal-200 bg-sandal-50 p-6 shadow-card">
          <h3 className="flex items-center gap-2 font-display text-[19px] text-stone-900">
            <ShieldCheck className="size-4.5 text-tulsi-700" aria-hidden />
            Who you are giving to
          </h3>
          <p className="mt-2 text-[14px] text-stone-700">
            <strong className="font-semibold">{entity.name}</strong>
            <span className="text-stone-500"> · {entity.address}</span>
          </p>
          <dl className="mt-3.5 flex flex-wrap gap-x-6 gap-y-2">
            {entity.registrationNumbers.map((reg) => (
              <div key={reg.label} className="text-[13px]">
                <dt className="inline font-bold tracking-wide text-stone-500 uppercase">{reg.label}: </dt>
                <dd className="inline font-mono text-stone-900">{reg.value}</dd>
              </div>
            ))}
          </dl>
          {db.gaushalaEntities.length > 1 ? (
            <p className="mt-3 text-[12.5px] leading-relaxed text-stone-500">
              Gifts from some countries are received by a different registered entity, so the receipt carries the
              right wording for where you live. Which one applied to your gift is printed on your receipt.
            </p>
          ) : null}
        </section>
      ) : null}

      {/* routine and feed */}
      <section className="grid gap-6 lg:grid-cols-2">
        <div>
          <h3 className="font-display text-[19px] text-stone-900">A day at the shelter</h3>
          <ol className="mt-4 space-y-0">
            {DAILY_ROUTINE.map((row, i) => (
              <li key={row.time} className="flex gap-4">
                <div className="flex flex-col items-center">
                  <span className="mt-1.5 size-2 shrink-0 rounded-full bg-kumkum-500" aria-hidden />
                  {i < DAILY_ROUTINE.length - 1 ? (
                    <span className="w-px flex-1 bg-sandal-200" aria-hidden />
                  ) : null}
                </div>
                <div className="pb-4">
                  <p className="font-mono text-[13px] font-bold text-stone-900 tabular-nums">{row.time}</p>
                  <p className="mt-0.5 text-[13.5px] leading-relaxed text-stone-700">{row.what}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>

        <div>
          <h3 className="font-display text-[19px] text-stone-900">What the herd eats, daily</h3>
          <ul className="mt-4 divide-y divide-sandal-200 rounded-card border border-sandal-200 bg-white shadow-card">
            {FEED_SCHEDULE.map((row) => (
              <li key={row.item} className="px-4 py-3">
                <div className="flex items-baseline justify-between gap-3">
                  <span className="text-[14px] font-semibold text-stone-900">{row.item}</span>
                  <span className="shrink-0 font-mono text-[14px] text-stone-900 tabular-nums">{row.perDay}</span>
                </div>
                <p className="mt-0.5 text-[12.5px] leading-relaxed text-stone-500">{row.note}</p>
              </li>
            ))}
          </ul>
        </div>
      </section>
    </div>
  )
}

/**
 * The expense breakdown.
 *
 * Six magnitudes compared against each other, so: horizontal bars, sorted,
 * every row carrying its own label and its own number. One hue throughout —
 * identity is the label, not the colour, which is why no legend is needed and
 * no categorical palette has to be defended. The number sits outside the bar
 * so it never fights the fill for contrast.
 */
function ExpenseBars({
  rows,
  total,
  className,
}: {
  rows: { category: string; amount: number }[]
  total: number
  className?: string
}) {
  if (rows.length === 0 || total === 0) {
    return <p className={cn('py-8 text-center text-[14px] text-stone-500', className)}>Nothing recorded for that month.</p>
  }

  const max = Math.max(...rows.map((r) => r.amount))

  return (
    <ul className={cn('flex flex-col gap-4', className)}>
      {rows.map((row) => {
        const share = (row.amount / total) * 100
        return (
          <li key={row.category} className="group">
            <div className="mb-1.5 flex items-baseline justify-between gap-3">
              <span className="truncate text-[14px] font-medium text-stone-900">{row.category}</span>
              <span className="shrink-0 font-mono text-[13.5px] font-bold text-stone-900 tabular-nums">
                {formatMoney(row.amount)}
                <span className="ml-2 font-sans text-[12px] font-normal text-stone-500">{formatPct(share, 0)}</span>
              </span>
            </div>
            <div
              className="h-2.5 w-full overflow-hidden rounded-full bg-navy-100"
              role="img"
              aria-label={`${row.category}: ${formatMoney(row.amount)}, ${formatPct(share, 0)} of the total`}
            >
              <span
                className="block h-full rounded-full bg-tulsi-500 transition-[width] duration-300 group-hover:bg-tulsi-700"
                style={{ width: `${Math.max(2, (row.amount / max) * 100)}%` }}
              />
            </div>
          </li>
        )
      })}
      <li className="mt-1 flex items-baseline justify-between border-t border-sandal-200 pt-3">
        <span className="text-[14px] font-semibold text-stone-900">Total</span>
        <span className="font-mono text-[15px] font-bold text-stone-900 tabular-nums">{formatMoney(total)}</span>
      </li>
    </ul>
  )
}

function Headline({ label, value, sub }: { label: string; value: string; sub: string }) {
  return (
    <div className="rounded-card border border-sandal-200 bg-white p-5 shadow-card">
      <p className="text-[11.5px] font-extrabold tracking-[0.12em] text-stone-500 uppercase">{label}</p>
      <p className="mt-2 font-display text-[26px] leading-none text-stone-900 tabular-nums">{value}</p>
      <p className="mt-2 text-[12.5px] text-stone-500">{sub}</p>
    </div>
  )
}

function Census({ label, value, tone }: { label: string; value: number; tone?: 'warn' }) {
  return (
    <div
      className={cn(
        'rounded-xl border bg-white px-4 py-3',
        tone === 'warn' ? 'border-marigold-50 bg-marigold-50/40' : 'border-sandal-200',
      )}
    >
      <dt className="text-[11.5px] font-bold tracking-[0.1em] text-stone-500 uppercase">{label}</dt>
      <dd className="mt-1 font-display text-[24px] leading-none text-stone-900 tabular-nums">{formatNumber(value)}</dd>
    </div>
  )
}

function DocRow({ doc }: { doc: TransparencyDoc }) {
  const pending = doc.sizeKb === 0
  return (
    <div className="flex items-center gap-3.5 rounded-card border border-sandal-200 bg-white px-4 py-3.5 shadow-card">
      <span className="flex size-10 shrink-0 items-center justify-center rounded-xl border border-navy-100 bg-navy-50 text-navy-600">
        <FileText className="size-4.5" aria-hidden />
      </span>
      <div className="min-w-0 flex-1">
        <p className="truncate text-[14px] font-semibold text-stone-900">{doc.title}</p>
        <p className="text-[12.5px] text-stone-500">
          {titleCase(doc.kind)} · {doc.period} ·{' '}
          {pending ? 'with the auditor' : `${formatNumber(doc.sizeKb)} KB · published ${formatDate(doc.publishedAt)}`}
        </p>
      </div>
      {doc.audited ? (
        <Badge className="hidden shrink-0 border-tulsi-50 bg-tulsi-50 text-tulsi-700 sm:inline-flex">Audited</Badge>
      ) : pending ? (
        <StatusBadge status="pending" className="hidden shrink-0 sm:inline-flex" />
      ) : null}
      <button
        type="button"
        disabled={pending}
        onClick={() => toast.info('Coming in the next build', 'Documents are served from the file store.')}
        aria-label={`Download ${doc.title}`}
        className={cn(
          'shrink-0 rounded-lg p-2 transition-colors',
          pending ? 'cursor-not-allowed text-stone-300' : 'text-stone-500 hover:bg-sandal-100 hover:text-stone-900',
        )}
      >
        <Download className="size-4" aria-hidden />
      </button>
    </div>
  )
}

function shareOf(expenses: GaushalaExpense[], category: string): number {
  const total = expenses.reduce((t, e) => t + e.amount, 0)
  if (total === 0) return 0
  const part = expenses.filter((e) => e.category === category).reduce((t, e) => t + e.amount, 0)
  return (part / total) * 100
}

function monthLabel(month: string): string {
  const [year, m] = month.split('-')
  const date = new Date(Number(year), Number(m) - 1, 1)
  return date.toLocaleDateString(undefined, { month: 'long', year: 'numeric' })
}
