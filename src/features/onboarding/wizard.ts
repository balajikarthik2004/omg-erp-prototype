import { BUDGET_SPECS, CATALOG, FUNDS, INVENTORY } from '@/mock/seed'
import type { ModuleKey, Role, SectorId, Tenant, TenantUser } from '@/types'

export interface Draft {
  name: string
  address: string
  domain: string
  brand: Tenant['brand']
  verticals: SectorId[]
  modules: ModuleKey[]
  squareLocationId: string
  squareVerified: boolean
  /** Dollars as typed. Converted to cents on submit. */
  staffMax: string
  partnerMax: string
  users: TenantUser[]
}

export const EMPTY_DRAFT: Draft = {
  name: '',
  address: '',
  domain: '',
  brand: 'kumkum',
  verticals: ['temple'],
  modules: ['donations', 'reconciliation', 'budgets', 'inventory', 'procurement', 'payments', 'reports'],
  squareLocationId: '',
  squareVerified: false,
  staffMax: '1000',
  partnerMax: '10000',
  users: [],
}

export const WIZARD_STEPS = [
  { id: 'customer', label: 'Customer', hint: 'Name, brand, domain' },
  { id: 'modules', label: 'Verticals & modules', hint: 'What they use' },
  { id: 'catalog', label: 'Catalog & prices', hint: 'Load the template' },
  { id: 'square', label: 'Square', hint: 'Payments location' },
  { id: 'thresholds', label: 'Approvals', hint: 'Who signs what' },
  { id: 'users', label: 'Users & roles', hint: 'The approvers' },
  { id: 'review', label: 'Go live', hint: 'Check and launch' },
]

export const MODULE_LABELS: Record<ModuleKey, { label: string; hint: string }> = {
  donations: { label: 'Donations & catalog', hint: 'Donor site, counter cash, receipts' },
  reconciliation: { label: 'Reconciliation', hint: 'Square payouts against bank and ledger' },
  budgets: { label: 'Allotments & budgets', hint: 'Fund allotment and budget heads' },
  inventory: { label: 'Inventory & suppliers', hint: 'Stock, requests, supplier master' },
  procurement: { label: 'Procurement', hint: 'AI supplier ranking and purchase orders' },
  payments: { label: 'Payments', hint: 'Invoices, 3-way match, release' },
  reports: { label: 'Reports & audit', hint: 'Income vs outgo, audit trail' },
}

export const VERTICAL_TEMPLATES: Record<SectorId, string> = {
  temple:
    'Hundi · Archana / Abhishekam / Homam booking · Sponsor a day · Festivals & utsavams · Kumbhabhishekam and renovation projects',
  sevalaya:
    'Annadhanam · Service and welfare programmes · Education sponsorship · Volunteer drives · Welfare projects with a goal tracker',
  sangam: 'Memberships (recurring) · Cultural events and ticketing · Classes and workshops · Community projects',
}

export const BRANDS: { id: Tenant['brand']; label: string; swatch: string }[] = [
  { id: 'kumkum', label: 'Kumkum', swatch: 'bg-kumkum-600' },
  { id: 'tulsi', label: 'Tulsi', swatch: 'bg-tulsi-500' },
  { id: 'peacock', label: 'Peacock', swatch: 'bg-peacock-500' },
  { id: 'turmeric', label: 'Turmeric', swatch: 'bg-turmeric-500' },
]

export const REQUIRED_ROLES: Role[] = ['sector_admin', 'ca_staff', 'ca_partner', 'trustee']

export const ROLE_OPTIONS: { value: Role; label: string }[] = [
  { value: 'sector_admin', label: 'Sector Admin' },
  { value: 'store_keeper', label: 'Store Keeper' },
  { value: 'procurement_officer', label: 'Procurement Officer' },
  { value: 'ca_staff', label: 'CA Staff' },
  { value: 'ca_partner', label: 'CA Partner' },
  { value: 'trustee', label: 'Trustee' },
]

export const DEMO_TEAM: Omit<TenantUser, 'id'>[] = [
  { name: 'Sundari Kannan', email: 'sundari@customer.org', role: 'sector_admin' },
  { name: 'Mohan Raj', email: 'mohan@caoffice.com', role: 'ca_staff' },
  { name: 'Revathi Iyer', email: 'revathi@caoffice.com', role: 'ca_partner' },
  { name: 'Arul Pandian', email: 'arul@customer.org', role: 'trustee' },
]

/** What the template will load for the chosen verticals. */
export function templateCounts(verticals: SectorId[]) {
  return {
    catalog: CATALOG.filter((c) => verticals.includes(c.sectorId)),
    funds: FUNDS.filter((f) => verticals.includes(f.sectorId)).length,
    budgets: BUDGET_SPECS.filter((b) => verticals.includes(b.sectorId)).length,
    inventory: INVENTORY.filter((i) => verticals.includes(i.sectorId)).length,
  }
}

export function toCents(dollars: string): number {
  return Math.round(Number(dollars.replace(/[^0-9.]/g, '')) * 100)
}

export function initialsOf(name: string): string {
  const letters = name
    .split(/\s+/)
    .filter(Boolean)
    .map((w) => w[0]!.toUpperCase())
  return (letters.slice(0, 2).join('') || 'OM').padEnd(2, 'M')
}

/** The first problem with this step, or null when it is complete. */
export function stepError(step: number, d: Draft, existingDomains: string[]): string | null {
  switch (step) {
    case 0: {
      if (d.name.trim().length < 3) return 'Give the customer a name of at least 3 characters.'
      const domain = d.domain.trim().toLowerCase()
      if (domain.length < 4 || !domain.includes('.')) return 'Enter a domain such as give.example.org.'
      if (existingDomains.includes(domain)) return `${domain} is already used by another customer.`
      return null
    }
    case 1:
      if (d.verticals.length === 0) return 'Enable at least one vertical.'
      if (d.modules.length === 0) return 'Enable at least one module.'
      return null
    case 3:
      return d.squareVerified ? null : 'Verify the Square location before continuing.'
    case 4: {
      const staff = toCents(d.staffMax)
      const partner = toCents(d.partnerMax)
      if (!(staff > 0)) return 'Enter the CA Staff limit, above zero.'
      if (partner <= staff) return 'The CA Partner limit must be higher than the CA Staff limit.'
      return null
    }
    case 5: {
      const missing = REQUIRED_ROLES.filter((r) => !d.users.some((u) => u.role === r))
      return missing.length === 0 ? null : `Add a user for ${missing.map((r) => r.replace('_', ' ')).join(', ')}.`
    }
    default:
      return null
  }
}
