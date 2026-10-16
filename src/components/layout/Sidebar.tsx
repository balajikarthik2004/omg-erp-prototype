import { useState } from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import { ChevronDown, ExternalLink, PanelLeftOpen, PanelLeftClose, X } from 'lucide-react'

import { PHASES } from '@/config'
import { cn } from '@/lib/cn'
import { Kolam, OmgMark } from '@/components/ui/Ornament'
import { useSession, useCurrentUser } from '@/store/session'
import { useDb } from '@/store/db'
import { actionableTasks } from '@/store/selectors'
import { visibleGroups, type NavGroup, type NavItem } from './nav'

/**
 * The money flow is the point of this console, so its groups start open and
 * the optional verticals start closed. Three verticals are 23 of a partner's
 * 40 links; left open they push Collect and Control off the screen.
 *
 * Unless a vertical is all the person has. A Gaushala admin's whole menu is
 * one module group, and closing it by default would leave them staring at an
 * empty sidebar, so `onlyModules` opens it again.
 */
function defaultOpen(group: NavGroup, onlyModules: boolean) {
  return onlyModules || group.kind !== 'module'
}

const RAIL = 'w-[68px]'
const FULL = 'w-[252px]'

/**
 * The group heading. Every group carries a dot in its phase colour, so the
 * sidebar still reads as Collect, Control, Spend, Report without numbering
 * the steps.
 *
 * Collapsed to the rail there is no room for a label, so the dot stands alone
 * and carries the group name as its title.
 */
function GroupHeading({
  group,
  collapsed,
  open,
  onToggle,
}: {
  group: NavGroup
  collapsed: boolean
  open: boolean
  onToggle: () => void
}) {
  const marker = (
    <span
      className={cn(
        'size-1.5 shrink-0 rounded-full transition-transform duration-150 ease-out-soft',
        'motion-safe:group-hover/head:scale-150',
        PHASES[group.phase].markerClass,
      )}
      aria-hidden
    />
  )

  if (collapsed) {
    return (
      <div className="mb-1.5 flex justify-center" title={group.label}>
        {marker}
      </div>
    )
  }

  return (
    <button
      type="button"
      onClick={onToggle}
      aria-expanded={open}
      title={group.hint}
      className={cn(
        'group/head mb-1.5 flex w-full items-center gap-2 rounded-md px-3 py-1 text-left',
        'transition-colors duration-150 ease-out-soft hover:bg-white/5',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/40',
      )}
    >
      {marker}
      <span className="flex-1 truncate text-[11px] font-bold uppercase tracking-[0.14em] text-white/75 transition-colors duration-150 group-hover/head:text-white">
        {group.label}
      </span>
      <ChevronDown
        className={cn(
          'size-3.5 shrink-0 text-white/55 transition-all duration-150 ease-out-soft group-hover/head:text-white/85',
          open ? 'rotate-0' : '-rotate-90',
        )}
        aria-hidden
      />
    </button>
  )
}

function NavRow({
  item,
  count,
  collapsed,
  onNavigate,
}: {
  item: NavItem
  count: number
  collapsed: boolean
  onNavigate?: () => void
}) {
  const Icon = item.icon
  return (
    <NavLink
      to={item.to}
      end={item.end}
      onClick={onNavigate}
      title={collapsed ? item.label : undefined}
      className={({ isActive }) =>
        cn(
          'group relative flex items-center overflow-hidden rounded-lg py-2 text-[13.5px]',
          'transition-[background-color,color,transform,box-shadow] duration-150 ease-out-soft',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/40',
          collapsed ? 'justify-center px-0' : 'gap-2.5 pl-3 pr-2.5',
          isActive
            ? // A lit shelf rather than a flat tint: a hairline along the top
              // edge and a wash that fades to the right, so the active row
              // reads as raised instead of merely darker.
              'bg-white/12 font-semibold text-white shadow-[inset_0_1px_0_rgb(255_255_255/0.14)]'
            : cn(
                'font-medium text-white/80 hover:bg-white/8 hover:text-white',
                // On the rail the row is centred, so a sideways nudge would
                // read as a wobble rather than as a lean toward the label.
                !collapsed && 'motion-safe:hover:translate-x-0.5',
              ),
        )
      }
    >
      {({ isActive }) => (
        <>
          {/* The active marker. On hover it appears as a short stub, so the
              row shows where it is about to land before you commit. */}
          <span
            className={cn(
              'absolute left-0 top-1/2 w-[3px] -translate-y-1/2 rounded-r-full bg-kumkum-200',
              'transition-all duration-150 ease-out-soft',
              isActive ? 'h-4.5 opacity-100' : 'h-2 opacity-0 group-hover:h-3 group-hover:opacity-70',
            )}
            aria-hidden
          />
          <span className="relative shrink-0">
            <Icon
              className={cn(
                'size-4 transition-colors duration-150 ease-out-soft',
                isActive ? 'text-kumkum-200' : 'text-white/65 group-hover:text-kumkum-200',
              )}
              aria-hidden
            />
            {/* On the rail the count has nowhere to sit, so it becomes a dot. */}
            {collapsed && count > 0 ? (
              <span
                className="absolute -right-1 -top-1 size-2 rounded-full bg-kumkum-200 ring-2 ring-white/25"
                aria-hidden
              />
            ) : null}
          </span>

          {collapsed ? (
            <span className="sr-only">
              {item.label}
              {count > 0 ? `, ${count} waiting` : ''}
            </span>
          ) : (
            <>
              <span className="flex-1 truncate">{item.label}</span>
              {count > 0 ? (
                <span
                  className="rounded-full bg-kumkum-200 px-1.5 py-0.5 font-mono text-[10.5px] font-bold tabular-nums text-navy-800"
                  aria-label={`${count} waiting`}
                >
                  {count}
                </span>
              ) : null}
            </>
          )}
        </>
      )}
    </NavLink>
  )
}

function CollapsedLogoToggle({ onToggle }: { onToggle: () => void }) {
  const [hovered, setHovered] = useState(false)

  return (
    <div className="relative flex shrink-0 items-center justify-center border-b border-white/10 py-4">
      <button
        type="button"
        onClick={onToggle}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        onFocus={() => setHovered(true)}
        onBlur={() => setHovered(false)}
        aria-label="Toggle sidebar"
        className={cn(
          'relative flex size-10 items-center justify-center rounded-xl cursor-pointer',
          'transition-all duration-200 ease-out-soft',
          hovered ? 'bg-white/15 ring-1 ring-white/20' : 'hover:bg-white/15',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/40',
        )}
      >
        {/* Default State: OMG Logo */}
        <span
          className={cn(
            'flex items-center justify-center transition-all duration-200 ease-out-soft',
            hovered ? 'opacity-0 scale-75 pointer-events-none' : 'opacity-100 scale-100',
          )}
        >
          <OmgMark size={32} onDark />
        </span>

        {/* Hover State: Sidebar Toggle Icon */}
        <span
          className={cn(
            'absolute inset-0 flex items-center justify-center text-white transition-all duration-200 ease-out-soft',
            hovered ? 'opacity-100 scale-100' : 'opacity-0 scale-75 pointer-events-none',
          )}
          aria-hidden
        >
          <PanelLeftOpen className="size-5" />
        </span>

        {/* Tooltip on Hover */}
        <div
          role="tooltip"
          className={cn(
            'pointer-events-none absolute left-full top-1/2 ml-3 -translate-y-1/2 z-50 transition-all duration-150 ease-out-soft',
            hovered ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-1.5 pointer-events-none',
          )}
        >
          <div className="flex items-center rounded-lg bg-navy-950/95 px-3 py-1.5 text-[12px] font-medium text-white shadow-xl ring-1 ring-white/15 backdrop-blur-md whitespace-nowrap">
            Toggle sidebar
          </div>
        </div>
      </button>
    </div>
  )
}

function ExpandedRailToggle({ onToggle }: { onToggle: () => void }) {
  const [hovered, setHovered] = useState(false)

  return (
    <div className="relative hidden lg:block">
      <button
        type="button"
        onClick={onToggle}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        onFocus={() => setHovered(true)}
        onBlur={() => setHovered(false)}
        aria-label="Toggle sidebar"
        className={cn(
          'shrink-0 rounded-lg border border-white/10 p-1.5 text-white/70 cursor-pointer',
          'transition-colors duration-150 ease-out-soft hover:border-white/20 hover:bg-white/10 hover:text-white',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/40',
        )}
      >
        <PanelLeftClose className="size-4" aria-hidden />
      </button>
      <div
        role="tooltip"
        className={cn(
          'pointer-events-none absolute right-0 top-full mt-2 z-50 transition-all duration-150 ease-out-soft',
          hovered ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-0.5 pointer-events-none',
        )}
      >
        <div className="rounded-lg bg-navy-950/95 px-2.5 py-1 text-[11px] font-medium text-white shadow-xl ring-1 ring-white/15 backdrop-blur-md whitespace-nowrap">
          Toggle sidebar
        </div>
      </div>
    </div>
  )
}

function SidebarContent({ onNavigate, collapsed = false }: { onNavigate?: () => void; collapsed?: boolean }) {
  const user = useCurrentUser()
  const sectorFilter = useSession((s) => s.sectorFilter)
  const toggleCollapsed = useSession((s) => s.toggleSidebarCollapsed)
  const openGroups = useSession((s) => s.navOpenGroups)
  const toggleGroup = useSession((s) => s.toggleNavGroup)
  const { pathname } = useLocation()
  const db = useDb()
  const tenant = db.tenants.find((t) => t.id === db.activeTenantId)
  const groups = visibleGroups(user.role, tenant?.modules)
  const mine = db.ready ? actionableTasks(db, sectorFilter, user) : []
  const myTasks = mine.length
  const myEventTasks = mine.filter((t) => t.kind.startsWith('event_') && t.kind !== 'event_order').length

  const onlyModules = groups.every((g) => g.kind === 'module')

  function isOpen(group: NavGroup) {
    if (collapsed) return true
    const holdsCurrent = group.items.some((i) => (i.end ? pathname === i.to : pathname.startsWith(i.to)))
    if (holdsCurrent) return true
    return openGroups[group.label] ?? defaultOpen(group, onlyModules)
  }

  return (
    <div
      data-brand={tenant?.brand ?? 'kumkum'}
      className="surface-sanctum relative z-40 flex h-full flex-col border-r border-navy-700/60 text-white"
    >
      {/* Header / Brand block: when collapsed, hovering the logo reveals the toggle button with a tooltip */}
      {collapsed ? (
        <CollapsedLogoToggle onToggle={toggleCollapsed} />
      ) : (
        <div className="flex shrink-0 items-center justify-between gap-2 border-b border-white/10 px-4 py-4">
          <NavLink
            to="/console"
            className="group/brand flex min-w-0 items-center gap-2.5 rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/40"
            onClick={onNavigate}
          >
            <span className="shrink-0 transition-transform duration-200 ease-out-soft motion-safe:group-hover/brand:scale-105">
              <OmgMark size={32} onDark />
            </span>
            <span className="min-w-0 leading-none">
              <span className="block truncate font-display text-[15px] font-semibold tracking-tight text-white">
                {tenant?.name ?? 'OMG'}
              </span>
              <span className="mt-1 block text-[10px] font-bold uppercase tracking-[0.16em] text-white/65">
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

          {/* Desktop rail toggle */}
          <ExpandedRailToggle onToggle={toggleCollapsed} />
        </div>
      )}

      {/* A group holding the page you are on is always open, whatever was
          stored — otherwise the active row could be hidden from view. */}
      <nav
        aria-label="Console"
        className={cn(
          'scrollbar-thin scroll-fade-y min-h-0 flex-1 overflow-y-auto py-4',
          collapsed ? 'px-3' : 'px-2.5',
        )}
      >
        {groups.map((group, i) => {
          const startsVerticals = group.kind === 'module' && groups[i - 1]?.kind !== 'module'
          return (
            <div
              key={`${group.kind}-${group.label}`}
              className={cn('mb-5', startsVerticals && 'mt-1 border-t border-white/10 pt-5')}
            >
              <GroupHeading
                group={group}
                collapsed={collapsed}
                open={isOpen(group)}
                onToggle={() => toggleGroup(group.label, !isOpen(group))}
              />
              {isOpen(group) ? (
                <ul className="flex flex-col gap-0.5">
                  {group.items.map((item) => (
                    <li key={item.to}>
                      <NavRow
                        item={item}
                        collapsed={collapsed}
                        onNavigate={onNavigate}
                        count={
                          item.badge === 'approvals' ? myTasks : item.badge === 'eventApprovals' ? myEventTasks : 0
                        }
                      />
                    </li>
                  ))}
                </ul>
              ) : null}
            </div>
          )
        })}
      </nav>

      <div className={cn('shrink-0 border-t border-white/10 bg-navy-950/30 py-3', collapsed ? 'px-3' : 'px-4')}>
        {collapsed ? (
          <NavLink
            to="/"
            onClick={onNavigate}
            aria-label="Open the donor site"
            title="Open the donor site"
            className="flex items-center justify-center rounded-lg py-2 text-white/70 transition-colors duration-150 ease-out-soft hover:bg-white/5 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/40"
          >
            <ExternalLink className="size-4" aria-hidden />
          </NavLink>
        ) : (
          <div className="flex items-end justify-between gap-2">
            <NavLink
              to="/"
              onClick={onNavigate}
              className="inline-flex items-center gap-1.5 rounded-lg px-2 py-1 text-[12.5px] font-semibold text-white/85 transition-colors duration-150 ease-out-soft hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/40"
            >
              <ExternalLink className="size-3.5" aria-hidden />
              <span>Open the donor site</span>
            </NavLink>
            {/* The one ornament in the console chrome. */}
            <Kolam className="-mb-1 -mr-1 shrink-0 text-white/10" size={44} aria-hidden />
          </div>
        )}
      </div>
    </div>
  )
}

export function Sidebar() {
  const sidebarOpen = useSession((s) => s.sidebarOpen)
  const setSidebarOpen = useSession((s) => s.setSidebarOpen)
  const collapsed = useSession((s) => s.sidebarCollapsed)

  return (
    <>
      <aside className={cn('no-print hidden shrink-0 lg:block relative z-40', collapsed ? RAIL : FULL)}>
        <div className={cn('fixed inset-y-0 left-0 z-40', collapsed ? RAIL : FULL)}>
          <SidebarContent collapsed={collapsed} />
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
            {/* The drawer is always full width — a rail inside it is pointless. */}
            <SidebarContent onNavigate={() => setSidebarOpen(false)} />
          </div>
        </div>
      ) : null}
    </>
  )
}
