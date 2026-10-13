import { useEffect, useState } from 'react'

import { cn } from '@/lib/cn'
import { qrSvg } from './logic/poster'

/** A ticket's QR. It carries the signed ticket code, which is separate from the poster QR (that opens the public page). */
export function TicketQr({ token, size = 220, className }: { token: string; size?: number; className?: string }) {
  const [svg, setSvg] = useState('')

  useEffect(() => {
    let alive = true
    void qrSvg(token, size).then((s) => alive && setSvg(s))
    return () => {
      alive = false
    }
  }, [token, size])

  return (
    <div
      role="img"
      aria-label="Ticket QR code"
      className={cn('overflow-hidden rounded-lg border border-sandal-200 bg-white [&_svg]:block', className)}
      style={{ width: size, height: size }}
      dangerouslySetInnerHTML={{ __html: svg }}
    />
  )
}
