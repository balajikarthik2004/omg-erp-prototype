import { Link } from 'react-router-dom'
import { ArrowRight, CalendarDays, MapPin, Ticket } from 'lucide-react'

import { SECTORS } from '@/config'
import { formatDateTime, formatMoney } from '@/lib/format'
import { EmptyState } from '@/components/ui/EmptyState'
import { Skeleton } from '@/components/ui/Skeleton'
import { SectorChip } from '@/components/layout/PhaseChip'
import { useDb } from '@/store/db'
import { REGISTRATION_STATES, seatsTaken } from './logic/rules'

/** The public list of events that are open for registration. Opens only after the poster is approved. */
export function PublicEventsPage() {
  const db = useDb()
  const open = db.events.filter((e) => REGISTRATION_STATES.includes(e.status)).sort((a, b) => a.startAt.localeCompare(b.startAt))

  return (
    <>
      <div className="mx-auto max-w-8xl px-5 pt-4 sm:px-8 sm:pt-6">
        <header className="relative isolate overflow-hidden rounded-2xl sm:rounded-3xl shadow-xl bg-gradient-to-br from-[#2E1805] via-[#482409] to-[#1C0D02] border border-amber-700/40 p-5 sm:p-6 lg:px-8 lg:py-6">
          {/* Subtle background glow */}
          <div
            className="pointer-events-none absolute -right-10 -bottom-10 h-64 w-64 opacity-[0.08]"
            style={{
              backgroundImage: 'radial-gradient(circle, #FFC107 15%, transparent 70%)',
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
                <span className="text-sandal-50">Events</span>
              </nav>

              <h1 className="mt-2.5 font-display text-[24px] leading-[1.08] text-sandal-50 sm:text-[32px] lg:text-[36px]">
                Events & Festivals
              </h1>
              <p className="mt-2.5 max-w-xl text-[14px] sm:text-[15px] leading-relaxed text-sandal-100/90">
                Festivals, sacred celebrations, music concerts and community gatherings. Register online for instant QR-coded entry passes.
              </p>

              <div className="mt-4 flex flex-wrap items-center gap-2.5 text-xs text-sandal-200/80">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1 font-semibold backdrop-blur-xs">
                  <span className="size-2 rounded-full bg-amber-400" />
                  Festivals & Programmes
                </span>
                <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1 font-semibold backdrop-blur-xs">
                  <span className="size-2 rounded-full bg-emerald-400" />
                  Instant QR Ticketing
                </span>
                <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1 font-semibold backdrop-blur-xs">
                  <span className="size-2 rounded-full bg-navy-300" />
                  All 3 Sectors Welcome
                </span>
              </div>
            </div>

            {/* Right Contained Image */}
            <div className="lg:col-span-5">
              <div className="group relative overflow-hidden rounded-2xl shadow-xl border-2 border-sandal-200/20 bg-navy-950">
                <div className="aspect-[16/10] sm:aspect-[16/9] overflow-hidden">
                  <img
                    src="/images/Festival.png"
                    alt="A glowing brass deepam with fresh jasmine flower garlands lit for temple and community festival events"
                    className="h-full w-full object-cover object-center transition-transform duration-500 group-hover:scale-[1.02]"
                    loading="eager"
                  />
                  <div className="pointer-events-none absolute inset-0 rounded-2xl ring-1 ring-inset ring-black/20" />
                </div>
              </div>
            </div>
          </div>
        </header>
      </div>

      <div className="mx-auto max-w-8xl px-5 py-6 sm:py-8 sm:px-8">

      {!db.ready ? (
        <div className="mt-10 grid gap-6 md:grid-cols-3">{[0, 1, 2].map((i) => <Skeleton key={i} className="h-56 w-full" />)}</div>
      ) : open.length === 0 ? (
        <div className="mt-10"><EmptyState icon={<CalendarDays className="size-6" aria-hidden />} title="No events are open right now" message="Events appear here once their poster is approved. Check back soon." /></div>
      ) : (
        <ul className="mt-10 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {open.map((e) => {
            const left = e.capacity ? e.capacity - seatsTaken(db, e.id) : null
            return (
              <li key={e.id}>
                <Link to={`/register/${e.id}`} className="group flex h-full flex-col rounded-card border border-sandal-200 bg-sandal-50 p-6 shadow-card transition-all duration-200 hover:-translate-y-1 hover:shadow-lift focus-visible:ring-2 focus-visible:ring-turmeric-400 focus-visible:outline-none">
                  <SectorChip sectorId={e.sectorId} />
                  <h2 className="mt-3 font-heritage text-[28px] leading-tight font-semibold text-stone-900">{e.name}</h2>
                  <p className="mt-3 flex items-start gap-2 text-[14px] text-stone-700"><CalendarDays className="mt-0.5 size-4 shrink-0 text-turmeric-700" aria-hidden />{formatDateTime(e.startAt)}</p>
                  <p className="mt-1.5 flex items-start gap-2 text-[14px] text-stone-700"><MapPin className="mt-0.5 size-4 shrink-0 text-turmeric-700" aria-hidden />{e.venue}</p>
                  <p className="mt-1.5 flex items-start gap-2 text-[14px] text-stone-700"><Ticket className="mt-0.5 size-4 shrink-0 text-turmeric-700" aria-hidden />{e.isPaid ? `${formatMoney(e.ticketPrice ?? 0)} per ticket` : 'Free entry'}{left !== null ? ` · ${Math.max(0, left)} seats left` : ''}</p>
                  <span className="mt-5 inline-flex items-center gap-1.5 border-t border-sandal-200 pt-4 text-[15px] font-semibold text-kumkum-700">
                    {left === 0 ? 'Full' : 'Register'}
                    <ArrowRight className="size-4 transition-transform duration-200 group-hover:translate-x-1" aria-hidden />
                  </span>
                </Link>
              </li>
            )
          })}
        </ul>
      )}
      <p className="mt-10 text-center text-[13px] text-stone-500">{SECTORS.temple.name}, {SECTORS.sevalaya.name} and {SECTORS.sangam.name} events all use the same page.</p>
      </div>
    </>
  )
}
