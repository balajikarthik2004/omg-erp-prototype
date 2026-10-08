import { useEffect } from 'react'
import { AlertTriangle, CheckCircle2, Info, X } from 'lucide-react'

import { cn } from '@/lib/cn'
import { useToasts, type ToastItem, type ToastTone } from '@/lib/toast'

const TONE_STYLE: Record<ToastTone, { bar: string; icon: typeof Info; iconClass: string }> = {
  success: { bar: 'bg-tulsi-500', icon: CheckCircle2, iconClass: 'text-tulsi-700' },
  info: { bar: 'bg-peacock-500', icon: Info, iconClass: 'text-peacock-700' },
  warning: { bar: 'bg-marigold-500', icon: AlertTriangle, iconClass: 'text-marigold-500' },
  danger: { bar: 'bg-danger-600', icon: AlertTriangle, iconClass: 'text-danger-600' },
}

function ToastCard({ item }: { item: ToastItem }) {
  const dismiss = useToasts((s) => s.dismiss)
  const style = TONE_STYLE[item.tone]
  const Icon = style.icon

  useEffect(() => {
    const timer = window.setTimeout(() => dismiss(item.id), 5200)
    return () => window.clearTimeout(timer)
  }, [item.id, dismiss])

  return (
    <div
      role="status"
      className="pointer-events-auto flex w-full overflow-hidden rounded-card border border-sandal-200 bg-sandal-50 shadow-card"
      style={{ animation: 'omg-fade-in 180ms ease-out' }}
    >
      <div className={cn('w-1 shrink-0', style.bar)} aria-hidden />
      <div className="flex flex-1 items-start gap-3 p-3.5">
        <Icon className={cn('mt-0.5 size-4.5 shrink-0', style.iconClass)} aria-hidden />
        <div className="min-w-0 flex-1">
          <p className="text-[14px] font-medium text-stone-900">{item.title}</p>
          {item.detail ? <p className="mt-0.5 text-[13px] text-stone-500">{item.detail}</p> : null}
        </div>
        <button
          type="button"
          onClick={() => dismiss(item.id)}
          aria-label="Dismiss notification"
          className="rounded p-1 text-stone-500 transition-colors duration-150 hover:bg-sandal-100 hover:text-stone-900"
        >
          <X className="size-4" aria-hidden />
        </button>
      </div>
    </div>
  )
}

export function Toaster() {
  const items = useToasts((s) => s.items)
  return (
    <div
      aria-live="polite"
      className="no-print pointer-events-none fixed inset-x-4 bottom-4 z-[60] flex flex-col gap-2 sm:inset-x-auto sm:right-6 sm:bottom-6 sm:w-96"
    >
      {items.slice(-4).map((item) => (
        <ToastCard key={item.id} item={item} />
      ))}
    </div>
  )
}
