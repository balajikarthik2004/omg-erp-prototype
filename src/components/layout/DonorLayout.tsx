import { useEffect, useState } from 'react'
import { Link, NavLink, Outlet, useLocation } from 'react-router-dom'
import { CalendarDays, LogIn, Menu, UserRound, X } from 'lucide-react'

import { SECTOR_IDS, SECTORS } from '@/config'
import { cn } from '@/lib/cn'
import { OmgMark } from '@/components/ui/Ornament'
import { useDb } from '@/store/db'
import { useSession } from '@/store/session'
import { Footer } from './Footer'
import { SevalayaMenu } from './SevalayaMenu'
import { SEVALAYA_ITEMS } from './sevalayaNav'

export function DonorLayout() {
  const load = useDb((s) => s.load)
  const signedIn = useSession((s) => s.signedIn)
  const [menuOpen, setMenuOpen] = useState(false)
  const { pathname } = useLocation()

  useEffect(() => {
    void load()
  }, [load])

  useEffect(() => {
    window.scrollTo({ top: 0 })
  }, [pathname])

  const tenant = useDb((s) => s.tenants.find((t) => t.id === s.activeTenantId))
  const sectorLinks = SECTOR_IDS.filter((id) => !tenant || tenant.verticals.includes(id)).map((id) => ({
    to: `/donate/${id}`,
    label: SECTORS[id].name,
    menu: id === 'sevalaya',
  }))
  const links = [
    ...sectorLinks,
    ...(!tenant || tenant.modules.includes('events')
      ? [{ to: '/events', label: 'Events', menu: false }]
      : []),
  ]

  return (
    <div className="surface-console flex min-h-screen flex-col">
      <header className="no-print sticky top-0 z-30 border-b border-stone-200/80 bg-white/95 backdrop-blur-md shadow-xs">
        <div className="flex h-16 sm:h-17.5 w-full items-center justify-between px-4 sm:px-6 lg:px-8 xl:px-10">
          <Link to="/" className="flex items-center gap-3 group shrink-0" aria-label="OMG Platform, home">
            <OmgMark size={38} className="transition-transform duration-200 group-hover:scale-105" />
            <div className="leading-tight">
              <span className="block font-heritage text-[21px] sm:text-[23px] font-black tracking-tight text-navy-950">
                {tenant?.name ?? 'OMG'}
              </span>
              <span className="block text-[9.5px] sm:text-[10px] font-extrabold tracking-[0.2em] text-kumkum-500 uppercase">
                Devotee Portal
              </span>
            </div>
          </Link>

          <span className="mx-3 hidden h-7 w-px bg-stone-200 lg:block" aria-hidden />

          {/* Clean English Nav Links */}
          <nav className="hidden shrink-0 items-center gap-1 xl:gap-2.5 lg:flex">
            <NavLink
              to="/"
              className={({ isActive }) =>
                cn(
                  'group relative px-3 py-2 text-[13px] font-bold tracking-wide transition-colors',
                  isActive
                    ? 'text-kumkum-500 border-b-2 border-kumkum-500'
                    : 'text-stone-700 hover:text-kumkum-500',
                )
              }
            >
              Home
            </NavLink>
            {links.map((link) =>
              link.menu ? (
                <SevalayaMenu key={link.to} />
              ) : (
                <NavLink
                  key={link.to}
                  to={link.to}
                  className={({ isActive }) =>
                    cn(
                      'group relative flex items-center gap-1 rounded-lg px-3 py-2 text-[13px] font-bold tracking-wide transition-colors duration-150',
                      isActive ? 'text-navy-950' : 'text-stone-700 hover:text-kumkum-500',
                    )
                  }
                >
                  {({ isActive }) => (
                    <>
                      <span>{link.label}</span>
                      <span
                        className={cn(
                          'absolute inset-x-3 -bottom-1 h-0.5 rounded-full bg-kumkum-500 transition-opacity duration-150',
                          isActive ? 'opacity-100' : 'opacity-0',
                        )}
                        aria-hidden
                      />
                    </>
                  )}
                </NavLink>
              ),
            )}
          </nav>

          {/* Right Action Buttons: Red Temple Console & Navy Devotee Sign In */}
          <div className="ml-auto flex items-center gap-2 sm:gap-2.5">
            <Link
              to="/console"
              className="hidden sm:inline-flex items-center justify-center gap-2 px-4 py-2 bg-kumkum-500 hover:bg-kumkum-600 text-white font-extrabold text-[11.5px] uppercase tracking-wider rounded-lg shadow-xs transition-all active:scale-95 cursor-pointer"
            >
              <CalendarDays className="size-4" aria-hidden />
              <span>Temple Console</span>
            </Link>

            <Link
              to={signedIn ? '/my/donations' : '/login'}
              className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-navy-800 hover:bg-navy-900 text-white font-extrabold text-[11.5px] uppercase tracking-wider rounded-lg shadow-xs transition-all active:scale-95 cursor-pointer"
            >
              {signedIn ? <UserRound className="size-4" aria-hidden /> : <LogIn className="size-4" aria-hidden />}
              <span className="whitespace-nowrap">{signedIn ? 'My Donations' : 'Devotee Sign In'}</span>
            </Link>

            <button
              type="button"
              onClick={() => setMenuOpen((v) => !v)}
              aria-label={menuOpen ? 'Close menu' : 'Open menu'}
              aria-expanded={menuOpen}
              className="rounded-lg p-2 text-stone-700 transition-colors duration-150 hover:bg-stone-100 lg:hidden"
            >
              {menuOpen ? <X className="size-5" aria-hidden /> : <Menu className="size-5" aria-hidden />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation Panel */}
        {menuOpen ? (
          <nav className="border-t border-stone-200 bg-white px-4 py-3 lg:hidden shadow-lg">
            {links.map((link) =>
              link.menu ? (
                <div key={link.to} className="py-1">
                  <p className="px-3 py-1.5 text-[11px] font-extrabold tracking-[0.14em] text-stone-400 uppercase">
                    {link.label}
                  </p>
                  {SEVALAYA_ITEMS.map((sub, i) => (
                    <NavLink
                      key={sub.to}
                      to={sub.to}
                      onClick={() => setMenuOpen(false)}
                      className={({ isActive }) =>
                        cn(
                          'flex items-center justify-between rounded-lg py-2.5 pr-3 pl-6 text-[14.5px] hover:bg-stone-50',
                          isActive ? 'font-bold text-navy-950' : 'text-stone-700',
                        )
                      }
                    >
                      <span>
                        <span className="font-mono text-[12px] font-bold text-kumkum-600">{i + 1}. </span>
                        {sub.label}
                      </span>
                    </NavLink>
                  ))}
                </div>
              ) : (
                <NavLink
                  key={link.to}
                  to={link.to}
                  onClick={() => setMenuOpen(false)}
                  className="flex items-center justify-between rounded-lg px-3 py-2.5 text-[14.5px] font-semibold text-stone-700 hover:bg-stone-50"
                >
                  {link.label}
                </NavLink>
              ),
            )}
            <NavLink
              to="/console"
              onClick={() => setMenuOpen(false)}
              className="block rounded-lg px-3 py-2.5 text-[14.5px] font-semibold text-kumkum-600 hover:bg-stone-50"
            >
              Temple Console
            </NavLink>
          </nav>
        ) : null}
      </header>

      <main className="flex-1">
        <Outlet />
      </main>

      {/* Footer */}
      {pathname.startsWith('/receipt/') ? null : <Footer />}
    </div>
  )
}
