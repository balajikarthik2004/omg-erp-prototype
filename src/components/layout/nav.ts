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
  Gauge,
  HandCoins,
  HeartPulse,
  History,
  Landmark,
  LayoutDashboard,
  PackageSearch,
  QrCode,
  Receipt,
  ScrollText,
  Settings2,
  Sprout,
  ShoppingCart,
  Palette,
  FilePlus,
  Truck,
  Wallet,
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
}

export const NAV_GROUPS: NavGroup[] = [
  {
    phase: 'onboard',
    label: 'Platform',
    items: [{ to: '/console/onboarding', label: 'Customers', icon: Building2, phase: 'onboard', roles: ['super_admin', 'trustee'] }],
  },
  {
    phase: 'report',
    label: 'Overview',
    items: [
      { to: '/console', label: 'Dashboard', icon: Gauge, phase: 'report', roles: WITH_PLATFORM, end: true },
      { to: '/console/approvals', label: 'Approvals', icon: ClipboardCheck, phase: 'control', roles: ALL, badge: 'approvals' },
    ],
  },
  {
    phase: 'collect',
    label: 'Events',
    items: [
      { to: '/console/events/overview', label: 'Overview', icon: LayoutDashboard, phase: 'collect', roles: ['store_keeper', ...ADMIN_CA], module: 'events' },
      { to: '/console/events', label: 'All events', icon: CalendarDays, phase: 'collect', roles: ['store_keeper', ...ADMIN_CA], module: 'events', end: true },
      { to: '/console/events/budgets', label: 'Budgets & approvals', icon: Wallet, phase: 'control', roles: ADMIN_CA, module: 'events' },
      { to: '/console/events/approvals', label: 'Approval center', icon: ClipboardCheck, phase: 'control', roles: ADMIN_CA, module: 'events', badge: 'eventApprovals' },
      { to: '/console/events/studio', label: 'Poster studio', icon: Palette, phase: 'collect', roles: ADMIN_CA, module: 'events' },
      { to: '/console/events/registrations', label: 'Registrations & QR', icon: QrCode, phase: 'collect', roles: ['store_keeper', ...ADMIN_CA], module: 'events' },
      { to: '/console/events/purchases', label: 'Purchases & orders', icon: ShoppingCart, phase: 'spend', roles: ADMIN_CA, module: 'events' },
      { to: '/console/events/reports', label: 'Financial reports', icon: BarChart3, phase: 'report', roles: ADMIN_CA, module: 'events' },
    ],
  },
  {
    phase: 'collect',
    label: 'Gaushala',
    items: [
      { to: '/console/gaushala', label: 'Dashboard', icon: Gauge, phase: 'report', roles: GAU_ALL, end: true },
      { to: '/console/gaushala/cows', label: 'Cow management', icon: HeartPulse, phase: 'collect', roles: GAU_HERD },
      { to: '/console/gaushala/sewas', label: 'Sewa catalogue', icon: Sprout, phase: 'collect', roles: GAU_MANAGE },
      { to: '/console/gaushala/donations', label: 'Donations', icon: HandCoins, phase: 'collect', roles: GAU_MONEY },
    ],
  },
  {
    phase: 'collect',
    label: 'Collect',
    items: [
      { to: '/console/donations', label: 'Donations', icon: HandCoins, phase: 'collect', roles: ADMIN_CA, module: 'donations' },
      { to: '/console/cash-counts', label: 'Counter cash', icon: Coins, phase: 'collect', roles: ['store_keeper', ...ADMIN_CA], module: 'donations' },
      { to: '/console/settings/catalog', label: 'Catalog manager', icon: Settings2, phase: 'collect', roles: ['sector_admin', 'ca_partner'], module: 'donations' },
    ],
  },
  {
    phase: 'control',
    label: 'Control',
    items: [
      { to: '/console/reconciliation', label: 'Reconciliation', icon: Receipt, phase: 'control', roles: ADMIN_CA, module: 'reconciliation' },
      { to: '/console/ledger', label: 'Ledger', icon: BookLock, phase: 'control', roles: ADMIN_CA },
      { to: '/console/allotments', label: 'Fund allotments', icon: Landmark, phase: 'control', roles: ADMIN_CA, module: 'budgets' },
      { to: '/console/budgets', label: 'Budgets', icon: Wallet, phase: 'control', roles: ALL, module: 'budgets' },
      { to: '/console/period-close', label: 'Period close', icon: CalendarCheck, phase: 'control', roles: CA },
    ],
  },
  {
    phase: 'spend',
    label: 'Spend',
    items: [
      { to: '/console/inventory', label: 'Inventory', icon: Boxes, phase: 'spend', roles: SPEND, module: 'inventory' },
      { to: '/console/suppliers', label: 'Suppliers', icon: Truck, phase: 'spend', roles: SPEND, module: 'inventory' },
      { to: '/console/procurement', label: 'New purchase order', icon: FilePlus, phase: 'spend', roles: ['procurement_officer', 'sector_admin', 'ca_partner'], module: 'procurement' },
      { to: '/console/purchase-orders', label: 'Purchase orders', icon: ShoppingCart, phase: 'spend', roles: SPEND.concat('trustee'), module: 'procurement' },
      { to: '/console/payments', label: 'Payments', icon: PackageSearch, phase: 'spend', roles: CA.concat('procurement_officer'), module: 'payments' },
    ],
  },
  {
    phase: 'report',
    label: 'Report',
    items: [
      { to: '/console/reports', label: 'Reports', icon: FileSpreadsheet, phase: 'report', roles: WITH_PLATFORM, module: 'reports' },
      { to: '/console/audit', label: 'Audit log', icon: History, phase: 'report', roles: ['super_admin', ...ADMIN_CA], module: 'reports' },
    ],
  },
]

export const ALL_NAV_ITEMS: NavItem[] = NAV_GROUPS.flatMap((g) => g.items)

export function visibleGroups(role: Role, modules?: ModuleKey[]): NavGroup[] {
  const enabled = (item: NavItem) => !item.module || !modules || modules.includes(item.module)
  return NAV_GROUPS.map((group) => ({
    ...group,
    items: group.items.filter((i) => i.roles.includes(role) && enabled(i)),
  })).filter(
    (group) => group.items.length > 0,
  )
}

export { ScrollText }
