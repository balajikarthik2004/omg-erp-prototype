import { Link } from 'react-router-dom'
import { ArrowRight, FileText, ShieldCheck, FileCheck2, ReceiptText } from 'lucide-react'

import { DiyaIcon, Etching } from '@/components/ui/Ornament'
import { PHOTOS } from '@/lib/photos'

const ARCH = '50% 50% 20px 20px / 36% 36% 20px 20px'

/** The first screen: warm spiritual canvas, majestic gopuram arch without borders, authentic hanging brass deepams. */
export function HomeHero() {
  return (
    <section className="relative isolate overflow-hidden pb-6 sm:pb-8 lg:pb-10">
      {/* Luminous Warm Devotional Background */}
      <div
        className="pointer-events-none absolute inset-0 -z-10"
        style={{
          background:
            'radial-gradient(circle at 82% 20%, rgba(226, 46, 38, 0.14) 0%, transparent 48%), radial-gradient(circle at 10% 65%, rgba(41, 48, 136, 0.16) 0%, transparent 45%), radial-gradient(circle at 50% 8%, rgba(255, 193, 7, 0.12) 0%, transparent 40%), linear-gradient(145deg, #FFF9F5 0%, #F1F4FD 48%, #E8ECF9 100%)',
        }}
        aria-hidden
      />

      {/* Authentic Hanging Brass Deepams Cutout (100% Transparent Background) */}
      <div
        className="pointer-events-none absolute top-0 right-2 z-20 hidden h-65 w-36 lg:block xl:right-10 xl:h-80 xl:w-45"
        aria-hidden
      >
        <img
          src="/images/hero-hanging-deepams.png"
          alt="Traditional hanging brass temple deepams"
          className="h-full w-full object-contain object-top drop-shadow-lg"
        />
      </div>

      <div className="mx-auto grid max-w-7xl items-center gap-6 px-4 pt-3 sm:pt-4 sm:px-6 lg:grid-cols-[1.18fr_0.82fr] lg:gap-8 lg:pt-5 xl:px-8">
        <div className="animate-rise relative z-10">
          {/* Eyebrow badge - Clean, borderless, authentic */}
          <div className="inline-flex items-center gap-2 rounded-full bg-white/95 px-3.5 py-1 shadow-sm shadow-navy-950/5 backdrop-blur-md">
            <span className="flex size-2 rounded-full bg-kumkum-600 animate-pulse ring-4 ring-kumkum-100" />
            <span className="text-[10.5px] sm:text-[11px] font-extrabold tracking-[0.2em] text-navy-900 uppercase">
              Devotion, Rooted in Trust
            </span>
          </div>

          <h1 className="mt-3 sm:mt-3.5 font-heritage text-[28px] sm:text-[38px] md:text-[44px] lg:text-[42px] xl:text-[50px] 2xl:text-[56px] leading-[1.1] font-bold text-navy-950 tracking-tight">
            <span className="block text-navy-950">Give with devotion.</span>
            <span className="block mt-0.5 sm:mt-1">
              <span className="text-kumkum-600 font-extrabold">Let every offering</span>{' '}
              <span className="text-navy-900 font-extrabold">illuminate a sacred purpose.</span>
            </span>
          </h1>

          <p className="mt-2.5 sm:mt-3 max-w-142 text-[14px] sm:text-[15px] lg:text-[15.5px] leading-[1.65] text-stone-700 font-normal">
            Support the timeless traditions of <span className="font-bold text-kumkum-600">Kovil (கோவில்)</span> worship, the compassionate service of <span className="font-bold text-emerald-700">Sevalaya (சேவாலயா)</span> through annadhanam, and the cultural legacy of <span className="font-bold text-navy-700">Tamil Sangam (தமிழ்ச்சங்கம்)</span>. Every contribution is transparently recorded, independently auditable, and backed by a double-signed CA ledger.
          </p>

          {/* Trust Value Badges - Clean, borderless, floating glass chips */}
          <div className="mt-4 sm:mt-4.5 flex flex-wrap items-center gap-2 sm:gap-2.5">
            <div className="inline-flex items-center gap-2 rounded-xl bg-white/95 px-3 py-1.5 text-[11px] sm:text-xs font-bold text-stone-800 shadow-sm shadow-navy-950/5 backdrop-blur-md">
              <span className="flex size-4.5 sm:size-5 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
                <ShieldCheck className="size-3 sm:size-3.5" />
              </span>
              Verified Shrines &amp; Priests
            </div>
            <div className="inline-flex items-center gap-2 rounded-xl bg-white/95 px-3 py-1.5 text-[11px] sm:text-xs font-bold text-stone-800 shadow-sm shadow-navy-950/5 backdrop-blur-md">
              <span className="flex size-4.5 sm:size-5 items-center justify-center rounded-full bg-kumkum-100 text-kumkum-700">
                <FileCheck2 className="size-3 sm:size-3.5" />
              </span>
              Double-Signed CA Ledger
            </div>
            <div className="inline-flex items-center gap-2 rounded-xl bg-white/95 px-3 py-1.5 text-[11px] sm:text-xs font-bold text-stone-800 shadow-sm shadow-navy-950/5 backdrop-blur-md">
              <span className="flex size-4.5 sm:size-5 items-center justify-center rounded-full bg-navy-100 text-navy-700">
                <ReceiptText className="size-3 sm:size-3.5" />
              </span>
              Instant 80G Tax Receipts
            </div>
          </div>

          {/* Action Buttons - Pure borderless modern design with rich elevation */}
          <div className="mt-5 sm:mt-6 flex flex-col gap-3 sm:flex-row sm:items-center">
            <a href="#quick-hundi" className="contents">
              <button
                type="button"
                className="group flex items-center justify-center gap-2.5 rounded-xl bg-linear-to-r from-kumkum-500 via-kumkum-600 to-kumkum-700 hover:from-kumkum-600 hover:to-kumkum-800 active:scale-95 text-white font-extrabold text-xs sm:text-sm md:text-base px-6 sm:px-7 py-3.5 shadow-lg shadow-kumkum-500/25 transition-all duration-200 hover:-translate-y-0.5 cursor-pointer"
              >
                <DiyaIcon className="size-4.5 sm:size-5 text-white" />
                <span>Make an Offering</span>
                <ArrowRight className="size-4 transition-transform duration-200 group-hover:translate-x-1" />
              </button>
            </a>
            <Link to="/console" className="contents">
              <button
                type="button"
                className="group flex items-center justify-center gap-2.5 rounded-xl bg-white/95 hover:bg-white text-navy-950 font-bold text-xs sm:text-sm md:text-base px-6 sm:px-6.5 py-3.5 shadow-md hover:shadow-lg transition-all duration-200 hover:-translate-y-0.5 active:scale-95 cursor-pointer"
              >
                <FileText className="size-4 text-navy-600 transition-colors" />
                <span>See Transparent Ledger</span>
                <ArrowRight className="size-4 text-navy-600 transition-transform duration-200 group-hover:translate-x-1" />
              </button>
            </Link>
          </div>
        </div>

        {/* The Sanctum Arch - Completely borderless, seamless depth */}
        <div className="relative mx-auto w-full max-w-80 sm:max-w-90 lg:mr-4 xl:mr-8 lg:ml-auto lg:max-w-95 xl:max-w-105">
          {/* Vintage Gopuram Etching on left of arch (Transparent PNG) */}
          <div
            className="pointer-events-none absolute -bottom-2 -left-28 z-0 hidden h-72 w-48 opacity-[0.20] xl:block"
            aria-hidden
          >
            <Etching
              src="/images/bg-gopuram-etching.png"
              className="bg-navy-600"
              position="bottom"
            />
          </div>

          {/* Authentic Vintage Mandala Etching shifted slightly down behind arch (Transparent PNG) */}
          <div
            className="pointer-events-none absolute top-[62%] -right-16 z-0 hidden h-95 w-95 translate-y-[-38%] opacity-[0.26] lg:block"
            aria-hidden
          >
            <Etching
              src="/images/hero-mandala-etching.png"
              className="bg-navy-600"
              position="center"
            />
          </div>

          {/* Borderless Sanctum Arch with Rich Realistic Shadow */}
          <div
            className="relative overflow-hidden shadow-2xl shadow-navy-950/30 transition-transform duration-500 hover:scale-[1.01]"
            style={{ borderRadius: ARCH }}
          >
            <div className="aspect-9/10 overflow-hidden" style={{ borderRadius: ARCH }}>
              <img
                src={PHOTOS.temple.src}
                alt={PHOTOS.temple.alt}
                loading="eager"
                decoding="async"
                className="h-full w-full object-cover transition-transform duration-700 hover:scale-[1.02]"
                style={{ objectPosition: '50% 72%', filter: 'brightness(1.08) saturate(1.1) contrast(1.04)' }}
              />
              {/* Subtle sacred inner vignette */}
              <div className="pointer-events-none absolute inset-0 bg-linear-to-t from-black/40 via-transparent to-black/10" />

              {/* Floating Verified Seva Glass Pill */}
              <div className="absolute bottom-4 left-4 z-20 flex items-center gap-2.5 rounded-xl bg-white/95 px-3 py-2 shadow-lg backdrop-blur-md">
                <span className="flex size-2 rounded-full bg-emerald-500 animate-pulse" />
                <div className="text-left">
                  <p className="text-[10px] font-extrabold tracking-wider text-navy-950 uppercase">Public CA Audit</p>
                  <p className="text-[11px] font-semibold text-stone-600">Double-signed &amp; verified</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
