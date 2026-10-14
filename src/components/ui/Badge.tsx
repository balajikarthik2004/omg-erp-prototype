import type { ReactNode } from 'react'
import { cn } from '@/lib/cn'

export function Badge({
  children,
  className,
  icon,
}: {
  children: ReactNode
  className?: string
  icon?: ReactNode
}) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5',
        'text-[12px] font-medium whitespace-nowrap',
        'border-navy-200/90 bg-navy-50 text-navy-800 font-semibold',
        className,
      )}
    >
      {icon}
      {children}
    </span>
  )
}
