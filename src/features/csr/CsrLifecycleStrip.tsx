import { Link } from 'react-router-dom'
import {
  ArrowRight,
  Building2,
  FileCheck2,
  Handshake,
  ScrollText,
  ShieldCheck,
  type LucideIcon,
} from 'lucide-react'

import { Card } from '@/components/ui/Card'

interface Step {
  step: string
  kicker: string
  title: string
  blurb: string
  cta: string
  to: string
  icon: LucideIcon
}

/**
 * The five stages a corporate grant passes through, in order. This was five
 * copy-pasted <Link> blocks; one list and one component keeps the ordinal, the
 * wording and the hover state from drifting apart.
 */
const STEPS: Step[] = [
  {
    step: '01',
    kicker: 'Vault',
    title: 'Compliance Vault',
    blurb: 'CSR-1, RNPO 332, 354 approval and 3-year audited records.',
    cta: 'View entities',
    to: '/console/csr/compliance',
    icon: ShieldCheck,
  },
  {
    step: '02',
    kicker: 'Builder',
    title: 'Project Builder',
    blurb: 'Schedule VII item mapping and pooja-block validation.',
    cta: 'Configure heads',
    to: '/console/csr/projects',
    icon: ScrollText,
  },
  {
    step: '03',
    kicker: 'Pipeline',
    title: 'Corporate CRM',
    blurb: 'Mandatory CSR obligation tracking and AI proposals.',
    cta: 'View partners',
    to: '/console/csr/pipeline',
    icon: Building2,
  },
  {
    step: '04',
    kicker: 'MoUs',
    title: 'Deals and tranches',
    blurb: 'Dual sign-off (CA and Trustee) and the 5% admin cap check.',
    cta: 'Review tranches',
    to: '/console/csr/deals',
    icon: Handshake,
  },
  {
    step: '05',
    kicker: 'Certify',
    title: 'UC and reporting',
    blurb: 'CA-signed Utilisation Certificates with the UDIN seal.',
    cta: 'Sign certificates',
    to: '/console/csr/reports',
    icon: FileCheck2,
  },
]

export function CsrLifecycleStrip() {
  return (
    <Card className="shadow-card">
      <div className="p-4 sm:p-5">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <h2 className="font-display text-base font-semibold text-stone-900">
            CSR lifecycle and governance
          </h2>
          <span className="inline-flex items-center gap-1.5 rounded-full border border-turmeric-200 bg-turmeric-50 px-2.5 py-0.5 text-[12px] font-medium text-turmeric-700">
            MCA Sec 135 &amp; Schedule VII
          </span>
        </div>

        <ol className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          {STEPS.map(({ step, kicker, title, blurb, cta, to, icon: Icon }) => (
            <li key={step} className="contents">
              <Link
                to={to}
                className="group flex flex-col justify-between rounded-lg border border-sandal-200 bg-sandal-50 p-3.5 shadow-flat transition-colors duration-150 hover:border-turmeric-400 hover:bg-turmeric-50/40 focus-visible:ring-2 focus-visible:ring-navy-400 focus-visible:outline-none"
              >
                <div>
                  <div className="flex items-center justify-between gap-2">
                    <span className="flex items-center gap-1.5">
                      <span className="font-mono text-[12px] font-semibold text-stone-500 tabular-nums">
                        {step}
                      </span>
                      <span className="text-[11px] font-semibold tracking-[0.1em] text-stone-500 uppercase">
                        {kicker}
                      </span>
                    </span>
                    <Icon className="size-4 shrink-0 text-turmeric-600" aria-hidden />
                  </div>
                  <h3 className="mt-1.5 font-display text-[14px] font-semibold text-stone-900">{title}</h3>
                  <p className="mt-0.5 text-[12.5px] leading-relaxed text-stone-700">{blurb}</p>
                </div>
                <span className="mt-3 flex items-center gap-1 text-[12.5px] font-semibold text-navy-600 transition-colors duration-150 group-hover:text-navy-800">
                  {cta}
                  <ArrowRight
                    className="size-3 transition-transform duration-150 group-hover:translate-x-0.5"
                    aria-hidden
                  />
                </span>
              </Link>
            </li>
          ))}
        </ol>
      </div>
    </Card>
  )
}
