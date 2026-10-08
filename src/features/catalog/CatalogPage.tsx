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
import { Photo } from '@/components/ui/Photo'
import type { PhotoKey } from '@/lib/photos'
import { CATALOG } from '@/mock/seed'
import type { CatalogItem, DonationCategory } from '@/types'

/**
 * Each banner is treated for its own photograph. The temple shot is a tall dusk
 * frame, so a wide crop has to be aimed at the lamp-lit steps and lifted, or it
 * reads as a near-black slab of stone.
 */
const SECTOR_BANNER: Record<
  SectorId,
  { photo: PhotoKey; position: string; filter?: string; overlay: string }
> = {
  temple: {
    photo: 'temple',
    position: '50% 88%',
    filter: 'brightness(1.22) saturate(1.12)',
    overlay: 'linear-gradient(100deg, rgb(74 14 11 / 0.92) 0%, rgb(74 14 11 / 0.6) 46%, rgb(74 14 11 / 0.1) 100%)',
  },
  sevalaya: {
    photo: 'sevalaya',
    position: '50% 55%',
    overlay: 'linear-gradient(100deg, rgb(28 10 6 / 0.88) 0%, rgb(28 10 6 / 0.62) 48%, rgb(28 10 6 / 0.18) 100%)',
  },
  sangam: {
    photo: 'sangam',
    position: '50% 46%',
    filter: 'brightness(1.08)',
    overlay: 'linear-gradient(100deg, rgb(19 30 40 / 0.9) 0%, rgb(19 30 40 / 0.62) 48%, rgb(19 30 40 / 0.16) 100%)',
  },
}

const TABS: { id: DonationCategory; label: string; blurb: string }[] = [
  { id: 'hundi', label: 'Hundi', blurb: 'A general offering. Give whatever feels right.' },
  { id: 'pooja', label: 'Pooja', blurb: 'Archanai and homam performed in your name, on a day you choose.' },
  { id: 'activity', label: 'Activities', blurb: 'Festivals, classes and community work through the year.' },
  { id: 'project', label: 'Projects', blurb: 'Larger works that take months, and every gift towards them.' },
]

export function CatalogPage() {
  const { sector } = useParams<{ sector: string }>()
  const [tab, setTab] = useState<DonationCategory>('hundi')
  const [query, setQuery] = useState('')

  const valid = sector === 'temple' || sector === 'sevalaya' || sector === 'sangam'
  const sectorId = (valid ? sector : 'temple') as SectorId

  const items = useMemo(() => CATALOG.filter((c) => c.sectorId === sectorId && c.active), [sectorId])

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase()
    return items.filter(
      (item) =>
        item.category === tab &&
        (q === '' || item.name.toLowerCase().includes(q) || item.description.toLowerCase().includes(q)),
    )
  }, [items, tab, query])

  if (!valid) return <Navigate to="/donate/temple" replace />

  const meta = SECTORS[sectorId]
  const activeTab = TABS.find((t) => t.id === tab)!

  return (
    <div>
      {/* Sector header */}
      <header className="relative isolate overflow-hidden">
        <Photo
          photo={SECTOR_BANNER[sectorId].photo}
          position={SECTOR_BANNER[sectorId].position}
          filter={SECTOR_BANNER[sectorId].filter}
          priority
          className="absolute inset-0 h-full w-full"
        />
        <div
          className="absolute inset-0"
          style={{ background: SECTOR_BANNER[sectorId].overlay }}
          aria-hidden
        />

        <div className="relative mx-auto max-w-6xl px-5 py-12 sm:px-8 sm:py-16">
          <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-[13px] text-sandal-200/70">
            <Link to="/" className="transition-colors duration-150 hover:text-turmeric-400">
              Home
            </Link>
            <span aria-hidden>/</span>
            <span className="text-sandal-50">{meta.name}</span>
          </nav>

          <h1 className="mt-5 font-display text-[32px] leading-[1.06] text-sandal-50 sm:text-[44px] lg:text-[52px]">
            {meta.name}
          </h1>
          <p className="mt-2 font-display text-[19px] text-turmeric-400 sm:text-[22px]">{meta.tamil}</p>
          <p className="mt-4 max-w-xl text-[16px] leading-relaxed text-sandal-100/85">{meta.blurb}</p>
        </div>
      </header>

      <div className="mx-auto max-w-6xl px-5 py-10 sm:px-8">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <Tabs
            className="flex-1"
            value={tab}
            onChange={(id) => setTab(id as DonationCategory)}
            items={TABS.map((t) => ({
              id: t.id,
              label: t.label,
              count: items.filter((i) => i.category === t.id).length,
            }))}
          />
          <div className="lg:w-72">
            <Input
              aria-label="Search this catalog"
              placeholder="Search offerings"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              leading={<Search className="size-4" aria-hidden />}
            />
          </div>
        </div>

        <p className="mt-4 max-w-2xl text-[14px] text-stone-500">{activeTab.blurb}</p>

        <div className="mt-7 min-h-[320px]">
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
    </div>
  )
}

function OfferingCard({ item, sectorId }: { item: CatalogItem; sectorId: SectorId }) {
  return (
    <Link
      to={`/donate/${sectorId}/${item.id}`}
      className={cn(
        'group flex h-full flex-col rounded-card border border-sandal-200 bg-sandal-50 p-5',
        'shadow-card transition-all duration-200',
        'hover:-translate-y-0.5 hover:border-turmeric-400 hover:shadow-lift',
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 className="font-display text-[19px] leading-snug text-stone-900">{item.name}</h2>
          {item.tamil ? <p className="mt-0.5 text-[14px] text-stone-500">{item.tamil}</p> : null}
        </div>
        {item.popular ? (
          <span className="shrink-0 rounded-full border border-turmeric-400/40 bg-turmeric-50 px-2 py-0.5 text-[11px] font-semibold tracking-[0.08em] text-turmeric-700 uppercase">
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
