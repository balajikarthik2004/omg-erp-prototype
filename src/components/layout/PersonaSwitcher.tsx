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
          'flex items-center gap-2 rounded-lg border border-sandal-300 bg-sandal-50 py-1.5 pr-2 pl-1.5',
          'transition-colors duration-150 hover:bg-sandal-100',
        )}
      >
        <span className="flex size-7 items-center justify-center rounded-md bg-kumkum-600 font-mono text-[12px] text-sandal-50">
          {initials(user.name)}
        </span>
        <span className="hidden text-left sm:block">
          <span className="block text-[13px] leading-tight font-medium text-stone-900">{user.name}</span>
          <span className="block text-[12px] leading-tight text-stone-500">{ROLE_LABEL[user.role]}</span>
        </span>
        <ChevronDown className="size-4 text-stone-500" aria-hidden />
      </button>

      {open ? (
        <div
          role="listbox"
          className="absolute right-0 z-50 mt-2 w-72 overflow-hidden rounded-card border border-sandal-200 bg-sandal-50 shadow-lift"
          style={{ animation: 'omg-fade-in 150ms ease-out' }}
        >
          <div className="flex items-start gap-2 border-b border-sandal-200 bg-turmeric-50 px-3 py-2.5">
            <FlaskConical className="mt-0.5 size-4 shrink-0 text-turmeric-700" aria-hidden />
            <p className="text-[12px] leading-snug text-turmeric-700">
              <span className="font-semibold">Demo control.</span> Switching persona changes the menu and which
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
                      active ? 'bg-sandal-100' : 'hover:bg-sandal-100',
                    )}
                  >
                    <span className="flex size-7 shrink-0 items-center justify-center rounded-md bg-sandal-200 font-mono text-[12px] text-stone-700">
                      {initials(u.name)}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-[14px] text-stone-900">{u.name}</span>
                      <span className="block text-[12px] text-stone-500">{ROLE_LABEL[u.role]}</span>
                    </span>
                    {active ? <Check className="size-4 shrink-0 text-tulsi-700" aria-hidden /> : null}
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
