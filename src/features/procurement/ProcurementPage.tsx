import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, ArrowRight, TriangleAlert } from 'lucide-react'

import { OVERRIDE_REASON_MIN, approvalTierLabel } from '@/config'
import { cn } from '@/lib/cn'
import { formatDate, formatMoney } from '@/lib/format'
import { Button } from '@/components/ui/Button'
import { Card, CardHeader } from '@/components/ui/Card'
import { EmptyState } from '@/components/ui/EmptyState'
import { Input, Textarea } from '@/components/ui/Input'
import { Money } from '@/components/ui/Money'
import { Select } from '@/components/ui/Select'
import { Skeleton } from '@/components/ui/Skeleton'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { PageHeader } from '@/components/layout/PageHeader'
import { SectorChip } from '@/components/layout/PhaseChip'
import { FlowStepper } from '@/components/flow/FlowStepper'
import { BudgetBar } from '@/components/flow/BudgetBar'
import { available, useDb } from '@/store/db'
import { currentUser, useSession } from '@/store/session'
import { inSector } from '@/store/selectors'
import { scoreSuppliers, type SupplierScore } from './scoreSuppliers'
import { SupplierSuggestions } from './SupplierSuggestions'

/** Computed once, so a re-render never shifts the earliest selectable date. */
const TODAY = new Date().toISOString().slice(0, 10)

const STEPS = [
  { id: 'request', label: 'Select request', hint: 'What the store needs' },
  { id: 'supplier', label: 'AI suggestions', hint: 'Who should supply it' },
  { id: 'review', label: 'Review order', hint: 'Price, quantity, budget' },
  { id: 'submit', label: 'Submit', hint: 'Send to the CA team' },
]

export function ProcurementPage() {
  const db = useDb()
  const navigate = useNavigate()
  const filter = useSession((s) => s.sectorFilter)
  const personaId = useSession((s) => s.personaId)
  const createPurchaseOrder = useDb((s) => s.createPurchaseOrder)

  const [step, setStep] = useState(0)
  const [requestId, setRequestId] = useState<string | null>(null)
  const [choice, setChoice] = useState<SupplierScore | null>(null)
  const [qty, setQty] = useState('')
  const [unitPrice, setUnitPrice] = useState('')
  const [budgetHeadId, setBudgetHeadId] = useState('')
  const [expectedBy, setExpectedBy] = useState('')
  const [overrideReason, setOverrideReason] = useState('')
  const [error, setError] = useState<string>()

  const openRequests = useMemo(
    () => inSector(db.inventoryRequests, filter).filter((r) => r.status === 'approved' && !r.poId),
    [db.inventoryRequests, filter],
  )

  const request = db.inventoryRequests.find((r) => r.id === requestId)
  const item = request ? db.inventory.find((i) => i.id === request.itemId) : undefined
  const scores = useMemo(
    () => (item ? scoreSuppliers(db.suppliers, item.id) : []),
    [db.suppliers, item],
  )

  const qtyNum = Number(qty) || 0
  const priceCents = Math.round((Number(unitPrice.replace(/[^0-9.]/g, '')) || 0) * 100)
  const total = qtyNum * priceCents
  const head = db.budgets.find((b) => b.id === budgetHeadId)
  const overBudget = Boolean(head) && total > available(head!)
  const needsReason = Boolean(choice) && choice!.rank !== 1

  function selectRequest(id: string) {
    const req = db.inventoryRequests.find((r) => r.id === id)
    const inv = req ? db.inventory.find((i) => i.id === req.itemId) : undefined
    setRequestId(id)
    setQty(req ? String(req.qty) : '')
    setChoice(null)
    setUnitPrice('')
    setExpectedBy(req ? req.neededBy.slice(0, 10) : '')
    setBudgetHeadId(
      db.budgets.find((b) => b.sectorId === (inv?.sectorId ?? req?.sectorId))?.id ?? '',
    )
    setStep(1)
  }

  function chooseSupplier(score: SupplierScore) {
    setChoice(score)
    setUnitPrice((score.expectedPrice / 100).toFixed(2))
  }

  function submit() {
    if (!choice || !item || !head) return
    const result = createPurchaseOrder({
      supplierId: choice.supplier.id,
      sectorId: head.sectorId,
      budgetHeadId: head.id,
      lines: [{ itemId: item.id, qty: qtyNum, unitPrice: priceCents }],
      aiRank: choice.rank,
      overrideReason: needsReason ? overrideReason : undefined,
      requestId: request?.id,
      expectedBy: new Date(expectedBy).toISOString(),
      actor: currentUser(personaId),
    })
    if (!result.ok) {
      setError(result.error)
      return
    }
    navigate('/console/purchase-orders')
  }

  return (
    <div>
      <PageHeader
        phase="spend"
        title="New purchase order"
        description="Four steps: pick an approved request, compare suppliers, check the budget, then send it for approval."
      />

      <Card className="mb-6">
        <FlowStepper steps={STEPS} current={step} phase="spend" onStepClick={setStep} />
      </Card>

      {!db.ready ? (
        <Skeleton className="h-64 w-full" />
      ) : (
        <div className="flex flex-col gap-6">
          {/* Step 1 — request */}
          {step === 0 ? (
            openRequests.length === 0 ? (
              <EmptyState
                title="No approved requests waiting"
                message="A store request must be approved before it can become a purchase order. Approve one on the inventory page first."
                action={<Button onClick={() => navigate('/console/inventory')}>Go to inventory</Button>}
              />
            ) : (
              <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {openRequests.map((req) => {
                  const inv = db.inventory.find((i) => i.id === req.itemId)
                  return (
                    <li key={req.id}>
                      <button type="button" onClick={() => selectRequest(req.id)} className="w-full text-left">
                        <Card className="h-full transition-colors duration-150 hover:border-turmeric-400">
                          <div className="mb-2 flex items-start justify-between gap-2">
                            <h3 className="font-display text-[18px] leading-tight text-stone-900">{inv?.name}</h3>
                            <SectorChip sectorId={req.sectorId} />
                          </div>
                          <p className="font-mono text-[15px] text-stone-900 tabular-nums">
                            {req.qty} {inv?.unit}
                          </p>
                          <p className="mt-1 text-[13px] text-stone-500">Needed by {formatDate(req.neededBy)}</p>
                          <p className="mt-3 text-[13px] text-kumkum-700">Use this request →</p>
                        </Card>
                      </button>
                    </li>
                  )
                })}
              </ul>
            )
          ) : null}

          {/* Step 2 — suppliers */}
          {step === 1 && item ? (
            <Card>
              <CardHeader
                title={`Who should supply ${item.name}?`}
                description={`${qtyNum} ${item.unit} needed. Ranked on price, quality, delivery, price trend and how fresh the quote is.`}
              />
              <SupplierSuggestions
                scores={scores}
                selectedId={choice?.supplier.id ?? null}
                onSelect={chooseSupplier}
                quotedPrice={priceCents || undefined}
              />
              <div className="mt-5 flex justify-between gap-2">
                <Button variant="secondary" icon={<ArrowLeft className="size-4" aria-hidden />} onClick={() => setStep(0)}>
                  Back
                </Button>
                <Button disabled={!choice} onClick={() => setStep(2)} icon={<ArrowRight className="size-4" aria-hidden />}>
                  Review the order
                </Button>
              </div>
            </Card>
          ) : null}

          {/* Step 3 — review */}
          {step === 2 && item && choice ? (
            <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr] lg:items-start">
              <Card>
                <CardHeader title="Order lines" description={`${choice.supplier.name} · ${choice.supplier.city}`} />
                <div className="grid gap-4 sm:grid-cols-2">
                  <Input
                    label={`Quantity (${item.unit})`}
                    inputMode="numeric"
                    value={qty}
                    onChange={(e) => setQty(e.target.value.replace(/[^0-9]/g, ''))}
                    className="font-mono tabular-nums"
                  />
                  <Input
                    label="Unit price"
                    inputMode="decimal"
                    leading={<span className="text-[15px]">$</span>}
                    value={unitPrice}
                    onChange={(e) => setUnitPrice(e.target.value)}
                    className="font-mono tabular-nums"
                    hint={`AI expects ${formatMoney(choice.expectedPrice)}`}
                  />
                  <Select
                    label="Budget head"
                    value={budgetHeadId}
                    onChange={(e) => setBudgetHeadId(e.target.value)}
                    options={[
                      { value: '', label: 'Choose a budget head' },
                      ...db.budgets.map((b) => ({
                        value: b.id,
                        label: `${b.name} — ${formatMoney(available(b))} available`,
                      })),
                    ]}
                  />
                  <Input
                    label="Expected delivery"
                    type="date"
                    value={expectedBy}
                    min={TODAY}
                    onChange={(e) => setExpectedBy(e.target.value)}
                  />
                </div>

                {priceCents > choice.expectedPrice * 1.1 ? (
                  <p className="mt-4 flex items-start gap-2 rounded-lg border border-danger-50 bg-danger-50 px-3 py-2.5 text-[13px] text-danger-600">
                    <TriangleAlert className="mt-0.5 size-4 shrink-0" aria-hidden />
                    At {formatMoney(priceCents)} this quote is{' '}
                    {(((priceCents - choice.expectedPrice) / choice.expectedPrice) * 100).toFixed(0)}% above the
                    expected price of {formatMoney(choice.expectedPrice)}. Confirm it with the supplier before
                    submitting.
                  </p>
                ) : null}

                {needsReason ? (
                  <div className="mt-4">
                    <Textarea
                      label="Why not the top-ranked supplier?"
                      placeholder="Explain the choice in at least 10 characters."
                      value={overrideReason}
                      onChange={(e) => setOverrideReason(e.target.value)}
                      error={
                        overrideReason.length > 0 && overrideReason.trim().length < OVERRIDE_REASON_MIN
                          ? `At least ${OVERRIDE_REASON_MIN} characters.`
                          : undefined
                      }
                      hint={`${choice.supplier.name} is ranked ${choice.rank}. This reason is stored on the order and shown to the approver.`}
                    />
                  </div>
                ) : null}

                <div className="mt-5 flex justify-between gap-2">
                  <Button variant="secondary" icon={<ArrowLeft className="size-4" aria-hidden />} onClick={() => setStep(1)}>
                    Back
                  </Button>
                  <Button
                    disabled={!head || qtyNum <= 0 || priceCents <= 0 || !expectedBy}
                    onClick={() => setStep(3)}
                    icon={<ArrowRight className="size-4" aria-hidden />}
                  >
                    Continue
                  </Button>
                </div>
              </Card>

              <Card accentClass={overBudget ? 'bg-danger-600' : 'bg-tulsi-500'}>
                <CardHeader title="Budget impact" description={head?.name ?? 'Pick a budget head to see the effect'} />
                {head ? (
                  <>
                    <BudgetBar head={head} />
                    <dl className="mt-4 space-y-2 text-[14px]">
                      <div className="flex justify-between">
                        <dt className="text-stone-700">Order total</dt>
                        <dd>
                          <Money value={total} />
                        </dd>
                      </div>
                      <div className="flex justify-between">
                        <dt className="text-stone-700">Available now</dt>
                        <dd>
                          <Money value={available(head)} />
                        </dd>
                      </div>
                      <div className="flex justify-between border-t border-sandal-200 pt-2">
                        <dt className="font-medium text-stone-900">Available after approval</dt>
                        <dd>
                          <Money
                            value={available(head) - total}
                            tone={overBudget ? 'out' : 'in'}
                            className="font-medium"
                          />
                        </dd>
                      </div>
                    </dl>

                    {overBudget ? (
                      <div className="mt-4 rounded-lg border border-danger-50 bg-danger-50 px-3 py-2.5">
                        <p className="flex items-start gap-2 text-[13px] text-danger-600">
                          <TriangleAlert className="mt-0.5 size-4 shrink-0" aria-hidden />
                          This order is {formatMoney(total - available(head))} more than {head.name} has available.
                          It cannot be submitted.
                        </p>
                        <Button
                          size="sm"
                          variant="secondary"
                          className="mt-3"
                          onClick={() => navigate('/console/allotments')}
                        >
                          Request a re-allotment
                        </Button>
                      </div>
                    ) : (
                      <p className="mt-4 text-[13px] text-stone-500">
                        At {formatMoney(total)} this order needs {approvalTierLabel(total)} to approve.
                      </p>
                    )}
                  </>
                ) : (
                  <p className="text-[14px] text-stone-500">Choose a budget head to see what this order would commit.</p>
                )}
              </Card>
            </div>
          ) : null}

          {/* Step 4 — submit */}
          {step === 3 && item && choice && head ? (
            <Card>
              <CardHeader
                title="Ready to submit"
                description="Once submitted the order is locked and waits for a CA signature. You cannot approve your own order."
              />

              <dl className="grid gap-x-6 gap-y-3 sm:grid-cols-2">
                <Summary label="Supplier" value={`${choice.supplier.name} (rank ${choice.rank})`} />
                <Summary label="Item" value={`${item.name} — ${qtyNum} ${item.unit}`} />
                <Summary label="Unit price" value={formatMoney(priceCents)} />
                <Summary label="Order total" value={formatMoney(total)} />
                <Summary label="Budget head" value={head.name} />
                <Summary label="Expected delivery" value={expectedBy ? formatDate(expectedBy) : '—'} />
                <Summary label="Approval needed" value={approvalTierLabel(total)} />
                <Summary
                  label="Available after approval"
                  value={formatMoney(available(head) - total)}
                />
              </dl>

              {needsReason ? (
                <div className="mt-4 rounded-lg border border-marigold-50 bg-marigold-50 px-3 py-2.5">
                  <p className="text-[12px] tracking-[0.06em] text-marigold-500 uppercase">AI override reason</p>
                  <p className="mt-1 text-[14px] text-stone-700">{overrideReason || '— not yet given —'}</p>
                </div>
              ) : null}

              {error ? (
                <p className="mt-4 rounded-lg border border-danger-50 bg-danger-50 px-3 py-2.5 text-[13px] text-danger-600">
                  {error}
                </p>
              ) : null}

              <div className="mt-5 flex flex-wrap justify-between gap-2">
                <Button variant="secondary" icon={<ArrowLeft className="size-4" aria-hidden />} onClick={() => setStep(2)}>
                  Back
                </Button>
                <Button
                  size="lg"
                  disabled={overBudget || (needsReason && overrideReason.trim().length < OVERRIDE_REASON_MIN)}
                  onClick={submit}
                >
                  Submit for CA approval
                </Button>
              </div>
            </Card>
          ) : null}

          {/* Context card */}
          {request && item && step > 0 ? (
            <Card className={cn('bg-sandal-100')}>
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-[11px] font-semibold tracking-[0.12em] text-stone-500 uppercase">Working from request</p>
                  <p className="mt-0.5 text-[14px] text-stone-900">
                    {request.id} · {item.name} · {request.qty} {item.unit} by {formatDate(request.neededBy)}
                  </p>
                </div>
                <StatusBadge status={request.status} />
              </div>
            </Card>
          ) : null}
        </div>
      )}
    </div>
  )
}

function Summary({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-[11px] font-semibold tracking-[0.12em] text-stone-500 uppercase">{label}</dt>
      <dd className="mt-0.5 text-[15px] text-stone-900">{value}</dd>
    </div>
  )
}
