import {
  BookLock,
  Boxes,
  BarChart3,
  Building2,
  CalendarCheck,
  CalendarDays,
  ClipboardCheck,
  Coins,
  FileSpreadsheet,
  CalendarHeart,
  Gauge,
  HandCoins,
  HandHeart,
  HeartPulse,
  History,
  Landmark,
  LayoutDashboard,
  PackageSearch,
  QrCode,
  Receipt,
  ScrollText,
  Settings2,
  ScanLine,
  ShieldCheck,
  Sprout,
  ShoppingCart,
  Palette,
  FilePlus,
  Truck,
  Wallet,
  FileCheck2,
  Handshake,
  type LucideIcon,
} from 'lucide-react'

import type { Phase } from '@/config'
import type { ModuleKey, Role } from '@/types'

export interface NavItem {
  to: string
  label: string
  icon: LucideIcon
  phase: Phase
  roles: Role[]
  end?: boolean
  /** Shows the count of items waiting on this persona. */
  badge?: 'approvals' | 'eventApprovals'
  /** Hidden when the customer has not enabled this module. */
  module?: ModuleKey
}

const ALL: Role[] = ['sector_admin', 'store_keeper', 'procurement_officer', 'ca_staff', 'ca_partner', 'trustee']
/** The four Gaushala roles, plus the people who oversee them. */
const GAU_ALL: Role[] = [
  'gaushala_admin',
  'gaushala_accountant',
  'gaushala_caretaker',
  'gaushala_content_editor',
  'sector_admin',
  'ca_partner',
  'trustee',
]
const GAU_MANAGE: Role[] = ['gaushala_admin', 'sector_admin', 'ca_partner', 'trustee']
const GAU_MONEY: Role[] = ['gaushala_admin', 'gaushala_accountant', 'ca_partner', 'trustee']
const GAU_HERD: Role[] = ['gaushala_admin', 'gaushala_caretaker', 'sector_admin', 'ca_partner', 'trustee']
const WITH_PLATFORM: Role[] = ['super_admin', ...ALL]
const CA: Role[] = ['ca_staff', 'ca_partner', 'trustee']
const ADMIN_CA: Role[] = ['sector_admin', 'ca_staff', 'ca_partner', 'trustee']
const SPEND: Role[] = ['store_keeper', 'procurement_officer', 'ca_staff', 'ca_partner', 'sector_admin']

export interface NavGroup {
  phase: Phase
  label: string
  items: NavItem[]
  /**
   * A "flow" group is one of the four money-flow phases, in the order a gift
   * actually travels. A "module" group is an optional vertical and sits after
   * the flow; "system" sits above it.
   */
  kind: 'system' | 'overview' | 'flow' | 'module'
  /** One line under the group label, so a new admin knows what lives here. */
  hint?: string
}

export const NAV_GROUPS: NavGroup[] = [
  /* The Platform group — the multi-tenant customer list at
     /console/onboarding — is out of the sidebar for now. One tenant ships
     with the demo, so it listed a single row. The routes are still wired;
     put the group back here to surface it again. */
  {
    kind: 'overview',
    phase: 'report',
    label: 'Overview',
    items: [
      { to: '/console', label: 'Dashboard', icon: Gauge, phase: 'report', roles: WITH_PLATFORM, end: true },
      { to: '/console/approvals', label: 'Approvals', icon: ClipboardCheck, phase: 'control', roles: ALL, badge: 'approvals' },
    ],
  },
  {
    kind: 'flow',
    phase: 'collect',
    label: 'Collect',
    hint: 'Money coming in',
    items: [
      { to: '/console/donations', label: 'Donations', icon: HandCoins, phase: 'collect', roles: ADMIN_CA, module: 'donations' },
      { to: '/console/cash-counts', label: 'Counter cash', icon: Coins, phase: 'collect', roles: ['store_keeper', ...ADMIN_CA], module: 'donations' },
      { to: '/console/settings/catalog', label: 'Catalog manager', icon: Settings2, phase: 'collect', roles: ['sector_admin', 'ca_partner'], module: 'donations' },
    ],
  },
  {
    kind: 'flow',
    phase: 'control',
    label: 'Control',
    hint: 'Where the money sits',
    items: [
      { to: '/console/reconciliation', label: 'Reconciliation', icon: Receipt, phase: 'control', roles: ADMIN_CA, module: 'reconciliation' },
      { to: '/console/ledger', label: 'Ledger', icon: BookLock, phase: 'control', roles: ADMIN_CA },
      { to: '/console/allotments', label: 'Fund allotments', icon: Landmark, phase: 'control', roles: ADMIN_CA, module: 'budgets' },
      { to: '/console/budgets', label: 'Budgets', icon: Wallet, phase: 'control', roles: ALL, module: 'budgets' },
      { to: '/console/period-close', label: 'Period close', icon: CalendarCheck, phase: 'control', roles: CA },
    ],
  },
  {
    kind: 'flow',
    phase: 'spend',
    label: 'Spend',
    hint: 'Money going out',
    items: [
      { to: '/console/inventory', label: 'Inventory', icon: Boxes, phase: 'spend', roles: SPEND, module: 'inventory' },
      { to: '/console/suppliers', label: 'Suppliers', icon: Truck, phase: 'spend', roles: SPEND, module: 'inventory' },
      { to: '/console/procurement', label: 'New purchase order', icon: FilePlus, phase: 'spend', roles: ['procurement_officer', 'sector_admin', 'ca_partner'], module: 'procurement' },
      { to: '/console/purchase-orders', label: 'Purchase orders', icon: ShoppingCart, phase: 'spend', roles: SPEND.concat('trustee'), module: 'procurement' },
      { to: '/console/payments', label: 'Payments', icon: PackageSearch, phase: 'spend', roles: CA.concat('procurement_officer'), module: 'payments' },
    ],
  },
  {
    kind: 'flow',
    phase: 'report',
    label: 'Report',
    hint: 'What it all adds up to',
    items: [
      { to: '/console/reports', label: 'Reports', icon: FileSpreadsheet, phase: 'report', roles: WITH_PLATFORM, module: 'reports' },
      { to: '/console/audit', label: 'Audit log', icon: History, phase: 'report', roles: ['super_admin', ...ADMIN_CA], module: 'reports' },
    ],
  },

  /* Optional verticals. Each runs the same four phases inside itself. */
  {
    kind: 'module',
    phase: 'collect',
    label: 'Events',
    items: [
      { to: '/console/events/overview', label: 'Overview', icon: LayoutDashboard, phase: 'collect', roles: ['store_keeper', ...ADMIN_CA], module: 'events' },
      { to: '/console/events', label: 'All events', icon: CalendarDays, phase: 'collect', roles: ['store_keeper', ...ADMIN_CA], module: 'events', end: true },
      { to: '/console/events/registrations', label: 'Registrations and QR', icon: QrCode, phase: 'collect', roles: ['store_keeper', ...ADMIN_CA], module: 'events' },
      { to: '/console/events/studio', label: 'Poster studio', icon: Palette, phase: 'collect', roles: ADMIN_CA, module: 'events' },
      { to: '/console/events/budgets', label: 'Budgets and planning', icon: Wallet, phase: 'control', roles: ADMIN_CA, module: 'events' },
      { to: '/console/events/approvals', label: 'Approval center', icon: ClipboardCheck, phase: 'control', roles: ADMIN_CA, module: 'events', badge: 'eventApprovals' },
      { to: '/console/events/purchases', label: 'Purchases and orders', icon: ShoppingCart, phase: 'spend', roles: ADMIN_CA, module: 'events' },
      { to: '/console/events/reports', label: 'Financial reports', icon: BarChart3, phase: 'report', roles: ADMIN_CA, module: 'events' },
    ],
  },
  {
    kind: 'module',
    phase: 'collect',
    label: 'Gaushala',
    items: [
      { to: '/console/gaushala', label: 'Overview', icon: Gauge, phase: 'report', roles: GAU_ALL, end: true },
      { to: '/console/gaushala/cows', label: 'Cow management', icon: HeartPulse, phase: 'collect', roles: GAU_HERD },
      { to: '/console/gaushala/sewas', label: 'Sewa catalogue', icon: Sprout, phase: 'collect', roles: GAU_MANAGE },
      { to: '/console/gaushala/donations', label: 'Donations', icon: HandCoins, phase: 'collect', roles: GAU_MONEY },
      { to: '/console/gaushala/adoptions', label: 'Adoptions', icon: HeartPulse, phase: 'collect', roles: GAU_MONEY },
      { to: '/console/gaushala/bookings', label: 'Visits and bookings', icon: ScanLine, phase: 'collect', roles: GAU_HERD },
      { to: '/console/gaushala/events', label: 'Festivals', icon: CalendarHeart, phase: 'collect', roles: GAU_MANAGE },
      { to: '/console/gaushala/volunteers', label: 'Volunteers', icon: HandHeart, phase: 'collect', roles: GAU_MANAGE },
      { to: '/console/gaushala/transparency', label: 'Transparency', icon: ShieldCheck, phase: 'report', roles: GAU_ALL },
    ],
  },
  {
    kind: 'module',
    phase: 'control',
    label: 'CSR',
    items: [
      { to: '/console/csr', label: 'Overview', icon: LayoutDashboard, phase: 'collect', roles: ADMIN_CA, module: 'csr', end: true },
      { to: '/console/csr/pipeline', label: 'Corporate pipeline', icon: Building2, phase: 'collect', roles: ADMIN_CA, module: 'csr' },
      { to: '/console/csr/deals', label: 'MoUs and tranches', icon: Handshake, phase: 'control', roles: ADMIN_CA, module: 'csr' },
      { to: '/console/csr/projects', label: 'CSR projects', icon: ScrollText, phase: 'control', roles: ADMIN_CA, module: 'csr' },
      { to: '/console/csr/compliance', label: 'Compliance vault', icon: ShieldCheck, phase: 'control', roles: ADMIN_CA, module: 'csr' },
      { to: '/console/csr/reports', label: 'UCs and reports', icon: FileCheck2, phase: 'report', roles: ADMIN_CA, module: 'csr' },
    ],
  },
]

export const ALL_NAV_ITEMS: NavItem[] = NAV_GROUPS.flatMap((g) => g.items)

/** The deepest nav item matching a path, with the group it sits in. */
export function locate(pathname: string): { group: NavGroup; item: NavItem } | undefined {
  let best: { group: NavGroup; item: NavItem } | undefined
  for (const group of NAV_GROUPS) {
    for (const item of group.items) {
      const hit = item.end ? pathname === item.to : pathname.startsWith(item.to)
      if (hit && (!best || item.to.length > best.item.to.length)) best = { group, item }
    }
  }
  return best
}

export function visibleGroups(role: Role, modules?: ModuleKey[]): NavGroup[] {
  const enabled = (item: NavItem) => !item.module || !modules || modules.includes(item.module)
  // The super admin is the account owner and reads the whole console. It buys
  // no authority: every approve button is still gated by the matrix, so the
  // owner sees each pending step and the role it is waiting on.
  const permitted = (item: NavItem) => role === 'super_admin' || item.roles.includes(role)
  const groups = NAV_GROUPS.map((group) => ({
    ...group,
    items: group.items.filter((i) => permitted(i) && enabled(i)),
  })).filter((group) => group.items.length > 0)

  return groups
}

export { ScrollText }
