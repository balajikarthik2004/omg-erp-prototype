import { formatMoney, formatMoneyCompact } from '@/lib/format'
import { cn } from '@/lib/cn'

export function Money({
  value,
  className,
  compact,
  signed,
  tone = 'default',
}: {
  value: number
  className?: string
  compact?: boolean
  /** Prefix a + or − for ledger-style columns. */
  signed?: boolean
  tone?: 'default' | 'in' | 'out' | 'muted'
}) {
  const text = compact ? formatMoneyCompact(Math.abs(value)) : formatMoney(Math.abs(value))
  const sign = signed ? (value < 0 ? '−' : '+') : value < 0 ? '−' : ''

  return (
    <span
      className={cn(
        'font-mono tabular-nums whitespace-nowrap',
        tone === 'in' && 'text-tulsi-700',
        tone === 'out' && 'text-kumkum-700',
        tone === 'muted' && 'text-stone-500',
        className,
      )}
    >
      {sign}
      {text}
    </span>
  )
}
