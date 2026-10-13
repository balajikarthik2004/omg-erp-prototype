import { Link } from 'react-router-dom'
import { ArrowRight, Clock3, Star } from 'lucide-react'

import { SECTOR_IDS, SECTORS, type SectorId } from '@/config'
import { cn } from '@/lib/cn'
import { Etching } from '@/components/ui/Ornament'
import { Photo } from '@/components/ui/Photo'
import type { PhotoKey } from '@/lib/photos'
import { CATALOG } from '@/mock/seed'
import { useDb } from '@/store/db'
import {
  TempleGopuramIcon,
  AnnadhanamBowlIcon,
  TraditionalDeepamIcon,
  CrownOrnamentDivider,
} from './HeritageArt'
import { useReveal } from './useReveal'

/** Visual identity configuration for each of the three houses */
const CARD_CONFIG: Record<
  SectorId,
  {
    photo: PhotoKey
    position: string
    tamil: string
    blurb: string
    tileBg: string
    tileColor: string
    accentBar: string
    waysText: string
    popular?: boolean
    renderIcon: () => React.ReactNode
  }
> = {
  temple: {
    photo: 'temple',
    position: '50% 70%',
    tamil: 'கோவில்',
    blurb: 'Hundi, poojas, festivals and temple projects that preserve our heritage.',
    tileBg: 'bg-kumkum-50',
    tileColor: 'text-kumkum-600',
    accentBar: 'bg-kumkum-600',
    waysText: '18 ways to give',
    popular: true,
    renderIcon: () => <TempleGopuramIcon size={28} />,
  },
  sevalaya: {
    photo: 'sevalaya',
    position: '50% 55%',
    tamil: 'சேவாலயா',
    blurb: 'Annadhanam, education and welfare programmes for all.',
    tileBg: 'bg-tulsi-50',
    tileColor: 'text-tulsi-500',
    accentBar: 'bg-tulsi-500',
    waysText: '9 ways to give',
    renderIcon: () => <AnnadhanamBowlIcon size={28} />,
  },
  sangam: {
    photo: 'sangam',
    position: '50% 46%',
    tamil: 'தமிழ்ச்சங்கம்',
    blurb: 'Memberships, cultural events, classes and community projects.',
    tileBg: 'bg-navy-50',
    tileColor: 'text-navy-400',
    accentBar: 'bg-navy-400',
    waysText: '12 ways to give',
    renderIcon: () => <TraditionalDeepamIcon size={28} />,
  },
}

function Eyebrow({ children }: { children: string }) {
  return (
    <p className="flex items-center justify-center gap-3 text-[12px] font-semibold tracking-[0.24em] text-navy-600 uppercase">
      <span className="h-px w-9 bg-navy-300/70" aria-hidden />
      {children}
      <span className="h-px w-9 bg-navy-300/70" aria-hidden />
    </p>
  )
}

/**
 * Step 2 of the donor journey: Three houses, one ledger
 */
export function WhereToGive() {
  const tenant = useDb((s) => s.tenants.find((t) => t.id === s.activeTenantId))
  const ids = SECTOR_IDS.filter((id) => !tenant || tenant.verticals.includes(id))
  const { ref, seen } = useReveal<HTMLElement>()

  return (
    <section ref={ref} id="sectors" className="relative isolate scroll-mt-20 overflow-hidden bg-sandal-50 py-16 sm:py-20">
      {/* Authentic Vintage Heritage Background Etchings (Zero background / transparent PNG) */}
      <div
        className="pointer-events-none absolute top-8 -left-20 -z-10 hidden h-170 w-90 opacity-[0.22] lg:block xl:-left-16 xl:h-180 xl:w-100"
        aria-hidden
      >
        <Etching
          src="/images/bg-gopuram-etching.png"
          className="bg-navy-600"
          position="top left"
        />
      </div>

      {/* Right Side Mandala Artwork (Soft Sepia Tone Matching Left Gopuram) */}
      <div
        className="pointer-events-none absolute top-1/2 -right-2 -z-10 hidden h-135 w-95 translate-y-[-45%] opacity-[0.22] lg:block xl:h-145 xl:w-105"
        aria-hidden
      >
        <img
          src="/images/bg-where-mandala.png"
          alt=""
          className="h-full w-full object-contain object-right"
        />
      </div>

      <div className={cn('mx-auto max-w-6xl px-5 sm:px-8', 'reveal', seen && 'is-visible')}>
        <div className="text-center">
          <Eyebrow>Where to give</Eyebrow>
          <h2 className="mt-4 font-heritage text-[30px] leading-[1.08] font-normal text-stone-900 sm:text-[52px]">
            Three houses, <span className="text-kumkum-600">one ledger</span>
          </h2>
          <p className="mx-auto mt-3.5 max-w-2xl text-[16px] leading-relaxed text-stone-700 sm:text-[17px]">
            Each offering finds its right place, supporting the temple, its rituals and the community.
          </p>
          <CrownOrnamentDivider className="mx-auto mt-4" />
        </div>

        <ul className="mt-12 grid gap-7 md:grid-cols-3">
          {ids.map((id, i) => {
            const sector = SECTORS[id]
            const config = CARD_CONFIG[id]
            const count = CATALOG.filter((c) => c.sectorId === id && c.active).length
            const waysDisplay = count > 0 ? `${count} ways to give` : config.waysText

            return (
              <li key={id} className={cn('reveal', seen && 'is-visible')} style={{ transitionDelay: `${i * 100}ms` }}>
                <Link
                  to={`/donate/${id}`}
                  className={cn(
                    'group relative flex h-full flex-col overflow-hidden rounded-2xl border border-sandal-200 bg-[#FFFDF8] shadow-card',
                    'transition-all duration-300 hover:-translate-y-1 hover:shadow-lift',
                    'focus-visible:ring-2 focus-visible:ring-navy-400 focus-visible:ring-offset-2 focus-visible:outline-none',
                  )}
                >
                  {/* Card Image Header */}
                  <div className="relative h-45.5 overflow-hidden bg-sandal-100">
                    <Photo
                      photo={config.photo}
                      position={config.position}
                      filter="brightness(1.05) saturate(1.1)"
                      priority
                      className="h-full w-full"
                      imgClassName="transition-transform duration-500 group-hover:scale-[1.03]"
                    />
                    {config.popular ? (
                      <span className="absolute top-3 right-3 inline-flex items-center gap-1.5 rounded-md bg-navy-400 px-2.5 py-1 text-[12px] font-semibold text-white shadow-sm">
                        <Star className="size-3 fill-white" aria-hidden />
                        Popular
                      </span>
                    ) : null}
                  </div>

                  {/* Card Content */}
                  <div className="flex flex-1 flex-col px-6 pt-5 pb-6">
                    <div className="flex items-center gap-4">
                      <span
                        className={cn(
                          'flex size-13.5 shrink-0 items-center justify-center rounded-xl shadow-xs',
                          config.tileBg,
                          config.tileColor,
                        )}
                      >
                        {config.renderIcon()}
                      </span>
                      <div className="min-w-0">
                        <h3 className="font-heritage text-[22px] leading-none font-medium text-stone-900 sm:text-[32px]">
                          {sector.name}
                        </h3>
                        <p className="mt-1 text-[16px] text-stone-600">{config.tamil}</p>
                      </div>
                    </div>

                    <p className="mt-4 flex-1 text-[15px] leading-relaxed text-stone-700">{config.blurb}</p>

                    <div className="mt-5 flex items-center justify-between border-t border-sandal-200/90 pt-4">
                      <span className="inline-flex items-center gap-2 text-[14px] text-stone-700">
                        <Clock3 className="size-4.25 text-[#A8241A]" aria-hidden />
                        {waysDisplay}
                      </span>
                      <span className="inline-flex items-center gap-1.5 text-[14px] font-semibold text-kumkum-600">
                        Explore
                        <ArrowRight className="size-4 transition-transform duration-200 group-hover:translate-x-1" aria-hidden />
                      </span>
                    </div>
                  </div>

                  {/* Bottom Color Accent Line */}
                  <span className={cn('h-[3.5px] w-full', config.accentBar)} aria-hidden />
                </Link>
              </li>
            )
          })}
        </ul>
      </div>
    </section>
  )
}
