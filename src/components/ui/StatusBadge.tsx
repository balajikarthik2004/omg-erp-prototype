import { statusStyle } from '@/lib/status'
import { cn } from '@/lib/cn'

export function StatusBadge({
  status,
  className,
  compact,
}: {
  status: string
  className?: string
  compact?: boolean
}) {
  const style = statusStyle(status)
  const Icon = style.icon

  if (compact) {
    return (
      <span className={cn('inline-flex items-center gap-1.5 text-[13px]', className)}>
        <span className={cn('size-1.5 shrink-0 rounded-full', style.dotClass)} aria-hidden />
        {style.label}
      </span>
    )
  }

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[12px] font-medium whitespace-nowrap',
        style.className,
        className,
      )}
    >
      <Icon className="size-3.5 shrink-0" aria-hidden />
      {style.label}
    </span>
  )
}
