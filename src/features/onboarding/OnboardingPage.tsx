import { Link } from 'react-router-dom'
import { ArrowRightLeft, Building2, Plus } from 'lucide-react'

import { SECTORS } from '@/config'
import { cn } from '@/lib/cn'
import { formatDate, formatMoney } from '@/lib/format'
import { Button } from '@/components/ui/Button'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { Table, type Column } from '@/components/ui/Table'
import { PageHeader } from '@/components/layout/PageHeader'
import { useDb } from '@/store/db'
import { currentUser, useSession } from '@/store/session'
import type { Tenant } from '@/types'
import { BRANDS } from './wizard'

/** Every customer on the platform, with the books each one keeps apart. */
export function OnboardingPage() {
  const tenants = useDb((s) => s.tenants)
  const activeTenantId = useDb((s) => s.activeTenantId)
  const switchTenant = useDb((s) => s.switchTenant)
  const personaId = useSession((s) => s.personaId)
  const canOnboard = currentUser(personaId).role === 'super_admin'

  const columns: Column<Tenant>[] = [
    {
      key: 'name',
      header: 'Customer',
      primary: true,
      cell: (t) => (
        <span className="flex items-center gap-3">
          <span
            className={cn(
              'flex size-8 shrink-0 items-center justify-center rounded-md font-display text-[13px] text-sandal-50',
              BRANDS.find((b) => b.id === t.brand)?.swatch,
            )}
          >
            {t.logoText}
          </span>
          <span>
            <span className="block text-stone-900">{t.name}</span>
            <span className="block text-[13px] text-stone-500">{t.domain}</span>
          </span>
        </span>
      ),
    },
    { key: 'verticals', header: 'Verticals', hideOnMobile: true, cell: (t) => t.verticals.map((v) => SECTORS[v].name).join(', ') },
    {
      key: 'limits',
      header: 'Approval limits',
      hideOnMobile: true,
      cell: (t) => (
        <span className="font-mono text-[13px] tabular-nums">
          {formatMoney(t.thresholds.staffMax)} / {formatMoney(t.thresholds.partnerMax)}
        </span>
      ),
    },
    { key: 'users', header: 'Users', align: 'right', hideOnMobile: true, cell: (t) => t.users.length },
    { key: 'since', header: 'Live since', cell: (t) => <span className="font-mono text-[13px] tabular-nums">{formatDate(t.createdAt)}</span> },
    { key: 'status', header: 'Status', cell: (t) => <StatusBadge status={t.status} /> },
    {
      key: 'act',
      header: '',
      align: 'right',
      cell: (t) =>
        t.id === activeTenantId ? (
          <span className="text-[13px] text-tulsi-700">Viewing</span>
        ) : (
          <Button size="sm" variant="secondary" icon={<ArrowRightLeft className="size-4" aria-hidden />} onClick={() => switchTenant(t.id)}>
            View books
          </Button>
        ),
    },
  ]

  return (
    <div>
      <PageHeader
        phase="onboard"
        title="Customers"
        description="Each customer has its own books, brand, verticals, approvers and approval limits. Switch between them to see that nothing is shared."
        actions={
          canOnboard ? (
            <Link to="/console/onboarding/new">
              <Button icon={<Plus className="size-4" aria-hidden />}>Onboard a customer</Button>
            </Link>
          ) : (
            <span className="inline-flex items-center gap-2 text-[13px] text-stone-500">
              <Building2 className="size-4" aria-hidden />
              Only a Super Admin can onboard a customer.
            </span>
          )
        }
      />
      <Table columns={columns} rows={tenants} rowKey={(t) => t.id} />
    </div>
  )
}
