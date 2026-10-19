import { useEffect, useState } from 'react'

import { cn } from '@/lib/cn'
import type { EventRecord, PosterDesign, PosterVariant } from '@/types'
import { renderPoster } from './logic/poster'
import { registrationUrl } from './useEvent'

export interface PosterPreviewProps {
  event: EventRecord
  design: PosterDesign
  organisation: string
  className?: string
  /** Admin override. Defaults to the design's own theme. */
  themeId?: PosterVariant
  /** A photograph picked by hand, instead of the automatic one. */
  photoSrc?: string
  /** Print the event's own image instead of a library photograph. */
  useEventImage?: boolean
  onSvg?: (svg: string) => void
  /** Fires when the photograph could not be fetched and the drawn art stood in. */
  onPhotoFallback?: (fellBack: boolean) => void
}

/** The finished poster, composed on demand: photograph, then the exact words, the logo and a QR. */
export function PosterPreview({
  event,
  design,
  organisation,
  className,
  themeId,
  photoSrc,
  useEventImage,
  onSvg,
  onPhotoFallback,
}: PosterPreviewProps) {
  const [svg, setSvg] = useState('')

  useEffect(() => {
    let alive = true
    void renderPoster({
      event,
      design,
      organisation,
      registrationUrl: registrationUrl(event.id),
      themeId,
      photoSrc,
      useEventImage,
    }).then((out) => {
      if (!alive) return
      setSvg(out.svg)
      onSvg?.(out.svg)
      onPhotoFallback?.(!out.photoEmbedded)
    })
    return () => {
      alive = false
    }
    // onSvg and onPhotoFallback are setters from the parent and are stable enough to leave out.
    // oxlint-disable-next-line react-hooks/exhaustive-deps
  }, [event, design, organisation, themeId, photoSrc, useEventImage])

  return (
    <div
      role="img"
      aria-label={`Poster for ${design.textSnapshot.eventName}, ${themeId ?? design.variant} theme`}
      className={cn('overflow-hidden rounded-lg border border-sandal-200 bg-sandal-100 [&_svg]:block [&_svg]:h-auto [&_svg]:w-full', !svg && 'aspect-[1024/1448] animate-pulse', className)}
      dangerouslySetInnerHTML={{ __html: svg }}
    />
  )
}
