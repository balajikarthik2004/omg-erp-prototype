import { addDays, format, subDays, subMonths } from 'date-fns'

import { currencyForCountry } from '@/lib/currency'
import { createRng, SEED } from '@/lib/rng'
import type {
  Adoption,
  AdoptionTier,
  AdoptionTierMeta,
  Booking,
  Cow,
  Donor,
  GaushalaEvent,
  GaushalaEventRsvp,
  Slot,
  TransparencyDoc,
  VisitService,
  Volunteer,
  VolunteerInterest,
  VolunteerShift,
} from '@/types'

/**
 * The five Gaushala programmes: adoption, visits, festivals, volunteering and
 * the transparency shelf.
 *
 * Kept out of `mock/gaushala.ts` so that file stays about the herd and the
 * sewa catalogue. Nothing here invents its own money: an adoption, a booking
 * and a paid festival registration are all bought through the ordinary cart,
 * so they land in the donations table like every other gift.
 */

/* ---------------------------------------------------------- adopt a cow */

export const ADOPTION_TIERS: AdoptionTierMeta[] = [
  {
    id: 'shared_monthly',
    label: 'Shared, monthly',
    blurb: 'A quarter of her keep each month, alongside three other families.',
    share: 0.25,
    interval: 'monthly',
  },
  {
    id: 'full_monthly',
    label: 'Full, monthly',
    blurb: 'Everything she needs for a month: feed, bedding, a caretaker and the vet.',
    share: 1,
    interval: 'monthly',
  },
  {
    id: 'shared_yearly',
    label: 'Shared, yearly',
    blurb: 'A quarter of her keep for a year, paid once.',
    share: 0.25,
    interval: 'yearly',
  },
  {
    id: 'full_yearly',
    label: 'Full, yearly',
    blurb: 'Her whole year, paid once. Eleven months at the monthly rate.',
    share: 1,
    interval: 'yearly',
  },
]

export const ADOPTION_TIER_LABEL: Record<AdoptionTier, string> = Object.fromEntries(
  ADOPTION_TIERS.map((t) => [t.id, t.label]),
) as Record<AdoptionTier, string>

/**
 * What a tier costs for one cow, from her own monthly care figure. A yearly
 * tier is charged eleven months rather than twelve, which is the discount for
 * paying once.
 */
export function adoptionPrice(cow: Pick<Cow, 'monthlyCare'>, tier: AdoptionTier): number {
  const meta = ADOPTION_TIERS.find((t) => t.id === tier)!
  const monthly = Math.round(cow.monthlyCare * meta.share)
  return meta.interval === 'yearly' ? monthly * 11 : monthly
}

/* ------------------------------------------------------------ visit & book */

export const VISIT_SERVICES: VisitService[] = [
  {
    id: 'vs-feeding',
    name: 'Cow Feeding',
    tamil: 'பசுவுக்கு தீவனம்',
    category: 'feeding',
    blurb: 'Hand-feed the herd green fodder at the morning or evening feed. The commonest reason people come.',
    durationMins: 45,
    pricePerPerson: 500,
    minPeople: 1,
    maxPeople: 8,
    needsApproval: false,
    active: true,
  },
  {
    id: 'vs-pooja',
    name: 'Go Pooja',
    tamil: 'கோ பூஜை',
    category: 'pooja',
    blurb: 'A full pooja performed for the herd in your name, with kumkum, garlands and the lamp.',
    durationMins: 60,
    pricePerPerson: 2100,
    minPeople: 1,
    maxPeople: 12,
    needsApproval: false,
    active: true,
  },
  {
    id: 'vs-darshan',
    name: 'Darshan & Cuddling',
    tamil: 'தரிசனம்',
    category: 'darshan',
    blurb: 'Simply sit with the cows. Free, and the calves are usually the ones who come to you.',
    durationMins: 30,
    pricePerPerson: 0,
    minPeople: 1,
    maxPeople: 6,
    needsApproval: false,
    active: true,
  },
  {
    id: 'vs-pitru',
    name: 'Pitru Paksha Feeding',
    tamil: 'பித்ரு பக்ஷ தீவனம்',
    category: 'pooja',
    blurb: 'Feeding performed in the name of your ancestors during the fortnight, with sankalpa.',
    durationMins: 60,
    pricePerPerson: 2500,
    minPeople: 1,
    maxPeople: 10,
    needsApproval: false,
    active: true,
  },
  {
    id: 'vs-tour',
    name: 'Guided Tour',
    category: 'tour',
    blurb: 'An hour with a caretaker: the sheds, the fodder store, the sick bay and how the money is spent.',
    durationMins: 60,
    pricePerPerson: 800,
    minPeople: 2,
    maxPeople: 20,
    needsApproval: false,
    active: true,
  },
  {
    id: 'vs-stay',
    name: 'Goshala Stay',
    category: 'stay',
    blurb: 'A night in the shelter guest room. Up at half past four for the first feed, if you want it.',
    durationMins: 960,
    pricePerPerson: 6500,
    minPeople: 1,
    maxPeople: 4,
    needsApproval: true,
    active: true,
  },
  {
    id: 'vs-school',
    name: 'School Visit',
    category: 'group',
    blurb: 'A class of children, a caretaker and a very patient cow. Booked with the school, not per head.',
    durationMins: 90,
    pricePerPerson: 200,
    minPeople: 10,
    maxPeople: 60,
    needsApproval: true,
    active: true,
  },
  {
    id: 'vs-corporate',
    name: 'Corporate & CSR Visit',
    category: 'group',
    blurb: 'A team morning at the shelter: feeding, a tour, and a briefing on where a CSR gift actually goes.',
    durationMins: 180,
    pricePerPerson: 1500,
    minPeople: 5,
    maxPeople: 40,
    needsApproval: true,
    active: true,
  },
]

export function visitServiceById(id: string): VisitService | undefined {
  return VISIT_SERVICES.find((s) => s.id === id)
}

/** The shelter is shut on Tuesdays. Everything else is bookable. */
export const CLOSED_WEEKDAY = 2

const SLOT_TIMES: { start: string; end: string }[] = [
  { start: '06:30', end: '07:30' },
  { start: '08:00', end: '09:00' },
  { start: '16:00', end: '17:00' },
  { start: '17:30', end: '18:30' },
]

/* ------------------------------------------------------------- volunteer */

export const VOLUNTEER_INTERESTS: { id: VolunteerInterest; label: string }[] = [
  { id: 'cow_care', label: 'Cow care & feeding' },
  { id: 'cleaning', label: 'Shed cleaning' },
  { id: 'vet_help', label: 'Veterinary help' },
  { id: 'fundraising', label: 'Fundraising' },
  { id: 'social_media', label: 'Social media' },
  { id: 'translation', label: 'Translation' },
  { id: 'design', label: 'Design & photography' },
]

export const VOLUNTEER_INTEREST_LABEL: Record<VolunteerInterest, string> = Object.fromEntries(
  VOLUNTEER_INTERESTS.map((i) => [i.id, i.label]),
) as Record<VolunteerInterest, string>

/* ------------------------------------------------------ the daily routine */

export const DAILY_ROUTINE: { time: string; what: string }[] = [
  { time: '04:45', what: 'Sheds opened, night caretaker counts the herd in.' },
  { time: '05:30', what: 'Green fodder cut and weighed for the morning feed.' },
  { time: '06:30', what: 'First feed. Visitors who have booked the morning slot join here.' },
  { time: '08:00', what: 'Milking, then sheds washed and bedding replaced.' },
  { time: '10:00', what: 'Vet round on Mondays and Thursdays; health records written up.' },
  { time: '12:30', what: 'Dry fodder and water topped up. The herd rests in the shade.' },
  { time: '16:00', what: 'Second feed, with khal and chokar mixed through the mash.' },
  { time: '18:00', what: 'Gud given to the old and the recovering animals.' },
  { time: '18:45', what: 'Evening count, sheds closed, sick bay checked last.' },
]

export const FEED_SCHEDULE: { item: string; perDay: string; note: string }[] = [
  { item: 'Green fodder', perDay: '450 kg', note: 'Cut fresh each morning, nine bundles.' },
  { item: 'Dry fodder', perDay: '280 kg', note: 'Straw and dried stalk, the base of every meal.' },
  { item: 'Khal (oil cake)', perDay: '40 kg', note: 'Protein, for milking and underweight animals.' },
  { item: 'Chokar (wheat bran)', perDay: '35 kg', note: 'Stirred through the evening mash.' },
  { item: 'Gud (jaggery)', perDay: '6 kg', note: 'For the old cows and anyone recovering.' },
  { item: 'Mineral mixture', perDay: '1.2 kg', note: 'Measured per animal against the vet schedule.' },
]

/* ------------------------------------------------------------------ seed */

export interface ProgramsSeed {
  adoptions: Adoption[]
  visitServices: VisitService[]
  slots: Slot[]
  bookings: Booking[]
  gaushalaEvents: GaushalaEvent[]
  eventRsvps: GaushalaEventRsvp[]
  volunteers: Volunteer[]
  volunteerShifts: VolunteerShift[]
  transparencyDocs: TransparencyDoc[]
}

const FESTIVALS: {
  name: string
  tamil?: string
  monthDay: [number, number]
  rituals: string[]
  summary: string
  image?: string
  completed?: boolean
}[] = [
  {
    name: 'Gopashtami',
    tamil: 'கோபாஷ்டமி',
    monthDay: [10, 8],
    rituals: ['Go pooja at first light', 'Horns painted and garlanded', 'Festival feed of gud and green fodder', 'Annadhanam for visitors'],
    summary: 'The day the herd is honoured. Every animal is washed, garlanded and fed by hand before the sun is properly up.',
    image: '/images/gopashtami.png',
  },
  {
    name: 'Govardhan Puja',
    monthDay: [10, 1],
    rituals: ['Govardhan hill of fodder built in the yard', 'Parikrama with the herd', 'Annakut offering'],
    summary: 'A hill of fodder is built in the yard and the herd walks around it. The oldest ritual we keep here.',
    image: '/images/Govardhan Puja.png',
    completed: true,
  },
  {
    name: 'Makar Sankranti Cow Pooja',
    tamil: 'மாட்டுப் பொங்கல்',
    monthDay: [0, 15],
    rituals: ['Horns painted and belled', 'Pongal cooked and offered', 'Procession through the village'],
    summary: 'Mattu Pongal. Bells, painted horns and not one animal willing to stand still for a photograph.',
    image: '/images/makar-sankranti.png',
  },
  {
    name: 'Mahashivratri Night Vigil',
    monthDay: [1, 26],
    rituals: ['Night-long bhajan beside the sheds', 'Abhishekam at midnight', 'Milk offering'],
    summary: 'The herd is quiet all night while the bhajan goes on beside the sheds. Visitors sit through till dawn.',
    image: '/images/Mahashivratri.png',
    completed: true,
  },
  {
    name: 'Pradosham Go Seva',
    monthDay: [5, 12],
    rituals: ['Evening lamp round', 'Feeding in the name of each sankalpa received'],
    summary: 'Held every Pradosham evening: a lamp round, then feeding in the name of everyone who asked for it.',
    image: '/images/Pradosham.png',
  },
]

export function makeProgramsSeed(now: Date, cows: Cow[], donors: Donor[]): ProgramsSeed {
  const rng = createRng(SEED + 41)
  const iso = (d: Date) => d.toISOString()
  const day = (d: Date) => format(d, 'yyyy-MM-dd')

  /* ---- adoptions ---- */
  const UPDATE_SPECS: { kind: 'photo' | 'health' | 'note'; title: string; body: string }[] = [
    { kind: 'photo', title: 'At the morning feed', body: 'She was first to the trough again. The caretaker says she waits by the gate from about ten past six.' },
    { kind: 'health', title: 'Quarterly check', body: 'Weight and condition scoring both within range. Hooves trimmed, no lameness found.' },
    { kind: 'photo', title: 'Under the neem tree', body: 'Where she spends every afternoon between the two feeds.' },
    { kind: 'health', title: 'Vaccination round', body: 'Foot-and-mouth booster given with the rest of the shed. Next one due in a year.' },
    { kind: 'note', title: 'A small thing', body: 'She has started following the fodder cart from the store to the shed. Nobody taught her that.' },
  ]

  const adoptable = cows.filter((c) => c.status !== 'deceased')
  const adoptions: Adoption[] = []
  const adoptedCows = adoptable.filter((c) => c.status === 'adopted')

  adoptedCows.forEach((cow, i) => {
    const tier = ADOPTION_TIERS[i % ADOPTION_TIERS.length]!
    const donor = donors[(i * 13) % donors.length]!
    const startedAt = subMonths(now, 3 + i * 2)
    const country = donor.city.includes('NJ') || donor.city.includes('CA') || donor.city.includes('TX') ? 'US' : 'IN'
    const currency = currencyForCountry(country)

    adoptions.push({
      id: `ADP-${String(i + 1).padStart(4, '0')}`,
      cowId: cow.id,
      adopterName: donor.name,
      adopterEmail: donor.email,
      tier: tier.id,
      amount: adoptionPrice(cow, tier.id),
      currency,
      startedAt: iso(startedAt),
      renewsAt: iso(addDays(now, 12 + i * 23)),
      status: 'active',
      certificateNo: `GAU-ADP-${String(now.getFullYear()).slice(2)}-${String(i + 1).padStart(4, '0')}`,
      updates: UPDATE_SPECS.slice(0, 3 + (i % 3)).map((u, n) => ({
        id: `upd-${i}-${n}`,
        at: iso(subDays(now, 12 + n * 30)),
        kind: u.kind,
        title: u.title,
        body: u.body,
        art: (i + n) % 6,
      })),
    })
  })

  // One that has lapsed, so the renewals screen has something to chase.
  if (adoptions[0]) {
    adoptions.push({
      ...adoptions[0],
      id: 'ADP-0090',
      cowId: adoptable[(adoptable.length - 2) % adoptable.length]!.id,
      adopterName: donors[7]?.name ?? 'Former adopter',
      adopterEmail: donors[7]?.email ?? 'lapsed@example.com',
      status: 'lapsed',
      renewsAt: iso(subDays(now, 9)),
      certificateNo: `GAU-ADP-${String(now.getFullYear()).slice(2)}-0090`,
    })
  }

  /* ---- slots for the next three weeks ---- */
  const slots: Slot[] = []
  let slotSeq = 1
  for (let d = 0; d < 21; d++) {
    const date = addDays(now, d)
    const closed = date.getDay() === CLOSED_WEEKDAY
    for (const service of VISIT_SERVICES.filter((s) => s.active)) {
      // A stay is one slot a day; everything else runs on the four feed times.
      const times = service.category === 'stay' ? SLOT_TIMES.slice(0, 1) : SLOT_TIMES
      for (const t of times) {
        // Group visits only run in the mornings, when the herd is out.
        if (service.category === 'group' && t.start > '12:00') continue

        const capacity = service.maxPeople
        slots.push({
          id: `SL-${String(slotSeq++).padStart(5, '0')}`,
          serviceId: service.id,
          date: day(date),
          startTime: t.start,
          endTime: t.end,
          capacity,
          booked: closed ? 0 : rng.int(0, Math.max(0, Math.floor(capacity * 0.6))),
          blackout: closed || undefined,
          blackoutReason: closed ? 'Closed on Tuesdays' : undefined,
        })
      }
    }
  }

  // A hand-set closure, so the console has a real blackout to show.
  const festivalClosure = day(addDays(now, 9))
  for (const slot of slots) {
    if (slot.date === festivalClosure) {
      slot.blackout = true
      slot.blackoutReason = 'Shelter closed for the annual shed repair'
      slot.booked = 0
    }
  }

  /* ---- bookings ---- */
  const bookings: Booking[] = []
  const bookableSlots = slots.filter((s) => !s.blackout)
  for (let i = 0; i < 26; i++) {
    const slot = bookableSlots[(i * 7) % bookableSlots.length]!
    const service = visitServiceById(slot.serviceId)!
    const donor = donors[(i * 17) % donors.length]!
    const people = Math.max(service.minPeople, Math.min(service.maxPeople, rng.int(service.minPeople, service.minPeople + 3)))
    const amount = service.pricePerPerson * people
    const country = donor.city.includes('NJ') || donor.city.includes('CA') ? 'US' : 'IN'
    const currency = currencyForCountry(country)

    // Older bookings have been and gone; a few are still to come.
    const past = new Date(slot.date) < now
    const status: Booking['status'] = service.needsApproval && i % 5 === 0
      ? 'pending'
      : past
        ? i % 6 === 0 ? 'no_show' : 'checked_in'
        : 'confirmed'

    bookings.push({
      id: `BK-${String(i + 1).padStart(5, '0')}`,
      slotId: slot.id,
      serviceId: service.id,
      name: donor.name,
      email: donor.email,
      phone: donor.phone,
      people,
      amount,
      currency,
      status,
      qrToken: `gau-visit-${slot.id}-${String(i + 1).padStart(5, '0')}`,
      consentAcceptedAt: status === 'pending' ? undefined : iso(subDays(now, 1)),
      bookedAt: iso(subDays(now, 1 + (i % 14))),
      checkedInAt: status === 'checked_in' ? iso(new Date(`${slot.date}T${slot.startTime}:00`)) : undefined,
      note: service.needsApproval ? `${donor.city} — group of ${people}` : undefined,
    })
  }

  /* ---- events ---- */
  const gaushalaEvents: GaushalaEvent[] = []
  const eventRsvps: GaushalaEventRsvp[] = []
  let rsvpSeq = 1

  FESTIVALS.forEach((fest, i) => {
    // Place each festival on its month-day, in whichever year keeps the
    // calendar straddling today: some already held, some still to come.
    let when = new Date(now.getFullYear(), fest.monthDay[0], fest.monthDay[1], 6, 30, 0, 0)
    if (fest.completed) {
      if (when.getTime() >= now.getTime()) {
        when = new Date(now.getFullYear() - 1, fest.monthDay[0], fest.monthDay[1], 6, 30, 0, 0)
      }
    } else {
      if (when.getTime() <= now.getTime()) {
        when = new Date(now.getFullYear() + 1, fest.monthDay[0], fest.monthDay[1], 6, 30, 0, 0)
      }
    }
    const upcoming = !fest.completed && when.getTime() > now.getTime()
    const isPaid = i % 3 === 1
    const capacity = 60 + i * 20
    const registered = upcoming ? rng.int(8, Math.floor(capacity * 0.7)) : rng.int(Math.floor(capacity * 0.6), capacity)

    const event: GaushalaEvent = {
      id: `GEV-${String(i + 1).padStart(4, '0')}`,
      name: fest.name,
      tamil: fest.tamil,
      startAt: iso(when),
      endAt: iso(new Date(when.getTime() + 4 * 3600_000)),
      venue: 'OMG Gaushala, Thiruparankundram Road, Madurai',
      summary: fest.summary,
      rituals: fest.rituals,
      status: upcoming ? 'published' : 'completed',
      isPaid,
      ticketPrice: isPaid ? 1100 : undefined,
      capacity,
      registered,
      livestreamUrl: i % 2 === 0 ? `https://live.omg.org/gaushala/${fest.name.toLowerCase().replace(/[^a-z]+/g, '-')}` : undefined,
      galleryArt: upcoming ? [] : [i % 6, (i + 2) % 6, (i + 4) % 6],
      image: fest.image,
    }
    gaushalaEvents.push(event)

    // A handful of named registrations behind the count, for the console.
    const shown = Math.min(6, registered)
    for (let n = 0; n < shown; n++) {
      const donor = donors[(i * 31 + n * 5) % donors.length]!
      const people = rng.int(1, 4)
      eventRsvps.push({
        id: `RSVP-${String(rsvpSeq++).padStart(5, '0')}`,
        eventId: event.id,
        name: donor.name,
        email: donor.email,
        people,
        amount: isPaid ? (event.ticketPrice ?? 0) * people : 0,
        currency: 'USD',
        status: upcoming ? 'going' : 'attended',
        qrToken: `gau-rsvp-${event.id}-${n + 1}`,
        rsvpAt: iso(subDays(when, 5 + n)),
      })
    }
  })

  gaushalaEvents.sort((a, b) => a.startAt.localeCompare(b.startAt))

  /* ---- volunteers ---- */
  const SKILLS = [
    'Large-animal handling, three years on a dairy farm',
    'Qualified vet nurse, available at weekends',
    'Photography and short-form video',
    'Tamil and English translation',
    'Bookkeeping and Excel',
    'Heavy lifting, fodder loading, own transport',
    'Graphic design, poster and leaflet work',
    'Teaching, used to running groups of children',
  ]
  const AVAIL = [
    'Saturday mornings',
    'Weekday evenings after six',
    'Every second Sunday',
    'Full days during college holidays',
    'Remote, a few hours a week',
    'Mondays and Thursdays, the vet round',
  ]
  const ORGS = ['Zoho Corporation', 'Madurai Medical College', 'TVS Credit', 'Velammal School', 'Infosys Madurai']

  const volunteers: Volunteer[] = []
  const volunteerShifts: VolunteerShift[] = []
  let shiftSeq = 1

  for (let i = 0; i < 18; i++) {
    const donor = donors[(i * 23) % donors.length]!
    const isGroup = i % 6 === 4
    const interests: VolunteerInterest[] = [
      VOLUNTEER_INTERESTS[i % VOLUNTEER_INTERESTS.length]!.id,
      VOLUNTEER_INTERESTS[(i + 3) % VOLUNTEER_INTERESTS.length]!.id,
    ]
    const status: Volunteer['status'] = i % 7 === 0 ? 'pending' : i % 11 === 5 ? 'rejected' : 'approved'
    const appliedAt = subDays(now, 3 + i * 11)

    const volunteer: Volunteer = {
      id: `VOL-${String(i + 1).padStart(4, '0')}`,
      name: donor.name,
      email: donor.email,
      phone: donor.phone,
      city: donor.city,
      skills: SKILLS[i % SKILLS.length]!,
      availability: AVAIL[i % AVAIL.length]!,
      interests,
      isGroup,
      groupSize: isGroup ? rng.int(8, 30) : undefined,
      organisation: isGroup ? ORGS[i % ORGS.length] : undefined,
      appliedAt: iso(appliedAt),
      status,
      reviewedBy: status === 'pending' ? undefined : 'u-gau-adm',
      reviewNote: status === 'rejected' ? 'No slots in that area at the moment. Asked to reapply after the monsoon.' : undefined,
      hours: 0,
    }

    if (status === 'approved') {
      const shiftCount = rng.int(1, 6)
      for (let n = 0; n < shiftCount; n++) {
        const hours = rng.int(2, 6)
        volunteerShifts.push({
          id: `VSH-${String(shiftSeq++).padStart(5, '0')}`,
          volunteerId: volunteer.id,
          date: day(subDays(now, 2 + n * 14 + i)),
          area: interests[n % interests.length]!,
          hours,
          loggedBy: 'u-gau-care',
        })
        volunteer.hours += hours
      }
      // Fifty hours earns a certificate.
      if (volunteer.hours >= 20) volunteer.certificateIssuedAt = iso(subDays(now, 5))
    }

    volunteers.push(volunteer)
  }

  volunteers.sort((a, b) => b.appliedAt.localeCompare(a.appliedAt))

  /* ---- transparency shelf ---- */
  const year = now.getFullYear()
  const transparencyDocs: TransparencyDoc[] = [
    { id: 'td-ar-25', title: `Annual Report ${year - 1}–${String(year).slice(2)}`, kind: 'annual_report', period: `FY ${year - 1}-${String(year).slice(2)}`, publishedAt: iso(subMonths(now, 4)), sizeKb: 2840, audited: true },
    { id: 'td-ar-24', title: `Annual Report ${year - 2}–${String(year - 1).slice(2)}`, kind: 'annual_report', period: `FY ${year - 2}-${String(year - 1).slice(2)}`, publishedAt: iso(subMonths(now, 16)), sizeKb: 2610, audited: true },
    { id: 'td-aa-25', title: `Audited Financial Statements ${year - 1}–${String(year).slice(2)}`, kind: 'audited_accounts', period: `FY ${year - 1}-${String(year).slice(2)}`, publishedAt: iso(subMonths(now, 4)), sizeKb: 1180, audited: true },
    { id: 'td-aa-24', title: `Audited Financial Statements ${year - 2}–${String(year - 1).slice(2)}`, kind: 'audited_accounts', period: `FY ${year - 2}-${String(year - 1).slice(2)}`, publishedAt: iso(subMonths(now, 16)), sizeKb: 1090, audited: true },
    { id: 'td-aa-26', title: `Audited Financial Statements ${year}–${String(year + 1).slice(2)}`, kind: 'audited_accounts', period: `FY ${year}-${String(year + 1).slice(2)}`, publishedAt: iso(subDays(now, 20)), sizeKb: 0, audited: false },
    { id: 'td-reg-trust', title: 'Trust Deed and Registration Certificate', kind: 'registration', period: 'Permanent', publishedAt: iso(subMonths(now, 40)), sizeKb: 640, audited: true },
    { id: 'td-reg-80g', title: '80G and FCRA Certificates', kind: 'registration', period: 'Permanent', publishedAt: iso(subMonths(now, 22)), sizeKb: 410, audited: true },
    { id: 'td-pol-refund', title: 'Refund and Cancellation Policy', kind: 'policy', period: 'Current', publishedAt: iso(subMonths(now, 6)), sizeKb: 120, audited: false },
    { id: 'td-pol-privacy', title: 'Privacy Policy and Data Handling', kind: 'policy', period: 'Current', publishedAt: iso(subMonths(now, 6)), sizeKb: 180, audited: false },
  ]

  return {
    adoptions,
    visitServices: VISIT_SERVICES.map((s) => ({ ...s })),
    slots,
    bookings,
    gaushalaEvents,
    eventRsvps,
    volunteers,
    volunteerShifts,
    transparencyDocs,
  }
}
