import { NavLink } from 'react-router-dom'
import { ExternalLink, X } from 'lucide-react'

import { PHASES } from '@/config'
import { cn } from '@/lib/cn'
import { Kolam, OmgMark } from '@/components/ui/Ornament'
import { useSession, useCurrentUser } from '@/store/session'
import { useDb } from '@/store/db'
import { actionableTasks } from '@/store/selectors'
import { visibleGroups } from './nav'

function SidebarContent({ onNavigate }: { onNavigate?: () => void }) {
  const user = useCurrentUser()
  const sectorFilter = useSession((s) => s.sectorFilter)
  const db = useDb()
  const tenant = db.tenants.find((t) => t.id === db.activeTenantId)
  const groups = visibleGroups(user.role, tenant?.modules)
  const mine = db.ready ? actionableTasks(db, sectorFilter, user) : []
  const myTasks = mine.length
  const myEventTasks = mine.filter((t) => t.kind.startsWith('event_') && t.kind !== 'event_order').length

  return (
    <div data-brand={tenant?.brand ?? 'kumkum'} className="flex h-full flex-col bg-gradient-to-b from-[#0F133B] via-[#121640] to-[#1C0F22] text-white border-r border-navy-800/80 shadow-2xl">
      <div className="flex items-center justify-between gap-2 border-b border-white/10 px-5 py-4.5">
        <NavLink to="/console" className="flex items-center gap-3" onClick={onNavigate}>
          <OmgMark size={36} onDark />
          <span className="leading-none">
            <span className="block max-w-[150px] truncate font-heritage text-[18px] font-bold tracking-wide text-white">
              {tenant?.name ?? 'OMG'}
            </span>
            <span className="mt-1 inline-flex items-center gap-1 text-[10px] font-extrabold tracking-[0.18em] text-kumkum-400 uppercase">
              <span className="size-1.5 rounded-full bg-kumkum-500 animate-pulse" />
              Console Portal
            </span>
          </span>
        </NavLink>
        {onNavigate ? (
          <button
            type="button"
            onClick={onNavigate}
            aria-label="Close navigation"
            className="rounded-lg p-1.5 text-white/70 transition-colors duration-150 hover:bg-white/10 lg:hidden"
          >
            <X className="size-5" aria-hidden />
          </button>
        ) : null}
      </div>

      <nav className="scrollbar-thin flex-1 overflow-y-auto px-3 pb-4">
        {groups.map((group) => (
          <div key={`${group.phase}-${group.label}`} className="mb-6">
            <div className="mb-2 flex items-center gap-2 px-3">
              <span className={cn('size-2 rounded-full', PHASES[group.phase].markerClass)} aria-hidden />
              <span className="text-[10px] font-extrabold tracking-[0.18em] text-white/50 uppercase">
                {group.label}
              </span>
            </div>
            <ul className="flex flex-col gap-0.5">
              {group.items.map((item) => {
                const Icon = item.icon
                return (
                  <li key={item.to}>
                    <NavLink
                      to={item.to}
                      end={item.end}
                      onClick={onNavigate}
                      className={({ isActive }) =>
                        cn(
                          'group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-[13.5px] transition-all duration-150',
                          isActive
                            ? 'bg-gradient-to-r from-kumkum-500/25 via-kumkum-500/15 to-transparent font-bold text-white shadow-xs ring-1 ring-white/15'
                            : 'text-white/75 hover:bg-white/10 hover:text-white font-medium',
                        )
                      }
                    >
                      {({ isActive }) => (
                        <>
                          <span
                            className={cn(
                              'absolute top-1/2 -left-3 h-5 w-[3.5px] -translate-y-1/2 rounded-r-full bg-kumkum-500 transition-opacity duration-150 shadow-sm shadow-kumkum-500/50',
                              isActive ? 'opacity-100' : 'opacity-0',
                            )}
                            aria-hidden
                          />
                          <Icon
                            className={cn(
                              'size-4.5 shrink-0 transition-colors duration-150',
                              isActive ? 'text-kumkum-400' : 'text-white/60 group-hover:text-white',
                            )}
                            aria-hidden
                          />
                          <span className="flex-1 truncate">{item.label}</span>
                          {(item.badge === 'approvals' ? myTasks : item.badge === 'eventApprovals' ? myEventTasks : 0) > 0 ? (
                            <span className="rounded-full bg-gradient-to-r from-kumkum-500 to-kumkum-600 px-2 py-0.5 font-mono text-[11px] font-black text-white shadow-xs tabular-nums">
                              {item.badge === 'approvals' ? myTasks : myEventTasks}
                            </span>
                          ) : null}
                        </>
                      )}
                    </NavLink>
                  </li>
                )
              })}
            </ul>
          </div>
        ))}
      </nav>

      <div className="border-t border-white/10 px-5 py-4">
        <NavLink
          to="/"
          onClick={onNavigate}
          className="inline-flex items-center gap-1.5 text-[13px] font-bold text-turmeric-300 transition-colors duration-150 hover:text-white"
        >
          <ExternalLink className="size-3.5" aria-hidden />
          <span>Open Devotee Portal</span>
        </NavLink>
        <div className="mt-3 flex items-end justify-between">
          <p className="text-[11px] leading-relaxed text-white/40 font-medium">
            OMG Enterprise Platform
            <br />
            Double-Signed CA Ledger
          </p>
          <Kolam className="-mr-1 -mb-1 text-white/15" size={50} />
        </div>
      </div>
    </div>
  )
}

export function Sidebar() {
  const sidebarOpen = useSession((s) => s.sidebarOpen)
  const setSidebarOpen = useSession((s) => s.setSidebarOpen)

  return (
    <>
      <aside className="no-print hidden w-[248px] shrink-0 lg:block">
        <div className="fixed inset-y-0 left-0 w-[248px]">
          <SidebarContent />
        </div>
      </aside>

      {sidebarOpen ? (
        <div className="no-print fixed inset-0 z-50 lg:hidden">
          <div
            className="absolute inset-0 bg-stone-900/55 backdrop-blur-sm"
            style={{ animation: 'omg-fade-in 150ms ease-out' }}
            onClick={() => setSidebarOpen(false)}
            aria-hidden
          />
          <div
            className="relative h-full w-[272px] max-w-[85vw] shadow-sheet"
            style={{ animation: 'omg-slide-in-right 200ms var(--ease-out-soft)' }}
          >
            <SidebarContent onNavigate={() => setSidebarOpen(false)} />
          </div>
        </div>
      ) : null}
    </>
  )
}
