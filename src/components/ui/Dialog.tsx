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
        className="relative w-full max-w-lg rounded-t-2xl border-2 border-navy-200/90 bg-white shadow-2xl sm:rounded-2xl"
        style={{ animation: 'omg-fade-in 150ms ease-out' }}
      >
        <header className="flex items-start justify-between gap-4 border-b border-navy-100 px-6 py-4.5">
          <div>
            <h2 className="font-heritage text-[22px] font-bold leading-tight text-navy-950">{title}</h2>
            {description ? <p className="mt-1 text-[13px] text-navy-600/80">{description}</p> : null}
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close dialog"
            className="rounded-lg p-1.5 text-navy-500 transition-colors duration-150 hover:bg-navy-50 hover:text-navy-950"
          >
            <X className="size-5" aria-hidden />
          </button>
        </header>
        {children ? <div className="scrollbar-thin max-h-[65vh] overflow-y-auto px-6 py-5">{children}</div> : null}
        {footer ? <footer className="border-t border-navy-100 bg-navy-50/40 px-6 py-4 rounded-b-2xl">{footer}</footer> : null}
      </div>
    </div>
  )
}
