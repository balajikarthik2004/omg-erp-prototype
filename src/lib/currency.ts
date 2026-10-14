/**
 * Multi-currency display.
 *
 * The books settle in one currency — the legal entity's own, `APP.currency`.
 * A donor in Chennai or London is *shown* their own money, and what they saw
 * is stored on the donation alongside the settled amount and the rate used.
 * That is how a real gateway behaves: present local, settle home. Nothing
 * here ever converts a ledger figure.
 */

import { APP } from '@/config'

export type Currency = 'USD' | 'INR' | 'GBP' | 'EUR' | 'CAD' | 'AUD' | 'SGD' | 'MYR'

export interface CurrencyMeta {
  code: Currency
  label: string
  locale: string
  /** Units of this currency per 1 unit of the settlement currency. */
  perSettlementUnit: number
}

/**
 * A fixed demo rate table. A real build reads the day's rate from the gateway
 * and stores it on the donation, which is why `fxRate` is a stored field and
 * never recomputed at display time.
 */
export const CURRENCIES: Record<Currency, CurrencyMeta> = {
  USD: { code: 'USD', label: 'US Dollar', locale: 'en-US', perSettlementUnit: 1 },
  INR: { code: 'INR', label: 'Indian Rupee', locale: 'en-IN', perSettlementUnit: 88.4 },
  GBP: { code: 'GBP', label: 'Pound Sterling', locale: 'en-GB', perSettlementUnit: 0.79 },
  EUR: { code: 'EUR', label: 'Euro', locale: 'en-IE', perSettlementUnit: 0.92 },
  CAD: { code: 'CAD', label: 'Canadian Dollar', locale: 'en-CA', perSettlementUnit: 1.37 },
  AUD: { code: 'AUD', label: 'Australian Dollar', locale: 'en-AU', perSettlementUnit: 1.52 },
  SGD: { code: 'SGD', label: 'Singapore Dollar', locale: 'en-SG', perSettlementUnit: 1.34 },
  MYR: { code: 'MYR', label: 'Malaysian Ringgit', locale: 'en-MY', perSettlementUnit: 4.45 },
}

export const CURRENCY_CODES = Object.keys(CURRENCIES) as Currency[]

/** What the ledger is kept in. Every stored amount in cents is this currency. */
export const SETTLEMENT_CURRENCY = APP.currency as Currency

/** Which currency a donor in this country is shown by default. */
const BY_COUNTRY: Record<string, Currency> = {
  US: 'USD', IN: 'INR', GB: 'GBP', CA: 'CAD', AU: 'AUD', SG: 'SGD', MY: 'MYR',
  IE: 'EUR', DE: 'EUR', FR: 'EUR', NL: 'EUR', ES: 'EUR', IT: 'EUR',
}

export function currencyForCountry(country: string | undefined): Currency {
  if (!country) return SETTLEMENT_CURRENCY
  return BY_COUNTRY[country.toUpperCase()] ?? SETTLEMENT_CURRENCY
}

/**
 * The viewer's country, from the browser's own locale. Best-effort and always
 * overridable — the switcher on the page is the authority, not this guess.
 */
export function detectCountry(): string {
  if (typeof navigator === 'undefined') return 'US'
  const tags = [navigator.language, ...(navigator.languages ?? [])]
  for (const tag of tags) {
    const region = tag?.split('-')[1]
    if (region && region.length === 2) return region.toUpperCase()
  }
  return 'US'
}

export function detectTimeZone(): string {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC'
  } catch {
    return 'UTC'
  }
}

/** Settlement cents -> cents in `to`, at the stored rate. */
export function convert(settlementCents: number, to: Currency): number {
  return Math.round(settlementCents * CURRENCIES[to].perSettlementUnit)
}

/** The rate to store on a donation presented in `currency`. */
export function fxRate(currency: Currency): number {
  return CURRENCIES[currency].perSettlementUnit
}

const formatters = new Map<Currency, Intl.NumberFormat>()

function formatterFor(currency: Currency): Intl.NumberFormat {
  let fmt = formatters.get(currency)
  if (!fmt) {
    const meta = CURRENCIES[currency]
    fmt = new Intl.NumberFormat(meta.locale, {
      style: 'currency',
      currency,
      // Rupees and yen-like amounts read better whole at these sizes.
      minimumFractionDigits: currency === 'INR' ? 0 : 2,
      maximumFractionDigits: currency === 'INR' ? 0 : 2,
    })
    formatters.set(currency, fmt)
  }
  return fmt
}

/** Cents already in `currency` -> "₹9,724" / "£87.00". */
export function formatIn(cents: number, currency: Currency): string {
  return formatterFor(currency).format(cents / 100)
}

/**
 * Settlement cents shown in the viewer's currency. An explicit per-currency
 * price always wins over the converted one, so a sewa that is priced at a
 * round ₹500 never shows as ₹486.
 */
export function displayPrice(
  settlementCents: number,
  currency: Currency,
  explicit?: Partial<Record<Currency, number>>,
): string {
  const fixed = explicit?.[currency]
  return formatIn(fixed ?? convert(settlementCents, currency), currency)
}
