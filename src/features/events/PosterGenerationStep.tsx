import { useEffect, useState } from 'react'
import { Check, Image as ImageIcon, Loader2, Sparkles, TriangleAlert } from 'lucide-react'

import { cn } from '@/lib/cn'
import { useDb } from '@/store/db'
import type { User } from '@/types'

import { PosterPreview } from './PosterPreview'
import { useEvent } from './useEvent'
import { selectPosterTheme } from './logic/posterThemes'
import { VARIANTS } from './logic/poster'

/** What the model is doing, in the order it does it. */
const STAGES = [
  { label: 'Reading the event record', detail: 'Name, date, venue, contact and ticket price' },
  { label: 'Choosing a theme', detail: 'Matched against the event type and the words in the name' },
  { label: 'Composing three designs', detail: 'One per house theme, so there is a choice' },
  { label: 'Printing the words, logo and QR', detail: 'Typeset from the record, never retyped' },
] as const

/** Roughly how long each stage runs. Uneven on purpose — real work is. */
const STAGE_MS = [620, 540, 980, 760]

export function PosterGenerationStep({
  eventId,
  user,
  onDone,
}: {
  eventId: string
  user: User
  /** Called when the step is finished, whether a design was chosen or not. */
  onDone: () => void
}) {
  const view = useEvent(eventId)
  const generatePosters = useDb((s) => s.generatePosters)
  const selectPoster = useDb((s) => s.selectPoster)

  const [stage, setStage] = useState(0)
  const [error, setError] = useState<string>()
  const [chosenId, setChosenId] = useState<string>()

  const designs = view?.designs ?? []
  const done = stage >= STAGES.length

  // Walk the stages, then ask the store for the designs. The timers are the
  // only pretend part: the designs themselves come from the real generator,
  // off the event record that was just saved.
  // No "have I run already" ref here: under StrictMode the effect mounts,
  // cleans up, then mounts again, so such a guard skips the second mount and
  // leaves no timers at all. Cleanup clearing the timers is what makes a
  // second run harmless.
  useEffect(() => {
    let alive = true
    const timers: number[] = []
    let elapsed = 0

    STAGE_MS.forEach((ms, i) => {
      elapsed += ms
      timers.push(
        window.setTimeout(() => {
          if (alive) setStage(i + 1)
        }, elapsed),
      )
    })

    timers.push(
      window.setTimeout(() => {
        if (!alive) return
        const result = generatePosters(eventId, user)
        if (!result.ok) setError(result.error)
      }, elapsed),
    )

    return () => {
      alive = false
      timers.forEach(window.clearTimeout)
    }
  }, [eventId, user, generatePosters])

  if (!view) return null

  const pick = selectPosterTheme(view.event)
  const recommendedId = pick.theme.id

  function choose(designId: string) {
    const result = selectPoster(eventId, designId, user)
    if (!result.ok) {
      setError(result.error)
      return
    }
    setChosenId(designId)
    onDone()
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="rounded-card border border-turmeric-200 bg-turmeric-50 px-4 py-3">
        <p className="flex items-center gap-2 text-[13px] font-semibold text-turmeric-700">
          <Sparkles className="size-4" aria-hidden />
          AI poster studio
        </p>
        <p className="mt-1 text-[13px] leading-relaxed text-stone-700">
          {done && !error
            ? 'Three designs, drawn from the record you just saved. Pick one now or leave it — the poster studio stays open on the event.'
            : 'Designs are being composed from the event you just saved. Nothing here is retyped, so the poster cannot disagree with the record.'}
        </p>
      </div>

      <ol className="flex flex-col gap-2.5" aria-live="polite">
        {STAGES.map((s, i) => {
          const state = stage > i ? 'done' : stage === i ? 'running' : 'waiting'
          return (
            <li key={s.label} className="flex items-start gap-2.5">
              <span
                className={cn(
                  'mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full border',
                  state === 'done' && 'border-transparent bg-tulsi-500 text-white',
                  state === 'running' && 'border-turmeric-400 bg-turmeric-50 text-turmeric-700',
                  state === 'waiting' && 'border-sandal-300 bg-sandal-50 text-stone-500',
                )}
              >
                {state === 'done' ? (
                  <Check className="size-3" aria-hidden />
                ) : state === 'running' ? (
                  <Loader2 className="size-3 animate-spin" aria-hidden />
                ) : (
                  <span className="size-1.5 rounded-full bg-current" aria-hidden />
                )}
              </span>
              <div className="min-w-0">
                <p
                  className={cn(
                    'text-[13.5px]',
                    state === 'waiting' ? 'text-stone-500' : 'font-medium text-stone-900',
                  )}
                >
                  {s.label}
                </p>
                <p className="text-[12.5px] text-stone-500">{s.detail}</p>
              </div>
            </li>
          )
        })}
      </ol>

      {done ? (
        <p className="rounded-lg border border-sandal-200 bg-sandal-100 px-3 py-2.5 text-[13px] text-stone-700">
          <span className="font-medium text-stone-900">
            {VARIANTS.find((v) => v.id === recommendedId)?.label ?? recommendedId} recommended.
          </span>{' '}
          {pick.reason}
        </p>
      ) : null}

      {error ? (
        <p
          role="alert"
          className="flex items-start gap-2 rounded-lg border border-danger-50 bg-danger-50 px-3 py-2.5 text-[13px] text-danger-600"
        >
          <TriangleAlert className="mt-0.5 size-4 shrink-0" aria-hidden />
          {error}
        </p>
      ) : null}

      {done && !error ? (
        designs.length === 0 ? (
          <p className="flex items-center gap-2 text-[13px] text-stone-500">
            <ImageIcon className="size-4" aria-hidden />
            No designs came back. Open the poster studio on the event to try again.
          </p>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            {designs.map((design) => {
              const isPick = design.variant === recommendedId
              const isChosen = design.id === chosenId
              return (
                <figure key={design.id} className="flex flex-col gap-2">
                  <PosterPreview
                    event={view.event}
                    design={design}
                    organisation={view.organisation}
                    className={cn(
                      'transition-shadow duration-150',
                      isChosen ? 'ring-2 ring-tulsi-500' : isPick && 'ring-2 ring-turmeric-400',
                    )}
                  />
                  <figcaption className="flex items-center justify-between gap-2">
                    <span className="truncate text-[12.5px] font-medium text-stone-900">
                      {VARIANTS.find((v) => v.id === design.variant)?.label ?? design.variant}
                    </span>
                    {isPick ? (
                      <span className="shrink-0 rounded-full bg-turmeric-50 px-2 py-0.5 text-[11px] font-semibold text-turmeric-700">
                        Recommended
                      </span>
                    ) : null}
                  </figcaption>
                  <button
                    type="button"
                    onClick={() => choose(design.id)}
                    className="rounded-lg border border-sandal-200 bg-sandal-50 py-1.5 text-[13px] font-semibold text-stone-900 transition-colors duration-150 hover:border-sandal-300 hover:bg-sandal-100 focus-visible:ring-2 focus-visible:ring-navy-400 focus-visible:outline-none"
                  >
                    Use this one
                  </button>
                </figure>
              )
            })}
          </div>
        )
      ) : null}
    </div>
  )
}
