import { useMemo, useState } from 'react'
import { Link, Navigate, useParams } from 'react-router-dom'
import { ArrowRight, Search } from 'lucide-react'

import { SECTORS, type SectorId } from '@/config'
import { cn } from '@/lib/cn'
import { formatMoney } from '@/lib/format'
import { Button } from '@/components/ui/Button'
import { EmptyState } from '@/components/ui/EmptyState'
import { Input } from '@/components/ui/Input'
import { Tabs } from '@/components/ui/Tabs'
import { PHOTOS, type PhotoKey } from '@/lib/photos'
import { CATALOG } from '@/mock/seed'
import { useDb } from '@/store/db'
import type { CatalogItem, DonationCategory } from '@/types'

/**
 * Visual design configuration for each house's contained hero card.
 * Color palettes are extracted directly from the photograph tones.
 */
const SECTOR_HERO: Record<
  SectorId,
  {
    photo: PhotoKey
    cardBg: string
    borderColor: string
    glowColor: string
    tamilColor: string
    photoPosition: string
    badges: { label: string; dotColor: string }[]
  }
> = {
  temple: {
    photo: 'temple',
    cardBg: 'bg-gradient-to-br from-[#2D0907] via-[#48110D] to-[#1F0605]',
    borderColor: 'border-kumkum-700/50',
    glowColor: '#E22E26',
    tamilColor: 'text-kumkum-300',
    photoPosition: 'object-center sm:object-[50%_72%]',
    badges: [
      { label: 'Sacred Kovil Rituals', dotColor: 'bg-kumkum-400' },
      { label: 'Daily Deepams & Archanai', dotColor: 'bg-amber-400' },
      { label: 'Double-signed CA Ledger', dotColor: 'bg-navy-300' },
    ],
  },
  sevalaya: {
    photo: 'sevalaya',
    cardBg: 'bg-gradient-to-br from-[#082216] via-[#0E3624] to-[#06180F]',
    borderColor: 'border-tulsi-600/50',
    glowColor: '#11865A',
    tamilColor: 'text-emerald-300',
    photoPosition: 'object-center sm:object-[50%_55%]',
    badges: [
      { label: 'Daily Annadhanam', dotColor: 'bg-emerald-400' },
      { label: 'Community Welfare', dotColor: 'bg-amber-400' },
      { label: 'Double-signed CA Ledger', dotColor: 'bg-navy-300' },
    ],
  },
  sangam: {
    photo: 'sangam',
    cardBg: 'bg-gradient-to-br from-[#0A1A36] via-[#102B56] to-[#071326]',
    borderColor: 'border-peacock-500/50',
    glowColor: '#4F58CA',
    tamilColor: 'text-navy-300',
    photoPosition: 'object-center sm:object-[50%_48%]',
    badges: [
      { label: 'Tamil Heritage & Arts', dotColor: 'bg-peacock-400' },
      { label: 'Music & Cultural Programs', dotColor: 'bg-amber-400' },
      { label: 'Double-signed CA Ledger', dotColor: 'bg-navy-300' },
    ],
  },
}

const TABS: { id: DonationCategory; label: string; blurb: string }[] = [
  { id: 'hundi', label: 'Hundi', blurb: 'A general offering. Give whatever feels right.' },
  { id: 'pooja', label: 'Pooja', blurb: 'Archanai and homam performed in your name, on a day you choose.' },
  { id: 'event', label: 'Events', blurb: 'Festivals, concerts and community evenings. Choose how many tickets.' },
  { id: 'membership', label: 'Membership', blurb: 'Join, and renew each year or each month.' },
  { id: 'activity', label: 'Activities', blurb: 'Festivals, classes and community work through the year.' },
  { id: 'project', label: 'Projects', blurb: 'Larger works that take months, and every gift towards them.' },
]

/**
 * The sector catalog. `sectorId` pins it to one sector for a route that does
 * not carry the sector in its path, which is how /sevalaya/seva renders the
 * Sevalaya catalog unchanged.
 */
export function CatalogPage({ sectorId: pinned }: { sectorId?: SectorId } = {}) {
  const { sector: routeSector } = useParams<{ sector: string }>()
  const sector = pinned ?? routeSector
  const [chosenTab, setTab] = useState<DonationCategory>('hundi')
  const [query, setQuery] = useState('')
  const tenant = useDb((s) => s.tenants.find((t) => t.id === s.activeTenantId))

  const valid = sector === 'temple' || sector === 'sevalaya' || sector === 'sangam'
  const sectorId = (valid ? sector : 'temple') as SectorId

  const items = useMemo(() => CATALOG.filter((c) => c.sectorId === sectorId && c.active), [sectorId])

  // A sector only shows the categories it actually offers.
  const tabs = TABS.filter((t) => items.some((i) => i.category === t.id))
  const tab = tabs.some((t) => t.id === chosenTab) ? chosenTab : (tabs[0]?.id ?? 'hundi')

  const visible = (() => {
    const q = query.trim().toLowerCase()
    return items.filter(
      (item) =>
        item.category === tab &&
        (q === '' || item.name.toLowerCase().includes(q) || item.description.toLowerCase().includes(q)),
    )
  })()

  // A customer only offers the verticals it enabled at onboarding.
  if (!valid || (tenant && !tenant.verticals.includes(sectorId))) {
    return <Navigate to={`/donate/${tenant?.verticals[0] ?? 'temple'}`} replace />
  }

  const meta = SECTORS[sectorId]
  const activeTab = TABS.find((t) => t.id === tab) ?? TABS[0]!

  const hero = SECTOR_HERO[sectorId]

  return (
    <>
      <div className="mx-auto max-w-8xl px-5 pt-4 sm:px-8 sm:pt-6">
        <header
          className={cn(
            'relative isolate overflow-hidden rounded-2xl sm:rounded-3xl shadow-xl border p-5 sm:p-6 lg:px-8 lg:py-6',
            hero.cardBg,
            hero.borderColor,
          )}
        >
          {/* Subtle background glow */}
          <div
            className="pointer-events-none absolute -right-10 -bottom-10 h-64 w-64 opacity-[0.08]"
            style={{
              backgroundImage: `radial-gradient(circle, ${hero.glowColor} 15%, transparent 70%)`,
            }}
            aria-hidden
          />

          <div className="grid gap-6 lg:grid-cols-12 lg:items-center">
            {/* Left Info Column */}
            <div className="lg:col-span-7">
              <nav aria-label="Breadcrumb" className="flex flex-wrap items-center gap-2 text-[12.5px] text-sandal-200/70">
                <Link to="/" className="transition-colors duration-150 hover:text-navy-300">
                  Home
                </Link>
                <span aria-hidden>/</span>
                {sectorId === 'sevalaya' ? (
                  <>
                    <span className="text-sandal-200/70">Sevalaya</span>
                    <span aria-hidden>/</span>
                    <span className="text-sandal-50">Seva</span>
                  </>
                ) : (
                  <span className="text-sandal-50">{meta.name}</span>
                )}
              </nav>

              <h1 className="mt-2.5 font-display text-[24px] leading-[1.08] text-sandal-50 sm:text-[32px] lg:text-[36px]">
                {sectorId === 'sevalaya' ? 'Seva' : meta.name}
              </h1>
              <p className="mt-2.5 max-w-xl text-[14px] sm:text-[15px] leading-relaxed text-sandal-100/90">
                {meta.blurb}
              </p>

              <div className="mt-4 flex flex-wrap items-center gap-2.5 text-xs text-sandal-200/80">
                {hero.badges.map((b) => (
                  <span
                    key={b.label}
                    className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1 font-semibold backdrop-blur-xs"
                  >
                    <span className={cn('size-2 rounded-full', b.dotColor)} />
                    {b.label}
                  </span>
                ))}
              </div>
            </div>

            {/* Right Contained Image */}
            <div className="lg:col-span-5">
              <div className="group relative overflow-hidden rounded-2xl shadow-xl border-2 border-sandal-200/20 bg-navy-950">
                <div className="aspect-[16/10] sm:aspect-[16/9] overflow-hidden">
                  <img
                    src={PHOTOS[hero.photo].src}
                    alt={PHOTOS[hero.photo].alt}
                    className={cn(
                      'h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.02]',
                      hero.photoPosition,
                    )}
                    loading="eager"
                  />
                  {/* Subtle inner shadow / border */}
                  <div className="pointer-events-none absolute inset-0 rounded-2xl ring-1 ring-inset ring-black/20" />
                </div>
              </div>
            </div>
          </div>
        </header>
      </div>

      <div className="mx-auto max-w-8xl px-5 py-6 sm:py-8 sm:px-8">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <Tabs
            className="flex-1"
            value={tab}
            onChange={(id) => setTab(id as DonationCategory)}
            items={tabs.map((t) => ({
              id: t.id,
              label: t.label,
              count: items.filter((i) => i.category === t.id).length,
            }))}
          />
          <div className="w-full sm:max-w-md lg:w-96">
            <div className="relative flex items-center">
              <Input
                aria-label="Search this catalog"
                placeholder="Search offerings by name or keyword..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                leading={<Search className="size-5 text-navy-400" aria-hidden />}
                className="h-12 pl-11 pr-10 text-[15px] rounded-2xl border-navy-200/90 shadow-sm focus:border-navy-500 focus:ring-4 focus:ring-navy-500/10 placeholder:text-stone-400"
              />
              {query ? (
                <button
                  type="button"
                  onClick={() => setQuery('')}
                  className="absolute right-3.5 flex size-6 items-center justify-center rounded-full bg-stone-100 text-stone-600 hover:bg-stone-200 hover:text-stone-900 transition-colors text-xs font-bold"
                  aria-label="Clear search"
                >
                  ✕
                </button>
              ) : null}
            </div>
          </div>
        </div>

        <p className="mt-4 max-w-2xl text-[14px] text-stone-500">{activeTab.blurb}</p>

        <div className="mt-7 min-h-80">
          {visible.length === 0 ? (
            <EmptyState
              title="Nothing matches that"
              message={
                query
                  ? `No ${activeTab.label.toLowerCase()} offering matches “${query}”. Try a shorter word.`
                  : 'This category has no offerings yet for this sector.'
              }
              action={
                query ? (
                  <Button variant="secondary" onClick={() => setQuery('')}>
                    Clear search
                  </Button>
                ) : undefined
              }
            />
          ) : (
            <ul className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {visible.map((item) => (
                <li key={item.id}>
                  <OfferingCard item={item} sectorId={sectorId} />
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </>
  )
}

function OfferingCard({ item, sectorId }: { item: CatalogItem; sectorId: SectorId }) {
  return (
    <Link
      to={`/donate/${sectorId}/${item.id}`}
      className={cn(
        'group flex h-full flex-col rounded-card border border-sandal-200 bg-sandal-50 p-5',
        'shadow-card transition-all duration-200',
        'hover:-translate-y-0.5 hover:border-navy-200 hover:shadow-lift',
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 className="font-display text-[19px] leading-snug text-stone-900">{item.name}</h2>
        </div>
        {item.popular ? (
          <span className="shrink-0 rounded-full border border-navy-200/40 bg-navy-50 px-2 py-0.5 text-[11px] font-semibold tracking-[0.08em] text-navy-600 uppercase">
            Popular
          </span>
        ) : null}
      </div>

      <p className="mt-3 flex-1 text-[14px] leading-relaxed text-stone-700">{item.description}</p>

      {item.needsDedication || item.needsDate ? (
        <p className="mt-3 text-[12px] text-stone-500">
          {[item.needsDedication && 'Name, nakshatra and gothram', item.needsDate && 'Choose a date']
            .filter(Boolean)
            .join(' · ')}
        </p>
      ) : null}

      <div className="mt-5 flex items-end justify-between border-t border-sandal-200 pt-4">
        {item.price === null ? (
          <span className="font-display text-[20px] leading-none text-stone-700">Any amount</span>
        ) : (
          <span className="font-mono text-[20px] leading-none text-stone-900 tabular-nums">
            {formatMoney(item.price)}
            {item.ticketed ? <span className="ml-1.5 font-sans text-[12px] text-stone-500">per ticket</span> : null}
            {item.recurring ? (
              <span className="ml-1.5 font-sans text-[12px] text-stone-500">
                {item.recurring === 'annual' ? 'a year' : 'a month'}
              </span>
            ) : null}
          </span>
        )}
        <span className="inline-flex items-center gap-1 text-[14px] font-medium text-kumkum-700">
          Choose
          <ArrowRight
            className="size-4 transition-transform duration-200 group-hover:translate-x-0.5"
            aria-hidden
          />
        </span>
      </div>
    </Link>
  )
}
