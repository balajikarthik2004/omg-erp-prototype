import { useEffect, type ReactNode } from 'react'
import { X } from 'lucide-react'

export function Dialog({
  open,
  onClose,
  title,
  description,
  children,
  footer,
}: {
  open: boolean
  onClose: () => void
  title: ReactNode
  description?: ReactNode
  children?: ReactNode
  footer?: ReactNode
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
    <div className="fixed inset-0 z-50 flex items-end justify-center p-0 sm:items-center sm:p-6">
      <div className="absolute inset-0 bg-stone-900/45 backdrop-blur-[2px]" onClick={onClose} aria-hidden />
      <div
        role="dialog"
        aria-modal="true"
        aria-label={typeof title === 'string' ? title : 'Dialog'}
        className="relative w-full max-w-lg rounded-t-[14px] border border-sandal-200 bg-sandal-50 shadow-sheet sm:rounded-card"
        style={{ animation: 'omg-fade-in 150ms ease-out' }}
      >
        <header className="flex items-start justify-between gap-4 border-b border-sandal-200 px-5 py-4">
          <div>
            <h2 className="font-display text-[22px] leading-tight text-stone-900">{title}</h2>
            {description ? <p className="mt-1 text-[13px] text-stone-500">{description}</p> : null}
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close dialog"
            className="rounded-lg p-1.5 text-stone-500 transition-colors duration-150 hover:bg-sandal-100 hover:text-stone-900"
          >
            <X className="size-5" aria-hidden />
          </button>
        </header>
        {children ? <div className="scrollbar-thin max-h-[65vh] overflow-y-auto px-5 py-5">{children}</div> : null}
        {footer ? <footer className="border-t border-sandal-200 px-5 py-4">{footer}</footer> : null}
      </div>
    </div>
  )
}
