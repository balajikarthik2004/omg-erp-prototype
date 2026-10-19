import { useState } from 'react'
import { Award, CalendarClock, HeartHandshake, Mail, ShieldCheck } from 'lucide-react'

import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Drawer } from '@/components/ui/Drawer'
import { Input } from '@/components/ui/Input'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { cn } from '@/lib/cn'
import { SETTLEMENT_CURRENCY, displayPrice, type Currency } from '@/lib/currency'
import { formatDate, formatMoney } from '@/lib/format'
import { ADOPTION_TIERS, adoptionPrice } from '@/mock/gaushalaPrograms'
import { useDb } from '@/store/db'
import { currentUser, useSession } from '@/store/session'
import type { Adoption, AdoptionTier, Cow } from '@/types'
import { CowPortrait } from './GaushalaArt'

export function AdoptTab({ currency }: { currency: Currency }) {
  const cows = useDb((s) => s.cows)
  const adoptions = useDb((s) => s.adoptions)
  const [chosen, setChosen] = useState<Cow | null>(null)

  const herd = cows.filter((c) => c.status !== 'deceased')
  const sponsorsFor = (cowId: string) => adoptions.filter((a) => a.cowId === cowId && a.status === 'active')

  return (
    <div>
      <div className="grid gap-5 lg:grid-cols-[1.4fr_1fr] lg:items-start">
        <div>
          <h2 className="font-display text-[22px] leading-tight text-stone-900 font-bold">Adopt a cow</h2>
          <p className="mt-2 max-w-2xl text-[14.5px] leading-relaxed text-stone-700">
            Sponsorship pays for one animal&rsquo;s keep — her feed, her bedding, her caretaker and the vet when she
            needs one. You get a certificate, a photograph every month and her health reports, and you are welcome to
            come and meet her whenever the shelter is open.
          </p>
        </div>

        <ul className="grid gap-2.5 sm:grid-cols-2 lg:grid-cols-1">
          {[
            { icon: <Award className="size-4" aria-hidden />, text: 'A digital certificate in the name you choose' },
            { icon: <Mail className="size-4" aria-hidden />, text: 'Photographs and health notes every month' },
            { icon: <CalendarClock className="size-4" aria-hidden />, text: 'A reminder before every renewal, never a surprise charge' },
          ].map((row) => (
            <li
              key={row.text}
              className="flex items-start gap-2.5 rounded-xl border border-sandal-200 bg-sandal-50 px-3.5 py-2.5 text-[13.5px] leading-relaxed text-stone-700"
            >
              <span className="mt-0.5 shrink-0 text-kumkum-600">{row.icon}</span>
              {row.text}
            </li>
          ))}
        </ul>
      </div>

      <ul className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {herd.map((cow) => (
          <li key={cow.id}>
            <CowSponsorCard
              cow={cow}
              sponsors={sponsorsFor(cow.id)}
              currency={currency}
              onAdopt={() => setChosen(cow)}
            />
          </li>
        ))}
      </ul>

      <AdopterArea />

      <AdoptDrawer cow={chosen} currency={currency} onClose={() => setChosen(null)} />
    </div>
  )
}

function CowSponsorCard({
  cow,
  sponsors,
  currency,
  onAdopt,
}: {
  cow: Cow
  sponsors: Adoption[]
  currency: Currency
  onAdopt: () => void
}) {
  const fullTaken = sponsors.some((a) => a.tier === 'full_monthly' || a.tier === 'full_yearly')
  const sharesLeft = Math.max(0, 4 - sponsors.length)
  const closed = fullTaken || sharesLeft === 0

  return (
    <div
      className={cn(
        'flex h-full flex-col rounded-card border border-sandal-200 bg-sandal-50 p-5 shadow-card',
        'transition-all duration-200 hover:-translate-y-0.5 hover:border-navy-200 hover:shadow-lift',
      )}
    >
      <div className="flex items-start gap-4">
        <span className="flex size-20 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-sandal-200 bg-white">
          <CowPortrait cow={cow} size={76} />
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-baseline gap-x-2">
            <h3 className="font-display text-[19px] leading-tight text-stone-900">{cow.name}</h3>
            {cow.tamil ? <span className="text-[13.5px] text-stone-500">{cow.tamil}</span> : null}
          </div>
          <p className="mt-0.5 text-[13px] text-stone-500">
            {cow.breed} · {cow.ageYears} {cow.ageYears === 1 ? 'year' : 'years'}
          </p>
          <div className="mt-2">
            <StatusBadge status={cow.status} />
          </div>
        </div>
      </div>

      <p className="mt-3.5 line-clamp-3 flex-1 text-[13.5px] leading-relaxed text-stone-700">{cow.story}</p>

      <dl className="mt-4 flex flex-wrap items-baseline justify-between gap-2 border-t border-sandal-200 pt-3.5">
        <div>
          <dt className="text-[11px] font-bold tracking-[0.1em] text-stone-500 uppercase">Her keep</dt>
          <dd className="mt-0.5 font-mono text-[17px] text-stone-900 tabular-nums">
            {displayPrice(cow.monthlyCare, currency)}
            <span className="ml-1 font-sans text-[12px] text-stone-500">a month</span>
          </dd>
        </div>
        <Badge className={closed ? 'border-tulsi-50 bg-tulsi-50 text-tulsi-700' : undefined}>
          {fullTaken ? 'Fully sponsored' : `${sharesLeft} of 4 shares open`}
        </Badge>
      </dl>

      <Button className="mt-4" fullWidth disabled={closed} onClick={onAdopt} icon={<HeartHandshake className="size-4" aria-hidden />}>
        {closed ? 'Already sponsored' : 'Sponsor her'}
      </Button>
    </div>
  )
}

function AdoptDrawer({ cow, currency, onClose }: { cow: Cow | null; currency: Currency; onClose: () => void }) {
  const adoptCow = useDb((s) => s.adoptCow)
  const adoptions = useDb((s) => s.adoptions)
  const personaId = useSession((s) => s.personaId)

  const [tier, setTier] = useState<AdoptionTier>('full_monthly')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [done, setDone] = useState<string | null>(null)

  if (!cow) return null

  const taken = adoptions.filter((a) => a.cowId === cow.id && a.status === 'active')
  const fullTaken = taken.some((a) => a.tier === 'full_monthly' || a.tier === 'full_yearly')

  function submit() {
    const result = adoptCow(cow!.id, tier, { name, email }, currentUser(personaId))
    if (!result.ok) {
      setError(result.error)
      return
    }
    setError(null)
    setDone(result.adoption.certificateNo)
  }

  return (
    <Drawer
      open
      onClose={onClose}
      title={done ? 'Thank you' : `Sponsor ${cow.name}`}
      subtitle={done ? `Certificate ${done}` : `${cow.breed} · ${cow.ageYears} years`}
      width="lg"
      footer={
        done ? (
          <Button fullWidth onClick={onClose}>
            Close
          </Button>
        ) : (
          <div className="flex gap-2">
            <Button onClick={submit}>Confirm sponsorship</Button>
            <Button variant="secondary" onClick={onClose}>
              Cancel
            </Button>
          </div>
        )
      }
    >
      <div className="space-y-5 px-6 py-5">
        <div className="flex items-center gap-4">
          <span className="flex size-24 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-navy-100 bg-navy-50">
            <CowPortrait cow={cow} size={92} />
          </span>
          <p className="text-[13.5px] leading-relaxed text-navy-700">{cow.story}</p>
        </div>

        {done ? (
          <div className="space-y-3 rounded-xl border border-tulsi-50 bg-tulsi-50/60 p-4">
            <p className="flex items-center gap-2 text-[14px] font-semibold text-tulsi-700">
              <ShieldCheck className="size-4" aria-hidden />
              {cow.name} is yours to look after.
            </p>
            <p className="text-[13.5px] leading-relaxed text-navy-800">
              Your certificate number is <span className="font-mono">{done}</span>. The first photograph will reach
              you at the end of this month, and a reminder will come before the renewal — you will never be charged
              without being told first.
            </p>
            <p className="text-[12.5px] text-navy-600">
              Everything about her then lives in your devotee account, under My Donations.
            </p>
          </div>
        ) : (
          <>
            <fieldset>
              <legend className="text-[11.5px] font-extrabold tracking-[0.14em] text-navy-700 uppercase">
                Choose a tier
              </legend>
              <ul className="mt-3 space-y-2.5">
                {ADOPTION_TIERS.map((meta) => {
                  const price = adoptionPrice(cow, meta.id)
                  const blocked = fullTaken && meta.share === 1
                  return (
                    <li key={meta.id}>
                      <label
                        className={cn(
                          'flex cursor-pointer items-start gap-3 rounded-xl border p-3.5 transition-colors',
                          blocked && 'cursor-not-allowed opacity-50',
                          tier === meta.id ? 'border-kumkum-500 bg-kumkum-50/60' : 'border-navy-100 hover:bg-navy-50/60',
                        )}
                      >
                        <input
                          type="radio"
                          name="tier"
                          className="mt-1 size-4 accent-kumkum-600"
                          checked={tier === meta.id}
                          disabled={blocked}
                          onChange={() => setTier(meta.id)}
                        />
                        <span className="min-w-0 flex-1">
                          <span className="flex flex-wrap items-baseline justify-between gap-2">
                            <span className="text-[14.5px] font-bold text-navy-950">{meta.label}</span>
                            <span className="font-mono text-[15px] text-navy-950 tabular-nums">
                              {displayPrice(price, currency)}
                              <span className="ml-1 font-sans text-[12px] text-navy-600">
                                {meta.interval === 'yearly' ? 'a year' : 'a month'}
                              </span>
                            </span>
                          </span>
                          <span className="mt-0.5 block text-[13px] leading-relaxed text-navy-600">{meta.blurb}</span>
                        </span>
                      </label>
                    </li>
                  )
                })}
              </ul>
            </fieldset>

            <Input label="Name for the certificate" value={name} onChange={(e) => setName(e.target.value)} />
            <Input
              label="Email for the monthly updates"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />

            {currency !== SETTLEMENT_CURRENCY ? (
              <p className="text-[12.5px] leading-relaxed text-navy-600">
                Shown in {currency}; charged as {formatMoney(adoptionPrice(cow, tier))} and the rate is printed on
                your receipt.
              </p>
            ) : null}

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

/** What an existing adopter sees. Signed-in devotees get the real thing. */
function AdopterArea() {
  const adoptions = useDb((s) => s.adoptions)
  const cows = useDb((s) => s.cows)
  const signedIn = useSession((s) => s.signedIn)

  const active = adoptions.filter((a) => a.status === 'active').slice(0, 2)
  if (active.length === 0) return null

  return (
    <section className="mt-12 rounded-card border border-sandal-200 bg-white p-6 shadow-card sm:p-7">
      <div className="flex flex-wrap items-baseline justify-between gap-3">
        <h3 className="font-display text-[20px] text-stone-900">The adopter&rsquo;s area</h3>
        <span className="text-[13px] text-stone-500">
          {signedIn ? 'Signed in — this is your shelf.' : 'Sign in to see your own cow here.'}
        </span>
      </div>
      <p className="mt-1.5 text-[14px] leading-relaxed text-stone-700">
        Every adopter gets this: her photographs, her health reports, the certificate and the renewal date, all in
        one place inside your devotee account.
      </p>

      <ul className="mt-5 grid gap-5 lg:grid-cols-2">
        {active.map((adoption) => {
          const cow = cows.find((c) => c.id === adoption.cowId)
          if (!cow) return null
          return (
            <li key={adoption.id} className="rounded-xl border border-sandal-200 bg-sandal-50 p-4">
              <div className="flex items-center gap-3">
                <span className="flex size-14 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-sandal-200 bg-white">
                  <CowPortrait cow={cow} size={54} />
                </span>
                <div className="min-w-0">
                  <p className="font-display text-[17px] text-stone-900">{cow.name}</p>
                  <p className="text-[12.5px] text-stone-500">
                    Certificate <span className="font-mono">{adoption.certificateNo}</span>
                  </p>
                  <p className="text-[12.5px] text-stone-500">Renews {formatDate(adoption.renewsAt)}</p>
                </div>
              </div>

              {adoption.updates.length > 0 ? (
                <ul className="mt-3.5 space-y-2">
                  {adoption.updates.slice(0, 2).map((update) => (
                    <li key={update.id} className="rounded-lg border border-sandal-200 bg-white px-3.5 py-2.5">
                      <p className="flex items-baseline justify-between gap-3">
                        <span className="text-[13.5px] font-semibold text-stone-900">{update.title}</span>
                        <span className="shrink-0 font-mono text-[12px] text-stone-500">{formatDate(update.at)}</span>
                      </p>
                      <p className="mt-0.5 text-[13px] leading-relaxed text-stone-700">{update.body}</p>
                    </li>
                  ))}
                </ul>
              ) : null}
            </li>
          )
        })}
      </ul>
    </section>
  )
}
