import { cn } from '@/lib/cn'

/**
 * The OMG brand mark — the official logo from omgofficial.com.
 *
 * The artwork is navy and red on transparency, so on the navy chrome it sits
 * on a white tile. That is the standard treatment and keeps the mark exact
 * rather than redrawing it.
 */
export function OmgMark({
  className,
  size = 36,
  onDark = false,
}: {
  className?: string
  size?: number
  /** On the navy chrome the mark sits on a white tile so both inks stay legible. */
  onDark?: boolean
}) {
  return (
    <span
      className={cn(
        'inline-flex shrink-0 items-center justify-center',
        onDark && 'rounded-[10px] bg-white',
        className,
      )}
      style={{ width: size, height: size, padding: onDark ? Math.round(size * 0.1) : 0 }}
    >
      <img
        src="/brand/omg-mark.png"
        alt="OMG"
        width={size}
        height={size}
        className="h-full w-full object-contain"
        draggable={false}
      />
    </span>
  )
}

/** The full OMG wordmark. For light headers, where there is room for it. */
export function OmgWordmark({ className, height = 34 }: { className?: string; height?: number }) {
  return (
    <img
      src="/brand/omg-logo.svg"
      alt="OMG — Oh My God"
      height={height}
      style={{ height }}
      className={cn('w-auto shrink-0', className)}
      draggable={false}
    />
  )
}

/**
 * A decorative line-art etching.
 *
 * The source PNGs are inked a fixed sepia (#463020) from the old palette, so
 * rendering them as <img> froze them outside the design system. Here the PNG
 * is only a mask and the ink comes from a background token, so these follow
 * the palette like everything else.
 */
export function Etching({
  src,
  className,
  position = 'center',
}: {
  src: string
  /** Ink colour, as a background token, e.g. "bg-navy-600". */
  className?: string
  position?: string
}) {
  return (
    <span
      aria-hidden
      className={cn('block h-full w-full', className)}
      style={{
        WebkitMaskImage: `url(${src})`,
        maskImage: `url(${src})`,
        WebkitMaskSize: 'contain',
        maskSize: 'contain',
        WebkitMaskRepeat: 'no-repeat',
        maskRepeat: 'no-repeat',
        WebkitMaskPosition: position,
        maskPosition: position,
      }}
    />
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
  const line = tone === 'brass' ? 'bg-navy-300/45' : 'bg-sandal-200'
  const mark = tone === 'brass' ? 'text-navy-400' : 'text-sandal-300'
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

/** A divine ceremonial brass diya with glowing golden flame. */
export function DiyaIcon({ className, size = 20 }: { className?: string; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden className={cn('shrink-0', className)}>
      <defs>
        <radialGradient id="flame-glow" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="currentColor" />
          <stop offset="60%" stopColor="currentColor" />
          <stop offset="100%" stopColor="currentColor" stopOpacity="0" />
        </radialGradient>
      </defs>
      <circle cx="12" cy="7" r="5" fill="url(#flame-glow)" opacity="0.65" />
      <path
        d="M12 2.5C13.5 4.5 14.5 6.2 14.5 7.8A2.5 2.5 0 1 1 9.5 7.8C9.5 6.2 10.5 4.5 12 2.5Z"
        fill="currentColor"
      />
      <path
        d="M12 4.5C12.7 5.7 13.2 6.7 13.2 7.7A1.2 1.2 0 1 1 10.8 7.7C10.8 6.7 11.3 5.7 12 4.5Z"
        fill="currentColor" fillOpacity="0.55"
      />
      <path
        d="M3.5 13.5C3.5 12.8 4.2 12.2 5.2 12.2H18.8C19.8 12.2 20.5 12.8 20.5 13.5C20.5 16.5 16.8 18.8 12 18.8C7.2 18.8 3.5 16.5 3.5 13.5Z"
        fill="currentColor"
      />
      <path
        d="M9 18.5L8 21.5H16L15 18.5"
        stroke="currentColor"
        strokeWidth="1.2"
        strokeLinecap="round"
      />
      <line x1="7" y1="21.5" x2="17" y2="21.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  )
}

/** Hanging temple brass lamps with fine link chains */
export function HangingDeepams({ className }: { className?: string }) {
  return (
    <svg width="120" height="280" viewBox="0 0 120 280" fill="none" aria-hidden className={cn('pointer-events-none', className)}>
      <g opacity="0.85">
        <line x1="30" y1="0" x2="30" y2="120" stroke="currentColor" strokeWidth="1" strokeDasharray="3 3" />
        <circle cx="30" cy="120" r="3" fill="currentColor" />
        <path d="M30 114c1.2 1.8 2 3.2 2 4.5a2 2 0 1 1-4 0c0-1.3.8-2.7 2-4.5Z" fill="currentColor" />
        <path d="M22 124c0-1.2 1.5-2.2 8-2.2s8 1 8 2.2c0 2-3.6 4-8 4s-8-2-8-4Z" fill="currentColor" />
        <circle cx="30" cy="131" r="2" fill="currentColor" />
      </g>
      <g opacity="0.95">
        <line x1="90" y1="0" x2="90" y2="160" stroke="currentColor" strokeWidth="1" strokeDasharray="3 3" />
        <circle cx="90" cy="160" r="3.5" fill="currentColor" />
        <path d="M90 153c1.5 2.2 2.5 3.8 2.5 5.5a2.5 2.5 0 1 1-5 0c0-1.7 1-3.3 2.5-5.5Z" fill="currentColor" />
        <path d="M80 165c0-1.5 2-2.8 10-2.8s10 1.3 10 2.8c0 2.5-4.5 5-10 5s-10-2.5-10-5Z" fill="currentColor" />
        <circle cx="90" cy="173" r="2.5" fill="currentColor" />
      </g>
    </svg>
  )
}
