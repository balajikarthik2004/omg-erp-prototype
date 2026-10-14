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
          'relative flex h-full w-full flex-col bg-white border-l border-navy-200/90 shadow-2xl',
          width === 'lg' ? 'sm:max-w-2xl' : 'sm:max-w-md',
        )}
        style={{ animation: 'omg-slide-in-right 180ms ease-out' }}
      >
        <header className="flex items-start justify-between gap-4 border-b border-navy-100 px-6 py-4.5">
          <div className="min-w-0">
            <h2 className="font-heritage text-[22px] font-bold leading-tight text-navy-950">{title}</h2>
            {subtitle ? <p className="mt-0.5 text-[13px] text-navy-600/80">{subtitle}</p> : null}
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close panel"
            className="rounded-lg p-1.5 text-navy-500 transition-colors duration-150 hover:bg-navy-50 hover:text-navy-950"
          >
            <X className="size-5" aria-hidden />
          </button>
        </header>
        <div className="scrollbar-thin flex-1 overflow-y-auto px-6 py-5">{children}</div>
        {footer ? <footer className="border-t border-navy-100 bg-navy-50/40 px-6 py-4">{footer}</footer> : null}
      </aside>
    </div>
  )
}
