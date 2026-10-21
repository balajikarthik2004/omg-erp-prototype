import { useState } from 'react'
import { CalendarDays, Clock, Globe, Link2, MapPin, Radio, Users } from 'lucide-react'

import { Badge } from '@/components/ui/Badge'
import { cn } from '@/lib/cn'
import { Button } from '@/components/ui/Button'
import { Drawer } from '@/components/ui/Drawer'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { displayPrice, type Currency } from '@/lib/currency'
import { toast } from '@/lib/toast'
import {
  formatInViewerZone,
  formatTimeInViewerZone,
  relativeToNow,
  sameViewerDay,
  timeZoneLabel,
  viewerTimeZone,
} from '@/lib/zone'
import { useDb } from '@/store/db'
import { currentUser, useSession } from '@/store/session'
import type { GaushalaEvent } from '@/types'
import { GalleryPlate } from './GaushalaArt'

/** Fixed at load, so a re-render never reshuffles upcoming into past. */
const LOADED_AT = Date.now()

export function GaushalaEventsTab({ currency }: { currency: Currency }) {
  const events = useDb((s) => s.gaushalaEvents)
  const [rsvpFor, setRsvpFor] = useState<GaushalaEvent | null>(null)

  const now = LOADED_AT
  const upcoming = events
    .filter((e) => new Date(e.startAt).getTime() >= now && e.status !== 'cancelled')
    .sort((a, b) => a.startAt.localeCompare(b.startAt))
  const past = events
    .filter((e) => new Date(e.startAt).getTime() < now)
    .sort((a, b) => b.startAt.localeCompare(a.startAt))

  return (
    <div>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="font-display text-[22px] leading-tight text-stone-900">The festival calendar</h2>
          <p className="mt-2 max-w-2xl text-[14.5px] leading-relaxed text-stone-700">
            Gopashtami, Govardhan Puja, Mattu Pongal and the rest. Register to come, or watch the live stream if you
            cannot — several of these begin before sunrise here, which is the middle of the night where many of our
            donors are.
          </p>
        </div>
        <Badge icon={<Globe className="size-3.5" aria-hidden />}>
          Times shown in {viewerTimeZone()} ({timeZoneLabel()})
        </Badge>
      </div>

      <section className="mt-7">
        <h3 className="text-[11.5px] font-extrabold tracking-[0.14em] text-stone-500 uppercase">Coming up</h3>
        {upcoming.length === 0 ? (
          <p className="mt-3 text-[14px] text-stone-500">Nothing on the calendar at the moment.</p>
        ) : (
          <ul className="mt-4 space-y-5">
            {upcoming.map((event) => (
              <li key={event.id}>
                <EventCard event={event} currency={currency} onRsvp={() => setRsvpFor(event)} />
              </li>
            ))}
          </ul>
        )}
      </section>

      {past.length > 0 ? (
        <section className="mt-12">
          <h3 className="text-[11.5px] font-extrabold tracking-[0.14em] text-stone-500 uppercase">
            Already held
          </h3>
          <ul className="mt-4 grid gap-5 lg:grid-cols-2">
            {past.map((event) => (
              <li key={event.id}>
                <PastEventCard event={event} />
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <RsvpDrawer event={rsvpFor} currency={currency} onClose={() => setRsvpFor(null)} />
    </div>
  )
}

function getEventImage(event: { name: string; image?: string }): string | undefined {
  if (event.image) return event.image
  const n = event.name.toLowerCase()
  if (n.includes('pradosham')) return '/images/Pradosham.png'
  if (n.includes('gopashtami') || n.includes('gopastami')) return '/images/gopashtami.png'
  if (n.includes('sankranti') || n.includes('makar')) return '/images/makar-sankranti.png'
  if (n.includes('govardhan')) return '/images/Govardhan Puja.png'
  if (n.includes('mahashivratri') || n.includes('shivratri')) return '/images/Mahashivratri.png'
  return undefined
}

function EventCard({
  event,
  currency,
  onRsvp,
}: {
  event: GaushalaEvent
  currency: Currency
  onRsvp: () => void
}) {
  const full = event.capacity !== undefined && event.registered >= event.capacity
  const left = event.capacity !== undefined ? event.capacity - event.registered : undefined
  const sameDay = sameViewerDay(event.startAt, event.endAt)
  const eventImg = getEventImage(event)

  return (
    <article className="group overflow-hidden rounded-card border border-sandal-200 bg-sandal-50 shadow-card transition-all duration-300 hover:border-navy-200 hover:shadow-lift">
      <div
        className={cn(
          'grid gap-0',
          eventImg
            ? 'md:grid-cols-[180px_1fr_240px] lg:grid-cols-[200px_1fr_280px]'
            : 'md:grid-cols-[200px_1fr]',
        )}
      >
        <div className="flex flex-col items-center justify-center gap-1 border-b border-sandal-200 bg-white px-5 py-6 text-center md:border-r md:border-b-0">
          <CalendarDays className="size-5 text-kumkum-600" aria-hidden />
          <p className="mt-1 font-display text-[18px] leading-tight text-stone-900">
            {formatInViewerZone(event.startAt).split(',').slice(0, 2).join(',')}
          </p>
          <p className="font-mono text-[13px] text-stone-700 tabular-nums">
            {formatTimeInViewerZone(event.startAt)}
            {sameDay ? ` – ${formatTimeInViewerZone(event.endAt)}` : ''}
          </p>
          <p className="text-[12px] text-stone-500">{timeZoneLabel(event.startAt)}</p>
          <p className="mt-1.5 text-[12.5px] font-semibold text-kumkum-700">{relativeToNow(event.startAt)}</p>
        </div>

        <div className="flex flex-col justify-between p-5 sm:p-6">
          <div>
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="min-w-0">
                <h4 className="font-display text-[21px] leading-snug text-stone-900">{event.name}</h4>
                {event.tamil ? <p className="mt-0.5 text-[14px] text-stone-500">{event.tamil}</p> : null}
              </div>
              <div className="flex flex-wrap gap-2">
                {event.isPaid ? (
                  <Badge>{displayPrice(event.ticketPrice ?? 0, currency)} per head</Badge>
                ) : (
                  <Badge className="border-tulsi-50 bg-tulsi-50 text-tulsi-700">Free</Badge>
                )}
                {event.livestreamUrl ? (
                  <Badge icon={<Radio className="size-3.5" aria-hidden />}>Live stream</Badge>
                ) : null}
              </div>
            </div>

            <p className="mt-2.5 text-[14px] leading-relaxed text-stone-700">{event.summary}</p>

            <p className="mt-3 flex items-center gap-1.5 text-[13px] text-stone-500">
              <MapPin className="size-3.5 shrink-0" aria-hidden />
              {event.venue}
            </p>

            {event.rituals.length > 0 ? (
              <div className="mt-3.5">
                <p className="text-[11.5px] font-extrabold tracking-[0.12em] text-stone-500 uppercase">
                  What happens
                </p>
                <ul className="mt-1.5 flex flex-wrap gap-1.5">
                  {event.rituals.map((ritual) => (
                    <li
                      key={ritual}
                      className="rounded-full border border-sandal-200 bg-white px-2.5 py-1 text-[12.5px] text-stone-700"
                    >
                      {ritual}
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}
          </div>

          <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-sandal-200 pt-4">
            <p className="flex items-center gap-1.5 text-[13px] text-stone-500">
              <Users className="size-3.5" aria-hidden />
              {event.registered} registered
              {left !== undefined ? ` · ${left} place${left === 1 ? '' : 's'} left` : ''}
            </p>
            <div className="flex flex-wrap gap-2">
              {event.livestreamUrl ? (
                <Button
                  size="sm"
                  variant="secondary"
                  icon={<Radio className="size-4" aria-hidden />}
                  onClick={() => toast.info('Live stream', 'The link opens here when the stream goes live on the day.')}
                >
                  Watch live
                </Button>
              ) : null}
              <Button
                size="sm"
                variant="secondary"
                icon={<Link2 className="size-4" aria-hidden />}
                onClick={() => {
                  const url = `${window.location.origin}/sevalaya/gaushala`
                  void navigator.clipboard?.writeText(`${event.name} — ${formatInViewerZone(event.startAt)} · ${url}`)
                  toast.success('Link copied', 'Share it with whoever you would like to bring.')
                }}
              >
                Share
              </Button>
              <Button size="sm" disabled={full} onClick={onRsvp}>
                {full ? 'Full' : event.isPaid ? 'Register' : 'RSVP'}
              </Button>
            </div>
          </div>
        </div>

        {eventImg ? (
          <div className="relative aspect-[16/10] md:aspect-auto overflow-hidden border-t md:border-t-0 md:border-l border-sandal-200 bg-navy-950">
            <img
              src={eventImg}
              alt={event.name}
              className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
            />
          </div>
        ) : null}
      </div>
    </article>
  )
}

function PastEventCard({ event }: { event: GaushalaEvent }) {
  const eventImg = getEventImage(event)

  return (
    <article className="group h-full overflow-hidden rounded-card border border-sandal-200 bg-white shadow-card transition-all duration-300 hover:border-navy-200 hover:shadow-lift">
      {eventImg ? (
        <div className="relative aspect-[16/9] overflow-hidden bg-navy-950">
          <img
            src={eventImg}
            alt={event.name}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        </div>
      ) : event.galleryArt.length > 0 ? (
        <ul className="grid grid-cols-3 gap-px bg-sandal-200">
          {event.galleryArt.map((art, i) => (
            <li key={i} className="aspect-4/3 bg-white">
              <GalleryPlate art={art} />
            </li>
          ))}
        </ul>
      ) : null}
      <div className="p-5">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h4 className="font-display text-[18px] leading-snug text-stone-900">{event.name}</h4>
          <StatusBadge status={event.status} />
        </div>
        <p className="mt-1 flex items-center gap-1.5 text-[12.5px] text-stone-500">
          <Clock className="size-3.5" aria-hidden />
          {formatInViewerZone(event.startAt)} · {event.registered} came
        </p>
        <p className="mt-2 text-[13.5px] leading-relaxed text-stone-700">{event.summary}</p>
      </div>
    </article>
  )
}

function RsvpDrawer({
  event,
  currency,
  onClose,
}: {
  event: GaushalaEvent | null
  currency: Currency
  onClose: () => void
}) {
  const rsvpGaushalaEvent = useDb((s) => s.rsvpGaushalaEvent)
  const personaId = useSession((s) => s.personaId)

  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [people, setPeople] = useState(1)
  const [error, setError] = useState<string | null>(null)
  const [token, setToken] = useState<string | null>(null)

  if (!event) return null

  function submit() {
    const result = rsvpGaushalaEvent({ eventId: event!.id, name, email, people }, currentUser(personaId))
    if (!result.ok) {
      setError(result.error)
      return
    }
    setError(null)
    setToken(result.rsvp.qrToken)
  }

  const total = (event.ticketPrice ?? 0) * people
  const eventImg = getEventImage(event)

  return (
    <Drawer
      open
      onClose={onClose}
      title={token ? 'You are registered' : event.name}
      subtitle={token ? undefined : formatInViewerZone(event.startAt)}
      footer={
        token ? (
          <Button fullWidth onClick={onClose}>
            Close
          </Button>
        ) : (
          <div className="flex gap-2">
            <Button onClick={submit}>{event.isPaid ? 'Register and pay' : 'Confirm RSVP'}</Button>
            <Button variant="secondary" onClick={onClose}>
              Cancel
            </Button>
          </div>
        )
      }
    >
      <div className="space-y-5">
        {token ? (
          <div className="space-y-3">
            <p className="rounded-xl border border-tulsi-50 bg-tulsi-50/60 px-4 py-3 text-[13.5px] leading-relaxed text-tulsi-700">
              Your pass is on its way to {email}. Show it at the gate on the day.
            </p>
            <p className="font-mono text-[12px] break-all text-navy-700">{token}</p>
            {event.livestreamUrl ? (
              <p className="text-[13px] leading-relaxed text-navy-700">
                If you cannot travel, the same registration gets you the live stream link an hour before it starts.
              </p>
            ) : null}
          </div>
        ) : (
          <>
            {eventImg ? (
              <div className="relative aspect-[16/9] overflow-hidden rounded-xl border border-sandal-200 bg-navy-950 shadow-xs">
                <img src={eventImg} alt={event.name} className="h-full w-full object-cover" />
              </div>
            ) : null}
            <p className="text-[13.5px] leading-relaxed text-navy-700">{event.summary}</p>
            <p className="flex items-center gap-1.5 text-[13px] text-navy-600">
              <Globe className="size-3.5" aria-hidden />
              Starts {formatInViewerZone(event.startAt)} in your time zone ({timeZoneLabel(event.startAt)}).
            </p>

            <Input label="Name" value={name} onChange={(e) => setName(e.target.value)} autoComplete="name" />
            <Input
              label="Email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
              hint="Where the pass and the live stream link go."
            />
            <Select
              label="How many people"
              value={String(people)}
              onChange={(e) => setPeople(Number(e.target.value))}
              options={Array.from({ length: 8 }, (_, i) => ({
                value: String(i + 1),
                label: `${i + 1} ${i === 0 ? 'person' : 'people'}`,
              }))}
            />

            {event.isPaid ? (
              <div className="rounded-xl border border-navy-100 bg-navy-50/50 p-4">
                <div className="flex items-baseline justify-between text-[14px]">
                  <span className="text-navy-700">
                    {displayPrice(event.ticketPrice ?? 0, currency)} × {people}
                  </span>
                  <span className="font-mono font-semibold text-navy-950 tabular-nums">
                    {displayPrice(total, currency)}
                  </span>
                </div>
              </div>
            ) : (
              <p className="rounded-xl border border-navy-100 bg-navy-50/50 px-3.5 py-2.5 text-[13.5px] text-navy-700">
                This one is free. We ask you to register only so we know how much prasadam to cook.
              </p>
            )}

            {error ? (
              <p className="rounded-xl border border-danger-50 bg-danger-50 px-3.5 py-2.5 text-[13.5px] text-danger-600">
                {error}
              </p>
            ) : null}
          </>
        )}
      </div>
    </Drawer>
  )
}

export { EventCard as GaushalaEventCard }
