import { useState } from 'react'
import { Link } from 'react-router-dom'
import { AlignCenter, ArrowLeft, Columns, Layout } from 'lucide-react'

import { OmgMark } from '@/components/ui/Ornament'
import { cn } from '@/lib/cn'

import { LoginForm } from './LoginForm'
import { BRAND_NAME, LoginShowcase } from './LoginShowcase'

const TOGGLE =
  'group flex items-center gap-2 rounded-full border border-transparent px-2.5 py-1.5 text-[10px] font-bold uppercase tracking-[0.14em] text-stone-500 transition-colors hover:border-sandal-200 hover:bg-sandal-100 hover:text-stone-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-navy-400'

const TOGGLE_ICON =
  'flex size-6 items-center justify-center rounded-full bg-sandal-100 transition-colors group-hover:bg-sandal-50'

/**
 * Standalone sign-in surface: no donor navbar or footer, so the card is the
 * only thing on screen. Desktop gets the gopuram beside the form; mobile gets
 * it as the backdrop instead, since a stacked photo would push the form down.
 */
export function LoginPage() {
  const [viewMode, setViewMode] = useState<'full' | 'compact'>('full')
  const [formSide, setFormSide] = useState<'left' | 'right'>('left')

  return (
    <div className="relative flex min-h-dvh items-center justify-center overflow-hidden bg-navy-50 p-3 sm:p-6">
      {/* Mobile backdrop: the photograph, pushed back behind a brand wash. */}
      <div className="absolute inset-0 z-0 md:hidden" aria-hidden>
        <img src="/images/temple.webp" alt="" className="size-full scale-105 object-cover" />
        <div className="login-photo-wash absolute inset-0 opacity-90 backdrop-blur-[3px]" />
      </div>

      {/* Desktop backdrop: two soft brand fields, nothing literal. */}
      <div className="pointer-events-none absolute inset-0 z-0 hidden md:block" aria-hidden>
        <div
          className="login-orb -left-24 -top-32 size-[420px]"
          style={{ background: 'var(--color-navy-400)' }}
        />
        <div
          className="login-orb -bottom-28 -right-16 size-[340px]"
          style={{ background: 'var(--color-kumkum-500)', animationDelay: '1.5s' }}
        />
      </div>

      <Link
        to="/"
        className="absolute left-4 top-4 z-20 inline-flex items-center gap-1.5 rounded-full border border-sandal-200 bg-sandal-50/90 px-3 py-1.5 text-[11px] font-bold uppercase tracking-wider text-navy-700 backdrop-blur-sm transition-colors hover:text-kumkum-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-navy-400 sm:left-6 sm:top-6"
      >
        <ArrowLeft className="size-3.5" />
        <span>Back to portal</span>
      </Link>

      <div
        className={cn(
          'relative z-10 flex w-full flex-col overflow-hidden rounded-[20px]',
          'border border-sandal-200 bg-sandal-50/95 backdrop-blur-xl md:bg-sandal-50 md:backdrop-blur-none',
          'shadow-lift animate-settle',
          'min-h-[380px] md:min-h-[480px]',
          viewMode === 'full'
            ? 'max-w-md md:max-w-4xl lg:max-w-5xl'
            : 'max-w-[380px] md:max-w-md',
          viewMode === 'full' && formSide === 'left' && 'md:flex-row',
          viewMode === 'full' && formSide === 'right' && 'md:flex-row-reverse',
        )}
      >
        {/* Form side */}
        <div className="relative z-10 flex flex-1 flex-col items-center justify-center p-6 sm:p-8 lg:p-10">
          <div className="mb-5 flex items-center gap-3">
            <span className="flex size-11 items-center justify-center rounded-xl border border-sandal-200 bg-sandal-50 p-1.5 shadow-xs">
              <OmgMark size={28} />
            </span>
            <span className="font-display text-base font-bold tracking-tight text-stone-900">
              {BRAND_NAME}
            </span>
          </div>

          <LoginForm />

          <div className="mt-6 hidden w-full items-center justify-center gap-2 border-t border-sandal-200 pt-4 md:flex">
            <button
              type="button"
              onClick={() => setViewMode((p) => (p === 'full' ? 'compact' : 'full'))}
              className={TOGGLE}
              aria-label={viewMode === 'full' ? 'Switch to compact card' : 'Switch to full card'}
            >
              <span className={TOGGLE_ICON}>
                {viewMode === 'full' ? (
                  <AlignCenter className="size-3" />
                ) : (
                  <Columns className="size-3" />
                )}
              </span>
              {viewMode === 'full' ? 'Compact' : 'Full'}
            </button>

            {viewMode === 'full' && (
              <button
                type="button"
                onClick={() => setFormSide((p) => (p === 'left' ? 'right' : 'left'))}
                className={TOGGLE}
                aria-label="Swap which side the form sits on"
              >
                <span className={TOGGLE_ICON}>
                  <Layout className="size-3" />
                </span>
                Swap
              </button>
            )}
          </div>
        </div>

        {viewMode === 'full' && <LoginShowcase />}
      </div>
    </div>
  )
}
