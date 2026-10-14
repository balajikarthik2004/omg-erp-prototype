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

const TILE =
  'relative flex min-h-[82px] flex-col items-center justify-center rounded-xl px-3 py-2.5 text-center transition-all duration-200 cursor-pointer'
const SELECTED =
  'bg-linear-to-br from-kumkum-500 via-kumkum-600 to-kumkum-700 text-white shadow-lg shadow-kumkum-500/30 scale-[1.02]'

/** The one-tap gift. Straight to the Temple General Fund, no details needed. */
export function QuickHundi() {
  const [selected, setSelected] = useState(100100)
  const [custom, setCustom] = useState(false)
  const [typed, setTyped] = useState('')

  const typedCents = Number(typed) * 100
  const amount = custom && typedCents > 0 ? typedCents : selected

  return (
    <section id="quick-hundi" className="relative -mt-2 scroll-mt-24 pb-5 sm:pb-7">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="relative overflow-hidden rounded-2xl bg-white shadow-xl shadow-navy-950/10">
          {/* Faint watermark */}
          <div
            className="pointer-events-none absolute -bottom-4 left-0 z-0 hidden h-[90%] w-60 opacity-[0.10] lg:block"
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
                'radial-gradient(50% 100% at 0% 100%, rgba(235, 236, 249, 0.7) 0%, transparent 60%)',
            }}
            aria-hidden
          />

          <div className="relative grid lg:grid-cols-[40fr_60fr]">
            {/* The lit diya lamp and what the gift is */}
            <div className="flex flex-col sm:flex-row items-center sm:items-center gap-5 p-6 lg:p-7 bg-linear-to-br from-amber-100/50 via-orange-50/20 to-white">
              {/* Authentic lit brass diya image */}
              <div className="relative h-28 w-34 sm:h-32 sm:w-40 shrink-0 overflow-hidden rounded-xl bg-amber-50 shadow-md">
                <img
                  src="/images/diya-promise.jpg"
                  alt="A traditional lit brass diya oil lamp"
                  className="h-full w-full object-cover object-[48%_46%] mix-blend-multiply"
                />
                <div
                  className="pointer-events-none absolute inset-0 bg-radial from-amber-100/30 via-transparent to-stone-900/10"
                  aria-hidden
                />
              </div>

              <div className="min-w-0 text-center sm:text-left">
                <div className="inline-flex items-center gap-1.5 rounded-full bg-kumkum-50 px-2.5 py-0.5 text-kumkum-600 font-extrabold text-[11px] uppercase tracking-wider shadow-2xs">
                  <HeritageKolamStar size={14} />
                  <span>Instant Offering</span>
                </div>
                <h2 className="mt-1.5 font-heritage text-[22px] sm:text-[26px] font-bold text-stone-900 leading-tight">
                  Quick Hundi Offering
                </h2>
                <p className="mt-1 text-sm font-bold text-navy-700">
                  A small offering. A lasting light.
                </p>
                <p className="mt-1 text-xs text-stone-600 leading-relaxed font-medium">
                  Goes directly to the Temple General Fund. Instant digital receipt issued.
                </p>
              </div>
            </div>

            {/* The Amount Selector */}
            <div className="flex flex-col justify-center bg-linear-to-br from-[#F0F3FC] via-[#E6EAF9] to-[#F2F4FB] p-5 sm:p-6 lg:p-7">
              <div className="flex items-center justify-between">
                <p className="text-sm font-extrabold uppercase tracking-wider text-navy-950">Choose an Amount</p>
                <span className="text-[11px] font-bold text-navy-600">Zero processing fee</span>
              </div>

              <div className="mt-3.5 grid grid-cols-2 gap-2.5 sm:grid-cols-3 lg:grid-cols-5">
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
                        on
                          ? SELECTED
                          : 'bg-white text-navy-950 hover:bg-white/90 shadow-sm hover:shadow-md',
                      )}
                    >
                      {on ? (
                        <span
                          className="absolute -top-1.5 -right-1.5 z-10 flex size-5 items-center justify-center rounded-full bg-white text-kumkum-600 shadow-md"
                          aria-hidden
                        >
                          <Check className="size-3 stroke-3" />
                        </span>
                      ) : null}
                      <span className="font-sans text-[20px] leading-tight font-black tracking-tight">
                        {whole.format(p.amount / 100)}
                      </span>
                      <span className={cn('mt-1 text-[11px] leading-tight', on ? 'text-white/95 font-semibold' : 'text-navy-600 font-medium')}>
                        {p.label}
                      </span>
                    </button>
                  )
                })}

                {custom ? (
                  <label className={cn(TILE, SELECTED)}>
                    <span className="sr-only">Your amount</span>
                    <input
                      autoFocus
                      inputMode="numeric"
                      placeholder="Amount"
                      value={typed}
                      onChange={(e) => setTyped(e.target.value.replace(/[^0-9]/g, ''))}
                      className="w-full border-b border-white/60 bg-transparent pb-0.5 text-center font-sans text-[20px] font-bold placeholder:text-white/60 focus:outline-none"
                    />
                    <span className="mt-1 text-[11px] text-white/95 font-medium">Your amount</span>
                  </label>
                ) : (
                  <button
                    type="button"
                    onClick={() => setCustom(true)}
                    className={cn(
                      TILE,
                      'bg-white text-navy-950 hover:bg-white/90 shadow-sm hover:shadow-md',
                    )}
                  >
                    <div className="flex items-center gap-1.5 text-navy-700 font-bold text-xs">
                      <Pencil className="size-3.5 text-kumkum-500" aria-hidden />
                      <span>Custom</span>
                    </div>
                    <span className="mt-1 text-[11px] text-navy-600 font-medium">Other amount</span>
                  </button>
                )}
              </div>

              <Link
                to={`/donate/temple/cat-tmp-hundi?amount=${amount}`}
                className="mt-4 flex h-12 w-full items-center justify-center gap-2.5 rounded-xl bg-linear-to-r from-kumkum-500 via-kumkum-600 to-kumkum-700 hover:from-kumkum-600 hover:to-kumkum-800 active:scale-95 text-white font-bold text-sm sm:text-base shadow-md shadow-kumkum-500/25 transition-all"
              >
                <DiyaIcon className="size-5 text-white" />
                <span>Continue with {formatMoney(amount).replace(/\.00$/, '')}</span>
                <ArrowRight className="size-4 transition-transform duration-200 group-hover:translate-x-1" aria-hidden />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
