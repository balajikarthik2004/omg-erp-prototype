import { useEffect, useState } from 'react'
import { Link, NavLink, Outlet, useLocation } from 'react-router-dom'
import { LayoutDashboard, LogIn, Menu, ShoppingBag, UserRound, X } from 'lucide-react'

import { SECTOR_IDS, SECTORS } from '@/config'
import { cn } from '@/lib/cn'
import { Divider, Kolam, OmgMark } from '@/components/ui/Ornament'
import { useDb } from '@/store/db'
import { useSession } from '@/store/session'

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

  const links = SECTOR_IDS.map((id) => ({
    to: `/donate/${id}`,
    label: SECTORS[id].name,
    tamil: SECTORS[id].tamil,
  }))

  return (
    <div className="flex min-h-screen flex-col bg-sandal-50">
      <header className="no-print sticky top-0 z-30 border-b border-sandal-200 bg-sandal-50/90 backdrop-blur-md">
        <div className="mx-auto flex h-[68px] max-w-6xl items-center gap-4 px-5 sm:px-8">
          <Link to="/" className="flex items-center gap-3" aria-label="OMG Platform, home">
            <OmgMark size={38} />
            <span className="leading-none">
              <span className="block font-display text-[21px] tracking-wide text-stone-900">OMG</span>
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
              <ShoppingBag className="size-[18px]" aria-hidden />
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

      <footer className="no-print mt-0 border-t border-sandal-200 bg-stone-900 text-sandal-100">
        <div className="mx-auto max-w-6xl px-5 py-14 sm:px-8">
          <div className="flex flex-col gap-10 md:flex-row md:justify-between">
            <div className="max-w-sm">
              <div className="flex items-center gap-3">
                <OmgMark size={34} />
                <span className="font-display text-[20px] text-sandal-50">OMG Platform</span>
              </div>
              <p className="mt-4 text-[14px] leading-relaxed text-sandal-200/75">
                Every offering is receipted the moment it is given, held in a named fund, and released only
                after two people have signed for it.
              </p>
              <p className="mt-5 text-[12px] tracking-[0.08em] text-turmeric-400/70 uppercase">
                Prototype build · mock data · no live payments
              </p>
            </div>

            <div className="flex gap-12">
              <nav>
                <p className="mb-3 text-[11px] tracking-[0.14em] text-turmeric-400/80 uppercase">Give</p>
                <ul className="flex flex-col gap-2">
                  {links.map((link) => (
                    <li key={link.to}>
                      <Link
                        to={link.to}
                        className="text-[14px] text-sandal-100/85 transition-colors duration-150 hover:text-turmeric-400"
                      >
                        {link.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </nav>
              <nav>
                <p className="mb-3 text-[11px] tracking-[0.14em] text-turmeric-400/80 uppercase">Account</p>
                <ul className="flex flex-col gap-2">
                  <li>
                    <Link to="/my/donations" className="text-[14px] text-sandal-100/85 hover:text-turmeric-400">
                      My donations
                    </Link>
                  </li>
                  <li>
                    <Link to="/login" className="text-[14px] text-sandal-100/85 hover:text-turmeric-400">
                      Sign in
                    </Link>
                  </li>
                  <li>
                    <Link to="/console" className="text-[14px] text-sandal-100/85 hover:text-turmeric-400">
                      Admin console
                    </Link>
                  </li>
                </ul>
              </nav>
            </div>
          </div>

          <Divider className="mt-10 opacity-40" />

          <div className="mt-6 flex flex-col items-center gap-3 sm:flex-row sm:justify-between">
            <p className="font-display text-[15px] text-turmeric-400/80">
              அறம் செய விரும்பு
              <span className="ml-2 font-sans text-[13px] text-sandal-200/60">Desire to do good.</span>
            </p>
            <Kolam className="text-turmeric-400/35" size={52} />
          </div>
        </div>
      </footer>
    </div>
  )
}
