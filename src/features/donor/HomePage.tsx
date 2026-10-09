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
      <div className="border-b border-sandal-200 bg-sandal-100">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-x-3.5 gap-y-1.5 px-5 py-2.5 sm:px-8">
          <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold tracking-[0.16em] text-kumkum-700 uppercase">
            <FestivalDiyaLogo size={18} aria-hidden />
            <span>Navaratri</span>
            <span className="ml-1 h-3.5 w-px bg-stone-300/80" aria-hidden />
          </span>
          <p className="text-[14px] text-stone-700">
            Nine nights of golu, music and sundal prasadam. Sponsorships are open for every evening.
          </p>
          <Link
            to="/donate/temple"
            className="sponsor-link ml-auto shrink-0"
          >
            <HeritageKolamStar size={18} aria-hidden />
            <span>Sponsor an evening</span>
            <span className="sponsor-arrow" aria-hidden>
              <ArrowRight className="size-4" />
            </span>
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
