import { useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight, Info } from 'lucide-react'

import { cn } from '@/lib/cn'
import { SETTLEMENT_CURRENCY, displayPrice, type Currency } from '@/lib/currency'
import { formatMoney } from '@/lib/format'
import { Tabs } from '@/components/ui/Tabs'
import { GAUSHALA_SEWAS, SEWA_CATEGORIES } from '@/mock/gaushala'
import type { CatalogItem, GaushalaSewaCategory } from '@/types'
import { NoMatches } from './NoMatches'
import { DonationWall } from './DonationWall'
import { getSewaImage } from './sewaImages'

export function SewasTab({
  query,
  currency,
  onClearQuery,
}: {
  query: string
  currency: Currency
  onClearQuery: () => void
}) {
  const [category, setCategory] = useState<GaushalaSewaCategory>('fodder')

  const live = GAUSHALA_SEWAS.filter((s) => s.active)
  const q = query.trim().toLowerCase()

  // A search runs across every category, so a donor looking for "surgery"
  // does not have to know which tab it lives under.
  const visible = live.filter((s) => {
    const matchesQuery =
      q === '' ||
      s.name.toLowerCase().includes(q) ||
      s.description.toLowerCase().includes(q) ||
      (s.tamil ?? '').includes(query.trim())
    return matchesQuery && (q !== '' || s.gaushalaCategory === category)
  })

  const meta = SEWA_CATEGORIES.find((c) => c.id === category) ?? SEWA_CATEGORIES[0]!

  return (
    <div>
      {q === '' ? (
        <>
          <Tabs
            value={category}
            onChange={(id) => setCategory(id as GaushalaSewaCategory)}
            items={SEWA_CATEGORIES.map((c) => ({
              id: c.id,
              label: c.label,
              count: live.filter((s) => s.gaushalaCategory === c.id).length,
            }))}
          />
          <p className="mt-4 max-w-2xl text-[14px] text-stone-600 font-normal leading-relaxed">{meta.blurb}</p>
        </>
      ) : (
        <p className="text-[14px] text-stone-600 font-normal">
          {visible.length} {visible.length === 1 ? 'sewa' : 'sewas'} matching &ldquo;{query.trim()}&rdquo;, across every
          category.
        </p>
      )}

      {currency !== SETTLEMENT_CURRENCY ? (
        <p className="mt-4 flex items-start gap-2 rounded-xl border border-navy-100 bg-navy-50/70 px-3.5 py-2.5 text-[13px] leading-relaxed text-navy-800">
          <Info className="mt-0.5 size-4 shrink-0 text-navy-600" aria-hidden />
          <span>
            Prices are shown in {currency} so you can see what you are giving. Your card is charged in{' '}
            {SETTLEMENT_CURRENCY}, and the rate used is printed on your receipt.
          </span>
        </p>
      ) : null}

      <div className="mt-7">
        {visible.length === 0 ? (
          <NoMatches what="sewa" query={query} onClear={onClearQuery} />
        ) : (
          <ul className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {visible.map((sewa) => (
              <li key={sewa.id}>
                <SewaCard sewa={sewa} currency={currency} />
              </li>
            ))}
          </ul>
        )}
      </div>

      <DonationWall />
    </div>
  )
}

function SewaCard({ sewa, currency }: { sewa: CatalogItem; currency: Currency }) {
  const anyAmount = sewa.price === null
  const shown = anyAmount ? null : displayPrice(sewa.price!, currency, sewa.prices)
  const image = getSewaImage(sewa)

  return (
    <Link
      to={`/sevalaya/gaushala/${sewa.id}`}
      className={cn(
        'group flex h-full flex-col overflow-hidden rounded-2xl border border-sandal-200 bg-white shadow-card',
        'transition-all duration-300 hover:-translate-y-1 hover:border-navy-200 hover:shadow-lift',
      )}
    >
      {/* Top Image Container */}
      <div className="relative aspect-[16/10] sm:aspect-[16/9.5] overflow-hidden bg-navy-950">
        <img
          src={image.src}
          alt={image.alt}
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          loading="lazy"
        />
        {/* Subtle gradient shadow for badge readability */}
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-black/25" />

        {/* Category / Item Pill Tag on top-left */}
        <span
          className={cn(
            'absolute top-3 left-3 inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-semibold backdrop-blur-xs shadow-xs',
            image.badgeColor,
          )}
        >
          {image.badge}
        </span>

        {/* Popular Pill Tag on top-right */}
        {sewa.popular ? (
          <span className="absolute top-3 right-3 inline-flex items-center gap-1 rounded-full bg-turmeric-400 px-2.5 py-0.5 text-[10.5px] font-extrabold tracking-wider text-navy-950 uppercase shadow-xs">
            Popular
          </span>
        ) : null}
      </div>

      {/* Card Body / Content */}
      <div className="flex flex-1 flex-col p-5">
        <div className="min-w-0">
          <h3 className="font-display text-[18px] sm:text-[19px] font-bold leading-snug text-stone-900 group-hover:text-kumkum-700 transition-colors">
            {sewa.name}
          </h3>
          {sewa.tamil ? <p className="mt-0.5 text-[13px] text-stone-500 font-medium">{sewa.tamil}</p> : null}
        </div>

        <p className="mt-2.5 flex-1 text-[13.5px] sm:text-[14px] leading-relaxed text-stone-600 line-clamp-3">
          {sewa.description}
        </p>

        {sewa.needsDedication || sewa.needsDate ? (
          <p className="mt-3 flex items-center gap-1.5 text-[12px] font-medium text-stone-500">
            <span className="size-1.5 rounded-full bg-turmeric-500" />
            {[sewa.needsDedication && 'Sankalpa (Name, Gotra & Nakshatra)', sewa.needsDate && 'Pick a date']
              .filter(Boolean)
              .join(' · ')}
          </p>
        ) : null}

        {/* Price & Action Row */}
        <div className="mt-4 flex items-end justify-between gap-3 border-t border-sandal-200 pt-3.5">
          {anyAmount ? (
            <span className="font-display text-[18px] font-semibold leading-none text-stone-700">Any amount</span>
          ) : (
            <span className="min-w-0">
              <span className="block font-mono text-[19px] sm:text-[20px] font-bold leading-none text-stone-900 tabular-nums">
                {shown}
                {sewa.unit ? <span className="ml-1.5 font-sans text-[12px] font-normal text-stone-500">{sewa.unit}</span> : null}
              </span>
              {currency !== SETTLEMENT_CURRENCY ? (
                <span className="mt-1 block text-[11px] text-stone-500">
                  charged as {formatMoney(sewa.price!)}
                </span>
              ) : null}
            </span>
          )}
          <span className="inline-flex shrink-0 items-center gap-1 rounded-lg bg-kumkum-50 px-3 py-1.5 text-[13px] font-bold text-kumkum-700 transition-colors group-hover:bg-kumkum-600 group-hover:text-white">
            Choose
            <ArrowRight
              className="size-3.5 transition-transform duration-200 group-hover:translate-x-0.5"
              aria-hidden
            />
          </span>
        </div>
      </div>
    </Link>
  )
}
