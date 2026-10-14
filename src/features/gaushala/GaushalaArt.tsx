import { cn } from '@/lib/cn'
import { COW_PHOTOS, PHOTOS, PHOTO_GRADE } from '@/lib/photos'

/**
 * Art for the Gaushala.
 *
 * The herd portraits are photographs cut from the shelter picture, so a cow on
 * the Our Cows page looks like a cow. The icons below stay drawn, in the same
 * line-art hand as the gopuram and the deepam.
 */

/* -------------------------------------------------------------- portraits */

/**
 * One cow's face. `portrait` is the index stored on her record, so she keeps
 * the same face everywhere she appears — card, drawer and console table.
 */
export function CowPortrait({
  portrait,
  className,
  size = 120,
}: {
  portrait: number
  className?: string
  size?: number
}) {
  const key = COW_PHOTOS[((portrait % COW_PHOTOS.length) + COW_PHOTOS.length) % COW_PHOTOS.length]!
  const { src, alt } = PHOTOS[key]
  return (
    <img
      src={src}
      alt={alt}
      width={size}
      height={size}
      loading="lazy"
      decoding="async"
      style={{ width: size, height: size, filter: PHOTO_GRADE }}
      className={cn('block shrink-0 object-cover', className)}
      draggable={false}
    />
  )
}

/* --------------------------------------------------------- gallery plates */

/**
 * A stand-in for a photograph that has not been uploaded yet.
 *
 * It draws from the shelter's own pictures rather than inventing a graphic, so
 * a gallery tile and a rescue before-and-after read as photographs. The
 * captions carry the meaning; the picture is a placeholder until the shelter
 * uploads its own.
 */
export function GalleryPlate({ art, className }: { art: number; className?: string }) {
  const keys = [...COW_PHOTOS, 'gaushala'] as const
  const key = keys[((art % keys.length) + keys.length) % keys.length]!
  const { src, alt } = PHOTOS[key]
  return (
    <img
      src={src}
      alt={alt}
      loading="lazy"
      decoding="async"
      style={{ filter: PHOTO_GRADE }}
      className={cn('block h-full w-full object-cover', className)}
      draggable={false}
    />
  )
}

/* ------------------------------------------------------------------ icons */

export function CowIcon({ className, size = 22 }: { className?: string; size?: number }) {
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
      <path d="M5 8c-1.6-1-2.4-2.6-2-4 1.6 0 3 .8 4 2" />
      <path d="M19 8c1.6-1 2.4-2.6 2-4-1.6 0-3 .8-4 2" />
      <path d="M12 6c3.4 0 5.6 1.8 6 5 .4 3-.6 5.6-2.4 7.2-1 .9-2.3 1.4-3.6 1.4s-2.6-.5-3.6-1.4C6.6 16.6 5.6 14 6 11c.4-3.2 2.6-5 6-5Z" />
      <ellipse cx="12" cy="16.2" rx="3.6" ry="2.6" />
      <path d="M10.6 15.6h.01M13.4 15.6h.01" />
      <path d="M9.6 11.4h.01M14.4 11.4h.01" />
    </svg>
  )
}

export function FodderIcon({ className, size = 22 }: { className?: string; size?: number }) {
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
      <path d="M12 21V9" />
      <path d="M12 13c-3-1-5-3.4-5-6.4C10 7 12 9.4 12 12.4" />
      <path d="M12 11c0-3 2-5.4 5-5.4 0 3-2 5.4-5 6.4" />
      <path d="M4 21h16" />
      <path d="M7 21l1-4h8l1 4" />
    </svg>
  )
}
