import type { ReactNode } from 'react'
import { cn } from '@/lib/cn'

/**
 * The head of a console page.
 *
 * The topbar breadcrumb already names every page, so the title is carried for
 * assistive technology only and not printed a second time. A page keeps a
 * visible title when the title *is* the content — a purchase order number or
 * an event name identifies the record you are looking at, and the breadcrumb
 * names the list it came from, not the record.
 */
export function PageHeader({
  title,
  showTitle = false,
  description,
  actions,
  children,
  className,
}: {
  title: ReactNode
  /** Print the title. For detail pages, where the title names the record. */
  showTitle?: boolean
  description?: ReactNode
  actions?: ReactNode
  /** Filters and tabs that belong under the header. */
  children?: ReactNode
  className?: string
}) {
  const hasTopRow = Boolean(showTitle || description || actions)

  return (
    <header className={cn(hasTopRow || children ? 'mb-6' : null, className)}>
      {showTitle ? null : <h1 className="sr-only">{title}</h1>}

      {hasTopRow ? (
        <div className="flex flex-wrap items-start justify-between gap-x-6 gap-y-3">
          {showTitle || description ? (
            <div className="min-w-0">
              {showTitle ? (
                <h1 className="font-display text-[23px] font-semibold tracking-tight text-stone-900 sm:text-[28px]">
                  {title}
                </h1>
              ) : null}
              {description ? (
                <p
                  className={cn(
                    'max-w-2xl text-[15px] leading-relaxed text-stone-500',
                    showTitle && 'mt-1.5',
                  )}
                >
                  {description}
                </p>
              ) : null}
            </div>
          ) : null}
          {actions ? <div className="ml-auto flex flex-wrap items-center gap-2">{actions}</div> : null}
        </div>
      ) : null}

      {children ? <div className={cn(hasTopRow && 'mt-4')}>{children}</div> : null}
    </header>
  )
}
