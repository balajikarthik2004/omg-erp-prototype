import {
  BookLock,
  Boxes,
  Building2,
  CalendarCheck,
  ClipboardCheck,
  Coins,
  FileSpreadsheet,
  Gauge,
  HandCoins,
  History,
  Landmark,
  PackageSearch,
  Receipt,
  ScrollText,
  Settings2,
  ShoppingCart,
  Sparkles,
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
  badge?: 'approvals'
  /** Hidden when the customer has not enabled this module. */
  module?: ModuleKey
}

const ALL: Role[] = ['sector_admin', 'store_keeper', 'procurement_officer', 'ca_staff', 'ca_partner', 'trustee']
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
      { to: '/console/procurement', label: 'New purchase order', icon: Sparkles, phase: 'spend', roles: ['procurement_officer', 'sector_admin', 'ca_partner'], module: 'procurement' },
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
