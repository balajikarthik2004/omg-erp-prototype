import { generateDatabase, type Database } from './generators'

/** Fake network latency, so loading states are real. */
function latency(): number {
  return 250 + Math.random() * 350
}

export function delay<T>(value: T): Promise<T> {
  return new Promise((resolve) => {
    setTimeout(() => resolve(value), latency())
  })
}

let snapshot: Database | null = null

/** The single mock backend. Generated once per page load from seed 108. */
export function loadDatabase(): Database {
  if (!snapshot) snapshot = generateDatabase()
  return snapshot
}

export const api = {
  /** Mirrors a real fetch: the console pages await this before first paint. */
  fetchAll(): Promise<Database> {
    return delay(loadDatabase())
  },

  /** A short pause used by flows that should visibly "work", e.g. checkout. */
  process(ms = 1500): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms))
  },
}

export type { Database }
