import { useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight, Check, Pencil } from 'lucide-react'

import { APP } from '@/config'
import { cn } from '@/lib/cn'
import { formatMoney } from '@/lib/format'
import { DiyaIcon, Etching } from '@/components/ui/Ornament'
import { HeritageKolamStar } from './HeritageArt'

const PRESETS = [
  { amount: 10800, label: 'A humble start' },
  { amount: 50100, label: 'For daily seva' },
  { amount: 100100, label: 'Most chosen' },
  { amount: 200100, label: 'For special pooja' },
]

const whole = new Intl.NumberFormat(APP.locale, { style: 'currency', currency: APP.currency, maximumFractionDigits: 0 })

const TILE = 'relative flex min-h-[74px] flex-col items-center justify-center rounded-lg border px-2 py-2.5 text-center'
const SELECTED =
  'border-kumkum-600 bg-kumkum-600 text-sandal-50 shadow-[0_0_0_2px_var(--color-kumkum-600),0_0_0_3.5px_var(--color-sandal-50),0_0_0_5px_var(--color-navy-200)]'

/** The one-tap gift. Straight to the Temple General Fund, no details needed. */
export function QuickHundi() {
  const [selected, setSelected] = useState(100100)
  const [custom, setCustom] = useState(false)
  const [typed, setTyped] = useState('')

  const typedCents = Number(typed) * 100
  const amount = custom && typedCents > 0 ? typedCents : selected

  return (
    <section id="quick-hundi" className="relative -mt-4 scroll-mt-20 bg-sandal-100 pb-8 lg:-mt-6">
      <div className="mx-auto max-w-[1560px] px-3 sm:px-6">
        <div className="animate-rise relative overflow-hidden rounded-[22px] border border-navy-200 bg-sandal-50/70 shadow-card">
          <div className="pointer-events-none absolute inset-[5px] rounded-[18px] border border-navy-100" aria-hidden />

          {/* Left corner faint temple gopuram etching (Transparent PNG) */}
          <div
            className="pointer-events-none absolute -bottom-4 left-0 -z-0 hidden h-[95%] w-60 opacity-[0.16] lg:block"
            aria-hidden
          >
            <Etching
          src="/images/bg-gopuram-etching.png"
          className="bg-navy-600"
          position="bottom left"
        />
          </div>

          <div
            className="pointer-events-none absolute inset-0"
            style={{
              background:
                'radial-gradient(40% 120% at 12% 100%, color-mix(in srgb, var(--color-navy-100) 70%, transparent) 0%, transparent 70%)',
            }}
            aria-hidden
          />

          <div className="relative grid lg:grid-cols-[45fr_55fr]">
            {/* The lit diya lamp and what the gift is */}
            <div className="flex flex-col sm:flex-row items-center sm:items-end gap-5 px-6 pt-6 pb-6 lg:py-5 lg:pl-6 lg:pr-4">
              {/* Authentic lit brass diya image */}
              <div className="relative h-[150px] w-[175px] shrink-0 overflow-hidden rounded-xl border border-navy-300/30 bg-gradient-to-b from-navy-50/80 to-navy-100 shadow-inner sm:h-[160px] sm:w-[190px]">
                <img
                  src="/images/diya-promise.jpg"
                  alt="A traditional lit brass diya oil lamp with bright flame and fragrant white jasmine flowers"
                  className="h-full w-full object-cover object-[48%_46%] mix-blend-multiply"
                />
                <div
                  className="pointer-events-none absolute inset-0 bg-radial from-amber-100/20 via-transparent to-stone-900/10"
                  aria-hidden
                />
              </div>

              <div className="min-w-0 self-center">
                <HeritageKolamStar size={18} className="text-kumkum-500" />
                <h2 className="mt-1 font-heritage text-[22px] sm:text-[32px] leading-tight font-semibold text-stone-900 lg:whitespace-nowrap">
                  Quick hundi offering
                </h2>
                <p className="mt-1.5 font-heritage text-[19px] sm:text-[20px] leading-snug font-medium text-navy-600 lg:whitespace-nowrap">
                  A small offering. A lasting light.
                </p>
                <p className="mt-2 text-[14px] leading-relaxed text-stone-600">
                  Directed to the Temple General Fund.
                  <br />
                  No details needed.
                </p>
              </div>
            </div>

            {/* The Amount Selector */}
            <div className="flex flex-col justify-center border-t border-sandal-200 p-5 sm:p-6 lg:border-t-0 lg:border-l lg:py-5 lg:pr-8 lg:pl-8">
              <p className="font-heritage text-[24px] leading-none font-semibold text-stone-900">Choose an amount</p>

              <div className="mt-3.5 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
                {PRESETS.map((p) => {
                  const on = !custom && selected === p.amount
                  return (
                    <button
                      key={p.amount}
                      type="button"
                      aria-pressed={on}
                      onClick={() => {
                        setSelected(p.amount)
                        setCustom(false)
                      }}
                      className={cn(
                        TILE,
                        'transition-all duration-300 focus-visible:ring-2 focus-visible:ring-navy-400 focus-visible:outline-none',
                        on ? SELECTED : 'border-navy-200 bg-sandal-50 text-stone-900 hover:border-navy-400 hover:bg-navy-50',
                      )}
                    >
                      {on ? (
                        <span
                          className="absolute -top-2.5 -right-2.5 z-10 flex size-[22px] items-center justify-center rounded-full bg-sandal-50 text-kumkum-600 ring-1 ring-kumkum-600"
                          aria-hidden
                        >
                          <Check className="size-3.5 stroke-[3]" />
                        </span>
                      ) : null}
                      <span className="font-heritage text-[27px] leading-none font-bold [font-variant-numeric:lining-nums_tabular-nums]">
                        {whole.format(p.amount / 100)}
                      </span>
                      <span className={cn('mt-1.5 text-[13px] leading-tight', on ? 'text-sandal-100' : 'text-stone-700')}>
                        {p.label}
                      </span>
                    </button>
                  )
                })}

                {custom ? (
                  <label className={cn(TILE, SELECTED)}>
                    <span className="sr-only">Your amount in dollars</span>
                    <input
                      autoFocus
                      inputMode="numeric"
                      placeholder="Amount"
                      value={typed}
                      onChange={(e) => setTyped(e.target.value.replace(/[^0-9]/g, ''))}
                      className="w-full border-b border-sandal-200/60 bg-transparent pb-0.5 text-center font-heritage text-[24px] font-bold [font-variant-numeric:lining-nums] placeholder:text-sandal-200/60 focus:outline-none"
                    />
                    <span className="mt-1 text-[13px] text-sandal-100">Your amount ($)</span>
                  </label>
                ) : (
                  <button
                    type="button"
                    onClick={() => setCustom(true)}
                    className={cn(
                      TILE,
                      'flex-row gap-2 border-navy-200 bg-sandal-50 text-left transition-all duration-300 hover:border-navy-400 hover:bg-navy-50',
                      'focus-visible:ring-2 focus-visible:ring-navy-400 focus-visible:outline-none',
                    )}
                  >
                    <Pencil className="size-[22px] shrink-0 text-navy-600" aria-hidden />
                    <span className="text-[14px] leading-tight text-stone-900">
                      Choose
                      <br />
                      your amount
                    </span>
                    <ArrowRight className="size-4 shrink-0 text-stone-700" aria-hidden />
                  </button>
                )}
              </div>

              <Link
                to={`/donate/temple/cat-tmp-hundi?amount=${amount}`}
                className={cn(
                  'group mt-4 flex h-[52px] w-full items-center justify-center gap-3 rounded-lg bg-kumkum-600 px-6 text-[18px] font-medium text-sandal-50 shadow-md',
                  'transition-all duration-200 hover:-translate-y-px hover:bg-kumkum-700 hover:shadow-lift active:bg-kumkum-800',
                  'focus-visible:ring-2 focus-visible:ring-navy-400 focus-visible:ring-offset-2 focus-visible:ring-offset-sandal-50 focus-visible:outline-none',
                )}
              >
                <DiyaIcon className="size-5 text-white" />
                <span className="[font-variant-numeric:lining-nums]">Continue with {formatMoney(amount).replace(/\.00$/, '')}</span>
                <ArrowRight className="size-4 transition-transform duration-200 group-hover:translate-x-1" aria-hidden />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
