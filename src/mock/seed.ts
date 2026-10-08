import type {
  BudgetHead,
  CatalogItem,
  Fund,
  InventoryItem,
  Project,
  SectorId,
  User,
} from '@/types'

/* ------------------------------------------------------------------ users */

export const USERS: User[] = [
  { id: 'u-dev', name: 'Lakshmi Narayanan', role: 'devotee', email: 'lakshmi.n@example.com', sectorIds: ['temple', 'sevalaya', 'sangam'] },
  { id: 'u-adm', name: 'Saravanan Pillai', role: 'sector_admin', email: 'saravanan@omg.org', sectorIds: ['temple', 'sevalaya', 'sangam'] },
  { id: 'u-store', name: 'Vasanthi Murugan', role: 'store_keeper', email: 'vasanthi@omg.org', sectorIds: ['temple', 'sevalaya'] },
  { id: 'u-proc', name: 'Dinesh Kumar', role: 'procurement_officer', email: 'dinesh@omg.org', sectorIds: ['temple', 'sevalaya', 'sangam'] },
  { id: 'u-cas', name: 'Anitha Rajan', role: 'ca_staff', email: 'anitha@caoffice.com', sectorIds: ['temple', 'sevalaya', 'sangam'] },
  { id: 'u-cap', name: 'R. Balasubramanian', role: 'ca_partner', email: 'bala@caoffice.com', sectorIds: ['temple', 'sevalaya', 'sangam'] },
  { id: 'u-tru', name: 'Meenakshi Sundaram', role: 'trustee', email: 'meenakshi@omg.org', sectorIds: ['temple', 'sevalaya', 'sangam'] },
]

export const ROLE_LABEL: Record<User['role'], string> = {
  devotee: 'Devotee',
  sector_admin: 'Sector Admin',
  store_keeper: 'Store Keeper',
  procurement_officer: 'Procurement Officer',
  ca_staff: 'CA Staff',
  ca_partner: 'CA Partner',
  trustee: 'Trustee',
}

export function userById(id: string): User | undefined {
  return USERS.find((u) => u.id === id)
}

export function userName(id: string): string {
  return USERS.find((u) => u.id === id)?.name ?? id
}

/* ------------------------------------------------------------------ funds */

export const FUNDS: Fund[] = [
  { id: 'fund-tmp-gen', sectorId: 'temple', name: 'Temple General Fund', type: 'unrestricted', balance: 0 },
  { id: 'fund-tmp-pooja', sectorId: 'temple', name: 'Pooja & Archana Fund', type: 'restricted', balance: 0 },
  { id: 'fund-tmp-fest', sectorId: 'temple', name: 'Festival Fund', type: 'restricted', balance: 0 },
  { id: 'fund-tmp-raja', sectorId: 'temple', name: 'Rajagopuram Renovation Fund', type: 'restricted', projectId: 'prj-rajagopuram', balance: 0 },
  { id: 'fund-tmp-corpus', sectorId: 'temple', name: 'Temple Corpus', type: 'corpus', balance: 0 },

  { id: 'fund-sev-gen', sectorId: 'sevalaya', name: 'Sevalaya General Fund', type: 'unrestricted', balance: 0 },
  { id: 'fund-sev-anna', sectorId: 'sevalaya', name: 'Annadhanam Fund', type: 'restricted', balance: 0 },
  { id: 'fund-sev-edu', sectorId: 'sevalaya', name: 'Education Support Fund', type: 'restricted', balance: 0 },
  { id: 'fund-sev-kitchen', sectorId: 'sevalaya', name: 'Kitchen Upgrade Fund', type: 'restricted', projectId: 'prj-kitchen', balance: 0 },

  { id: 'fund-sgm-gen', sectorId: 'sangam', name: 'Sangam General Fund', type: 'unrestricted', balance: 0 },
  { id: 'fund-sgm-events', sectorId: 'sangam', name: 'Cultural Events Fund', type: 'restricted', balance: 0 },
  { id: 'fund-sgm-lib', sectorId: 'sangam', name: 'Tamil School Library Fund', type: 'restricted', projectId: 'prj-library', balance: 0 },
]

/* --------------------------------------------------------------- projects */

export const PROJECTS: Project[] = [
  {
    id: 'prj-rajagopuram',
    sectorId: 'temple',
    name: 'Rajagopuram Renovation',
    summary:
      'Restoring the main tower: stucco figures, lime plaster, a gold-leaf kalasam and new lighting, under a traditional sthapathi.',
    goal: 75_000_000,
    raised: 46_500_000,
    fundId: 'fund-tmp-raja',
    startedAt: '2025-11-14',
  },
  {
    id: 'prj-kitchen',
    sectorId: 'sevalaya',
    name: 'Annadhanam Kitchen Upgrade',
    summary:
      'A steam cooking unit, stainless counters and cold storage, so the kitchen can serve 1,200 meals a day without strain.',
    goal: 12_000_000,
    raised: 7_180_000,
    fundId: 'fund-sev-kitchen',
    startedAt: '2026-02-02',
  },
  {
    id: 'prj-library',
    sectorId: 'sangam',
    name: 'Tamil School Library',
    summary:
      'Two thousand Tamil titles, reading furniture and a digital archive of Sangam-era texts for the weekend classes.',
    goal: 4_000_000,
    raised: 2_240_000,
    fundId: 'fund-sgm-lib',
    startedAt: '2026-04-18',
  },
]

/* ---------------------------------------------------------------- catalog */

export const CATALOG: CatalogItem[] = [
  /* Temple — Hundi */
  { id: 'cat-tmp-hundi', sectorId: 'temple', category: 'hundi', name: 'Hundi Offering', tamil: 'உண்டியல்', description: 'A general offering to the temple. Give whatever feels right.', price: null, presets: [1100, 2100, 5100, 10100, 10800], fundId: 'fund-tmp-gen', active: true, popular: true },
  { id: 'cat-tmp-deepam', sectorId: 'temple', category: 'hundi', name: 'Light a Deepam', tamil: 'தீபம்', description: 'One ghee lamp lit in your name at the sanctum.', price: 1100, fundId: 'fund-tmp-gen', active: true },
  { id: 'cat-tmp-vastram', sectorId: 'temple', category: 'hundi', name: 'Vastram Offering', description: 'Silk cloth offered to the deity on a day you choose.', price: 25100, needsDate: true, fundId: 'fund-tmp-gen', active: true },

  /* Temple — Pooja */
  { id: 'cat-tmp-archana', sectorId: 'temple', category: 'pooja', name: 'Archana', tamil: 'அர்ச்சனை', description: 'Name, nakshatra and gothram recited at the sanctum.', price: 1100, needsDedication: true, needsDate: true, fundId: 'fund-tmp-pooja', active: true, popular: true },
  { id: 'cat-tmp-sahasra', sectorId: 'temple', category: 'pooja', name: 'Sahasranama Archana', description: 'The thousand names chanted in your family name.', price: 3100, needsDedication: true, needsDate: true, fundId: 'fund-tmp-pooja', active: true },
  { id: 'cat-tmp-abhishekam', sectorId: 'temple', category: 'pooja', name: 'Abhishekam', tamil: 'அபிஷேகம்', description: 'Milk, honey, sandal and panchamritam abhishekam.', price: 5100, needsDedication: true, needsDate: true, fundId: 'fund-tmp-pooja', active: true, popular: true },
  { id: 'cat-tmp-satya', sectorId: 'temple', category: 'pooja', name: 'Satyanarayana Pooja', description: 'Full pooja with prasadam for the family, on a Pournami day.', price: 15100, needsDedication: true, needsDate: true, fundId: 'fund-tmp-pooja', active: true },
  { id: 'cat-tmp-navagraha', sectorId: 'temple', category: 'pooja', name: 'Navagraha Homam', description: 'Homam for the nine planets, with sankalpam in your name.', price: 20100, needsDedication: true, needsDate: true, fundId: 'fund-tmp-pooja', active: true },
  { id: 'cat-tmp-ganapathi', sectorId: 'temple', category: 'pooja', name: 'Ganapathi Homam', description: 'Performed at dawn to clear obstacles before a new beginning.', price: 25100, needsDedication: true, needsDate: true, fundId: 'fund-tmp-pooja', active: true },
  { id: 'cat-tmp-sponsorday', sectorId: 'temple', category: 'pooja', name: 'Sponsor a Day', description: 'All six kala poojas for a full day, in your family name.', price: 100100, needsDedication: true, needsDate: true, fundId: 'fund-tmp-pooja', active: true },

  /* Temple — Activities */
  { id: 'cat-tmp-navaratri', sectorId: 'temple', category: 'activity', name: 'Navaratri Golu Sponsorship', description: 'Nine evenings of music, kolu display and sundal prasadam.', price: 50100, fundId: 'fund-tmp-fest', active: true, popular: true },
  { id: 'cat-tmp-deepavali', sectorId: 'temple', category: 'activity', name: 'Deepavali Annadhanam', description: 'A festival meal for devotees on Deepavali morning.', price: 25100, fundId: 'fund-tmp-fest', active: true },
  { id: 'cat-tmp-thiru', sectorId: 'temple', category: 'activity', name: 'Thiruvilakku Pooja', description: 'Group lamp pooja on the first Friday of the month.', price: 5100, needsDate: true, fundId: 'fund-tmp-fest', active: true },
  { id: 'cat-tmp-ther', sectorId: 'temple', category: 'activity', name: 'Car Festival (Ther) Contribution', description: 'Towards the annual chariot procession through the streets.', price: null, presets: [5100, 10100, 25100, 50100], fundId: 'fund-tmp-fest', active: true },

  /* Temple — Projects */
  { id: 'cat-tmp-raja', sectorId: 'temple', category: 'project', name: 'Rajagopuram Renovation', description: 'Help restore the main tower, stone by stone.', price: null, presets: [10100, 25100, 50100, 100100, 111600], projectId: 'prj-rajagopuram', fundId: 'fund-tmp-raja', active: true, popular: true },
  { id: 'cat-tmp-corpus', sectorId: 'temple', category: 'project', name: 'Temple Corpus Endowment', description: 'A permanent fund. Only the income from it is ever spent.', price: null, presets: [100100, 250100, 500100], fundId: 'fund-tmp-corpus', active: true },

  /* Sevalaya — Hundi */
  { id: 'cat-sev-general', sectorId: 'sevalaya', category: 'hundi', name: 'General Donation', description: 'Used where the need is greatest that week.', price: null, presets: [2100, 5100, 10100, 25100], fundId: 'fund-sev-gen', active: true, popular: true },
  { id: 'cat-sev-meal', sectorId: 'sevalaya', category: 'hundi', name: 'Sponsor One Meal', description: 'A full meal for one person: rice, sambar, poriyal and curd.', price: 1100, fundId: 'fund-sev-anna', active: true, popular: true },

  /* Sevalaya — Pooja (dedicated days) */
  { id: 'cat-sev-annadhanam', sectorId: 'sevalaya', category: 'pooja', name: 'Annadhanam for a Day', tamil: 'அன்னதானம்', description: 'Feed everyone who comes, for one full day, in your family name.', price: 50100, needsDedication: true, needsDate: true, fundId: 'fund-sev-anna', active: true, popular: true },
  { id: 'cat-sev-birthday', sectorId: 'sevalaya', category: 'pooja', name: 'Birthday Annadhanam', description: 'Mark a birthday or a memorial day by feeding 100 people.', price: 25100, needsDedication: true, needsDate: true, fundId: 'fund-sev-anna', active: true },

  /* Sevalaya — Activities */
  { id: 'cat-sev-school', sectorId: 'sevalaya', category: 'activity', name: 'School Kit for a Child', description: 'Books, uniform, shoes and a year of fees for one child.', price: 15100, fundId: 'fund-sev-edu', active: true },
  { id: 'cat-sev-tuition', sectorId: 'sevalaya', category: 'activity', name: 'Evening Tuition Centre', description: 'One month of after-school teaching for 40 children.', price: 20100, fundId: 'fund-sev-edu', active: true },
  { id: 'cat-sev-medical', sectorId: 'sevalaya', category: 'activity', name: 'Medical Camp', description: 'A free health camp in a nearby village.', price: 50100, fundId: 'fund-sev-gen', active: true },

  /* Sevalaya — Projects */
  { id: 'cat-sev-kitchen', sectorId: 'sevalaya', category: 'project', name: 'Annadhanam Kitchen Upgrade', description: 'Steam cooking, cold storage and a cleaner kitchen floor.', price: null, presets: [10100, 25100, 50100, 100100], projectId: 'prj-kitchen', fundId: 'fund-sev-kitchen', active: true, popular: true },

  /* Sangam — Hundi */
  { id: 'cat-sgm-membership', sectorId: 'sangam', category: 'hundi', name: 'Annual Membership', description: 'One year of membership for a family, including all events.', price: 10100, fundId: 'fund-sgm-gen', active: true, popular: true },
  { id: 'cat-sgm-life', sectorId: 'sangam', category: 'hundi', name: 'Life Membership', description: 'Lifetime membership and a seat on the general body.', price: 100100, fundId: 'fund-sgm-gen', active: true },
  { id: 'cat-sgm-support', sectorId: 'sangam', category: 'hundi', name: 'Support the Sangam', description: 'Any amount towards running the sangam through the year.', price: null, presets: [2100, 5100, 10100, 25100], fundId: 'fund-sgm-gen', active: true },

  /* Sangam — Dedications */
  { id: 'cat-sgm-dedication', sectorId: 'sangam', category: 'pooja', name: 'Event Dedication', description: 'Dedicate an evening of the festival to your family.', price: 25100, needsDedication: true, needsDate: true, fundId: 'fund-sgm-events', active: true },

  /* Sangam — Activities */
  { id: 'cat-sgm-pongal', sectorId: 'sangam', category: 'activity', name: 'Pongal Vizha Sponsorship', description: 'The January harvest festival: music, the pongal pot and games.', price: 50100, fundId: 'fund-sgm-events', active: true, popular: true },
  { id: 'cat-sgm-class', sectorId: 'sangam', category: 'activity', name: 'Tamil Class Sponsorship', description: 'A term of weekend Tamil classes for 25 children.', price: 20100, fundId: 'fund-sgm-events', active: true },
  { id: 'cat-sgm-newyear', sectorId: 'sangam', category: 'activity', name: 'Tamil New Year Celebration', description: 'Chithirai 1: a cultural programme and a community lunch.', price: 25100, fundId: 'fund-sgm-events', active: true },

  /* Sangam — Projects */
  { id: 'cat-sgm-library', sectorId: 'sangam', category: 'project', name: 'Tamil School Library', description: 'Two thousand Tamil books and a quiet place to read them.', price: null, presets: [5100, 10100, 25100, 50100], projectId: 'prj-library', fundId: 'fund-sgm-lib', active: true },
]

/* -------------------------------------------------------------- inventory */

interface InventorySpec {
  name: string
  unit: string
  category: string
  price: number
  reorder: number
  stock: number
  sectors: SectorId[]
}

const INVENTORY_SPEC: InventorySpec[] = [
  { name: 'Ghee (15 kg tin)', unit: 'tin', category: 'Pooja materials', price: 18_500, reorder: 6, stock: 11, sectors: ['temple', 'sevalaya'] },
  { name: 'Camphor', unit: 'kg', category: 'Pooja materials', price: 1_250, reorder: 10, stock: 4, sectors: ['temple'] },
  { name: 'Agarbatti (bundle)', unit: 'bundle', category: 'Pooja materials', price: 320, reorder: 40, stock: 96, sectors: ['temple'] },
  { name: 'Kumkum', unit: 'kg', category: 'Pooja materials', price: 980, reorder: 8, stock: 15, sectors: ['temple'] },
  { name: 'Turmeric powder', unit: 'kg', category: 'Pooja materials', price: 640, reorder: 8, stock: 19, sectors: ['temple'] },
  { name: 'Sandalwood paste', unit: 'kg', category: 'Pooja materials', price: 7_400, reorder: 3, stock: 2, sectors: ['temple'] },
  { name: 'Vibhuti (sacred ash)', unit: 'kg', category: 'Pooja materials', price: 520, reorder: 10, stock: 24, sectors: ['temple'] },
  { name: 'Panchamritam mix', unit: 'kg', category: 'Pooja materials', price: 1_150, reorder: 6, stock: 9, sectors: ['temple'] },
  { name: 'Honey', unit: 'litre', category: 'Pooja materials', price: 1_380, reorder: 6, stock: 13, sectors: ['temple'] },

  { name: 'Garland (medium)', unit: 'piece', category: 'Flowers', price: 450, reorder: 30, stock: 52, sectors: ['temple'] },
  { name: 'Garland (large, utsavam)', unit: 'piece', category: 'Flowers', price: 1_650, reorder: 10, stock: 7, sectors: ['temple'] },
  { name: 'Loose jasmine', unit: 'kg', category: 'Flowers', price: 2_900, reorder: 5, stock: 8, sectors: ['temple'] },
  { name: 'Loose rose petals', unit: 'kg', category: 'Flowers', price: 2_100, reorder: 5, stock: 11, sectors: ['temple'] },
  { name: 'Banana leaves', unit: 'bundle', category: 'Flowers', price: 260, reorder: 25, stock: 18, sectors: ['temple', 'sevalaya'] },

  { name: 'Coconut', unit: 'piece', category: 'Prasadam', price: 95, reorder: 200, stock: 410, sectors: ['temple'] },
  { name: 'Banana (dozen)', unit: 'dozen', category: 'Prasadam', price: 340, reorder: 40, stock: 63, sectors: ['temple'] },
  { name: 'Jaggery', unit: 'kg', category: 'Prasadam', price: 310, reorder: 20, stock: 47, sectors: ['temple', 'sevalaya'] },
  { name: 'Cardamom', unit: 'kg', category: 'Prasadam', price: 4_800, reorder: 2, stock: 3, sectors: ['temple'] },
  { name: 'Cashew nuts', unit: 'kg', category: 'Prasadam', price: 1_950, reorder: 8, stock: 14, sectors: ['temple', 'sevalaya'] },
  { name: 'Raisins', unit: 'kg', category: 'Prasadam', price: 980, reorder: 8, stock: 17, sectors: ['temple', 'sevalaya'] },
  { name: 'Printed prasadam boxes', unit: 'box of 100', category: 'Packaging', price: 2_450, reorder: 15, stock: 9, sectors: ['temple'] },
  { name: 'Paper covers', unit: 'pack of 500', category: 'Packaging', price: 890, reorder: 20, stock: 52, sectors: ['temple', 'sevalaya'] },

  { name: 'Rice (25 kg)', unit: 'bag', category: 'Kitchen', price: 2_980, reorder: 20, stock: 34, sectors: ['sevalaya'] },
  { name: 'Toor dal', unit: 'kg', category: 'Kitchen', price: 215, reorder: 60, stock: 118, sectors: ['sevalaya'] },
  { name: 'Urad dal', unit: 'kg', category: 'Kitchen', price: 245, reorder: 40, stock: 71, sectors: ['sevalaya'] },
  { name: 'Cooking oil', unit: 'litre', category: 'Kitchen', price: 290, reorder: 50, stock: 38, sectors: ['sevalaya'] },
  { name: 'Tamarind', unit: 'kg', category: 'Kitchen', price: 430, reorder: 15, stock: 29, sectors: ['sevalaya'] },
  { name: 'Sambar powder', unit: 'kg', category: 'Kitchen', price: 680, reorder: 12, stock: 21, sectors: ['sevalaya'] },
  { name: 'Mustard seeds', unit: 'kg', category: 'Kitchen', price: 350, reorder: 8, stock: 16, sectors: ['sevalaya'] },
  { name: 'Vegetables (mixed)', unit: 'kg', category: 'Kitchen', price: 180, reorder: 80, stock: 42, sectors: ['sevalaya'] },
  { name: 'Curd', unit: 'litre', category: 'Kitchen', price: 165, reorder: 40, stock: 56, sectors: ['sevalaya'] },
  { name: 'Serving plates (steel)', unit: 'piece', category: 'Kitchen', price: 540, reorder: 50, stock: 310, sectors: ['sevalaya'] },
  { name: 'LPG cylinder refill', unit: 'cylinder', category: 'Kitchen', price: 4_200, reorder: 4, stock: 6, sectors: ['sevalaya'] },

  { name: 'Oil lamps (brass)', unit: 'piece', category: 'Brass & utensils', price: 2_150, reorder: 10, stock: 22, sectors: ['temple'] },
  { name: 'Lamp wicks', unit: 'pack of 500', category: 'Brass & utensils', price: 410, reorder: 20, stock: 37, sectors: ['temple'] },
  { name: 'Brass plate (thali)', unit: 'piece', category: 'Brass & utensils', price: 3_900, reorder: 5, stock: 12, sectors: ['temple'] },
  { name: 'Vastram (silk cloth)', unit: 'piece', category: 'Brass & utensils', price: 8_900, reorder: 4, stock: 9, sectors: ['temple'] },

  { name: 'Brass polish', unit: 'litre', category: 'Cleaning', price: 620, reorder: 10, stock: 24, sectors: ['temple'] },
  { name: 'Floor cleaner', unit: 'litre', category: 'Cleaning', price: 340, reorder: 20, stock: 48, sectors: ['temple', 'sevalaya', 'sangam'] },
  { name: 'Brooms and mops', unit: 'set', category: 'Cleaning', price: 780, reorder: 8, stock: 15, sectors: ['temple', 'sevalaya', 'sangam'] },
  { name: 'Hand wash', unit: 'litre', category: 'Cleaning', price: 290, reorder: 15, stock: 33, sectors: ['sevalaya', 'sangam'] },

  { name: 'Event banners (printed)', unit: 'piece', category: 'Events', price: 3_400, reorder: 5, stock: 11, sectors: ['sangam'] },
  { name: 'Tamil books (set)', unit: 'set', category: 'Events', price: 6_500, reorder: 6, stock: 14, sectors: ['sangam'] },
  { name: 'Folding chairs', unit: 'piece', category: 'Events', price: 1_250, reorder: 40, stock: 180, sectors: ['sangam'] },
  { name: 'Sound system rental', unit: 'day', category: 'Events', price: 12_000, reorder: 2, stock: 3, sectors: ['sangam'] },
]

export const INVENTORY: InventoryItem[] = INVENTORY_SPEC.map((spec, i) => ({
  id: `inv-${String(i + 1).padStart(3, '0')}`,
  sectorId: spec.sectors[0]!,
  name: spec.name,
  unit: spec.unit,
  stock: spec.stock,
  reorderLevel: spec.reorder,
  category: spec.category,
  lastUnitPrice: spec.price,
}))

/** Which sectors may draw each inventory item. */
export const INVENTORY_SECTORS: Record<string, SectorId[]> = Object.fromEntries(
  INVENTORY.map((item, i) => [item.id, INVENTORY_SPEC[i]!.sectors]),
)

/* -------------------------------------------------------------- suppliers */

export interface SupplierSpec {
  id: string
  name: string
  city: string
  categories: string[]
  rating: number
  onTimePct: number
  rejectionPct: number
  /** Multiplier on the catalogue price — this supplier's price level. */
  priceLevel: number
  orderCount: number
  since: string
  note: string
  status?: 'active' | 'blocked'
}

export const SUPPLIER_SPECS: SupplierSpec[] = [
  { id: 'sup-01', name: 'Sri Lakshmi Traders', city: 'Madurai', categories: ['Pooja materials', 'Prasadam', 'Packaging'], rating: 4.6, onTimePct: 94, rejectionPct: 1.2, priceLevel: 0.97, orderCount: 48, since: '2019-03-11', note: 'Steady and accurate. A little below market on bulk pooja materials.' },
  { id: 'sup-02', name: 'Annapoorna Wholesale', city: 'Coimbatore', categories: ['Kitchen', 'Prasadam'], rating: 4.2, onTimePct: 88, rejectionPct: 2.4, priceLevel: 0.93, orderCount: 37, since: '2020-07-02', note: 'Cheapest on staples, but often a day or two late in festival weeks.' },
  { id: 'sup-03', name: 'Kaveri Foods', city: 'Trichy', categories: ['Kitchen', 'Prasadam'], rating: 4.7, onTimePct: 97, rejectionPct: 0.8, priceLevel: 1.06, orderCount: 52, since: '2018-01-22', note: 'Premium and dependable. Never short-ships, and charges for it.' },
  { id: 'sup-04', name: 'Jasmine Florals', city: 'Madurai', categories: ['Flowers'], rating: 4.4, onTimePct: 91, rejectionPct: 3.1, priceLevel: 0.99, orderCount: 64, since: '2019-09-30', note: 'Daily flower supply. Quality dips when jasmine is scarce.' },
  { id: 'sup-05', name: 'Murugan Pooja Stores', city: 'Palani', categories: ['Pooja materials', 'Brass & utensils', 'Flowers'], rating: 4.1, onTimePct: 85, rejectionPct: 2.0, priceLevel: 1.01, orderCount: 29, since: '2021-05-14', note: 'Wide range. Occasional packing damage on brass.' },
  { id: 'sup-06', name: 'Ganesh Brass & Copper', city: 'Kumbakonam', categories: ['Brass & utensils'], rating: 4.8, onTimePct: 96, rejectionPct: 0.6, priceLevel: 1.12, orderCount: 21, since: '2017-11-08', note: 'Traditional workshop. The best finish available, priced accordingly.' },
  { id: 'sup-07', name: 'Sangam Printing Co.', city: 'Chennai', categories: ['Packaging', 'Events'], rating: 4.3, onTimePct: 90, rejectionPct: 1.8, priceLevel: 0.95, orderCount: 33, since: '2020-02-19', note: 'Good on print runs above 500. Small jobs cost more than they should.' },
  { id: 'sup-08', name: 'Thanjavur Agro Supplies', city: 'Thanjavur', categories: ['Kitchen', 'Prasadam'], rating: 3.9, onTimePct: 82, rejectionPct: 4.2, priceLevel: 0.91, orderCount: 26, since: '2021-08-03', note: 'Cheap but late. Two short deliveries last quarter.' },
  { id: 'sup-09', name: 'Vel Murugan Flowers', city: 'Tiruchendur', categories: ['Flowers'], rating: 4.0, onTimePct: 87, rejectionPct: 3.8, priceLevel: 0.94, orderCount: 41, since: '2020-10-27', note: 'Lower prices on loose flowers. Garland sizes vary.' },
  { id: 'sup-10', name: 'Meenakshi Cleaning Supplies', city: 'Madurai', categories: ['Cleaning', 'Packaging'], rating: 4.5, onTimePct: 93, rejectionPct: 1.0, priceLevel: 1.0, orderCount: 19, since: '2021-01-16', note: 'Reliable monthly supply contract.' },
  { id: 'sup-11', name: 'Chola Silks & Vastram', city: 'Kanchipuram', categories: ['Brass & utensils', 'Events'], rating: 4.6, onTimePct: 92, rejectionPct: 1.4, priceLevel: 1.08, orderCount: 17, since: '2019-06-21', note: 'Handloom vastram. Needs four weeks notice for festival orders.' },
  { id: 'sup-12', name: 'Kodai Spice House', city: 'Dindigul', categories: ['Kitchen', 'Prasadam', 'Pooja materials'], rating: 4.4, onTimePct: 90, rejectionPct: 1.6, priceLevel: 1.02, orderCount: 23, since: '2020-12-09', note: 'Strong on cardamom and spice blends.' },
  { id: 'sup-13', name: 'Nellai Fresh Produce', city: 'Tirunelveli', categories: ['Kitchen'], rating: 3.6, onTimePct: 74, rejectionPct: 6.5, priceLevel: 0.88, orderCount: 8, since: '2026-06-12', note: 'New supplier, barely eight orders in. Cheapest quote, unproven.' },
  { id: 'sup-14', name: 'Vaigai Traders', city: 'Madurai', categories: ['Pooja materials', 'Packaging'], rating: 2.8, onTimePct: 61, rejectionPct: 11.4, priceLevel: 0.86, orderCount: 14, since: '2021-04-05', note: 'Blocked after three adulterated ghee consignments. Do not reorder.', status: 'blocked' },
]

/* ------------------------------------------------------------ budget heads */

export interface BudgetSpec {
  id: string
  sectorId: BudgetHead['sectorId']
  name: string
  fundId: string
  allocated: number
  projectId?: string
}

export const BUDGET_SPECS: BudgetSpec[] = [
  { id: 'bh-tmp-pooja', sectorId: 'temple', name: 'Pooja Materials', fundId: 'fund-tmp-pooja', allocated: 4_200_000 },
  { id: 'bh-tmp-flowers', sectorId: 'temple', name: 'Flowers & Garlands', fundId: 'fund-tmp-pooja', allocated: 2_800_000 },
  { id: 'bh-tmp-prasadam', sectorId: 'temple', name: 'Prasadam & Packaging', fundId: 'fund-tmp-gen', allocated: 2_100_000 },
  { id: 'bh-tmp-fest', sectorId: 'temple', name: 'Festival Expenses', fundId: 'fund-tmp-fest', allocated: 5_600_000 },
  { id: 'bh-tmp-maint', sectorId: 'temple', name: 'Temple Maintenance', fundId: 'fund-tmp-gen', allocated: 3_400_000 },
  { id: 'bh-tmp-staff', sectorId: 'temple', name: 'Archakar & Staff', fundId: 'fund-tmp-gen', allocated: 6_800_000 },
  { id: 'bh-tmp-util', sectorId: 'temple', name: 'Utilities & Cleaning', fundId: 'fund-tmp-gen', allocated: 1_450_000 },
  { id: 'bh-tmp-raja', sectorId: 'temple', name: 'Rajagopuram Works', fundId: 'fund-tmp-raja', allocated: 28_000_000, projectId: 'prj-rajagopuram' },

  { id: 'bh-sev-anna', sectorId: 'sevalaya', name: 'Annadhanam Provisions', fundId: 'fund-sev-anna', allocated: 9_200_000 },
  { id: 'bh-sev-kitchen', sectorId: 'sevalaya', name: 'Kitchen Operations', fundId: 'fund-sev-gen', allocated: 2_600_000 },
  { id: 'bh-sev-edu', sectorId: 'sevalaya', name: 'Education Programme', fundId: 'fund-sev-edu', allocated: 3_800_000 },
  { id: 'bh-sev-med', sectorId: 'sevalaya', name: 'Medical Camps', fundId: 'fund-sev-gen', allocated: 1_600_000 },
  { id: 'bh-sev-staff', sectorId: 'sevalaya', name: 'Programme Staff', fundId: 'fund-sev-gen', allocated: 4_100_000 },
  { id: 'bh-sev-upgrade', sectorId: 'sevalaya', name: 'Kitchen Upgrade Works', fundId: 'fund-sev-kitchen', allocated: 5_400_000, projectId: 'prj-kitchen' },

  { id: 'bh-sgm-events', sectorId: 'sangam', name: 'Cultural Events', fundId: 'fund-sgm-events', allocated: 3_200_000 },
  { id: 'bh-sgm-class', sectorId: 'sangam', name: 'Tamil Classes', fundId: 'fund-sgm-events', allocated: 1_400_000 },
  { id: 'bh-sgm-admin', sectorId: 'sangam', name: 'Sangam Administration', fundId: 'fund-sgm-gen', allocated: 1_100_000 },
  { id: 'bh-sgm-lib', sectorId: 'sangam', name: 'Library Build-out', fundId: 'fund-sgm-lib', allocated: 1_900_000, projectId: 'prj-library' },
]

/* ------------------------------------------------------------ donor names */

export const DONOR_FIRST = [
  'Lakshmi', 'Karthik', 'Priya', 'Arun', 'Meena', 'Srinivasan', 'Kavitha', 'Ramesh', 'Divya', 'Senthil',
  'Anitha', 'Murugan', 'Revathi', 'Balaji', 'Sowmya', 'Ganesh', 'Vidhya', 'Prakash', 'Janani', 'Suresh',
  'Deepa', 'Mohan', 'Nandini', 'Vijay', 'Shanthi', 'Raghavan', 'Uma', 'Ashok', 'Keerthi', 'Hari',
  'Vasanthi', 'Dinesh', 'Gayathri', 'Sundar', 'Bhuvana', 'Sathish', 'Latha', 'Venkat', 'Aishwarya', 'Manoj',
  'Padmini', 'Rajesh', 'Nithya', 'Krishnan', 'Yamuna', 'Siva', 'Chitra', 'Gopal', 'Malathi', 'Arjun',
]

export const DONOR_LAST = [
  'Narayanan', 'Subramanian', 'Venkatesh', 'Raghavan', 'Iyer', 'Pillai', 'Chettiar', 'Natarajan', 'Krishnan',
  'Sundaram', 'Rajan', 'Murthy', 'Balakrishnan', 'Swaminathan', 'Ramanathan', 'Chandrasekar', 'Mahadevan',
  'Gopalakrishnan', 'Thiagarajan', 'Vaidyanathan', 'Annamalai', 'Shanmugam', 'Doraiswamy', 'Ponnusamy',
]

export const DONOR_CITIES = [
  'Madurai', 'Chennai', 'Coimbatore', 'Trichy', 'Salem', 'Tirunelveli', 'Thanjavur', 'Erode',
  'Edison NJ', 'Fremont CA', 'Plano TX', 'Toronto', 'Singapore', 'Kuala Lumpur', 'London', 'Sydney',
]

export function catalogById(id: string): CatalogItem | undefined {
  return CATALOG.find((c) => c.id === id)
}

export function fundById(id: string): Fund | undefined {
  return FUNDS.find((f) => f.id === id)
}

export function projectById(id: string): Project | undefined {
  return PROJECTS.find((p) => p.id === id)
}
