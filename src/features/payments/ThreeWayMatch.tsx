import { Check, TriangleAlert } from 'lucide-react'

import { MATCH_TOLERANCE } from '@/config'
import { cn } from '@/lib/cn'
import { Money } from '@/components/ui/Money'
import { useDb, type MatchRow } from '@/store/db'

const PCT = `${(MATCH_TOLERANCE * 100).toFixed(0)}%`

/**
 * Purchase order against goods receipt against invoice, line by line.
 *
 * Grouped under three heads, because that is the question being asked three
 * times: did we order this much, did it arrive, and are we being billed for
 * it at the price we agreed? The line total is carried as well as the unit
 * price — the unit price is what was negotiated, but the line total is what
 * the charity is about to pay, and a 1% price drift on a large quantity is
 * real money even when the percentage looks harmless.
 */
export function ThreeWayMatch({ rows }: { rows: MatchRow[] }) {
  const inventory = useDb((s) => s.inventory)

  const ordered = rows.reduce((t, r) => t + r.poQty * r.poUnitPrice, 0)
  const invoiced = rows.reduce((t, r) => t + r.invQty * r.invUnitPrice, 0)
  const difference = invoiced - ordered

  return (
    <div className="scrollbar-thin overflow-x-auto rounded-card border border-sandal-200">
      <table className="w-full border-collapse text-[14px]">
        <thead>
          <tr className="bg-sandal-100 text-[10.5px] font-semibold uppercase tracking-[0.1em] text-stone-500">
            <th rowSpan={2} className="border-b border-sandal-200 px-3 py-2 text-left align-bottom">
              Item
            </th>
            <th colSpan={3} className="border-b border-l border-sandal-200 px-3 py-1.5 text-center">
              Quantity
            </th>
            <th colSpan={2} className="border-b border-l border-sandal-200 px-3 py-1.5 text-center">
              Unit price
            </th>
            <th colSpan={2} className="border-b border-l border-sandal-200 px-3 py-1.5 text-center">
              Line total
            </th>
            <th rowSpan={2} className="border-b border-l border-sandal-200 px-3 py-2 text-right align-bottom">
              Match
            </th>
          </tr>
          <tr className="bg-sandal-100 text-[10.5px] font-semibold uppercase tracking-[0.1em] text-stone-500">
            <th className="border-b border-l border-sandal-200 px-3 py-1.5 text-right font-normal">Ordered</th>
            <th className="border-b border-sandal-200 px-3 py-1.5 text-right font-normal">Received</th>
            <th className="border-b border-sandal-200 px-3 py-1.5 text-right font-normal">Invoiced</th>
            <th className="border-b border-l border-sandal-200 px-3 py-1.5 text-right font-normal">Ordered</th>
            <th className="border-b border-sandal-200 px-3 py-1.5 text-right font-normal">Invoiced</th>
            <th className="border-b border-l border-sandal-200 px-3 py-1.5 text-right font-normal">Invoiced</th>
            <th className="border-b border-sandal-200 px-3 py-1.5 text-right font-normal">Difference</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => {
            const item = inventory.find((i) => i.id === row.itemId)
            const lineOrdered = row.poQty * row.poUnitPrice
            const lineInvoiced = row.invQty * row.invUnitPrice
            const lineDiff = lineInvoiced - lineOrdered
            const qtyOff = Math.abs(row.qtyVariance) > MATCH_TOLERANCE
            const priceOff = Math.abs(row.priceVariance) > MATCH_TOLERANCE

            return (
              <tr key={row.itemId} className={cn('border-b border-sandal-200', row.flagged && 'bg-danger-50')}>
                <td className="px-3 py-2.5 text-stone-900">{item?.name ?? row.itemId}</td>

                <td className="border-l border-sandal-200 px-3 py-2.5 text-right font-mono tabular-nums">
                  {row.poQty}
                </td>
                <td
                  className={cn(
                    'px-3 py-2.5 text-right font-mono tabular-nums',
                    row.grnQty < row.poQty && 'text-marigold-500',
                  )}
                >
                  {row.grnQty}
                </td>
                <td className={cn('px-3 py-2.5 text-right font-mono tabular-nums', qtyOff && 'text-danger-600')}>
                  {row.invQty}
                </td>

                <td className="border-l border-sandal-200 px-3 py-2.5 text-right">
                  <Money value={row.poUnitPrice} />
                </td>
                <td className="px-3 py-2.5 text-right">
                  <Money value={row.invUnitPrice} tone={priceOff ? 'out' : 'default'} />
                </td>

                <td className="border-l border-sandal-200 px-3 py-2.5 text-right">
                  <Money value={lineInvoiced} />
                </td>
                <td className="px-3 py-2.5 text-right">
                  {lineDiff === 0 ? (
                    <span className="text-stone-500">—</span>
                  ) : (
                    <Money value={lineDiff} signed tone={lineDiff > 0 ? 'out' : 'in'} />
                  )}
                </td>

                <td className="border-l border-sandal-200 px-3 py-2.5 text-right">
                  {row.flagged ? (
                    <span className="inline-flex flex-col items-end gap-0.5">
                      {qtyOff ? <Flag label="qty" pct={row.qtyVariance} /> : null}
                      {priceOff ? <Flag label="price" pct={row.priceVariance} /> : null}
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-[13px] text-tulsi-700">
                      <Check className="size-3.5" aria-hidden />
                      within {PCT}
                    </span>
                  )}
                </td>
              </tr>
            )
          })}
        </tbody>
        <tfoot>
          <tr className="bg-sandal-100 font-medium">
            <td className="px-3 py-2.5 text-[13px] text-stone-500" colSpan={6}>
              Ordered <Money value={ordered} className="text-stone-700" /> · invoiced
            </td>
            <td className="border-l border-sandal-200 px-3 py-2.5 text-right">
              <Money value={invoiced} className="font-semibold" />
            </td>
            <td className="px-3 py-2.5 text-right">
              {difference === 0 ? (
                <span className="text-stone-500">—</span>
              ) : (
                <Money value={difference} signed tone={difference > 0 ? 'out' : 'in'} className="font-semibold" />
              )}
            </td>
            <td className="border-l border-sandal-200" />
          </tr>
        </tfoot>
      </table>
    </div>
  )
}

/** One breached tolerance, named — qty and price fail for different reasons. */
function Flag({ label, pct }: { label: string; pct: number }) {
  return (
    <span className="inline-flex items-center gap-1 font-mono text-[12.5px] tabular-nums text-danger-600">
      <TriangleAlert className="size-3" aria-hidden />
      {label} {pct > 0 ? '+' : ''}
      {(pct * 100).toFixed(1)}%
    </span>
  )
}
