/** Single place for org-level settings. Switch currency/locale here. */

export const APP = {
  orgName: 'OMG Platform',
  tagline: 'Offerings, control and transparency',
  currency: 'USD',
  locale: 'en-US',
  /** Square-style processing fee on card-type methods. */
  fee: { percent: 0.026, fixedCents: 15 },
} as const

export type SectorId = 'temple' | 'sevalaya' | 'sangam'

export interface SectorMeta {
  id: SectorId
  name: string
  tamil: string
  blurb: string
  /** Tailwind token family used for this sector everywhere. */
  tone: 'kumkum' | 'tulsi' | 'peacock'
  chipClass: string
  dotClass: string
  barClass: string
  chartColor: string
}

export const SECTORS: Record<SectorId, SectorMeta> = {
  temple: {
    id: 'temple',
    name: 'Temple',
    tamil: 'கோவில்',
    blurb: 'Hundi, poojas, festivals and temple projects that preserve our heritage.',
    tone: 'kumkum',
    chipClass: 'bg-kumkum-50 text-kumkum-700 border-kumkum-100',
    dotClass: 'bg-kumkum-600',
    barClass: 'bg-kumkum-600',
    chartColor: '#9A1F18',
  },
  sevalaya: {
    id: 'sevalaya',
    name: 'Sevalaya',
    tamil: 'சேவாலயா',
    blurb: 'Annadhanam, education and welfare programmes for all.',
    tone: 'tulsi',
    chipClass: 'bg-tulsi-50 text-tulsi-700 border-tulsi-50',
    dotClass: 'bg-tulsi-500',
    barClass: 'bg-tulsi-500',
    chartColor: '#2E7D4F',
  },
  sangam: {
    id: 'sangam',
    name: 'Tamil Sangam',
    tamil: 'தமிழ்ச் சங்கம்',
    blurb: 'Memberships, cultural events, classes and community projects.',
    tone: 'peacock',
    chipClass: 'bg-peacock-50 text-peacock-700 border-peacock-50',
    dotClass: 'bg-peacock-500',
    barClass: 'bg-peacock-500',
    chartColor: '#1A6FA8',
  },
}

export const SECTOR_IDS: SectorId[] = ['temple', 'sevalaya', 'sangam']

/** The four phases of the money flow. Drives header chips and sidebar groups. */
export type Phase = 'onboard' | 'collect' | 'control' | 'spend' | 'report'

export interface PhaseMeta {
  id: Phase
  label: string
  meaning: string
  chipClass: string
  markerClass: string
  textClass: string
}

export const PHASES: Record<Phase, PhaseMeta> = {
  onboard: {
    id: 'onboard',
    label: 'Onboard',
    meaning: 'Setting up a customer',
    chipClass: 'bg-sandal-100 text-stone-700 border-sandal-300',
    markerClass: 'bg-stone-700',
    textClass: 'text-stone-700',
  },
  collect: {
    id: 'collect',
    label: 'Collect',
    meaning: 'Offerings coming in',
    chipClass: 'bg-turmeric-50 text-turmeric-700 border-turmeric-100',
    markerClass: 'bg-turmeric-500',
    textClass: 'text-turmeric-700',
  },
  control: {
    id: 'control',
    label: 'Control',
    meaning: 'CA authority, money control',
    chipClass: 'bg-kumkum-50 text-kumkum-700 border-kumkum-100',
    markerClass: 'bg-kumkum-600',
    textClass: 'text-kumkum-700',
  },
  spend: {
    id: 'spend',
    label: 'Spend',
    meaning: 'Money going to work',
    chipClass: 'bg-tulsi-50 text-tulsi-700 border-tulsi-50',
    markerClass: 'bg-tulsi-500',
    textClass: 'text-tulsi-700',
  },
  report: {
    id: 'report',
    label: 'Report',
    meaning: 'Clarity and transparency',
    chipClass: 'bg-peacock-50 text-peacock-700 border-peacock-50',
    markerClass: 'bg-peacock-500',
    textClass: 'text-peacock-700',
  },
}

/** Approval matrix — who may sign off, by value (cents). */
export interface ApprovalTier {
  maxCents: number
  roles: string[]
  label: string
}

export const APPROVAL_MATRIX: ApprovalTier[] = [
  { maxCents: 100_000, roles: ['ca_staff'], label: 'CA Staff' },
  { maxCents: 1_000_000, roles: ['ca_partner'], label: 'CA Partner' },
  { maxCents: Number.POSITIVE_INFINITY, roles: ['ca_partner', 'trustee'], label: 'CA Partner + Trustee' },
]

/**
 * Each customer (tenant) sets its own thresholds at onboarding. The active
 * tenant's values are applied here so every approval step uses them.
 */
export function applyThresholds(staffMax: number, partnerMax: number): void {
  APPROVAL_MATRIX[0]!.maxCents = staffMax
  APPROVAL_MATRIX[1]!.maxCents = partnerMax
}

/** Steps required for an amount, in order. */
export function requiredApprovals(amountCents: number): string[] {
  const tier = APPROVAL_MATRIX.find((t) => amountCents <= t.maxCents)
  return tier ? [...tier.roles] : ['ca_partner', 'trustee']
}

export function approvalTierLabel(amountCents: number): string {
  const tier = APPROVAL_MATRIX.find((t) => amountCents <= t.maxCents)
  return tier ? tier.label : 'CA Partner + Trustee'
}

/** 3-way match tolerance before a variance is flagged. */
export const MATCH_TOLERANCE = 0.02

/** A quote more than this far above the AI expected price raises an alert. */
export const PRICE_ALERT_THRESHOLD = 0.1

/** Minimum characters for an AI-override reason. */
export const OVERRIDE_REASON_MIN = 10

/**
 * Chart series colours. These are the sector tokens, with peacock nudged one
 * step bluer (#1A6FA8 rather than peacock-500 #1C6E8C) so tulsi green and
 * peacock blue stay apart for colour-blind readers. Chips, borders and dots
 * in the UI still use the peacock-500 token.
 *
 * Validated as a categorical set against the sandal-50 surface: lightness band,
 * chroma floor, CVD separation, normal-vision floor and contrast all pass.
 * Turmeric sits below 3:1 against the page, so anything drawn in it always
 * carries a visible label or a table view beside it.
 */
export const CHART = {
  temple: '#9A1F18',
  sevalaya: '#2E7D4F',
  sangam: '#1A6FA8',
  income: '#2E7D4F',
  outgo: '#9A1F18',
  accent: '#D4971A',
  grid: '#F2E4C9',
  axis: '#8A7062',
  surface: '#FFFBF4',
} as const

/** Fixed order for the donation-category series. Never cycled. */
export const CATEGORY_COLORS: Record<string, string> = {
  hundi: '#D4971A',
  pooja: '#9A1F18',
  event: '#6B4E9B',
  membership: '#8A7062',
  activity: '#2E7D4F',
  project: '#1A6FA8',
}

export const CATEGORY_LABEL: Record<string, string> = {
  hundi: 'Hundi',
  pooja: 'Pooja',
  event: 'Events',
  membership: 'Membership',
  activity: 'Activities',
  project: 'Projects',
}

/** Default tenant approval thresholds, in cents. */
export const DEFAULT_THRESHOLDS = { staffMax: 100_000, partnerMax: 1_000_000 } as const
