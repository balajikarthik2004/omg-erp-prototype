import { useMemo, useState } from 'react'
import { Link, Navigate } from 'react-router-dom'
import { Search } from 'lucide-react'

import { Input } from '@/components/ui/Input'
import { Tabs } from '@/components/ui/Tabs'
import { CURRENCIES, type Currency } from '@/lib/currency'
import { GAUSHALA_SEWAS } from '@/mock/gaushala'
import { useDb } from '@/store/db'
import { useSession } from '@/store/session'

import { SewasTab } from './SewasTab'
import { OurCowsTab } from './OurCowsTab'
import { AboutTab } from './AboutTab'
import { AdoptTab } from './AdoptTab'
import { VisitBookTab } from './VisitBookTab'
import { GaushalaEventsTab } from './GaushalaEventsTab'
import { VolunteerTab } from './VolunteerTab'
import { TransparencyTab } from './TransparencyTab'

/** Fixed at load, like the mock database itself. Keeps counts stable. */
const LOADED_AT = Date.now()

export type GaushalaTabId =
  | 'sewas'
  | 'adopt'
  | 'visit'
  | 'events'
  | 'cows'
  | 'volunteer'
  | 'transparency'
  | 'about'

interface TabDef {
  id: GaushalaTabId
  label: string
}

const TABS: TabDef[] = [
  { id: 'sewas', label: 'Sewas' },
  { id: 'adopt', label: 'Adopt a Cow' },
  { id: 'visit', label: 'Visit & Book' },
  { id: 'events', label: 'Events' },
  { id: 'cows', label: 'Our Cows' },
  { id: 'volunteer', label: 'Volunteer' },
  { id: 'transparency', label: 'Transparency' },
  { id: 'about', label: 'About & Contact' },
]

export function GaushalaPage() {
  const [tab, setTab] = useState<GaushalaTabId>('sewas')
  const [query, setQuery] = useState('')

  // The viewer's own money. Guessed from the browser on first load, kept in
  // the session so checkout and the receipt can record what they were shown.
  const currency = useSession((s) => s.displayCurrency)
  const setCurrency = useSession((s) => s.setDisplayCurrency)

  const db = useDb()
  const tenant = db.tenants.find((t) => t.id === db.activeTenantId)

  const cows = db.cows
  const adoptions = db.adoptions
  const visitServices = db.visitServices
  const gaushalaEvents = db.gaushalaEvents

  const counts = useMemo<Partial<Record<GaushalaTabId, number>>>(() => {
    const now = LOADED_AT
    const living = cows.filter((c) => c.status !== 'deceased')
    return {
      sewas: GAUSHALA_SEWAS.filter((s) => s.active).length,
      // How many cows still have a share open, which is what the tab offers.
      adopt: living.filter(
        (c) => adoptions.filter((a) => a.cowId === c.id && a.status === 'active').length < 4,
      ).length,
      visit: visitServices.filter((s) => s.active).length,
      events: gaushalaEvents.filter(
        (e) => new Date(e.startAt).getTime() >= now && e.status !== 'cancelled',
      ).length,
      cows: living.length,
    }
  }, [cows, adoptions, visitServices, gaushalaEvents])

  // The Gaushala lives inside Sevalaya, so a customer without that vertical
  // does not have it either.
  if (tenant && !tenant.verticals.includes('sevalaya')) {
    return <Navigate to={`/donate/${tenant.verticals[0] ?? 'temple'}`} replace />
  }

  const active = TABS.find((t) => t.id === tab) ?? TABS[0]!
  const searchable = tab === 'sewas' || tab === 'cows'
  // Anything with a price on it gets the currency switcher.
  const priced = tab === 'sewas' || tab === 'adopt' || tab === 'visit' || tab === 'events'

  return (
    <>
      <div className="mx-auto max-w-8xl px-5 pt-4 sm:px-8 sm:pt-6">
        <header className="relative isolate overflow-hidden rounded-2xl sm:rounded-3xl shadow-xl bg-gradient-to-br from-[#0B0D28] via-[#121642] to-[#181335] border border-navy-800/50 p-5 sm:p-6 lg:px-8 lg:py-6">
          {/* Subtle background mandala / etching watermark */}
          <div
            className="pointer-events-none absolute -right-10 -bottom-10 h-64 w-64 opacity-[0.07]"
            style={{
              backgroundImage: 'radial-gradient(circle, #fff 10%, transparent 70%)',
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
                <Link to="/sevalaya/seva" className="transition-colors duration-150 hover:text-navy-300">
                  Sevalaya
                </Link>
                <span aria-hidden>/</span>
                <span className="text-sandal-50">Gaushala</span>
              </nav>

              <h1 className="mt-2.5 font-display text-[24px] leading-[1.08] text-sandal-50 sm:text-[32px] lg:text-[36px]">
                Gaushala
              </h1>
              <p className="mt-2.5 max-w-xl text-[14px] sm:text-[15px] leading-relaxed text-sandal-100/90">
                Sixteen indigenous cows, calves and bulls, fed twice a day and cared for with lifelong devotion. Most of the
                people who keep them fed have never stood in this yard.
              </p>

              <div className="mt-4 flex flex-wrap items-center gap-2.5 text-xs text-sandal-200/80">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1 font-semibold backdrop-blur-xs">
                  <span className="size-2 rounded-full bg-emerald-400" />
                  16 Indigenous Cattle
                </span>
                <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1 font-semibold backdrop-blur-xs">
                  <span className="size-2 rounded-full bg-amber-400" />
                  Daily Fresh Fodder
                </span>
                <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1 font-semibold backdrop-blur-xs">
                  <span className="size-2 rounded-full bg-navy-300" />
                  Double-signed CA Ledger
                </span>
              </div>
            </div>

            {/* Right Contained Image */}
            <div className="lg:col-span-5">
              <div className="group relative overflow-hidden rounded-2xl shadow-xl border-2 border-sandal-200/20 bg-navy-950">
                <div className="aspect-[16/10] sm:aspect-[16/9] overflow-hidden">
                  <img
                    src="/images/sevalaya-gaushala.webp"
                    alt="Devotees serving fresh green fodder to cows at Sevalaya Gaushala"
                    className="h-full w-full object-cover object-center transition-transform duration-500 group-hover:scale-[1.02]"
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
        <Tabs
          value={tab}
          onChange={(id) => {
            setTab(id as GaushalaTabId)
            setQuery('')
          }}
          items={TABS.map((t) => ({
            id: t.id,
            label: t.label,
            count: counts[t.id],
          }))}
        />

        {searchable || priced ? (
          <div className="mt-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            {searchable ? (
              <div className="relative flex-1 sm:max-w-xl md:max-w-2xl">
                <div className="relative flex items-center">
                  <Input
                    aria-label={`Search ${active.label.toLowerCase()}`}
                    placeholder={
                      tab === 'sewas'
                        ? 'Search all sewas (e.g. grass, calf care, medical, shed...)'
                        : 'Search the herd by name, tag or breed...'
                    }
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    leading={<Search className="size-5 text-navy-400" aria-hidden />}
                    className="h-12 sm:h-13 pl-11 pr-10 text-[15px] sm:text-[16px] rounded-2xl border-navy-200/90 shadow-sm focus:border-navy-500 focus:ring-4 focus:ring-navy-500/10 placeholder:text-stone-400"
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
            ) : (
              <span />
            )}

            {priced ? <CurrencySwitcher value={currency} onChange={setCurrency} /> : null}
          </div>
        ) : null}

        <div className="mt-7 min-h-80">
          {tab === 'sewas' ? (
            <SewasTab query={query} currency={currency} onClearQuery={() => setQuery('')} />
          ) : tab === 'adopt' ? (
            <AdoptTab currency={currency} />
          ) : tab === 'visit' ? (
            <VisitBookTab currency={currency} />
          ) : tab === 'events' ? (
            <GaushalaEventsTab currency={currency} />
          ) : tab === 'cows' ? (
            <OurCowsTab query={query} onClearQuery={() => setQuery('')} />
          ) : tab === 'volunteer' ? (
            <VolunteerTab />
          ) : tab === 'transparency' ? (
            <TransparencyTab />
          ) : (
            <AboutTab />
          )}
        </div>
      </div>
    </>
  )
}

/**
 * Prices are presented in the viewer's own money. The books still settle in
 * the entity's currency — this changes what is shown, never what is charged,
 * and the page says so rather than leaving it to be discovered at checkout.
 */
function CurrencySwitcher({ value, onChange }: { value: Currency; onChange: (c: Currency) => void }) {
  return (
    <label className="flex items-center gap-2 text-[13px] text-stone-500">
      <span>Show prices in</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value as Currency)}
        className="rounded-lg border border-sandal-200 bg-white px-2.5 py-1.5 text-[13px] font-semibold text-stone-900 shadow-2xs focus:border-kumkum-500 focus:ring-3 focus:ring-kumkum-500/15 focus:outline-none"
      >
        {Object.values(CURRENCIES).map((c) => (
          <option key={c.code} value={c.code}>
            {c.code} — {c.label}
          </option>
        ))}
      </select>
    </label>
  )
}
