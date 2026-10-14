export interface SewaImageInfo {
  src: string
  alt: string
  badge: string
  badgeColor: string
}

/**
 * Direct mapping for the 8 Fodder sewas to the user's specific photos in public/images/
 * 1. grass   -> /images/grass.png   (Green Grass)
 * 2. dry     -> /images/dry.png     (Dry Fodder)
 * 3. Gud     -> /images/gud.png     (Gud / Jaggery)
 * 4. oilcake -> /images/oilcake.png (Khal / Oil Cake)
 * 5. barn    -> /images/barn.png    (Chokar / Wheat Bran)
 * 6. husk    -> /images/husk.png    (Husk)
 * 7. chana   -> /images/chana.png   (Channa Churi)
 * 8. sponser -> /images/sponser.png (Sponsor a Day's Feed)
 */
export const FODDER_IMAGES: Record<string, SewaImageInfo> = {
  'gau-green-grass': {
    src: '/images/grass.png',
    alt: 'Cows feeding on fresh green napier grass at gaushala',
    badge: 'Green Grass',
    badgeColor: 'bg-emerald-600/90 text-white',
  },
  'gau-dry-fodder': {
    src: '/images/dry.png',
    alt: 'White cow feeding on golden dry fodder straw at gaushala',
    badge: 'Dry Fodder',
    badgeColor: 'bg-amber-600/90 text-white',
  },
  'gau-gud': {
    src: '/images/gud.png',
    alt: 'Cow enjoying golden jaggery gud cubes in feeding trough',
    badge: 'Gud (Jaggery)',
    badgeColor: 'bg-amber-700/90 text-white',
  },
  'gau-khal': {
    src: '/images/oilcake.png',
    alt: 'Cow eating nutrient-rich oil cake protein feed',
    badge: 'Oil Cake',
    badgeColor: 'bg-stone-700/90 text-white',
  },
  'gau-chokar': {
    src: '/images/barn.png',
    alt: 'Cow feeding on wholesome chokar wheat bran in sunlit barn',
    badge: 'Wheat Bran',
    badgeColor: 'bg-amber-800/90 text-white',
  },
  'gau-husk': {
    src: '/images/husk.png',
    alt: 'White cow enjoying fresh paddy husk feed in the trough',
    badge: 'Paddy Husk',
    badgeColor: 'bg-amber-600/90 text-white',
  },
  'gau-channa-churi': {
    src: '/images/chana.png',
    alt: 'Cow enjoying nutritious chana churi split gram feed',
    badge: 'Channa Churi',
    badgeColor: 'bg-orange-700/90 text-white',
  },
  'gau-feed-a-day': {
    src: '/images/sponser.png',
    alt: 'Devotee feeding fresh green fodder, sponsoring a full day meal for the herd',
    badge: "Full Day's Feed",
    badgeColor: 'bg-emerald-700/90 text-white',
  },
  'gau-grass-daily': {
    src: '/images/grass.png',
    alt: 'Daily fresh grass sponsorship for cows',
    badge: 'Gau Grass Daily',
    badgeColor: 'bg-emerald-600/90 text-white',
  },
  'gau-grass-yearly': {
    src: '/images/grass.png',
    alt: 'Yearly green grass sponsorship for cows',
    badge: 'Gau Grass Yearly',
    badgeColor: 'bg-emerald-600/90 text-white',
  },
}

export const CATEGORY_DEFAULT_IMAGES: Record<string, SewaImageInfo> = {
  fodder: {
    src: '/images/grass.png',
    alt: 'Fresh green fodder for gaushala cattle',
    badge: 'Fodder',
    badgeColor: 'bg-emerald-600/90 text-white',
  },
  medical: {
    src: '/images/sewa-medical.webp',
    alt: 'Veterinarian treating cows and providing medicine in gaushala',
    badge: 'Medical',
    badgeColor: 'bg-rose-700/90 text-white',
  },
  infrastructure: {
    src: '/images/sewa-infrastructure.webp',
    alt: 'Spacious shelter shed with feeding troughs and water tank',
    badge: 'Infrastructure',
    badgeColor: 'bg-amber-600/90 text-white',
  },
  cow_care: {
    src: '/images/sewa-cow-care.webp',
    alt: 'Caretaker grooming and caring for sacred cow in gaushala',
    badge: 'Cow Care',
    badgeColor: 'bg-navy-700/90 text-white',
  },
  general: {
    src: '/images/sevalaya-gaushala.webp',
    alt: 'Devotees feeding fresh green fodder to cattle at gaushala',
    badge: 'General',
    badgeColor: 'bg-navy-800/90 text-white',
  },
  occasion: {
    src: '/images/sewa-cow-care.webp',
    alt: 'Special occasion pooja and green fodder feeding for cows',
    badge: 'Occasion',
    badgeColor: 'bg-kumkum-700/90 text-white',
  },
}

export const ITEM_SPECIFIC_IMAGES: Record<string, SewaImageInfo> = {
  ...FODDER_IMAGES,
  'gau-care-calf': {
    src: '/images/cow-02.webp',
    alt: 'Young calf receiving special feed and care in gaushala',
    badge: 'Calf Care',
    badgeColor: 'bg-navy-700/90 text-white',
  },
  'gau-care-bull': {
    src: '/images/cow-06.webp',
    alt: 'Cared-for bull in the gaushala shelter',
    badge: 'Bull Care',
    badgeColor: 'bg-navy-700/90 text-white',
  },
}

export function getSewaImage(sewa: { id: string; gaushalaCategory?: string }): SewaImageInfo {
  if (ITEM_SPECIFIC_IMAGES[sewa.id]) {
    return ITEM_SPECIFIC_IMAGES[sewa.id]
  }
  if (sewa.gaushalaCategory && CATEGORY_DEFAULT_IMAGES[sewa.gaushalaCategory]) {
    return CATEGORY_DEFAULT_IMAGES[sewa.gaushalaCategory]
  }
  return CATEGORY_DEFAULT_IMAGES.fodder
}
