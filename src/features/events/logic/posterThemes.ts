import type { EventRecord, PosterVariant } from '@/types'

/**
 * The three poster themes, as design tokens rather than scattered literals.
 *
 * A poster is an exported file that leaves the app — it is printed, mailed and
 * put on a noticeboard — so the colours are fixed hex values and never theme
 * variables. Everything a renderer needs about a theme lives here, so adding a
 * fourth theme is one entry in this file plus one photo tag.
 */

export interface PosterPalette {
  background: string
  primary: string
  secondary: string
  accent: string
  text: string
}

export interface PosterTheme {
  id: PosterVariant
  label: string
  tamilLabel: string
  /** Shown next to the theme picker so an admin knows what they are choosing. */
  description: string
  palette: PosterPalette
  fonts: { display: string; body: string }
  photo: {
    /** The furthest down the 1448pt poster the photograph may reach. */
    maxHeight: number
    /** Clear space between the bottom of the photograph and the first line of type. */
    gap: number
    /** Side margin around the photo panel. 0 is a full bleed. */
    inset: number
    /** Corner radius of the photo panel. */
    radius: number
    /** Strength of the themed colour wash laid over the photograph, 0–1. */
    washOpacity: number
    /** Strength of the dark scrim behind the masthead, 0–1. 0 puts the masthead on paper instead of on the photo. */
    scrimOpacity: number
  }
  /** Frame drawn over the paper area. */
  ornament: 'double-rule' | 'hairline' | 'garland'
  /** The art direction a photo service would be given. Never asks for text in the image. */
  brief: string
}

const SERIF = "'Cormorant Garamond','Hind Madurai',Georgia,serif"
const SANS = "'Hind Madurai','Segoe UI',system-ui,sans-serif"
const GEOMETRIC = "'Montserrat','Hind Madurai','Segoe UI',sans-serif"

/** Appended to every brief. Words, logos and the QR are drawn by the app, never by an image model. */
export const PHOTO_BRIEF_SUFFIX =
  'Real photograph, natural depth of field, authentic textures. ' +
  'No text, no lettering, no captions, no watermarks, no logos, no posters within the image. ' +
  'No illustration, no cartoon, no vector art, no 3D render, no flat graphic. ' +
  'Keep the lower third calm and uncluttered so type can sit over it.'

export const POSTER_THEMES: Record<PosterVariant, PosterTheme> = {
  traditional: {
    id: 'traditional',
    label: 'Traditional Heritage',
    tamilLabel: 'பாரம்பரியம்',
    description: 'Classical music and dance, pooja, heritage programmes. Warm golden-hour temple photography with an ornate double frame.',
    palette: { background: '#FFFAF0', primary: '#D6A23A', secondary: '#14566A', accent: '#8C3B2F', text: '#30251D' },
    fonts: { display: SERIF, body: SANS },
    photo: { maxHeight: 900, gap: 24, inset: 0, radius: 0, washOpacity: 0.1, scrimOpacity: 0.56 },
    ornament: 'double-rule',
    brief:
      'Realistic South Indian temple architecture at golden hour. Carved granite pillars and a gopuram, ' +
      'brass oil lamps alight, a Bharatanatyam dancer in authentic silk costume and temple jewellery. ' +
      'Warm amber light, deep shadows, documentary photography.',
  },
  modern: {
    id: 'modern',
    label: 'Modern Minimal',
    tamilLabel: 'எளிமை',
    description: 'Workshops, seminars, education and charity dinners. Clean daylight architecture, generous whitespace, editorial type.',
    palette: { background: '#F7F8FA', primary: '#20566A', secondary: '#B9D5DE', accent: '#D8CBA6', text: '#263746' },
    fonts: { display: GEOMETRIC, body: SANS },
    photo: { maxHeight: 900, gap: 56, inset: 56, radius: 4, washOpacity: 0.04, scrimOpacity: 0 },
    ornament: 'hairline',
    brief:
      'Realistic temple photography in soft natural morning light. Clean architectural composition, ' +
      'strong horizontals, subtle shadows, plenty of empty sky. Calm, editorial, understated. ' +
      'Minimal decoration, no crowds.',
  },
  festive: {
    id: 'festive',
    label: 'Festive Celebration',
    tamilLabel: 'திருவிழா',
    description: 'Pongal, Deepavali, Navaratri, Puthandu and car festivals. Sunset temple festival photography, rich and vibrant.',
    palette: { background: '#FFF5DF', primary: '#E69A20', secondary: '#176B50', accent: '#B94732', text: '#3C251A' },
    fonts: { display: SERIF, body: SANS },
    photo: { maxHeight: 920, gap: 20, inset: 0, radius: 0, washOpacity: 0.12, scrimOpacity: 0.6 },
    ornament: 'garland',
    brief:
      'Realistic South Indian temple festival photographed at sunset. Illuminated gopuram, marigold garlands, ' +
      'rows of brass lamps, banana leaves and festive decoration. Real people in authentic traditional clothing, ' +
      'natural faces. Rich warm festive light, vibrant but balanced colour.',
  },
}

export const POSTER_THEME_LIST: PosterTheme[] = [
  POSTER_THEMES.traditional,
  POSTER_THEMES.modern,
  POSTER_THEMES.festive,
]

export const DEFAULT_POSTER_THEME: PosterVariant = 'traditional'

/* ------------------------------------------------------------ selection */

/**
 * Category first. `EventRecord.eventType` is a controlled value the ERP already
 * stores, so it is far more reliable than reading the name — "Deepavali
 * Annadhanam" is a seva, not a fireworks night.
 */
const CATEGORY_THEME: Record<string, PosterVariant> = {
  /* festive */
  FESTIVAL: 'festive',
  NAVARATRI: 'festive',
  PONGAL: 'festive',
  DIWALI: 'festive',
  DEEPAVALI: 'festive',
  PUTHANDU: 'festive',
  CAR_FESTIVAL: 'festive',
  THER: 'festive',
  /* traditional */
  PROGRAM: 'traditional',
  POOJA: 'traditional',
  HOMAM: 'traditional',
  ABHISHEKAM: 'traditional',
  KALYANAM: 'traditional',
  HERITAGE: 'traditional',
  CONCERT: 'traditional',
  /* modern */
  SEVA: 'modern',
  WORKSHOP: 'modern',
  SEMINAR: 'modern',
  EDUCATION: 'modern',
  CHARITY: 'modern',
  DINNER: 'modern',
  CAMP: 'modern',
  MEDICAL: 'modern',
  MEETING: 'modern',
}

/**
 * Last resort when the category is GENERAL or something the ERP has not seen
 * before. Every term is anchored at a word boundary: without it "Gathering"
 * reads as a "ther" festival and "Classical" as a class.
 */
const KEYWORD_THEME: [RegExp, PosterVariant][] = [
  [/\b(pongal|deepavali|diwali|navaratri|navratri|puthandu|new year|car festival|ther\b|thiruvizha|vizha|utsav|mahotsav|karthigai|chaturthi)/i, 'festive'],
  [/\b(workshop|seminar|classes\b|class\b|tuition|school|training|camp|medical|charity|dinner|fundrais|orientation|meeting|library|lecture)/i, 'modern'],
  [/\b(isai|music|dance|classical|bharatanatyam|natya|concert|kutcheri|arangetram|kavi|pooja|puja|homam|archana|abhishekam|kalyanam|deepam|heritage|sangam|margazhi)/i, 'traditional'],
]

export type PosterThemeSource = 'override' | 'category' | 'keyword' | 'default'

export interface PosterThemeChoice {
  theme: PosterTheme
  source: PosterThemeSource
  /** Plain-language reason, for the admin-facing theme picker. */
  reason: string
}

/**
 * Picks the theme for an event. Pass `override` to honour an admin's manual
 * choice; `'auto'` or undefined runs the automatic mapping.
 */
export function selectPosterTheme(
  event: Pick<EventRecord, 'eventType' | 'name'>,
  override?: PosterVariant | 'auto',
): PosterThemeChoice {
  if (override && override !== 'auto') {
    return { theme: POSTER_THEMES[override], source: 'override', reason: 'Chosen by hand.' }
  }

  const category = (event.eventType ?? '').trim().toUpperCase().replace(/[\s-]+/g, '_')
  const byCategory = CATEGORY_THEME[category]
  if (byCategory) {
    return { theme: POSTER_THEMES[byCategory], source: 'category', reason: `Event type ${category}.` }
  }

  for (const [pattern, variant] of KEYWORD_THEME) {
    const hit = pattern.exec(event.name ?? '')
    if (hit) {
      return { theme: POSTER_THEMES[variant], source: 'keyword', reason: `The name mentions "${hit[0]}".` }
    }
  }

  return {
    theme: POSTER_THEMES[DEFAULT_POSTER_THEME],
    source: 'default',
    reason: 'No matching event type, so the house theme is used.',
  }
}
