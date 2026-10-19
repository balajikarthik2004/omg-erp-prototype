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
  variant = 'light',
}: {
  items: TabItem[]
  value: string
  onChange: (id: string) => void
  className?: string
  variant?: 'light' | 'dark'
}) {
  const isDark = variant === 'dark'
  return (
    <div
      role="tablist"
      className={cn(
        'flex gap-1 overflow-x-auto overflow-y-hidden [scrollbar-width:none] [&::-webkit-scrollbar]:hidden',
        className,
      )}
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
              'relative shrink-0 px-3 py-2 text-[13.5px] sm:px-3.5 sm:py-2.5 sm:text-[14px] whitespace-nowrap transition-colors duration-150',
              isDark
                ? active
                  ? 'font-bold text-amber-300 drop-shadow-xs'
                  : 'font-medium text-stone-300 hover:text-white'
                : active
                  ? 'font-bold text-stone-900'
                  : 'font-medium text-stone-500 hover:text-stone-900',
            )}
          >
            {item.label}
            {typeof item.count === 'number' ? (
              <span
                className={cn(
                  'ml-2 rounded-full px-2 py-0.5 font-mono text-[11px] font-bold tabular-nums transition-colors duration-150',
                  isDark
                    ? active
                      ? 'border border-amber-400/40 bg-amber-400/25 text-amber-200'
                      : 'border border-white/15 bg-white/10 text-stone-300'
                    : active
                      ? 'bg-kumkum-100 text-kumkum-800'
                      : 'bg-sandal-200 text-stone-700',
                )}
              >
                {item.count}
              </span>
            ) : null}
            <span
              className={cn(
                'absolute inset-x-2 bottom-0 h-0.5 rounded-full transition-opacity duration-150',
                isDark
                  ? 'bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.8)]'
                  : 'bg-kumkum-600',
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
