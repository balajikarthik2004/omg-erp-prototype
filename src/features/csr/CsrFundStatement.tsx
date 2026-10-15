import { Card, CardHeader } from '@/components/ui/Card'
import { Money } from '@/components/ui/Money'
import { available, useDb } from '@/store/db'
import { RECEIVED_TRANCHE } from '@/store/csrRules'
import type { CsrDeal } from '@/types'

const HEADERS = ['Grant', 'Received', 'Unallotted', 'Allotted', 'Committed', 'Spent', 'Available', 'UCs signed']

/**
 * Where each company's CSR money is: received into its own fund, allotted to
 * the project budget, committed on approved orders, spent. The report a
 * company reads before it releases the next tranche.
 */
export function CsrFundStatement({ deals }: { deals: CsrDeal[] }) {
  const db = useDb()

  const rows = deals.map((deal) => {
    const fund = db.funds.find((f) => f.id === deal.fundId)
    const head = db.budgets.find((b) => b.fundId === deal.fundId && b.csrProjectId === deal.projectId)
    return {
      deal,
      company: db.csrCompanies.find((c) => c.id === deal.companyId)?.name ?? 'Company',
      project: db.csrProjects.find((p) => p.id === deal.projectId)?.title ?? 'Project',
      received: deal.tranches.filter((t) => RECEIVED_TRANCHE.includes(t.status)).reduce((s, t) => s + t.amount, 0),
      unallotted: fund?.balance ?? 0,
      head,
      ucs: deal.tranches.filter((t) => t.status === 'UC_SIGNED').length,
    }
  })

  return (
    <Card padded={false}>
      <div className="p-5 pb-0">
        <CardHeader
          title="CSR fund statement"
          description="Each grant sits in its own restricted fund and reaches spending only through its project budget and approved orders."
        />
      </div>
      <div className="scrollbar-thin overflow-x-auto">
        <table className="w-full border-collapse text-[14px]">
          <thead>
            <tr className="bg-sandal-100">
              {HEADERS.map((h, i) => (
                <th
                  key={h}
                  className={`border-y border-sandal-200 px-3 py-2 text-[11px] font-semibold tracking-[0.12em] text-stone-500 uppercase ${i > 0 ? 'text-right' : 'text-left'}`}
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan={HEADERS.length} className="px-3 py-6 text-center text-stone-500">
                  No signed MoUs yet. A grant appears here once the CA Partner and a Trustee sign it.
                </td>
              </tr>
            ) : (
              rows.map((r) => (
                <tr key={r.deal.id} className="border-b border-sandal-200">
                  <td className="px-3 py-2.5">
                    <span className="block font-medium text-stone-900">{r.company}</span>
                    <span className="block text-[13px] text-stone-500">{r.project}</span>
                  </td>
                  <td className="px-3 py-2.5 text-right"><Money value={r.received} /></td>
                  <td className="px-3 py-2.5 text-right"><Money value={r.unallotted} tone="muted" /></td>
                  <td className="px-3 py-2.5 text-right"><Money value={r.head?.allocated ?? 0} /></td>
                  <td className="px-3 py-2.5 text-right"><Money value={r.head?.committed ?? 0} /></td>
                  <td className="px-3 py-2.5 text-right"><Money value={r.head?.spent ?? 0} tone="out" /></td>
                  <td className="px-3 py-2.5 text-right"><Money value={r.head ? available(r.head) : 0} tone="in" /></td>
                  <td className="px-3 py-2.5 text-right font-mono tabular-nums text-stone-700">
                    {r.ucs} / {r.deal.tranches.length}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </Card>
  )
}
