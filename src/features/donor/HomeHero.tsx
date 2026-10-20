import { Link } from 'react-router-dom'
import { ArrowRight, CreditCard, ShieldCheck, Star } from 'lucide-react'

import { Etching } from '@/components/ui/Ornament'
import { TempleTowerIcon } from './HeritageArt'

/** The photograph's own edge, dissolved. Opaque only past its right half,
 *  so the headline column never has stone under it. */
const TEMPLE_FADE =
  'linear-gradient(90deg, transparent 0%, transparent 22%, rgba(0,0,0,0.10) 40%, rgba(0,0,0,0.48) 57%, rgba(0,0,0,0.88) 73%, #000 85%)'

/** Golden hour over the stone: brass in the sky, sanctum dark at the foot, so
 *  the eye travels up the tower rather than off the bottom edge. */
const GOLDEN_HOUR =
  'linear-gradient(180deg, color-mix(in srgb, var(--color-turmeric-400) 20%, transparent) 0%, transparent 32%, color-mix(in srgb, var(--color-sanctum-950) 30%, transparent) 80%, color-mix(in srgb, var(--color-sanctum-950) 48%, transparent) 100%)'

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
    <section className="relative isolate overflow-hidden bg-sandal-50 pb-6 pt-3 sm:pb-8 sm:pt-4 lg:pb-10 lg:pt-5">
      {/* ------------------------------------------------------------------
          The gopuram itself, unframed. It fills the right of the section and
          bleeds off the top and right edges, then dissolves leftward into the
          page so the headline keeps its paper. Standing inside the temple
          reads as devotion; the same photograph cut into a gold-rimmed arch
          read as a picture of one.
          ------------------------------------------------------------------ */}
      <div className="pointer-events-none absolute inset-0 -z-20 select-none" aria-hidden>
        {/* From lg the photograph and its washes share one soft-edged mask, so
            the stone dissolves into the paper with no seam to find. A veil
            laid over the top instead always shows the picture's own edge. */}
        <div
          className="absolute inset-y-0 right-0 hidden w-[68%] lg:block xl:w-[64%]"
          style={{
            WebkitMaskImage: TEMPLE_FADE,
            maskImage: TEMPLE_FADE,
          }}
        >
          <img
            src="/images/temple-gopuram-grand.webp"
            alt=""
            loading="eager"
            decoding="async"
            className="h-full w-full scale-105 object-cover object-[58%_38%]"
          />
          <div className="absolute inset-0" style={{ background: GOLDEN_HOUR }} />
        </div>

        {/* Below lg it sits behind the words, so it is veiled down to a
            devotional texture rather than competing with them. */}
        <div className="absolute inset-0 lg:hidden">
          <img
            src="/images/temple-gopuram-grand.webp"
            alt=""
            loading="eager"
            decoding="async"
            className="h-full w-full object-cover object-[58%_38%]"
          />
          <div
            className="absolute inset-0"
            style={{
              background:
                'linear-gradient(180deg, color-mix(in srgb, var(--color-sandal-50) 94%, transparent) 0%, color-mix(in srgb, var(--color-sandal-50) 90%, transparent) 60%, color-mix(in srgb, var(--color-sandal-50) 97%, transparent) 100%)',
            }}
          />
        </div>

        {/* Settle into the wave divider at the foot of the section. */}
        <div
          className="absolute inset-x-0 bottom-0 h-28"
          style={{
            background:
              'linear-gradient(180deg, transparent 0%, color-mix(in srgb, var(--color-sandal-50) 65%, transparent) 72%, var(--color-sandal-50) 100%)',
          }}
        />
      </div>

      {/* Sacred mandala, turning slowly over the stone. */}
      <div
        className="pointer-events-none absolute right-2 top-[44%] -z-10 h-136 w-136 -translate-y-1/2 select-none opacity-[0.10] lg:right-10 lg:opacity-[0.16] xl:right-20"
        aria-hidden
      >
        <Etching src="/images/hero-mandala-etching.png" className="bg-sandal-50" position="center" />
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
              <strong className="font-semibold text-stone-900">Tamil Heritage</strong>. Every offering is
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
          {/* Right: nothing framed. The temple is already behind this     */}
          {/* column, so it carries only what has to be read over it.      */}
          {/* ---------------------------------------------------------- */}
          <div className="relative mt-5 flex flex-row flex-wrap items-start gap-2.5 lg:mt-0 lg:min-h-125 lg:flex-col lg:items-stretch lg:justify-end lg:gap-3 xl:min-h-135">
            {/* On a phone the stone is a faint wash, so these keep the page
                border; from lg they sit on the photograph and need the glass
                treatment to stay legible. */}
            <p className="inline-flex w-fit items-center gap-2 rounded-full border border-sandal-200 bg-sandal-50/95 px-3.5 py-1.5 shadow-lift backdrop-blur-md lg:border-white/25 lg:bg-sanctum-950/45">
              <span className="flex items-center gap-1">
                <Star className="size-3.5 fill-turmeric-400 text-turmeric-400" aria-hidden />
                <span className="font-mono text-[12px] font-bold tabular-nums text-stone-900 lg:text-white">
                  4.9
                </span>
              </span>
              <span className="text-sandal-300 lg:text-white/35" aria-hidden>
                ·
              </span>
              <span className="font-mono text-[11px] tabular-nums text-stone-500 lg:text-white/80">
                85,000+ offerings
              </span>
            </p>

            <p className="inline-flex w-fit items-center gap-2.5 rounded-xl border border-sandal-200 bg-sandal-50/95 px-3.5 py-2 shadow-lift backdrop-blur-md lg:border-white/25 lg:bg-sanctum-950/45">
              <ShieldCheck className="size-4.5 shrink-0 text-tulsi-500 lg:text-tulsi-300" aria-hidden />
              <span className="text-left">
                <span className="block text-[10.5px] font-bold uppercase tracking-[0.12em] text-stone-900 lg:text-white">
                  Public CA audit
                </span>
                <span className="block text-[11px] text-stone-500 lg:text-white/80">
                  Double-signed and verified
                </span>
              </span>
            </p>

          </div>
        </div>
      </div>

      {/* Blooming lotus, bottom left */}
      <div
        className="pointer-events-none absolute -bottom-5 -left-5 z-0 w-28 select-none opacity-90 drop-shadow-md sm:-bottom-7 sm:left-0 sm:w-36 lg:left-4 lg:w-44"
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
