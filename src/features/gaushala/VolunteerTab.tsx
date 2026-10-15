import { useState } from 'react'
import { Building2, CheckCircle2, Clock, HandHeart, Users } from 'lucide-react'

import { Button } from '@/components/ui/Button'
import { Input, Textarea } from '@/components/ui/Input'
import { cn } from '@/lib/cn'
import { formatNumber } from '@/lib/format'
import { VOLUNTEER_INTERESTS } from '@/mock/gaushalaPrograms'
import { useDb } from '@/store/db'
import { currentUser, useSession } from '@/store/session'
import type { VolunteerInterest } from '@/types'

const WHAT_HELPS = [
  {
    title: 'Cow care & feeding',
    body: 'The two feeds, hand-feeding the old animals, and sitting with whoever is in the sick bay.',
  },
  {
    title: 'Shed cleaning',
    body: 'Unglamorous and the single most useful thing anyone does here. Two hours clears a shed.',
  },
  {
    title: 'Veterinary help',
    body: 'If you are a vet, a vet nurse or a final-year student, the Monday and Thursday rounds need hands.',
  },
  {
    title: 'Fundraising & social media',
    body: 'Most of our donors are abroad. Telling the story well is what keeps the fodder coming.',
  },
  {
    title: 'Translation',
    body: 'Tamil to English and back, for the updates adopters get and the receipts donors need.',
  },
  {
    title: 'Design & photography',
    body: 'Proof-of-sewa photographs, the gallery, and the annual report nobody enjoys laying out.',
  },
]

export function VolunteerTab() {
  const volunteers = useDb((s) => s.volunteers)
  const shifts = useDb((s) => s.volunteerShifts)

  const approved = volunteers.filter((v) => v.status === 'approved')
  const totalHours = approved.reduce((t, v) => t + v.hours, 0)

  return (
    <div>
      <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr] lg:items-start">
        <div>
          <h2 className="font-display text-[22px] leading-tight text-stone-900">Give us a morning</h2>
          <p className="mt-2 max-w-2xl text-[14.5px] leading-relaxed text-stone-700">
            Sixteen animals need feeding twice a day, every day, and the sheds need clearing whether or not anyone
            feels like it. If you can come, we will find you something useful to do. If you cannot come, there is
            plenty that happens on a laptop.
          </p>

          <dl className="mt-5 grid gap-3 sm:grid-cols-3">
            <Figure icon={<Users className="size-4" aria-hidden />} value={formatNumber(approved.length)} label="active volunteers" />
            <Figure icon={<Clock className="size-4" aria-hidden />} value={formatNumber(totalHours)} label="hours given" />
            <Figure icon={<HandHeart className="size-4" aria-hidden />} value={formatNumber(shifts.length)} label="shifts worked" />
          </dl>
        </div>

        <ul className="space-y-2.5">
          {WHAT_HELPS.slice(0, 3).map((row) => (
            <li key={row.title} className="rounded-xl border border-sandal-200 bg-sandal-50 px-4 py-3">
              <p className="text-[14px] font-semibold text-stone-900">{row.title}</p>
              <p className="mt-0.5 text-[13px] leading-relaxed text-stone-700">{row.body}</p>
            </li>
          ))}
        </ul>
      </div>

      <section className="mt-9 grid gap-6 lg:grid-cols-[1fr_1.1fr] lg:items-start">
        <div>
          <h3 className="font-display text-[19px] text-stone-900">What there is to do</h3>
          <ul className="mt-3.5 space-y-2.5">
            {WHAT_HELPS.slice(3).map((row) => (
              <li key={row.title} className="rounded-xl border border-sandal-200 bg-white px-4 py-3 shadow-card">
                <p className="text-[14px] font-semibold text-stone-900">{row.title}</p>
                <p className="mt-0.5 text-[13px] leading-relaxed text-stone-700">{row.body}</p>
              </li>
            ))}
          </ul>

          <div className="mt-5 rounded-card border border-navy-100 bg-navy-50/60 p-5">
            <h4 className="flex items-center gap-2 font-display text-[17px] text-stone-900">
              <Building2 className="size-4 text-navy-600" aria-hidden />
              Groups and companies
            </h4>
            <p className="mt-1.5 text-[13.5px] leading-relaxed text-stone-700">
              Schools, colleges and CSR teams are welcome, and a group morning gets more done than a month of
              individual visits. Tick the group box in the form and tell us roughly how many are coming.
            </p>
          </div>
        </div>

        <VolunteerForm />
      </section>
    </div>
  )
}

function Figure({ icon, value, label }: { icon: React.ReactNode; value: string; label: string }) {
  return (
    <div className="rounded-xl border border-sandal-200 bg-white px-4 py-3">
      <dt className="flex items-center gap-1.5 text-[11.5px] font-bold tracking-[0.1em] text-stone-500 uppercase">
        {icon}
        {label}
      </dt>
      <dd className="mt-1 font-display text-[24px] leading-none text-stone-900">{value}</dd>
    </div>
  )
}

function VolunteerForm() {
  const applyVolunteer = useDb((s) => s.applyVolunteer)
  const personaId = useSession((s) => s.personaId)

  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [city, setCity] = useState('')
  const [skills, setSkills] = useState('')
  const [availability, setAvailability] = useState('')
  const [interests, setInterests] = useState<VolunteerInterest[]>([])
  const [isGroup, setIsGroup] = useState(false)
  const [groupSize, setGroupSize] = useState('')
  const [organisation, setOrganisation] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [sent, setSent] = useState(false)

  function toggle(id: VolunteerInterest) {
    setInterests((list) => (list.includes(id) ? list.filter((i) => i !== id) : [...list, id]))
  }

  function submit(e: React.FormEvent) {
    e.preventDefault()
    const result = applyVolunteer(
      {
        name,
        email,
        phone,
        city,
        skills,
        availability,
        interests,
        isGroup,
        groupSize: groupSize ? Number(groupSize) : undefined,
        organisation,
      },
      currentUser(personaId),
    )
    if (!result.ok) {
      setError(result.error)
      return
    }
    setError(null)
    setSent(true)
  }

  if (sent) {
    return (
      <div className="rounded-card border border-tulsi-50 bg-tulsi-50/50 p-6 shadow-card">
        <p className="flex items-center gap-2 font-display text-[19px] text-stone-900">
          <CheckCircle2 className="size-5 text-tulsi-700" aria-hidden />
          Thank you
        </p>
        <p className="mt-2 text-[14px] leading-relaxed text-stone-700">
          Your application is with the shelter. Someone will write back within a few days with the areas that need
          hands and the times they run. Nobody is put on a shift without being asked first.
        </p>
        <Button variant="secondary" className="mt-4" onClick={() => setSent(false)}>
          Send another
        </Button>
      </div>
    )
  }

  return (
    <form onSubmit={submit} className="rounded-card border border-sandal-200 bg-white p-6 shadow-card">
      <h3 className="font-display text-[19px] text-stone-900">Volunteer application</h3>
      <p className="mt-1 text-[13.5px] text-stone-500">Nothing here is binding. It just tells us how to use you.</p>

      <div className="mt-5 space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <Input label="Name" value={name} onChange={(e) => setName(e.target.value)} autoComplete="name" />
          <Input label="Email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" />
          <Input label="Phone" type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} autoComplete="tel" />
          <Input label="Where you are" value={city} onChange={(e) => setCity(e.target.value)} hint="City is enough." />
        </div>

        <fieldset>
          <legend className="mb-2 text-[13px] font-bold text-navy-900">What would you like to help with</legend>
          <ul className="flex flex-wrap gap-2">
            {VOLUNTEER_INTERESTS.map((interest) => {
              const on = interests.includes(interest.id)
              return (
                <li key={interest.id}>
                  <button
                    type="button"
                    aria-pressed={on}
                    onClick={() => toggle(interest.id)}
                    className={cn(
                      'rounded-full border px-3 py-1.5 text-[13px] font-medium transition-colors',
                      on
                        ? 'border-kumkum-500 bg-kumkum-50 text-kumkum-700'
                        : 'border-navy-200 bg-white text-navy-800 hover:bg-navy-50',
                    )}
                  >
                    {interest.label}
                  </button>
                </li>
              )
            })}
          </ul>
        </fieldset>

        <Textarea
          label="Anything you are good at"
          value={skills}
          onChange={(e) => setSkills(e.target.value)}
          hint="Handling animals, a camera, a spreadsheet, a van. All of it is useful."
        />
        <Input
          label="When you are free"
          value={availability}
          onChange={(e) => setAvailability(e.target.value)}
          hint="Saturday mornings, weekday evenings, remote a few hours a week."
        />

        <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-navy-100 p-3.5 text-[13.5px] text-navy-800">
          <input
            type="checkbox"
            checked={isGroup}
            onChange={(e) => setIsGroup(e.target.checked)}
            className="mt-0.5 size-4 shrink-0 accent-kumkum-600"
          />
          <span>This is a group — a school, a college or a company team.</span>
        </label>

        {isGroup ? (
          <div className="grid gap-4 sm:grid-cols-2">
            <Input
              label="How many people"
              type="number"
              min={2}
              max={200}
              value={groupSize}
              onChange={(e) => setGroupSize(e.target.value)}
            />
            <Input
              label="Organisation"
              value={organisation}
              onChange={(e) => setOrganisation(e.target.value)}
            />
          </div>
        ) : null}

        {error ? (
          <p className="rounded-xl border border-danger-50 bg-danger-50 px-3.5 py-2.5 text-[13.5px] text-danger-600">
            {error}
          </p>
        ) : null}
      </div>

      <Button type="submit" className="mt-5" fullWidth>
        Send the application
      </Button>
      <p className="mt-2.5 text-[12px] leading-relaxed text-stone-500">
        We use your details only to arrange volunteering. They are never added to a mailing list without you asking.
      </p>
    </form>
  )
}
