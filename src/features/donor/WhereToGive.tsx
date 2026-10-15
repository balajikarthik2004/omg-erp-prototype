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
    subtitle: string
    blurb: string
    cardBg: string
    tileBg: string
    tileColor: string
    accentBar: string
    waysText: string
    tagColor: string
    exploreColor: string
    popular?: boolean
    renderIcon: () => React.ReactNode
  }
> = {
  temple: {
    photo: 'temple',
    position: '50% 70%',
    subtitle: 'Sacred Worship & Seva',
    blurb: 'Hundi, poojas, festivals and temple projects that preserve our heritage.',
    cardBg: 'bg-linear-to-b from-white via-rose-50/30 to-white',
    tileBg: 'bg-linear-to-br from-kumkum-500 to-kumkum-600',
    tileColor: 'text-white shadow-md shadow-kumkum-500/25',
    accentBar: 'bg-linear-to-r from-kumkum-500 to-kumkum-600',
    waysText: '18 ways to give',
    tagColor: 'text-kumkum-600 font-bold',
    exploreColor: 'text-kumkum-600 font-bold',
    popular: true,
    renderIcon: () => <TempleGopuramIcon size={28} />,
  },
  sevalaya: {
    photo: 'sevalaya',
    position: '50% 55%',
    subtitle: 'Annadhanam & Social Care',
    blurb: 'Annadhanam, education and welfare programmes for all.',
    cardBg: 'bg-linear-to-b from-white via-emerald-50/30 to-white',
    tileBg: 'bg-linear-to-br from-tulsi-500 to-tulsi-600',
    tileColor: 'text-white shadow-md shadow-tulsi-500/25',
    accentBar: 'bg-linear-to-r from-tulsi-500 to-tulsi-600',
    waysText: '9 ways to give',
    tagColor: 'text-tulsi-600 font-bold',
    exploreColor: 'text-tulsi-600 font-bold',
    renderIcon: () => <AnnadhanamBowlIcon size={28} />,
  },
  sangam: {
    photo: 'sangam',
    position: '50% 46%',
    subtitle: 'Heritage, Arts & Culture',
    blurb: 'Memberships, cultural events, classes and community projects.',
    cardBg: 'bg-linear-to-b from-white via-navy-50/35 to-white',
    tileBg: 'bg-linear-to-br from-navy-600 to-navy-700',
    tileColor: 'text-white shadow-md shadow-navy-600/25',
    accentBar: 'bg-linear-to-r from-navy-500 to-navy-600',
    waysText: '12 ways to give',
    tagColor: 'text-navy-600 font-bold',
    exploreColor: 'text-navy-600 font-bold',
    renderIcon: () => <TraditionalDeepamIcon size={28} />,
  },
}

function Eyebrow({ children }: { children: string }) {
  return (
    <p className="flex items-center justify-center gap-3 text-[12px] font-bold tracking-[0.24em] text-kumkum-600 uppercase">
      <span className="h-px w-9 bg-kumkum-300" aria-hidden />
      {children}
      <span className="h-px w-9 bg-kumkum-300" aria-hidden />
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
    <section ref={ref} id="sectors" className="relative isolate scroll-mt-20 overflow-hidden bg-linear-to-b from-[#F2F4FC] via-[#E8ECFA] to-[#F0F2FA] py-8 sm:py-10 lg:py-12">
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

      <div className={cn('mx-auto max-w-6xl px-4 sm:px-6 lg:px-8', 'reveal', seen && 'is-visible')}>
        <div className="text-center">
          <Eyebrow>Where to give</Eyebrow>
          <h2 className="mt-2.5 sm:mt-3 font-heritage text-[26px] sm:text-[34px] md:text-[40px] lg:text-[44px] leading-[1.1] font-bold text-stone-900">
            Three houses, <span className="text-kumkum-600 font-extrabold">one ledger</span>
          </h2>
          <p className="mx-auto mt-2 sm:mt-2.5 max-w-2xl text-[14.5px] sm:text-[15.5px] lg:text-[16px] leading-relaxed text-stone-700">
            Each offering finds its right place, supporting the temple, its rituals and the community.
          </p>
          <CrownOrnamentDivider className="mx-auto mt-3" />
        </div>

        <ul className="mt-6 sm:mt-8 grid gap-5 sm:gap-6 md:grid-cols-3">
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
                    'group relative flex h-full flex-col overflow-hidden rounded-2xl shadow-md hover:shadow-2xl',
                    config.cardBg,
                    'transition-all duration-300 hover:-translate-y-1.5',
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
                      <span className="absolute top-3 right-3 inline-flex items-center gap-1.5 rounded-full bg-kumkum-600 px-3 py-1 text-[11px] font-extrabold text-white shadow-sm uppercase tracking-wider">
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
                        <h3 className="font-heritage text-[22px] leading-none font-bold text-stone-900 sm:text-[30px]">
                          {sector.name}
                        </h3>
                        <p className={cn('mt-1.5 text-[12.5px] font-bold tracking-wider uppercase', config.tagColor)}>{config.subtitle}</p>
                      </div>
                    </div>

                    <p className="mt-4 flex-1 text-[15px] leading-relaxed text-stone-700">{config.blurb}</p>

                    <div className="mt-5 flex items-center justify-between border-t border-sandal-200/90 pt-4">
                      <span className="inline-flex items-center gap-2 text-[14px] font-semibold text-stone-700">
                        <Clock3 className="size-4.25 text-kumkum-600" aria-hidden />
                        {waysDisplay}
                      </span>
                      <span className={cn('inline-flex items-center gap-1.5 text-[14px] transition-transform duration-200 group-hover:translate-x-0.5', config.exploreColor)}>
                        Explore
                        <ArrowRight className="size-4 transition-transform duration-200 group-hover:translate-x-1" aria-hidden />
                      </span>
                    </div>
                  </div>

                  {/* Bottom Color Accent Line */}
                  <span className={cn('h-1.5 w-full', config.accentBar)} aria-hidden />
                </Link>
              </li>
            )
          })}
        </ul>
      </div>
    </section>
  )
}
