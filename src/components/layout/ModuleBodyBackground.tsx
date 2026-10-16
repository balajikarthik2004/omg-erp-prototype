import type { ReactNode } from 'react'
import { cn } from '@/lib/cn'

export interface ModuleBodyBackgroundProps {
  /** The light background gradient class based on the hero section card */
  gradient: string
  /** Accent glow color (e.g. 'rgba(226, 46, 38, 0.12)', '#FDEDEC') */
  glow?: string
  className?: string
  children: ReactNode
}

/**
 * Animated devotional body background for module pages (Temple, Sevalaya, Sangam, Gaushala, Events).
 * Features a radiant light devotional color canvas based on each module's hero section,
 * layered with public/images/animation background.svg featuring briskly spinning rangolis,
 * swinging temple bells, and flickering deepams.
 */
export function ModuleBodyBackground({
  gradient,
  glow,
  className,
  children,
}: ModuleBodyBackgroundProps) {
  return (
    <div className={cn('relative isolate min-h-screen', className)}>
      {/* Fixed GPU-accelerated animated background layer */}
      <div
        className={cn('pointer-events-none fixed inset-0 -z-10 overflow-hidden', gradient)}
        style={{
          transform: 'translate3d(0, 0, 0)',
          willChange: 'transform',
          contain: 'paint layout',
        }}
        aria-hidden
      >
        <img
          src="/images/animation background.svg"
          alt=""
          className="h-full w-full object-cover object-top opacity-55 select-none mix-blend-multiply pointer-events-none"
        />

        {/* Ambient radial glow based on the module's hero card accent */}
        {glow ? (
          <>
            <div
              className="pointer-events-none absolute -top-24 -left-24 h-120 w-120 rounded-full opacity-60"
              style={{
                backgroundImage: `radial-gradient(circle, ${glow} 20%, transparent 70%)`,
              }}
            />
            <div
              className="pointer-events-none absolute top-1/2 -right-24 h-120 w-120 rounded-full opacity-50"
              style={{
                backgroundImage: `radial-gradient(circle, ${glow} 20%, transparent 70%)`,
              }}
            />
          </>
        ) : null}

        {/* Soft subtle border vignette */}
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              'radial-gradient(ellipse at 50% 15%, transparent 65%, rgba(216, 219, 232, 0.18) 100%)',
          }}
        />
      </div>

      {/* Page content on top */}
      <div className="relative z-10">{children}</div>
    </div>
  )
}
