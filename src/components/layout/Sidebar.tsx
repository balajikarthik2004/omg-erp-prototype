import { NavLink } from 'react-router-dom'
import { ExternalLink, X } from 'lucide-react'

import { PHASES } from '@/config'
import { cn } from '@/lib/cn'
import { Kolam, OmgMark } from '@/components/ui/Ornament'
import { useSession, useCurrentUser } from '@/store/session'
import { useDb } from '@/store/db'
import { actionableTasks } from '@/store/selectors'
import { visibleGroups, type NavGroup } from './nav'

/**
 * The group heading. A flow group shows its step number, so the four phases
 * read as a sequence rather than four unrelated folders; a module group shows
 * only its name, because it is a vertical and not a step in the flow.
 */
function GroupHeading({ group }: { group: NavGroup }) {
  const flow = group.kind === 'flow'
  return (
    <div className="mb-1.5 flex items-center gap-2 px-3" title={group.hint}>
      {flow ? (
        <span
          className={cn(
            'flex size-4 shrink-0 items-center justify-center rounded-full font-mono text-[10px] font-bold text-white',
            PHASES[group.phase].markerClass,
          )}
          aria-hidden
        >
          {group.step}
        </span>
      ) : (
        <span className={cn('size-1.5 shrink-0 rounded-full', PHASES[group.phase].markerClass)} aria-hidden />
      )}
      <span className="truncate text-[11px] font-bold uppercase tracking-[0.14em] text-white/55">
        {group.label}
      </span>
    </div>
  )
}

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
    <div
      data-brand={tenant?.brand ?? 'kumkum'}
      className="surface-sanctum flex h-full flex-col border-r border-navy-950/60 text-white"
    >
      <div className="flex items-center justify-between gap-2 border-b border-white/10 px-4 py-4">
        <NavLink to="/console" className="flex min-w-0 items-center gap-2.5" onClick={onNavigate}>
          <OmgMark size={32} onDark />
          <span className="min-w-0 leading-none">
            <span className="block truncate font-display text-[15px] font-semibold tracking-tight text-white">
              {tenant?.name ?? 'OMG'}
            </span>
            <span className="mt-1 block text-[10px] font-bold uppercase tracking-[0.16em] text-white/45">
              Admin console
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

      <nav aria-label="Console" className="scrollbar-thin flex-1 overflow-y-auto px-2.5 py-4">
        {groups.map((group, i) => {
          const startsVerticals = group.kind === 'module' && groups[i - 1]?.kind !== 'module'
          return (
            <div
              key={`${group.kind}-${group.label}`}
              className={cn('mb-5', startsVerticals && 'mt-1 border-t border-white/10 pt-5')}
            >
              <GroupHeading group={group} />
              <ul className="flex flex-col gap-0.5">
                {group.items.map((item) => {
                  const Icon = item.icon
                  const count = item.badge === 'approvals' ? myTasks : item.badge === 'eventApprovals' ? myEventTasks : 0
                  return (
                    <li key={item.to}>
                      <NavLink
                        to={item.to}
                        end={item.end}
                        onClick={onNavigate}
                        className={({ isActive }) =>
                          cn(
                            'group relative flex items-center gap-2.5 rounded-lg py-2 pl-3 pr-2.5 text-[13.5px]',
                            'transition-colors duration-150',
                            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/40',
                            isActive
                              ? 'bg-white/10 font-semibold text-white'
                              : 'font-medium text-white/70 hover:bg-white/5 hover:text-white',
                          )
                        }
                      >
                        {({ isActive }) => (
                          <>
                            <span
                              className={cn(
                                'absolute left-0 top-1/2 h-4.5 w-[3px] -translate-y-1/2 rounded-r-full bg-kumkum-500',
                                'transition-opacity duration-150',
                                isActive ? 'opacity-100' : 'opacity-0',
                              )}
                              aria-hidden
                            />
                            <Icon
                              className={cn(
                                'size-4 shrink-0 transition-colors duration-150',
                                isActive ? 'text-kumkum-400' : 'text-white/50 group-hover:text-white/80',
                              )}
                              aria-hidden
                            />
                            <span className="flex-1 truncate">{item.label}</span>
                            {count > 0 ? (
                              <span
                                className="rounded-full bg-kumkum-600 px-1.5 py-0.5 font-mono text-[10.5px] font-bold tabular-nums text-white"
                                aria-label={`${count} waiting`}
                              >
                                {count}
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
          )
        })}
      </nav>

      <div className="border-t border-white/10 px-4 py-3.5">
        <NavLink
          to="/"
          onClick={onNavigate}
          className="inline-flex items-center gap-1.5 text-[12.5px] font-semibold text-white/70 transition-colors duration-150 hover:text-white"
        >
          <ExternalLink className="size-3.5" aria-hidden />
          <span>Open the donor site</span>
        </NavLink>
        <div className="mt-2.5 flex items-end justify-between gap-2">
          <p className="text-[11px] leading-relaxed text-white/35">
            Every entry is signed by two people.
          </p>
          <Kolam className="-mb-1 -mr-1 shrink-0 text-white/10" size={44} />
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
      <aside className="no-print hidden w-[252px] shrink-0 lg:block">
        <div className="fixed inset-y-0 left-0 w-[252px]">
          <SidebarContent />
        </div>
      </aside>

      {sidebarOpen ? (
        <div className="no-print fixed inset-0 z-50 lg:hidden">
          <div
            className="absolute inset-0 bg-navy-950/60 backdrop-blur-sm"
            style={{ animation: 'omg-fade-in 150ms ease-out' }}
            onClick={() => setSidebarOpen(false)}
            aria-hidden
          />
          <div
            className="relative h-full w-[276px] max-w-[85vw] shadow-sheet"
            style={{ animation: 'omg-slide-in-right 200ms var(--ease-out-soft)' }}
          >
            <SidebarContent onNavigate={() => setSidebarOpen(false)} />
          </div>
        </div>
      ) : null}
    </>
  )
}
