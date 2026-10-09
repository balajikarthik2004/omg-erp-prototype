import { Link } from 'react-router-dom'

import { SECTOR_IDS, SECTORS } from '@/config'
import { OmgMark } from '@/components/ui/Ornament'
import { useDb } from '@/store/db'
import { LotusFooterArt } from '@/features/donor/HeritageArt'

/**
 * Editorial Heritage Footer (Refined Pass):
 * Compact, balanced, with faint atmospheric watermarks, clean typography hierarchy,
 * hover-reveal navigation arrows, and aligned legal/copyright baselines.
 */
export function Footer() {
  const tenant = useDb((s) => s.tenants.find((t) => t.id === s.activeTenantId))
  const links = SECTOR_IDS.filter((id) => !tenant || tenant.verticals.includes(id)).map((id) => ({
    to: `/donate/${id}`,
    label: SECTORS[id].name,
  }))

  const brandName = tenant?.name ?? 'Kaveri Heritage'

  return (
    <footer className="no-print relative isolate w-full overflow-hidden bg-[#2B1710] text-[#E9DCCB] pt-14 pb-8 sm:pt-16 sm:pb-9">
      {/* Decorative Layer: Far-left temple gopuram watermark (Faint 6% opacity) */}
      <div
        className="pointer-events-none absolute bottom-0 left-0 z-0 hidden h-85 w-55 opacity-[0.06] lg:block"
        style={{ filter: 'brightness(1.5) sepia(1) hue-rotate(5deg)' }}
        aria-hidden
      >
        <img
          src="/images/bg-gopuram-etching.png"
          alt=""
          className="h-full w-full object-contain object-bottom-left"
        />
      </div>

      {/* Decorative Layer: Bottom-right sacred lotus watermark (Faint 6% opacity) */}
      <div
        className="pointer-events-none absolute -bottom-4 -right-6 z-0 hidden h-65 w-52.5 opacity-[0.06] text-[#C89422] lg:block"
        aria-hidden
      >
        <LotusFooterArt className="h-full w-full" />
      </div>

      {/* Main Centered Content Container */}
      <div className="relative z-10 mx-auto max-w-310 px-5 sm:px-8 xl:px-12">
        {/* Main Grid: Left Brand (58%) & Right Navigation (42%) */}
        <div className="grid gap-10 lg:grid-cols-[58%_42%] items-start">
          
          {/* Left Column: Brand, Story & Prototype Label */}
          <div className="max-w-122.5">
            <Link to="/" className="inline-flex items-center gap-3.5 group">
              <OmgMark size={52} className="shadow-xs" />
              <div>
                <span className="block font-heritage text-[30px] sm:text-[32px] leading-none text-[#FFF7E8] font-normal tracking-wide">
                  {brandName}
                </span>
                <span className="mt-1 block text-[10px] font-semibold tracking-[0.2em] text-[#BDAA96] uppercase">
                  Offerings
                </span>
              </div>
            </Link>

            <p className="mt-4 max-w-115 text-[14.5px] sm:text-[15px] leading-[1.6] text-[#E9DCCB]">
              Every offering is receipted the moment it is given, held in a named fund, and released only after two people have signed for it.
            </p>

            <p className="mt-4.5 text-[11px] font-semibold tracking-[0.18em] text-[#C89422] uppercase">
              PROTOTYPE BUILD · MOCK DATA · NO LIVE PAYMENTS
            </p>
          </div>

          {/* Right Column: Two Navigation Columns with Vertical Gold Divider */}
          <div className="grid grid-cols-1 sm:grid-cols-[1fr_auto_1fr] items-start gap-6 sm:gap-7 max-w-85 lg:ml-auto pt-0.5">
            {/* GIVE Column */}
            <nav className="min-w-30">
              <h4 className="text-[11px] font-semibold tracking-[0.2em] text-[#C89422] uppercase mb-3.5">
                Give
              </h4>
              <ul className="space-y-2.5">
                {links.map((link) => (
                  <li key={link.to}>
                    <Link
                      to={link.to}
                      className="group flex items-center justify-between text-[15px] text-[#F4E9D8] transition-colors hover:text-[#C89422]"
                    >
                      <span>{link.label}</span>
                      <span
                        className="text-[#C89422] text-[14px] opacity-0 -translate-x-1.5 transition-all duration-200 group-hover:opacity-100 group-hover:translate-x-0"
                        aria-hidden
                      >
                        →
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>

            {/* Vertical Hairline Gold Divider with Center Diamond */}
            <div className="hidden sm:flex flex-col items-center justify-center self-stretch py-1.5 min-h-30" aria-hidden>
              <span className="w-px flex-1 bg-[rgba(200,148,34,0.35)]" />
              <span className="my-1.5 text-[10px] text-[#C89422]">✦</span>
              <span className="w-px flex-1 bg-[rgba(200,148,34,0.35)]" />
            </div>

            {/* ACCOUNT Column */}
            <nav className="min-w-32.5">
              <h4 className="text-[11px] font-semibold tracking-[0.2em] text-[#C89422] uppercase mb-3.5">
                Account
              </h4>
              <ul className="space-y-2.5">
                <li>
                  <Link
                    to="/my/donations"
                    className="group flex items-center justify-between text-[15px] text-[#F4E9D8] transition-colors hover:text-[#C89422]"
                  >
                    <span>My donations</span>
                    <span
                      className="text-[#C89422] text-[14px] opacity-0 -translate-x-1.5 transition-all duration-200 group-hover:opacity-100 group-hover:translate-x-0"
                      aria-hidden
                    >
                      →
                    </span>
                  </Link>
                </li>
                <li>
                  <Link
                    to="/login"
                    className="group flex items-center justify-between text-[15px] text-[#F4E9D8] transition-colors hover:text-[#C89422]"
                  >
                    <span>Sign in</span>
                    <span
                      className="text-[#C89422] text-[14px] opacity-0 -translate-x-1.5 transition-all duration-200 group-hover:opacity-100 group-hover:translate-x-0"
                      aria-hidden
                    >
                      →
                    </span>
                  </Link>
                </li>
                <li>
                  <Link
                    to="/console"
                    className="group flex items-center justify-between text-[15px] text-[#F4E9D8] transition-colors hover:text-[#C89422]"
                  >
                    <span>Admin console</span>
                    <span
                      className="text-[#C89422] text-[14px] opacity-0 -translate-x-1.5 transition-all duration-200 group-hover:opacity-100 group-hover:translate-x-0"
                      aria-hidden
                    >
                      →
                    </span>
                  </Link>
                </li>
              </ul>
            </nav>
          </div>
        </div>

        {/* Heritage Divider: Thin subtle horizontal gold line with central diamond */}
        <div className="mt-11 mb-6 flex items-center justify-center gap-3 text-[#C89422]" aria-hidden>
          <span className="h-px flex-1 bg-[rgba(200,148,34,0.35)]" />
          <span className="text-[11px]">◆</span>
          <span className="h-px flex-1 bg-[rgba(200,148,34,0.35)]" />
        </div>

        {/* Bottom Information Row: Tagline, Copyright & Legal Links */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          {/* Left: Tamil Tagline & Copyright */}
          <div>
            <div className="flex flex-wrap items-baseline gap-2">
              <span className="font-heritage text-[20px] font-normal text-[#C89422] tracking-wide">
                அறம் செய விரும்பு
              </span>
              <span className="text-[#BDAA96] opacity-40 mx-1">|</span>
              <span className="text-[13.5px] text-[#E3D5C5]">Desire to do good.</span>
            </div>
            <p className="mt-1 text-[12.5px] text-[#A99685]">
              © 2026 {brandName}. All rights reserved.
            </p>
          </div>

          {/* Right: Legal Links */}
          <nav className="flex flex-wrap items-center gap-2 text-[13px] text-[#D8C9B8]">
            <Link to="/about#privacy" className="transition-colors hover:text-[#C89422]">
              Privacy
            </Link>
            <span className="text-[#BDAA96]/40">|</span>
            <Link to="/about#terms" className="transition-colors hover:text-[#C89422]">
              Terms
            </Link>
            <span className="text-[#BDAA96]/40">|</span>
            <Link to="/about#accessibility" className="transition-colors hover:text-[#C89422]">
              Accessibility
            </Link>
            <span className="text-[#BDAA96]/40">|</span>
            <Link to="/about#contact" className="transition-colors hover:text-[#C89422]">
              Contact
            </Link>
          </nav>
        </div>
      </div>
    </footer>
  )
}
