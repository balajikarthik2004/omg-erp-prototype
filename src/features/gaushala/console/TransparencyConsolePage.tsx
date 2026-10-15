import { useMemo, useState } from 'react'
import { ExternalLink, FileText, ShieldCheck } from 'lucide-react'

import { PageHeader } from '@/components/layout/PageHeader'
import { Card, CardHeader } from '@/components/ui/Card'
import { Money } from '@/components/ui/Money'
import { Select } from '@/components/ui/Select'
import { Stat } from '@/components/ui/Stat'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { Table, type Column } from '@/components/ui/Table'
import { cn } from '@/lib/cn'
import { formatDate, formatMoney, formatNumber, formatPct, titleCase } from '@/lib/format'
import { GAUSHALA_FUND_IDS } from '@/mock/seed'
import { useDb } from '@/store/db'
import type { TransparencyDoc } from '@/types'

export function TransparencyConsolePage() {
  const db = useDb()
  const [month, setMonth] = useState('all')

  const months = useMemo(
    () => [...new Set(db.gaushalaExpenses.map((e) => e.month))].sort((a, b) => b.localeCompare(a)),
    [db.gaushalaExpenses],
  )

  const expenseRows = useMemo(() => {
    const scoped = month === 'all' ? db.gaushalaExpenses : db.gaushalaExpenses.filter((e) => e.month === month)
    const by = new Map<string, number>()
    for (const e of scoped) by.set(e.category, (by.get(e.category) ?? 0) + e.amount)
    return [...by.entries()].map(([category, amount]) => ({ category, amount })).sort((a, b) => b.amount - a.amount)
  }, [db.gaushalaExpenses, month])

  const spent = expenseRows.reduce((t, r) => t + r.amount, 0)
  const spentAllYear = db.gaushalaExpenses.reduce((t, e) => t + e.amount, 0)

  const received = db.donations
    .filter((d) => GAUSHALA_FUND_IDS.includes(d.fundId) && d.status !== 'failed' && d.status !== 'refunded')
    .reduce((t, d) => t + d.net, 0)

  const held = db.funds.filter((f) => GAUSHALA_FUND_IDS.includes(f.id)).reduce((t, f) => t + f.balance, 0)

  const unaudited = db.transparencyDocs.filter((d) => !d.audited)

  const docColumns: Column<TransparencyDoc>[] = [
    {
      key: 'title',
      header: 'Document',
      primary: true,
      cell: (d) => (
        <div className="flex items-center gap-3">
          <span className="flex size-9 shrink-0 items-center justify-center rounded-lg border border-navy-100 bg-navy-50 text-navy-600">
            <FileText className="size-4" aria-hidden />
          </span>
          <div className="min-w-0">
            <p className="truncate font-semibold text-navy-950">{d.title}</p>
            <p className="truncate text-[12.5px] text-navy-600">{titleCase(d.kind)}</p>
          </div>
        </div>
      ),
    },
    { key: 'period', header: 'Period', cell: (d) => d.period },
    { key: 'published', header: 'Published', hideOnMobile: true, cell: (d) => formatDate(d.publishedAt) },
    {
      key: 'size',
      header: 'Size',
      align: 'right',
      hideOnMobile: true,
      cell: (d) => (d.sizeKb === 0 ? <span className="text-navy-600">—</span> : `${formatNumber(d.sizeKb)} KB`),
    },
    {
      key: 'state',
      header: 'State',
      cell: (d) =>
        d.audited ? <StatusBadge status="approved" /> : d.sizeKb === 0 ? <StatusBadge status="pending" /> : <StatusBadge status="draft" />,
    },
  ]

  return (
    <div>
      <PageHeader
        title="Transparency"
        description="What the public Transparency tab is showing, and where each figure on it comes from."
        phase="report"
      />

      <div className="mb-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Stat label="Received, twelve months" value={<Money value={received} />} sub="net of processing fees" accentClass="bg-turmeric-500" />
        <Stat label="Spent on the herd" value={<Money value={spentAllYear} />} sub="across twelve months" accentClass="bg-kumkum-500" />
        <Stat label="Held in Gaushala funds" value={<Money value={held} />} sub="five restricted funds" accentClass="bg-tulsi-500" />
        <Stat
          label="Documents awaiting audit"
          value={formatNumber(unaudited.length)}
          sub={unaudited.length > 0 ? 'shown as pending on the public page' : 'everything signed off'}
          deltaMeaning="neutral"
          accentClass="bg-peacock-500"
        />
      </div>

      <div className="grid gap-5 lg:grid-cols-[1.1fr_1fr] lg:items-start">
        <Card>
          <CardHeader
            title="Expense breakdown"
            description="The same figures the public tab draws its bars from."
            action={
              <div className="w-44">
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
            }
          />
          <ul className="flex flex-col gap-3.5">
            {expenseRows.map((row) => {
              const share = spent === 0 ? 0 : (row.amount / spent) * 100
              const max = Math.max(...expenseRows.map((r) => r.amount))
              return (
                <li key={row.category}>
                  <div className="mb-1.5 flex items-baseline justify-between gap-3">
                    <span className="truncate text-[14px] font-medium text-navy-950">{row.category}</span>
                    <span className="shrink-0 font-mono text-[13.5px] font-bold text-navy-950 tabular-nums">
                      {formatMoney(row.amount)}
                      <span className="ml-2 font-sans text-[12px] font-normal text-navy-600">
                        {formatPct(share, 0)}
                      </span>
                    </span>
                  </div>
                  <div
                    className="h-2.5 w-full overflow-hidden rounded-full bg-navy-100"
                    role="img"
                    aria-label={`${row.category}: ${formatMoney(row.amount)}, ${formatPct(share, 0)} of the total`}
                  >
                    <span
                      className="block h-full rounded-full bg-tulsi-500"
                      style={{ width: `${Math.max(2, (row.amount / max) * 100)}%` }}
                    />
                  </div>
                </li>
              )
            })}
            <li className="mt-1 flex items-baseline justify-between border-t border-navy-100 pt-3">
              <span className="text-[14px] font-semibold text-navy-950">Total</span>
              <span className="font-mono text-[15px] font-bold text-navy-950 tabular-nums">{formatMoney(spent)}</span>
            </li>
          </ul>
        </Card>

        <div className="space-y-5">
          <Card>
            <CardHeader title="Legal entities" description="Each one's registration numbers are printed on the public page and on its receipts." />
            <ul className="space-y-3">
              {db.gaushalaEntities.map((entity) => (
                <li key={entity.id} className="rounded-xl border border-navy-100 bg-navy-50/40 p-4">
                  <div className="flex flex-wrap items-baseline justify-between gap-2">
                    <span className="text-[14.5px] font-bold text-navy-950">{entity.name}</span>
                    <span className="text-[12.5px] text-navy-600">
                      {entity.country}
                      {entity.isDefault ? ' · default' : ''}
                    </span>
                  </div>
                  <dl className="mt-2 flex flex-wrap gap-x-5 gap-y-1.5">
                    {entity.registrationNumbers.map((reg) => (
                      <div key={reg.label} className="text-[12.5px]">
                        <dt className="inline font-bold tracking-wide text-navy-700 uppercase">{reg.label}: </dt>
                        <dd className="inline font-mono text-navy-900">{reg.value}</dd>
                      </div>
                    ))}
                  </dl>
                </li>
              ))}
            </ul>
          </Card>

          <Card>
            <CardHeader title="Where these numbers come from" />
            <ul className="space-y-2.5 text-[13.5px] leading-relaxed text-navy-700">
              <Source label="Received" detail="Donations crediting the five Gaushala funds, net of the gateway fee, excluding refunds and failures." />
              <Source label="Spent" detail="The Gaushala expense register, which the monthly close reconciles against the ledger." />
              <Source label="Held" detail="Live balances on the five restricted funds." />
              <Source label="Cow census" detail="The cow register, counted live — not a figure anyone types in." />
            </ul>
            <p className="mt-4 flex items-start gap-2 text-[12.5px] leading-relaxed text-navy-600">
              <ShieldCheck className="mt-0.5 size-4 shrink-0 text-tulsi-700" aria-hidden />
              Nothing on the public tab is entered by hand. If a number there looks wrong, it is wrong in the ledger.
            </p>
          </Card>
        </div>
      </div>

      <div className="mt-6">
        <h2 className="mb-3 font-heritage text-[18px] font-bold text-navy-950">Published documents</h2>
        <Table columns={docColumns} rows={db.transparencyDocs} rowKey={(d) => d.id} />
        <p className="mt-3 flex items-center gap-1.5 text-[12.5px] text-navy-600">
          <ExternalLink className="size-3.5" aria-hidden />
          Uploading and replacing these files arrives with the content module; the shelf itself is live.
        </p>
      </div>
    </div>
  )
}

function Source({ label, detail }: { label: string; detail: string }) {
  return (
    <li className={cn('rounded-lg border border-navy-100 bg-white px-3.5 py-2.5')}>
      <span className="font-semibold text-navy-950">{label}</span>
      <span className="text-navy-700"> — {detail}</span>
    </li>
  )
}

function monthLabel(month: string): string {
  const [year, m] = month.split('-')
  return new Date(Number(year), Number(m) - 1, 1).toLocaleDateString(undefined, { month: 'long', year: 'numeric' })
}
