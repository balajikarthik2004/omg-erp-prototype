import { useEffect, useState } from 'react'

import { cn } from '@/lib/cn'
import type { EventRecord, PosterDesign } from '@/types'
import { renderPosterSvg } from './logic/poster'
import { registrationUrl } from './useEvent'

/** The finished poster, composed on demand: art, then the exact words, the logo and a QR. */
export function PosterPreview({ event, design, organisation, className, onSvg }: {
  event: EventRecord
  design: PosterDesign
  organisation: string
  className?: string
  onSvg?: (svg: string) => void
}) {
  const [svg, setSvg] = useState('')

  useEffect(() => {
    let alive = true
    void renderPosterSvg({ event, design, organisation, registrationUrl: registrationUrl(event.id) }).then((s) => {
      if (!alive) return
      setSvg(s)
      onSvg?.(s)
    })
    return () => {
      alive = false
    }
    // onSvg is a setter from the parent and is stable enough to leave out.
    // oxlint-disable-next-line react-hooks/exhaustive-deps
  }, [event, design, organisation])

  return (
    <div
      role="img"
      aria-label={`Poster for ${design.textSnapshot.eventName}, ${design.variant} design`}
      className={cn('overflow-hidden rounded-lg border border-sandal-200 bg-sandal-100 [&_svg]:block [&_svg]:h-auto [&_svg]:w-full', !svg && 'aspect-[1024/1448] animate-pulse', className)}
      dangerouslySetInnerHTML={{ __html: svg }}
    />
  )
}
