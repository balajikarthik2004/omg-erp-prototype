import { Link } from 'react-router-dom'

import { SECTOR_IDS, SECTORS } from '@/config'
import { Etching, OmgMark } from '@/components/ui/Ornament'
import { useDb } from '@/store/db'
import { LotusFooterArt } from '@/features/donor/HeritageArt'

/**
 * Editorial Heritage Footer: A full-width dark brown canvas with 3 distinct visual zones.
 * Features left Gopuram line art, right Lotus line art, dual-column navigation with gold divider,
 * and bottom Tamil tagline with legal links.
 */
export function Footer() {
  const tenant = useDb((s) => s.tenants.find((t) => t.id === s.activeTenantId))
  const links = SECTOR_IDS.filter((id) => !tenant || tenant.verticals.includes(id)).map((id) => ({
    to: `/donate/${id}`,
    label: SECTORS[id].name,
  }))

  const brandName = tenant?.name ?? 'OMG'

  return (
    <footer className="no-print relative isolate w-full overflow-hidden bg-navy-900 text-navy-100 pt-16 pb-10 sm:pt-20 sm:pb-12">
      {/* Decorative Layer: Far-left temple gopuram line-art etching */}
      <div
        className="pointer-events-none absolute -bottom-4 -left-10 z-0 hidden h-[390px] w-[270px] opacity-[0.14] lg:block"
        aria-hidden
      >
        <Etching
          src="/images/bg-gopuram-etching.png"
          className="bg-navy-200"
          position="bottom left"
        />
      </div>

      {/* Decorative Layer: Bottom-right sacred lotus line-art */}
      <div
        className="pointer-events-none absolute -bottom-6 -right-10 z-0 hidden h-[320px] w-[280px] opacity-[0.14] text-kumkum-400 lg:block"
        aria-hidden
      >
        <LotusFooterArt className="h-full w-full" />
      </div>

      {/* Main Centered Content Container */}
      <div className="relative z-10 mx-auto max-w-[1240px] px-5 sm:px-8 xl:px-12">
        {/* Main Grid: Left Brand (58%) & Right Navigation (42%) */}
        <div className="grid gap-12 lg:grid-cols-[58%_42%] items-start">
          
          {/* Left Column: Brand, Story & Prototype Label */}
          <div className="max-w-[540px]">
            <Link to="/" className="inline-flex items-center gap-4 group">
              <OmgMark size={52} onDark className="shadow-md" />
              <div>
                <span className="block font-heritage text-[23px] sm:text-[34px] leading-none text-sandal-50 font-normal tracking-wide">
                  {brandName}
                </span>
                <span className="mt-1 block text-[10.5px] font-semibold tracking-[0.22em] text-navy-200 uppercase">
                  Offerings
                </span>
              </div>
            </Link>

            <p className="mt-5 max-w-[480px] text-[15px] sm:text-[15.5px] leading-[1.65] text-navy-100">
              Every offering is receipted the moment it is given, held in a named fund, and released only after two people have signed for it.
            </p>

            <p className="mt-6 text-[11px] font-semibold tracking-[0.18em] text-kumkum-400 uppercase">
              PROTOTYPE BUILD · MOCK DATA · NO LIVE PAYMENTS
            </p>
          </div>

          {/* Right Column: Two Navigation Columns with Vertical Gold Divider */}
          <div className="grid grid-cols-1 sm:grid-cols-[1fr_auto_1fr] items-start gap-6 sm:gap-8 pt-1">
            {/* GIVE Column */}
            <nav>
              <h4 className="text-[11px] font-semibold tracking-[0.2em] text-kumkum-400 uppercase mb-4">
                Give
              </h4>
              <ul className="space-y-3">
                {links.map((link) => (
                  <li key={link.to}>
                    <Link
                      to={link.to}
                      className="group flex items-center justify-between text-[15px] sm:text-[15.5px] text-navy-50 transition-colors hover:text-kumkum-400"
                    >
                      <span>{link.label}</span>
                      <span className="text-kumkum-400 text-[15px] opacity-80 transition-transform duration-200 group-hover:translate-x-1">
                        →
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>

            {/* Vertical Hairline Gold Divider with Center Diamond */}
            <div className="hidden sm:flex flex-col items-center justify-center self-stretch py-2 min-h-[140px]" aria-hidden>
              <span className="w-px flex-1 bg-[rgba(200,148,34,0.45)]" />
              <span className="my-2 text-[11px] text-kumkum-400">✦</span>
              <span className="w-px flex-1 bg-[rgba(200,148,34,0.45)]" />
            </div>

            {/* ACCOUNT Column */}
            <nav>
              <h4 className="text-[11px] font-semibold tracking-[0.2em] text-kumkum-400 uppercase mb-4">
                Account
              </h4>
              <ul className="space-y-3">
                <li>
                  <Link
                    to="/my/donations"
                    className="group flex items-center justify-between text-[15px] sm:text-[15.5px] text-navy-50 transition-colors hover:text-kumkum-400"
                  >
                    <span>My donations</span>
                    <span className="text-kumkum-400 text-[15px] opacity-80 transition-transform duration-200 group-hover:translate-x-1">
                      →
                    </span>
                  </Link>
                </li>
                <li>
                  <Link
                    to="/login"
                    className="group flex items-center justify-between text-[15px] sm:text-[15.5px] text-navy-50 transition-colors hover:text-kumkum-400"
                  >
                    <span>Sign in</span>
                    <span className="text-kumkum-400 text-[15px] opacity-80 transition-transform duration-200 group-hover:translate-x-1">
                      →
                    </span>
                  </Link>
                </li>
                <li>
                  <Link
                    to="/console"
                    className="group flex items-center justify-between text-[15px] sm:text-[15.5px] text-navy-50 transition-colors hover:text-kumkum-400"
                  >
                    <span>Admin console</span>
                    <span className="text-kumkum-400 text-[15px] opacity-80 transition-transform duration-200 group-hover:translate-x-1">
                      →
                    </span>
                  </Link>
                </li>
              </ul>
            </nav>
          </div>
        </div>

        {/* Heritage Divider: Horizontal gold line with central diamond ornament */}
        <div className="mt-14 mb-8 flex items-center justify-center gap-3 text-kumkum-400" aria-hidden>
          <span className="h-px flex-1 bg-[rgba(194,142,36,0.45)]" />
          <span className="text-[14px]">✦</span>
          <span className="h-px flex-1 bg-[rgba(194,142,36,0.45)]" />
        </div>

        {/* Bottom Information Row: Tagline, Copyright & Legal Links */}
        <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
          {/* Left: Tamil Tagline & Copyright */}
          <div>
            <div className="flex flex-wrap items-baseline gap-2.5">
              <span className="font-heritage text-[21px] sm:text-[23px] font-normal text-kumkum-400 tracking-wide">
                அறம் செய விரும்பு
              </span>
              <span className="text-navy-200/60">|</span>
              <span className="text-[14px] text-navy-100">Desire to do good.</span>
            </div>
            <p className="mt-2.5 text-[13px] text-navy-200">
              © 2026 {brandName}. All rights reserved.
            </p>
          </div>

          {/* Right: Legal Links */}
          <nav className="flex flex-wrap items-center gap-2 text-[13.5px] text-navy-100">
            <Link to="/about#privacy" className="transition-colors hover:text-kumkum-400">
              Privacy
            </Link>
            <span className="text-navy-200/50">|</span>
            <Link to="/about#terms" className="transition-colors hover:text-kumkum-400">
              Terms
            </Link>
            <span className="text-navy-200/50">|</span>
            <Link to="/about#accessibility" className="transition-colors hover:text-kumkum-400">
              Accessibility
            </Link>
            <span className="text-navy-200/50">|</span>
            <Link to="/about#contact" className="transition-colors hover:text-kumkum-400">
              Contact
            </Link>
          </nav>
        </div>
      </div>
    </footer>
  )
}
