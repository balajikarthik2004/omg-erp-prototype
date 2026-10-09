import { Link } from 'react-router-dom'
import { ArrowRight, FileText } from 'lucide-react'

import { Button } from '@/components/ui/Button'
import { DiyaIcon } from '@/components/ui/Ornament'
import { PHOTOS } from '@/lib/photos'
import { Finial } from './HeroArt'

const ARCH = '50% 50% 18px 18px / 36% 36% 18px 18px'
const ARROW = 'size-4 transition-transform duration-200 group-hover:translate-x-1'

/** The first screen: warm paper, the gopuram in a single gold arch, authentic brass lamps hanging from the top. */
export function HomeHero() {
  return (
    <section className="relative isolate overflow-hidden pb-10 lg:pb-14">
      <div
        className="pointer-events-none absolute inset-0 -z-10"
        style={{
          background:
            'radial-gradient(55% 80% at 76% 45%, color-mix(in srgb, var(--color-turmeric-100) 60%, transparent) 0%, transparent 72%), linear-gradient(to bottom, var(--color-sandal-50), var(--color-sandal-100))',
        }}
        aria-hidden
      />

      {/* Authentic Hanging Brass Deepams Cutout (100% Transparent Background) */}
      <div
        className="pointer-events-none absolute top-0 right-2 z-20 hidden h-[320px] w-[170px] lg:block xl:right-10 xl:h-[370px] xl:w-[200px]"
        aria-hidden
      >
        <img
          src="/images/hero-hanging-deepams.png"
          alt=""
          className="h-full w-full object-contain object-top drop-shadow-sm"
        />
      </div>

      <div className="mx-auto grid max-w-6xl items-center gap-10 px-5 pt-10 sm:px-8 lg:grid-cols-[1.12fr_0.88fr] lg:gap-6 lg:pt-12">
        <div className="animate-rise relative z-10">
          <p className="text-[12px] font-semibold tracking-[0.22em] text-turmeric-700 uppercase">
            Temple · Sevalaya · Tamil Sangam
          </p>

          <h1 className="mt-5 font-heritage text-[44px] leading-[1.02] font-medium text-stone-900 sm:text-[60px] lg:text-[70px]">
            <span className="block">Give once.</span>
            <span className="block lg:whitespace-nowrap">
              <span className="text-kumkum-600">Follow it</span> all the way
            </span>
            <span className="block lg:whitespace-nowrap">to the lamp it lights.</span>
          </h1>

          <p className="mt-6 max-w-[34rem] text-[16px] leading-[1.75] text-stone-700 sm:text-[17px]">
            Offerings for the கோவில், the சேவாலயா and the தமிழ்ச்சங்கம், kept in one honest ledger. You can see
            the fund your gift sits in, and the work it paid for.
          </p>

          <div className="mt-8 flex flex-col gap-3.5 sm:flex-row sm:items-center">
            <a href="#quick-hundi" className="contents">
              <Button
                size="lg"
                className="group w-full gap-2.5 rounded-xl bg-kumkum-700 px-7 shadow-md hover:-translate-y-px hover:bg-kumkum-800 sm:w-auto"
                icon={<DiyaIcon className="size-5 text-turmeric-400" />}
                rightIcon={<ArrowRight className={ARROW} aria-hidden />}
              >
                Make an offering
              </Button>
            </a>
            <Link to="/console" className="contents">
              <Button
                size="lg"
                variant="secondary"
                className="group w-full gap-2.5 rounded-xl border-sandal-300 bg-sandal-50/80 px-6 hover:-translate-y-px hover:border-turmeric-400 sm:w-auto"
                icon={<FileText className="size-4 text-turmeric-700" />}
                rightIcon={<ArrowRight className={ARROW} aria-hidden />}
              >
                See how the money is tracked
              </Button>
            </Link>
          </div>
        </div>

        {/* The Golden Arch Sanctum with Vintage Mandala Halo and Gopuram Etching */}
        <div className="relative mx-auto w-full max-w-[380px] lg:mr-10 lg:ml-auto lg:max-w-[430px]">
          {/* Vintage Gopuram Etching on left of arch (Transparent PNG) */}
          <div
            className="pointer-events-none absolute -bottom-2 -left-28 -z-0 hidden h-72 w-48 opacity-[0.18] xl:block"
            aria-hidden
          >
            <img
              src="/images/bg-gopuram-etching.png"
              alt=""
              className="h-full w-full object-contain object-bottom"
            />
          </div>

          {/* Authentic Vintage Mandala Etching shifted slightly down behind arch (Transparent PNG) */}
          <div
            className="pointer-events-none absolute top-[62%] -right-16 -z-0 hidden h-[380px] w-[380px] -translate-y-[38%] opacity-[0.24] lg:block"
            aria-hidden
          >
            <img
              src="/images/hero-mandala-etching.png"
              alt=""
              className="h-full w-full object-contain"
            />
          </div>

          {/* Arch Finial Top */}
          <Finial className="absolute -top-[20px] left-1/2 z-20 -translate-x-1/2" />

          <div className="relative border border-turmeric-500/80 bg-sandal-50 p-2 shadow-sm" style={{ borderRadius: ARCH }}>
            <div className="aspect-[9/10] overflow-hidden" style={{ borderRadius: ARCH }}>
              <img
                src={PHOTOS.temple.src}
                alt={PHOTOS.temple.alt}
                loading="eager"
                decoding="async"
                className="h-full w-full object-cover transition-transform duration-500 hover:scale-[1.01]"
                style={{ objectPosition: '50% 72%', filter: 'brightness(1.16) saturate(1.22) sepia(0.12) contrast(1.04)' }}
              />
            </div>
          </div>

          {/* Arch Finial Bottom */}
          <Finial className="absolute -bottom-[16px] left-1/2 z-20 -translate-x-1/2 rotate-180" />
        </div>
      </div>
    </section>
  )
}
