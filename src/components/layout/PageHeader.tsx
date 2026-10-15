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
    <header className={cn('mb-5 sm:mb-6', className)}>
      <div className="flex flex-wrap items-start justify-between gap-x-5 gap-y-3">
        <div className="min-w-0">
          <PhaseChip phase={phase} />
          <h1 className="mt-2 font-heritage text-[20px] font-bold tracking-tight text-navy-950 sm:text-[24px] lg:text-[26px]">
            {title}
          </h1>
          {description ? (
            <p className="mt-1.5 max-w-2xl text-[13px] sm:text-[13.5px] leading-relaxed text-navy-700/85">{description}</p>
          ) : null}
        </div>
        {actions ? <div className="flex flex-wrap items-center gap-2">{actions}</div> : null}
      </div>
      {children ? <div className="mt-3.5 sm:mt-4">{children}</div> : null}
    </header>
  )
}
