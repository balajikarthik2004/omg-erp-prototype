import type { Currency } from '@/lib/currency'
import type { Money } from './index'

/**
 * Gaushala (cow shelter) domain types.
 *
 * Money is integer cents in the settlement currency, like everywhere else in
 * the app. What a donor was *shown* travels separately on the order, so the
 * ledger never has to know about exchange rates.
 *
 * Phase 1 seeds and uses Cow, CowHealthRecord, SewaOrder, Rescue, GalleryItem,
 * GaushalaEntity and ReceiptTemplate. The rest are declared here so the model
 * is settled before Phase 2 builds on it.
 */

/* -------------------------------------------------------------------- cows */

export type CowKind = 'cow' | 'calf' | 'bull' | 'ox'
export type CowStatus = 'adoptable' | 'adopted' | 'sick' | 'recovering' | 'deceased'

export interface Cow {
  id: string
  name: string
  tamil?: string
  kind: CowKind
  breed: string
  gender: 'female' | 'male'
  /** Whole years at the time of seeding. Displayed, never used in arithmetic. */
  ageYears: number
  status: CowStatus
  story: string
  rescuedAt: string
  caretakerId: string
  /** Which drawn portrait this cow wears, so each one looks like itself. */
  portrait: number
  /** Photograph path in public/images/cows/ (e.g. /images/cows/Arasi.png). */
  image?: string
  /** Litres a day. Only meaningful for a milking cow. */
  milkYield?: number
  healthNote?: string
  /** Monthly care cost. The adoption tiers are derived from it. */
  monthlyCare: Money
  adoptedBy?: string
  adoptionEndsAt?: string
}

export type CowHealthKind = 'checkup' | 'vaccination' | 'treatment' | 'surgery' | 'deworming'

export interface CowHealthRecord {
  id: string
  cowId: string
  at: string
  kind: CowHealthKind
  note: string
  vet: string
  cost: Money
  /** Set when the next dose or review is due. */
  nextDueAt?: string
}

/* ------------------------------------------------------------------- sewas */

export type GaushalaSewaCategory =
  | 'fodder'
  | 'cow_care'
  | 'medical'
  | 'infrastructure'

export interface GaushalaSewaCategoryMeta {
  id: GaushalaSewaCategory
  label: string
  tamil: string
  blurb: string
}

/* ------------------------------------------------------------ sewa orders */

export type SewaOrderStatus = 'paid' | 'assigned' | 'completed' | 'cancelled'

export interface SankalpaDetails {
  name: string
  gotra?: string
  nakshatra?: string
  occasion?: string
  dedication?: string
  /** ISO country of the donor. Picks the receipt template. */
  donorCountry?: string
}

export interface ProofMedia {
  kind: 'photo' | 'video'
  caption: string
  at: string
  /** Drawn placeholder index. A real build stores a CDN key here. */
  art: number
}

export interface SewaOrder {
  id: string
  sewaId: string
  donationId?: string
  donorName: string
  amount: Money
  /** What the donor was shown at checkout, and the rate that was used. */
  currency: Currency
  fxRate: number
  status: SewaOrderStatus
  placedAt: string
  serviceDate?: string
  sankalpa?: SankalpaDetails
  assignedTo?: string
  assignedAt?: string
  completedAt?: string
  proofMedia?: ProofMedia[]
  cowId?: string
  tenantId?: string
}

/* ---------------------------------------------------------------- rescues */

export interface Rescue {
  id: string
  cowId?: string
  title: string
  tamil?: string
  rescuedAt: string
  place: string
  condition: string
  treatment: string
  status: 'under_treatment' | 'recovering' | 'recovered'
  /** Treatment cost, in settlement cents. */
  treatmentGoal: Money
  treatmentRaised: Money
  beforeArt: number
  afterArt: number
}

/* ---------------------------------------------------------------- gallery */

export type GalleryCategory = 'daily_life' | 'rescue' | 'festival' | 'seva' | 'shelter'

export interface GalleryItem {
  id: string
  title: string
  category: GalleryCategory
  kind: 'photo' | 'video'
  at: string
  caption: string
  art: number
}

/* ------------------------------------------------- entity & receipt rules */

/**
 * The legal entity a gift is made to. The country is deliberately not assumed
 * anywhere in the code: it decides the gateway, the receipt wording and which
 * tax fields a receipt must carry.
 */
export interface GaushalaEntity {
  id: string
  name: string
  country: string
  /** What this entity keeps its books in. */
  settlementCurrency: Currency
  gateways: ('stripe' | 'paypal' | 'razorpay' | 'payu')[]
  registrationNumbers: { label: string; value: string }[]
  address: string
  isDefault?: boolean
}

export interface ReceiptTemplate {
  id: string
  name: string
  entityId: string
  /** Donor countries this template serves. '*' is the fallback. */
  donorCountries: string[]
  /** The deductibility sentence printed on the receipt. */
  declaration: string
  /** Identity fields the receipt must carry, e.g. EIN, 80G number. */
  fields: { label: string; value: string }[]
  /** Whether the donor's own tax id is asked for and printed. */
  collectsDonorTaxId: boolean
  /** Flagged until an accountant for that country has signed the wording off. */
  reviewed: boolean
}

/* ---------------------------------------------------------- adopt a cow */

export type AdoptionTier = 'full_monthly' | 'full_yearly' | 'shared_monthly' | 'shared_yearly'

export interface AdoptionTierMeta {
  id: AdoptionTier
  label: string
  blurb: string
  /** Share of the cow's monthly care this tier covers. */
  share: number
  interval: 'monthly' | 'yearly'
}

/** A photo or health note sent to an adopter. */
export interface AdopterUpdate {
  id: string
  at: string
  kind: 'photo' | 'health' | 'note'
  title: string
  body: string
  art: number
}

export interface Adoption {
  id: string
  cowId: string
  adopterName: string
  adopterEmail: string
  tier: AdoptionTier
  /** Settlement cents charged each interval. */
  amount: Money
  currency: Currency
  startedAt: string
  renewsAt: string
  status: 'active' | 'lapsed' | 'cancelled'
  certificateNo: string
  /** The donation that paid for the current period. */
  donationId?: string
  updates: AdopterUpdate[]
  tenantId?: string
}

/* ------------------------------------------------------------ visit & book */

export type VisitCategory = 'feeding' | 'pooja' | 'darshan' | 'tour' | 'stay' | 'group'

export interface VisitService {
  id: string
  name: string
  tamil?: string
  category: VisitCategory
  blurb: string
  /** How long a booked slot runs. */
  durationMins: number
  /** Settlement cents, per person. Zero means a free darshan. */
  pricePerPerson: Money
  minPeople: number
  maxPeople: number
  /** A school or corporate visit is confirmed by hand, not automatically. */
  needsApproval: boolean
  active: boolean
  image?: string
}

export interface Slot {
  id: string
  serviceId: string
  /** yyyy-MM-dd in the shelter's own local time. */
  date: string
  startTime: string
  endTime: string
  capacity: number
  booked: number
  /** A closed day: Tuesdays, and whatever the shelter blacks out by hand. */
  blackout?: boolean
  blackoutReason?: string
}

export type BookingStatus = 'pending' | 'confirmed' | 'checked_in' | 'cancelled' | 'no_show'

export interface Booking {
  id: string
  slotId: string
  serviceId: string
  name: string
  email: string
  phone: string
  people: number
  amount: Money
  currency: Currency
  status: BookingStatus
  /** Signed, so a screenshot of someone else's code does not get you in. */
  qrToken: string
  /** The waiver has to be accepted before the visit, and we record when. */
  consentAcceptedAt?: string
  bookedAt: string
  checkedInAt?: string
  note?: string
  donationId?: string
  tenantId?: string
}

/* ----------------------------------------------------------------- events */

export type GaushalaEventStatus = 'draft' | 'published' | 'live' | 'completed' | 'cancelled'

/**
 * A festival on the Gaushala calendar.
 *
 * Deliberately lighter than the ERP `EventRecord`: this is a date, a ritual
 * list and an RSVP, with no budget, poster or approval gates behind it. A
 * festival that needs money voted for it is raised in the Events module
 * instead, and the console says so.
 */
export interface GaushalaEvent {
  id: string
  name: string
  tamil?: string
  /** Stored UTC. Always displayed in the viewer's own zone. */
  startAt: string
  endAt: string
  venue: string
  summary: string
  rituals: string[]
  status: GaushalaEventStatus
  isPaid: boolean
  /** Settlement cents per head, when it is a paid registration. */
  ticketPrice?: Money
  capacity?: number
  registered: number
  livestreamUrl?: string
  /** Pictures from the last time it was held. */
  galleryArt: number[]
  tenantId?: string
  image?: string
}

export interface GaushalaEventRsvp {
  id: string
  eventId: string
  name: string
  email: string
  people: number
  amount: Money
  currency: Currency
  status: 'going' | 'cancelled' | 'attended'
  qrToken: string
  rsvpAt: string
  donationId?: string
}

/* -------------------------------------------------------------- volunteer */

export type VolunteerInterest =
  | 'cow_care'
  | 'cleaning'
  | 'fundraising'
  | 'social_media'
  | 'vet_help'
  | 'translation'
  | 'design'

export interface Volunteer {
  id: string
  name: string
  email: string
  phone: string
  city: string
  skills: string
  availability: string
  interests: VolunteerInterest[]
  /** A company or a college sending a group, rather than one person. */
  isGroup: boolean
  groupSize?: number
  organisation?: string
  appliedAt: string
  status: 'pending' | 'approved' | 'rejected'
  reviewedBy?: string
  reviewNote?: string
  /** Hours logged across approved shifts. Derived, but stored for the list. */
  hours: number
  certificateIssuedAt?: string
}

export interface VolunteerShift {
  id: string
  volunteerId: string
  date: string
  area: VolunteerInterest
  hours: number
  note?: string
  loggedBy: string
}

/* ----------------------------------------------------------- transparency */

export type TransparencyDocKind = 'annual_report' | 'audited_accounts' | 'registration' | 'policy'

export interface TransparencyDoc {
  id: string
  title: string
  kind: TransparencyDocKind
  /** FY 2025-26, or a calendar year. */
  period: string
  publishedAt: string
  sizeKb: number
  /** Set once the auditor has signed it off. */
  audited: boolean
}

export interface GaushalaExpense {
  id: string
  /** yyyy-MM */
  month: string
  category: string
  amount: Money
  note?: string
}

/* ------------------------------------------------------- still to be built */

export interface GauDaanRequest {
  id: string
  donorName: string
  phone: string
  email: string
  cowCount: number
  cowDetails: string
  place: string
  requestedAt: string
  status: 'pending' | 'verified' | 'approved' | 'rejected'
  reviewedBy?: string
  reviewNote?: string
}

export interface GaushalaSubscription {
  id: string
  donorId: string
  donorName: string
  sewaId: string
  interval: 'daily' | 'monthly' | 'yearly'
  amount: Money
  currency: Currency
  gateway: string
  gatewaySubscriptionId: string
  nextBillingDate: string
  status: 'active' | 'past_due' | 'cancelled'
}

/* ------------------------------------------------------- the data bundle */

export interface GaushalaData {
  cows: Cow[]
  cowHealth: CowHealthRecord[]
  sewaOrders: SewaOrder[]
  rescues: Rescue[]
  gaushalaGallery: GalleryItem[]
  gaushalaEntities: GaushalaEntity[]
  receiptTemplates: ReceiptTemplate[]
  gaushalaExpenses: GaushalaExpense[]

  /* the five programmes */
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
