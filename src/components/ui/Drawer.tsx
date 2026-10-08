import { useEffect, type ReactNode } from 'react'
import { X } from 'lucide-react'
import { cn } from '@/lib/cn'

export function Drawer({
  open,
  onClose,
  title,
  subtitle,
  children,
  footer,
  width = 'md',
}: {
  open: boolean
  onClose: () => void
  title: ReactNode
  subtitle?: ReactNode
  children: ReactNode
  footer?: ReactNode
  width?: 'md' | 'lg'
}) {
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
    }
  }, [open, onClose])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div
        className="absolute inset-0 bg-stone-900/45 backdrop-blur-[2px]"
        style={{ animation: 'omg-fade-in 150ms ease-out' }}
        onClick={onClose}
        aria-hidden
      />
      <aside
        role="dialog"
        aria-modal="true"
        aria-label={typeof title === 'string' ? title : 'Details'}
        className={cn(
          'relative flex h-full w-full flex-col bg-sandal-50 shadow-sheet',
          width === 'lg' ? 'sm:max-w-2xl' : 'sm:max-w-md',
        )}
        style={{ animation: 'omg-slide-in-right 180ms ease-out' }}
      >
        <header className="flex items-start justify-between gap-4 border-b border-sandal-200 px-5 py-4">
          <div className="min-w-0">
            <h2 className="font-display text-[22px] leading-tight text-stone-900">{title}</h2>
            {subtitle ? <p className="mt-0.5 text-[13px] text-stone-500">{subtitle}</p> : null}
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close panel"
            className="rounded-lg p-1.5 text-stone-500 transition-colors duration-150 hover:bg-sandal-100 hover:text-stone-900"
          >
            <X className="size-5" aria-hidden />
          </button>
        </header>
        <div className="scrollbar-thin flex-1 overflow-y-auto px-5 py-5">{children}</div>
        {footer ? <footer className="border-t border-sandal-200 px-5 py-4">{footer}</footer> : null}
      </aside>
    </div>
  )
}
