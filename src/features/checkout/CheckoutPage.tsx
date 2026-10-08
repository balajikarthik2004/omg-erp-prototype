import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Loader2, ShoppingBag, Trash2 } from 'lucide-react'

import { APP, SECTORS } from '@/config'
import { formatDate } from '@/lib/format'
import { Button } from '@/components/ui/Button'
import { EmptyState } from '@/components/ui/EmptyState'
import { Input } from '@/components/ui/Input'
import { Money } from '@/components/ui/Money'
import { api } from '@/mock/api'
import { CATALOG } from '@/mock/seed'
import { useDb } from '@/store/db'
import { cartTotal, currentUser, useSession } from '@/store/session'
import type { PaymentMethod } from '@/types'
import { PaymentSheet } from './PaymentSheet'

export function CheckoutPage() {
  const navigate = useNavigate()
  const cart = useSession((s) => s.cart)
  const removeFromCart = useSession((s) => s.removeFromCart)
  const clearCart = useSession((s) => s.clearCart)
  const personaId = useSession((s) => s.personaId)
  const recordDonation = useDb((s) => s.recordDonation)

  const [donorName, setDonorName] = useState('')
  const [busy, setBusy] = useState(false)

  const gross = cartTotal(cart)

  async function pay(method: PaymentMethod) {
    setBusy(true)
    await api.process(1500)
    const donation = recordDonation({
      lines: cart,
      method,
      donorName: donorName.trim() || 'Devotee',
      actor: currentUser(personaId),
    })
    clearCart()
    setBusy(false)
    navigate(`/receipt/${encodeURIComponent(donation.id)}`)
  }

  if (cart.length === 0) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-16 sm:px-6">
        <EmptyState
          icon={<ShoppingBag className="size-6" aria-hidden />}
          title="Nothing to give yet"
          message="Choose a hundi offering, a pooja or a project, and it will appear here."
          action={
            <Link to="/">
              <Button>Browse the catalog</Button>
            </Link>
          }
        />
      </div>
    )
  }

  const isCardType = true
  const fee = isCardType ? Math.round(gross * APP.fee.percent) + APP.fee.fixedCents : 0

  return (
    <div className="relative mx-auto max-w-5xl px-4 py-10 sm:px-6">
      <header className="mb-8">
        <p className="text-[11px] font-semibold tracking-[0.14em] text-turmeric-700 uppercase">Complete your gift</p>
        <h1 className="mt-2 font-display text-[30px] leading-tight text-stone-900 sm:text-[34px]">
          Review and pay
        </h1>
        <div className="gold-rule mt-5" />
      </header>

      <div className="grid gap-6 md:grid-cols-[1fr_380px] md:items-start">
        {/* Order summary */}
        <section>
          <h2 className="mb-3 text-[11px] font-semibold tracking-[0.12em] text-stone-500 uppercase">
            Your offering
          </h2>
          <ul className="flex flex-col gap-3">
            {cart.map((line) => {
              const item = CATALOG.find((c) => c.id === line.itemId)
              return (
                <li
                  key={line.key}
                  className="flex items-start justify-between gap-4 rounded-card border border-sandal-200 bg-sandal-50 p-4"
                >
                  <div className="min-w-0">
                    <p className="text-[15px] font-medium text-stone-900">{item?.name ?? line.itemId}</p>
                    <p className="text-[13px] text-stone-500">{SECTORS[line.sectorId].name}</p>
                    {line.dedication ? (
                      <p className="mt-1.5 text-[13px] text-stone-700">
                        For {line.dedication.name}
                        {line.dedication.nakshatra ? ` · ${line.dedication.nakshatra}` : ''}
                        {line.dedication.gothram ? ` · ${line.dedication.gothram} gothram` : ''}
                      </p>
                    ) : null}
                    {line.serviceDate ? (
                      <p className="text-[13px] text-stone-500">On {formatDate(line.serviceDate)}</p>
                    ) : null}
                  </div>
                  <div className="flex shrink-0 items-center gap-3">
                    <Money value={line.amount} className="text-[15px]" />
                    <button
                      type="button"
                      onClick={() => removeFromCart(line.key)}
                      aria-label={`Remove ${item?.name ?? 'item'}`}
                      className="rounded-lg p-1.5 text-stone-500 transition-colors duration-150 hover:bg-sandal-100 hover:text-danger-600"
                    >
                      <Trash2 className="size-4" aria-hidden />
                    </button>
                  </div>
                </li>
              )
            })}
          </ul>

          <div className="mt-5 rounded-card border border-sandal-200 bg-sandal-100 p-5 texture-sandal">
            <dl className="space-y-2 text-[14px]">
              <div className="flex justify-between">
                <dt className="text-stone-700">Offering total</dt>
                <dd>
                  <Money value={gross} />
                </dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-stone-500">Processing fee (borne by the temple)</dt>
                <dd>
                  <Money value={fee} tone="muted" />
                </dd>
              </div>
              <div className="flex justify-between border-t border-sandal-200 pt-2">
                <dt className="font-medium text-stone-900">You pay</dt>
                <dd>
                  <Money value={gross} className="text-[18px] font-medium" />
                </dd>
              </div>
            </dl>
          </div>

          <div className="mt-5 max-w-sm">
            <Input
              label="Receipt name (optional)"
              placeholder="Leave blank to give anonymously"
              value={donorName}
              onChange={(e) => setDonorName(e.target.value)}
              hint="This is the name printed on your receipt and annual statement."
            />
          </div>
        </section>

        {/* Payment */}
        <aside className="md:sticky md:top-20">
          <PaymentSheet total={gross} busy={busy} onPay={(m) => void pay(m)} />
        </aside>
      </div>

      {busy ? (
        <div className="fixed inset-0 z-50 flex flex-col items-center justify-center gap-3 bg-sandal-50/90">
          <Loader2 className="size-7 animate-spin text-kumkum-600" aria-hidden />
          <p className="font-display text-[22px] text-stone-900">Processing your offering</p>
          <p className="text-[14px] text-stone-500">Please do not close this page.</p>
        </div>
      ) : null}
    </div>
  )
}
