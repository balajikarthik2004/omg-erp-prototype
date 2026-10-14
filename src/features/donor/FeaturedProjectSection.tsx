import { Link } from 'react-router-dom'
import { ArrowRight } from 'lucide-react'

import { cn } from '@/lib/cn'
import { formatMoney, formatPct } from '@/lib/format'
import { Money } from '@/components/ui/Money'
import { Etching } from '@/components/ui/Ornament'
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
    <p className="flex items-center gap-3 text-[12px] font-bold tracking-[0.24em] text-kumkum-600 uppercase">
      <span className="h-px w-9 bg-kumkum-300" aria-hidden />
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
    <section ref={ref} className="relative isolate overflow-hidden bg-gradient-to-b from-[#F0F2FA] via-white to-[#F2F4FB] py-16 lg:py-24">
      {/* Background Etchings (Distinct & Non-Repetitive, Transparent PNGs) */}
      {/* Left Kanchipuram Gopuram Etching - Positioned Upwards */}
      <div
        className="pointer-events-none absolute top-4 -left-20 -z-10 hidden h-170 w-95 opacity-[0.22] lg:block xl:-left-16"
        aria-hidden
      >
        <Etching
          src="/images/bg-project-gopuram-etching.png"
          className="bg-navy-600"
          position="top left"
        />
      </div>

      {/* Right Corner Distinct Toranam & Jasmine Branch Watermark */}
      <div
        className="pointer-events-none absolute top-4 -right-4 -z-10 hidden h-120 w-70 opacity-[0.22] lg:block xl:w-[320px]"
        aria-hidden
      >
        <Etching
          src="/images/bg-project-foliage-etching.png"
          className="bg-navy-600"
          position="top right"
        />
      </div>

      <div className={cn('mx-auto max-w-7xl px-4 sm:px-8', 'reveal', seen && 'is-visible')}>
        <div className="grid items-center gap-12 lg:grid-cols-[1fr_520px] lg:gap-14">
          {/* Left Column: Project Copy & Badges */}
          <div className="relative z-10">
            <Eyebrow>Featured Project</Eyebrow>

            <h2 className="mt-4 font-heritage text-[32px] sm:text-[48px] lg:text-[58px] leading-[1.05] font-bold text-stone-900">
              <span className="block">Rajagopuram</span>
              <span className="block text-kumkum-600 font-extrabold">Renovation</span>
            </h2>

            <p className="mt-5 max-w-xl text-[15.5px] sm:text-[17px] leading-[1.7] text-stone-700">
              {featured.summary ||
                'Restoring the main tower: stucco figures, lime plaster, a gold-leaf kalasam and new lighting, under a traditional sthapati.'}
            </p>

            {/* Two Feature Badges */}
            <div className="mt-8 flex flex-wrap items-center gap-4 sm:gap-6">
              {/* Badge 1 */}
              <div className="flex items-center gap-3 rounded-xl bg-white/95 p-2.5 sm:p-3 shadow-sm">
                <span className="flex size-11 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-navy-600 to-navy-700 text-white shadow-xs">
                  <TempleTowerIcon size={22} />
                </span>
                <div>
                  <p className="text-sm font-extrabold text-navy-950">Temple Restoration</p>
                  <p className="text-xs font-semibold text-navy-600">Active project</p>
                </div>
              </div>

              {/* Badge 2 */}
              <div className="flex items-center gap-3 rounded-xl bg-white/95 p-2.5 sm:p-3 shadow-sm">
                <span className="flex size-11 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-kumkum-500 to-kumkum-600 text-white shadow-xs">
                  <SthapatiChiselsIcon size={20} />
                </span>
                <div>
                  <p className="text-sm font-extrabold text-stone-900">Traditional Art</p>
                  <p className="text-xs font-semibold text-kumkum-600">Sthapati-led work</p>
                </div>
              </div>
            </div>

            {/* Primary Action Button */}
            <div className="mt-9">
              <Link to={`/donate/${featured.sectorId}/cat-tmp-raja`} className="inline-block">
                <button
                  type="button"
                  className="group flex h-13 items-center gap-2.5 rounded-xl bg-gradient-to-r from-kumkum-500 via-kumkum-600 to-kumkum-700 hover:from-kumkum-600 hover:to-kumkum-800 active:scale-95 px-7 text-[15px] sm:text-[16px] font-bold text-white shadow-md shadow-kumkum-500/25 transition-all"
                >
                  <SacredOfferingHandIcon size={20} className="text-white" />
                  <span>Give to This Project</span>
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
            <div className="relative overflow-hidden rounded-t-[200px] rounded-b-[20px] bg-gradient-to-b from-amber-100/70 via-amber-50 to-navy-50/60 p-2 shadow-2xl">
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
              className="relative z-20 -mt-28 sm:-mt-32 mx-3 sm:mx-4 overflow-hidden rounded-[18px] bg-gradient-to-br from-white via-amber-50/90 to-amber-100/60 p-6 shadow-2xl shadow-navy-950/20 sm:p-7"
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
                <p className="text-[11px] font-bold tracking-[0.16em] text-navy-700 uppercase">
                  Raised so far
                </p>

                <div className="mt-1.5 flex items-baseline gap-2">
                  <Money value={featured.raised} className="font-heritage text-[28px] sm:text-[42px] leading-none font-bold text-navy-950" />
                </div>
                <p className="mt-1 text-[13.5px] font-medium text-stone-600">
                  of <span className="font-bold text-stone-800">{formatMoney(featured.goal)}</span> needed
                </p>

                {/* Progress Bar */}
                <div
                  className="mt-5 h-2.5 w-full overflow-hidden rounded-full bg-navy-200/60"
                  role="img"
                  aria-label={`${formatPct(progress, 0)} of the goal raised`}
                >
                  <span
                    className="block h-full rounded-full bg-gradient-to-r from-kumkum-500 via-kumkum-600 to-turmeric-400 shadow-inner transition-all duration-700"
                    style={{ width: `${progress}%` }}
                  />
                </div>

                <div className="mt-3 flex items-baseline justify-between text-[13.5px]">
                  <span className="inline-flex items-center rounded-md bg-kumkum-600 px-2.5 py-0.5 text-xs font-black text-white shadow-xs tabular-nums">
                    {formatPct(progress, 0)}
                  </span>
                  <span className="text-stone-700 font-semibold">
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
