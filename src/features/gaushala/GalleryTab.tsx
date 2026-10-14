import { useState } from 'react'
import { Play } from 'lucide-react'

import { cn } from '@/lib/cn'
import { formatDate } from '@/lib/format'
import { Tabs } from '@/components/ui/Tabs'
import { useDb } from '@/store/db'
import type { GalleryCategory } from '@/types'
import { GalleryPlate } from './GaushalaArt'
import { NoMatches } from './NoMatches'

const CATEGORIES: { id: GalleryCategory | 'all'; label: string }[] = [
  { id: 'all', label: 'Everything' },
  { id: 'daily_life', label: 'Daily life' },
  { id: 'rescue', label: 'Rescue & care' },
  { id: 'festival', label: 'Festivals' },
  { id: 'seva', label: 'Sewas' },
  { id: 'shelter', label: 'The shelter' },
]

export function GalleryTab({ query, onClearQuery }: { query: string; onClearQuery: () => void }) {
  const gallery = useDb((s) => s.gaushalaGallery)
  const [category, setCategory] = useState<GalleryCategory | 'all'>('all')

  const q = query.trim().toLowerCase()
  const visible = gallery.filter(
    (item) =>
      (category === 'all' || item.category === category) &&
      (q === '' || item.title.toLowerCase().includes(q) || item.caption.toLowerCase().includes(q)),
  )

  return (
    <div>
      <Tabs
        value={category}
        onChange={(id) => setCategory(id as GalleryCategory | 'all')}
        items={CATEGORIES.map((c) => ({
          id: c.id,
          label: c.label,
          count: c.id === 'all' ? gallery.length : gallery.filter((g) => g.category === c.id).length,
        }))}
      />

      <p className="mt-4 text-[13px] text-stone-500">
        Stand-in pictures taken from the shelter photograph while the full gallery is being uploaded. The captions
        are what each entry is really about.
      </p>

      <div className="mt-7">
        {visible.length === 0 ? (
          <NoMatches what="picture" query={query} onClear={onClearQuery} />
        ) : (
          <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {visible.map((item) => (
              <li key={item.id}>
                <figure
                  className={cn(
                    'group h-full overflow-hidden rounded-card border border-sandal-200 bg-white shadow-card',
                    'transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lift',
                  )}
                >
                  <div className="relative aspect-4/3">
                    <GalleryPlate art={item.art} />
                    {item.kind === 'video' ? (
                      <span className="absolute inset-0 flex items-center justify-center">
                        <span className="flex size-12 items-center justify-center rounded-full bg-navy-950/70 text-white shadow-lift backdrop-blur-sm">
                          <Play className="size-5 translate-x-0.5" aria-hidden />
                        </span>
                      </span>
                    ) : null}
                  </div>
                  <figcaption className="p-4">
                    <h3 className="font-display text-[17px] leading-snug text-stone-900">{item.title}</h3>
                    <p className="mt-1 text-[13.5px] leading-relaxed text-stone-700">{item.caption}</p>
                    <p className="mt-2 text-[12px] text-stone-500">{formatDate(item.at)}</p>
                  </figcaption>
                </figure>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}
