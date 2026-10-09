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
      className={cn('scrollbar-thin flex gap-1 overflow-x-auto overflow-y-hidden border-b border-sandal-200', className)}
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
              active ? 'font-semibold text-stone-900' : 'text-stone-500 hover:text-stone-900',
            )}
          >
            {item.label}
            {typeof item.count === 'number' ? (
              <span
                className={cn(
                  'ml-2 rounded-full px-1.5 py-px font-mono text-[11px] tabular-nums transition-colors duration-150',
                  active ? 'bg-turmeric-100 text-turmeric-700' : 'bg-sandal-100 text-stone-500',
                )}
              >
                {item.count}
              </span>
            ) : null}
            <span
              className={cn(
                'absolute inset-x-2 -bottom-px h-0.5 rounded-full bg-turmeric-500 transition-opacity duration-150',
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
