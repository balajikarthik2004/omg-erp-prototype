import type { HTMLAttributes, ReactNode } from 'react'
import { cn } from '@/lib/cn'

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  /** A coloured rule across the top — used for sector and phase cues. */
  accentClass?: string
  padded?: boolean
}

export function Card({ accentClass, padded = true, className, children, ...rest }: CardProps) {
  return (
    <div
      className={cn(
        'relative overflow-hidden rounded-card border border-sandal-200 bg-sandal-50 shadow-card',
        className,
      )}
      {...rest}
    >
      {accentClass ? <div className={cn('h-1 w-full', accentClass)} /> : null}
      <div className={cn(padded && 'p-5 sm:p-6')}>{children}</div>
    </div>
  )
}

export function CardHeader({
  title,
  description,
  action,
  className,
}: {
  title: ReactNode
  description?: ReactNode
  action?: ReactNode
  className?: string
}) {
  return (
    <div className={cn('mb-5 flex items-start justify-between gap-4', className)}>
      <div className="min-w-0">
        <h3 className="font-display text-[18px] leading-tight text-stone-900">{title}</h3>
        {description ? <p className="mt-1 text-[13px] leading-relaxed text-stone-500">{description}</p> : null}
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </div>
  )
}
