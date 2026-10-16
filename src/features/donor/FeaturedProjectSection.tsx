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
    <section ref={ref} className="relative isolate overflow-hidden bg-linear-to-b from-[#F0F2FA] via-white to-[#F2F4FB] py-8 sm:py-10 lg:py-12">
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

      <div className={cn('mx-auto max-w-7xl px-4 sm:px-6 lg:px-8', 'reveal', seen && 'is-visible')}>
        <div className="grid items-center gap-8 sm:gap-10 lg:grid-cols-[1.1fr_0.9fr] xl:grid-cols-[1fr_500px] lg:gap-10 xl:gap-12">
          {/* Left Column: Project Copy & Badges */}
          <div className="relative z-10">
            <Eyebrow>Featured Project</Eyebrow>

            <h2 className="mt-2.5 sm:mt-3 font-heritage text-[28px] sm:text-[38px] md:text-[44px] lg:text-[46px] xl:text-[52px] leading-[1.08] font-bold text-stone-900">
              <span className="block">Rajagopuram</span>
              <span className="block text-kumkum-600 font-extrabold">Renovation</span>
            </h2>

            <p className="mt-3 sm:mt-3.5 max-w-xl text-[14.5px] sm:text-[15.5px] lg:text-[16px] leading-[1.65] text-stone-700">
              {featured.summary ||
                'Restoring the main tower: stucco figures, lime plaster, a gold-leaf kalasam and new lighting, under a traditional sthapati.'}
            </p>

            {/* Two Feature Badges */}
            <div className="mt-5 sm:mt-6 flex flex-wrap items-center gap-3 sm:gap-4">
              {/* Badge 1 */}
              <div className="flex items-center gap-3 rounded-xl bg-white/95 p-2 sm:p-2.5 shadow-sm border border-stone-200/50">
                <span className="flex size-10 sm:size-11 shrink-0 items-center justify-center rounded-lg bg-linear-to-br from-amber-400 via-amber-500 to-turmeric-500 text-navy-950 font-bold shadow-sm shadow-amber-400/25">
                  <TempleTowerIcon size={20} />
                </span>
                <div>
                  <p className="text-xs sm:text-sm font-extrabold text-stone-900">Temple Restoration</p>
                  <p className="text-[11px] sm:text-xs font-semibold text-amber-800">Active project</p>
                </div>
              </div>

              {/* Badge 2 */}
              <div className="flex items-center gap-3 rounded-xl bg-white/95 p-2 sm:p-2.5 shadow-sm border border-stone-200/50">
                <span className="flex size-10 sm:size-11 shrink-0 items-center justify-center rounded-lg bg-linear-to-br from-turmeric-300 via-turmeric-400 to-amber-500 text-navy-950 font-bold shadow-sm shadow-amber-400/25">
                  <SthapatiChiselsIcon size={18} />
                </span>
                <div>
                  <p className="text-xs sm:text-sm font-extrabold text-stone-900">Traditional Art</p>
                  <p className="text-[11px] sm:text-xs font-semibold text-amber-800">Sthapati-led work</p>
                </div>
              </div>
            </div>

            {/* Primary Action Button */}
            <div className="mt-5 sm:mt-6">
              <Link to={`/donate/${featured.sectorId}/cat-tmp-raja`} className="inline-block">
                <button
                  type="button"
                  className="group flex h-12 sm:h-12.5 items-center gap-2.5 rounded-xl bg-linear-to-r from-kumkum-500 via-kumkum-600 to-kumkum-700 hover:from-kumkum-600 hover:to-kumkum-800 active:scale-95 px-6 sm:px-7 text-[14px] sm:text-[15px] font-bold text-white shadow-md shadow-kumkum-500/25 transition-all cursor-pointer"
                >
                  <SacredOfferingHandIcon size={18} className="text-white" />
                  <span>Give to This Project</span>
                  <ArrowRight className="size-4 transition-transform duration-200 group-hover:translate-x-1" aria-hidden />
                </button>
              </Link>
            </div>
          </div>

          {/* Right Column: Arched Photo Showcase & Overlapping Stats Card */}
          <div className="relative mx-auto w-full max-w-120 lg:max-w-none">
            {/* Top Finial */}
            <Finial className="absolute -top-4.5 left-1/2 z-20 -translate-x-1/2 text-turmeric-400 drop-shadow-[0_2px_8px_rgba(255,193,7,0.5)]" />

            {/* Arch Photo Container */}
            <div className="relative overflow-hidden rounded-t-[200px] rounded-b-[20px] bg-linear-to-b from-amber-100/70 via-amber-50 to-amber-100/40 p-2 shadow-2xl">
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
            <Finial className="absolute bottom-0.5 left-1/2 z-0 -translate-x-1/2 rotate-180 text-turmeric-400 drop-shadow-[0_2px_8px_rgba(255,193,7,0.3)]" />

            {/* Overlapping Raised Stats Card - Solid Opaque */}
            <div
              className="relative z-20 -mt-28 sm:-mt-32 mx-3 sm:mx-4 overflow-hidden rounded-[18px] bg-white bg-linear-to-br from-white via-amber-50 to-amber-100 p-6 shadow-2xl shadow-stone-950/15 sm:p-7 border border-amber-200"
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
                <p className="text-[11px] font-bold tracking-[0.16em] text-amber-900/80 uppercase">
                  Raised so far
                </p>

                <div className="mt-1.5 flex items-baseline gap-2">
                  <Money value={featured.raised} className="font-heritage text-[28px] sm:text-[42px] leading-none font-bold text-stone-900" />
                </div>
                <p className="mt-1 text-[13.5px] font-medium text-stone-600">
                  of <span className="font-bold text-stone-800">{formatMoney(featured.goal)}</span> needed
                </p>

                {/* Progress Bar - Pure golden warm devotional track with zero blue */}
                <div
                  className="mt-5 h-2.5 w-full overflow-hidden rounded-full bg-amber-200/60 ring-1 ring-amber-300/40"
                  role="img"
                  aria-label={`${formatPct(progress, 0)} of the goal raised`}
                >
                  <span
                    className="block h-full rounded-full bg-linear-to-r from-amber-600 via-turmeric-400 to-amber-300 shadow-inner transition-all duration-700"
                    style={{ width: `${progress}%` }}
                  />
                </div>

                <div className="mt-3 flex items-baseline justify-between text-[13.5px]">
                  <span className="inline-flex items-center rounded-md bg-linear-to-r from-amber-600 to-amber-700 px-2.5 py-0.5 text-xs font-black text-white shadow-xs tabular-nums">
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
