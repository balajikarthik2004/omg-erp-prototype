import { useEffect, useState } from 'react'
import { Link, NavLink, Outlet, useLocation } from 'react-router-dom'
import { LayoutDashboard, LogIn, Menu, ShoppingBag, UserRound, X } from 'lucide-react'

import { SECTOR_IDS, SECTORS } from '@/config'
import { cn } from '@/lib/cn'
import { OmgMark } from '@/components/ui/Ornament'
import { useDb } from '@/store/db'
import { useSession } from '@/store/session'
import { Footer } from './Footer'

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
  const links = SECTOR_IDS.filter((id) => !tenant || tenant.verticals.includes(id)).map((id) => ({
    to: `/donate/${id}`,
    label: SECTORS[id].name,
    tamil: SECTORS[id].tamil,
  }))

  return (
    <div className="flex min-h-screen flex-col bg-sandal-50">
      <header className="no-print sticky top-0 z-30 border-b border-sandal-200 bg-sandal-50/90 backdrop-blur-md">
        <div className="mx-auto flex h-19.5 max-w-6xl items-center gap-4 px-5 sm:px-8">
          <Link to="/" className="flex items-center gap-3" aria-label="OMG Platform, home">
            <OmgMark size={46} />
            <span className="leading-none">
              <span className="block max-w-65 truncate font-heritage text-[29px] leading-none font-semibold tracking-wide text-stone-900">
                {tenant?.name ?? 'OMG'}
              </span>
              <span className="mt-0.5 block text-[11px] tracking-[0.14em] text-stone-500 uppercase">
                Offerings
              </span>
            </span>
          </Link>

          <span className="mx-1 hidden h-7 w-px bg-sandal-200 md:block" aria-hidden />

          <nav className="hidden items-center gap-0.5 md:flex">
            {links.map((link) => (
              <NavLink
                key={link.to}
                to={link.to}
                className={({ isActive }) =>
                  cn(
                    'group relative rounded-lg px-3 py-2 transition-colors duration-150',
                    isActive ? 'text-stone-900' : 'text-stone-700 hover:bg-sandal-100',
                  )
                }
              >
                {({ isActive }) => (
                  <>
                    <span className="block text-[14px] leading-tight font-medium">{link.label}</span>
                    <span className="block text-[12px] leading-tight text-stone-500">{link.tamil}</span>
                    <span
                      className={cn(
                        'absolute inset-x-3 -bottom-px h-0.5 rounded-full bg-turmeric-500 transition-opacity duration-150',
                        isActive ? 'opacity-100' : 'opacity-0',
                      )}
                      aria-hidden
                    />
                  </>
                )}
              </NavLink>
            ))}
          </nav>

          <div className="ml-auto flex items-center gap-1">
            <Link
              to="/console"
              className="hidden items-center gap-1.5 rounded-lg px-3 py-2 text-[14px] text-stone-700 transition-colors duration-150 hover:bg-sandal-100 lg:flex"
            >
              <LayoutDashboard className="size-4" aria-hidden />
              Console
            </Link>
            <Link
              to={signedIn ? '/my/donations' : '/login'}
              className="flex items-center gap-1.5 rounded-lg px-3 py-2 text-[14px] text-stone-700 transition-colors duration-150 hover:bg-sandal-100"
            >
              {signedIn ? <UserRound className="size-4" aria-hidden /> : <LogIn className="size-4" aria-hidden />}
              <span className="hidden sm:inline">{signedIn ? 'My donations' : 'Sign in'}</span>
            </Link>

            <Link
              to="/checkout"
              aria-label={`Your offering, ${cart.length} item${cart.length === 1 ? '' : 's'}`}
              className={cn(
                'relative flex items-center gap-2 rounded-lg px-3 py-2 transition-colors duration-150',
                cart.length > 0
                  ? 'bg-kumkum-600 text-sandal-50 hover:bg-kumkum-700'
                  : 'text-stone-700 hover:bg-sandal-100',
              )}
            >
              <ShoppingBag className="size-4.5" aria-hidden />
              {cart.length > 0 ? (
                <span className="font-mono text-[13px] tabular-nums">{cart.length}</span>
              ) : null}
            </Link>

            <button
              type="button"
              onClick={() => setMenuOpen((v) => !v)}
              aria-label={menuOpen ? 'Close menu' : 'Open menu'}
              aria-expanded={menuOpen}
              className="rounded-lg p-2 text-stone-700 transition-colors duration-150 hover:bg-sandal-100 md:hidden"
            >
              {menuOpen ? <X className="size-5" aria-hidden /> : <Menu className="size-5" aria-hidden />}
            </button>
          </div>
        </div>

        {menuOpen ? (
          <nav className="border-t border-sandal-200 bg-sandal-50 px-4 py-2 md:hidden">
            {links.map((link) => (
              <NavLink
                key={link.to}
                to={link.to}
                onClick={() => setMenuOpen(false)}
                className="flex items-baseline justify-between rounded-lg px-3 py-2.5 text-[15px] text-stone-700 hover:bg-sandal-100"
              >
                {link.label}
                <span className="text-[13px] text-stone-500">{link.tamil}</span>
              </NavLink>
            ))}
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
