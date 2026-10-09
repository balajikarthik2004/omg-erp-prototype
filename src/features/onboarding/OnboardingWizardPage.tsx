import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ArrowLeft, ArrowRight, Rocket } from 'lucide-react'

import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { PageHeader } from '@/components/layout/PageHeader'
import { FlowStepper } from '@/components/flow/FlowStepper'
import { useDb } from '@/store/db'
import { currentUser, useSession } from '@/store/session'
import { CatalogStep, CustomerStep, ModulesStep } from './WizardStepsA'
import { ReviewStep, SquareStep, ThresholdsStep, UsersStep } from './WizardStepsB'
import { EMPTY_DRAFT, WIZARD_STEPS, initialsOf, stepError, toCents, type Draft } from './wizard'

/** Step 00: a Super Admin sets up a customer from the backend, with no code changes. */
export function OnboardingWizardPage() {
  const navigate = useNavigate()
  const personaId = useSession((s) => s.personaId)
  const user = currentUser(personaId)
  const tenants = useDb((s) => s.tenants)
  const onboardTenant = useDb((s) => s.onboardTenant)

  const [step, setStep] = useState(0)
  const [draft, setDraft] = useState<Draft>(EMPTY_DRAFT)
  const [error, setError] = useState<string>()

  const set = (patch: Partial<Draft>) => {
    setDraft((d) => ({ ...d, ...patch }))
    setError(undefined)
  }
  const domains = tenants.map((t) => t.domain)
  const last = step === WIZARD_STEPS.length - 1

  function next() {
    const problem = stepError(step, draft, domains)
    if (problem) {
      setError(problem)
      return
    }
    setError(undefined)
    setStep((s) => Math.min(WIZARD_STEPS.length - 1, s + 1))
  }

  function goLive() {
    for (let i = 0; i < WIZARD_STEPS.length - 1; i++) {
      const problem = stepError(i, draft, domains)
      if (problem) {
        setStep(i)
        setError(problem)
        return
      }
    }
    const result = onboardTenant(
      {
        name: draft.name,
        address: draft.address.trim(),
        domain: draft.domain,
        brand: draft.brand,
        logoText: initialsOf(draft.name),
        verticals: draft.verticals,
        modules: draft.modules,
        squareLocationId: draft.squareLocationId.trim(),
        thresholds: { staffMax: toCents(draft.staffMax), partnerMax: toCents(draft.partnerMax) },
        users: draft.users,
      },
      user,
    )
    if (!result.ok) {
      setError(result.error)
      return
    }
    navigate('/console/onboarding')
  }

  const Body = [CustomerStep, ModulesStep, CatalogStep, SquareStep, ThresholdsStep, UsersStep, ReviewStep][step]!

  return (
    <div>
      <PageHeader
        phase="onboard"
        title="Onboard a customer"
        description="One platform, configured per customer. No code changes: name, brand, verticals, catalog, Square, approval limits and users."
        actions={
          <Link to="/console/onboarding">
            <Button variant="ghost" icon={<ArrowLeft className="size-4" aria-hidden />}>
              All customers
            </Button>
          </Link>
        }
      />

      <div className="flex flex-col gap-6">
        <FlowStepper steps={WIZARD_STEPS} current={step} phase="onboard" onStepClick={setStep} />

        <Card>
          <h2 className="mb-5 font-display text-[22px] text-stone-900">{WIZARD_STEPS[step]!.label}</h2>
          <Body draft={draft} set={set} />

          {error ? (
            <p role="alert" className="mt-5 rounded-lg border border-danger-50 bg-danger-50 px-3 py-2.5 text-[14px] text-danger-600">
              {error}
            </p>
          ) : null}

          <div className="mt-6 flex items-center justify-between gap-3 border-t border-sandal-200 pt-5">
            <Button variant="ghost" disabled={step === 0} onClick={() => setStep((s) => s - 1)} icon={<ArrowLeft className="size-4" aria-hidden />}>
              Back
            </Button>
            {last ? (
              <Button variant="success" icon={<Rocket className="size-4" aria-hidden />} onClick={goLive}>
                Go live
              </Button>
            ) : (
              <Button onClick={next} icon={<ArrowRight className="size-4" aria-hidden />}>
                Next
              </Button>
            )}
          </div>
        </Card>
      </div>
    </div>
  )
}
