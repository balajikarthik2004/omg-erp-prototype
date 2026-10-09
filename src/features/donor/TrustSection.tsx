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
      className="relative w-full overflow-hidden bg-[#F8EFD9] py-9 sm:py-10"
    >
      {/* Left seamless faded devotional lamp visual */}
      <div
        className="pointer-events-none absolute inset-y-0 left-0 z-0 hidden w-[340px] lg:block xl:w-[390px] 2xl:w-[430px]"
        aria-hidden
      >
        <img
          src="/images/kuthu-vilakku-trust.png"
          alt=""
          className="h-full w-full object-cover object-left"
        />
      </div>

      {/* Main Content Strip */}
      <div
        className={cn(
          'relative z-10 mx-auto w-full max-w-[1440px] px-5 sm:px-8 xl:px-12',
          'reveal',
          seen && 'is-visible',
        )}
      >
        <div className="grid items-start gap-8 lg:grid-cols-[25%_28%_1fr] xl:grid-cols-[24%_27%_1fr] 2xl:grid-cols-[22%_28%_1fr]">
          
          {/* Column 1: Mobile image fallback / Desktop background spacer */}
          <div className="flex justify-center lg:hidden">
            <div className="h-[220px] w-full max-w-[320px] overflow-hidden rounded-xl">
              <img
                src="/images/kuthu-vilakku-trust.png"
                alt="Traditional lit brass Kuthu Vilakku lamp"
                className="h-full w-full object-cover object-left"
              />
            </div>
          </div>
          <div className="hidden h-full lg:block" aria-hidden />

          {/* Column 2: Introduction & Main Message */}
          <div className="flex flex-col justify-start pr-2">
            <p className="text-[10.5px] font-semibold tracking-[0.22em] text-[#A66A08] uppercase">
              Why a devotee can trust where it goes
            </p>
            <h2 className="mt-2 font-heritage text-[30px] font-normal leading-[1.08] text-[#342018] sm:text-[34px]">
              Your offering<br />creates real change
            </h2>
            <p className="mt-3 max-w-[280px] text-[13px] leading-[1.6] text-[#765E50]">
              Transparency, accountability and devotion are at the heart of everything we do. Here's how your support makes a difference.
            </p>
          </div>

          {/* Column 3: The 3 Process Steps & Bottom Action */}
          <div className="flex flex-col justify-between gap-6">
            {/* The 3 steps in horizontal row */}
            <div className="grid grid-cols-1 items-start gap-6 sm:grid-cols-[1fr_auto_1fr_auto_1fr] sm:gap-2">
              
              {/* Step 01 */}
              <div className="flex flex-col items-start pr-1">
                <span className="flex size-[48px] items-center justify-center rounded-full bg-[#FCECE8] text-[#B1241B] shadow-xs">
                  <ReceiptTrustIcon size={23} />
                </span>
                <span className="mt-2.5 text-[12.5px] font-bold tracking-wider text-[#A66A08]">
                  01
                </span>
                <h3 className="mt-0.5 font-heritage text-[17.5px] font-medium leading-snug text-[#342018]">
                  Received at once
                </h3>
                <p className="mt-1.5 text-[12.5px] leading-[1.58] text-[#765E50]">
                  Your receipt number is issued the moment the offering is made, with the fund it belongs to named on it.
                </p>
              </div>

              {/* Arrow 1 */}
              <div
                className="mt-3.5 hidden select-none px-1 text-[18px] text-[#C48B18] sm:flex sm:self-start"
                aria-hidden
              >
                →
              </div>

              {/* Step 02 */}
              <div className="flex flex-col items-start px-1">
                <span className="flex size-[48px] items-center justify-center rounded-full bg-[#EAF5E5] text-[#2E7D32] shadow-xs">
                  <SignatureTrustIcon size={23} />
                </span>
                <span className="mt-2.5 text-[12.5px] font-bold tracking-wider text-[#A66A08]">
                  02
                </span>
                <h3 className="mt-0.5 font-heritage text-[17.5px] font-medium leading-snug text-[#342018]">
                  Two signatures to spend
                </h3>
                <p className="mt-1.5 text-[12.5px] leading-[1.58] text-[#765E50]">
                  Whoever prepares a payment can never approve it. Every rupee leaving needs a second pair of eyes.
                </p>
              </div>

              {/* Arrow 2 */}
              <div
                className="mt-3.5 hidden select-none px-1 text-[18px] text-[#C48B18] sm:flex sm:self-start"
                aria-hidden
              >
                →
              </div>

              {/* Step 03 */}
              <div className="flex flex-col items-start pl-1">
                <span className="flex size-[48px] items-center justify-center rounded-full bg-[#F0EBFA] text-[#7C3AED] shadow-xs">
                  <ShieldTrustIcon size={23} />
                </span>
                <span className="mt-2.5 text-[12.5px] font-bold tracking-wider text-[#A66A08]">
                  03
                </span>
                <h3 className="mt-0.5 font-heritage text-[17.5px] font-medium leading-snug text-[#342018]">
                  Restricted stays restricted
                </h3>
                <p className="mt-1.5 text-[12.5px] leading-[1.58] text-[#765E50]">
                  A gift to the kitchen cannot quietly become a gift to something else. The system refuses it.
                </p>
              </div>
            </div>

            {/* Bottom Action Strip */}
            <div className="flex flex-wrap items-center gap-5 pt-2">
              <Link
                to="/about#governance"
                className="inline-flex h-[36px] items-center gap-1.5 rounded-full border border-[#D8A83E] bg-transparent px-4 text-[13px] font-medium text-[#795229] transition-colors hover:bg-[#F3E5C6]"
              >
                <span>Learn more about our process</span>
                <span className="text-[15px] text-[#C48B18]">→</span>
              </Link>

              <div className="hidden items-center gap-2.5 text-[#D8A83E]/70 sm:flex" aria-hidden>
                <span className="h-px w-14 bg-[#D8A83E]/40" />
                <HeritageKolamStar size={13} className="text-[#D8A83E]" />
                <span className="h-px w-14 bg-[#D8A83E]/40" />
              </div>
            </div>
          </div>

        </div>
      </div>
    </section>
  )
}
