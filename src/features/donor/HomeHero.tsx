import { Link } from 'react-router-dom'
import { ArrowRight, CalendarDays, ChevronRight, CreditCard, ShieldCheck, Star } from 'lucide-react'

import { Etching } from '@/components/ui/Ornament'
import { TempleTowerIcon } from './HeritageArt'

// Normalized path for SVG clipPath (0 to 1 objectBoundingBox)
const ARCH_CLIP_PATH =
  'M 0.0867,1.0000 L 0.0867,0.4571 C 0.0867,0.4357 0.0967,0.4229 0.1133,0.4143 C 0.0833,0.3786 0.0867,0.3257 0.1417,0.2943 C 0.1867,0.2686 0.2100,0.2743 0.2367,0.2800 C 0.2100,0.2400 0.2250,0.1857 0.2867,0.1600 C 0.3367,0.1386 0.3667,0.1500 0.3933,0.1571 C 0.3833,0.1114 0.4250,0.0600 0.5000,0.0286 C 0.5750,0.0600 0.6167,0.1114 0.6067,0.1571 C 0.6333,0.1500 0.6633,0.1386 0.7133,0.1600 C 0.7750,0.1857 0.7900,0.2400 0.7633,0.2800 C 0.7900,0.2743 0.8133,0.2686 0.8583,0.2943 C 0.9133,0.3257 0.9167,0.3786 0.8867,0.4143 C 0.9033,0.4229 0.9133,0.4357 0.9133,0.4571 L 0.9133,1.0000 Z'

// Path for SVG stroke border in 600x700 viewBox
const ARCH_STROKE_PATH = `
  M 52,700
  L 52,320
  C 52,305 58,296 68,290
  C 50,265 52,228 85,206
  C 112,188 126,192 142,196
  C 126,168 135,130 172,112
  C 202,97 220,105 236,110
  C 230,78 255,42 300,20
  C 345,42 370,78 364,110
  C 380,105 398,97 428,112
  C 465,130 474,168 458,196
  C 474,192 488,188 515,206
  C 548,228 550,265 532,290
  C 542,296 548,305 548,320
  L 548,700
`

/** The three claims under the fold. Each names something the product does. */
const ASSURANCES = [
  {
    icon: ShieldCheck,
    title: 'Verified services',
    detail: 'Every seva is listed by the temple itself',
    tone: 'navy' as const,
  },
  {
    icon: TempleTowerIcon,
    title: 'Temple experiences',
    detail: 'Poojas, homams, festivals and annadhanam',
    tone: 'kumkum' as const,
  },
  {
    icon: CreditCard,
    title: 'Secure payments',
    detail: 'Card, Apple Pay and Google Pay. No card data stored',
    tone: 'navy' as const,
  },
]

export function HomeHero() {
  return (
    <section className="relative isolate overflow-hidden bg-linear-to-b from-sandal-50 via-sandal-50 to-navy-50 pb-6 pt-3 sm:pb-8 sm:pt-4 lg:pb-10 lg:pt-5">
      {/* Hidden SVG defining the normalized clip path for the temple arch */}
      <svg width="0" height="0" className="pointer-events-none absolute" aria-hidden>
        <defs>
          <clipPath id="templeSanctumArch" clipPathUnits="objectBoundingBox">
            <path d={ARCH_CLIP_PATH} />
          </clipPath>
        </defs>
      </svg>

      {/* Atmospheric glow. Brass warmth on the arch side, navy on the type side. */}
      <div
        className="pointer-events-none absolute inset-0 -z-10"
        style={{
          background:
            'radial-gradient(ellipse 65% 55% at 84% 38%, color-mix(in srgb, var(--color-turmeric-400) 18%, transparent) 0%, color-mix(in srgb, var(--color-kumkum-500) 8%, transparent) 32%, transparent 68%), radial-gradient(circle at 16% 25%, color-mix(in srgb, var(--color-navy-600) 6%, transparent) 0%, transparent 48%)',
        }}
        aria-hidden
      />

      {/* Sacred mandala watermark behind the arch */}
      <div
        className="pointer-events-none absolute right-2 top-[42%] z-0 h-136 w-136 -translate-y-1/2 select-none opacity-[0.14] lg:right-10 xl:right-20"
        aria-hidden
      >
        <Etching src="/images/hero-mandala-etching.png" className="bg-navy-600" position="center" />
      </div>

      {/* Hanging brass deepams from the top right */}
      <div
        className="pointer-events-none absolute -top-1 right-2 z-25 h-68 w-36 select-none drop-shadow-lg sm:right-6 sm:h-78 sm:w-44 lg:right-8 lg:h-88 xl:right-14"
        aria-hidden
      >
        <img
          src="/images/hero-hanging-deepams.png"
          alt=""
          className="h-full w-full object-contain object-top"
        />
      </div>

      <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 xl:px-10">
        <div className="grid items-center gap-7 lg:grid-cols-[1.12fr_0.88fr] lg:gap-8 xl:grid-cols-[1.16fr_0.84fr] xl:gap-12">
          {/* ---------------------------------------------------------- */}
          {/* Left: the claim, the two ways in, and what backs them up    */}
          {/* ---------------------------------------------------------- */}
          <div className="animate-rise relative z-10 pt-1 lg:pt-0">
            <p className="inline-flex items-center gap-2 rounded-full border border-sandal-200 bg-sandal-50 px-3.5 py-1.5 shadow-flat">
              <span className="text-[14px] font-bold leading-none text-kumkum-600">ॐ</span>
              <span className="text-[11px] font-bold uppercase tracking-[0.16em] text-stone-700">
                Devotion <span className="mx-1 text-sandal-300">·</span> Service{' '}
                <span className="mx-1 text-sandal-300">·</span> Culture{' '}
                <span className="mx-1 text-sandal-300">·</span> Community
              </span>
            </p>

            <h1 className="mt-4 font-display text-[34px] font-semibold leading-[1.07] tracking-tight text-stone-900 sm:text-[44px] md:text-[50px] lg:text-[48px] xl:text-[56px]">
              <span className="block">Your spiritual journey,</span>
              <span className="mt-0.5 block text-kumkum-600 sm:mt-1">made simple.</span>
            </h1>

            <p className="mt-4 max-w-xl text-[15.5px] leading-relaxed text-stone-700">
              Book a pooja, sponsor annadhanam or give to a project across{' '}
              <strong className="font-semibold text-stone-900">Temple</strong>,{' '}
              <strong className="font-semibold text-stone-900">Sevalaya</strong> and{' '}
              <strong className="font-semibold text-stone-900">Tamil Sangam</strong>. Every offering is
              receipted on the spot and signed off by two people.
            </p>

            <div className="mt-6 flex flex-wrap items-center gap-3">
              <Link
                to="/donate/temple"
                className="group inline-flex items-center justify-center gap-2.5 rounded-xl bg-kumkum-600 px-6 py-3.5 text-[15px] font-bold text-white shadow-flat transition-colors duration-150 hover:bg-kumkum-700 active:bg-kumkum-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-navy-400 focus-visible:ring-offset-2 sm:px-7 sm:text-[16px]"
              >
                <LotusIcon />
                <span>Explore poojas</span>
                <ArrowRight
                  className="size-4.5 transition-transform duration-200 group-hover:translate-x-1 motion-reduce:transition-none motion-reduce:group-hover:translate-x-0"
                  aria-hidden
                />
              </Link>

              <Link
                to="/sevalaya/seva"
                className="inline-flex items-center justify-center gap-2.5 rounded-xl border border-navy-600 bg-sandal-50 px-6 py-3.5 text-[15px] font-bold text-navy-700 transition-colors duration-150 hover:bg-navy-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-navy-400 focus-visible:ring-offset-2 sm:px-7 sm:text-[16px]"
              >
                <TempleTowerIcon size={20} className="text-navy-700" />
                <span>Support a seva</span>
              </Link>
            </div>

            <ul className="mt-7 grid grid-cols-1 gap-4 sm:grid-cols-3">
              {ASSURANCES.map(({ icon: Icon, title, detail, tone }) => (
                <li key={title} className="flex items-start gap-2.5">
                  <span
                    className={`flex size-9 shrink-0 items-center justify-center rounded-full ${
                      tone === 'kumkum' ? 'bg-kumkum-50 text-kumkum-600' : 'bg-navy-50 text-navy-600'
                    }`}
                  >
                    <Icon className="size-4.5" size={18} aria-hidden />
                  </span>
                  <span className="min-w-0">
                    <span className="block text-[13px] font-bold leading-tight text-stone-900">{title}</span>
                    <span className="mt-0.5 block text-[11.5px] leading-snug text-stone-500">{detail}</span>
                  </span>
                </li>
              ))}
            </ul>
          </div>

          {/* ---------------------------------------------------------- */}
          {/* Right: the sanctum arch                                     */}
          {/* ---------------------------------------------------------- */}
          <div className="relative mx-auto w-full max-w-105 sm:max-w-115 lg:ml-auto lg:mr-0 lg:max-w-122 xl:max-w-132">
            <div className="group relative aspect-[6/7] w-full">
              <div
                className="relative h-full w-full overflow-hidden shadow-2xl shadow-navy-950/30 transition-transform duration-700 ease-out group-hover:scale-[1.01] motion-reduce:transition-none motion-reduce:group-hover:scale-100"
                style={{ clipPath: 'url(#templeSanctumArch)', WebkitClipPath: 'url(#templeSanctumArch)' }}
              >
                <img
                  src="/images/temple-gopuram-grand.webp"
                  alt="A South Indian temple raja gopuram at golden hour"
                  loading="eager"
                  decoding="async"
                  // The photo is landscape in a portrait arch, so cover scales it to the
                  // frame height and crops the sides: only the horizontal position
                  // does anything here. Centred puts the gopuram on the arch axis.
                  className="h-full w-full scale-102 object-cover object-center saturate-[1.1] transition-transform duration-1000 ease-out group-hover:scale-106 motion-reduce:transition-none motion-reduce:group-hover:scale-102"
                />

                <div
                  className="pointer-events-none absolute inset-0 bg-linear-to-t from-navy-950/55 via-transparent to-navy-950/15"
                  aria-hidden
                />

                <p className="absolute bottom-5 left-10 z-20 hidden items-center gap-2 rounded-lg border border-sandal-200 bg-sandal-50/95 px-3 py-1.5 shadow-lift backdrop-blur-md sm:flex">
                  <ShieldCheck className="size-4 shrink-0 text-tulsi-500" aria-hidden />
                  <span className="text-left">
                    <span className="block text-[10px] font-bold uppercase tracking-[0.12em] text-stone-900">
                      Public CA audit
                    </span>
                    <span className="block text-[10.5px] text-stone-500">Double-signed and verified</span>
                  </span>
                </p>
              </div>

              {/* Brass rim tracing the multi-cusped arch. The stops below are a
                  metallic ramp — highlight, body and shadow — which the flat
                  turmeric token cannot express, so this stays hand-mixed, as
                  the other hand-drawn ornament does. */}
              <svg
                viewBox="0 0 600 700"
                className="pointer-events-none absolute inset-0 z-15 size-full"
                fill="none"
                aria-hidden
              >
                <defs>
                  <linearGradient id="goldArchRim" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#FFF2B2" />
                    <stop offset="20%" stopColor="#F5C138" />
                    <stop offset="45%" stopColor="#FFF9DB" />
                    <stop offset="70%" stopColor="#D99B16" />
                    <stop offset="100%" stopColor="#FFD54F" />
                  </linearGradient>
                  <filter id="goldGlow" x="-20%" y="-20%" width="140%" height="140%">
                    <feGaussianBlur stdDeviation="4" result="blur" />
                    <feComposite in="SourceGraphic" in2="blur" operator="over" />
                  </filter>
                </defs>

                <path
                  d={ARCH_STROKE_PATH}
                  stroke="#FFC107"
                  strokeWidth="8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  opacity="0.38"
                  filter="url(#goldGlow)"
                />
                <path
                  d={ARCH_STROKE_PATH}
                  stroke="url(#goldArchRim)"
                  strokeWidth="3.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path
                  d={ARCH_STROKE_PATH}
                  stroke="#FFFFFF"
                  strokeWidth="1.2"
                  opacity="0.65"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>

              {/* Booking shortcut, overlapping the left edge of the arch */}
              <Link
                to="/donate/temple"
                className="group/card absolute -left-5 top-[48%] z-25 flex -translate-y-1/2 items-center gap-3.5 rounded-xl border border-sandal-200 bg-sandal-50 p-3 shadow-lift transition-shadow duration-200 hover:shadow-sheet focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-navy-400 sm:-left-8 sm:px-4 sm:py-3.5 lg:-left-12"
              >
                <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-navy-50 text-navy-600 sm:size-11">
                  <CalendarDays className="size-5" aria-hidden />
                </span>
                <span className="pr-1 text-left">
                  <span className="block text-[13px] font-bold leading-tight text-stone-900 sm:text-[14px]">
                    Book a pooja
                  </span>
                  <span className="mt-0.5 block text-[11px] leading-tight text-stone-500 sm:text-[12px]">
                    Choose temple, date and seva
                  </span>
                </span>
                <ChevronRight
                  className="size-4 shrink-0 text-navy-600 transition-transform duration-200 group-hover/card:translate-x-1 motion-reduce:transition-none motion-reduce:group-hover/card:translate-x-0"
                  aria-hidden
                />
              </Link>

              <p className="absolute -top-3 left-8 z-20 flex items-center gap-2 rounded-full border border-sandal-200 bg-sandal-50 px-3 py-1 shadow-flat sm:left-14">
                <span className="flex items-center gap-1 text-turmeric-500">
                  <Star className="size-3 fill-turmeric-400 text-turmeric-400" aria-hidden />
                  <span className="font-mono text-[11px] font-bold tabular-nums text-stone-900">4.9</span>
                </span>
                <span className="text-sandal-300" aria-hidden>
                  ·
                </span>
                <span className="font-mono text-[10.5px] tabular-nums text-stone-500">85,000+ offerings</span>
              </p>
            </div>

            {/* Brass diya on stone, bottom right */}
            <div
              className="pointer-events-none absolute -bottom-6 -right-4 z-25 w-36 select-none drop-shadow-[0_12px_24px_rgb(11_13_40/0.25)] sm:-right-6 sm:w-44 lg:-right-4 lg:w-50 xl:-right-2"
              aria-hidden
            >
              <img
                src="/images/quick-hundi-diya.png"
                alt=""
                className="h-auto w-full object-contain saturate-[1.08]"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Blooming lotus, bottom left */}
      <div
        className="pointer-events-none absolute -bottom-5 -left-5 z-10 w-28 select-none opacity-90 drop-shadow-md sm:-bottom-7 sm:left-0 sm:w-36 lg:left-4 lg:w-44"
        aria-hidden
      >
        <img src="/images/hero-lotus-flower.png" alt="" className="h-auto w-full object-contain" />
      </div>

      {/* Wave divider into the section below */}
      <div className="pointer-events-none absolute inset-x-0 bottom-0 z-20" aria-hidden>
        <svg viewBox="0 0 1440 68" fill="none" preserveAspectRatio="none" className="h-8 w-full sm:h-11 lg:h-13">
          <path
            d="M0,32 C320,64 520,12 840,40 C1120,66 1300,22 1440,36 L1440,68 L0,68 Z"
            className="fill-sandal-50"
          />
        </svg>
      </div>
    </section>
  )
}

/** The sacred lotus on the primary call to action. */
function LotusIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className="size-5 shrink-0" aria-hidden>
      <path d="M12 2.5C10.5 5.5 10 8 12 10.5C14 8 13.5 5.5 12 2.5Z" />
      <path d="M12 6C9 7.5 7 10 9 13C11.5 12 13.5 9.5 12 6Z" opacity="0.9" />
      <path d="M12 6C15 7.5 17 10 15 13C12.5 12 10.5 9.5 12 6Z" opacity="0.9" />
      <path d="M12 8.5C7.5 10 5.5 12.5 9 16.5C12.5 15.5 14.5 12.5 12 8.5Z" opacity="0.8" />
      <path d="M12 8.5C16.5 10 18.5 12.5 15 16.5C11.5 15.5 9.5 12.5 12 8.5Z" opacity="0.8" />
      <path d="M6.5 17C9 18 15 18 17.5 17C18.5 17.5 19.5 18.5 19.5 19.5H4.5C4.5 18.5 5.5 17.5 6.5 17Z" />
    </svg>
  )
}
