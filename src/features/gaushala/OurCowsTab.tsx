import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { CalendarDays, HeartHandshake, Milk, Stethoscope, UserRound, X } from 'lucide-react'

import { cn } from '@/lib/cn'
import { formatDate, formatMoney } from '@/lib/format'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { Tabs } from '@/components/ui/Tabs'
import { userName } from '@/mock/seed'
import { useDb } from '@/store/db'
import type { Cow } from '@/types'
import { CowPortrait } from './GaushalaArt'
import { NoMatches } from './NoMatches'

/** Fixed at load, so a re-render never shifts what counts as "this year". */
const LOADED_AT = Date.now()

type Filter = 'all' | 'milk' | 'calf' | 'bull'

const FILTERS: { id: Filter; label: string }[] = [
  { id: 'all', label: 'Everyone' },
  { id: 'milk', label: 'Milk cows' },
  { id: 'calf', label: 'Calves' },
  { id: 'bull', label: 'Bulls & oxen' },
]

function matchesFilter(cow: Cow, filter: Filter, _now: number): boolean {
  switch (filter) {
    case 'milk':
      return cow.kind === 'cow' && (cow.milkYield ?? 0) > 0
    case 'calf':
      return cow.kind === 'calf'
    case 'bull':
      return cow.kind === 'bull' || cow.kind === 'ox'
    default:
      return true
  }
}

export function OurCowsTab({ query, onClearQuery }: { query: string; onClearQuery: () => void }) {
  const cows = useDb((s) => s.cows)
  const [filter, setFilter] = useState<Filter>('all')
  const [open, setOpen] = useState<Cow | null>(null)

  const now = LOADED_AT
  const q = query.trim().toLowerCase()

  const living = cows.filter((c) => c.status !== 'deceased')
  const visible = living.filter(
    (cow) =>
      matchesFilter(cow, filter, now) &&
      (q === '' ||
        cow.name.toLowerCase().includes(q) ||
        cow.breed.toLowerCase().includes(q) ||
        cow.story.toLowerCase().includes(q) ||
        (cow.tamil ?? '').includes(query.trim())),
  )

  return (
    <div>
      <Tabs
        value={filter}
        onChange={(id) => setFilter(id as Filter)}
        items={FILTERS.map((f) => ({
          id: f.id,
          label: f.label,
          count: living.filter((c) => matchesFilter(c, f.id, now)).length,
        }))}
      />

      <div className="mt-7">
        {visible.length === 0 ? (
          <NoMatches what="cow" query={query} onClear={onClearQuery} />
        ) : (
          <ul className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {visible.map((cow) => (
              <li key={cow.id}>
                <CowCard cow={cow} onOpen={() => setOpen(cow)} />
              </li>
            ))}
          </ul>
        )}
      </div>

      <CowStoryModal cow={open} onClose={() => setOpen(null)} />
    </div>
  )
}

function CowCard({ cow, onOpen }: { cow: Cow; onOpen: () => void }) {
  return (
    <button
      type="button"
      onClick={onOpen}
      className={cn(
        'group flex h-full w-full flex-col rounded-card border border-sandal-200 bg-sandal-50 p-5 text-left',
        'shadow-card transition-all duration-200',
        'hover:-translate-y-0.5 hover:border-navy-200 hover:shadow-lift',
      )}
    >
      <div className="flex items-start gap-4">
        <span className="flex size-20 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-sandal-200 bg-white">
          <CowPortrait cow={cow} size={76} />
        </span>
        <span className="min-w-0 flex-1">
          <span className="flex flex-wrap items-baseline gap-x-2">
            <span className="font-display text-[20px] leading-tight text-stone-900">{cow.name}</span>
            {cow.tamil ? <span className="text-[14px] text-stone-500">{cow.tamil}</span> : null}
          </span>
          <span className="mt-1 block text-[13px] text-stone-500">
            {cow.breed} · {cow.ageYears} {cow.ageYears === 1 ? 'year' : 'years'} ·{' '}
            {cow.kind === 'ox' ? 'ox' : cow.kind}
          </span>
          <span className="mt-2 block">
            <StatusBadge status={cow.status} />
          </span>
        </span>
      </div>

      <p className="mt-4 line-clamp-3 flex-1 text-[14px] leading-relaxed text-stone-700">{cow.story}</p>

      <span className="mt-4 flex items-center justify-between border-t border-sandal-200 pt-4 text-[13px]">
        <span className="text-stone-500">Rescued {formatDate(cow.rescuedAt)}</span>
        <span className="font-medium text-kumkum-700 group-hover:underline">
          {cow.gender === 'female' ? 'Read her story' : 'Read his story'}
        </span>
      </span>
    </button>
  )
}

function CowStoryModal({ cow, onClose }: { cow: Cow | null; onClose: () => void }) {
  const health = useDb((s) => s.cowHealth)

  useEffect(() => {
    if (!cow) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
    }
  }, [cow, onClose])

  if (!cow) return null

  const records = health.filter((h) => h.cowId === cow.id).slice(0, 6)
  const isFemale = cow.gender === 'female'
  const cowImg = cow.image ?? `/images/cows/${cow.name}.png`

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-stone-950/70 backdrop-blur-sm transition-opacity duration-300"
        onClick={onClose}
        aria-hidden
      />

      {/* Modal Dialog Container */}
      <div
        role="dialog"
        aria-modal="true"
        aria-label={`${cow.name}'s story`}
        className="relative my-auto w-full max-w-2xl overflow-hidden rounded-3xl border border-sandal-200 bg-white shadow-2xl transition-all duration-300 animate-in fade-in zoom-in-95"
      >
        {/* Floating Close Button */}
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="absolute top-4 right-4 z-20 flex size-9 items-center justify-center rounded-full bg-stone-900/60 text-white backdrop-blur-md transition-all duration-200 hover:bg-stone-950 hover:scale-105"
        >
          <X className="size-5" aria-hidden />
        </button>

        {/* Large Prominent Photo Header */}
        <div className="relative aspect-[16/10] sm:aspect-[3/2] w-full max-h-[380px] overflow-hidden bg-navy-950">
          <img
            src={cowImg}
            alt={cow.name}
            className="h-full w-full object-cover transition-transform duration-700 hover:scale-105"
          />
          {/* Subtle gradient overlays for contrast and readability */}
          <div className="absolute inset-0 bg-gradient-to-t from-stone-950/85 via-stone-950/25 to-stone-950/20" />

          {/* Top Badges */}
          <div className="absolute top-4 left-4 flex flex-wrap items-center gap-2">
            <StatusBadge status={cow.status} />
            <span className="rounded-full bg-white/90 px-3 py-1 text-[12px] font-semibold tracking-wide text-stone-800 shadow-sm backdrop-blur-sm">
              {cow.breed}
            </span>
            <span className="rounded-full bg-black/40 px-3 py-1 text-[12px] font-medium text-white backdrop-blur-sm capitalize">
              {cow.kind === 'ox' ? 'Working ox' : `${cow.kind}`}
            </span>
          </div>

          {/* Bottom Floating Title */}
          <div className="absolute bottom-4 left-5 right-5 text-white">
            <div className="flex flex-wrap items-baseline gap-2.5">
              <h3 className="font-display text-2xl sm:text-3xl font-bold tracking-tight text-white drop-shadow-md">
                {cow.name}
              </h3>
              {cow.tamil ? (
                <span className="text-base sm:text-lg font-medium text-stone-200 drop-shadow-sm">
                  {cow.tamil}
                </span>
              ) : null}
            </div>
            <p className="mt-1 text-xs sm:text-[13.5px] text-stone-200 font-medium">
              {isFemale ? 'Female' : 'Male'} · {cow.ageYears} {cow.ageYears === 1 ? 'year' : 'years'} old
              {cow.milkYield ? ` · ${cow.milkYield} litres milk / day` : ''}
            </p>
          </div>
        </div>

        {/* Scrollable Content Body */}
        <div className="scrollbar-thin max-h-[calc(85vh-260px)] sm:max-h-[calc(85vh-320px)] overflow-y-auto px-6 py-6 sm:px-7 space-y-5">
          {/* Quick Info Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            <div className="rounded-2xl border border-sandal-200 bg-sandal-50/60 p-3.5">
              <span className="flex items-center gap-1.5 text-[11.5px] font-bold text-stone-500 uppercase tracking-wider">
                <CalendarDays className="size-3.5 text-kumkum-600" aria-hidden />
                Arrived
              </span>
              <p className="mt-1 font-semibold text-[13.5px] text-stone-800">{formatDate(cow.rescuedAt)}</p>
            </div>

            <div className="rounded-2xl border border-sandal-200 bg-sandal-50/60 p-3.5">
              <span className="flex items-center gap-1.5 text-[11.5px] font-bold text-stone-500 uppercase tracking-wider">
                <UserRound className="size-3.5 text-kumkum-600" aria-hidden />
                Caretaker
              </span>
              <p className="mt-1 font-semibold text-[13.5px] text-stone-800 truncate">{userName(cow.caretakerId)}</p>
            </div>

            <div className="col-span-2 sm:col-span-1 rounded-2xl border border-sandal-200 bg-sandal-50/60 p-3.5">
              <span className="flex items-center gap-1.5 text-[11.5px] font-bold text-stone-500 uppercase tracking-wider">
                <Milk className="size-3.5 text-kumkum-600" aria-hidden />
                Daily Milk
              </span>
              <p className="mt-1 font-semibold text-[13.5px] text-stone-800">
                {cow.milkYield ? `${cow.milkYield} litres` : 'Retired / Non-milking'}
              </p>
            </div>
          </div>

          {/* Rescue Story Card */}
          <div className="rounded-2xl border border-sandal-200 bg-gradient-to-br from-white to-sandal-50/50 p-4.5 sm:p-5">
            <h4 className="text-[12px] font-extrabold tracking-wider text-stone-500 uppercase">
              {isFemale ? 'Her Story' : 'His Story'}
            </h4>
            <p className="mt-2 text-[14.5px] sm:text-[15px] leading-relaxed text-stone-800 font-serif italic">
              "{cow.story}"
            </p>
          </div>

          {/* Health Note If Present */}
          {cow.healthNote ? (
            <div className="flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50/70 p-4 text-[13.5px] text-amber-950">
              <Stethoscope className="mt-0.5 size-4.5 shrink-0 text-amber-700" aria-hidden />
              <div>
                <strong className="block font-bold text-[12px] text-amber-800 uppercase tracking-wider">
                  Care & Health Note
                </strong>
                <p className="mt-0.5 leading-relaxed text-amber-900">{cow.healthNote}</p>
              </div>
            </div>
          ) : null}

          {/* Health Records If Any */}
          {records.length > 0 ? (
            <section>
              <h4 className="text-[11.5px] font-extrabold tracking-[0.14em] text-stone-500 uppercase">
                Veterinary records ({records.length})
              </h4>
              <ul className="mt-2.5 space-y-2">
                {records.map((r) => (
                  <li key={r.id} className="rounded-xl border border-sandal-200 bg-stone-50/60 px-3.5 py-2.5">
                    <div className="flex items-baseline justify-between gap-3">
                      <span className="text-[13px] font-semibold text-stone-900 capitalize">{r.kind}</span>
                      <span className="font-mono text-[12px] text-stone-500 tabular-nums">{formatDate(r.at)}</span>
                    </div>
                    <p className="mt-0.5 text-[12.5px] leading-relaxed text-stone-600">{r.note}</p>
                  </li>
                ))}
              </ul>
            </section>
          ) : null}
        </div>

        {/* Modal Footer / Action Bar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-sandal-200 bg-sandal-50/80 px-6 py-4">
          <div>
            <p className="text-[13px] text-stone-600">
              Monthly care: <strong className="font-mono text-stone-900 font-bold">{formatMoney(cow.monthlyCare)}</strong> / month
            </p>
            <p className="text-[11.5px] text-stone-500">Includes fresh green fodder, bran mash, and vet rounds.</p>
          </div>
          <div className="flex w-full sm:w-auto items-center gap-2">
            <Link
              to={`/sevalaya/gaushala/${cow.kind === 'calf' ? 'gau-care-calf' : cow.kind === 'cow' ? 'gau-care-cow' : 'gau-care-bull'}`}
              className="inline-flex flex-1 sm:flex-none h-10 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-kumkum-500 to-kumkum-600 px-5 text-[13.5px] font-bold text-white shadow-sm transition-all hover:from-kumkum-600 hover:to-kumkum-700 active:scale-[0.98]"
            >
              <HeartHandshake className="size-4" aria-hidden />
              Sponsor {isFemale ? 'her' : 'his'} care
            </Link>
            <button
              type="button"
              onClick={onClose}
              className="h-10 rounded-xl border border-stone-300 bg-white px-4 text-[13.5px] font-medium text-stone-700 hover:bg-stone-100 transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

