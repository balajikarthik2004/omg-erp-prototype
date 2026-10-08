import { cn } from '@/lib/cn'

/**
 * The brand mark: a gopuram in a brass-edged seal, lit from the sanctum door.
 *
 * Drawn for the smallest size it has to survive — the 16px favicon — so it is
 * three bold tiers, a plinth and a kalasam, with overhanging cornices doing the
 * work that carving would do at a larger size. No detail that muddies when
 * it is shrunk.
 */
export function OmgMark({ className, size = 36 }: { className?: string; size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 40 40"
      fill="none"
      role="img"
      aria-label="OMG"
      className={cn('shrink-0', className)}
    >
      <rect width="40" height="40" rx="11" fill="var(--color-kumkum-900)" />

      <g fill="var(--color-turmeric-400)">
        {/* kalasam */}
        <circle cx="20" cy="6.6" r="1.7" />
        <rect x="19.35" y="8" width="1.3" height="2.2" rx="0.65" />

        {/* vaulted crown */}
        <path d="M15.4 15.4v-2.8a4.6 3 0 0 1 9.2 0v2.8Z" />

        {/* three stepped tiers, each with an overhanging cornice */}
        <rect x="13.2" y="15.4" width="13.6" height="3.6" rx="0.6" />
        <rect x="11.9" y="19" width="16.2" height="1.5" rx="0.75" />

        <rect x="10.7" y="20.5" width="18.6" height="4" rx="0.6" />
        <rect x="9.4" y="24.5" width="21.2" height="1.5" rx="0.75" />

        <rect x="8.1" y="26" width="23.8" height="4.4" rx="0.6" />
        <rect x="6.7" y="30.4" width="26.6" height="1.6" rx="0.8" />

        {/* plinth */}
        <rect x="5.4" y="32" width="29.2" height="2.4" rx="1" />
      </g>

      {/* the sanctum doorway, lit from within */}
      <path d="M17.7 30.4v-2.9a2.3 2.3 0 0 1 4.6 0v2.9Z" fill="var(--color-turmeric-50)" />

      <rect
        x="0.6"
        y="0.6"
        width="38.8"
        height="38.8"
        rx="10.4"
        stroke="var(--color-turmeric-500)"
        strokeOpacity="0.5"
        strokeWidth="1.2"
      />
    </svg>
  )
}

/** A quiet arch outline, used as a medallion behind icons and on cards. */
export function ArchMark({ className, size = 44 }: { className?: string; size?: number }) {
  return (
    <svg
      width={size}
      height={size * (56 / 44)}
      viewBox="0 0 44 56"
      fill="none"
      aria-hidden
      className={cn('shrink-0', className)}
    >
      <path
        d="M2 55V21C2 10.5 10.9 2 22 2s20 8.5 20 19v34"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  )
}

/** A kolam-style dot motif. Quiet decoration for footers and empty corners. */
export function Kolam({ className, size = 72 }: { className?: string; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 72 72" fill="none" aria-hidden className={cn('shrink-0', className)}>
      <g stroke="currentColor" strokeWidth="1" opacity="0.7">
        <path d="M36 14c8 8 8 14 0 22s-8 14 0 22" />
        <path d="M36 14c-8 8-8 14 0 22s8 14 0 22" />
        <path d="M14 36c8-8 14-8 22 0s14 8 22 0" />
        <path d="M14 36c8 8 14 8 22 0s14-8 22 0" />
      </g>
      <g fill="currentColor">
        {[
          [36, 10], [36, 62], [10, 36], [62, 36],
          [22, 22], [50, 22], [22, 50], [50, 50],
          [36, 36],
        ].map(([cx, cy]) => (
          <circle key={`${cx}-${cy}`} cx={cx} cy={cy} r={cx === 36 && cy === 36 ? 2.4 : 1.6} />
        ))}
      </g>
    </svg>
  )
}

/** A centred section divider: a hairline with a small brass lozenge. */
export function Divider({ className, tone = 'brass' }: { className?: string; tone?: 'brass' | 'quiet' }) {
  const line = tone === 'brass' ? 'bg-turmeric-400/45' : 'bg-sandal-200'
  const mark = tone === 'brass' ? 'text-turmeric-500' : 'text-sandal-300'
  return (
    <div className={cn('flex items-center gap-3', className)} aria-hidden>
      <span className={cn('h-px flex-1', line)} />
      <svg width="22" height="8" viewBox="0 0 22 8" fill="currentColor" className={mark}>
        <path d="M11 0l3.2 4L11 8 7.8 4 11 0Z" />
        <circle cx="2" cy="4" r="1.4" opacity="0.7" />
        <circle cx="20" cy="4" r="1.4" opacity="0.7" />
      </svg>
      <span className={cn('h-px flex-1', line)} />
    </div>
  )
}

/** A small lit lamp, for devotional accents beside headings. */
export function Deepam({ className, size = 20 }: { className?: string; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden className={cn('shrink-0', className)}>
      <path
        d="M12 3.5c2 2.3 3 4.1 3 5.7a3 3 0 1 1-6 0c0-1.6 1-3.4 3-5.7Z"
        fill="currentColor"
        className="origin-bottom"
        style={{ animation: 'omg-flicker 2.8s ease-in-out infinite' }}
      />
      <path
        d="M4 16.5c0-.8.7-1.3 1.7-1.3h12.6c1 0 1.7.5 1.7 1.3 0 1.8-2.6 3.2-8 3.2s-8-1.4-8-3.2Z"
        fill="currentColor"
        opacity="0.85"
      />
    </svg>
  )
}
