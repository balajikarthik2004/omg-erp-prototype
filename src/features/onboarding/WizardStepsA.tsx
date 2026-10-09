import { Check } from 'lucide-react'

import { SECTORS, SECTOR_IDS, CATEGORY_LABEL } from '@/config'
import { cn } from '@/lib/cn'
import { Input } from '@/components/ui/Input'
import type { ModuleKey, SectorId } from '@/types'
import { BRANDS, MODULE_LABELS, VERTICAL_TEMPLATES, initialsOf, templateCounts, type Draft } from './wizard'

export interface StepProps {
  draft: Draft
  set: (patch: Partial<Draft>) => void
}

export function CustomerStep({ draft, set }: StepProps) {
  return (
    <div className="grid gap-5 sm:grid-cols-2">
      <Input label="Customer name" placeholder="Sri Vinayaka Temple Trust" value={draft.name} onChange={(e) => set({ name: e.target.value })} />
      <Input
        label="Domain"
        placeholder="give.example.org"
        value={draft.domain}
        onChange={(e) => set({ domain: e.target.value })}
        hint="The donor site is served from this address."
      />
      <div className="sm:col-span-2">
        <Input
          label="Address"
          placeholder="14 Temple Street, Madurai 625001"
          value={draft.address}
          onChange={(e) => set({ address: e.target.value })}
        />
      </div>
      <div className="sm:col-span-2">
        <p className="mb-1.5 text-[13px] font-medium text-stone-700">Brand colour</p>
        <div className="flex flex-wrap items-center gap-3">
          {BRANDS.map((b) => (
            <button
              key={b.id}
              type="button"
              aria-pressed={draft.brand === b.id}
              onClick={() => set({ brand: b.id })}
              className={cn(
                'inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-[14px] transition-colors duration-150',
                draft.brand === b.id ? 'border-stone-900 bg-sandal-100 font-medium' : 'border-sandal-300 hover:border-stone-500',
              )}
            >
              <span className={cn('size-4 rounded-full', b.swatch)} aria-hidden />
              {b.label}
            </button>
          ))}
          <span className="ml-auto flex items-center gap-2 text-[13px] text-stone-500">
            Logo mark
            <span className={cn('flex size-9 items-center justify-center rounded-md font-display text-[15px] text-sandal-50', BRANDS.find((b) => b.id === draft.brand)?.swatch)}>
              {initialsOf(draft.name)}
            </span>
          </span>
        </div>
      </div>
    </div>
  )
}

export function ModulesStep({ draft, set }: StepProps) {
  const toggleVertical = (id: SectorId) =>
    set({ verticals: draft.verticals.includes(id) ? draft.verticals.filter((v) => v !== id) : [...draft.verticals, id] })
  const toggleModule = (key: ModuleKey) =>
    set({ modules: draft.modules.includes(key) ? draft.modules.filter((m) => m !== key) : [...draft.modules, key] })

  return (
    <div className="flex flex-col gap-7">
      <section>
        <h3 className="mb-3 text-[11px] font-semibold tracking-[0.12em] text-stone-500 uppercase">Verticals</h3>
        <div className="grid gap-3 md:grid-cols-3">
          {SECTOR_IDS.map((id) => {
            const on = draft.verticals.includes(id)
            return (
              <button
                key={id}
                type="button"
                aria-pressed={on}
                onClick={() => toggleVertical(id)}
                className={cn(
                  'rounded-card border p-4 text-left transition-colors duration-150',
                  on ? 'border-stone-900 bg-sandal-100' : 'border-sandal-200 bg-sandal-50 hover:border-sandal-300',
                )}
              >
                <span className="flex items-center justify-between">
                  <span className="font-display text-[18px] text-stone-900">{SECTORS[id].name}</span>
                  {on ? <Check className="size-4 text-tulsi-700" aria-hidden /> : null}
                </span>
                <span className="mt-1 block text-[13px] leading-relaxed text-stone-500">{VERTICAL_TEMPLATES[id]}</span>
              </button>
            )
          })}
        </div>
      </section>

      <section>
        <h3 className="mb-3 text-[11px] font-semibold tracking-[0.12em] text-stone-500 uppercase">Modules</h3>
        <ul className="grid gap-2 sm:grid-cols-2">
          {(Object.keys(MODULE_LABELS) as ModuleKey[]).map((key) => (
            <li key={key}>
              <label className="flex cursor-pointer items-start gap-3 rounded-lg border border-sandal-200 px-3 py-2.5 hover:bg-sandal-100">
                <input
                  type="checkbox"
                  checked={draft.modules.includes(key)}
                  onChange={() => toggleModule(key)}
                  className="mt-1 size-4 accent-kumkum-600"
                />
                <span>
                  <span className="block text-[14px] text-stone-900">{MODULE_LABELS[key].label}</span>
                  <span className="block text-[13px] text-stone-500">{MODULE_LABELS[key].hint}</span>
                </span>
              </label>
            </li>
          ))}
        </ul>
      </section>
    </div>
  )
}

export function CatalogStep({ draft }: StepProps) {
  const t = templateCounts(draft.verticals)
  return (
    <div className="flex flex-col gap-5">
      <p className="text-[14px] text-stone-700">
        The template for the chosen verticals loads when the customer goes live. Prices can be changed afterwards in the catalog
        manager.
      </p>
      <div className="grid gap-3 sm:grid-cols-3">
        {[
          ['Catalog items', t.catalog.length],
          ['Funds', t.funds],
          ['Budget heads', t.budgets],
        ].map(([label, n]) => (
          <div key={label} className="rounded-card border border-sandal-200 bg-sandal-100 p-4">
            <p className="text-[11px] font-semibold tracking-[0.12em] text-stone-500 uppercase">{label}</p>
            <p className="mt-1 font-display text-[28px] leading-none text-stone-900">{n}</p>
          </div>
        ))}
      </div>
      <ul className="flex flex-col divide-y divide-sandal-200 rounded-card border border-sandal-200">
        {draft.verticals.map((id) => {
          const items = t.catalog.filter((c) => c.sectorId === id)
          const cats = [...new Set(items.map((i) => i.category))]
          return (
            <li key={id} className="px-4 py-3 text-[14px]">
              <span className="font-medium text-stone-900">{SECTORS[id].name}</span>
              <span className="ml-2 text-stone-500">
                {items.length} items across {cats.map((c) => CATEGORY_LABEL[c]).join(', ')}
              </span>
            </li>
          )
        })}
      </ul>
      <p className="text-[13px] text-stone-500">
        Also loaded: {t.inventory} stock items at zero, the supplier master, and two open accounting months.
      </p>
    </div>
  )
}
