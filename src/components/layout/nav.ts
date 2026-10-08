import {
  BookLock,
  Boxes,
  ClipboardCheck,
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
import type { Role } from '@/types'

export interface NavItem {
  to: string
  label: string
  icon: LucideIcon
  phase: Phase
  roles: Role[]
  end?: boolean
  /** Shows the count of items waiting on this persona. */
  badge?: 'approvals'
}

const ALL: Role[] = ['sector_admin', 'store_keeper', 'procurement_officer', 'ca_staff', 'ca_partner', 'trustee']
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
    phase: 'report',
    label: 'Overview',
    items: [
      { to: '/console', label: 'Dashboard', icon: Gauge, phase: 'report', roles: ALL, end: true },
      { to: '/console/approvals', label: 'Approvals', icon: ClipboardCheck, phase: 'control', roles: ALL, badge: 'approvals' },
    ],
  },
  {
    phase: 'collect',
    label: 'Collect',
    items: [
      { to: '/console/donations', label: 'Donations', icon: HandCoins, phase: 'collect', roles: ADMIN_CA },
      { to: '/console/settings/catalog', label: 'Catalog manager', icon: Settings2, phase: 'collect', roles: ['sector_admin', 'ca_partner'] },
    ],
  },
  {
    phase: 'control',
    label: 'Control',
    items: [
      { to: '/console/reconciliation', label: 'Reconciliation', icon: Receipt, phase: 'control', roles: ADMIN_CA },
      { to: '/console/ledger', label: 'Ledger', icon: BookLock, phase: 'control', roles: ADMIN_CA },
      { to: '/console/allotments', label: 'Fund allotments', icon: Landmark, phase: 'control', roles: ADMIN_CA },
      { to: '/console/budgets', label: 'Budgets', icon: Wallet, phase: 'control', roles: ALL },
    ],
  },
  {
    phase: 'spend',
    label: 'Spend',
    items: [
      { to: '/console/inventory', label: 'Inventory', icon: Boxes, phase: 'spend', roles: SPEND },
      { to: '/console/suppliers', label: 'Suppliers', icon: Truck, phase: 'spend', roles: SPEND },
      { to: '/console/procurement', label: 'New purchase order', icon: Sparkles, phase: 'spend', roles: ['procurement_officer', 'sector_admin', 'ca_partner'] },
      { to: '/console/purchase-orders', label: 'Purchase orders', icon: ShoppingCart, phase: 'spend', roles: SPEND.concat('trustee') },
      { to: '/console/payments', label: 'Payments', icon: PackageSearch, phase: 'spend', roles: CA.concat('procurement_officer') },
    ],
  },
  {
    phase: 'report',
    label: 'Report',
    items: [
      { to: '/console/reports', label: 'Reports', icon: FileSpreadsheet, phase: 'report', roles: ALL },
      { to: '/console/audit', label: 'Audit log', icon: History, phase: 'report', roles: ADMIN_CA },
    ],
  },
]

export const ALL_NAV_ITEMS: NavItem[] = NAV_GROUPS.flatMap((g) => g.items)

export function visibleGroups(role: Role): NavGroup[] {
  return NAV_GROUPS.map((group) => ({ ...group, items: group.items.filter((i) => i.roles.includes(role)) })).filter(
    (group) => group.items.length > 0,
  )
}

export { ScrollText }
