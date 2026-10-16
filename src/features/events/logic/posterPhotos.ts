import type { EventRecord, PosterVariant } from '@/types'

/**
 * The photograph that fills the top of a poster.
 *
 * Every entry here is a real photograph with no lettering burnt into it. That
 * matters twice over: a poster prints its own words from the event record, so
 * any text inside the picture is a second, wrong set of words; and Tamil put
 * through an image model comes out as nonsense. Several pictures in
 * `/images/catalogue` are photographs with an English banner baked in — those
 * are deliberately not in this list.
 *
 * Each theme prints on one fixed template photograph (`TEMPLATE_PHOTO`); the
 * remaining entries are alternates an admin can swap in for a particular event.
 *
 * A prototype has no image keys and no server, so the library is the bundled
 * one. `resolvePosterPhoto` is the seam: point it at a stock or generation
 * service later and nothing above it changes.
 */

export interface PosterPhoto {
  /** A poster-sized derivative under `/images/posters`, built by `scripts/build-poster-photos.mjs`. */
  src: string
  alt: string
  themes: PosterVariant[]
  /** What this picture shows, for the admin-facing alternates gallery. */
  tags: string[]
  /**
   * Where the interest sits vertically, 0 (top) to 1 (bottom). The panel is
   * cropped to this point so a gopuram finial is not sliced off.
   */
  focusY: number
}

export const POSTER_PHOTOS: PosterPhoto[] = [
  {
    src: '/images/posters/sangam-stage.jpg',
    alt: 'A veena and mridangam on a garlanded temple hall stage under hanging brass lamps',
    themes: ['traditional'],
    tags: ['program', 'concert', 'heritage', 'music', 'dance', 'isai', 'sangam', 'margazhi', 'kavi'],
    focusY: 0.5,
  },
  {
    src: '/images/posters/sangam-hall.jpg',
    alt: 'A Tamil Sangam hall draped in marigold garlands with a veena and mridangam ready for a recital',
    themes: ['traditional'],
    tags: ['program', 'concert', 'heritage', 'music', 'sangam', 'isai', 'annual'],
    focusY: 0.45,
  },
  {
    src: '/images/posters/thirukalyanam.jpg',
    alt: 'A garlanded Thirukalyanam mandapam with priests performing the ceremony',
    themes: ['traditional'],
    tags: ['kalyanam', 'festival', 'pooja', 'utsavam', 'temple'],
    focusY: 0.4,
  },
  {
    src: '/images/posters/lamp-jasmine.jpg',
    alt: 'A lit brass oil lamp ringed with jasmine on a weathered temple step',
    themes: ['traditional'],
    tags: ['pooja', 'archana', 'homam', 'deepam', 'abhishekam', 'seva'],
    focusY: 0.5,
  },
  {
    src: '/images/posters/hanging-lamp.jpg',
    alt: 'An ornate brass hanging lamp with a ring of lit wicks against darkness',
    themes: ['traditional'],
    tags: ['pooja', 'deepam', 'karthigai', 'evening', 'heritage'],
    focusY: 0.55,
  },
  {
    src: '/images/posters/hanging-deepams.jpg',
    alt: 'Brass hanging deepams alight beside a smaller standing lamp',
    themes: ['traditional'],
    tags: ['pooja', 'deepam', 'heritage', 'archana'],
    focusY: 0.55,
  },

  {
    src: '/images/posters/gopuram-daylight.jpg',
    alt: 'A tall carved gopuram photographed straight on in flat daylight',
    themes: ['modern'],
    tags: ['workshop', 'seminar', 'education', 'meeting', 'temple', 'restoration'],
    focusY: 0.4,
  },
  {
    src: '/images/posters/rajagopuram-daylight.jpg',
    alt: 'A rajagopuram under restoration scaffolding in clear daylight',
    themes: ['modern'],
    tags: ['restoration', 'project', 'workshop', 'seminar', 'endowment', 'education'],
    focusY: 0.45,
  },
  {
    src: '/images/posters/annadhanam-hall.jpg',
    alt: 'Rows of people seated for a community meal served on banana leaves in a bright hall',
    themes: ['modern'],
    tags: ['seva', 'annadhanam', 'charity', 'dinner', 'camp', 'medical', 'community'],
    focusY: 0.5,
  },

  {
    src: '/images/posters/gopuram-sunset-lamps.jpg',
    alt: 'An illuminated gopuram at sunset above steps lined with hundreds of lit oil lamps and devotees',
    themes: ['festive'],
    tags: ['festival', 'deepavali', 'diwali', 'karthigai', 'navaratri', 'utsavam', 'vizha'],
    focusY: 0.55,
  },
  {
    src: '/images/posters/festival-procession.jpg',
    alt: 'A temple festival procession at sunset with dancers, drummers and a caparisoned elephant',
    themes: ['festive'],
    tags: ['festival', 'vizha', 'procession', 'navaratri', 'pongal', 'puthandu', 'chaturthi'],
    focusY: 0.5,
  },
  {
    src: '/images/posters/car-festival.jpg',
    alt: 'Devotees drawing a garlanded temple car past the gopuram',
    themes: ['festive'],
    tags: ['car', 'ther', 'festival', 'procession', 'vizha', 'utsavam'],
    focusY: 0.45,
  },
  {
    src: '/images/posters/gopuram-dusk-lamps.jpg',
    alt: 'A gopuram silhouetted at dusk above a staircase covered in lit oil lamps',
    themes: ['festive'],
    tags: ['deepam', 'karthigai', 'deepavali', 'diwali', 'festival', 'evening'],
    focusY: 0.55,
  },
]

/**
 * Catalogue tiles are offering artwork, and most of them have an English
 * banner painted into the photograph — "Annual Charity Dinner", "Free Medical
 * Camp". A poster prints its own words from the event record, so a second set
 * baked into the picture is a second, wrong set. The few that were checked and
 * are clean are named here; everything else under `catalogue/` is refused,
 * because a denylist over artwork nobody has looked at is a banner waiting to
 * go to print.
 */
const CATALOGUE_WITHOUT_TEXT = ['Thirukalyanam.png', 'Car Festival.png']

/** True when an event's own picture is safe to print behind the poster words. */
export function photoIsUsable(src: string | undefined): src is string {
  if (!src) return false
  const plain = decodeURI(src)
  if (!plain.includes('/images/catalogue/')) return true
  return CATALOGUE_WITHOUT_TEXT.some((name) => plain.endsWith(`/${name}`))
}

/**
 * The best photograph for an event under a theme. Deterministic: the same
 * design seed always lands on the same picture, so a poster an admin approved
 * is the poster that prints.
 */
/**
 * The one fixed photograph each theme prints on.
 *
 * A theme is a template: the picture is the constant, the event's words are
 * what change. Choosing the photo per event instead meant two Traditional
 * posters could look unrelated, which is the opposite of a house style. The
 * rest of `POSTER_PHOTOS` stays available as alternates an admin can swap in
 * by hand.
 */
export const TEMPLATE_PHOTO: Record<PosterVariant, string> = {
  traditional: '/images/posters/sangam-stage.jpg',
  modern: '/images/posters/gopuram-daylight.jpg',
  festive: '/images/posters/festival-procession.jpg',
}

/** The template photograph for a theme. */
export function templatePhoto(theme: PosterVariant): PosterPhoto {
  const src = TEMPLATE_PHOTO[theme]
  const found = POSTER_PHOTOS.find((p) => p.src === src)
  if (!found) throw new Error(`No library photo for the ${theme} template: ${src}`)
  return found
}

/* ------------------------------------------------------------- inlining */

const dataUriCache = new Map<string, Promise<string | null>>()

/**
 * Longest edge the embedded copy keeps. The photo panel is at most 1024 × 900,
 * so anything past this is weight the print shop never sees. One source file is
 * 2.7 MB, which base64 would turn into a 3.6 MB poster — three of those on a
 * preview grid is not something a browser should be asked to hold.
 */
const MAX_EDGE = 1600
const JPEG_QUALITY = 0.82

function readAsDataUri(blob: Blob): Promise<string | null> {
  if (typeof FileReader === 'undefined') return Promise.resolve(null)
  return new Promise((resolve) => {
    const reader = new FileReader()
    reader.onload = () => resolve(typeof reader.result === 'string' ? reader.result : null)
    reader.onerror = () => resolve(null)
    reader.readAsDataURL(blob)
  })
}

/** Re-encodes to a poster-sized JPEG. Returns null where there is no canvas to do it with. */
async function downscale(blob: Blob): Promise<string | null> {
  if (typeof createImageBitmap !== 'function' || typeof document === 'undefined') return null
  try {
    const bitmap = await createImageBitmap(blob)
    const scale = Math.min(1, MAX_EDGE / Math.max(bitmap.width, bitmap.height))
    const canvas = document.createElement('canvas')
    canvas.width = Math.max(1, Math.round(bitmap.width * scale))
    canvas.height = Math.max(1, Math.round(bitmap.height * scale))
    const ctx = canvas.getContext('2d')
    if (!ctx) return null
    ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height)
    bitmap.close?.()
    return canvas.toDataURL('image/jpeg', JPEG_QUALITY)
  } catch {
    return null
  }
}

/**
 * The photograph as a data URI, re-encoded to poster size.
 *
 * A poster is downloaded as a standalone .svg and opened from disk or handed to
 * a print shop, where `/images/…` resolves to nothing. The bytes have to travel
 * inside the file, so the picture is fetched, shrunk and inlined once, and the
 * result cached for every later render of the same photograph.
 */
export function photoDataUri(src: string): Promise<string | null> {
  const cached = dataUriCache.get(src)
  if (cached) return cached

  const job = (async () => {
    if (typeof fetch !== 'function') return null
    try {
      const response = await fetch(src)
      if (!response.ok) return null
      const blob = await response.blob()
      return (await downscale(blob)) ?? (await readAsDataUri(blob))
    } catch {
      // Offline, a 404 or a blocked origin. The poster falls back to drawn art.
      return null
    }
  })()

  dataUriCache.set(src, job)
  return job
}

export interface ResolvedPosterPhoto {
  photo: PosterPhoto
  /** null when the bytes could not be fetched; the caller then draws the fallback art. */
  dataUri: string | null
}

/**
 * The picture a poster should print, with its bytes.
 *
 * Order: the admin's explicit pick, then the event's own image when it carries
 * no printed banner, then the theme's template photograph.
 */
export async function resolvePosterPhoto(args: {
  event: Pick<EventRecord, 'name' | 'image'>
  theme: PosterVariant
  /** A src an admin chose by hand in the poster studio. */
  explicitSrc?: string
  /** Opt the event's own `image` in. Off by default: many are catalogue tiles, not poster art. */
  useEventImage?: boolean
}): Promise<ResolvedPosterPhoto> {
  const { event, theme, explicitSrc, useEventImage } = args

  /** A src that is not in the library still needs a PosterPhoto shape around it. */
  const adopt = (src: string): PosterPhoto => ({
    src: encodeURI(decodeURI(src)),
    alt: event.name ? `Photograph for ${event.name}` : 'Event photograph',
    themes: [theme],
    tags: [],
    focusY: 0.5,
  })

  let chosen: PosterPhoto | undefined
  if (photoIsUsable(explicitSrc)) {
    chosen = POSTER_PHOTOS.find((p) => p.src === explicitSrc) ?? adopt(explicitSrc)
  } else if (useEventImage && photoIsUsable(event.image)) {
    chosen = adopt(event.image)
  }
  chosen ??= templatePhoto(theme)

  return { photo: chosen, dataUri: await photoDataUri(chosen.src) }
}
