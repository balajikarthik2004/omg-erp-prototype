import { CheckCircle2 } from 'lucide-react'

/** The donor-facing brand on this surface. The console keeps APP.orgName. */
export const BRAND_NAME = 'OMG Temple'

/**
 * The photographic half of the login card: the gopuram under one brand wash,
 * with the system name anchored at the foot. Decoration only — nothing here
 * is interactive.
 */
export function LoginShowcase() {
  return (
    <div className="group relative hidden overflow-hidden md:block md:w-[48%] lg:w-[50%]">
      <img
        src="/images/temple.webp"
        alt="Temple gopuram at dusk"
        className="absolute inset-0 size-full object-cover object-center transition-transform duration-1200 ease-out group-hover:scale-105 motion-reduce:transition-none motion-reduce:group-hover:scale-100"
      />
      <div className="login-photo-wash absolute inset-0" aria-hidden />
      <div
        className="absolute inset-0 bg-linear-to-t from-navy-950/55 via-transparent to-navy-950/25"
        aria-hidden
      />

      <div className="relative z-10 flex h-full flex-col justify-between p-7 lg:p-9">
        <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-white/75">
          Temple Governance System
        </p>

        <div>
          <p className="text-xs font-medium tracking-[0.2em] text-white/80 lg:text-sm">
            Divine Governance &bull; {BRAND_NAME}
          </p>
          <h2 className="mt-1.5 font-display text-[23px] font-semibold leading-tight tracking-tight text-white lg:mt-2 lg:text-[32px]">
            Unified Temple ERP
          </h2>
          <div className="mt-4 h-[3px] w-14 rounded-full bg-kumkum-500" aria-hidden />

          <p className="mt-5 inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-tulsi-50">
            <CheckCircle2 className="size-3.5" />
            Every rupee double-signed by the CA team
          </p>
        </div>
      </div>
    </div>
  )
}
