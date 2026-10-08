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
        'border-sandal-200 bg-sandal-100 text-stone-700',
        className,
      )}
    >
      {icon}
      {children}
    </span>
  )
}
