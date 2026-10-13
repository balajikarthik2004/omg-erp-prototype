import { formatMoney } from '@/lib/format'
import type { HistoryPoint, Money } from '@/types'

/**
 * Budget suggestion: numbers by formula, words by plain templates (an AI only
 * ever writes the reason line, never the amount). Ported from the Events service.
 *
 *   growth    = average year-on-year change over the last 3 years, clamped to 0%..15%
 *               (one year of history uses a default, 10% for Navaratri, otherwise 8%)
 *   suggested = last year's actual x (1 + growth), rounded to the nearest $10
 *   no history -> no suggestion
 */

export interface SuggestionConfig {
  defaultSingleYearGrowth: number
  minGrowth: number
  maxGrowth: number
  /** Rounding step in cents. */
  roundTo: number
}

export const DEFAULT_SUGGESTION: SuggestionConfig = {
  defaultSingleYearGrowth: 0.08,
  minGrowth: 0,
  maxGrowth: 0.15,
  roundTo: 1000,
}

export function growthDefaultFor(eventType: string): number {
  return eventType === 'NAVARATRI' ? 0.1 : DEFAULT_SUGGESTION.defaultSingleYearGrowth
}

export interface Suggestion {
  category: string
  history: HistoryPoint[]
  suggested: Money | null
  growth: number | null
  note: string
}

const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(max, value))

export function roundToNearest(amount: number, step: number): number {
  return Math.round(amount / step) * step
}

function effectiveGrowth(history: HistoryPoint[], cfg: SuggestionConfig): number | null {
  if (history.length === 0) return null
  if (history.length === 1) return clamp(cfg.defaultSingleYearGrowth, cfg.minGrowth, cfg.maxGrowth)

  const rates: number[] = []
  for (let i = 1; i < history.length; i++) {
    const prev = history[i - 1]!.actual
    if (prev > 0) rates.push((history[i]!.actual - prev) / prev)
  }
  if (rates.length === 0) return cfg.defaultSingleYearGrowth
  return clamp(rates.reduce((s, r) => s + r, 0) / rates.length, cfg.minGrowth, cfg.maxGrowth)
}

export function suggestForCategory(
  category: string,
  rawHistory: HistoryPoint[],
  options: Partial<SuggestionConfig> = {},
): Suggestion {
  const cfg = { ...DEFAULT_SUGGESTION, ...options }
  const history = [...rawHistory].sort((a, b) => a.year - b.year).slice(-3)
  if (history.length === 0) {
    return { category, history: [], suggested: null, growth: null, note: 'No past events of this kind. Enter the amount yourself.' }
  }

  const growth = effectiveGrowth(history, cfg)!
  const last = history[history.length - 1]!
  const suggested = roundToNearest(last.actual * (1 + growth), cfg.roundTo)
  const pct = (growth * 100).toFixed(1).replace(/\.0$/, '')
  const note =
    history.length === 1
      ? `${formatMoney(last.actual)} spent in ${last.year}, plus the standard ${pct}% growth.`
      : `${history.length} years of actuals, ${formatMoney(last.actual)} in ${last.year}, with ${pct}% average yearly growth.`
  return { category, history, suggested, growth, note }
}

/** Default cost categories for an event, by sector. */
export const DEFAULT_CATEGORIES: Record<string, string[]> = {
  temple: [
    'Prasadam & Annadhanam',
    'Decoration & Stage',
    'Sound & Light',
    'Flowers & Garlands',
    'Priests & Archakas Dakshina',
    'Printing & Notices',
  ],
  sevalaya: ['Food & Provisions', 'Education Kits', 'Logistics & Travel', 'Stationery & Printing'],
  sangam: ['Hall & venue', 'Catering & refreshments', 'Stage, decor & illumination', 'Printing & promotional materials', 'Audio & photography'],
}
