import { useEffect, useId, useRef, useState } from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import { ChevronDown } from 'lucide-react'

import { cn } from '@/lib/cn'
import { SEVALAYA_ITEMS } from './sevalayaNav'

/**
 * Sevalaya in the top nav, as a two-item menu (English only).
 */
export function SevalayaMenu() {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const closeTimer = useRef<number | undefined>(undefined)
  const menuId = useId()
  const { pathname } = useLocation()

  const active = pathname.startsWith('/sevalaya') || pathname.startsWith('/donate/sevalaya')

  useEffect(() => {
    if (!open) return
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('mousedown', onClick)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onClick)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  useEffect(() => () => window.clearTimeout(closeTimer.current), [])

  const openNow = () => {
    window.clearTimeout(closeTimer.current)
    setOpen(true)
  }
  const closeSoon = () => {
    window.clearTimeout(closeTimer.current)
    closeTimer.current = window.setTimeout(() => setOpen(false), 140)
  }

  return (
    <div className="relative" ref={ref} onPointerEnter={openNow} onPointerLeave={closeSoon}>
      <button
        type="button"
        aria-haspopup="true"
        aria-expanded={open}
        aria-controls={menuId}
        onClick={() => setOpen((v) => !v)}
        className={cn(
          'group relative flex items-center gap-1 rounded-lg px-3 py-2 text-[13px] font-bold tracking-wide transition-colors duration-150',
          active ? 'text-navy-950' : 'text-stone-700 hover:text-[#E22E26]',
        )}
      >
        <span>Sevalaya</span>
        <ChevronDown
          className={cn('size-3.5 text-stone-400 group-hover:text-[#E22E26] transition-transform duration-150', open && 'rotate-180')}
          aria-hidden
        />
        <span
          className={cn(
            'absolute inset-x-3 -bottom-1 h-0.5 rounded-full bg-[#E22E26] transition-opacity duration-150',
            active ? 'opacity-100' : 'opacity-0',
          )}
          aria-hidden
        />
      </button>

      {open ? (
        <div
          id={menuId}
          className="absolute left-0 top-full z-50 w-72 pt-2"
          style={{ animation: 'omg-fade-in 150ms ease-out' }}
        >
          <ul className="overflow-hidden rounded-2xl border-2 border-navy-200 bg-white p-1.5 shadow-xl">
            {SEVALAYA_ITEMS.map((item, i) => (
              <li key={item.to}>
                <NavLink
                  to={item.to}
                  onClick={() => setOpen(false)}
                  className={({ isActive }) =>
                    cn(
                      'block rounded-xl px-3.5 py-3 transition-colors duration-150',
                      isActive ? 'bg-navy-50' : 'hover:bg-navy-50/70',
                    )
                  }
                >
                  <span className="flex items-baseline gap-2">
                    <span className="font-mono text-[12px] font-bold text-kumkum-600 tabular-nums">{i + 1}.</span>
                    <span className="text-[15px] font-bold text-stone-900">{item.label}</span>
                  </span>
                  <span className="mt-0.5 block pl-6 text-[13px] leading-relaxed text-stone-500">{item.blurb}</span>
                </NavLink>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  )
}
