import { cn } from '@/lib/cn'

/** Line drawing of a gopuram. Sits behind the page as decoration, never behind copy. */
export function GopuramLineArt({ className }: { className?: string }) {
  const tiers = [0, 1, 2, 3, 4, 5]
  return (
    <svg viewBox="0 0 200 260" fill="none" stroke="currentColor" strokeWidth="1.1" aria-hidden className={cn('pointer-events-none', className)}>
      <path d="M96 6h8M100 6v14" />
      <path d="M88 20h24l4 10H84l4-10Z" />
      {tiers.map((i) => {
        const top = 30 + i * 30
        const half = 18 + i * 11
        return (
          <g key={i}>
            <path d={`M${100 - half} ${top + 28}L${100 - half + 4} ${top}H${100 + half - 4}L${100 + half} ${top + 28}Z`} />
            <path d={`M${100 - half + 8} ${top + 12}h${half * 2 - 16}`} opacity="0.6" />
            {[-0.5, 0, 0.5].map((k) => (
              <path key={k} d={`M${100 + k * half * 1.1 - 3} ${top + 26}v-8a3 3 0 0 1 6 0v8`} opacity="0.7" />
            ))}
          </g>
        )
      })}
      <path d="M30 218h140v8H30z" />
      <path d="M44 226v26M156 226v26M44 252h112" />
      <path d="M86 252v-22a14 14 0 0 1 28 0v22" />
    </svg>
  )
}

/** A large, quiet mandala. Used at the page edge, never behind text. */
export function MandalaLineArt({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 200 200" fill="none" stroke="currentColor" strokeWidth="0.9" aria-hidden className={cn('pointer-events-none', className)}>
      {[92, 70, 48, 26].map((r) => (
        <circle key={r} cx="100" cy="100" r={r} opacity={r === 92 ? 0.5 : 0.8} />
      ))}
      {Array.from({ length: 16 }).map((_, i) => (
        <path key={i} d="M100 8c9 18 9 34 0 52c-9-18-9-34 0-52Z" transform={`rotate(${i * 22.5} 100 100)`} />
      ))}
      {Array.from({ length: 8 }).map((_, i) => (
        <path key={i} d="M100 52c6 12 6 22 0 34c-6-12-6-22 0-34Z" transform={`rotate(${i * 45} 100 100)`} />
      ))}
      <circle cx="100" cy="100" r="5" />
    </svg>
  )
}

/** A small brass lotus, set where the arch frame meets the page. */
export function Finial({ className }: { className?: string }) {
  return (
    <svg width="38" height="26" viewBox="0 0 38 26" aria-hidden className={cn('text-turmeric-500', className)}>
      <path d="M19 1c4 6 4 11 0 17c-4-6-4-11 0-17Z" fill="currentColor" />
      <path d="M8 6c6 1 10 6 11 12C13 18 9 14 8 6Z" fill="currentColor" opacity="0.85" />
      <path d="M30 6c-6 1-10 6-11 12 6 0 10-4 11-12Z" fill="currentColor" opacity="0.85" />
      <path d="M1 12c5 0 9 3 12 8-6 1-10-2-12-8Z" fill="currentColor" opacity="0.6" />
      <path d="M37 12c-5 0-9 3-12 8 6 1 10-2 12-8Z" fill="currentColor" opacity="0.6" />
      <path d="M12 23h14" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  )
}

/** One hanging brass lamp on a chain. The chain length sets how far it drops. */
function BrassHangingLamp({ chain, id, className }: { chain: number; id: string; className?: string }) {
  const y = chain + 52
  return (
    <svg width="76" height={chain + 108} viewBox={`0 0 76 ${chain + 108}`} fill="none" aria-hidden className={className}>
      <defs>
        <linearGradient id={id} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="var(--color-turmeric-100)" />
          <stop offset="35%" stopColor="var(--color-turmeric-400)" />
          <stop offset="100%" stopColor="var(--color-turmeric-700)" />
        </linearGradient>
      </defs>
      <line x1="38" y1="0" x2="38" y2={chain} stroke="var(--color-turmeric-500)" strokeWidth="1.6" strokeDasharray="1.6 3.2" strokeLinecap="round" />
      <circle cx="38" cy={chain + 3} r="4.5" fill={`url(#${id})`} />
      <path d={`M38 ${chain + 7}L10 ${y - 2}M38 ${chain + 7}L66 ${y - 2}`} stroke="var(--color-turmeric-500)" strokeWidth="1" />
      <path d={`M38 ${y - 26}c5 7 7 12 7 16a7 7 0 1 1-14 0c0-4 2-9 7-16Z`} fill="var(--color-turmeric-400)" />
      <path d={`M38 ${y - 16}c2.4 3.6 3.4 6 3.4 8a3.4 3.4 0 1 1-6.8 0c0-2 1-4.4 3.4-8Z`} fill="var(--color-sandal-50)" />
      <path d={`M5 ${y}Q38 ${y - 9} 71 ${y}Q67 ${y + 28} 38 ${y + 32}Q9 ${y + 28} 5 ${y}Z`} fill={`url(#${id})`} />
      <path d={`M9 ${y + 2}Q38 ${y - 5} 67 ${y + 2}`} stroke="var(--color-turmeric-100)" strokeWidth="1.2" opacity="0.8" />
      <path d={`M16 ${y + 14}Q38 ${y + 20} 60 ${y + 14}`} stroke="var(--color-turmeric-700)" strokeWidth="0.9" opacity="0.6" />
      <circle cx="38" cy={y + 36} r="3" fill={`url(#${id})`} />
      <path d={`M38 ${y + 39}v9`} stroke="var(--color-turmeric-700)" strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  )
}

/** Two brass lamps hanging from the top edge of the hero. */
export function HangingBrassLamps({ className }: { className?: string }) {
  return (
    <div className={cn('pointer-events-none flex items-start gap-1', className)} aria-hidden>
      <BrassHangingLamp chain={64} id="bl-a" className="drop-shadow-sm" />
      <BrassHangingLamp chain={158} id="bl-b" className="drop-shadow-sm" />
    </div>
  )
}

/** A brass lamp on a stone ledge with jasmine, drawn rather than photographed. */
export function LampScene({ className }: { className?: string }) {
  const petals = [0, 72, 144, 216, 288]
  const flower = (cx: number, cy: number, s: number) => (
    <g transform={`translate(${cx} ${cy}) scale(${s})`}>
      {petals.map((a) => (
        <ellipse key={a} cx="0" cy="-7" rx="4.4" ry="7.4" fill="var(--color-sandal-50)" stroke="var(--color-sandal-300)" strokeWidth="0.7" transform={`rotate(${a})`} />
      ))}
      <circle r="2.6" fill="var(--color-turmeric-400)" />
    </g>
  )
  return (
    <svg viewBox="0 0 280 250" fill="none" role="img" aria-label="A brass lamp lit on a stone ledge, with jasmine flowers" className={cn('block', className)}>
      <defs>
        <radialGradient id="hundi-glow" cx="52%" cy="36%" r="55%">
          <stop offset="0%" stopColor="var(--color-turmeric-100)" stopOpacity="0.95" />
          <stop offset="55%" stopColor="var(--color-turmeric-400)" stopOpacity="0.24" />
          <stop offset="100%" stopColor="var(--color-turmeric-400)" stopOpacity="0" />
        </radialGradient>
        <linearGradient id="hundi-brass" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="var(--color-turmeric-100)" />
          <stop offset="30%" stopColor="var(--color-turmeric-400)" />
          <stop offset="100%" stopColor="var(--color-turmeric-700)" />
        </linearGradient>
      </defs>
      <circle cx="146" cy="96" r="112" fill="url(#hundi-glow)" />

      {/* stone ledge, running off the left and bottom edges */}
      <path d="M0 200c10-12 36-16 70-16h150c34 0 54 5 60 16v50H0v-50Z" fill="var(--color-sandal-300)" />
      <path d="M0 200c10-12 36-16 70-16h150c34 0 54 5 60 16" stroke="var(--color-stone-500)" strokeWidth="1" opacity="0.5" />
      <path d="M18 216h70M130 222h96M60 234h50M190 238h60" stroke="var(--color-stone-500)" strokeWidth="1" strokeLinecap="round" opacity="0.35" />

      {/* leaves and jasmine */}
      <path d="M52 196c-18-6-30-20-32-34 18 0 32 10 38 26" fill="var(--color-tulsi-500)" opacity="0.9" />
      <path d="M66 194c-6-16 0-32 12-42 8 14 6 30-4 44" fill="var(--color-tulsi-700)" opacity="0.9" />
      <path d="M30 206c-12-2-20-10-24-20 12-2 22 4 28 14" fill="var(--color-tulsi-500)" opacity="0.8" />
      {flower(52, 180, 1.2)}
      {flower(82, 192, 0.9)}
      {flower(28, 196, 0.8)}
      {flower(74, 168, 0.7)}

      {/* flame */}
      <path d="M146 22c10 15 16 26 16 38a16 16 0 1 1-32 0c0-12 6-23 16-38Z" fill="var(--color-turmeric-400)" />
      <path d="M146 38c6 9 9 16 9 23a9 9 0 1 1-18 0c0-7 3-14 9-23Z" fill="var(--color-sandal-50)" />

      {/* bowl */}
      <path d="M94 96c0-7 7-12 16-12h72c9 0 16 5 16 12 0 26-24 44-52 44S94 122 94 96Z" fill="url(#hundi-brass)" />
      <path d="M98 94h96" stroke="var(--color-turmeric-100)" strokeWidth="1.6" opacity="0.8" />
      <path d="M102 108c14 8 76 8 90 0" stroke="var(--color-turmeric-700)" strokeWidth="1" opacity="0.55" />
      {Array.from({ length: 9 }).map((_, i) => (
        <circle key={i} cx={106 + i * 10.5} cy="91" r="1.4" fill="var(--color-turmeric-700)" opacity="0.55" />
      ))}
      <path d="M130 138l-9 38h50l-9-38" fill="url(#hundi-brass)" />
      <path d="M104 186c0-7 9-11 42-11s42 4 42 11v6H104v-6Z" fill="url(#hundi-brass)" />
      <path d="M112 186h68" stroke="var(--color-turmeric-100)" strokeWidth="1" opacity="0.6" />
      {flower(206, 194, 1)}
      {flower(232, 204, 0.8)}
    </svg>
  )
}

/**
 * A half lotus mandala, flush against the arch like the ornament in the brief.
 * Tiers of petals fan out from the flat edge; each tier is opaque so the petals
 * layer cleanly instead of tangling. The flat side is the left edge of the svg.
 */
export function LotusMandala({ className }: { className?: string }) {
  // A petal pointing along +x from radius r0 to a pointed tip at r1, half-width w.
  const petal = (r0: number, r1: number, w: number) => {
    const len = r1 - r0
    return `M${r0} 0C${r0 + len * 0.3} ${-w} ${r1 - len * 0.25} ${-w * 0.55} ${r1} 0C${r1 - len * 0.25} ${w * 0.55} ${r0 + len * 0.3} ${w} ${r0} 0Z`
  }
  const fan = (angles: number[], r0: number, r1: number, w: number, fill: string) =>
    angles.map((a) => (
      <g key={`${r1}-${a}`} transform={`translate(0 150) rotate(${a})`}>
        <path d={petal(r0, r1, w)} fill={fill} />
        <path d={`M${r0 + (r1 - r0) * 0.22} 0H${r1 - (r1 - r0) * 0.14}`} strokeWidth="0.7" opacity="0.7" />
      </g>
    ))
  const every = (step: number, from: number) => {
    const out: number[] = []
    for (let a = from; a <= 90 + 0.01; a += step) out.push(a)
    return out
  }
  const full = every(15, -90)
  const half = every(15, -82.5).filter((a) => a <= 82.5)
  const beads = every(7.5, -90)

  return (
    <svg viewBox="0 0 160 300" fill="none" aria-hidden className={cn('pointer-events-none', className)}>
      <defs>
        <linearGradient id="lotus-line" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="var(--color-turmeric-400)" />
          <stop offset="100%" stopColor="var(--color-marigold-500)" />
        </linearGradient>
        <linearGradient id="lotus-petal" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="var(--color-turmeric-100)" stopOpacity="0.95" />
          <stop offset="100%" stopColor="var(--color-sandal-50)" stopOpacity="0.95" />
        </linearGradient>
        <radialGradient id="lotus-glow" cx="0" cy="50%" r="100%">
          <stop offset="0%" stopColor="var(--color-turmeric-100)" stopOpacity="0.75" />
          <stop offset="100%" stopColor="var(--color-turmeric-100)" stopOpacity="0" />
        </radialGradient>
        <clipPath id="lotus-clip">
          <rect x="0" y="0" width="160" height="300" />
        </clipPath>
      </defs>

      <g clipPath="url(#lotus-clip)">
        <path d="M0 2A148 148 0 0 1 0 298Z" fill="url(#lotus-glow)" />
        <g stroke="url(#lotus-line)" strokeWidth="1" strokeLinejoin="round">
          {/* the edge: one fine arc, with a bead at every step */}
          <path d="M0 2A148 148 0 0 1 0 298" opacity="0.8" />
          {beads.map((a) => (
            <circle key={a} cx={152 * Math.cos((a * Math.PI) / 180)} cy={150 + 152 * Math.sin((a * Math.PI) / 180)} r="1.3" fill="url(#lotus-line)" stroke="none" opacity="0.9" />
          ))}

          {/* four tiers, outermost first, each turned half a step from the last */}
          {fan(full, 92, 146, 17, 'url(#lotus-petal)')}
          {fan(half, 66, 118, 13.5, 'url(#lotus-petal)')}
          {fan(full, 44, 90, 11.5, 'url(#lotus-petal)')}
          {fan(half, 26, 62, 8.5, 'url(#lotus-petal)')}

          {/* centre rosette */}
          <path d="M0 126A24 24 0 0 1 0 174Z" fill="var(--color-sandal-50)" opacity="0.95" />
          <path d="M0 126A24 24 0 0 1 0 174" />
          <path d="M0 134A16 16 0 0 1 0 166" strokeDasharray="1 3" strokeLinecap="round" />
          <path d="M0 142A8 8 0 0 1 0 158Z" fill="url(#lotus-line)" opacity="0.6" />
        </g>
      </g>
    </svg>
  )
}
