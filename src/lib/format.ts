import { format, formatDistanceToNowStrict, parseISO } from 'date-fns'
import { APP } from '@/config'

/**
 * Money shows either no decimals or two — never one. Whole amounts read as
 * "$12,450" rather than "$12,450.00", since the trailing zeros are noise on a
 * page of round offerings, but cents are never dropped: a 2.6% + $0.15
 * gateway fee still shows as "$2.76", so a column still sums to the ledger.
 *
 * Two formatters rather than one, because a single `minimumFractionDigits: 0,
 * maximumFractionDigits: 2` formatter renders $100.50 as "$100.5".
 */
const moneyWhole = new Intl.NumberFormat(APP.locale, {
  style: 'currency',
  currency: APP.currency,
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
})

const moneyFmt = new Intl.NumberFormat(APP.locale, {
  style: 'currency',
  currency: APP.currency,
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
})

const compactFmt = new Intl.NumberFormat(APP.locale, {
  style: 'currency',
  currency: APP.currency,
  notation: 'compact',
  maximumFractionDigits: 1,
})

/** cents -> "$12,450" / "$12,450.75" */
export function formatMoney(cents: number): string {
  const whole = Math.round(cents)
  return (whole % 100 === 0 ? moneyWhole : moneyFmt).format(whole / 100)
}

/** cents -> "$12.5K", for chart axes and tight KPI space. */
export function formatMoneyCompact(cents: number): string {
  return compactFmt.format(cents / 100)
}

/**
 * The point at which a figure is shortened: $1,000. Below it, compact notation
 * has nothing to shorten ("$999" either way) and would round cents away
 * ("$2.76" -> "$2.8"), so the threshold is where K actually starts.
 */
export const COMPACT_FROM = 100_000 // cents

/**
 * The console default: "$940" and "$2.76" in full, "$12.5K" and "$1.2M" once
 * a figure gets long. The string twin of `<Money>`, for the places that need
 * text rather than an element — chart labels, select options, aria text.
 * Where the exact digits are what someone acts on, use formatMoney.
 */
export function formatMoneyShort(cents: number): string {
  return Math.abs(cents) >= COMPACT_FROM ? formatMoneyCompact(cents) : formatMoney(cents)
}

export function formatNumber(value: number, digits = 0): string {
  return new Intl.NumberFormat(APP.locale, {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  }).format(value)
}

export function formatPct(value: number, digits = 1): string {
  return `${value.toFixed(digits)}%`
}

function toDate(value: string | Date): Date {
  return typeof value === 'string' ? parseISO(value) : value
}

/** "08 Oct 2026" — tables and lists. */
export function formatDate(value: string | Date): string {
  return format(toDate(value), 'dd MMM yyyy')
}

/** "Wed, 8 Oct 2026 · 7:42 PM" — detail views. */
export function formatDateTime(value: string | Date): string {
  return format(toDate(value), "EEE, d MMM yyyy '·' h:mm a")
}

/** "Oct 2026" — chart axes and periods. */
export function formatMonth(value: string | Date): string {
  return format(toDate(value), 'MMM yyyy')
}

export function formatShortMonth(value: string | Date): string {
  return format(toDate(value), 'MMM')
}

/** "3 days ago" */
export function formatAge(value: string | Date): string {
  return `${formatDistanceToNowStrict(toDate(value))} ago`
}

/** "in 2 days" / "4 days overdue" */
export function formatDue(value: string | Date): { label: string; overdue: boolean } {
  const date = toDate(value)
  const overdue = date.getTime() < Date.now()
  const distance = formatDistanceToNowStrict(date)
  return { label: overdue ? `${distance} overdue` : `due in ${distance}`, overdue }
}

export function initials(name: string): string {
  return name
    .replace(/[^\p{L}\s]/gu, '')
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]!.toUpperCase())
    .join('')
}

export function titleCase(value: string): string {
  return value
    .replace(/[_-]+/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase())
}

/**
 * The name to greet someone by. "R. Perumal" should greet as
 * "Perumal", not "R." — so an initial is skipped.
 */
export function greetingName(fullName: string): string {
  const parts = fullName.split(/\s+/).filter(Boolean)
  const first = parts.find((part) => part.replace(/\./g, '').length > 1)
  return first ?? parts[0] ?? ''
}

/* ---------------------------------------------------------------------------
   Amount in words.

   A real donation receipt spells the total out underneath the figure: it is
   what makes a receipt hard to alter after the fact, and every printed temple
   or trust receipt carries the line. Kept here beside formatMoney so both
   read the same currency out of config.
   ------------------------------------------------------------------------ */

const ONES = [
  'zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten',
  'eleven', 'twelve', 'thirteen', 'fourteen', 'fifteen', 'sixteen', 'seventeen', 'eighteen', 'nineteen',
]
const TENS = ['', '', 'twenty', 'thirty', 'forty', 'fifty', 'sixty', 'seventy', 'eighty', 'ninety']
const SCALES: [number, string][] = [
  [1_000_000_000, 'billion'],
  [1_000_000, 'million'],
  [1_000, 'thousand'],
]

/** The minor and major unit names, by currency. */
const UNITS: Record<string, [string, string, string, string]> = {
  USD: ['dollar', 'dollars', 'cent', 'cents'],
  INR: ['rupee', 'rupees', 'paisa', 'paise'],
  GBP: ['pound', 'pounds', 'penny', 'pence'],
  EUR: ['euro', 'euros', 'cent', 'cents'],
}

function spell(n: number): string {
  if (n < 20) return ONES[n]!
  if (n < 100) {
    const rest = n % 10
    return TENS[Math.floor(n / 10)]! + (rest ? `-${ONES[rest]}` : '')
  }
  if (n < 1000) {
    const rest = n % 100
    return `${ONES[Math.floor(n / 100)]} hundred` + (rest ? ` and ${spell(rest)}` : '')
  }
  for (const [value, name] of SCALES) {
    if (n >= value) {
      const rest = n % value
      if (!rest) return `${spell(Math.floor(n / value))} ${name}`
      // "One thousand and one", never "One thousand one": a remainder under a
      // hundred takes the conjunction, exactly as it is written out by hand.
      const join = rest < 100 ? ' and ' : ' '
      return `${spell(Math.floor(n / value))} ${name}${join}${spell(rest)}`
    }
  }
  return ONES[0]!
}

/** cents -> "Two thousand three hundred and fifty dollars only" */
export function amountInWords(cents: number): string {
  const [one, many, minorOne, minorMany] = UNITS[APP.currency] ?? UNITS.USD!
  const total = Math.abs(Math.round(cents))
  const major = Math.floor(total / 100)
  const minor = total % 100

  const parts = [`${spell(major)} ${major === 1 ? one : many}`]
  if (minor > 0) parts.push(`${spell(minor)} ${minor === 1 ? minorOne : minorMany}`)

  const words = parts.join(' and ') + ' only'
  return words.charAt(0).toUpperCase() + words.slice(1)
}
