import { SECTORS, type SectorId } from '@/config'
import { cn } from '@/lib/cn'

export function SectorChip({
  sectorId,
  className,
}: {
  sectorId: SectorId
  /** Accepted but no longer rendered — the chips are English-only now. */
  withTamil?: boolean
  className?: string
}) {
  const meta = SECTORS[sectorId]
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[12px] font-medium whitespace-nowrap',
        meta.chipClass,
        className,
      )}
    >
      <span className={cn('size-1.5 rounded-full', meta.dotClass)} aria-hidden />
      {meta.name}
    </span>
  )
}
