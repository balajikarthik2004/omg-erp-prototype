import { useEffect } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { Building2, ChevronRight, Menu } from 'lucide-react'

import { SECTOR_IDS, SECTORS } from '@/config'
import { cn } from '@/lib/cn'
import { useDb } from '@/store/db'
import { useSession, type SectorFilter } from '@/store/session'
import { ALL_NAV_ITEMS } from './nav'
import { PersonaSwitcher } from './PersonaSwitcher'

const FILTERS: { value: SectorFilter; label: string; short: string }[] = [
  { value: 'all', label: 'All sectors', short: 'All' },
  ...SECTOR_IDS.map((id) => ({
    value: id as SectorFilter,
    label: SECTORS[id].name,
    short: SECTORS[id].name === 'Tamil Sangam' ? 'Sangam' : SECTORS[id].name,
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

  const current = [...ALL_NAV_ITEMS]
    .sort((a, b) => b.to.length - a.to.length)
    .find((item) => pathname.startsWith(item.to))

  return (
    <header className="no-print sticky top-0 z-30 border-b border-sandal-200 bg-sandal-50/85 backdrop-blur-md">
      <div className="flex h-15 items-center gap-3 px-4 sm:px-6">
        <button
          type="button"
          onClick={() => setSidebarOpen(true)}
          aria-label="Open navigation"
          className="-ml-1 rounded-lg p-2 text-stone-700 transition-colors duration-150 hover:bg-sandal-100 lg:hidden"
        >
          <Menu className="size-5" aria-hidden />
        </button>

        {/* Breadcrumb */}
        <nav aria-label="Breadcrumb" className="hidden min-w-0 flex-1 items-center gap-1.5 sm:flex">
          <Link to="/console" className="text-[13px] text-stone-500 transition-colors duration-150 hover:text-stone-900">
            Console
          </Link>
          {current && current.to !== '/console' ? (
            <>
              <ChevronRight className="size-3.5 shrink-0 text-sandal-300" aria-hidden />
              <span className="truncate text-[14px] font-medium text-stone-900">{current.label}</span>
            </>
          ) : null}
        </nav>

        <div className="flex flex-1 items-center justify-end gap-2 sm:flex-none">
          {tenants.length > 1 ? (
            <label className="flex items-center gap-1.5 rounded-lg border border-sandal-200 bg-sandal-100 py-1 pr-1 pl-2.5 text-[13px] text-stone-700">
              <Building2 className="size-4 text-stone-500" aria-hidden />
              <span className="sr-only">Customer</span>
              <select
                aria-label="Customer"
                value={activeTenantId}
                onChange={(e) => switchTenant(e.target.value)}
                className="max-w-[160px] truncate rounded-md bg-transparent py-0.5 pr-1 text-[13px] font-medium text-stone-900 focus-visible:ring-2 focus-visible:ring-turmeric-400 focus-visible:outline-none"
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
            className="flex items-center gap-0.5 rounded-lg border border-sandal-200 bg-sandal-100 p-0.5"
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
                    'rounded-md px-2.5 py-1 text-[13px] whitespace-nowrap transition-all duration-150',
                    active
                      ? 'bg-sandal-50 font-medium text-stone-900 shadow-flat'
                      : 'text-stone-500 hover:text-stone-900',
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
