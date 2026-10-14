import { Link } from 'react-router-dom'
import { ArrowRight } from 'lucide-react'

import { HeritageKolamStar, FestivalDiyaLogo } from './HeritageArt'
import { HomeHero } from './HomeHero'
import { TrustSection } from './TrustSection'
import { WhereToGive } from './WhereToGive'
import { QuickHundi } from './QuickHundi'
import { FeaturedProjectSection } from './FeaturedProjectSection'

export function HomePage() {
  return (
    <div>
      {/* Festival strip */}
      <div className="border-b border-kumkum-700/30 bg-gradient-to-r from-kumkum-700 via-kumkum-600 to-navy-900 text-white shadow-sm">
        <div className="flex w-full flex-wrap items-center gap-x-3.5 gap-y-2 px-4 sm:px-6 lg:px-8 xl:px-10 py-2.5">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-turmeric-400 px-3 py-1 text-[11px] font-extrabold tracking-[0.16em] text-navy-950 uppercase shadow-xs">
            <FestivalDiyaLogo size={16} aria-hidden />
            <span>Navaratri Special</span>
          </span>
          <p className="text-xs sm:text-sm font-semibold text-white/95">
            Nine nights of sacred rituals, music and sundal prasadam. Special sponsorships open for all evenings.
          </p>
          <Link
            to="/donate/temple"
            className="ml-auto inline-flex items-center gap-2 rounded-full bg-white/15 px-3.5 py-1 text-xs font-bold uppercase tracking-wider text-turmeric-300 hover:text-white hover:bg-white/25 transition-all shadow-xs"
          >
            <HeritageKolamStar size={16} aria-hidden />
            <span>Sponsor an Evening</span>
            <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-1" />
          </Link>
        </div>
      </div>

      <HomeHero />

      <QuickHundi />

      <WhereToGive />

      <TrustSection />

      <FeaturedProjectSection />
    </div>
  )
}
