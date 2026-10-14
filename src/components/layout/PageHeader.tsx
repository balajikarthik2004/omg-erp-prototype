import type { ReactNode } from 'react'
import type { Phase } from '@/config'
import { cn } from '@/lib/cn'
import { PhaseChip } from './PhaseChip'

export function PageHeader({
  title,
  description,
  phase,
  actions,
  children,
  className,
}: {
  title: ReactNode
  description?: ReactNode
  phase: Phase
  actions?: ReactNode
  /** Filters and tabs that belong under the gold rule. */
  children?: ReactNode
  className?: string
}) {
  return (
    <header className={cn('mb-7', className)}>
      <div className="flex flex-wrap items-start justify-between gap-x-6 gap-y-4">
        <div className="min-w-0">
          <PhaseChip phase={phase} />
          <h1 className="mt-2.5 font-heritage text-[24px] font-bold tracking-tight text-navy-950 sm:text-[32px]">
            {title}
          </h1>
          {description ? (
            <p className="mt-2 max-w-2xl text-[14px] sm:text-[15px] leading-relaxed text-navy-700/80">{description}</p>
          ) : null}
        </div>
        {actions ? <div className="flex flex-wrap items-center gap-2">{actions}</div> : null}
      </div>
      <div className="gold-rule mt-5" />
      {children ? <div className="mt-5">{children}</div> : null}
    </header>
  )
}
