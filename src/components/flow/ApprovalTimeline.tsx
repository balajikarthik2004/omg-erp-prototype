import { Check, CircleDashed, X } from 'lucide-react'

import { approvalTierLabel } from '@/config'
import { cn } from '@/lib/cn'
import { formatDateTime } from '@/lib/format'
import { userName } from '@/mock/seed'
import { roleLabel } from '@/store/db'
import type { ApprovalStep, TimelineEvent } from '@/types'

export function ApprovalTimeline({
  steps,
  amount,
  className,
}: {
  steps: ApprovalStep[]
  amount: number
  className?: string
}) {
  return (
    <div className={className}>
      <p className="mb-3 text-[11px] font-semibold tracking-[0.12em] text-stone-500 uppercase">
        Approval chain · {approvalTierLabel(amount)}
      </p>
      <ol className="flex flex-col">
        {steps.map((step, i) => {
          const decided = Boolean(step.decision)
          const approved = step.decision === 'approved'
          const Icon = approved ? Check : step.decision === 'rejected' ? X : CircleDashed
          return (
            <li key={`${step.role}-${i}`} className="flex gap-3">
              <div className="flex flex-col items-center">
                <span
                  className={cn(
                    'flex size-7 shrink-0 items-center justify-center rounded-full border',
                    approved && 'border-transparent bg-tulsi-500 text-sandal-50',
                    step.decision === 'rejected' && 'border-transparent bg-danger-600 text-sandal-50',
                    !decided && 'border-sandal-300 bg-sandal-50 text-stone-500',
                  )}
                >
                  <Icon className="size-3.5" aria-hidden />
                </span>
                {i < steps.length - 1 ? (
                  <span className={cn('w-px flex-1', approved ? 'bg-tulsi-500' : 'bg-sandal-300')} aria-hidden />
                ) : null}
              </div>
              <div className={cn('min-w-0 pb-5', i === steps.length - 1 && 'pb-0')}>
                <p className="text-[14px] font-medium text-stone-900">{roleLabel(step.role)}</p>
                <p className="text-[13px] text-stone-500">
                  {decided
                    ? `${approved ? 'Approved' : 'Rejected'} by ${userName(step.userId ?? '')} · ${step.at ? formatDateTime(step.at) : ''}`
                    : 'Waiting for a decision'}
                </p>
                {step.comment ? (
                  <p className="mt-1.5 rounded-lg border border-sandal-200 bg-sandal-100 px-3 py-2 text-[13px] text-stone-700">
                    {step.comment}
                  </p>
                ) : null}
              </div>
            </li>
          )
        })}
      </ol>
    </div>
  )
}

export function EventTimeline({ events }: { events: TimelineEvent[] }) {
  const ordered = [...events].sort((a, b) => a.at.localeCompare(b.at))
  return (
    <ol className="flex flex-col">
      {ordered.map((event, i) => (
        <li key={`${event.at}-${i}`} className="flex gap-3">
          <div className="flex flex-col items-center">
            <span className="mt-1.5 size-2 shrink-0 rounded-full bg-tulsi-500" aria-hidden />
            {i < ordered.length - 1 ? <span className="w-px flex-1 bg-sandal-300" aria-hidden /> : null}
          </div>
          <div className={cn('min-w-0 pb-4', i === ordered.length - 1 && 'pb-0')}>
            <p className="text-[14px] text-stone-900">{event.action}</p>
            <p className="font-mono text-[12px] text-stone-500 tabular-nums">
              {formatDateTime(event.at)} · {userName(event.by)}
            </p>
            {event.note ? <p className="mt-1 text-[13px] text-stone-700">{event.note}</p> : null}
          </div>
        </li>
      ))}
    </ol>
  )
}
