import { useMemo, useState } from 'react'
import { Pencil, Plus, Search } from 'lucide-react'

import { SECTORS } from '@/config'
import { formatMoney, titleCase } from '@/lib/format'
import { Button } from '@/components/ui/Button'
import { EmptyState } from '@/components/ui/EmptyState'
import { Input } from '@/components/ui/Input'
import { Money } from '@/components/ui/Money'
import { Select } from '@/components/ui/Select'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { Table, type Column } from '@/components/ui/Table'
import { toast } from '@/lib/toast'
import { PageHeader } from '@/components/layout/PageHeader'
import { SectorChip } from '@/components/layout/PhaseChip'
import { CATALOG, FUNDS } from '@/mock/seed'
import { useSession } from '@/store/session'
import type { CatalogItem } from '@/types'

export function CatalogManagerPage() {
  const filter = useSession((s) => s.sectorFilter)
  const [query, setQuery] = useState('')
  const [category, setCategory] = useState('all')

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase()
    return CATALOG.filter(
      (item) =>
        (filter === 'all' || item.sectorId === filter) &&
        (category === 'all' || item.category === category) &&
        (q === '' || item.name.toLowerCase().includes(q) || item.description.toLowerCase().includes(q)),
    )
  }, [filter, query, category])

  const columns: Column<CatalogItem>[] = [
    {
      key: 'name',
      header: 'Item',
      primary: true,
      cell: (item) => (
        <div>
          <p className="text-stone-900">{item.name}</p>
          {item.tamil ? <p className="text-[13px] text-stone-500">{item.tamil}</p> : null}
        </div>
      ),
    },
    { key: 'category', header: 'Category', cell: (item) => titleCase(item.category) },
    { key: 'sector', header: 'Sector', cell: (item) => <SectorChip sectorId={item.sectorId} /> },
    {
      key: 'fund',
      header: 'Credits fund',
      hideOnMobile: true,
      cell: (item) => FUNDS.find((f) => f.id === item.fundId)?.name ?? '—',
    },
    {
      key: 'price',
      header: 'Price',
      align: 'right',
      cell: (item) =>
        item.price === null ? (
          <span className="text-[14px] text-stone-500">Any amount</span>
        ) : (
          <Money value={item.price} />
        ),
    },
    {
      key: 'requires',
      header: 'Requires',
      hideOnMobile: true,
      cell: (item) => (
        <span className="text-[13px] text-stone-500">
          {[item.needsDedication && 'dedication', item.needsDate && 'date'].filter(Boolean).join(', ') || '—'}
        </span>
      ),
    },
    { key: 'status', header: 'Status', cell: (item) => <StatusBadge status={item.active ? 'active' : 'draft'} /> },
    {
      key: 'edit',
      header: '',
      align: 'right',
      cell: () => (
        <Button
          size="sm"
          variant="ghost"
          icon={<Pencil className="size-4" aria-hidden />}
          aria-label="Edit catalog item"
          onClick={() => toast.info('Coming in the next build', 'Editing writes to the catalog service.')}
        >
          Edit
        </Button>
      ),
    },
  ]

  const totalValue = rows.reduce((sum, item) => sum + (item.price ?? 0), 0)

  return (
    <div>
      <PageHeader
        phase="collect"
        title="Catalog manager"
        description="What devotees can give to, what it costs, and which fund each gift lands in."
        actions={
          <Button icon={<Plus className="size-4" aria-hidden />} onClick={toast.soon}>
            New item
          </Button>
        }
      >
        <div className="grid gap-3 sm:grid-cols-[1fr_220px]">
          <Input
            aria-label="Search the catalog"
            placeholder="Search item name or description"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            leading={<Search className="size-4" aria-hidden />}
          />
          <Select
            aria-label="Filter by category"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            options={[
              { value: 'all', label: 'All categories' },
              { value: 'hundi', label: 'Hundi' },
              { value: 'pooja', label: 'Pooja' },
              { value: 'event', label: 'Events' },
              { value: 'membership', label: 'Membership' },
              { value: 'activity', label: 'Activities' },
              { value: 'project', label: 'Projects' },
            ]}
          />
        </div>
      </PageHeader>

      {rows.length === 0 ? (
        <EmptyState
          title="No catalog items match"
          message="Try a different category, or clear the search box."
          action={
            <Button variant="secondary" onClick={() => { setQuery(''); setCategory('all') }}>
              Clear filters
            </Button>
          }
        />
      ) : (
        <>
          <Table columns={columns} rows={rows} rowKey={(item) => item.id} />
          <p className="mt-4 text-[13px] text-stone-500">
            {rows.length} items · fixed prices total {formatMoney(totalValue)} ·{' '}
            {rows.filter((i) => i.price === null).length} accept any amount ·{' '}
            {filter === 'all' ? 'all sectors' : SECTORS[filter].name}
          </p>
        </>
      )}
    </div>
  )
}
