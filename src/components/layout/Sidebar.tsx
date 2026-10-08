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
  const groups = visibleGroups(user.role)
  const myTasks = db.ready ? actionableTasks(db, sectorFilter, user).length : 0

  return (
    <div className="flex h-full flex-col surface-sanctum text-sandal-100">
      <div className="flex items-center justify-between gap-2 px-5 py-5">
        <NavLink to="/console" className="flex items-center gap-3" onClick={onNavigate}>
          <OmgMark size={36} />
          <span className="leading-none">
            <span className="block font-display text-[19px] tracking-wide text-sandal-50">OMG</span>
            <span className="mt-1 block text-[10px] tracking-[0.18em] text-turmeric-400/75 uppercase">
              Console
            </span>
          </span>
        </NavLink>
        {onNavigate ? (
          <button
            type="button"
            onClick={onNavigate}
            aria-label="Close navigation"
            className="rounded-lg p-1.5 text-sandal-200 transition-colors duration-150 hover:bg-sandal-50/10 lg:hidden"
          >
            <X className="size-5" aria-hidden />
          </button>
        ) : null}
      </div>

      <nav className="scrollbar-thin flex-1 overflow-y-auto px-3 pb-4">
        {groups.map((group) => (
          <div key={`${group.phase}-${group.label}`} className="mb-6">
            <div className="mb-2 flex items-center gap-2 px-3">
              <span className={cn('h-2.5 w-0.5 rounded-full', PHASES[group.phase].markerClass)} aria-hidden />
              <span className="text-[10px] font-semibold tracking-[0.16em] text-sandal-200/50 uppercase">
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
                          'group relative flex items-center gap-3 rounded-lg px-3 py-2 text-[14px] transition-colors duration-150',
                          isActive
                            ? 'bg-sandal-50/12 font-medium text-sandal-50'
                            : 'text-sandal-100/75 hover:bg-sandal-50/[0.07] hover:text-sandal-50',
                        )
                      }
                    >
                      {({ isActive }) => (
                        <>
                          <span
                            className={cn(
                              'absolute top-1/2 -left-3 h-5 w-[3px] -translate-y-1/2 rounded-r-full bg-turmeric-500 transition-opacity duration-150',
                              isActive ? 'opacity-100' : 'opacity-0',
                            )}
                            aria-hidden
                          />
                          <Icon
                            className={cn(
                              'size-[17px] shrink-0 transition-colors duration-150',
                              isActive ? 'text-turmeric-400' : 'text-sandal-200/55 group-hover:text-sandal-100',
                            )}
                            aria-hidden
                          />
                          <span className="flex-1 truncate">{item.label}</span>
                          {item.badge === 'approvals' && myTasks > 0 ? (
                            <span className="rounded-full bg-turmeric-500 px-1.5 py-px font-mono text-[11px] font-semibold text-stone-900 tabular-nums">
                              {myTasks}
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

      <div className="border-t border-sandal-50/10 px-5 py-4">
        <NavLink
          to="/"
          onClick={onNavigate}
          className="inline-flex items-center gap-1.5 text-[13px] text-sandal-200/70 transition-colors duration-150 hover:text-turmeric-400"
        >
          <ExternalLink className="size-3.5" aria-hidden />
          Open the donor site
        </NavLink>
        <div className="mt-3 flex items-end justify-between">
          <p className="text-[11px] leading-relaxed text-sandal-200/40">
            Prototype build
            <br />
            Mock data · no live payments
          </p>
          <Kolam className="-mr-1 -mb-1 text-turmeric-400/30" size={52} />
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
