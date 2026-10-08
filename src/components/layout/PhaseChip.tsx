import { PHASES, SECTORS, type Phase, type SectorId } from '@/config'
import { cn } from '@/lib/cn'

export function PhaseChip({ phase, className }: { phase: Phase; className?: string }) {
  const meta = PHASES[phase]
  return (
    <span
      title={meta.meaning}
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5',
        'text-[12px] font-medium tracking-[0.06em] uppercase',
        meta.chipClass,
        className,
      )}
    >
      <span className={cn('size-1.5 rounded-full', meta.markerClass)} aria-hidden />
      {meta.label}
    </span>
  )
}

export function SectorChip({
  sectorId,
  withTamil,
  className,
}: {
  sectorId: SectorId
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
      {withTamil ? <span className="text-[12px] opacity-70">{meta.tamil}</span> : null}
    </span>
  )
}
