import { CatalogPage } from '@/features/catalog/CatalogPage'

/**
 * Sevalaya -> Seva.
 *
 * The page the Sevalaya nav item has always pointed at, now at its own URL
 * because Sevalaya is a two-item dropdown. It is the same component with the
 * sector pinned, so nothing about the Seva catalog changes.
 */
export function SevaPage() {
  return <CatalogPage sectorId="sevalaya" />
}
