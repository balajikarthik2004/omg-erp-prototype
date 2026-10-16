import { useEffect, useRef, useState } from 'react'
import { Check, ChevronDown } from 'lucide-react'

import { cn } from '@/lib/cn'
import { initials } from '@/lib/format'
import { DEMO_PERSONAS, ROLE_LABEL, userById, type DemoPersona } from '@/mock/seed'
import { useSession, useCurrentUser } from '@/store/session'

/** The switcher is ordered by the flow, not alphabetically. */
const STAGES: DemoPersona['stage'][] = ['Platform', 'Give', 'Prepare', 'Approve']

const STAGE_HINT: Record<DemoPersona['stage'], string> = {
  Platform: 'Platform',
  Give: 'Give · the donor side',
  Prepare: 'Prepare · raises the paperwork',
  Approve: 'Approve · signs by value',
}

function byStage(stage: DemoPersona['stage']) {
  return DEMO_PERSONAS.filter((p) => p.stage === stage)
    .map((persona) => ({ persona, u: userById(persona.id)! }))
    .filter((row) => Boolean(row.u))
}

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
          'flex shrink-0 items-center gap-2 rounded-lg border border-sandal-200 bg-sandal-50 py-1.5 pl-1.5 pr-2.5',
          'transition-colors duration-150 hover:bg-sandal-100',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-navy-400',
        )}
      >
        <span className="flex size-7.5 items-center justify-center rounded-md bg-kumkum-600 font-mono text-[12px] font-bold text-white">
          {initials(user.name)}
        </span>
        <span className="hidden text-left sm:block">
          <span className="block text-[13px] font-semibold leading-tight text-stone-900">{user.name}</span>
          <span className="block text-[11.5px] leading-tight text-stone-500">{ROLE_LABEL[user.role]}</span>
        </span>
        <ChevronDown className="size-4 text-stone-500" aria-hidden />
      </button>

      {open ? (
        <div
          role="listbox"
          className="absolute right-0 z-50 mt-2 w-72 overflow-hidden rounded-card border border-sandal-200 bg-sandal-50 shadow-lift"
          style={{ animation: 'omg-fade-in 150ms ease-out' }}
        >
          <p className="border-b border-sandal-200 bg-sandal-100 px-3 py-2 text-[11px] font-semibold uppercase tracking-[0.1em] text-stone-500">
            Demo control · view as
          </p>
          <ul className="max-h-[26rem] overflow-y-auto py-1">
            {STAGES.map((stage) => (
              <li key={stage}>
                <p className="px-3 pb-1 pt-2 text-[10.5px] font-bold uppercase tracking-[0.12em] text-stone-500">
                  {STAGE_HINT[stage]}
                </p>
                <ul>
                  {byStage(stage).map(({ persona, u }) => {
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
                            'flex w-full items-start gap-3 px-3 py-2 text-left transition-colors duration-150',
                            active ? 'bg-sandal-100' : 'hover:bg-sandal-100',
                          )}
                        >
                          <span className="mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-md bg-sandal-200 font-mono text-[12px] font-bold text-stone-700">
                            {initials(u.name)}
                          </span>
                          <span className="min-w-0 flex-1">
                            <span className="flex items-baseline gap-1.5">
                              <span className="truncate text-[14px] font-semibold text-stone-900">{u.name}</span>
                              <span className="shrink-0 text-[11.5px] text-stone-500">{ROLE_LABEL[u.role]}</span>
                            </span>
                            <span className="mt-0.5 block text-[12px] leading-snug text-stone-500">
                              {persona.does}
                            </span>
                          </span>
                          {active ? <Check className="mt-1 size-4 shrink-0 text-tulsi-700" aria-hidden /> : null}
                        </button>
                      </li>
                    )
                  })}
                </ul>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  )
}
