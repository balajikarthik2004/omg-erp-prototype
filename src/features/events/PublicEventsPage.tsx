import { Link } from 'react-router-dom'
import { ArrowRight, CalendarDays, MapPin, Ticket } from 'lucide-react'

import { SECTORS } from '@/config'
import { formatDateTime, formatMoney } from '@/lib/format'
import { Button } from '@/components/ui/Button'
import { EmptyState } from '@/components/ui/EmptyState'
import { Divider } from '@/components/ui/Ornament'
import { Skeleton } from '@/components/ui/Skeleton'
import { SectorChip } from '@/components/layout/PhaseChip'
import { useDb } from '@/store/db'
import { REGISTRATION_STATES, seatsTaken } from './logic/rules'

/** The public list of events that are open for registration. Opens only after the poster is approved. */
export function PublicEventsPage() {
  const db = useDb()
  const open = db.events.filter((e) => REGISTRATION_STATES.includes(e.status)).sort((a, b) => a.startAt.localeCompare(b.startAt))

  return (
    <div className="mx-auto max-w-6xl px-5 py-12 sm:px-8">
      <header className="text-center">
        <p className="text-[12px] font-semibold tracking-[0.22em] text-turmeric-700 uppercase">Events</p>
        <h1 className="mt-3 font-heritage text-[40px] leading-tight font-medium text-stone-900 sm:text-[52px]">What is happening</h1>
        <p className="mx-auto mt-3 max-w-xl text-[16px] text-stone-700">Festivals, programmes and community days. Register, and your ticket has a QR code for the door.</p>
        <Divider className="mx-auto mt-6 max-w-[240px]" />
      </header>

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
                  <SectorChip sectorId={e.sectorId} withTamil />
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
      <div className="mt-6 text-center"><Link to="/"><Button variant="ghost">Back to the donor home</Button></Link></div>
    </div>
  )
}
