import { COMPACT_FROM, formatMoney, formatMoneyCompact } from '@/lib/format'
import { cn } from '@/lib/cn'

export function Money({
  value,
  className,
  exact,
  compact,
  signed,
  tone = 'default',
}: {
  value: number
  className?: string
  /**
   * Print every digit. For a figure someone acts on rather than scans: a
   * ledger line, a three-way match, a total at checkout. A rounded number is
   * fine to read and wrong to approve.
   */
  exact?: boolean
  /** Shorten below the usual threshold too. */
  compact?: boolean
  /** Prefix a + or − for ledger-style columns. */
  signed?: boolean
  tone?: 'default' | 'in' | 'out' | 'muted'
}) {
  const abs = Math.abs(value)
  const short = !exact && (compact || abs >= COMPACT_FROM)
  const full = formatMoney(abs)
  const text = short ? formatMoneyCompact(abs) : full
  // Zero is neither a gain nor a loss, so a signed column prints it bare.
  const sign = value < 0 ? '−' : signed && value > 0 ? '+' : ''

  return (
    <span
      // A rounded figure must never be the only figure available.
      title={short ? `${sign}${full}` : undefined}
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
