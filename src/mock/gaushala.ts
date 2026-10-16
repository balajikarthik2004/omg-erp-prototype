import { addDays, subDays, subMonths } from 'date-fns'

import { APP } from '@/config'
import { convert, currencyForCountry, fxRate } from '@/lib/currency'
import { createRng, SEED } from '@/lib/rng'
import { makeProgramsSeed } from './gaushalaPrograms'
import type {
  CatalogItem,
  Cow,
  CowHealthRecord,
  Donation,
  DonationLine,
  Donor,
  GalleryItem,
  GaushalaData,
  GaushalaEntity,
  GaushalaExpense,
  GaushalaSewaCategory,
  GaushalaSewaCategoryMeta,
  PaymentMethod,
  ReceiptTemplate,
  Rescue,
  SewaOrder,
} from '@/types'
import { DONOR_FIRST, DONOR_LAST } from './seed'

/* ------------------------------------------------------------- categories */

export const SEWA_CATEGORIES: GaushalaSewaCategoryMeta[] = [
  {
    id: 'fodder',
    label: 'Fodder',
    tamil: 'தீவனம்',
    blurb: 'Green grass, dry fodder, gud, khal, chokar and channa churi. What the herd eats today.',
  },
  {
    id: 'cow_care',
    label: 'Cow Care',
    tamil: 'பசு பராமரிப்பு',
    blurb: 'A month of everything one cow, calf or bull needs — feed, bedding, a caretaker and a vet on call.',
  },
  {
    id: 'medical',
    label: 'Medical',
    tamil: 'மருத்துவம்',
    blurb: 'Medicines, vaccination, treatment and surgery for an animal that arrived hurt.',
  },
  {
    id: 'infrastructure',
    label: 'Infrastructure',
    tamil: 'கட்டமைப்பு',
    blurb: 'Sheds, water tanks and repairs. Larger works, built from many gifts.',
  },
]

export const SEWA_CATEGORY_LABEL: Record<GaushalaSewaCategory, string> = Object.fromEntries(
  SEWA_CATEGORIES.map((c) => [c.id, c.label]),
) as Record<GaushalaSewaCategory, string>

/* ------------------------------------------------------------- the sewas */

/**
 * Gaushala sewas are ordinary catalog items carrying `gaushala: true`, so the
 * cart, checkout, receipt and ledger take them unchanged. They live in their
 * own array and never enter `CATALOG`, which is what keeps the Seva page
 * exactly as it was.
 *
 * `category` is the accounting category the ledger and the console charts
 * already understand. `gaushalaCategory` is what the public page tabs on.
 */
export const GAUSHALA_SEWAS: CatalogItem[] = [
  /* ---- Fodder ---- */
  {
    id: 'gau-green-grass', sectorId: 'sevalaya', category: 'activity', gaushala: true, gaushalaCategory: 'fodder',
    name: 'Green Grass', tamil: 'பச்சைப் புல்', unit: 'per 50 kg bundle',
    description: 'A 50 kg bundle of fresh green fodder, cut the same morning. The herd goes through nine of these a day.',
    price: 900, presets: [900, 2700, 5400, 9000], prices: { INR: 75_000, GBP: 700 },
    fundId: 'fund-gau-fodder', active: true, popular: true,
  },
  {
    id: 'gau-dry-fodder', sectorId: 'sevalaya', category: 'activity', gaushala: true, gaushalaCategory: 'fodder',
    name: 'Dry Fodder', tamil: 'உலர் தீவனம்', unit: 'per 100 kg',
    description: 'Straw and dried stalk, the base of every meal. Stored against the months when green is scarce.',
    price: 1400, presets: [1400, 4200, 8400], prices: { INR: 120_000 },
    fundId: 'fund-gau-fodder', active: true,
  },
  {
    id: 'gau-gud', sectorId: 'sevalaya', category: 'activity', gaushala: true, gaushalaCategory: 'fodder',
    name: 'Gud (Jaggery)', tamil: 'வெல்லம்', unit: 'per 10 kg',
    description: 'Jaggery mixed into the evening feed. Warmth for an old cow and a recovering one.',
    price: 1100, presets: [1100, 3300, 6600], fundId: 'fund-gau-fodder', active: true,
  },
  {
    id: 'gau-khal', sectorId: 'sevalaya', category: 'activity', gaushala: true, gaushalaCategory: 'fodder',
    name: 'Khal (Oil Cake)', unit: 'per 40 kg sack',
    description: 'Cotton-seed cake. Protein for the milking cows and for any animal being brought back to weight.',
    price: 2200, presets: [2200, 6600, 11_000], fundId: 'fund-gau-fodder', active: true, popular: true,
  },
  {
    id: 'gau-chokar', sectorId: 'sevalaya', category: 'activity', gaushala: true, gaushalaCategory: 'fodder',
    name: 'Chokar (Wheat Bran)', unit: 'per 40 kg sack',
    description: 'Bran stirred through the mash. Easy on the stomach, and the first feed a rescued cow is given.',
    price: 1600, presets: [1600, 4800, 9600], fundId: 'fund-gau-fodder', active: true,
  },
  {
    id: 'gau-husk', sectorId: 'sevalaya', category: 'activity', gaushala: true, gaushalaCategory: 'fodder',
    name: 'Husk', unit: 'per 50 kg',
    description: 'Paddy husk for bedding and bulk feed. Replaced in every shed twice a week.',
    price: 800, presets: [800, 2400, 4800], fundId: 'fund-gau-fodder', active: true,
  },
  {
    id: 'gau-channa-churi', sectorId: 'sevalaya', category: 'activity', gaushala: true, gaushalaCategory: 'fodder',
    name: 'Channa Churi', unit: 'per 25 kg',
    description: 'Split gram husk, the treat at the end of the day. The calves know the sound of the sack.',
    price: 1800, presets: [1800, 5400, 10_800], fundId: 'fund-gau-fodder', active: true,
  },
  {
    id: 'gau-feed-a-day', sectorId: 'sevalaya', category: 'pooja', gaushala: true, gaushalaCategory: 'fodder',
    name: "Sponsor a Day's Feed", tamil: 'ஒரு நாள் தீவனம்', unit: 'for the whole herd, one day',
    description: 'Every animal in the shelter fed for one full day, on a date you pick, in your family name.',
    price: 21_100, needsDedication: true, needsDate: true, prices: { INR: 1_800_000 },
    fundId: 'fund-gau-fodder', active: true, popular: true,
  },

  /* ---- Cow care ---- */
  {
    id: 'gau-care-cow', sectorId: 'sevalaya', category: 'activity', gaushala: true, gaushalaCategory: 'cow_care',
    name: 'Monthly Care of a Cow', tamil: 'ஒரு பசுவின் மாதப் பராமரிப்பு', unit: 'a month',
    description: 'Feed, bedding, minerals, a caretaker and a vet on call, for one cow, for one month.',
    price: 6500, presets: [6500, 19_500, 78_000], prices: { INR: 550_000 },
    fundId: 'fund-gau-care', active: true, popular: true,
  },
  {
    id: 'gau-care-calf', sectorId: 'sevalaya', category: 'activity', gaushala: true, gaushalaCategory: 'cow_care',
    name: 'Monthly Care of a Calf', tamil: 'கன்றுக்குட்டி பராமரிப்பு', unit: 'a month',
    description: 'Milk, soft feed and a warm corner of the shed for one calf, for one month.',
    price: 4200, presets: [4200, 12_600, 50_400], fundId: 'fund-gau-care', active: true,
  },
  {
    id: 'gau-care-bull', sectorId: 'sevalaya', category: 'activity', gaushala: true, gaushalaCategory: 'cow_care',
    name: 'Monthly Care of a Bull', unit: 'a month',
    description: 'A bull eats nearly twice what a cow does, and almost nobody sponsors one. This is the gap.',
    price: 8800, presets: [8800, 26_400, 105_600], fundId: 'fund-gau-care', active: true,
  },

  /* ---- Medical ---- */
  {
    id: 'gau-medicines', sectorId: 'sevalaya', category: 'activity', gaushala: true, gaushalaCategory: 'medical',
    name: 'Medicines', tamil: 'மருந்துகள்',
    description: 'The shelter pharmacy: antibiotics, wound dressing, calcium and the ordinary daily medicines.',
    price: 3500, presets: [3500, 10_500, 21_000], fundId: 'fund-gau-med', active: true,
  },
  {
    id: 'gau-vaccination', sectorId: 'sevalaya', category: 'activity', gaushala: true, gaushalaCategory: 'medical',
    name: 'Vaccination', tamil: 'தடுப்பூசி', unit: 'per animal',
    description: 'Foot-and-mouth and haemorrhagic septicaemia cover for one animal, logged against its record.',
    price: 2400, presets: [2400, 12_000, 24_000], fundId: 'fund-gau-med', active: true, popular: true,
  },
  {
    id: 'gau-surgery', sectorId: 'sevalaya', category: 'activity', gaushala: true, gaushalaCategory: 'medical',
    name: 'Surgery',
    description: 'Most of our surgeries remove swallowed plastic and wire. It is the commonest injury we see.',
    price: 45_000, presets: [45_000, 90_000], fundId: 'fund-gau-med', active: true,
  },
  {
    id: 'gau-tonic', sectorId: 'sevalaya', category: 'activity', gaushala: true, gaushalaCategory: 'medical',
    name: 'Health Tonic', unit: 'per month, per animal',
    description: 'Mineral mixture and liver tonic for an animal still underweight after treatment.',
    price: 1900, presets: [1900, 5700, 11_400], fundId: 'fund-gau-med', active: true,
  },

  /* ---- Infrastructure ---- */
  {
    id: 'gau-shed', sectorId: 'sevalaya', category: 'project', gaushala: true, gaushalaCategory: 'infrastructure',
    name: 'New Shelter Shed', tamil: 'கொட்டகை',
    description: 'A roofed, open-sided shed for twelve animals: pillars, sheet roof, drainage and a feeding trough.',
    price: null, presets: [25_100, 50_100, 100_100, 250_100], fundId: 'fund-gau-infra', active: true,
  },
  {
    id: 'gau-water-tank', sectorId: 'sevalaya', category: 'project', gaushala: true, gaushalaCategory: 'infrastructure',
    name: 'Water Tank', tamil: 'நீர்த் தொட்டி',
    description: 'A 10,000-litre tank and the line that runs from it to every trough in the yard.',
    price: null, presets: [10_100, 25_100, 50_100], fundId: 'fund-gau-infra', active: true,
  },
  {
    id: 'gau-shelter-repair', sectorId: 'sevalaya', category: 'project', gaushala: true, gaushalaCategory: 'infrastructure',
    name: 'Shelter Repair',
    description: 'Roof sheets after the monsoon, floor levelling and fencing. Unglamorous, and always needed.',
    price: null, presets: [5100, 15_100, 30_100], fundId: 'fund-gau-infra', active: true,
  },
  {
    id: 'gau-grass-daily', sectorId: 'sevalaya', category: 'membership', gaushala: true, gaushalaCategory: 'fodder',
    name: 'Gau Grass — a dollar a day', tamil: 'கோ கிராஸ்', unit: 'a month, renewing',
    description: 'Thirty dollars a month, renewing. It buys the green fodder for one cow, every single day.',
    price: 3000, recurring: 'monthly', prices: { INR: 250_000 },
    fundId: 'fund-gau-fodder', active: true, popular: true,
  },
  {
    id: 'gau-grass-yearly', sectorId: 'sevalaya', category: 'membership', gaushala: true, gaushalaCategory: 'fodder',
    name: 'Gau Grass — yearly', unit: 'a year, renewing',
    description: 'The same sewa taken for a full year, and the shelter can plan its fodder buying against it.',
    price: 33_000, recurring: 'annual', fundId: 'fund-gau-fodder', active: true,
  },
]

export function gaushalaSewaById(id: string): CatalogItem | undefined {
  return GAUSHALA_SEWAS.find((s) => s.id === id)
}

/* ------------------------------------------------------ entity & receipts */

/**
 * The legal entity is not decided yet, so two are configured and the console
 * can switch which one is default. Nothing in the code assumes a country.
 */
export const GAUSHALA_ENTITIES: GaushalaEntity[] = [
  {
    id: 'ent-us',
    name: 'OMG Gaushala Foundation Inc.',
    country: 'US',
    settlementCurrency: 'USD',
    gateways: ['stripe', 'paypal'],
    registrationNumbers: [
      { label: 'EIN', value: '88-4417206' },
      { label: 'State of incorporation', value: 'New Jersey' },
    ],
    address: '18 Oak Tree Road, Edison, NJ 08820, United States',
    isDefault: true,
  },
  {
    id: 'ent-in',
    name: 'OMG Goshala Trust',
    country: 'IN',
    settlementCurrency: 'INR',
    gateways: ['razorpay', 'payu', 'stripe'],
    registrationNumbers: [
      { label: 'Trust registration', value: 'TN/1142/2019' },
      { label: 'PAN', value: 'AABTO4417P' },
      { label: '80G', value: 'AABTO4417PF2024' },
      { label: 'FCRA', value: '075901142' },
    ],
    address: 'Thiruparankundram Road, Madurai 625005, Tamil Nadu, India',
  },
]

export const RECEIPT_TEMPLATES: ReceiptTemplate[] = [
  {
    id: 'rt-us-501c3',
    name: 'US 501(c)(3) receipt',
    entityId: 'ent-us',
    donorCountries: ['US'],
    declaration:
      'OMG Gaushala Foundation Inc. is a tax-exempt organisation under section 501(c)(3) of the Internal Revenue Code. No goods or services were provided in exchange for this contribution.',
    fields: [{ label: 'EIN', value: '88-4417206' }],
    collectsDonorTaxId: false,
    reviewed: false,
  },
  {
    id: 'rt-in-80g',
    name: 'India 80G receipt',
    entityId: 'ent-in',
    donorCountries: ['IN'],
    declaration:
      'Donations to OMG Goshala Trust are eligible for deduction under section 80G(5)(vi) of the Income Tax Act, 1961. Please quote your PAN to claim the deduction.',
    fields: [
      { label: '80G registration', value: 'AABTO4417PF2024' },
      { label: 'PAN of the trust', value: 'AABTO4417P' },
    ],
    collectsDonorTaxId: true,
    reviewed: false,
  },
  {
    id: 'rt-generic',
    name: 'International acknowledgement',
    entityId: 'ent-us',
    donorCountries: ['*'],
    declaration:
      'Thank you for your gift to the Gaushala. This acknowledgement is not a tax document in your country. Please ask us if you need one issued under a local entity.',
    fields: [],
    collectsDonorTaxId: false,
    reviewed: true,
  },
]

/** The receipt wording a donor in this country gets, for this entity. */
export function receiptTemplateFor(country: string | undefined, entityId?: string): ReceiptTemplate {
  const code = (country ?? '').toUpperCase()
  const exact = RECEIPT_TEMPLATES.find(
    (t) => t.donorCountries.includes(code) && (!entityId || t.entityId === entityId),
  )
  return exact ?? RECEIPT_TEMPLATES.find((t) => t.donorCountries.includes('*'))!
}

export function defaultEntity(): GaushalaEntity {
  return GAUSHALA_ENTITIES.find((e) => e.isDefault) ?? GAUSHALA_ENTITIES[0]!
}

/* -------------------------------------------------------------- the herd */

interface CowSpec {
  name: string
  tamil?: string
  kind: Cow['kind']
  breed: string
  ageYears: number
  status: Cow['status']
  story: string
  rescuedMonthsAgo: number
  milkYield?: number
  healthNote?: string
  image?: string
}

const CARETAKERS = ['u-gau-care', 'u-gau-care2', 'u-store']

const HERD: CowSpec[] = [
  {
    name: 'Lakshmi', tamil: 'லட்சுமி', kind: 'cow', breed: 'Kangayam', ageYears: 9, status: 'adopted',
    story: 'Walked into the yard on her own during the 2023 floods and has never shown the slightest wish to leave. She decides when the morning feed begins.',
    rescuedMonthsAgo: 29, milkYield: 6.5,
  },
  {
    name: 'Gomathi', tamil: 'கோமதி', kind: 'cow', breed: 'Gir', ageYears: 7, status: 'adoptable',
    story: 'Surrendered by a family who could no longer feed her. She was eleven days off her feed when she arrived and took four months to come back.',
    rescuedMonthsAgo: 22, milkYield: 8.2,
  },
  {
    name: 'Nandini', tamil: 'நந்தினி', kind: 'cow', breed: 'Sahiwal', ageYears: 5, status: 'adopted',
    story: 'Bought at a cattle market an hour before she would have been loaded for slaughter. She is the gentlest animal here with children.',
    rescuedMonthsAgo: 17, milkYield: 9.4,
  },
  {
    name: 'Kamadhenu', tamil: 'காமதேனு', kind: 'cow', breed: 'Tharparkar', ageYears: 11, status: 'adoptable',
    story: 'Retired from milking long before she came to us. She spends the afternoons under the neem tree and will not be moved from it.',
    rescuedMonthsAgo: 34,
  },
  {
    name: 'Ponni', tamil: 'பொன்னி', kind: 'cow', breed: 'Kangayam', ageYears: 6, status: 'sick',
    story: 'Found beside the highway with a wire injury to her left foreleg. The leg is healing but she still favours it.',
    rescuedMonthsAgo: 3, healthNote: 'Wire injury, left foreleg. Dressing changed every third day.',
  },
  {
    name: 'Thenmozhi', tamil: 'தென்மொழி', kind: 'cow', breed: 'Vechur', ageYears: 4, status: 'adoptable',
    story: 'A small Vechur cow, barely waist-high, who came with a calf at foot. The two are never more than ten feet apart.',
    rescuedMonthsAgo: 13, milkYield: 3.1,
  },
  {
    name: 'Arasi', tamil: 'அரசி', kind: 'cow', breed: 'Ongole', ageYears: 8, status: 'recovering',
    story: 'Three kilos of plastic came out of her first stomach. She is eating properly again, which took eleven weeks.',
    rescuedMonthsAgo: 6, healthNote: 'Post-surgical. Soft feed only until the next review.',
  },
  {
    name: 'Chinnu', tamil: 'சின்னு', kind: 'calf', breed: 'Kangayam', ageYears: 1, status: 'adoptable',
    story: 'Thenmozhi’s calf, born in the shelter in the first week of the monsoon. The first animal here born rather than rescued.',
    rescuedMonthsAgo: 11,
  },
  {
    name: 'Muthu', tamil: 'முத்து', kind: 'calf', breed: 'Gir', ageYears: 1, status: 'adoptable',
    story: 'Arrived at three weeks old, too weak to stand. Hand-fed for a month by the night caretaker, who still calls him by a different name.',
    rescuedMonthsAgo: 9,
  },
  {
    name: 'Karuppu', tamil: 'கருப்பு', kind: 'bull', breed: 'Kangayam', ageYears: 6, status: 'adoptable',
    story: 'A working bull whose owner could no longer keep him once the fields were sold. Bulls are the hardest animals to find sponsors for.',
    rescuedMonthsAgo: 19,
  },
  {
    name: 'Sivappu', kind: 'bull', breed: 'Ongole', ageYears: 4, status: 'adoptable',
    story: 'Came in with Karuppu from the same village. The two still graze together at the far end of the field.',
    rescuedMonthsAgo: 19,
  },
  {
    name: 'Valli', tamil: 'வள்ளி', kind: 'cow', breed: 'Sahiwal', ageYears: 10, status: 'adopted',
    story: 'Blind in one eye from an untreated infection before she arrived. She navigates the whole yard by sound and has never once walked into anything.',
    rescuedMonthsAgo: 26, milkYield: 4.8,
  },
  {
    name: 'Meenakshi', tamil: 'மீனாட்சி', kind: 'cow', breed: 'Gir', ageYears: 6, status: 'adoptable',
    story: 'Rescued from a transport lorry stopped at the district border. Nineteen animals were on it. Six came here.',
    rescuedMonthsAgo: 8, milkYield: 7.7,
  },
  {
    name: 'Selvi', tamil: 'செல்வி', kind: 'cow', breed: 'Kangayam', ageYears: 12, status: 'adoptable',
    story: 'The oldest cow in the shelter. She came with the first six animals, on the day the gate was first opened.',
    rescuedMonthsAgo: 41,
  },
  {
    name: 'Kannan', tamil: 'கண்ணன்', kind: 'calf', breed: 'Vechur', ageYears: 1, status: 'adoptable',
    story: 'Orphaned at ten days. Raised on bottle milk by the whole shelter, which is why he follows people rather than cows.',
    rescuedMonthsAgo: 7,
  },
  {
    name: 'Rajan', kind: 'ox', breed: 'Tharparkar', ageYears: 14, status: 'adoptable',
    story: 'Worked a cart for eleven years. His owner brought him here himself rather than sell him on, and still visits.',
    rescuedMonthsAgo: 15,
  },
]

const MONTHLY_CARE: Record<Cow['kind'], number> = { cow: 6500, calf: 4200, bull: 8800, ox: 8800 }

/* ---------------------------------------------------------------- seeding */

export interface GaushalaSeed {
  data: GaushalaData
  /** Pushed into the main donations array, so this money flows like any other. */
  donations: Donation[]
}

export function makeGaushalaSeed(now: Date, donors: Donor[], startSequence: number): GaushalaSeed {
  const rng = createRng(SEED + 23)
  const iso = (d: Date) => d.toISOString()

  /* ---- cows ---- */
  const cows: Cow[] = HERD.map((spec, i) => ({
    id: `cow-${String(i + 1).padStart(3, '0')}`,
    name: spec.name,
    tamil: spec.tamil,
    kind: spec.kind,
    breed: spec.breed,
    gender: spec.kind === 'cow' ? 'female' : spec.kind === 'calf' ? (i % 2 === 0 ? 'male' : 'female') : 'male',
    ageYears: spec.ageYears,
    status: spec.status,
    story: spec.story,
    rescuedAt: iso(subMonths(now, spec.rescuedMonthsAgo)),
    caretakerId: CARETAKERS[i % CARETAKERS.length]!,
    portrait: i % 6,
    image: spec.image ?? `/images/cows/${spec.name}.png`,
    milkYield: spec.milkYield,
    healthNote: spec.healthNote,
    monthlyCare: MONTHLY_CARE[spec.kind],
    adoptedBy:
      spec.status === 'adopted'
        ? `${DONOR_FIRST[(i * 5) % DONOR_FIRST.length]} ${DONOR_LAST[(i * 3) % DONOR_LAST.length]}`
        : undefined,
    adoptionEndsAt: spec.status === 'adopted' ? iso(addDays(now, 40 + i * 11)) : undefined,
  }))

  /* ---- health records ---- */
  const HEALTH_NOTES: { kind: CowHealthRecord['kind']; note: string; cost: number }[] = [
    { kind: 'vaccination', note: 'Foot-and-mouth booster, annual round.', cost: 2400 },
    { kind: 'deworming', note: 'Routine deworming, whole-shed round.', cost: 900 },
    { kind: 'checkup', note: 'Quarterly weight and condition scoring. Within range.', cost: 600 },
    { kind: 'treatment', note: 'Mastitis, left quarter. Seven-day course, responded well.', cost: 4800 },
    { kind: 'checkup', note: 'Hoof trimming and inspection. No lameness found.', cost: 800 },
    { kind: 'vaccination', note: 'Haemorrhagic septicaemia, pre-monsoon round.', cost: 1800 },
  ]
  const VETS = ['Dr. S. Rajalakshmi', 'Dr. P. Anand', 'Dr. M. Kavitha']

  const cowHealth: CowHealthRecord[] = []
  cows.forEach((cow, ci) => {
    const count = 3 + Math.floor(rng.next() * 3)
    for (let n = 0; n < count; n++) {
      const spec = HEALTH_NOTES[(ci + n) % HEALTH_NOTES.length]!
      const at = subDays(now, 20 + n * 70 + Math.floor(rng.next() * 25))
      cowHealth.push({
        id: `chr-${cow.id}-${n + 1}`,
        cowId: cow.id,
        at: iso(at),
        kind: spec.kind,
        note: spec.note,
        vet: VETS[(ci + n) % VETS.length]!,
        cost: spec.cost,
        nextDueAt: spec.kind === 'vaccination' ? iso(addDays(at, 365)) : undefined,
      })
    }
    if (cow.status === 'sick' || cow.status === 'recovering') {
      cowHealth.push({
        id: `chr-${cow.id}-acute`,
        cowId: cow.id,
        at: iso(subDays(now, 9)),
        kind: cow.status === 'sick' ? 'treatment' : 'surgery',
        note: cow.healthNote ?? 'Under active treatment.',
        vet: VETS[ci % VETS.length]!,
        cost: cow.status === 'sick' ? 12_500 : 45_000,
        nextDueAt: iso(addDays(now, 4)),
      })
    }
  })
  cowHealth.sort((a, b) => b.at.localeCompare(a.at))

  /* ---- donations, then the sewa orders they paid for ----

     The Gaushala takes money exactly the way the rest of the site does: a
     donation is recorded, the Square webhook makes it Paid, a receipt number
     is issued and the journal posts to the fund. These are generated here
     rather than in makeDonations only because each one has to be paired with
     the sewa order it bought. They are pushed into the same donations array,
     so payouts, fund balances, the ledger and reconciliation pick them up
     with no special handling at all.
  */

  // Where a donor is, from the city already on their record. It decides the
  // currency they were shown and which receipt wording they got.
  const COUNTRY_BY_CITY: Record<string, string> = {
    Madurai: 'IN', Chennai: 'IN', Coimbatore: 'IN', Trichy: 'IN', Salem: 'IN',
    Tirunelveli: 'IN', Thanjavur: 'IN', Erode: 'IN',
    'Edison NJ': 'US', 'Fremont CA': 'US', 'Plano TX': 'US',
    Toronto: 'CA', Singapore: 'SG', 'Kuala Lumpur': 'MY', London: 'GB', Sydney: 'AU',
  }

  const OCCASIONS = ['Birthday', 'Wedding anniversary', 'Remembrance', 'Pitru Paksha', 'Gopashtami']
  const GOTRAS = ['Bharadwaj', 'Kashyap', 'Vasishta', 'Atri', 'Kaundinya', 'Srivatsa']
  const NAKSHATRAS = ['Ashwini', 'Rohini', 'Thiruvathirai', 'Pooyam', 'Magam', 'Chithirai', 'Anusham', 'Revathi']

  /** The processing cut, by the same formula the rest of the app uses. */
  const cardFee = (gross: number) => Math.round(gross * APP.fee.percent) + APP.fee.fixedCents

  // What people actually give a cow shelter: fodder most days, then care.
  const SEWA_WEIGHT: [GaushalaSewaCategory, number][] = [
    ['fodder', 55],
    ['cow_care', 26],
    ['medical', 15],
    ['infrastructure', 4],
  ]

  /** Only these are things a caretaker physically carries out. */
  const FULFILLABLE: GaushalaSewaCategory[] = ['fodder', 'cow_care', 'medical']

  const liveSewas = GAUSHALA_SEWAS.filter((item) => item.active)
  const donations: Donation[] = []
  const sewaOrders: SewaOrder[] = []
  let sequence = startSequence
  let receiptSeq = 1040
  let orderSeq = 1

  for (let m = 11; m >= 0; m--) {
    const monthStart = new Date(now.getFullYear(), now.getMonth() - m, 1)
    const isCurrent = m === 0
    const lastDay = isCurrent
      ? now.getDate()
      : new Date(monthStart.getFullYear(), monthStart.getMonth() + 1, 0).getDate()

    // Gopashtami and Makar Sankranti lift the month, the way the festival
    // months lift the temple figures.
    const festive = monthStart.getMonth() === 10 || monthStart.getMonth() === 0
    const target = Math.round((festive ? 40 : 27) * (isCurrent ? Math.max(0.3, lastDay / 30) : 1))

    for (let i = 0; i < target; i++) {
      const date = new Date(monthStart.getFullYear(), monthStart.getMonth(), rng.int(1, lastDay))
      date.setHours(rng.int(6, 22), rng.int(0, 59), rng.int(0, 59), 0)
      if (date.getTime() > now.getTime()) continue

      const wanted = rng.weighted(SEWA_WEIGHT)
      const pool = liveSewas.filter((item) => item.gaushalaCategory === wanted)
      const sewa = pool.length > 0 ? rng.pick(pool) : rng.pick(liveSewas)
      const amount = sewa.price ?? rng.pick(sewa.presets ?? [5100])

      const donor = rng.pick(donors)
      const donorCountry = COUNTRY_BY_CITY[donor.city] ?? 'US'
      const donorCurrency = currencyForCountry(donorCountry)
      const entity = defaultEntity()
      const template = receiptTemplateFor(donorCountry, entity.id)

      // Someone standing in the yard pays cash; everyone else is online.
      const local = donorCountry === 'IN'
      const method: PaymentMethod = rng.weighted(
        (local
          ? [['card', 38], ['cash', 34], ['apple_pay', 14], ['google_pay', 10], ['cheque', 4]]
          : [['card', 54], ['apple_pay', 26], ['google_pay', 12], ['cheque', 5], ['cash', 3]]) as [PaymentMethod, number][],
      )
      const isCardType = method === 'card' || method === 'apple_pay' || method === 'google_pay'
      const fee = isCardType ? cardFee(amount) : 0

      const ageDays = Math.floor((now.getTime() - date.getTime()) / 86_400_000)
      let status: Donation['status'] = ageDays > 20 ? 'reconciled' : 'receipted'
      if (ageDays > 60 && rng.chance(0.5)) status = 'allotted'

      const line: DonationLine = { itemId: sewa.id, category: sewa.category, amount }
      if (sewa.recurring) line.recurring = sewa.recurring
      if (sewa.needsDedication) {
        line.dedication = {
          name: donor.anonymous ? 'Anonymous devotee' : donor.name,
          nakshatra: rng.pick(NAKSHATRAS),
          gothram: rng.chance(0.7) ? rng.pick(GOTRAS) : undefined,
          date: iso(addDays(date, rng.int(1, 14))).slice(0, 10),
        }
      }

      receiptSeq += 1
      const year = date.getFullYear()
      const squarePaymentId = isCardType
        ? `sqpmt_${Math.floor(rng.next() * 1e9).toString(36).toUpperCase().padStart(7, '0')}`
        : undefined

      const donation: Donation = {
        id: `DN-${year}-${String(sequence++).padStart(6, '0')}`,
        // The shelter keeps its own receipt book, so a Gaushala receipt can
        // never collide with a Sevalaya one.
        receiptNo: `RCP-GAU-${String(year).slice(2)}-${String(receiptSeq).padStart(5, '0')}`,
        sectorId: 'sevalaya',
        donorId: donor.id,
        lines: [line],
        gross: amount,
        fee,
        net: amount - fee,
        method,
        status,
        createdAt: iso(date),
        squarePaymentId,
        fundId: sewa.fundId,
        webhookAt: isCardType ? iso(new Date(date.getTime() + 4_000)) : undefined,
        donorCurrency,
        fxRate: fxRate(donorCurrency),
        displayGross: sewa.prices?.[donorCurrency] ?? convert(amount, donorCurrency),
        donorCountry,
        entityId: entity.id,
        receiptTemplateId: template.id,
        gateway: isCardType ? 'square' : method,
        gatewayPaymentId: squarePaymentId,
      }
      donations.push(donation)

      /* ---- the sewa order this gift bought ---- */
      if (!FULFILLABLE.includes(sewa.gaushalaCategory!)) continue

      /*
        A sewa with a date on it is carried out on that date, so it sits in the
        queue until then however long ago it was paid for — that is what fills
        the fulfilment list, not a backlog. An undated one (a sack of fodder) is
        done within a day or two of the money arriving.
      */
      const serviceDate = sewa.needsDate ? addDays(date, 2 + (orderSeq % 16)) : undefined
      const daysUntilService = serviceDate
        ? Math.floor((serviceDate.getTime() - now.getTime()) / 86_400_000)
        : null

      let orderStatus: SewaOrder['status']
      let assignedAt: Date
      let completedAt: Date
      if (serviceDate && daysUntilService !== null) {
        orderStatus = daysUntilService > 1 ? 'paid' : daysUntilService >= 0 ? 'assigned' : 'completed'
        assignedAt = addDays(serviceDate, -1)
        completedAt = serviceDate
      } else {
        orderStatus = ageDays >= 3 ? 'completed' : ageDays >= 1 ? 'assigned' : 'paid'
        assignedAt = addDays(date, 1)
        completedAt = addDays(date, 2)
      }
      const caretakerId = CARETAKERS[orderSeq % CARETAKERS.length]!

      sewaOrders.push({
        id: `SO-${String(orderSeq).padStart(5, '0')}`,
        sewaId: sewa.id,
        donationId: donation.id,
        donorName: donor.anonymous ? 'Anonymous devotee' : donor.name,
        amount,
        currency: donorCurrency,
        fxRate: fxRate(donorCurrency),
        status: orderStatus,
        placedAt: iso(date),
        serviceDate: serviceDate ? iso(serviceDate) : undefined,
        sankalpa: {
          name: line.dedication?.name ?? (donor.anonymous ? 'Anonymous devotee' : donor.name),
          gotra: line.dedication?.gothram,
          nakshatra: line.dedication?.nakshatra,
          occasion: line.dedication ? rng.pick(OCCASIONS) : undefined,
          dedication:
            line.dedication && rng.chance(0.4)
              ? `In loving memory of ${rng.pick(DONOR_LAST)} ji`
              : undefined,
          donorCountry,
        },
        assignedTo: orderStatus === 'paid' ? undefined : caretakerId,
        assignedAt: orderStatus === 'paid' ? undefined : iso(assignedAt),
        completedAt: orderStatus === 'completed' ? iso(completedAt) : undefined,
        proofMedia:
          orderStatus === 'completed'
            ? [
                {
                  kind: orderSeq % 6 === 0 ? 'video' : 'photo',
                  caption: `${sewa.name} offered on your behalf at the morning feed.`,
                  at: iso(completedAt),
                  art: orderSeq % 6,
                },
              ]
            : undefined,
        cowId: sewa.gaushalaCategory === 'cow_care' ? cows[orderSeq % cows.length]!.id : undefined,
      })
      orderSeq += 1
    }
  }

  /*
    The last few days of the queue, staged.

    At roughly a gift a day the console's fulfilment list is empty more often
    than not, purely because of where the random dates fall — which makes a
    working screen look broken. So the most recent days are filled in
    deliberately, the same way the invoice ready-to-release case is staged for
    the Payments screen. These are ordinary gifts through the ordinary flow;
    only their timing is chosen rather than rolled.
  */
  const fulfillableSewas = liveSewas.filter((item) => FULFILLABLE.includes(item.gaushalaCategory!))
  for (let back = 0; back < 3; back++) {
    for (let n = 0; n < 3; n++) {
      const sewa = fulfillableSewas[(back * 3 + n) % fulfillableSewas.length]!
      const date = subDays(now, back)
      date.setHours(7 + n * 4, rng.int(0, 59), 0, 0)
      if (date.getTime() > now.getTime()) date.setTime(now.getTime() - 3_600_000)

      const amount = sewa.price ?? rng.pick(sewa.presets ?? [5100])
      const donor = rng.pick(donors)
      const donorCountry = COUNTRY_BY_CITY[donor.city] ?? 'US'
      const donorCurrency = currencyForCountry(donorCountry)
      const entity = defaultEntity()
      const method: PaymentMethod = n === 2 ? 'apple_pay' : 'card'
      const fee = cardFee(amount)
      receiptSeq += 1

      const squarePaymentId = `sqpmt_${Math.floor(rng.next() * 1e9).toString(36).toUpperCase().padStart(7, '0')}`
      const donation: Donation = {
        id: `DN-${date.getFullYear()}-${String(sequence++).padStart(6, '0')}`,
        receiptNo: `RCP-GAU-${String(date.getFullYear()).slice(2)}-${String(receiptSeq).padStart(5, '0')}`,
        sectorId: 'sevalaya',
        donorId: donor.id,
        lines: [{ itemId: sewa.id, category: sewa.category, amount }],
        gross: amount,
        fee,
        net: amount - fee,
        method,
        status: 'receipted',
        createdAt: iso(date),
        squarePaymentId,
        fundId: sewa.fundId,
        webhookAt: iso(new Date(date.getTime() + 4_000)),
        donorCurrency,
        fxRate: fxRate(donorCurrency),
        displayGross: sewa.prices?.[donorCurrency] ?? convert(amount, donorCurrency),
        donorCountry,
        entityId: entity.id,
        receiptTemplateId: receiptTemplateFor(donorCountry, entity.id).id,
        gateway: 'square',
        gatewayPaymentId: squarePaymentId,
      }
      donations.push(donation)

      // Today's gifts are still waiting; yesterday's are out with a caretaker.
      const orderStatus: SewaOrder['status'] = back === 0 ? 'paid' : back === 1 ? 'assigned' : 'completed'
      const caretakerId = CARETAKERS[orderSeq % CARETAKERS.length]!
      sewaOrders.push({
        id: `SO-${String(orderSeq).padStart(5, '0')}`,
        sewaId: sewa.id,
        donationId: donation.id,
        donorName: donor.anonymous ? 'Anonymous devotee' : donor.name,
        amount,
        currency: donorCurrency,
        fxRate: fxRate(donorCurrency),
        status: orderStatus,
        placedAt: iso(date),
        serviceDate: sewa.needsDate ? iso(addDays(date, 1 + n)) : undefined,
        sankalpa: {
          name: donor.anonymous ? 'Anonymous devotee' : donor.name,
          nakshatra: sewa.needsDedication ? rng.pick(NAKSHATRAS) : undefined,
          gotra: sewa.needsDedication ? rng.pick(GOTRAS) : undefined,
          occasion: sewa.needsDedication ? rng.pick(OCCASIONS) : undefined,
          donorCountry,
        },
        assignedTo: orderStatus === 'paid' ? undefined : caretakerId,
        assignedAt: orderStatus === 'paid' ? undefined : iso(addDays(date, 1)),
        completedAt: orderStatus === 'completed' ? iso(addDays(date, 1)) : undefined,
        proofMedia:
          orderStatus === 'completed'
            ? [
                {
                  kind: 'photo',
                  caption: `${sewa.name} offered on your behalf at the morning feed.`,
                  at: iso(addDays(date, 1)),
                  art: orderSeq % 6,
                },
              ]
            : undefined,
        cowId: sewa.gaushalaCategory === 'cow_care' ? cows[orderSeq % cows.length]!.id : undefined,
      })
      orderSeq += 1
    }
  }

  donations.sort((x, y) => x.createdAt.localeCompare(y.createdAt))
  sewaOrders.sort((x, y) => y.placedAt.localeCompare(x.placedAt))

  // The same messy-but-real cases the rest of the books carry: a refund, a
  // chargeback and a declined card. A refunded gift cancels its sewa too, so
  // the fodder is not bought twice.
  const recentCards = donations.filter(
    (d) => d.method === 'card' && (now.getTime() - new Date(d.createdAt).getTime()) / 86_400_000 < 75,
  )
  const spoil = (d: Donation | undefined, status: Donation['status']) => {
    if (!d) return
    d.status = status
    const order = sewaOrders.find((o) => o.donationId === d.id)
    if (order) {
      order.status = 'cancelled'
      order.proofMedia = undefined
      order.completedAt = undefined
    }
  }
  spoil(recentCards[6], 'refunded')
  spoil(recentCards[23], 'failed')
  if (recentCards[14]) recentCards[14].disputed = true

  /* ---- rescues ---- */
  const rescues: Rescue[] = [
    {
      id: 'res-001',
      cowId: 'cow-005',
      title: 'Ponni, found beside the Dindigul highway',
      tamil: 'பொன்னி',
      rescuedAt: iso(subMonths(now, 3)),
      place: 'NH-44, near Dindigul',
      condition: 'Deep wire laceration to the left foreleg, four days old and already infected. Unable to bear weight.',
      treatment: 'Debridement under sedation, eleven days of antibiotics, dressing changed every third day. She is standing on it again.',
      status: 'under_treatment',
      treatmentGoal: 85_000,
      treatmentRaised: 52_400,
      beforeArt: 0,
      afterArt: 1,
    },
    {
      id: 'res-002',
      cowId: 'cow-007',
      title: 'Arasi and three kilos of plastic',
      tamil: 'அரசி',
      rescuedAt: iso(subMonths(now, 6)),
      place: 'Municipal dump yard, Madurai',
      condition: 'Chronically off her feed, visibly starving despite grazing. Rumen full of plastic bags and packaging.',
      treatment: 'Rumenotomy. Three kilos of plastic removed. Eleven weeks of soft feed before she ate normally again.',
      status: 'recovering',
      treatmentGoal: 145_000,
      treatmentRaised: 145_000,
      beforeArt: 2,
      afterArt: 3,
    },
    {
      id: 'res-003',
      cowId: 'cow-013',
      title: 'Six off the border lorry',
      rescuedAt: iso(subMonths(now, 8)),
      place: 'District border checkpost',
      condition: 'Nineteen animals in a lorry built for eight. Dehydrated, untreated horn and hip injuries throughout.',
      treatment: 'All six rehydrated on the roadside, then two weeks of wound care. Meenakshi was the worst of them and is now the healthiest.',
      status: 'recovered',
      treatmentGoal: 220_000,
      treatmentRaised: 220_000,
      beforeArt: 4,
      afterArt: 5,
    },
    {
      id: 'res-004',
      cowId: 'cow-012',
      title: 'Valli, blind in one eye',
      tamil: 'வள்ளி',
      rescuedAt: iso(subMonths(now, 26)),
      place: 'Surrendered at the gate',
      condition: 'An eye infection left untreated for months. The sight in the left eye could not be saved.',
      treatment: 'The eye was treated to stop the pain and the infection spreading. She learned the yard by sound inside a fortnight.',
      status: 'recovered',
      treatmentGoal: 38_000,
      treatmentRaised: 38_000,
      beforeArt: 1,
      afterArt: 0,
    },
  ]

  /* ---- gallery ---- */
  const GALLERY_SPECS: { title: string; category: GalleryItem['category']; kind: GalleryItem['kind']; caption: string }[] = [
    { title: 'The five o’clock feed', category: 'daily_life', kind: 'photo', caption: 'Green fodder going out to the east shed before first light.' },
    { title: 'Gopashtami morning', category: 'festival', kind: 'photo', caption: 'Garlands, kumkum and the whole herd turned out for the pooja.' },
    { title: 'Ponni’s dressing change', category: 'rescue', kind: 'video', caption: 'Day nine. She stands for it now without being held.' },
    { title: 'Annadhanam for the herd', category: 'seva', kind: 'photo', caption: 'A sponsored day of feed, offered in a family name from New Jersey.' },
    { title: 'The new east shed', category: 'shelter', kind: 'photo', caption: 'Twelve animals under a roof that did not exist in March.' },
    { title: 'Chinnu, three days old', category: 'daily_life', kind: 'photo', caption: 'The first calf born in the shelter rather than rescued into it.' },
    { title: 'Monsoon in the yard', category: 'shelter', kind: 'photo', caption: 'Why the drainage project mattered more than it sounded.' },
    { title: 'Makar Sankranti cow pooja', category: 'festival', kind: 'video', caption: 'Horns painted, bells on, and not one animal willing to stand still.' },
    { title: 'Evening rounds', category: 'daily_life', kind: 'photo', caption: 'The night caretaker counting the herd in at dusk.' },
    { title: 'Karuppu and Sivappu', category: 'daily_life', kind: 'photo', caption: 'Two bulls at the far end of the field, as always.' },
    { title: 'Vaccination round', category: 'rescue', kind: 'photo', caption: 'The pre-monsoon round, logged against every animal’s record.' },
    { title: 'School visit', category: 'seva', kind: 'photo', caption: 'Forty children, one very patient cow called Nandini.' },
  ]

  const gaushalaGallery: GalleryItem[] = GALLERY_SPECS.map((spec, i) => ({
    id: `gal-${String(i + 1).padStart(3, '0')}`,
    title: spec.title,
    category: spec.category,
    kind: spec.kind,
    at: iso(subDays(now, 4 + i * 17)),
    caption: spec.caption,
    art: i % 6,
  }))

  /* ---- expenses, for the transparency tab and the console ---- */
  const EXPENSE_CATEGORIES = [
    'Fodder & feed',
    'Veterinary & medicine',
    'Caretaker wages',
    'Shelter upkeep',
    'Water & electricity',
    'Transport',
  ]
  const EXPENSE_BASE = [1_850_000, 420_000, 960_000, 310_000, 185_000, 140_000]

  const gaushalaExpenses: GaushalaExpense[] = []
  for (let m = 0; m < 12; m++) {
    const month = subMonths(now, m)
    const key = `${month.getFullYear()}-${String(month.getMonth() + 1).padStart(2, '0')}`
    EXPENSE_CATEGORIES.forEach((category, c) => {
      gaushalaExpenses.push({
        id: `gex-${key}-${c}`,
        month: key,
        category,
        amount: Math.round(rng.around(EXPENSE_BASE[c]!, EXPENSE_BASE[c]! * 0.12)),
      })
    })
  }

  return {
    data: {
      cows,
      cowHealth,
      sewaOrders,
      rescues,
      gaushalaGallery,
      gaushalaEntities: GAUSHALA_ENTITIES.map((e) => ({ ...e })),
      receiptTemplates: RECEIPT_TEMPLATES.map((t) => ({ ...t })),
      gaushalaExpenses,
      // Adoption, visits, festivals, volunteering and the transparency shelf.
      ...makeProgramsSeed(now, cows, donors),
    },
    donations,
  }
}
