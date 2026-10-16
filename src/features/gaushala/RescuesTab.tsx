import { Link } from 'react-router-dom'
import { ArrowRight, MapPin } from 'lucide-react'

import { cn } from '@/lib/cn'
import { formatDate, formatMoney, formatPct } from '@/lib/format'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { useDb } from '@/store/db'
import { GalleryPlate } from './GaushalaArt'
import type { Rescue } from '@/types'

export function RescuesTab() {
  const rescues = useDb((s) => s.rescues)

  return (
    <div>
      <p className="max-w-2xl text-[14px] leading-relaxed text-stone-500">
        How each animal arrived, what it cost to treat them, and where that treatment got to. The ones still being
        funded are marked. The before-and-after pictures are stand-ins until the shelter uploads its own.
      </p>

      <ul className="mt-7 space-y-6">
        {rescues.map((rescue) => (
          <li key={rescue.id}>
            <RescueCard rescue={rescue} />
          </li>
        ))}
      </ul>
    </div>
  )
}

function RescueCard({ rescue }: { rescue: Rescue }) {
  const funded = rescue.treatmentGoal > 0 ? (rescue.treatmentRaised / rescue.treatmentGoal) * 100 : 100
  const fullyFunded = rescue.treatmentRaised >= rescue.treatmentGoal

  return (
    <article className="overflow-hidden rounded-card border border-sandal-200 bg-sandal-50 shadow-card">
      <div className="grid gap-0 md:grid-cols-[1fr_1.3fr]">
        {/* before and after */}
        <div className="grid grid-cols-2 gap-px bg-sandal-200">
          <figure className="bg-white">
            <div className="aspect-4/3">
              <GalleryPlate art={rescue.beforeArt} />
            </div>
            <figcaption className="px-3 py-2 text-[11.5px] font-bold tracking-[0.1em] text-stone-500 uppercase">
              The day she arrived
            </figcaption>
          </figure>
          <figure className="bg-white">
            <div className="aspect-4/3">
              <GalleryPlate art={rescue.afterArt} />
            </div>
            <figcaption className="px-3 py-2 text-[11.5px] font-bold tracking-[0.1em] text-stone-500 uppercase">
              Today
            </figcaption>
          </figure>
        </div>

        <div className="p-5 sm:p-6">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="min-w-0">
              <h3 className="font-display text-[20px] leading-snug text-stone-900">{rescue.title}</h3>
              {rescue.tamil ? <p className="mt-0.5 text-[14px] text-stone-500">{rescue.tamil}</p> : null}
            </div>
            <StatusBadge status={rescue.status} />
          </div>

          <p className="mt-2.5 flex items-center gap-1.5 text-[13px] text-stone-500">
            <MapPin className="size-3.5" aria-hidden />
            {rescue.place} · {formatDate(rescue.rescuedAt)}
          </p>

          <dl className="mt-4 space-y-3">
            <div>
              <dt className="text-[11.5px] font-extrabold tracking-[0.12em] text-stone-500 uppercase">
                How she was found
              </dt>
              <dd className="mt-1 text-[14px] leading-relaxed text-stone-700">{rescue.condition}</dd>
            </div>
            <div>
              <dt className="text-[11.5px] font-extrabold tracking-[0.12em] text-stone-500 uppercase">Treatment</dt>
              <dd className="mt-1 text-[14px] leading-relaxed text-stone-700">{rescue.treatment}</dd>
            </div>
          </dl>

          <div className="mt-5 border-t border-sandal-200 pt-4">
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <span className="font-mono text-[15px] text-stone-900 tabular-nums">
                {formatMoney(rescue.treatmentRaised)}
                <span className="text-stone-500"> of {formatMoney(rescue.treatmentGoal)}</span>
              </span>
              <span className="font-mono text-[13px] text-stone-500 tabular-nums">
                {formatPct(Math.min(funded, 100), 0)} funded
              </span>
            </div>

            <div className="mt-2 h-2 overflow-hidden rounded-full bg-sandal-200">
              <div
                className={cn('h-full rounded-full', fullyFunded ? 'bg-tulsi-500' : 'bg-kumkum-500')}
                style={{ width: `${Math.min(funded, 100)}%` }}
                role="progressbar"
                aria-valuenow={Math.round(Math.min(funded, 100))}
                aria-valuemin={0}
                aria-valuemax={100}
                aria-label={`${rescue.title}, treatment funding`}
              />
            </div>

            {fullyFunded ? (
              <p className="mt-3 text-[13.5px] text-tulsi-700">
                Her treatment is fully paid for. Thank you to everyone who gave towards it.
              </p>
            ) : (
              <Link
                to="/sevalaya/gaushala/gau-medicines"
                className="group mt-3.5 inline-flex items-center gap-1.5 text-[14px] font-semibold text-kumkum-700"
              >
                Sponsor this cow&rsquo;s treatment
                <ArrowRight
                  className="size-4 transition-transform duration-200 group-hover:translate-x-0.5"
                  aria-hidden
                />
              </Link>
            )}
          </div>
        </div>
      </div>
    </article>
  )
}
