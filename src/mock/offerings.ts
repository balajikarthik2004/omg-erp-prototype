import type { CatalogItem } from '@/types'
import { GAUSHALA_SEWAS } from './gaushala'
import { CATALOG } from './seed'

/**
 * Everything the cart can hold: the three sector catalogs plus the Gaushala
 * sewas.
 *
 * `CATALOG` stays Seva-only on purpose — it is what the Sevalaya page reads,
 * so adding the Gaushala cannot change a single row there. Anything that has
 * to resolve a line item *after* it is in the cart (checkout, receipt, the
 * donations table, the ledger) looks it up here instead.
 */
export const OFFERINGS: CatalogItem[] = [...CATALOG, ...GAUSHALA_SEWAS]

export function offeringById(id: string | undefined): CatalogItem | undefined {
  if (!id) return undefined
  return OFFERINGS.find((c) => c.id === id)
}

/** The display name for a line item, falling back to its id. */
export function offeringName(id: string | undefined): string {
  return offeringById(id)?.name ?? id ?? '—'
}
