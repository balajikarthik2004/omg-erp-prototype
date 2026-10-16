import { type ReactNode } from 'react'
import { cn } from '@/lib/cn'

export interface TooltipProps {
  content: ReactNode
  children: ReactNode
  position?: 'top' | 'bottom' | 'left' | 'right'
  align?: 'center' | 'start' | 'end'
  className?: string
  contentClassName?: string
  disabled?: boolean
}

export function Tooltip({
  content,
  children,
  position = 'bottom',
  align = 'center',
  className,
  contentClassName,
  disabled = false,
}: TooltipProps) {
  if (!content || disabled) {
    return <>{children}</>
  }

  const alignClass = (() => {
    if (position === 'top' || position === 'bottom') {
      if (align === 'start') return 'left-0'
      if (align === 'end') return 'right-0'
      return 'left-1/2 -translate-x-1/2'
    }
    return ''
  })()

  return (
    <div className={cn('group/tooltip relative inline-flex items-center', className)}>
      {children}
      <div
        role="tooltip"
        className={cn(
          'pointer-events-none absolute z-50 flex items-center',
          'opacity-0 transition-all duration-150 ease-out-soft',
          'group-hover/tooltip:opacity-100 group-focus-within/tooltip:opacity-100',
          // Position classes
          position === 'top' && 'bottom-full mb-2 translate-y-1 group-hover/tooltip:translate-y-0',
          position === 'bottom' && 'top-full mt-2 -translate-y-1 group-hover/tooltip:translate-y-0',
          position === 'left' && 'right-full top-1/2 -translate-y-1/2 mr-2 translate-x-1 group-hover/tooltip:translate-x-0',
          position === 'right' && 'left-full top-1/2 -translate-y-1/2 ml-2 -translate-x-1 group-hover/tooltip:translate-x-0',
          alignClass,
        )}
      >
        <div
          className={cn(
            'flex items-center rounded-lg bg-navy-950/95 px-3 py-1.5 text-[12px] font-medium text-white',
            'shadow-xl shadow-navy-950/30 ring-1 ring-white/15 backdrop-blur-md',
            'whitespace-nowrap leading-none select-none',
            contentClassName,
          )}
        >
          {content}
        </div>
      </div>
    </div>
  )
}
