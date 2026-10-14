import type { ReactNode } from 'react'
import { cn } from '@/lib/cn'

export interface TabItem {
  id: string
  label: ReactNode
  count?: number
}

export function Tabs({
  items,
  value,
  onChange,
  className,
}: {
  items: TabItem[]
  value: string
  onChange: (id: string) => void
  className?: string
}) {
  return (
    <div
      role="tablist"
      className={cn('scrollbar-thin flex gap-1 overflow-x-auto overflow-y-hidden', className)}
    >
      {items.map((item) => {
        const active = item.id === value
        return (
          <button
            key={item.id}
            role="tab"
            type="button"
            aria-selected={active}
            onClick={() => onChange(item.id)}
            className={cn(
              'relative shrink-0 px-3.5 py-2.5 text-[14px] whitespace-nowrap transition-colors duration-150',
              active ? 'font-bold text-navy-950' : 'text-navy-600/80 hover:text-navy-950 font-medium',
            )}
          >
            {item.label}
            {typeof item.count === 'number' ? (
              <span
                className={cn(
                  'ml-2 rounded-full px-2 py-0.5 font-mono text-[11px] font-bold tabular-nums transition-colors duration-150',
                  active ? 'bg-kumkum-100 text-kumkum-800' : 'bg-navy-100 text-navy-700',
                )}
              >
                {item.count}
              </span>
            ) : null}
            <span
              className={cn(
                'absolute inset-x-2 bottom-0 h-0.5 rounded-full bg-kumkum-600 transition-opacity duration-150',
                active ? 'opacity-100' : 'opacity-0',
              )}
              aria-hidden
            />
          </button>
        )
      })}
    </div>
  )
}
