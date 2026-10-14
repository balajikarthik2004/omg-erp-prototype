import { Link } from 'react-router-dom'

import { SECTOR_IDS, SECTORS } from '@/config'
import { Etching, OmgMark } from '@/components/ui/Ornament'
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

  const brandName = tenant?.name ?? 'OMG'

  return (
    <footer
      className="no-print relative isolate w-full overflow-hidden text-white pt-16 pb-10"
      style={{
        background: 'linear-gradient(180deg, #4A0E0B 0%, #171C54 45%, #0F133B 100%)',
      }}
    >
      {/* Decorative Layer: Far-left temple gopuram watermark (Faint 6% opacity) */}
      <div
        className="pointer-events-none absolute bottom-0 left-0 z-0 hidden h-85 w-55 opacity-[0.06] lg:block"
        style={{ filter: 'brightness(1.5) sepia(1) hue-rotate(5deg)' }}
        aria-hidden
      >
        <Etching
          src="/images/bg-gopuram-etching.png"
          className="bg-white"
          position="bottom left"
        />
      </div>

      {/* Decorative Layer: Bottom-right sacred lotus watermark (Faint 6% opacity) */}
      <div
        className="pointer-events-none absolute -bottom-4 -right-6 z-0 hidden h-65 w-52.5 opacity-[0.06] text-turmeric-400 lg:block"
        aria-hidden
      >
        <LotusFooterArt className="h-full w-full" />
      </div>

      {/* Main Centered Content Container */}
      <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-8">
        {/* Main Grid: 4 Columns like omgofficial.com */}
        <div className="grid gap-10 md:grid-cols-2 lg:grid-cols-4 items-start pb-12 border-b border-white/15">
          
          {/* Column 1: Brand & Mission */}
          <div className="space-y-4">
            <Link to="/" className="inline-flex items-center gap-3 group">
              <OmgMark size={48} className="shadow-xs" />
              <div>
                <span className="block font-heritage text-[28px] leading-none text-white font-bold tracking-wide">
                  {brandName}
                </span>
                <span className="mt-0.5 block text-[10px] font-bold tracking-[0.22em] text-turmeric-400 uppercase">
                  Devotee Experience
                </span>
              </div>
            </Link>

            <p className="text-[14px] leading-relaxed text-white/80">
              OMG is a spiritual initiative dedicated to creating meaningful devotional experiences,
              blending ancient Vedic wisdom with modern transparent governance.
            </p>

            <div className="pt-1">
              <span className="inline-block rounded-md bg-white/10 px-2.5 py-1 text-[10.5px] font-bold tracking-wider text-turmeric-400 uppercase border border-white/15">
                PROTOTYPE · MOCK DATA · FOUR-EYES LEDGER
              </span>
            </div>
          </div>

          {/* Column 2: Sacred Offerings */}
          <div>
            <h4 className="text-xs font-bold tracking-[0.2em] text-turmeric-400 uppercase mb-4">
              Sacred Offerings
            </h4>
            <ul className="space-y-2.5 text-sm">
              {links.map((link) => (
                <li key={link.to}>
                  <Link to={link.to} className="text-white/80 hover:text-white transition-colors">
                    {link.label}
                  </Link>
                </li>
              ))}
              <li>
                <Link to="/events" className="text-white/80 hover:text-white transition-colors">
                  Maha Yaagam &amp; Festivals (நிகழ்வுகள்)
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 3: Devotee Services */}
          <div>
            <h4 className="text-xs font-bold tracking-[0.2em] text-turmeric-400 uppercase mb-4">
              Devotee Services
            </h4>
            <ul className="space-y-2.5 text-sm">
              <li>
                <Link to="/my/donations" className="text-white/80 hover:text-white transition-colors">
                  My Offerings &amp; Receipts
                </Link>
              </li>
              <li>
                <Link to="/my/statement" className="text-white/80 hover:text-white transition-colors">
                  Annual 80G Tax Statement
                </Link>
              </li>
              <li>
                <Link to="/login" className="text-white/80 hover:text-white transition-colors">
                  Devotee Login
                </Link>
              </li>
              <li>
                <Link to="/console" className="text-white/80 hover:text-white transition-colors">
                  Temple Administration Console
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 4: Contact Us & Om Namah Shivaya */}
          <div className="space-y-3.5">
            <h4 className="text-xs font-bold tracking-[0.2em] text-turmeric-400 uppercase mb-4">
              Contact &amp; Support
            </h4>
            <p className="text-xs text-white/70">
              Devotee assistance available 7 days a week for pooja scheduling and sankalpam.
            </p>
            <div className="text-sm space-y-1.5 text-white/90">
              <p className="font-semibold text-white">team@omgofficial.com</p>
              <p className="text-white/80">+91 8667283590</p>
            </div>
            <div className="pt-2">
              <span className="font-heritage text-lg italic text-turmeric-400 font-medium">
                Om Namah Shivaya
              </span>
            </div>
          </div>
        </div>

        {/* Bottom Information Row: Tagline, Copyright & Legal Links */}
        <div className="mt-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between text-xs text-white/70">
          <div>
            <p>© 2026 {brandName} (Oh My God). Divine Experience. All rights reserved.</p>
          </div>

          <div className="flex flex-wrap items-center gap-4">
            <span className="text-white/50">Privacy Policy</span>
            <span>·</span>
            <span className="text-white/50">Terms of Service</span>
            <span>·</span>
            <span className="text-white/50">Community Guidelines</span>
          </div>
        </div>
      </div>
    </footer>
  )
}
