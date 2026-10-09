import { Link } from 'react-router-dom'
import { ArrowRight } from 'lucide-react'

import { cn } from '@/lib/cn'
import { formatMoney, formatPct } from '@/lib/format'
import { Money } from '@/components/ui/Money'
import { useDb } from '@/store/db'
import {
  TempleTowerIcon,
  SthapatiChiselsIcon,
  SacredOfferingHandIcon,
  VintageCornerFiligree,
} from './HeritageArt'
import { Finial } from './HeroArt'
import { useReveal } from './useReveal'

function Eyebrow({ children }: { children: string }) {
  return (
    <p className="flex items-center gap-3 text-[12px] font-semibold tracking-[0.24em] text-turmeric-700 uppercase">
      <span className="h-px w-9 bg-turmeric-400/70" aria-hidden />
      {children}
    </p>
  )
}

/**
 * Featured Project Section: Rajagopuram Renovation with high-fidelity arch,
 * non-repetitive Kanchipuram gopuram etching, temple toranam, and overlapping Nandi stats card.
 */
const FALLBACK_FEATURED = {
  id: 'prj-rajagopuram',
  sectorId: 'temple',
  name: 'Rajagopuram Renovation',
  summary:
    'Restoring the main tower: stucco figures, lime plaster, a gold-leaf kalasam and new lighting, under a traditional sthapati.',
  raised: 46500000,
  goal: 75000000,
}

export function FeaturedProjectSection() {
  const projects = useDb((s) => s.projects)
  const featured = projects.find((p) => p.id === 'prj-rajagopuram') ?? projects[0] ?? FALLBACK_FEATURED
  const progress = Math.min(100, (featured.raised / featured.goal) * 100)
  const { ref, seen } = useReveal<HTMLElement>()

  return (
    <section ref={ref} className="relative isolate overflow-hidden bg-sandal-50 py-20 lg:py-24">
      {/* Background Etchings (Distinct & Non-Repetitive, Transparent PNGs) */}
      {/* Left Kanchipuram Gopuram Etching - Positioned Upwards */}
      <div
        className="pointer-events-none absolute top-4 -left-20 -z-10 hidden h-170 w-95 opacity-[0.22] lg:block xl:-left-16"
        aria-hidden
      >
        <img
          src="/images/bg-project-gopuram-etching.png"
          alt=""
          className="h-full w-full object-contain object-top-left"
        />
      </div>

      {/* Right Corner Distinct Toranam & Jasmine Branch Watermark */}
      <div
        className="pointer-events-none absolute top-4 -right-4 -z-10 hidden h-120 w-70 opacity-[0.22] lg:block xl:w-[320px]"
        aria-hidden
      >
        <img
          src="/images/bg-project-foliage-etching.png"
          alt=""
          className="h-full w-full object-contain object-top-right"
        />
      </div>

      <div className={cn('mx-auto max-w-6xl px-5 sm:px-8', 'reveal', seen && 'is-visible')}>
        <div className="grid items-center gap-12 lg:grid-cols-[1fr_520px] lg:gap-14">
          {/* Left Column: Project Copy & Badges */}
          <div className="relative z-10">
            <Eyebrow>Featured Project</Eyebrow>

            <h2 className="mt-4 font-heritage text-[46px] leading-[1.04] font-normal text-stone-900 sm:text-[56px] lg:text-[62px]">
              <span className="block">Rajagopuram</span>
              <span className="block text-[#A8241A]">Renovation</span>
            </h2>

            <p className="mt-5 max-w-xl text-[16px] leading-[1.7] text-stone-700 sm:text-[17px]">
              {featured.summary ||
                'Restoring the main tower: stucco figures, lime plaster, a gold-leaf kalasam and new lighting, under a traditional sthapati.'}
            </p>

            {/* Two Feature Badges */}
            <div className="mt-8 flex flex-wrap items-center gap-6 sm:gap-8">
              {/* Badge 1 */}
              <div className="flex items-center gap-3.5">
                <span className="flex size-12 shrink-0 items-center justify-center rounded-full bg-[#F8E6B8]/90 shadow-xs">
                  <TempleTowerIcon size={24} />
                </span>
                <div>
                  <p className="text-[15px] font-medium text-stone-900">Temple restoration</p>
                  <p className="text-[13.5px] text-stone-500">Ongoing</p>
                </div>
              </div>

              {/* Badge 2 */}
              <div className="flex items-center gap-3.5">
                <span className="flex size-12 shrink-0 items-center justify-center rounded-full bg-[#F8E6B8]/90 shadow-xs">
                  <SthapatiChiselsIcon size={22} />
                </span>
                <div>
                  <p className="text-[15px] font-medium text-stone-900">Traditional</p>
                  <p className="text-[13.5px] text-stone-500">sthapati-led work</p>
                </div>
              </div>
            </div>

            {/* Primary Action Button */}
            <div className="mt-9">
              <Link to={`/donate/${featured.sectorId}/cat-tmp-raja`} className="inline-block">
                <button
                  type="button"
                  className="group flex h-13 items-center gap-3 rounded-xl bg-[#8A1710] px-7 text-[16px] font-semibold text-white shadow-md transition-all duration-200 hover:-translate-y-px hover:bg-[#72120C] hover:shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-turmeric-400"
                >
                  <SacredOfferingHandIcon size={20} className="text-turmeric-300" />
                  <span>Give to this project</span>
                  <ArrowRight className="size-4 transition-transform duration-200 group-hover:translate-x-1" aria-hidden />
                </button>
              </Link>
            </div>
          </div>

          {/* Right Column: Arched Photo Showcase & Overlapping Stats Card */}
          <div className="relative mx-auto w-full max-w-120 lg:max-w-none">
            {/* Top Finial */}
            <Finial className="absolute -top-4.5 left-1/2 z-20 -translate-x-1/2" />

            {/* Arch Photo Container */}
            <div className="relative overflow-hidden rounded-t-[200px] rounded-b-[20px] border-2 border-turmeric-500/60 bg-sandal-100 p-2 shadow-sm">
              <div className="aspect-[4/3.8] w-full overflow-hidden rounded-t-[190px] rounded-b-card">
                <img
                  src="/images/project-rajagopuram.webp"
                  alt="A temple gopuram under restoration, wrapped in bamboo scaffolding"
                  className="h-full w-full object-cover object-[50%_36%] transition-transform duration-700 hover:scale-[1.02]"
                  style={{ filter: 'brightness(1.06) saturate(1.12) contrast(1.02)' }}
                />
              </div>
            </div>

            {/* Bottom Finial */}
            <Finial className="absolute bottom-0.5 left-1/2 z-0 -translate-x-1/2 rotate-180" />

            {/* Overlapping Raised Stats Card - Shifted Upwards */}
            <div
              className="relative z-20 -mt-28 sm:-mt-32 mx-3 sm:mx-4 overflow-hidden rounded-[18px] border border-[#E6D5B8] bg-[#FFFDF8] p-6 shadow-card sm:p-7"
            >
              {/* Corner Filigree Ornaments */}
              <VintageCornerFiligree position="tl" className="top-1 left-1" />
              <VintageCornerFiligree position="tr" className="top-1 right-1" />
              <VintageCornerFiligree position="bl" className="bottom-1 left-1" />
              <VintageCornerFiligree position="br" className="bottom-1 right-1" />

              {/* Watermark: Sacred Nandi & Shrine Etching - Shifted Upwards */}
              <div
                className="pointer-events-none absolute top-2 right-0 z-0 h-36.25 w-56.25 opacity-[0.24] sm:top-3 sm:h-41.25 sm:w-63.75"
                aria-hidden
              >
                <img
                  src="/images/nandi-shrine-etching.png"
                  alt=""
                  className="h-full w-full object-contain object-top-right"
                />
              </div>

              <div className="relative z-10">
                <p className="text-[11px] font-semibold tracking-[0.16em] text-turmeric-700 uppercase">
                  Raised so far
                </p>

                <div className="mt-1.5 flex items-baseline gap-2">
                  <Money value={featured.raised} className="font-heritage text-[36px] sm:text-[40px] leading-none font-normal text-stone-900" />
                </div>
                <p className="mt-1 text-[13.5px] text-stone-500">
                  of {formatMoney(featured.goal)} needed
                </p>

                {/* Progress Bar */}
                <div
                  className="mt-5 h-2.5 w-full overflow-hidden rounded-full bg-[#EADCC8]"
                  role="img"
                  aria-label={`${formatPct(progress, 0)} of the goal raised`}
                >
                  <span
                    className="block h-full rounded-full bg-linear-to-r from-[#A8241A] to-[#8A1710] shadow-inner transition-all duration-700"
                    style={{ width: `${progress}%` }}
                  />
                </div>

                <div className="mt-3 flex items-baseline justify-between text-[13.5px]">
                  <span className="font-bold text-[#A8241A] tabular-nums">{formatPct(progress, 0)}</span>
                  <span className="text-stone-600">
                    {formatMoney(featured.goal - featured.raised)} still to find
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
