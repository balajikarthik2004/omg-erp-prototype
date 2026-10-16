import { Fragment } from 'react'
import { ArrowRight } from 'lucide-react'

import { cn } from '@/lib/cn'
import { toast } from '@/lib/toast'
import {
  ReceiptTrustIcon,
  SignatureTrustIcon,
  ShieldTrustIcon,
  HeritageKolamStar,
} from './HeritageArt'
import { useReveal } from './useReveal'

/**
 * The three controls that stand between an offering and a misuse of it.
 *
 * These are not marketing claims — each one is a rule the prototype actually
 * enforces in `store/db.ts`, so the copy names the rule rather than the
 * virtue. The numbered sequence matters: a gift is receipted, then released
 * only on a second signature, and never leaves the fund it was given to.
 */
const STEPS = [
  {
    icon: ReceiptTrustIcon,
    title: 'Receipted at once',
    body: 'Your receipt number is issued the moment the payment clears, naming the fund it was credited to.',
  },
  {
    icon: SignatureTrustIcon,
    title: 'Two signatures, always',
    body: 'Whoever prepares a payment can never approve it. Every release is signed by a second person.',
  },
  {
    icon: ShieldTrustIcon,
    title: 'Restricted stays restricted',
    body: 'A gift to annadhanam cannot be spent on a project. The software refuses the transfer.',
  },
]

export function TrustSection() {
  const { ref, seen } = useReveal<HTMLElement>()

  return (
    <section
      ref={ref}
      id="our-promise"
      className="surface-sanctum relative w-full overflow-hidden border-y border-navy-800 py-10 text-white sm:py-12 lg:py-14"
    >
      {/* Warm glow behind the lamp, so the brass reads as lit. */}
      <div
        className="pointer-events-none absolute -left-10 top-1/2 size-110 -translate-y-1/2 rounded-full bg-turmeric-400/25 blur-3xl lg:-left-12 xl:-left-14"
        aria-hidden
      />

      {/* The kuthu vilakku, dissolving into the field on its right edge. */}
      <div
        className="pointer-events-none absolute inset-y-0 -left-4 z-0 hidden w-96 lg:block lg:-left-6 lg:w-[30rem] xl:-left-8 xl:w-[34rem] 2xl:-left-10 2xl:w-[38rem]"
        style={{
          maskImage: 'linear-gradient(to right, black 0%, black 48%, transparent 86%)',
          WebkitMaskImage: 'linear-gradient(to right, black 0%, black 48%, transparent 86%)',
        }}
        aria-hidden
      >
        <img
          src="/images/kuthu-vilakku-trust.png"
          alt=""
          className="h-full w-full object-cover object-left brightness-[1.2] saturate-[1.15]"
        />
      </div>

      <div
        className={cn(
          'relative z-10 mx-auto w-full max-w-360 px-4 sm:px-6 xl:px-10',
          'reveal',
          seen && 'is-visible',
        )}
      >
        <div className="grid items-center gap-6 lg:grid-cols-[20%_31%_1fr] xl:grid-cols-[22%_30%_1fr] xl:gap-8 2xl:grid-cols-[23%_29%_1fr]">
          {/* The lamp again, as a card, where the backdrop is hidden. */}
          <div className="flex justify-center lg:hidden">
            <div className="relative h-56 w-full max-w-85 overflow-hidden rounded-card border border-white/10">
              <img
                src="/images/kuthu-vilakku-trust.png"
                alt=""
                className="h-full w-full object-cover object-left brightness-[1.2] saturate-[1.15]"
              />
            </div>
          </div>
          <div className="hidden h-full lg:block" aria-hidden />

          {/* The claim ------------------------------------------------ */}
          <div className="flex flex-col justify-start pl-2 pr-2 lg:pl-5 xl:pl-7">
            <p className="mb-2.5 inline-flex w-fit items-center gap-1.5 rounded-full border border-turmeric-400/25 bg-turmeric-400/10 px-3 py-1 whitespace-nowrap">
              <span className="size-1.5 rounded-full bg-turmeric-400" aria-hidden />
              <span className="text-[10px] font-bold uppercase tracking-[0.14em] text-turmeric-100 whitespace-nowrap sm:text-[10.5px]">
                How your offering is protected
              </span>
            </p>

            <h2 className="font-display text-[22px] font-semibold leading-[1.15] tracking-tight text-white sm:text-[27px] xl:text-[29px]">
              <span className="block whitespace-nowrap">Where it goes, and</span>
              <span className="block text-turmeric-400">who signed for it.</span>
            </h2>

            <p className="mt-2.5 max-w-sm text-[13.5px] leading-relaxed text-white/75 sm:text-[14px]">
              Three controls sit between your offering and the money leaving the account. None of them
              can be skipped, and every one of them is written into the ledger.
            </p>
          </div>

          {/* The three controls --------------------------------------- */}
          <div className="flex flex-col justify-center gap-4 sm:gap-5">
            <div className="grid grid-cols-1 items-stretch gap-3 sm:grid-cols-[1fr_auto_1fr_auto_1fr] sm:gap-2 lg:gap-2.5">
              {STEPS.map(({ icon: Icon, title, body }, i) => (
                <Fragment key={title}>
                  {i > 0 ? (
                    <span className="hidden select-none items-center justify-center px-0.5 sm:flex" aria-hidden>
                      <ArrowRight className="size-3.5 text-turmeric-400/60" />
                    </span>
                  ) : null}

                  <div className="flex flex-col justify-between rounded-xl border border-white/12 bg-white/8 px-3.5 py-3 transition-colors duration-200 hover:border-turmeric-400/35 hover:bg-white/12 sm:px-4 sm:py-3.5">
                    <div>
                      <span className="flex size-8.5 items-center justify-center rounded-lg bg-turmeric-400 text-navy-950 sm:size-9">
                        <Icon size={18} />
                      </span>
                      <p className="mt-2 font-mono text-[10px] font-bold tabular-nums tracking-widest text-turmeric-400 sm:text-[10.5px]">
                        STEP {String(i + 1).padStart(2, '0')}
                      </p>
                      <h3 className="mt-0.5 font-display text-[14.5px] font-semibold leading-snug text-white sm:text-[15px]">
                        {title}
                      </h3>
                    </div>
                    <p className="mt-1.5 text-[12px] leading-snug text-white/75 sm:text-[12.5px] sm:leading-relaxed">
                      {body}
                    </p>
                  </div>
                </Fragment>
              ))}
            </div>

            <div className="flex flex-wrap items-center gap-5 pt-0.5">
              {/* No public governance page exists yet, so this says so rather
                  than linking to a route that would 404. */}
              <button
                type="button"
                onClick={() =>
                  toast.info('Coming in the next build', 'The public governance page is not written yet.')
                }
                className="group inline-flex h-9.5 items-center gap-2 rounded-xl bg-kumkum-600 px-5 text-[12px] font-bold uppercase tracking-wider text-white transition-colors duration-150 hover:bg-kumkum-700 active:bg-kumkum-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-turmeric-400 focus-visible:ring-offset-2 focus-visible:ring-offset-navy-900 sm:h-10 sm:gap-2.5 sm:px-5.5 sm:text-[12.5px]"
              >
                <span>How governance works</span>
                <ArrowRight
                  className="size-3.5 transition-transform duration-200 group-hover:translate-x-1 motion-reduce:transition-none motion-reduce:group-hover:translate-x-0 sm:size-4"
                  aria-hidden
                />
              </button>

              <span className="hidden items-center gap-2.5 text-white/40 sm:flex" aria-hidden>
                <span className="h-px w-10 bg-white/20" />
                <HeritageKolamStar size={13} className="text-turmeric-400" />
                <span className="h-px w-10 bg-white/20" />
              </span>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
