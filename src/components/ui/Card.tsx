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
        'relative overflow-hidden rounded-xl border border-navy-100/90 bg-white shadow-card hover:shadow-lift transition-shadow duration-200',
        className,
      )}
      {...rest}
    >
      {accentClass ? <div className={cn('h-1 w-full', accentClass)} /> : null}
      <div className={cn(padded && 'p-4 sm:p-5')}>{children}</div>
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
    <div className={cn('mb-3.5 sm:mb-4 flex items-start justify-between gap-3', className)}>
      <div className="min-w-0">
        <h3 className="font-heritage text-[16px] sm:text-[17px] font-bold text-navy-950 tracking-tight leading-snug">{title}</h3>
        {description ? <p className="mt-0.5 text-[12.5px] leading-relaxed text-navy-600/80">{description}</p> : null}
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </div>
  )
}
