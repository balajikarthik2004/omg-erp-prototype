import { Link } from 'react-router-dom'
import { ArrowRight, Flame } from 'lucide-react'

import { SECTOR_IDS, SECTORS, type SectorId } from '@/config'
import { cn } from '@/lib/cn'
import { formatMoney, formatPct } from '@/lib/format'
import { Button } from '@/components/ui/Button'
import { Money } from '@/components/ui/Money'
import { Divider } from '@/components/ui/Ornament'
import { ArchPhoto, Photo } from '@/components/ui/Photo'
import type { PhotoKey } from '@/lib/photos'
import { useDb } from '@/store/db'
import { CATALOG } from '@/mock/seed'

const QUICK_GIVE = [1100, 2100, 5100, 10100, 10800]

/** Each sector card is headed by its own photograph. */
const SECTOR_PHOTO: Record<SectorId, { photo: PhotoKey; rule: string }> = {
  temple: { photo: 'temple', rule: 'bg-kumkum-600' },
  sevalaya: { photo: 'sevalaya', rule: 'bg-tulsi-500' },
  sangam: { photo: 'sangam', rule: 'bg-peacock-500' },
}

const PROMISES = [
  {
    n: '01',
    title: 'Receipted at once',
    body: 'Your receipt number is issued the moment the offering is made, with the fund it belongs to named on it.',
  },
  {
    n: '02',
    title: 'Two signatures to spend',
    body: 'Whoever prepares a payment can never approve it. Every rupee leaving needs a second pair of eyes.',
  },
  {
    n: '03',
    title: 'Restricted stays restricted',
    body: 'A gift to the kitchen cannot quietly become a gift to something else. The system refuses it.',
  },
]

export function HomePage() {
  const projects = useDb((s) => s.projects)
  const featured = projects.find((p) => p.id === 'prj-rajagopuram') ?? projects[0]
  const progress = featured ? Math.min(100, (featured.raised / featured.goal) * 100) : 0

  return (
    <div>
      {/* Festival strip */}
      <div className="border-b border-sandal-200 bg-sandal-100">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-x-4 gap-y-1.5 px-5 py-2.5 sm:px-8">
          <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold tracking-[0.14em] text-kumkum-700 uppercase">
            <Flame className="size-3.5" aria-hidden />
            Navaratri
          </span>
          <p className="text-[14px] text-stone-700">
            Nine nights of golu, music and sundal prasadam. Sponsorships are open for every evening.
          </p>
          <Link
            to="/donate/temple"
            className="ml-auto inline-flex shrink-0 items-center gap-1 text-[14px] font-medium text-kumkum-700 hover:underline"
          >
            Sponsor an evening
            <ArrowRight className="size-4" aria-hidden />
          </Link>
        </div>
      </div>

      {/* Hero — warm paper, with the one piece of imagery */}
      <section className="mx-auto max-w-6xl px-5 sm:px-8">
        <div className="grid items-center gap-10 py-14 lg:grid-cols-[1.05fr_0.95fr] lg:gap-16 lg:py-20">
          <div className="animate-rise">
            <p className="text-[11px] font-semibold tracking-[0.18em] text-turmeric-700 uppercase">
              Temple · Sevalaya · Tamil Sangam
            </p>

            <h1 className="mt-5 font-display text-[32px] leading-[1.12] text-stone-900 sm:mt-6 sm:text-[48px] sm:leading-[1.08] lg:text-[56px]">
              Give once.
              <br className="hidden sm:block" />{' '}
              <span className="text-kumkum-700">Follow it</span> all the way
              <br className="hidden sm:block" />{' '}
              to the lamp it lights.
            </h1>

            <p className="mt-6 max-w-lg text-[16px] leading-[1.7] text-stone-700 sm:mt-7 sm:text-[17px]">
              Offerings for the கோவில், the சேவாலயா and the தமிழ்ச் சங்கம், kept in one honest ledger. You can see
              the fund your gift sits in, and the work it paid for.
            </p>

            <div className="mt-8 flex flex-col gap-3 sm:mt-9 sm:flex-row sm:items-center">
              <a href="#sectors" className="contents">
                <Button size="lg" className="w-full sm:w-auto">
                  Make an offering
                </Button>
              </a>
              <Link to="/console" className="contents">
                <Button size="lg" variant="secondary" className="w-full sm:w-auto">
                  See how the money is tracked
                </Button>
              </Link>
            </div>
          </div>

          <div className="flex justify-center lg:justify-end">
            <ArchPhoto photo="temple" priority className="aspect-[4/5] w-full max-w-[400px]" />
          </div>
        </div>
      </section>

      {/* Quick give */}
      <section className="border-y border-sandal-200 bg-sandal-100">
        <div className="mx-auto max-w-6xl px-5 py-9 sm:px-8">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h2 className="font-display text-[22px] text-stone-900">Quick hundi offering</h2>
              <p className="mt-1 text-[14px] text-stone-500">
                Straight to the Temple General Fund. No details needed.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              {QUICK_GIVE.map((amount) => (
                <Link key={amount} to={`/donate/temple/cat-tmp-hundi?amount=${amount}`}>
                  <span
                    className={cn(
                      'inline-flex h-11 items-center rounded-lg border border-sandal-300 bg-sandal-50 px-5',
                      'font-mono text-[15px] text-stone-900 tabular-nums transition-colors duration-150',
                      'hover:border-kumkum-600 hover:bg-kumkum-50 hover:text-kumkum-700',
                    )}
                  >
                    {formatMoney(amount)}
                  </span>
                </Link>
              ))}
              <Link
                to="/donate/temple/cat-tmp-hundi"
                className="ml-1 text-[14px] font-medium text-kumkum-700 hover:underline"
              >
                Another amount →
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Sectors */}
      <section id="sectors" className="mx-auto max-w-6xl scroll-mt-20 px-5 py-20 sm:px-8">
        <div className="mx-auto max-w-xl text-center">
          <p className="text-[11px] font-semibold tracking-[0.18em] text-turmeric-700 uppercase">Where to give</p>
          <h2 className="mt-3 font-display text-[27px] leading-tight text-stone-900 sm:text-[38px]">
            Three houses, one ledger
          </h2>
          <p className="mt-3 text-[15px] leading-relaxed text-stone-500">
            Each keeps its own funds and its own books. The rules that govern them are the same.
          </p>
          <Divider className="mx-auto mt-7 max-w-[200px]" />
        </div>

        <div className="mt-12 grid gap-6 md:grid-cols-3">
          {SECTOR_IDS.map((id) => {
            const sector = SECTORS[id]
            const count = CATALOG.filter((c) => c.sectorId === id && c.active).length
            return (
              <Link
                key={id}
                to={`/donate/${id}`}
                className={cn(
                  'group flex flex-col overflow-hidden rounded-card border border-sandal-200 bg-sandal-50',
                  'transition-all duration-200 hover:-translate-y-1 hover:border-sandal-300 hover:shadow-lift',
                )}
              >
                <div className="relative h-44 overflow-hidden">
                  <Photo
                    photo={SECTOR_PHOTO[id].photo}
                    wash
                    className="h-full w-full"
                    imgClassName="transition-transform duration-500 group-hover:scale-[1.04]"
                  />
                  <span className={cn('absolute inset-x-0 bottom-0 h-1', SECTOR_PHOTO[id].rule)} aria-hidden />
                </div>

                <div className="flex flex-1 flex-col p-7">
                  <h3 className="font-display text-[24px] leading-tight text-stone-900">{sector.name}</h3>
                  <p className="mt-1 font-display text-[17px] text-stone-500">{sector.tamil}</p>

                  <p className="mt-4 flex-1 text-[15px] leading-relaxed text-stone-700">{sector.blurb}</p>

                  <div className="mt-7 flex items-center justify-between border-t border-sandal-200 pt-5">
                    <span className="text-[13px] text-stone-500">{count} ways to give</span>
                    <span className="inline-flex items-center gap-1.5 text-[14px] font-medium text-kumkum-700">
                      Open
                      <ArrowRight
                        className="size-4 transition-transform duration-200 group-hover:translate-x-1"
                        aria-hidden
                      />
                    </span>
                  </div>
                </div>
              </Link>
            )
          })}
        </div>
      </section>

      {/* The three promises */}
      <section className="border-y border-sandal-200 bg-sandal-100">
        <div className="mx-auto max-w-6xl px-5 py-16 sm:px-8">
          <h2 className="max-w-xl font-display text-[25px] leading-tight text-stone-900 sm:text-[32px]">
            Why a devotee can trust where it goes
          </h2>
          <div className="mt-10 grid gap-10 sm:grid-cols-3">
            {PROMISES.map((p) => (
              <div key={p.n}>
                <p className="font-mono text-[13px] tracking-widest text-turmeric-700 tabular-nums">{p.n}</p>
                <div className="mt-3 h-px w-10 bg-turmeric-400" />
                <h3 className="mt-4 font-display text-[19px] text-stone-900">{p.title}</h3>
                <p className="mt-2 text-[15px] leading-relaxed text-stone-700">{p.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Featured project */}
      {featured ? (
        <section className="mx-auto max-w-6xl px-5 py-20 sm:px-8">
          <div className="grid items-center gap-10 lg:grid-cols-[1fr_420px] lg:gap-14">
            <div>
              <p className="text-[11px] font-semibold tracking-[0.18em] text-turmeric-700 uppercase">
                Featured project
              </p>
              <h2 className="mt-3 font-display text-[27px] leading-tight text-stone-900 sm:text-[38px]">
                {featured.name}
              </h2>
              <p className="mt-4 max-w-lg text-[16px] leading-[1.7] text-stone-700">{featured.summary}</p>
              <Link to={`/donate/${featured.sectorId}/cat-tmp-raja`} className="mt-8 inline-block">
                <Button size="lg">Give to this project</Button>
              </Link>
            </div>

            <div className="overflow-hidden rounded-card border border-sandal-200 bg-sandal-100">
              <Photo
                photo="project"
                wash
                position="50% 38%"
                filter="sepia(0.16) saturate(1.12)"
                className="h-48 w-full"
              />
              <div className="p-7">
              <p className="text-[11px] font-semibold tracking-[0.12em] text-stone-500 uppercase">Raised so far</p>
              <Money value={featured.raised} className="mt-2 block font-display text-[36px] text-stone-900" />
              <p className="mt-1 text-[14px] text-stone-500">of {formatMoney(featured.goal)} needed</p>

              <div
                className="mt-6 h-2 w-full overflow-hidden rounded-full bg-sandal-300"
                role="img"
                aria-label={`${formatPct(progress, 0)} of the goal raised`}
              >
                <span className="block h-full rounded-full bg-kumkum-600" style={{ width: `${progress}%` }} />
              </div>

              <div className="mt-3 flex items-baseline justify-between">
                <span className="font-mono text-[14px] text-kumkum-700 tabular-nums">{formatPct(progress, 0)}</span>
                <span className="text-[13px] text-stone-500">
                  {formatMoney(featured.goal - featured.raised)} still to find
                </span>
              </div>
              </div>
            </div>
          </div>
        </section>
      ) : null}
    </div>
  )
}
