import { ShieldCheck, UserRoundX } from 'lucide-react'

import { cn } from '@/lib/cn'
import { userName } from '@/mock/seed'

/**
 * States the four-eyes rule in plain words wherever an approve button sits,
 * so a blocked button is never a mystery.
 */
export function MakerCheckerNote({
  preparedBy,
  block,
  className,
}: {
  preparedBy: string
  /** Null when the signed-in persona may approve. */
  block: string | null
  className?: string
}) {
  const blocked = Boolean(block)
  const Icon = blocked ? UserRoundX : ShieldCheck

  return (
    <div
      className={cn(
        'flex items-start gap-2.5 rounded-lg border px-3 py-2.5 text-[13px]',
        blocked ? 'border-marigold-50 bg-marigold-50 text-marigold-500' : 'border-tulsi-50 bg-tulsi-50 text-tulsi-700',
        className,
      )}
    >
      <Icon className="mt-0.5 size-4 shrink-0" aria-hidden />
      <p className="leading-snug">
        {blocked ? (
          block
        ) : (
          <>
            Prepared by {userName(preparedBy)}. You are a different person, so you may approve this.
          </>
        )}
      </p>
    </div>
  )
}
