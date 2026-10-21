import { useEffect, useRef, useState, type ReactNode } from 'react'
import { X } from 'lucide-react'
import { cn } from '@/lib/cn'

/** The flow phase a panel belongs to. Paints the rail above its header. */
type Accent = 'kumkum' | 'tulsi' | 'turmeric' | 'peacock' | 'navy'

const ACCENT_RAIL: Record<Accent, string> = {
  kumkum: 'bg-kumkum-600',
  tulsi: 'bg-tulsi-500',
  turmeric: 'bg-turmeric-400',
  peacock: 'bg-peacock-500',
  navy: 'bg-navy-600',
}

const WIDTHS = {
  md: 'sm:max-w-md',
  lg: 'sm:max-w-2xl',
  xl: 'sm:max-w-3xl',
} as const

export function Drawer({
  open,
  onClose,
  title,
  subtitle,
  children,
  footer,
  headerExtra,
  accent,
  tone = 'plain',
  width = 'md',
}: {
  open: boolean
  onClose: () => void
  title: ReactNode
  subtitle?: ReactNode
  children: ReactNode
  footer?: ReactNode
  /** Chips and badges that belong with the title rather than adrift in the body. */
  headerExtra?: ReactNode
  accent?: Accent
  /**
   * "canvas" tints the body so white cards inside it read as cards, the way
   * a console page does. Panels that lay plain text and `sandal-100` blocks
   * straight onto the body want "plain", which is the default.
   */
  tone?: 'plain' | 'canvas'
  width?: keyof typeof WIDTHS
}) {
  const [scrolled, setScrolled] = useState(false)

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
          'relative flex h-full w-full flex-col border-l border-sandal-200 bg-sandal-50 shadow-sheet',
          WIDTHS[width],
        )}
        style={{ animation: 'omg-slide-in-right 180ms var(--ease-out-soft)' }}
      >
        {accent ? <span className={cn('h-[3px] w-full shrink-0', ACCENT_RAIL[accent])} aria-hidden /> : null}

        <header
          className={cn(
            'relative z-10 shrink-0 border-b border-sandal-200 bg-sandal-50 px-5 py-4.5 transition-shadow duration-150 sm:px-6',
            scrolled && 'shadow-card',
          )}
        >
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <h2 className="font-display text-[20px] leading-tight font-bold text-stone-900 sm:text-[22px]">
                {title}
              </h2>
              {subtitle ? <p className="mt-0.5 text-[13px] text-stone-500">{subtitle}</p> : null}
            </div>
            <button
              type="button"
              onClick={onClose}
              aria-label="Close panel"
              className="-mt-1 shrink-0 rounded-lg p-1.5 text-stone-500 transition-colors duration-150 hover:bg-sandal-100 hover:text-stone-900 focus-visible:ring-2 focus-visible:ring-navy-400 focus-visible:outline-none"
            >
              <X className="size-5" aria-hidden />
            </button>
          </div>
          {headerExtra ? <div className="mt-3 flex flex-wrap items-center gap-2">{headerExtra}</div> : null}
        </header>

        <DrawerBody tone={tone} onScrolledChange={setScrolled}>
          {children}
        </DrawerBody>

        {footer ? (
          <footer
            className={cn(
              'shrink-0 border-t border-sandal-200 px-5 py-4 sm:px-6',
              tone === 'canvas' ? 'bg-sandal-50 shadow-sheet' : 'bg-sandal-100',
            )}
          >
            {footer}
          </footer>
        ) : null}
      </aside>
    </div>
  )
}

/**
 * Mounted only while the panel is open, so each opening starts unscrolled
 * without an effect having to reset the flag.
 */
function DrawerBody({
  children,
  tone,
  onScrolledChange,
}: {
  children: ReactNode
  tone: 'plain' | 'canvas'
  onScrolledChange: (scrolled: boolean) => void
}) {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const onScroll = () => onScrolledChange(el.scrollTop > 4)
    el.addEventListener('scroll', onScroll, { passive: true })
    return () => {
      el.removeEventListener('scroll', onScroll)
      onScrolledChange(false)
    }
  }, [onScrolledChange])

  return (
    <div
      ref={ref}
      data-lenis-prevent
      className={cn(
        'scrollbar-thin flex-1 overflow-y-auto px-5 py-5 sm:px-6',
        tone === 'canvas' ? 'bg-navy-50' : 'bg-sandal-50',
      )}
    >
      {children}
    </div>
  )
}
