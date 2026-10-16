import { cn } from '@/lib/cn'
import type { InventoryItem } from '@/types'

/**
 * How much is on the shelf, against the level at which it must be reordered.
 *
 * The two figures were separate columns, which left the reader subtracting
 * one from the other on every row to answer the only question the page is
 * asked: is this about to run out? The bar answers it at a glance, and the
 * notch marks the reorder level so the numbers still mean something.
 *
 * The scale runs to twice the reorder level, because that is roughly a full
 * shelf for a reorder point set at half of it — a bar scaled to the stock
 * itself would make every item look equally full.
 */
export function StockLevel({ item }: { item: InventoryItem }) {
  const scale = Math.max(item.reorderLevel * 2, item.stock, 1)
  const fill = Math.min(100, (item.stock / scale) * 100)
  const notch = Math.min(100, (item.reorderLevel / scale) * 100)

  const out = item.stock <= 0
  const low = item.stock <= item.reorderLevel
  const close = !low && item.stock <= item.reorderLevel * 1.25

  return (
    <span className="block min-w-[150px]">
      <span className="relative block h-2 w-full overflow-hidden rounded-full bg-sandal-200">
        <span
          className={cn(
            'absolute inset-y-0 left-0 rounded-full',
            out || low ? 'bg-danger-600' : close ? 'bg-marigold-500' : 'bg-tulsi-500',
          )}
          style={{ width: `${fill}%` }}
        />
        {/* The reorder level, so the fill reads as a position and not a score. */}
        <span
          className="absolute inset-y-0 w-px bg-stone-700/50"
          style={{ left: `${notch}%` }}
          aria-hidden
        />
      </span>
      <span className="mt-1 block font-mono text-[12px] tabular-nums text-stone-500">
        <span className={cn('font-semibold', low ? 'text-danger-600' : 'text-stone-900')}>
          {item.stock} {item.unit}
        </span>
        {' · reorder at '}
        {item.reorderLevel}
      </span>
    </span>
  )
}
