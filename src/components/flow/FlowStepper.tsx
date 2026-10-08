import { Check } from 'lucide-react'

import { PHASES, type Phase } from '@/config'
import { cn } from '@/lib/cn'

export interface FlowStep {
  id: string
  label: string
  hint?: string
}

export function FlowStepper({
  steps,
  current,
  phase = 'spend',
  onStepClick,
}: {
  steps: FlowStep[]
  /** Zero-based index of the active step. */
  current: number
  phase?: Phase
  onStepClick?: (index: number) => void
}) {
  const meta = PHASES[phase]

  return (
    <ol className="flex flex-col gap-3 sm:flex-row sm:items-start sm:gap-0">
      {steps.map((step, i) => {
        const done = i < current
        const active = i === current
        const clickable = Boolean(onStepClick) && i <= current

        return (
          <li key={step.id} className="flex flex-1 items-start gap-3 sm:flex-col sm:gap-0">
            <div className="flex items-center gap-3 sm:w-full">
              <button
                type="button"
                disabled={!clickable}
                onClick={clickable ? () => onStepClick?.(i) : undefined}
                aria-current={active ? 'step' : undefined}
                className={cn(
                  'flex size-8 shrink-0 items-center justify-center rounded-full border text-[13px] font-medium transition-colors duration-150',
                  done && cn('border-transparent text-sandal-50', meta.markerClass),
                  active && 'border-turmeric-500 bg-turmeric-50 text-turmeric-700',
                  !done && !active && 'border-sandal-300 bg-sandal-50 text-stone-500',
                  clickable && 'cursor-pointer',
                )}
              >
                {done ? <Check className="size-4" aria-hidden /> : i + 1}
              </button>
              {i < steps.length - 1 ? (
                <span
                  className={cn('hidden h-px flex-1 sm:block', done ? meta.markerClass : 'bg-sandal-300')}
                  aria-hidden
                />
              ) : null}
            </div>
            <div className="min-w-0 sm:mt-2 sm:pr-4">
              <p className={cn('text-[14px] leading-tight', active ? 'font-medium text-stone-900' : 'text-stone-700')}>
                {step.label}
              </p>
              {step.hint ? <p className="mt-0.5 text-[12px] text-stone-500">{step.hint}</p> : null}
            </div>
          </li>
        )
      })}
    </ol>
  )
}
