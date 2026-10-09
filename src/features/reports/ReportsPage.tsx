import { useMemo } from 'react'
import { FileDown, Table2 } from 'lucide-react'

import { SECTORS } from '@/config'
import { formatMoney, formatPct } from '@/lib/format'
import { Button } from '@/components/ui/Button'
import { Card, CardHeader } from '@/components/ui/Card'
import { Money } from '@/components/ui/Money'
import { Skeleton } from '@/components/ui/Skeleton'
import { Stat } from '@/components/ui/Stat'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { toast } from '@/lib/toast'
import { PageHeader } from '@/components/layout/PageHeader'
import { ChartLegend } from '@/components/charts/ChartKit'
import { IncomeOutgoChart, SectorIncomeChart } from '@/components/charts/IncomeOutgoChart'
import { UtilisationBars } from '@/components/charts/UtilisationBars'
import { available, budgetHealth, useDb, utilisation } from '@/store/db'
import { useSession } from '@/store/session'
import { categoryBreakdown, fundFlow, inSector, methodBreakdown, monthlySeries } from '@/store/selectors'

export function ReportsPage() {
  const db = useDb()
  const filter = useSession((s) => s.sectorFilter)

  const data = useMemo(() => {
    if (!db.ready) return null
    const series = monthlySeries(db, filter)
    return {
      series,
      categories: categoryBreakdown(db, filter),
      methods: methodBreakdown(db, filter),
      funds: fundFlow(db, filter),
      budgets: inSector(db.budgets, filter).slice().sort((a, b) => utilisation(b) - utilisation(a)),
      projects: inSector(db.projects, filter),
      income: series.reduce((s, p) => s + p.income, 0),
      outgo: series.reduce((s, p) => s + p.outgo, 0),
    }
  }, [db, filter])

  return (
    <div>
      <PageHeader
        phase="report"
        title="Reports"
        description="Twelve months of giving and spending, by sector, by category and by budget head."
        actions={
          <div className="flex gap-2">
            <Button
              variant="secondary"
              icon={<Table2 className="size-4" aria-hidden />}
              onClick={() => toast.info('Coming in the next build', 'Excel export runs against the live ledger.')}
            >
              Export to Excel
            </Button>
            <Button
              variant="secondary"
              icon={<FileDown className="size-4" aria-hidden />}
              onClick={() => toast.info('Coming in the next build', 'PDF reports are rendered server-side.')}
            >
              Export to PDF
            </Button>
          </div>
        }
      />

      {!data ? (
        <div className="flex flex-col gap-6">
          <Skeleton className="h-72 w-full" />
          <Skeleton className="h-72 w-full" />
        </div>
      ) : (
        <div className="flex flex-col gap-6">
          <div className="grid gap-4 sm:grid-cols-3">
            <Stat label="Income, 12 months" value={<Money value={data.income} />} accentClass="bg-tulsi-500" />
            <Stat label="Outgo, 12 months" value={<Money value={data.outgo} />} accentClass="bg-kumkum-600" />
            <Stat
              label="Net"
              value={<Money value={data.income - data.outgo} tone={data.income >= data.outgo ? 'in' : 'out'} />}
              sub={data.income > 0 ? `${formatPct((data.outgo / data.income) * 100, 0)} of income spent` : undefined}
              accentClass="bg-peacock-500"
            />
          </div>

          <Card>
            <CardHeader title="Income against outgo" description="Both measures on one scale." />
            <IncomeOutgoChart data={data.series} height={300} />
          </Card>

          <Card>
            <CardHeader title="Income by sector" description="Stacked monthly, so the mix is visible." />
            <SectorIncomeChart data={data.series} height={300} />
          </Card>

          <Card>
            <CardHeader
              title="Income and outgo by fund"
              description="What each fund received, what was allotted out of it, what its budget heads spent, and what is left."
            />
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-[14px]">
                <thead>
                  <tr className="bg-sandal-100">
                    {['Fund', 'Type'].map((h) => (
                      <th key={h} className="px-3 py-2 text-left text-[11px] font-semibold tracking-[0.12em] text-stone-500 uppercase">
                        {h}
                      </th>
                    ))}
                    {['Income', 'Allotted out', 'Spent', 'Balance'].map((h) => (
                      <th key={h} className="px-3 py-2 text-right text-[11px] font-semibold tracking-[0.12em] text-stone-500 uppercase">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {data.funds.map((f) => (
                    <tr key={f.id} className="border-t border-sandal-200">
                      <td className="px-3 py-2.5 text-stone-900">
                        {f.name}
                        <span className="block text-[12px] text-stone-500">{SECTORS[f.sectorId].name}</span>
                      </td>
                      <td className="px-3 py-2.5 text-stone-700 capitalize">{f.type}</td>
                      <td className="px-3 py-2.5 text-right">
                        <Money value={f.income} tone="in" />
                      </td>
                      <td className="px-3 py-2.5 text-right">
                        <Money value={f.allotted} />
                      </td>
                      <td className="px-3 py-2.5 text-right">
                        <Money value={f.outgo} tone="out" />
                      </td>
                      <td className="px-3 py-2.5 text-right">
                        <Money value={f.balance} className="font-medium" />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>

          <div className="grid gap-6 xl:grid-cols-2">
            {/* Category table — the colour contrast on turmeric needs a table, so it gets one. */}
            <Card>
              <CardHeader title="Giving by category" description="Where devotees choose to give." />
              <ChartLegend className="mb-3" items={data.categories.map((c) => ({ key: c.key, label: c.label, color: c.color }))} />
              <table className="w-full border-collapse text-[14px]">
                <thead>
                  <tr className="bg-sandal-100">
                    <th className="px-3 py-2 text-left text-[11px] font-semibold tracking-[0.12em] text-stone-500 uppercase">Category</th>
                    <th className="px-3 py-2 text-right text-[11px] font-semibold tracking-[0.12em] text-stone-500 uppercase">Total</th>
                    <th className="px-3 py-2 text-right text-[11px] font-semibold tracking-[0.12em] text-stone-500 uppercase">Share</th>
                  </tr>
                </thead>
                <tbody>
                  {data.categories.map((c) => {
                    const total = data.categories.reduce((s, x) => s + x.value, 0)
                    const share = total > 0 ? (c.value / total) * 100 : 0
                    return (
                      <tr key={c.key} className="border-b border-sandal-200">
                        <td className="px-3 py-2.5">
                          <span className="inline-flex items-center gap-2">
                            <span className="size-2.5 rounded-sm" style={{ backgroundColor: c.color }} aria-hidden />
                            <span className="text-stone-900">{c.label}</span>
                          </span>
                        </td>
                        <td className="px-3 py-2.5 text-right">
                          <Money value={c.value} />
                        </td>
                        <td className="px-3 py-2.5 text-right font-mono text-stone-700 tabular-nums">
                          {formatPct(share, 1)}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </Card>

            <Card>
              <CardHeader title="How people pay" description="By value received." />
              <table className="w-full border-collapse text-[14px]">
                <thead>
                  <tr className="bg-sandal-100">
                    <th className="px-3 py-2 text-left text-[11px] font-semibold tracking-[0.12em] text-stone-500 uppercase">Method</th>
                    <th className="px-3 py-2 text-right text-[11px] font-semibold tracking-[0.12em] text-stone-500 uppercase">Gifts</th>
                    <th className="px-3 py-2 text-right text-[11px] font-semibold tracking-[0.12em] text-stone-500 uppercase">Value</th>
                  </tr>
                </thead>
                <tbody>
                  {data.methods.map((m) => (
                    <tr key={m.key} className="border-b border-sandal-200">
                      <td className="px-3 py-2.5 text-stone-900">{m.label}</td>
                      <td className="px-3 py-2.5 text-right font-mono text-stone-700 tabular-nums">
                        {m.count.toLocaleString()}
                      </td>
                      <td className="px-3 py-2.5 text-right">
                        <Money value={m.value} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </Card>
          </div>

          <Card>
            <CardHeader title="Project tracker" description="Progress against each project goal." />
            {data.projects.length === 0 ? (
              <p className="py-6 text-center text-[14px] text-stone-500">No projects in this sector.</p>
            ) : (
              <ul className="flex flex-col gap-5">
                {data.projects.map((project) => {
                  const pct = Math.min(100, (project.raised / project.goal) * 100)
                  return (
                    <li key={project.id}>
                      <div className="mb-1.5 flex flex-wrap items-baseline justify-between gap-2">
                        <span className="text-[15px] text-stone-900">{project.name}</span>
                        <span className="font-mono text-[13px] text-stone-500 tabular-nums">
                          {formatMoney(project.raised)} of {formatMoney(project.goal)} · {formatPct(pct, 0)}
                        </span>
                      </div>
                      <div className="h-2.5 w-full overflow-hidden rounded-full bg-sandal-200">
                        <span
                          className="block h-full rounded-full"
                          style={{ width: `${pct}%`, backgroundColor: SECTORS[project.sectorId].chartColor }}
                        />
                      </div>
                    </li>
                  )
                })}
              </ul>
            )}
          </Card>

          <div className="grid gap-6 xl:grid-cols-[1fr_1.2fr]">
            <Card>
              <CardHeader title="Budget utilisation" description="Worst first." />
              <UtilisationBars heads={data.budgets} limit={8} />
            </Card>

            <Card padded={false}>
              <div className="p-5 pb-0">
                <CardHeader title="Budget utilisation table" description="The same figures, exactly." />
              </div>
              <div className="scrollbar-thin overflow-x-auto">
                <table className="w-full border-collapse text-[14px]">
                  <thead>
                    <tr className="bg-sandal-100">
                      {['Head', 'Allocated', 'Committed', 'Spent', 'Available', 'Status'].map((h, i) => (
                        <th
                          key={h}
                          className={`border-y border-sandal-200 px-3 py-2 text-[11px] font-semibold tracking-[0.12em] text-stone-500 uppercase ${i > 0 && i < 5 ? 'text-right' : 'text-left'}`}
                        >
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {data.budgets.map((head) => (
                      <tr key={head.id} className="border-b border-sandal-200">
                        <td className="px-3 py-2.5 text-stone-900">{head.name}</td>
                        <td className="px-3 py-2.5 text-right">
                          <Money value={head.allocated} />
                        </td>
                        <td className="px-3 py-2.5 text-right">
                          <Money value={head.committed} />
                        </td>
                        <td className="px-3 py-2.5 text-right">
                          <Money value={head.spent} />
                        </td>
                        <td className="px-3 py-2.5 text-right">
                          <Money value={available(head)} tone={available(head) < 0 ? 'out' : 'default'} />
                        </td>
                        <td className="px-3 py-2.5">
                          <StatusBadge status={budgetHealth(head)} compact />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          </div>
        </div>
      )}
    </div>
  )
}
