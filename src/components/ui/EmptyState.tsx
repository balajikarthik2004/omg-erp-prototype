import type { ReactNode } from 'react'
import { Inbox } from 'lucide-react'
import { cn } from '@/lib/cn'

export function EmptyState({
  title,
  message,
  action,
  icon,
  className,
}: {
  title: string
  message: string
  action?: ReactNode
  icon?: ReactNode
  className?: string
}) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-navy-200/80',
        'bg-white/80 px-6 py-14 text-center',
        className,
      )}
    >
      <div className="mb-4 flex size-14 items-center justify-center rounded-2xl border border-navy-150 bg-navy-50 text-navy-600 shadow-2xs">
        {icon ?? <Inbox className="size-6" aria-hidden />}
      </div>
      <h3 className="font-heritage text-[19px] font-bold text-navy-950">{title}</h3>
      <p className="mt-1.5 max-w-sm text-[14px] leading-relaxed text-navy-600/80 font-normal">{message}</p>
      {action ? <div className="mt-5">{action}</div> : null}
    </div>
  )
}
