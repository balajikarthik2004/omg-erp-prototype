import { useMemo, useState } from 'react'
import { Search, Star, StarOff } from 'lucide-react'

import { PageHeader } from '@/components/layout/PageHeader'
import { Button } from '@/components/ui/Button'
import { Card, CardHeader } from '@/components/ui/Card'
import { EmptyState } from '@/components/ui/EmptyState'
import { Input } from '@/components/ui/Input'
import { Money } from '@/components/ui/Money'
import { Select } from '@/components/ui/Select'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { Table, type Column } from '@/components/ui/Table'
import { CURRENCY_CODES, SETTLEMENT_CURRENCY, displayPrice, type Currency } from '@/lib/currency'
import { titleCase } from '@/lib/format'
import { GAUSHALA_SEWAS, SEWA_CATEGORIES } from '@/mock/gaushala'
import { FUNDS } from '@/mock/seed'
import { useDb } from '@/store/db'
import { useCurrentUser } from '@/store/session'
import type { CatalogItem } from '@/types'

export function SewaCataloguePage() {
  const setSewaActive = useDb((s) => s.setSewaActive)
  const setSewaPopular = useDb((s) => s.setSewaPopular)
  const actor = useCurrentUser()

  const [query, setQuery] = useState('')
  const [category, setCategory] = useState('all')
  const [currency, setCurrency] = useState<Currency>(SETTLEMENT_CURRENCY)

  /**
   * The flags live here rather than in the seed module, because the catalogue
   * itself is static demo data. A toggle is written to the audit trail by the
   * store and reflected on screen from this map.
   */
  const [overrides, setOverrides] = useState<Record<string, { active?: boolean; popular?: boolean }>>({})

  const resolved = useMemo(
    () =>
      GAUSHALA_SEWAS.map((sewa) => ({
        ...sewa,
        active: overrides[sewa.id]?.active ?? sewa.active,
        popular: overrides[sewa.id]?.popular ?? sewa.popular,
      })),
    [overrides],
  )

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase()
    return resolved.filter(
      (sewa) =>
        (category === 'all' || sewa.gaushalaCategory === category) &&
        (q === '' || sewa.name.toLowerCase().includes(q) || sewa.description.toLowerCase().includes(q)),
    )
  }, [resolved, query, category])

  function toggleActive(sewa: CatalogItem) {
    const next = !sewa.active
    setOverrides((o) => ({ ...o, [sewa.id]: { ...o[sewa.id], active: next } }))
    setSewaActive(sewa.id, next, actor)
  }

  function togglePopular(sewa: CatalogItem) {
    const next = !sewa.popular
    setOverrides((o) => ({ ...o, [sewa.id]: { ...o[sewa.id], popular: next } }))
    setSewaPopular(sewa.id, next, actor)
  }

  const columns: Column<CatalogItem>[] = [
    {
      key: 'name',
      header: 'Sewa',
      primary: true,
      cell: (sewa) => (
        <div className="min-w-0">
          <p className="truncate font-semibold text-navy-950">{sewa.name}</p>
          {sewa.tamil ? <p className="truncate text-[13px] text-navy-600">{sewa.tamil}</p> : null}
        </div>
      ),
    },
    {
      key: 'category',
      header: 'Category',
      cell: (sewa) => titleCase(sewa.gaushalaCategory ?? '—'),
    },
    {
      key: 'fund',
      header: 'Credits fund',
      hideOnMobile: true,
      cell: (sewa) => FUNDS.find((f) => f.id === sewa.fundId)?.name ?? '—',
    },
    {
      key: 'price',
      header: `Price (${SETTLEMENT_CURRENCY})`,
      align: 'right',
      cell: (sewa) =>
        sewa.price === null ? <span className="text-[14px] text-navy-600">Any amount</span> : <Money value={sewa.price} />,
    },
    {
      key: 'shown',
      header: `Shown as (${currency})`,
      align: 'right',
      hideOnMobile: true,
      cell: (sewa) => (
        <span className="font-mono text-[13.5px] text-navy-800 tabular-nums">
          {sewa.price === null ? '—' : displayPrice(sewa.price, currency, sewa.prices)}
          {sewa.prices?.[currency] ? (
            <span className="ml-1.5 font-sans text-[11px] font-bold text-tulsi-700 uppercase">fixed</span>
          ) : null}
        </span>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      cell: (sewa) => <StatusBadge status={sewa.active ? 'active' : 'draft'} />,
    },
    {
      key: 'actions',
      header: '',
      align: 'right',
      cell: (sewa) => (
        <div className="flex justify-end gap-1">
          <Button
            size="sm"
            variant="ghost"
            aria-label={sewa.popular ? 'Remove the popular badge' : 'Mark as popular'}
            icon={sewa.popular ? <Star className="size-4 fill-current" aria-hidden /> : <StarOff className="size-4" aria-hidden />}
            onClick={() => togglePopular(sewa)}
          />
          <Button size="sm" variant={sewa.active ? 'secondary' : 'primary'} onClick={() => toggleActive(sewa)}>
            {sewa.active ? 'Withdraw' : 'Publish'}
          </Button>
        </div>
      ),
    },
  ]

  const live = resolved.filter((s) => s.active).length
  const fixedPriced = resolved.filter((s) => s.prices && Object.keys(s.prices).length > 0).length

  return (
    <div>
      <PageHeader
        title="Sewa catalogue"
        description="What the Gaushala page offers, what it is priced at, and which fund each sewa credits."
        phase="collect"
      >
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
          <div className="sm:w-72">
            <Input
              aria-label="Search the catalogue"
              placeholder="Search sewas"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              leading={<Search className="size-4" aria-hidden />}
            />
          </div>
          <div className="sm:w-56">
            <Select
              aria-label="Filter by category"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              options={[
                { value: 'all', label: 'Every category' },
                ...SEWA_CATEGORIES.map((c) => ({ value: c.id, label: c.label })),
              ]}
            />
          </div>
          <div className="sm:w-48">
            <Select
              label="Preview currency"
              value={currency}
              onChange={(e) => setCurrency(e.target.value as Currency)}
              options={CURRENCY_CODES.map((c) => ({ value: c, label: c }))}
            />
          </div>
        </div>
      </PageHeader>

      <Card className="mb-5">
        <CardHeader
          title="How these prices reach a donor"
          description={`${live} of ${resolved.length} sewas are live. ${fixedPriced} carry an explicit price in at least one other currency.`}
        />
        <p className="text-[13.5px] leading-relaxed text-navy-700">
          Everything is held in {SETTLEMENT_CURRENCY} cents, which is what the ledger settles in. A donor abroad is
          shown their own currency — converted at the stored rate, unless this sewa has an explicit price for it, in
          which case the explicit one always wins so a sewa priced at a round number stays round. Both the rate and
          the figure the donor saw are kept on the donation.
        </p>
      </Card>

      <Table
        columns={columns}
        rows={rows}
        rowKey={(sewa) => sewa.id}
        empty={<EmptyState title="No sewa matches that" message="Try a shorter word, or clear the category filter." />}
      />
    </div>
  )
}
