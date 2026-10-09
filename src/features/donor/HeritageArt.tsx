import { cn } from '@/lib/cn'

/**
 * Detailed South Indian Temple Gopuram architectural line-art elevation.
 * Features tiered vimana, kalasams, kudu niches, pilasters, and stone plinths.
 */
export function GopuramElevationArt({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 280 460"
      fill="none"
      stroke="currentColor"
      strokeWidth="0.85"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
      className={cn('pointer-events-none', className)}
    >
      {/* Kalasams / Stupis at top */}
      <circle cx="140" cy="14" r="3.5" />
      <path d="M140 10.5V5M138 5h4M140 17.5v8" />
      <circle cx="124" cy="22" r="2.5" />
      <path d="M124 19.5v-3M122.5 16.5h3M124 24.5v5" />
      <circle cx="156" cy="22" r="2.5" />
      <path d="M156 19.5v-3M154.5 16.5h3M156 24.5v5" />

      {/* Shikhara / Dome vault */}
      <path d="M112 38c0-10 12-16 28-16s28 6 28 16Z" />
      <path d="M126 28c4 3 10 5 14 5s10-2 14-5" opacity="0.6" />
      <path d="M104 44h72v6h-72z" />
      <path d="M100 50h80v4h-80z" />

      {/* Tier 1 (top tier) */}
      <path d="M106 54l-6 32h80l-6-32Z" />
      <path d="M96 86h88v5H96z" />
      <path d="M128 86v-18c0-6 6-10 12-10s12 4 12 10v18" opacity="0.75" />
      <path d="M134 86v-12c0-3 3-5 6-5s6 2 6 5v12" opacity="0.5" />
      <path d="M110 86v-14h8v14M162 86v-14h8v14" opacity="0.5" />

      {/* Tier 2 */}
      <path d="M98 91l-8 38h100l-8-38Z" />
      <path d="M86 129h108v6H86z" />
      <path d="M124 129v-22c0-8 7-14 16-14s16 6 16 14v22" opacity="0.75" />
      <path d="M132 129v-15c0-4 4-7 8-7s8 3 8 7v15" opacity="0.5" />
      <path d="M102 129v-18h10v18M168 129v-18h10v18" opacity="0.5" />

      {/* Tier 3 */}
      <path d="M88 135l-9 44h122l-9-44Z" />
      <path d="M74 179h132v7H74z" />
      <path d="M120 179v-26c0-10 9-18 20-18s20 8 20 18v26" opacity="0.75" />
      <path d="M130 179v-18c0-5 5-9 10-9s10 4 10 9v18" opacity="0.5" />
      <path d="M94 179v-22h12v22M174 179v-22h12v22" opacity="0.5" />
      <path d="M82 179v-16h7v16M191 179v-16h7v16" opacity="0.4" />

      {/* Tier 4 */}
      <path d="M76 186l-11 52h150l-11-52Z" />
      <path d="M60 238h160v8H60z" />
      <path d="M116 238v-32c0-12 11-22 24-22s24 10 24 22v32" opacity="0.75" />
      <path d="M126 238v-22c0-7 6-12 14-12s14 5 14 12v22" opacity="0.5" />
      <path d="M84 238v-26h14v26M182 238v-26h14v26" opacity="0.5" />
      <path d="M68 238v-20h10v20M202 238v-20h10v20" opacity="0.4" />

      {/* Tier 5 */}
      <path d="M62 246l-13 60h182l-13-60Z" />
      <path d="M44 306h192v9H44z" />
      <path d="M112 306v-38c0-14 13-26 28-26s28 12 28 26v38" opacity="0.75" />
      <path d="M122 306v-26c0-8 8-15 18-15s18 7 18 15v26" opacity="0.5" />
      <path d="M72 306v-30h16v30M192 306v-30h16v30" opacity="0.5" />
      <path d="M52 306v-24h12v24M216 306v-24h12v24" opacity="0.4" />

      {/* Tier 6 (Base Tier) */}
      <path d="M46 315l-14 66h216l-14-66Z" />
      <path d="M26 381h228v10H26z" />
      <path d="M108 381v-44c0-16 15-30 32-30s32 14 32 30v44" opacity="0.75" />
      <path d="M118 381v-30c0-10 10-18 22-18s22 8 22 18v30" opacity="0.5" />
      <path d="M60 381v-36h18v36M202 381v-36h18v36" opacity="0.5" />
      <path d="M38 381v-28h14v28M228 381v-28h14v28" opacity="0.4" />

      {/* Plinth & Sanctum Doorway Base */}
      <path d="M20 391h240v14H20z" />
      <path d="M14 405h252v12H14z" />
      <path d="M8 417h264v16H8z" />
      <path d="M2 433h276v24H2z" />

      {/* Central Sanctum Gateway / Dvara */}
      <path d="M104 457v-48c0-18 16-32 36-32s36 14 36 32v48" strokeWidth="1.1" />
      <path d="M114 457v-40c0-13 11-24 26-24s26 11 26 24v40" opacity="0.6" strokeDasharray="3 3" />
      <path d="M126 457v-32c0-7 6-13 14-13s14 6 14 13v32" opacity="0.75" />

      {/* Decorative pilasters on ground base */}
      <path d="M40 457v-40h12v40M70 457v-40h12v40M198 457v-40h12v40M228 457v-40h12v40" opacity="0.5" />
    </svg>
  )
}

/**
 * Detailed botanical line-art drawing of a South Indian sacred lotus / chrysanthemum blossom.
 * Matches the reference image's right-side floral motif with layered petals, bud, and stem.
 */
export function LotusBotanicalArt({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 240 380"
      fill="none"
      stroke="currentColor"
      strokeWidth="0.85"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
      className={cn('pointer-events-none', className)}
    >
      {/* Top Lotus Bud */}
      <path d="M120 18c-6 10-7 18 0 28 7-10 6-18 0-28Z" />
      <path d="M120 18c-12 12-10 22-2 28" opacity="0.75" />
      <path d="M120 18c12 12 10 22 2 28" opacity="0.75" />
      <path d="M114 46c-6 4-10 10-6 16 8-2 10-8 12-16" opacity="0.6" />
      <path d="M126 46c6 4 10 10 6 16-8-2-10-8-12-16" opacity="0.6" />

      {/* Stem between bud and main blossom */}
      <path d="M120 46v72" strokeWidth="1" />

      {/* Main Multi-Petaled Flower Blossom */}
      {/* Inner Central Petals */}
      <path d="M120 118c-8 14-8 28 0 38 8-10 8-24 0-38Z" fill="currentColor" fillOpacity="0.04" />
      <path d="M120 120c-14 16-12 32-2 36" opacity="0.8" />
      <path d="M120 120c14 16 12 32 2 36" opacity="0.8" />

      {/* Middle Petal Layer (Layer 2) */}
      <path d="M108 126c-18 10-24 28-10 40 12-8 18-24 16-36" opacity="0.75" />
      <path d="M132 126c18 10 24 28 10 40-12-8-18-24-16-36" opacity="0.75" />
      <path d="M96 142c-22 12-24 32-8 44 14-6 20-22 16-38" opacity="0.7" />
      <path d="M144 142c22 12 24 32 8 44-14-6-20-22-16-38" opacity="0.7" />

      {/* Outer Spreading Petals (Layer 3) */}
      <path d="M84 158c-26 14-26 38-6 48 18-8 22-26 16-42" opacity="0.65" />
      <path d="M156 158c26 14 26 38 6 48-18-8-22-26-16-42" opacity="0.65" />
      <path d="M72 178c-28 18-24 44 0 52 18-10 22-30 14-46" opacity="0.6" />
      <path d="M168 178c28 18 24 44 0 52-18-10-22-30-14-46" opacity="0.6" />

      {/* Lower Guard Petals / Calyx Base */}
      <path d="M64 204c-22 22-14 46 12 50 18-14 18-34 4-46" opacity="0.55" />
      <path d="M176 204c22 22 14 46-12 50-18-14-18-34-4-46" opacity="0.55" />
      <path d="M82 230c-14 24-2 44 24 42 12-16 10-32-6-40" opacity="0.5" />
      <path d="M158 230c14 24 2 44-24 42-12-16-10-32 6-40" opacity="0.5" />

      {/* Flower base receptacle & leaves */}
      <path d="M106 256c-18 20-18 42-2 56 14-18 14-38 2-56" opacity="0.5" />
      <path d="M134 256c18 20 18 42 2 56-14-18-14-38-2-56" opacity="0.5" />

      {/* Lower Main Stem */}
      <path d="M120 270v105" strokeWidth="1.1" />

      {/* Foliage leaves along lower stem */}
      <path d="M120 300c-24-10-40 4-46 26 22 4 40-10 46-26Z" opacity="0.45" />
      <path d="M120 324c24-10 40 4 46 26-22 4-40-10-46-26Z" opacity="0.45" />
      <path d="M120 348c-20-8-34 4-38 20 18 4 32-8 38-20Z" opacity="0.4" />
    </svg>
  )
}

/**
 * Subtle botanical foliage watermark for the top-right corner of the Trust card.
 */
export function TrustFoliageArt({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 160 180"
      fill="none"
      stroke="currentColor"
      strokeWidth="0.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
      className={cn('pointer-events-none', className)}
    >
      <path d="M150 10c-30 40-70 70-130 90" opacity="0.6" />
      <path d="M150 10c-15 4-25 15-20 25 12-2 20-12 20-25Z" opacity="0.5" />
      <path d="M126 34c-16 6-22 18-16 26 12-2 18-14 16-26Z" opacity="0.45" />
      <path d="M102 56c-18 8-22 22-14 30 14-2 18-16 14-30Z" opacity="0.45" />
      <path d="M74 76c-16 8-18 22-10 28 12-2 14-16 10-28Z" opacity="0.4" />
      <path d="M46 92c-14 8-14 18-6 22 10-2 10-12 6-22Z" opacity="0.35" />
    </svg>
  )
}

/**
 * Traditional South Indian Temple tower icon for the Temple card badge.
 */
export function TempleGopuramIcon({ className, size = 32 }: { className?: string; size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
      className={className}
    >
      <path d="M16 3v3M14 4h4" />
      <path d="M12 6h8l2 4H10l2-4Z" />
      <path d="M9 10l-1.5 5h17L23 10H9Z" />
      <path d="M7.5 15l-1.5 6h20l-1.5-6H7.5Z" />
      <path d="M6 21l-1.5 7h23l-1.5-7H6Z" />
      <path d="M3 28h26" />
      <path d="M13 28v-5a3 3 0 0 1 6 0v5" />
      <circle cx="16" cy="18" r="1.2" fill="currentColor" />
      <circle cx="16" cy="12.5" r="1" fill="currentColor" />
    </svg>
  )
}

/**
 * Traditional steaming Annadhanam food bowl icon for the Sevalaya card badge.
 */
export function AnnadhanamBowlIcon({ className, size = 32 }: { className?: string; size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
      className={className}
    >
      {/* Gentle rising steam waves */}
      <path d="M11 6c-1 2 1 3 0 5" opacity="0.8" />
      <path d="M16 4c-1.2 2.5 1.2 4 0 7" />
      <path d="M21 6c-1 2 1 3 0 5" opacity="0.8" />

      {/* Pure bowl container */}
      <path d="M5 14h22c0 6.5-4.5 11-11 11S5 20.5 5 14Z" />
      <path d="M4 14h24" strokeWidth="1.8" />
      <path d="M10 25l-1.5 3.5h15L22 25" />
    </svg>
  )
}

/**
 * Traditional ceremonial Deepam / Vilakku icon for the Tamil Sangam card badge.
 */
export function TraditionalDeepamIcon({ className, size = 32 }: { className?: string; size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
      className={className}
    >
      {/* Flame */}
      <path d="M16 3.5c2 2.5 3 4.2 3 6a3 3 0 1 1-6 0c0-1.8 1-3.5 3-6Z" fill="currentColor" fillOpacity="0.18" />
      <path d="M16 3.5c2 2.5 3 4.2 3 6a3 3 0 1 1-6 0c0-1.8 1-3.5 3-6Z" />

      {/* Lamp bowl */}
      <path d="M7 15c0-1 1-1.8 2.5-1.8h13c1.5 0 2.5.8 2.5 1.8 0 3.8-4 6-9 6s-9-2.2-9-6Z" />
      <path d="M6 15h20" strokeWidth="1.8" />

      {/* Stem & base */}
      <path d="M16 21v4" strokeWidth="2" />
      <path d="M10 28.5c0-1.5 2.5-2.5 6-2.5s6 1 6 2.5" />
      <path d="M8 28.5h16" strokeWidth="1.8" />
    </svg>
  )
}

/**
 * Custom line icon for Trust Item 01: Instant receipt issuance.
 */
/**
 * Custom line icon for Trust Item 01: Instant receipt voucher.
 */
export function ReceiptTrustIcon({ className, size = 24 }: { className?: string; size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
      className={className}
    >
      <path d="M4 3h16v18l-3-2-2.5 2-2.5-2-2.5 2-2.5-2-3 2V3Z" />
      <line x1="8" y1="7" x2="16" y2="7" />
      <line x1="8" y1="11" x2="16" y2="11" />
      <line x1="8" y1="15" x2="12" y2="15" />
    </svg>
  )
}

/**
 * Custom line icon for Trust Item 02: Dual signature / wallet approval.
 */
export function SignatureTrustIcon({ className, size = 24 }: { className?: string; size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
      className={className}
    >
      <rect x="2" y="5" width="20" height="15" rx="3" />
      <path d="M16 12.5a2 2 0 1 0 4 0 2 2 0 1 0-4 0Z" />
      <path d="M2 9.5h20" />
      <circle cx="18" cy="12.5" r="0.75" fill="currentColor" stroke="none" />
    </svg>
  )
}

/**
 * Custom line icon for Trust Item 03: Restricted fund protection shield.
 */
export function ShieldTrustIcon({ className, size = 24 }: { className?: string; size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
      className={className}
    >
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z" />
      <rect x="9.5" y="11" width="5" height="4" rx="1" />
      <path d="M10.5 11v-1.5a1.5 1.5 0 0 1 3 0V11" />
    </svg>
  )
}

/**
 * Header finial / crown ornament divider `· ── ✦ ── ·`.
 */
export function CrownOrnamentDivider({ className }: { className?: string }) {
  return (
    <div className={cn('flex items-center justify-center gap-2 text-turmeric-600', className)} aria-hidden>
      <span className="size-1 rounded-full bg-turmeric-500" />
      <span className="h-px w-8 bg-turmeric-400/70" />
      <svg width="22" height="14" viewBox="0 0 22 14" fill="currentColor" className="shrink-0">
        <path d="M11 0l3 4.5 4.5-2-1.5 7.5H5L3.5 2.5 8 4.5 11 0Z" />
        <circle cx="3" cy="2" r="1.2" />
        <circle cx="11" cy="0" r="1.2" />
        <circle cx="19" cy="2" r="1.2" />
      </svg>
      <span className="h-px w-8 bg-turmeric-400/70" />
      <span className="size-1 rounded-full bg-turmeric-500" />
    </div>
  )
}

/**
 * Delicate South Indian floral kolam icon for the sponsor link.
 * Matches authentic 8-petal rangoli / lotus motif with cardinal and diagonal petals.
 */
export function HeritageKolamStar({ className, size = 18 }: { className?: string; size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.35"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
      className={cn('shrink-0 text-turmeric-600', className)}
    >
      {/* 4 Cardinal Petals */}
      <path d="M12 2C10.4 5.2 10.5 8.6 12 10C13.5 8.6 13.6 5.2 12 2Z" fill="currentColor" fillOpacity="0.15" />
      <path d="M12 22C10.4 18.8 10.5 15.4 12 14C13.5 15.4 13.6 18.8 12 22Z" fill="currentColor" fillOpacity="0.15" />
      <path d="M2 12C5.2 10.4 8.6 10.5 10 12C8.6 13.5 5.2 13.6 2 12Z" fill="currentColor" fillOpacity="0.15" />
      <path d="M22 12C18.8 10.4 15.4 10.5 14 12C15.4 13.5 18.8 13.6 22 12Z" fill="currentColor" fillOpacity="0.15" />

      {/* 4 Diagonal Petals (Rotated 45 deg, slightly shorter) */}
      <g transform="rotate(45 12 12)">
        <path d="M12 3.2C10.6 6 10.7 8.8 12 10.2C13.3 8.8 13.4 6 12 3.2Z" fill="currentColor" fillOpacity="0.15" />
        <path d="M12 20.8C10.6 18 10.7 15.2 12 13.8C13.3 15.2 13.4 18 12 20.8Z" fill="currentColor" fillOpacity="0.15" />
        <path d="M3.2 12C6 10.6 8.8 10.7 10.2 12C8.8 13.3 6 13.4 3.2 12Z" fill="currentColor" fillOpacity="0.15" />
        <path d="M20.8 12C18 10.6 15.2 10.7 13.8 12C15.2 13.3 18 13.4 20.8 12Z" fill="currentColor" fillOpacity="0.15" />
      </g>

      {/* Center Ring and Dot */}
      <circle cx="12" cy="12" r="1.6" fill="#FFFDF8" stroke="currentColor" strokeWidth="1.2" />
      <circle cx="12" cy="12" r="0.6" fill="currentColor" stroke="none" />
    </svg>
  )
}

/**
 * Photorealistic Ceremonial Hanging Brass Lamps (Thooku Vilakku) vector with zero background.
 */
export function CeremonialHangingDeepams({ className }: { className?: string }) {
  return (
    <svg
      width="180"
      height="340"
      viewBox="0 0 180 340"
      fill="none"
      aria-hidden
      className={cn('pointer-events-none drop-shadow-md', className)}
    >
      <defs>
        <linearGradient id="brass-mount" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#8A5A12" />
          <stop offset="35%" stopColor="#E2A62C" />
          <stop offset="70%" stopColor="#F5D068" />
          <stop offset="100%" stopColor="#6E440A" />
        </linearGradient>
        <linearGradient id="brass-body" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#F9E298" />
          <stop offset="30%" stopColor="#D4971A" />
          <stop offset="70%" stopColor="#96620C" />
          <stop offset="100%" stopColor="#5C3804" />
        </linearGradient>
        <radialGradient id="lamp-flame-glow" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#FFF9E0" />
          <stop offset="40%" stopColor="#F8BA2A" stopOpacity="0.9" />
          <stop offset="100%" stopColor="#B3261E" stopOpacity="0" />
        </radialGradient>
      </defs>

      {/* Left Smaller Lamp (Chain & Body) */}
      <g>
        {/* Ceiling Mount */}
        <ellipse cx="40" cy="8" rx="20" ry="6" fill="url(#brass-mount)" />
        <ellipse cx="40" cy="10" rx="14" ry="4" fill="url(#brass-body)" />
        <circle cx="40" cy="14" r="3.5" fill="#8A5A12" />

        {/* Chain */}
        <line x1="40" y1="16" x2="40" y2="185" stroke="#C48C1C" strokeWidth="2.5" strokeDasharray="3 3.5" strokeLinecap="round" />
        <line x1="40" y1="16" x2="40" y2="185" stroke="#6E440A" strokeWidth="0.8" strokeDasharray="1.5 5" strokeLinecap="round" />

        {/* Peacock Finial on Lamp */}
        <circle cx="40" cy="188" r="4.5" fill="url(#brass-body)" />
        <path d="M40 188c-4 0-7 4-5 8 1 2 4 4 5 7 1-3 4-5 5-7 2-4-1-8-5-8Z" fill="url(#brass-body)" />

        {/* Flame for left lamp */}
        <circle cx="34" cy="198" r="6" fill="url(#lamp-flame-glow)" />
        <path d="M34 193c1.5 2 2.2 3.5 2.2 4.8a2.2 2.2 0 1 1-4.4 0c0-1.3.7-2.8 2.2-4.8Z" fill="#F8BA2A" />
        <path d="M34 195c0.8 1 1.2 1.8 1.2 2.5a1.2 1.2 0 1 1-2.4 0c0-.7.4-1.5 1.2-2.5Z" fill="#FFFDF8" />

        {/* Lamp Base Bowl */}
        <path d="M22 208c0-2 4-3.5 18-3.5s18 1.5 18 3.5c0 4.5-8 9-18 9s-18-4.5-18-9Z" fill="url(#brass-body)" />
        <path d="M26 215l-3 10h34l-3-10" fill="url(#brass-body)" />
        <ellipse cx="40" cy="225" rx="14" ry="4" fill="url(#brass-mount)" />
        <circle cx="40" cy="231" r="3" fill="#8A5A12" />
      </g>

      {/* Right Larger Ornate Temple Hanging Lamp */}
      <g>
        {/* Ceiling Mount */}
        <ellipse cx="130" cy="10" rx="26" ry="7" fill="url(#brass-mount)" />
        <ellipse cx="130" cy="13" rx="18" ry="5" fill="url(#brass-body)" />
        <circle cx="130" cy="18" r="4.5" fill="#8A5A12" />

        {/* 3 Triple Hanging Chains */}
        <line x1="130" y1="20" x2="98" y2="160" stroke="#C48C1C" strokeWidth="2.2" strokeDasharray="3 3.5" strokeLinecap="round" />
        <line x1="130" y1="20" x2="130" y2="160" stroke="#C48C1C" strokeWidth="2.4" strokeDasharray="3 3.5" strokeLinecap="round" />
        <line x1="130" y1="20" x2="162" y2="160" stroke="#C48C1C" strokeWidth="2.2" strokeDasharray="3 3.5" strokeLinecap="round" />

        {/* Upper Dome Pavilion Canopy */}
        <path d="M112 160c0-12 8-22 18-22s18 10 18 22Z" fill="url(#brass-mount)" />
        <ellipse cx="130" cy="160" rx="22" ry="6" fill="url(#brass-body)" />
        <circle cx="130" cy="135" r="4" fill="#F5D068" />
        <path d="M130 131v-5M128 126h4" stroke="#8A5A12" strokeWidth="1.5" strokeLinecap="round" />

        {/* Central Deity / Carved Pillar Chamber */}
        <rect x="122" y="160" width="16" height="28" rx="2" fill="url(#brass-body)" />
        <path d="M110 170c4 4 10 6 12 6M150 170c-4 4-10 6-12 6" stroke="#8A5A12" strokeWidth="2" strokeLinecap="round" />

        {/* Glowing Flames along the Deepam Rim */}
        {[
          { x: 92, y: 194 },
          { x: 108, y: 200 },
          { x: 130, y: 202 },
          { x: 152, y: 200 },
          { x: 168, y: 194 },
        ].map((f, i) => (
          <g key={i}>
            <circle cx={f.x} cy={f.y} r="8" fill="url(#lamp-flame-glow)" />
            <path d={`M${f.x} ${f.y - 8}c2 2.8 3 4.8 3 6.6a3 3 0 1 1-6 0c0-1.8 1-3.8 3-6.6Z`} fill="#F8BA2A" />
            <path d={`M${f.x} ${f.y - 5}c1 1.4 1.5 2.4 1.5 3.3a1.5 1.5 0 1 1-3 0c0-.9.5-1.9 1.5-3.3Z`} fill="#FFFDF8" />
          </g>
        ))}

        {/* Main Large Oil Basin / Vilakku Bowl */}
        <path d="M88 202c0-3 9-5.5 42-5.5s42 2.5 42 5.5c0 8-18 16-42 16s-42-8-42-16Z" fill="url(#brass-mount)" />
        <ellipse cx="130" cy="202" rx="38" ry="7" fill="url(#brass-body)" />

        {/* Lower Stepped Bell Base */}
        <path d="M102 216c0 10 12 22 28 22s28-12 28-22Z" fill="url(#brass-body)" />
        <path d="M110 238c0 6 8 12 20 12s20-6 20-12Z" fill="url(#brass-mount)" />
        <circle cx="130" cy="256" r="4.5" fill="url(#brass-mount)" />
        <path d="M130 260v8" stroke="#8A5A12" strokeWidth="2.5" strokeLinecap="round" />
      </g>
    </svg>
  )
}

/**
 * Solid Temple Gopuram Icon for the Project Badge.
 */
export function TempleTowerIcon({ className, size = 22 }: { className?: string; size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden
      className={cn('shrink-0 text-turmeric-700', className)}
    >
      <path d="M12 1.5l1.5 2h-3l1.5-2Z" />
      <path d="M10 4h4l1 3H9l1-3Z" />
      <path d="M8 7.5h8l1 3.5H7l1-3.5Z" />
      <path d="M6.5 11.5h11l1 4H5.5l1-4Z" />
      <path d="M5 16h14l1 4.5H4L5 16Z" />
      <path d="M3 21h18v2H3v-2Z" />
      <path d="M10 21v-3.5a2 2 0 0 1 4 0V21h-4Z" fill="#FFFDF8" />
    </svg>
  )
}

/**
 * Crossed Sculptor / Sthapati Mallets & Chisels Icon.
 */
export function SthapatiChiselsIcon({ className, size = 22 }: { className?: string; size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
      className={cn('shrink-0 text-turmeric-700', className)}
    >
      {/* Crossed hammer and chisel */}
      <path d="M14.5 4.5l5 5-2 2-5-5 2-2Z" fill="currentColor" fillOpacity="0.2" />
      <path d="M12.5 6.5L4 15l-1 5 5-1 8.5-8.5" />
      <path d="M9.5 4.5l-5 5 2 2 5-5-2-2Z" fill="currentColor" fillOpacity="0.2" />
      <path d="M11.5 6.5L20 15l1 5-5-1-8.5-8.5" />
    </svg>
  )
}

/**
 * Sacred Offering Hand with Diya / Prasadam Icon for Primary CTA.
 */
export function SacredOfferingHandIcon({ className, size = 20 }: { className?: string; size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
      className={cn('shrink-0', className)}
    >
      <path d="M12 3c1.2 1.5 2 2.7 2 3.8a2 2 0 1 1-4 0c0-1.1.8-2.3 2-3.8Z" fill="#E2A62C" stroke="none" />
      <path d="M8 10h8c1 0 1.5.5 1.5 1.2 0 1.8-2.5 3-5.5 3s-5.5-1.2-5.5-3c0-.7.5-1.2 1.5-1.2Z" fill="#E2A62C" stroke="none" />
      <path d="M4 14.5c2-1 4.5-.5 6.5 1l3.5 2.5h6" />
      <path d="M4 14.5v5h12l4-4" />
    </svg>
  )
}

/**
 * Vintage Ornate Corner Filigree Accent for Cards.
 */
export function VintageCornerFiligree({ className, position }: { className?: string; position: 'tl' | 'tr' | 'bl' | 'br' }) {
  const transform =
    position === 'tr'
      ? 'scaleX(-1)'
      : position === 'bl'
      ? 'scaleY(-1)'
      : position === 'br'
      ? 'scale(-1)'
      : undefined

  return (
    <svg
      width="28"
      height="28"
      viewBox="0 0 28 28"
      fill="none"
      aria-hidden
      style={{ transform }}
      className={cn('pointer-events-none absolute text-turmeric-500/70', className)}
    >
      <path d="M2 26V9C2 5.1 5.1 2 9 2h17" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
      <path d="M6 26V12c0-3.3 2.7-6 6-6h14" stroke="currentColor" strokeWidth="0.8" opacity="0.6" />
      <path d="M2 17c3 0 5-2 5-5" stroke="currentColor" strokeWidth="1" opacity="0.7" />
      <path d="M17 2c0 3-2 5-5 5" stroke="currentColor" strokeWidth="1" opacity="0.7" />
    </svg>
  )
}

/**
 * Colored miniature Traditional Diya (Agal Vilakku) for festival tags and announcements.
 * Features a terracotta/brass curved bowl and a vibrant dual-tone flame with glowing core.
 */
export function FestivalDiyaLogo({ className, size = 18 }: { className?: string; size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden
      className={cn('shrink-0', className)}
    >
      <defs>
        <linearGradient id="festival-flame" x1="0" y1="1" x2="0" y2="0">
          <stop offset="0%" stopColor="#D94600" />
          <stop offset="45%" stopColor="#F59E0B" />
          <stop offset="100%" stopColor="#FDE68A" />
        </linearGradient>
        <linearGradient id="festival-bowl" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#8A2016" />
          <stop offset="100%" stopColor="#58110B" />
        </linearGradient>
      </defs>

      {/* Outer Flame */}
      <path
        d="M12 2C10.2 5 8.5 7.8 8.5 10.5a3.5 3.5 0 0 0 7 0C15.5 7.8 13.8 5 12 2Z"
        fill="url(#festival-flame)"
      />

      {/* Inner Bright Flame Core */}
      <path
        d="M12 5.5C11 7.2 10.2 8.8 10.2 10.5a1.8 1.8 0 0 0 3.6 0c0-1.7-.8-3.3-1.8-5Z"
        fill="#FFFDF5"
        opacity="0.9"
      />

      {/* Clay / Brass Diya Basin Bowl */}
      <path
        d="M4 14.5c0 4.5 3.5 6.5 8 6.5s8-2 8-6.5h-16Z"
        fill="url(#festival-bowl)"
      />

      {/* Diya Rim / Lip */}
      <ellipse cx="12" cy="14.5" rx="8" ry="1.8" fill="#B32E22" />
    </svg>
  )
}

/**
 * Blooming Sacred Lotus Line-Art for the Footer Right Atmosphere.
 */
export function LotusFooterArt({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 280 260"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.1"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
      className={cn('pointer-events-none', className)}
    >
      {/* Central upright lotus petals */}
      <path d="M140 30c-15 45-20 85 0 130 20-45 15-85 0-130Z" />
      <path d="M140 50c-10 35-12 70 0 105 12-35 10-70 0-105Z" opacity="0.6" />

      {/* Flanking middle petals */}
      <path d="M140 80c-35 25-60 65-35 105 35-15 55-55 35-105Z" />
      <path d="M140 80c35 25 60 65 35 105-35-15-55-55-35-105Z" />

      {/* Outer flared wide petals */}
      <path d="M130 115c-55 15-95 50-70 90 45-5 85-35 70-90Z" />
      <path d="M150 115c55 15 95 50 70 90-45-5-85-35-70-90Z" />

      {/* Base Calyx & Stem leaves */}
      <path d="M100 200c-30 10-55 25-45 40 35 0 65-15 45-40Z" />
      <path d="M180 200c30 10 55 25 45 40-35 0-65-15-45-40Z" />
      <path d="M85 225c35 15 75 15 110 0" strokeWidth="1.3" />

      {/* Decorative center bindu & stamen lines */}
      <circle cx="140" cy="150" r="3.5" fill="currentColor" opacity="0.8" />
      <path d="M132 145c3-12 13-12 16 0" opacity="0.5" />
    </svg>
  )
}



