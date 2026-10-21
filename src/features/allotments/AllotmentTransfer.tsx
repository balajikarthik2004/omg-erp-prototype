import { ArrowDown, ArrowRight, Landmark, Wallet } from 'lucide-react'

import { cn } from '@/lib/cn'
import { Money } from '@/components/ui/Money'

/**
 * An allotment is a movement, so it is drawn as one: the fund it leaves on the
 * left, the budget head it lands in on the right, and what each side holds
 * before and after. Reading the two "after" figures is the whole decision.
 */
export function AllotmentTransfer({
  fromName,
  fromLabel,
  fromBefore,
  toName,
  toLabel,
  toBefore,
  amount,
}: {
  fromName: string
  fromLabel: string
  fromBefore: number
  toName: string
  toLabel: string
  toBefore: number
  amount: number
}) {
  return (
    <div className="relative grid grid-cols-1 gap-3 sm:grid-cols-2">
      <Side
        icon={<Landmark className="size-4" aria-hidden />}
        eyebrow="From fund"
        name={fromName}
        meta={fromLabel}
        beforeLabel="Balance now"
        before={fromBefore}
        after={fromBefore - amount}
        tone="out"
      />

      {/* Sits between the two cards on a wide panel, and above the second
          card once they stack, so the direction never has to be guessed. */}
      <span
        aria-hidden
        className="pointer-events-none absolute top-1/2 left-1/2 z-10 hidden size-8 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border border-sandal-200 bg-sandal-50 text-stone-500 shadow-flat sm:flex"
      >
        <ArrowRight className="size-4" />
      </span>
      <span
        aria-hidden
        className="-my-1.5 flex items-center justify-center text-stone-500 sm:hidden"
      >
        <ArrowDown className="size-4" />
      </span>

      <Side
        icon={<Wallet className="size-4" aria-hidden />}
        eyebrow="To budget head"
        name={toName}
        meta={toLabel}
        beforeLabel="Available now"
        before={toBefore}
        after={toBefore + amount}
        tone="in"
      />
    </div>
  )
}

function Side({
  icon,
  eyebrow,
  name,
  meta,
  beforeLabel,
  before,
  after,
  tone,
}: {
  icon: React.ReactNode
  eyebrow: string
  name: string
  meta: string
  beforeLabel: string
  before: number
  after: number
  tone: 'in' | 'out'
}) {
  return (
    <div className="rounded-card border border-sandal-200 bg-sandal-50 p-4 shadow-flat">
      <div className="flex items-center gap-2 text-stone-500">
        {icon}
        <p className="text-[11px] font-semibold tracking-[0.12em] uppercase">{eyebrow}</p>
      </div>
      <p className="mt-2 text-[15px] leading-snug font-semibold text-stone-900">{name}</p>
      <p className="mt-0.5 text-[12px] text-stone-500">{meta}</p>

      <dl className="mt-3 border-t border-sandal-200 pt-3 text-[13px]">
        <div className="flex items-baseline justify-between gap-3">
          <dt className="text-stone-500">{beforeLabel}</dt>
          <dd>
            <Money value={before} tone="muted" />
          </dd>
        </div>
        <div className="mt-1.5 flex items-baseline justify-between gap-3">
          <dt className="font-medium text-stone-700">If approved</dt>
          <dd>
            <Money
              value={after}
              className={cn('text-[15px] font-semibold', tone === 'in' ? 'text-tulsi-700' : 'text-stone-900')}
            />
          </dd>
        </div>
      </dl>
    </div>
  )
}
