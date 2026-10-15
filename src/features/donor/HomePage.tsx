import { HomeHero } from './HomeHero'
import { TrustSection } from './TrustSection'
import { WhereToGive } from './WhereToGive'
import { QuickHundi } from './QuickHundi'
import { FeaturedProjectSection } from './FeaturedProjectSection'

export function HomePage() {
  return (
    <div>
      <HomeHero />

      <QuickHundi />

      <WhereToGive />

      <TrustSection />

      <FeaturedProjectSection />
    </div>
  )
}
