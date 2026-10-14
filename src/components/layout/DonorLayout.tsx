import { useEffect, useState } from 'react'
import { Link, NavLink, Outlet, useLocation } from 'react-router-dom'
import { LayoutDashboard, LogIn, Menu, ShoppingBag, UserRound, X } from 'lucide-react'

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
  const cart = useSession((s) => s.cart)
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
    tamil: SECTORS[id].tamil,
    // Sevalaya is a menu: Seva (what it always was) and Gaushala.
    menu: id === 'sevalaya',
  }))
  const links = [
    ...sectorLinks,
    ...(!tenant || tenant.modules.includes('events')
      ? [{ to: '/events', label: 'Events', tamil: 'நிகழ்வுகள்', menu: false }]
      : []),
  ]

  return (
    <div className="flex min-h-screen flex-col bg-navy-50">
      <header className="no-print sticky top-0 z-30 border-b border-sandal-200 bg-white/95 backdrop-blur-md shadow-xs">
        <div className="flex h-16 sm:h-17.5 w-full items-center justify-between px-4 sm:px-6 lg:px-8 xl:px-10">
          <Link to="/" className="flex items-center gap-3 group shrink-0" aria-label="OMG Platform, home">
            <OmgMark size={38} className="transition-transform duration-200 group-hover:scale-105" />
            <div className="leading-tight">
              <span className="block font-heritage text-[20px] sm:text-[23px] font-bold tracking-wide text-stone-900">
                {tenant?.name ?? 'OMG'}
              </span>
              <span className="block text-[9.5px] sm:text-[10px] font-extrabold tracking-[0.2em] text-kumkum-500 uppercase">
                Devotee Portal
              </span>
            </div>
          </Link>

          <span className="mx-2 hidden h-7 w-px bg-sandal-200 lg:block" aria-hidden />

          {/* Nav links styled like omgofficial.com */}
          <nav className="hidden shrink-0 items-center gap-0.5 xl:gap-1.5 lg:flex">
            <NavLink
              to="/"
              className={({ isActive }) =>
                cn(
                  'group relative px-3 py-2 text-xs font-bold uppercase tracking-wider transition-colors',
                  isActive ? 'text-kumkum-500' : 'text-stone-700 hover:text-kumkum-500',
                )
              }
            >
              Home
            </NavLink>
            {links.map((link) =>
              link.menu ? (
                <SevalayaMenu key={link.to} tamil={link.tamil} />
              ) : (
              <NavLink
                key={link.to}
                to={link.to}
                className={({ isActive }) =>
                  cn(
                    'group relative rounded-lg px-3 py-2 transition-colors duration-150',
                    isActive ? 'text-stone-900' : 'text-stone-700 hover:text-kumkum-500',
                  )
                }
              >
                {({ isActive }) => (
                  <>
                    <span className="block text-xs font-bold uppercase tracking-wider leading-tight whitespace-nowrap">
                      {link.label}
                    </span>
                    <span className="block text-[11px] leading-tight whitespace-nowrap text-stone-500">
                      {link.tamil}
                    </span>
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
          <div className="ml-auto flex items-center gap-2 sm:gap-3">
            <Link
              to="/console"
              className="hidden sm:inline-flex items-center justify-center gap-1.5 px-4 py-2 bg-kumkum-500 hover:bg-kumkum-600 text-white font-bold text-xs uppercase tracking-wider rounded-lg shadow-xs transition-all active:scale-95"
            >
              <LayoutDashboard className="size-3.5" aria-hidden />
              <span>Temple Console</span>
            </Link>

            <Link
              to={signedIn ? '/my/donations' : '/login'}
              className="inline-flex items-center justify-center gap-1.5 px-4 py-2 bg-navy-600 hover:bg-navy-700 text-white font-bold text-xs uppercase tracking-wider rounded-lg shadow-xs transition-all active:scale-95"
            >
              {signedIn ? <UserRound className="size-3.5" aria-hidden /> : <LogIn className="size-3.5" aria-hidden />}
              <span className="whitespace-nowrap">{signedIn ? 'My Donations' : 'Devotee Sign In'}</span>
            </Link>

            <Link
              to="/checkout"
              aria-label={`Your offering, ${cart.length} item${cart.length === 1 ? '' : 's'}`}
              className={cn(
                'relative flex items-center justify-center rounded-lg p-2.5 transition-colors duration-150 border',
                cart.length > 0
                  ? 'bg-kumkum-50 border-kumkum-300 text-kumkum-600'
                  : 'border-sandal-200 text-stone-700 hover:bg-sandal-100',
              )}
            >
              <ShoppingBag className="size-4.5" aria-hidden />
              {cart.length > 0 ? (
                <span className="absolute -top-1.5 -right-1.5 flex size-5 items-center justify-center rounded-full bg-kumkum-500 font-mono text-[11px] font-bold text-white shadow-xs">
                  {cart.length}
                </span>
              ) : null}
            </Link>

            <button
              type="button"
              onClick={() => setMenuOpen((v) => !v)}
              aria-label={menuOpen ? 'Close menu' : 'Open menu'}
              aria-expanded={menuOpen}
              className="rounded-lg p-2 text-stone-700 transition-colors duration-150 hover:bg-sandal-100 lg:hidden"
            >
              {menuOpen ? <X className="size-5" aria-hidden /> : <Menu className="size-5" aria-hidden />}
            </button>
          </div>
        </div>

        {/* The toggle is lg:hidden, so this panel is too — it used to be
            md:hidden, which left the button opening nothing between 768px
            and 1024px. */}
        {menuOpen ? (
          <nav className="border-t border-sandal-200 bg-sandal-50 px-4 py-2 lg:hidden">
            {links.map((link) =>
              link.menu ? (
                <div key={link.to} className="py-1">
                  <p className="flex items-baseline justify-between px-3 py-1.5 text-[11px] font-extrabold tracking-[0.14em] text-stone-500 uppercase">
                    {link.label}
                    <span className="text-[12px] font-medium tracking-normal normal-case">{link.tamil}</span>
                  </p>
                  {SEVALAYA_ITEMS.map((sub, i) => (
                    <NavLink
                      key={sub.to}
                      to={sub.to}
                      onClick={() => setMenuOpen(false)}
                      className={({ isActive }) =>
                        cn(
                          'flex items-baseline justify-between rounded-lg py-2.5 pr-3 pl-6 text-[15px] hover:bg-sandal-100',
                          isActive ? 'font-bold text-stone-900' : 'text-stone-700',
                        )
                      }
                    >
                      <span>
                        <span className="font-mono text-[12px] font-bold text-kumkum-600">{i + 1}. </span>
                        {sub.label}
                      </span>
                      <span className="text-[13px] text-stone-500">{sub.tamil}</span>
                    </NavLink>
                  ))}
                </div>
              ) : (
                <NavLink
                  key={link.to}
                  to={link.to}
                  onClick={() => setMenuOpen(false)}
                  className="flex items-baseline justify-between rounded-lg px-3 py-2.5 text-[15px] text-stone-700 hover:bg-sandal-100"
                >
                  {link.label}
                  <span className="text-[13px] text-stone-500">{link.tamil}</span>
                </NavLink>
              ),
            )}
            <NavLink
              to="/console"
              onClick={() => setMenuOpen(false)}
              className="block rounded-lg px-3 py-2.5 text-[15px] text-stone-700 hover:bg-sandal-100"
            >
              Admin console
            </NavLink>
          </nav>
        ) : null}
      </header>

      <main className="flex-1">
        <Outlet />
      </main>

      <Footer />
    </div>
  )
}
