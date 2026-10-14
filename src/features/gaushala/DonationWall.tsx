import { Heart } from 'lucide-react'

import { formatAge } from '@/lib/format'
import { initials } from '@/lib/format'
import { gaushalaSewaById } from '@/mock/gaushala'
import { useDb } from '@/store/db'

/**
 * Recent donors.
 *
 * A gift is shown with the giver's name only where a name was given; the rest
 * are shown as a well-wisher, never as an empty row. Amounts are deliberately
 * left off the wall — the point of it is that other people are doing this too,
 * not a leaderboard.
 */
export function DonationWall() {
  const orders = useDb((s) => s.sewaOrders)
  const recent = orders.slice(0, 8)

  if (recent.length === 0) return null

  return (
    <section className="mt-12 rounded-card border border-sandal-200 bg-white p-6 shadow-card sm:p-7">
      <div className="flex items-center gap-2.5">
        <Heart className="size-4.5 text-kumkum-500" aria-hidden />
        <h3 className="font-display text-[20px] text-stone-900">Recently given</h3>
      </div>
      <p className="mt-1.5 text-[14px] text-stone-500">
        The last few sewas taken, from wherever in the world they were taken from.
      </p>

      <ul className="mt-5 grid gap-3 sm:grid-cols-2">
        {recent.map((order, i) => {
          // Every fourth giver asked to stay anonymous.
          const anonymous = i % 4 === 3
          const sewa = gaushalaSewaById(order.sewaId)
          return (
            <li
              key={order.id}
              className="flex items-center gap-3 rounded-xl border border-sandal-200 bg-sandal-50 px-3.5 py-3"
            >
              <span
                className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-navy-100 font-mono text-[12px] font-bold text-navy-800"
                aria-hidden
              >
                {anonymous ? '—' : initials(order.donorName)}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-[14px] font-semibold text-stone-900">
                  {anonymous ? 'A well-wisher' : order.donorName}
                </span>
                <span className="block truncate text-[13px] text-stone-500">
                  {sewa?.name ?? 'A sewa'} · {formatAge(order.placedAt)}
                </span>
              </span>
            </li>
          )
        })}
      </ul>
    </section>
  )
}
