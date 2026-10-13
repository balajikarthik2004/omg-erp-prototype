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
 * One grade across every photograph, so separately sourced images read as a
 * single commissioned set. Clean and slightly richer — no sepia: that tinted
 * every picture in the app warm and survived three palette changes.
 */
export const PHOTO_GRADE = 'saturate(1.04) contrast(1.05) brightness(1.02)'

/** A cool wash on the OMG navy, so photographs sit on the brand, not beside it. */
export const PHOTO_WASH =
  'linear-gradient(180deg, rgb(41 48 136 / 0.10) 0%, rgb(41 48 136 / 0.05) 55%, rgb(13 20 64 / 0.20) 100%)'
