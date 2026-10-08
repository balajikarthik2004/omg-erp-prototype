/** Where each photograph lives, with the alt text it should always carry. */
export const PHOTOS = {
  temple: {
    src: '/images/temple-gopuram.webp',
    alt: 'A South Indian temple gopuram at dusk, with rows of oil lamps lit along the steps.',
  },
  sevalaya: {
    src: '/images/sevalaya-annadhanam.webp',
    alt: 'Annadhanam being served on banana leaves to a long row of seated guests.',
  },
  sangam: {
    src: '/images/sangam-hall.webp',
    alt: 'A Tamil sangam hall set for a music evening, with garlands, a tanpura and a mridangam.',
  },
  project: {
    src: '/images/project-rajagopuram.webp',
    alt: 'A temple gopuram under restoration, wrapped in bamboo scaffolding.',
  },
} as const

export type PhotoKey = keyof typeof PHOTOS

/**
 * One grade across every photograph, so four separately sourced images read as
 * a single commissioned set rather than four stock pictures. Warm, slightly
 * richer, a touch more contrast — the house look.
 */
export const PHOTO_GRADE = 'saturate(1.08) contrast(1.05) brightness(1.02) sepia(0.06)'

/** A warm wash laid over a photograph to pull it onto the sandalwood palette. */
export const PHOTO_WASH =
  'linear-gradient(180deg, rgb(154 31 24 / 0.1) 0%, rgb(43 26 18 / 0.06) 55%, rgb(74 14 11 / 0.16) 100%)'
