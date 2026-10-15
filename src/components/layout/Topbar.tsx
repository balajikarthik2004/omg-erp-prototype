import { useEffect } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { Building2, ChevronRight, Menu } from 'lucide-react'

import { SECTOR_IDS, SECTORS } from '@/config'
import { cn } from '@/lib/cn'
import { useDb } from '@/store/db'
import { useSession, type SectorFilter } from '@/store/session'
import { locate } from './nav'
import { PersonaSwitcher } from './PersonaSwitcher'

const FILTERS: { value: SectorFilter; label: string; short: string }[] = [
  { value: 'all', label: 'All sectors', short: 'All' },
  ...SECTOR_IDS.map((id) => ({
    value: id as SectorFilter,
    label: SECTORS[id].name,
    short: id === 'sangam' ? 'Heritage' : SECTORS[id].name,
  })),
]

export function Topbar() {
  const setSidebarOpen = useSession((s) => s.setSidebarOpen)
  const sectorFilter = useSession((s) => s.sectorFilter)
  const setSectorFilter = useSession((s) => s.setSectorFilter)
  const { pathname } = useLocation()
  const tenants = useDb((s) => s.tenants)
  const activeTenantId = useDb((s) => s.activeTenantId)
  const switchTenant = useDb((s) => s.switchTenant)
  const tenant = tenants.find((t) => t.id === activeTenantId)
  const filters = FILTERS.filter((f) => f.value === 'all' || !tenant || tenant.verticals.includes(f.value as never))

  // A customer only sees the verticals it enabled.
  useEffect(() => {
    if (sectorFilter !== 'all' && tenant && !tenant.verticals.includes(sectorFilter)) setSectorFilter('all')
  }, [sectorFilter, tenant, setSectorFilter])

  const here = locate(pathname)

  return (
    <header className="no-print sticky top-0 z-30 border-b border-sandal-200 bg-sandal-50/95 backdrop-blur-md">
      <div className="flex h-15 items-center gap-3 px-4 sm:px-6">
        <button
          type="button"
          onClick={() => setSidebarOpen(true)}
          aria-label="Open navigation"
          className="-ml-1 rounded-lg p-2 text-stone-700 transition-colors duration-150 hover:bg-sandal-100 lg:hidden"
        >
          <Menu className="size-5" aria-hidden />
        </button>

        {/* Group then page, so the crumb says which phase of the flow this is. */}
        <nav aria-label="Breadcrumb" className="hidden min-w-0 flex-1 items-center gap-1.5 sm:flex">
          <Link
            to="/console"
            className="shrink-0 text-[12px] font-bold uppercase tracking-[0.06em] text-stone-500 transition-colors duration-150 hover:text-kumkum-600"
          >
            Console
          </Link>
          {here && here.item.to !== '/console' ? (
            <>
              <ChevronRight className="size-3.5 shrink-0 text-sandal-300" aria-hidden />
              <span className="shrink-0 text-[12px] font-bold uppercase tracking-[0.06em] text-stone-500">
                {here.group.label}
              </span>
              <ChevronRight className="size-3.5 shrink-0 text-sandal-300" aria-hidden />
              <span className="truncate text-[14px] font-semibold text-stone-900">{here.item.label}</span>
            </>
          ) : null}
        </nav>

        <div className="flex min-w-0 flex-1 items-center justify-end gap-2.5 sm:flex-none">
          {tenants.length > 1 ? (
            <label className="flex items-center gap-1.5 rounded-lg border border-sandal-200 bg-sandal-50 py-1 pl-2.5 pr-1 text-[13px]">
              <Building2 className="size-4 shrink-0 text-stone-500" aria-hidden />
              <span className="sr-only">Customer</span>
              <select
                aria-label="Customer"
                value={activeTenantId}
                onChange={(e) => switchTenant(e.target.value)}
                className="max-w-40 truncate rounded-md bg-transparent py-0.5 pr-1 text-[13px] font-semibold text-stone-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-navy-400"
              >
                {tenants.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                  </option>
                ))}
              </select>
            </label>
          ) : null}

          <div
            role="group"
            aria-label="Filter by sector"
            className="scrollbar-thin flex min-w-0 items-center gap-0.5 overflow-x-auto rounded-lg border border-sandal-200 bg-sandal-100 p-0.5"
          >
            {filters.map((f) => {
              const active = f.value === sectorFilter
              return (
                <button
                  key={f.value}
                  type="button"
                  onClick={() => setSectorFilter(f.value)}
                  aria-pressed={active}
                  title={f.label}
                  className={cn(
                    'rounded-md px-2.5 py-1 text-[12.5px] whitespace-nowrap transition-colors duration-150',
                    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-navy-400',
                    active
                      ? 'bg-sandal-50 font-bold text-stone-900 shadow-flat'
                      : 'font-medium text-stone-500 hover:text-stone-900',
                  )}
                >
                  {f.short}
                </button>
              )
            })}
          </div>

          <span className="hidden h-6 w-px bg-sandal-200 sm:block" aria-hidden />

          <PersonaSwitcher />
        </div>
      </div>
    </header>
  )
}
