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
  | 'general'
  | 'occasion'

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

/* ------------------------------------------- declared now, built in Phase 2 */

export type AdoptionTier = 'full_monthly' | 'full_yearly' | 'shared_monthly' | 'shared_yearly'

export interface Adoption {
  id: string
  cowId: string
  adopterId: string
  adopterName: string
  tier: AdoptionTier
  amount: Money
  currency: Currency
  startedAt: string
  renewsAt: string
  status: 'active' | 'lapsed' | 'cancelled'
  certificateNo: string
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

export interface Slot {
  id: string
  serviceId: string
  date: string
  startTime: string
  endTime: string
  capacity: number
  booked: number
  blackout?: boolean
}

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
  status: 'pending' | 'confirmed' | 'checked_in' | 'cancelled'
  qrToken: string
  consentAcceptedAt?: string
  bookedAt: string
}

export interface Volunteer {
  id: string
  name: string
  email: string
  phone: string
  skills: string[]
  availability: string
  interests: string[]
  isGroup: boolean
  appliedAt: string
  status: 'pending' | 'approved' | 'rejected'
  hours: number
}

export interface GaushalaExpense {
  id: string
  /** yyyy-MM */
  month: string
  category: string
  amount: Money
  note?: string
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
}
