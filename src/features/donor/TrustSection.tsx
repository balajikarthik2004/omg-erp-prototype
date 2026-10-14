import { Link } from 'react-router-dom'

import { cn } from '@/lib/cn'
import {
  ReceiptTrustIcon,
  SignatureTrustIcon,
  ShieldTrustIcon,
  HeritageKolamStar,
} from './HeritageArt'
import { useReveal } from './useReveal'

/**
 * Full-width Editorial Trust Strip: "Why a devotee can trust where it goes"
 * Matches the reference composition: Left seamless lamp, story intro, and 3-step process flow with arrows.
 */
export function TrustSection() {
  const { ref, seen } = useReveal<HTMLElement>()

  return (
    <section
      ref={ref}
      id="our-promise"
      className="relative w-full overflow-hidden bg-gradient-to-r from-[#06081E] via-[#0D123C] to-[#141A4C] py-14 sm:py-18 text-white border-y border-navy-700/60 shadow-2xl"
    >
      {/* Warm Ambient Golden Flame Glow behind the Lamp */}
      <div
        className="pointer-events-none absolute -left-10 top-1/2 -translate-y-1/2 size-[420px] rounded-full bg-amber-500/20 blur-3xl"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute left-32 top-1/3 size-64 rounded-full bg-turmeric-400/10 blur-2xl"
        aria-hidden
      />

      {/* Left authentic devotional lamp visual with original vibrant colors */}
      <div
        className="pointer-events-none absolute inset-y-0 left-0 z-0 hidden w-[360px] lg:block xl:w-[420px] 2xl:w-[480px]"
        style={{
          maskImage: 'linear-gradient(to right, black 0%, black 56%, transparent 95%)',
          WebkitMaskImage: 'linear-gradient(to right, black 0%, black 56%, transparent 95%)',
        }}
        aria-hidden
      >
        <img
          src="/images/kuthu-vilakku-trust.png"
          alt="Traditional lit brass Kuthu Vilakku lamp"
          className="h-full w-full object-cover object-left"
        />
        {/* Soft edge blending to dissolve seamlessly into background */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#06081E]/70 via-transparent to-[#06081E]/70 pointer-events-none" />
      </div>

      {/* Main Content Strip */}
      <div
        className={cn(
          'relative z-10 mx-auto w-full max-w-360 px-5 sm:px-8 xl:px-12',
          'reveal',
          seen && 'is-visible',
        )}
      >
        <div className="grid items-center gap-8 lg:grid-cols-[24%_28%_1fr] xl:grid-cols-[23%_27%_1fr] 2xl:grid-cols-[22%_28%_1fr]">
          
          {/* Column 1: Mobile image fallback / Desktop background spacer */}
          <div className="flex justify-center lg:hidden">
            <div className="relative h-60 w-full max-w-[340px] overflow-hidden rounded-2xl bg-black/20 p-2 shadow-2xl">
              <img
                src="/images/kuthu-vilakku-trust.png"
                alt="Traditional lit brass Kuthu Vilakku lamp"
                className="h-full w-full object-cover object-left rounded-xl"
              />
              <div className="absolute inset-0 rounded-2xl bg-gradient-to-t from-black/40 via-transparent to-transparent pointer-events-none" />
            </div>
          </div>
          <div className="hidden h-full lg:block" aria-hidden />

          {/* Column 2: Introduction & Main Message */}
          <div className="flex flex-col justify-start pr-2">
            <div className="inline-flex items-center gap-2.5 rounded-full bg-gradient-to-r from-turmeric-500/20 via-amber-500/15 to-white/5 px-3.5 py-1.5 w-fit mb-3.5 backdrop-blur-md shadow-xs">
              <span className="size-2 rounded-full bg-turmeric-400 shadow-[0_0_8px_#FFC107] animate-pulse" />
              <p className="text-[11px] font-bold tracking-[0.2em] text-turmeric-300 uppercase">
                Honest Devotional Governance
              </p>
            </div>
            
            <h2 className="font-heritage text-[28px] sm:text-[38px] font-bold leading-[1.12] text-white tracking-tight">
              Your offering creates<br />
              <span className="text-turmeric-400 font-extrabold drop-shadow-[0_2px_12px_rgba(255,193,7,0.35)]">
                real change
              </span>
            </h2>
            
            <p className="mt-3.5 max-w-sm text-[14.5px] sm:text-[15px] leading-[1.7] text-white/85 font-normal">
              Transparency, accountability and devotion are at the heart of everything we do. Every rupee is protected by double-signed CA approvals.
            </p>
          </div>

          {/* Column 3: The 3 Process Steps & Bottom Action */}
          <div className="flex flex-col justify-between gap-6">
            {/* The 3 steps in horizontal row */}
            <div className="grid grid-cols-1 items-stretch gap-4 sm:grid-cols-[1fr_auto_1fr_auto_1fr] sm:gap-2.5">
              
              {/* Step 01 */}
              <div className="group relative flex flex-col items-start rounded-2xl bg-gradient-to-b from-white/[0.12] to-white/[0.04] p-5 backdrop-blur-xl shadow-xl shadow-black/20 hover:bg-white/[0.18] hover:-translate-y-1 transition-all duration-300">
                <div className="absolute inset-x-0 top-0 h-0.5 rounded-t-2xl bg-gradient-to-r from-transparent via-white/25 to-transparent group-hover:via-turmeric-400 transition-all duration-300" />
                <span className="flex size-11.5 items-center justify-center rounded-xl bg-gradient-to-br from-kumkum-500 to-kumkum-600 text-white shadow-lg shadow-kumkum-500/30">
                  <ReceiptTrustIcon size={22} />
                </span>
                <span className="mt-3.5 inline-flex items-center rounded-md bg-turmeric-400/15 px-2 py-0.5 text-[11px] font-bold tracking-widest text-turmeric-300 uppercase">
                  Step 01
                </span>
                <h3 className="mt-1.5 font-heritage text-[17px] font-bold leading-snug text-white">
                  Received at once
                </h3>
                <p className="mt-1.5 text-[12.5px] leading-[1.6] text-white/80">
                  Your official receipt number is issued instantly, with the restricted fund clearly named.
                </p>
              </div>

              {/* Arrow 1 */}
              <div
                className="hidden select-none px-1 sm:flex sm:items-center sm:justify-center"
                aria-hidden
              >
                <div className="flex items-center gap-1 text-turmeric-400/70">
                  <span className="h-px w-3 bg-gradient-to-r from-transparent to-turmeric-400/60" />
                  <span className="size-1 rounded-full bg-turmeric-400 shadow-[0_0_6px_#FFC107]" />
                  <span className="text-[16px] font-bold text-turmeric-400">→</span>
                </div>
              </div>

              {/* Step 02 */}
              <div className="group relative flex flex-col items-start rounded-2xl bg-gradient-to-b from-white/[0.12] to-white/[0.04] p-5 backdrop-blur-xl shadow-xl shadow-black/20 hover:bg-white/[0.18] hover:-translate-y-1 transition-all duration-300">
                <div className="absolute inset-x-0 top-0 h-0.5 rounded-t-2xl bg-gradient-to-r from-transparent via-white/25 to-transparent group-hover:via-turmeric-400 transition-all duration-300" />
                <span className="flex size-11.5 items-center justify-center rounded-xl bg-gradient-to-br from-navy-500 to-navy-600 text-white shadow-lg shadow-navy-500/30">
                  <SignatureTrustIcon size={22} />
                </span>
                <span className="mt-3.5 inline-flex items-center rounded-md bg-turmeric-400/15 px-2 py-0.5 text-[11px] font-bold tracking-widest text-turmeric-300 uppercase">
                  Step 02
                </span>
                <h3 className="mt-1.5 font-heritage text-[17px] font-bold leading-snug text-white">
                  Two signatures
                </h3>
                <p className="mt-1.5 text-[12.5px] leading-[1.6] text-white/80">
                  Whoever prepares a disbursement can never approve it. Every release requires a CA co-signature.
                </p>
              </div>

              {/* Arrow 2 */}
              <div
                className="hidden select-none px-1 sm:flex sm:items-center sm:justify-center"
                aria-hidden
              >
                <div className="flex items-center gap-1 text-turmeric-400/70">
                  <span className="h-px w-3 bg-gradient-to-r from-transparent to-turmeric-400/60" />
                  <span className="size-1 rounded-full bg-turmeric-400 shadow-[0_0_6px_#FFC107]" />
                  <span className="text-[16px] font-bold text-turmeric-400">→</span>
                </div>
              </div>

              {/* Step 03 */}
              <div className="group relative flex flex-col items-start rounded-2xl bg-gradient-to-b from-white/[0.12] to-white/[0.04] p-5 backdrop-blur-xl shadow-xl shadow-black/20 hover:bg-white/[0.18] hover:-translate-y-1 transition-all duration-300">
                <div className="absolute inset-x-0 top-0 h-0.5 rounded-t-2xl bg-gradient-to-r from-transparent via-white/25 to-transparent group-hover:via-turmeric-400 transition-all duration-300" />
                <span className="flex size-11.5 items-center justify-center rounded-xl bg-gradient-to-br from-turmeric-400 to-amber-500 text-navy-950 font-black shadow-lg shadow-turmeric-400/30">
                  <ShieldTrustIcon size={22} />
                </span>
                <span className="mt-3.5 inline-flex items-center rounded-md bg-turmeric-400/15 px-2 py-0.5 text-[11px] font-bold tracking-widest text-turmeric-300 uppercase">
                  Step 03
                </span>
                <h3 className="mt-1.5 font-heritage text-[17px] font-bold leading-snug text-white">
                  Restricted stays
                </h3>
                <p className="mt-1.5 text-[12.5px] leading-[1.6] text-white/80">
                  A gift to annadhanam cannot be diverted to projects. Segregated by software policy.
                </p>
              </div>
            </div>

            {/* Bottom Action Strip */}
            <div className="flex flex-wrap items-center gap-6 pt-2">
              <Link
                to="/about#governance"
                className="group inline-flex h-11 items-center gap-2.5 rounded-xl bg-gradient-to-r from-turmeric-400 via-amber-400 to-turmeric-500 hover:from-turmeric-300 hover:to-amber-400 active:scale-[0.98] text-navy-950 px-6 text-xs sm:text-[13px] font-extrabold uppercase tracking-wider shadow-lg shadow-turmeric-500/25 hover:shadow-turmeric-400/40 transition-all"
              >
                <span>Learn more about governance process</span>
                <span className="text-[14px] transition-transform duration-200 group-hover:translate-x-1">→</span>
              </Link>

              <div className="hidden items-center gap-3 text-white/50 sm:flex" aria-hidden>
                <span className="h-px w-16 bg-gradient-to-r from-white/30 to-transparent" />
                <HeritageKolamStar size={15} className="text-turmeric-400 drop-shadow-[0_0_8px_rgba(255,193,7,0.5)]" />
                <span className="h-px w-16 bg-gradient-to-l from-white/30 to-transparent" />
              </div>
            </div>
          </div>

        </div>
      </div>
    </section>
  )
}
