import { useEffect, useRef, useState } from 'react'
import { Check, ChevronDown, FlaskConical } from 'lucide-react'

import { cn } from '@/lib/cn'
import { initials } from '@/lib/format'
import { ROLE_LABEL, USERS } from '@/mock/seed'
import { useSession, useCurrentUser } from '@/store/session'

/** Demo control. Changes the visible menu and which approve buttons are live. */
export function PersonaSwitcher() {
  const user = useCurrentUser()
  const setPersona = useSession((s) => s.setPersona)
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

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

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-haspopup="listbox"
        className={cn(
          'flex shrink-0 items-center gap-2 rounded-xl border border-navy-200/90 bg-white py-1.5 pr-2.5 pl-1.5 shadow-2xs',
          'transition-colors duration-150 hover:bg-navy-50/50',
        )}
      >
        <span className="flex size-7.5 items-center justify-center rounded-lg bg-gradient-to-br from-kumkum-500 to-kumkum-600 font-mono text-[12px] font-black text-white shadow-xs">
          {initials(user.name)}
        </span>
        <span className="hidden text-left sm:block">
          <span className="block text-[13px] leading-tight font-bold text-navy-950">{user.name}</span>
          <span className="block text-[11.5px] leading-tight font-medium text-navy-600">{ROLE_LABEL[user.role]}</span>
        </span>
        <ChevronDown className="size-4 text-navy-400" aria-hidden />
      </button>

      {open ? (
        <div
          role="listbox"
          className="absolute right-0 z-50 mt-2 w-72 overflow-hidden rounded-2xl border-2 border-navy-200 bg-white shadow-xl"
          style={{ animation: 'omg-fade-in 150ms ease-out' }}
        >
          <div className="flex items-start gap-2 border-b border-amber-200 bg-amber-50 px-3 py-2.5">
            <FlaskConical className="mt-0.5 size-4 shrink-0 text-amber-600" aria-hidden />
            <p className="text-[12px] leading-snug text-amber-900 font-medium">
              <span className="font-bold">Demo control.</span> Switching persona changes the menu and which
              approvals you are allowed to sign.
            </p>
          </div>
          <ul className="max-h-80 overflow-y-auto py-1">
            {USERS.map((u) => {
              const active = u.id === user.id
              return (
                <li key={u.id}>
                  <button
                    type="button"
                    role="option"
                    aria-selected={active}
                    onClick={() => {
                      setPersona(u.id)
                      setOpen(false)
                    }}
                    className={cn(
                      'flex w-full items-center gap-3 px-3 py-2 text-left transition-colors duration-150',
                      active ? 'bg-navy-50 font-semibold' : 'hover:bg-navy-50/60',
                    )}
                  >
                    <span className="flex size-7 shrink-0 items-center justify-center rounded-md bg-navy-100 font-mono text-[12px] font-bold text-navy-800">
                      {initials(u.name)}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-[14px] text-stone-900 font-semibold">{u.name}</span>
                      <span className="block text-[12px] text-stone-500 font-medium">{ROLE_LABEL[u.role]}</span>
                    </span>
                    {active ? <Check className="size-4 shrink-0 text-emerald-600 font-bold" aria-hidden /> : null}
                  </button>
                </li>
              )
            })}
          </ul>
        </div>
      ) : null}
    </div>
  )
}
