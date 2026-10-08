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
        'flex flex-col items-center justify-center rounded-card border border-dashed border-sandal-300',
        'bg-sandal-50 px-6 py-16 text-center',
        className,
      )}
    >
      <div className="mb-4 flex size-14 items-center justify-center rounded-full border border-sandal-200 bg-sandal-100 text-stone-500">
        {icon ?? <Inbox className="size-6" aria-hidden />}
      </div>
      <h3 className="font-display text-[19px] text-stone-900">{title}</h3>
      <p className="mt-1.5 max-w-sm text-[14px] leading-relaxed text-stone-500">{message}</p>
      {action ? <div className="mt-5">{action}</div> : null}
    </div>
  )
}
