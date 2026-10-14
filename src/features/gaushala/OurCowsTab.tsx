import { useState } from 'react'
import { Link } from 'react-router-dom'
import { CalendarDays, HeartHandshake, Milk, Stethoscope, UserRound } from 'lucide-react'

import { cn } from '@/lib/cn'
import { formatDate, formatMoney } from '@/lib/format'
import { Drawer } from '@/components/ui/Drawer'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { Tabs } from '@/components/ui/Tabs'
import { userName } from '@/mock/seed'
import { useDb } from '@/store/db'
import type { Cow } from '@/types'
import { CowPortrait } from './GaushalaArt'
import { NoMatches } from './NoMatches'

/** Fixed at load, so a re-render never shifts what counts as "this year". */
const LOADED_AT = Date.now()

type Filter = 'all' | 'milk' | 'calf' | 'bull' | 'sick'

const FILTERS: { id: Filter; label: string }[] = [
  { id: 'all', label: 'Everyone' },
  { id: 'milk', label: 'Milk cows' },
  { id: 'calf', label: 'Calves' },
  { id: 'bull', label: 'Bulls & oxen' },
  { id: 'sick', label: 'Under care' },
]

function matchesFilter(cow: Cow, filter: Filter, _now: number): boolean {
  switch (filter) {
    case 'milk':
      return cow.kind === 'cow' && (cow.milkYield ?? 0) > 0
    case 'calf':
      return cow.kind === 'calf'
    case 'bull':
      return cow.kind === 'bull' || cow.kind === 'ox'
    case 'sick':
      return cow.status === 'sick' || cow.status === 'recovering'
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

      <CowDrawer cow={open} onClose={() => setOpen(null)} />
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
          <CowPortrait portrait={cow.portrait} size={76} />
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
        <span className="font-medium text-kumkum-700 group-hover:underline">Read her story</span>
      </span>
    </button>
  )
}

function CowDrawer({ cow, onClose }: { cow: Cow | null; onClose: () => void }) {
  const health = useDb((s) => s.cowHealth)
  if (!cow) return null

  const records = health.filter((h) => h.cowId === cow.id).slice(0, 6)

  return (
    <Drawer
      open
      onClose={onClose}
      title={cow.name}
      subtitle={`${cow.breed} · ${cow.ageYears} ${cow.ageYears === 1 ? 'year' : 'years'} old`}
      width="lg"
    >
      <div className="space-y-6 px-6 py-5">
        <div className="flex items-center gap-4">
          <span className="flex size-28 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-navy-100 bg-navy-50">
            <CowPortrait portrait={cow.portrait} size={108} />
          </span>
          <div className="min-w-0 space-y-2">
            <StatusBadge status={cow.status} />
            <dl className="space-y-1 text-[13.5px] text-navy-800">
              <Row icon={<CalendarDays className="size-3.5" aria-hidden />} label="Arrived">
                {formatDate(cow.rescuedAt)}
              </Row>
              <Row icon={<UserRound className="size-3.5" aria-hidden />} label="Caretaker">
                {userName(cow.caretakerId)}
              </Row>
              {cow.milkYield ? (
                <Row icon={<Milk className="size-3.5" aria-hidden />} label="Milk">
                  {cow.milkYield} litres a day
                </Row>
              ) : null}
            </dl>
          </div>
        </div>

        <p className="text-[14.5px] leading-relaxed text-navy-900">{cow.story}</p>

        {cow.healthNote ? (
          <p className="flex items-start gap-2 rounded-xl border border-marigold-50 bg-marigold-50/60 px-3.5 py-2.5 text-[13.5px] leading-relaxed text-marigold-500">
            <Stethoscope className="mt-0.5 size-4 shrink-0" aria-hidden />
            <span>{cow.healthNote}</span>
          </p>
        ) : null}

        {records.length > 0 ? (
          <section>
            <h4 className="text-[11.5px] font-extrabold tracking-[0.14em] text-navy-700 uppercase">
              Health record
            </h4>
            <ul className="mt-3 space-y-2.5">
              {records.map((r) => (
                <li key={r.id} className="rounded-xl border border-navy-100 bg-navy-50/50 px-3.5 py-2.5">
                  <div className="flex items-baseline justify-between gap-3">
                    <span className="text-[13.5px] font-semibold text-navy-950 capitalize">{r.kind}</span>
                    <span className="font-mono text-[12.5px] text-navy-600 tabular-nums">{formatDate(r.at)}</span>
                  </div>
                  <p className="mt-0.5 text-[13px] leading-relaxed text-navy-700">{r.note}</p>
                </li>
              ))}
            </ul>
          </section>
        ) : null}

        <section className="rounded-xl border border-navy-100 bg-white p-4">
          <p className="text-[13.5px] leading-relaxed text-navy-800">
            Keeping {cow.name} costs <strong className="font-mono tabular-nums">{formatMoney(cow.monthlyCare)}</strong>{' '}
            a month — feed, bedding, a caretaker and a vet on call.
          </p>
          <div className="mt-3.5 flex flex-wrap gap-2">
            <Link
              to={`/sevalaya/gaushala/${cow.kind === 'calf' ? 'gau-care-calf' : cow.kind === 'cow' ? 'gau-care-cow' : 'gau-care-bull'}`}
              className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-kumkum-500 to-kumkum-600 px-4 text-[14px] font-bold text-white shadow-sm transition-all hover:from-kumkum-600 hover:to-kumkum-700 active:scale-[0.98]"
            >
              <HeartHandshake className="size-4" aria-hidden />
              Sponsor her care
            </Link>
          </div>
          <p className="mt-2.5 text-[12.5px] text-navy-600">
            Full adoption, with monthly photographs and a certificate, opens in the next release.
          </p>
        </section>
      </div>
    </Drawer>
  )
}

function Row({ icon, label, children }: { icon: React.ReactNode; label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-navy-500">{icon}</span>
      <dt className="sr-only">{label}</dt>
      <dd>{children}</dd>
    </div>
  )
}
