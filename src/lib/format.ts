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
 * The name to greet someone by. "R. Balasubramanian" should greet as
 * "Balasubramanian", not "R." — so an initial is skipped.
 */
export function greetingName(fullName: string): string {
  const parts = fullName.split(/\s+/).filter(Boolean)
  const first = parts.find((part) => part.replace(/\./g, '').length > 1)
  return first ?? parts[0] ?? ''
}
