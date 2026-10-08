import { Check, TriangleAlert } from 'lucide-react'

import { MATCH_TOLERANCE } from '@/config'
import { cn } from '@/lib/cn'
import { Money } from '@/components/ui/Money'
import { useDb, type MatchRow } from '@/store/db'

/** PO vs goods receipt vs invoice, line by line. Anything past 2% is red. */
export function ThreeWayMatch({ rows }: { rows: MatchRow[] }) {
  const inventory = useDb((s) => s.inventory)

  return (
    <div className="scrollbar-thin overflow-x-auto rounded-card border border-sandal-200">
      <table className="w-full border-collapse text-[14px]">
        <thead>
          <tr className="bg-sandal-100">
            {['Item', 'PO qty', 'Received', 'Invoiced', 'PO price', 'Invoice price', 'Variance'].map((h, i) => (
              <th
                key={h}
                className={cn(
                  'border-b border-sandal-200 px-3 py-2 text-[11px] font-semibold tracking-[0.12em] text-stone-500 uppercase',
                  i > 0 ? 'text-right' : 'text-left',
                )}
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => {
            const item = inventory.find((i) => i.id === row.itemId)
            const worst = Math.abs(row.qtyVariance) > Math.abs(row.priceVariance) ? row.qtyVariance : row.priceVariance
            return (
              <tr key={row.itemId} className={cn('border-b border-sandal-200', row.flagged && 'bg-danger-50')}>
                <td className="px-3 py-2.5 text-stone-900">{item?.name ?? row.itemId}</td>
                <td className="px-3 py-2.5 text-right font-mono tabular-nums">{row.poQty}</td>
                <td
                  className={cn(
                    'px-3 py-2.5 text-right font-mono tabular-nums',
                    Math.abs(row.qtyVariance) > MATCH_TOLERANCE && 'text-danger-600',
                  )}
                >
                  {row.grnQty}
                </td>
                <td className="px-3 py-2.5 text-right font-mono tabular-nums">{row.invQty}</td>
                <td className="px-3 py-2.5 text-right">
                  <Money value={row.poUnitPrice} />
                </td>
                <td className="px-3 py-2.5 text-right">
                  <Money
                    value={row.invUnitPrice}
                    tone={Math.abs(row.priceVariance) > MATCH_TOLERANCE ? 'out' : 'default'}
                  />
                </td>
                <td className="px-3 py-2.5 text-right">
                  {row.flagged ? (
                    <span className="inline-flex items-center gap-1 font-mono text-[13px] text-danger-600 tabular-nums">
                      <TriangleAlert className="size-3.5" aria-hidden />
                      {(worst * 100).toFixed(1)}%
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-[13px] text-tulsi-700">
                      <Check className="size-3.5" aria-hidden />
                      within 2%
                    </span>
                  )}
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
