/** Where each photograph lives, with the alt text it should always carry. */
export const PHOTOS = {
  temple: {
    src: '/images/temple-gopuram.webp',
    alt: 'A South Indian temple gopuram at dusk, with rows of oil lamps lit along the steps.',
  },
  sevalaya: {
    src: '/images/Temple Annadhanam.png',
    alt: 'Annadhanam being served on banana leaves to a long row of seated guests.',
  },
  sangam: {
    src: '/images/tamil heritage.png',
    alt: 'Tamil Heritage, arts, literature and cultural traditions.',
  },
  gaushala: {
    src: '/images/sevalaya-gaushala.webp',
    alt: 'Volunteers laying green fodder on banana leaves along a long trough while a row of cows feeds from it.',
  },
  events: {
    src: '/images/events-diya.webp',
    alt: 'A glowing brass deepam with fresh jasmine flower garlands, lit for temple and community festival events.',
  },
  sewaFodder: {
    src: '/images/sewa-fodder.webp',
    alt: 'Fresh green napier grass bundles and golden straw for feeding gaushala cattle.',
  },
  sewaMedical: {
    src: '/images/sewa-medical.webp',
    alt: 'Veterinarian treating cows and providing medicine in gaushala.',
  },
  sewaInfrastructure: {
    src: '/images/cowshed.png',
    alt: 'Spacious shelter shed with feeding troughs and water tank in gaushala.',
  },
  sewaCowCare: {
    src: '/images/cow.png',
    alt: 'Caretaker grooming and caring for sacred cow in gaushala.',
  },
  project: {
    src: '/images/project-rajagopuram.webp',
    alt: 'A temple gopuram under restoration, wrapped in bamboo scaffolding.',
  },

  /**
   * The herd, cut from the shelter photograph so each animal on the Our Cows
   * page has a face. They are real cows at a real gaushala standing in for the
   * demo's named animals, so the alt text describes the animal rather than
   * claiming it is any particular one.
   */
  cow1: {
    src: '/images/cow-01.webp',
    alt: 'A tan cow in a rope halter, head down over fresh green fodder.',
  },
  cow2: {
    src: '/images/cow-02.webp',
    alt: 'A white cow with short grey horns and a pink inner ear, facing the camera.',
  },
  cow3: {
    src: '/images/cow-03.webp',
    alt: 'A tan cow with a white blaze on her forehead and one curved horn.',
  },
  cow4: {
    src: '/images/cow-04.webp',
    alt: 'A white cow in profile, feeding along the trough.',
  },
  cow5: {
    src: '/images/cow-05.webp',
    alt: 'Dark-faced cows in a row at the feeding trough.',
  },
  cow6: {
    src: '/images/cow-06.webp',
    alt: 'A white cow at the rail with a brown cow standing behind her.',
  },
} as const

/** The six herd portraits, in the order the `portrait` index selects them. */
export const COW_PHOTOS = ['cow1', 'cow2', 'cow3', 'cow4', 'cow5', 'cow6'] as const

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
