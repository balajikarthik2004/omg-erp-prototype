import { differenceInDays } from 'date-fns'

import type { Supplier } from '@/types'

export interface SupplierScore {
  supplier: Supplier
  rank: number
  score: number
  /** Weighted-average unit price over the last 90 days, adjusted for trend. */
  expectedPrice: number
  lastPaidPrice: number
  /** Percentage change over the last three months. */
  trendPct: number
  /** Price points over the window, oldest first, for the sparkline. */
  trendPoints: number[]
  priceScore: number
  qualityScore: number
  onTimeScore: number
  trendScore: number
  recencyScore: number
  /** One line, built from whichever factors are actually strongest. */
  why: string
}

const WEIGHTS = {
  price: 0.35,
  quality: 0.3,
  onTime: 0.2,
  trend: 0.1,
  recency: 0.05,
}

function median(values: number[]): number {
  if (values.length === 0) return 0
  const sorted = [...values].sort((a, b) => a - b)
  const mid = Math.floor(sorted.length / 2)
  return sorted.length % 2 === 0 ? Math.round((sorted[mid - 1]! + sorted[mid]!) / 2) : sorted[mid]!
}

function clamp(value: number, min = 0, max = 100): number {
  return Math.max(min, Math.min(max, value))
}

/**
 * Ranks the suppliers who carry an item.
 *
 *   score = 0.35·price + 0.30·quality + 0.20·onTime + 0.10·trend + 0.05·recency
 *
 * Each component is 0–100. Pure function: same inputs, same ranking.
 */
export function scoreSuppliers(
  suppliers: Supplier[],
  itemId: string,
  now = new Date(),
): SupplierScore[] {
  const candidates = suppliers.filter((s) => s.status === 'active' && s.items.includes(itemId))
  if (candidates.length === 0) return []

  const rows = candidates.map((supplier) => {
    const history = supplier.priceHistory
      .filter((p) => p.itemId === itemId)
      .sort((a, b) => a.date.localeCompare(b.date))

    const recent = history.filter((p) => differenceInDays(now, new Date(p.date)) <= 90)
    const window = recent.length > 0 ? recent : history.slice(-6)

    // Weighted average: the newer the quote, the more it counts.
    let weightedSum = 0
    let weightTotal = 0
    window.forEach((point, i) => {
      const weight = i + 1
      weightedSum += point.unitPrice * weight
      weightTotal += weight
    })
    const average = weightTotal > 0 ? weightedSum / weightTotal : 0

    // Three-month trend.
    const older = history.filter((p) => {
      const age = differenceInDays(now, new Date(p.date))
      return age > 90 && age <= 180
    })
    const olderMedian = median(older.map((p) => p.unitPrice))
    const recentMedian = median(window.map((p) => p.unitPrice))
    const trendPct = olderMedian > 0 ? ((recentMedian - olderMedian) / olderMedian) * 100 : 0

    const expectedPrice = Math.round(average * (1 + (trendPct / 100) * 0.5))
    const lastPaidPrice = history.at(-1)?.unitPrice ?? expectedPrice
    const daysSinceQuote = history.at(-1) ? differenceInDays(now, new Date(history.at(-1)!.date)) : 365

    return {
      supplier,
      history,
      expectedPrice,
      lastPaidPrice,
      trendPct,
      daysSinceQuote,
      trendPoints: window.map((p) => p.unitPrice),
    }
  })

  const marketMedian = median(rows.map((r) => r.expectedPrice))
  const cheapest = Math.min(...rows.map((r) => r.expectedPrice))
  const dearest = Math.max(...rows.map((r) => r.expectedPrice))
  const spread = Math.max(1, dearest - cheapest)

  const scored: SupplierScore[] = rows.map((row) => {
    // Cheapest scores 100, dearest 0.
    const priceScore = clamp(((dearest - row.expectedPrice) / spread) * 100)
    // Rating out of 5, less a penalty for rejections.
    const qualityScore = clamp((row.supplier.rating / 5) * 100 - row.supplier.rejectionPct * 4)
    const onTimeScore = clamp(row.supplier.onTimePct)
    // Falling prices are good; rising prices are not.
    const trendScore = clamp(50 - row.trendPct * 4)
    const recencyScore = clamp(100 - row.daysSinceQuote * 1.2)

    const score =
      WEIGHTS.price * priceScore +
      WEIGHTS.quality * qualityScore +
      WEIGHTS.onTime * onTimeScore +
      WEIGHTS.trend * trendScore +
      WEIGHTS.recency * recencyScore

    return {
      supplier: row.supplier,
      rank: 0,
      score,
      expectedPrice: row.expectedPrice,
      lastPaidPrice: row.lastPaidPrice,
      trendPct: row.trendPct,
      trendPoints: row.trendPoints,
      priceScore,
      qualityScore,
      onTimeScore,
      trendScore,
      recencyScore,
      why: explain(row.supplier, row.expectedPrice, marketMedian, priceScore, qualityScore, onTimeScore, row.trendPct),
    }
  })

  return scored
    .sort((a, b) => b.score - a.score)
    .map((row, i) => ({ ...row, rank: i + 1 }))
}

/** Builds the "why this pick" line from whichever factors actually stand out. */
function explain(
  supplier: Supplier,
  expectedPrice: number,
  marketMedian: number,
  priceScore: number,
  qualityScore: number,
  onTimeScore: number,
  trendPct: number,
): string {
  const reasons: string[] = []
  const vsMedian = marketMedian > 0 ? ((expectedPrice - marketMedian) / marketMedian) * 100 : 0

  if (vsMedian <= -2) reasons.push(`price ${Math.abs(vsMedian).toFixed(0)}% below the 90-day median`)
  else if (vsMedian >= 4) reasons.push(`price ${vsMedian.toFixed(0)}% above the median, but`)

  if (supplier.rejectionPct <= 1.5) reasons.push(`lowest rejection rate (${supplier.rejectionPct}%)`)
  if (supplier.onTimePct >= 93) reasons.push(`${supplier.onTimePct}% on-time delivery`)
  if (trendPct <= -2) reasons.push(`prices falling ${Math.abs(trendPct).toFixed(0)}% over three months`)
  if (trendPct >= 5) reasons.push(`prices rising ${trendPct.toFixed(0)}% over three months`)
  if (supplier.orderCount < 12) reasons.push(`only ${supplier.orderCount} orders on record`)

  if (reasons.length === 0) {
    const best = Math.max(priceScore, qualityScore, onTimeScore)
    if (best === priceScore) reasons.push('the best price of the suppliers who carry this item')
    else if (best === qualityScore) reasons.push(`rated ${supplier.rating} out of 5 on quality`)
    else reasons.push(`${supplier.onTimePct}% on-time delivery`)
  }

  const sentence = reasons.slice(0, 2).join(' and ')
  return sentence.charAt(0).toUpperCase() + sentence.slice(1) + '.'
}
