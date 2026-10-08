import { cn } from '@/lib/cn'
import { PHOTOS, PHOTO_GRADE, PHOTO_WASH, type PhotoKey } from '@/lib/photos'

/**
 * A photograph framed in a temple arch. The mask is what keeps a stock-looking
 * picture feeling like it belongs to this product rather than sitting on top of it.
 */
export function ArchPhoto({
  photo,
  className,
  priority,
}: {
  photo: PhotoKey
  className?: string
  /** The hero image should not wait for lazy loading. */
  priority?: boolean
}) {
  const { src, alt } = PHOTOS[photo]
  return (
    <figure className={cn('relative', className)}>
      <div
        className="relative overflow-hidden bg-sandal-100"
        style={{ borderRadius: '50% 50% 14px 14px / 34% 34% 14px 14px' }}
      >
        <img
          src={src}
          alt={alt}
          loading={priority ? 'eager' : 'lazy'}
          decoding="async"
          style={{ filter: PHOTO_GRADE }}
          className="block h-full w-full object-cover"
        />
        <div className="pointer-events-none absolute inset-0" style={{ background: PHOTO_WASH }} aria-hidden />
        {/* warms the photograph into the page rather than letting it sit cold on paper */}
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              'radial-gradient(120% 80% at 50% 100%, rgb(43 26 18 / 0.34) 0%, rgb(43 26 18 / 0) 55%)',
          }}
          aria-hidden
        />
      </div>

      {/* brass inlay following the arch */}
      <div
        className="pointer-events-none absolute inset-0 border border-turmeric-500/45"
        style={{ borderRadius: '50% 50% 14px 14px / 34% 34% 14px 14px' }}
        aria-hidden
      />
      <div
        className="pointer-events-none absolute inset-[7px] border border-turmeric-400/25"
        style={{ borderRadius: '50% 50% 10px 10px / 34% 34% 10px 10px' }}
        aria-hidden
      />
    </figure>
  )
}

/** A plain rectangular photograph, for cards and banners. */
export function Photo({
  photo,
  className,
  imgClassName,
  position,
  filter,
  wash,
  priority,
}: {
  photo: PhotoKey
  className?: string
  imgClassName?: string
  /**
   * Which part of the frame to keep when the crop is much wider than the
   * photograph. A portrait shot cut to a banner otherwise lands on whatever
   * happens to be in the middle.
   */
  position?: string
  /** CSS filter, for a photograph that needs lifting under a dark overlay. */
  filter?: string
  /** Lay the warm wash over this photograph too. Off for banners, which have their own overlay. */
  wash?: boolean
  priority?: boolean
}) {
  const { src, alt } = PHOTOS[photo]
  return (
    <div className={cn('relative overflow-hidden bg-sandal-100', className)}>
      <img
        src={src}
        alt={alt}
        loading={priority ? 'eager' : 'lazy'}
        decoding="async"
        style={{ objectPosition: position, filter: filter ? `${PHOTO_GRADE} ${filter}` : PHOTO_GRADE }}
        className={cn('block h-full w-full object-cover', imgClassName)}
      />
      {wash ? (
        <div className="pointer-events-none absolute inset-0" style={{ background: PHOTO_WASH }} aria-hidden />
      ) : null}
    </div>
  )
}
