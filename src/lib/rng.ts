/** Deterministic PRNG (mulberry32) so mock data is identical on every reload. */
export function mulberry32(seed: number): () => number {
  let a = seed >>> 0
  return function next() {
    a |= 0
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

export interface Rng {
  next: () => number
  int: (min: number, max: number) => number
  pick: <T>(items: readonly T[]) => T
  weighted: <T>(entries: readonly [T, number][]) => T
  chance: (p: number) => boolean
  shuffle: <T>(items: T[]) => T[]
  /** Normal-ish value around `mean` using the sum of three uniforms. */
  around: (mean: number, spread: number) => number
}

export function createRng(seed: number): Rng {
  const next = mulberry32(seed)

  const int = (min: number, max: number) => min + Math.floor(next() * (max - min + 1))

  const pick = <T,>(items: readonly T[]): T => {
    if (items.length === 0) throw new Error('pick() on empty list')
    return items[Math.floor(next() * items.length)] as T
  }

  const weighted = <T,>(entries: readonly [T, number][]): T => {
    const total = entries.reduce((sum, [, w]) => sum + w, 0)
    let roll = next() * total
    for (const [value, w] of entries) {
      roll -= w
      if (roll <= 0) return value
    }
    return entries[entries.length - 1]![0]
  }

  const chance = (p: number) => next() < p

  const shuffle = <T,>(items: T[]): T[] => {
    const out = [...items]
    for (let i = out.length - 1; i > 0; i--) {
      const j = Math.floor(next() * (i + 1))
      ;[out[i], out[j]] = [out[j] as T, out[i] as T]
    }
    return out
  }

  const around = (mean: number, spread: number) => {
    const bell = (next() + next() + next()) / 3 - 0.5
    return mean + bell * 2 * spread
  }

  return { next, int, pick, weighted, chance, shuffle, around }
}

export const SEED = 108
