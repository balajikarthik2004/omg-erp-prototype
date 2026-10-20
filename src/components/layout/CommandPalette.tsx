import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { CornerDownLeft, Search } from 'lucide-react'

import { PHASES } from '@/config'
import { cn } from '@/lib/cn'
import { useCurrentUser } from '@/store/session'
import { useDb } from '@/store/db'
import { visibleGroups, type NavGroup, type NavItem } from './nav'

type Hit = { item: NavItem; group: NavGroup }

/**
 * Jump to any console page by typing.
 *
 * A trustee's menu runs to forty-odd links across eight groups, which is past
 * the point where scanning a sidebar beats typing. The list is the same one
 * the sidebar renders, filtered by the same role and module rules, so the
 * palette can never offer a page the person cannot open.
 *
 * The caller mounts this only while it is open, so every opening starts with
 * an empty query and no state needs resetting.
 */
export function CommandPalette({ onClose }: { onClose: () => void }) {
  const navigate = useNavigate()
  const user = useCurrentUser()
  const tenant = useDb((s) => s.tenants.find((t) => t.id === s.activeTenantId))
  const [query, setQuery] = useState('')
  const [cursor, setCursor] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)
  const listRef = useRef<HTMLUListElement>(null)

  const all: Hit[] = useMemo(() => {
    const groups = visibleGroups(user.role, tenant?.modules)
    return groups.flatMap((group) => group.items.map((item) => ({ item, group })))
  }, [user.role, tenant?.modules])

  const hits = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return all
    return all.filter(
      ({ item, group }) => item.label.toLowerCase().includes(q) || group.label.toLowerCase().includes(q),
    )
  }, [all, query])

  // Clamped during render rather than corrected in an effect, so the list can
  // never paint one frame with a cursor pointing past its end.
  const active = hits.length === 0 ? -1 : Math.min(cursor, hits.length - 1)

  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  // Keep the highlighted row in view when arrowing through a long list.
  useEffect(() => {
    listRef.current?.querySelector('[data-active="true"]')?.scrollIntoView({ block: 'nearest' })
  }, [active])

  function go(hit: Hit | undefined) {
    if (!hit) return
    navigate(hit.item.to)
    onClose()
  }

  function onKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Escape') {
      e.preventDefault()
      onClose()
    } else if (e.key === 'ArrowDown') {
      e.preventDefault()
      setCursor(hits.length ? (active + 1) % hits.length : 0)
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setCursor(hits.length ? (active - 1 + hits.length) % hits.length : 0)
    } else if (e.key === 'Enter') {
      e.preventDefault()
      go(hits[active])
    }
  }

  return (
    <div className="no-print fixed inset-0 z-50 flex items-start justify-center px-4 pt-[12vh]">
      <div
        className="absolute inset-0 bg-navy-950/50 backdrop-blur-sm"
        style={{ animation: 'omg-fade-in 150ms ease-out' }}
        onClick={onClose}
        aria-hidden
      />

      <div
        role="dialog"
        aria-modal="true"
        aria-label="Go to a page"
        onKeyDown={onKeyDown}
        className="animate-settle relative w-full max-w-xl overflow-hidden rounded-card border border-sandal-200 bg-sandal-50 shadow-sheet"
      >
        <div className="flex items-center gap-2.5 border-b border-sandal-200 px-4">
          <Search className="size-4 shrink-0 text-stone-500" aria-hidden />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => {
              setQuery(e.target.value)
              setCursor(0)
            }}
            placeholder="Go to a page…"
            aria-label="Go to a page"
            className="w-full bg-transparent py-3.5 text-[15px] text-stone-900 placeholder:text-stone-500 focus:outline-none"
          />
          <kbd className="hidden shrink-0 rounded border border-sandal-200 bg-sandal-100 px-1.5 py-0.5 font-mono text-[11px] text-stone-500 sm:block">
            Esc
          </kbd>
        </div>

        {hits.length === 0 ? (
          <p className="px-4 py-8 text-center text-[14px] text-stone-500">
            Nothing matches “{query.trim()}”. Try a shorter word.
          </p>
        ) : (
          <ul ref={listRef} data-lenis-prevent className="scrollbar-thin max-h-[52vh] overflow-y-auto py-1.5">
            {hits.map(({ item, group }, i) => {
              const Icon = item.icon
              const on = i === active
              return (
                <li key={item.to}>
                  <button
                    type="button"
                    data-active={on}
                    onMouseEnter={() => setCursor(i)}
                    onClick={() => go({ item, group })}
                    className={cn(
                      'flex w-full items-center gap-3 px-4 py-2 text-left transition-colors duration-100',
                      on ? 'bg-sandal-100' : 'bg-transparent',
                    )}
                  >
                    <span
                      className={cn('size-1.5 shrink-0 rounded-full', PHASES[item.phase].markerClass)}
                      aria-hidden
                    />
                    <Icon className="size-4 shrink-0 text-stone-500" aria-hidden />
                    <span className="min-w-0 flex-1 truncate text-[14px] font-medium text-stone-900">
                      {item.label}
                    </span>
                    <span className="shrink-0 text-[12px] text-stone-500">{group.label}</span>
                    {on ? <CornerDownLeft className="size-3.5 shrink-0 text-stone-500" aria-hidden /> : null}
                  </button>
                </li>
              )
            })}
          </ul>
        )}
      </div>
    </div>
  )
}
