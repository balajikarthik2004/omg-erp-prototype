import { useState } from 'react'
import { Apple, CreditCard, Lock } from 'lucide-react'

import { cn } from '@/lib/cn'
import { formatMoney } from '@/lib/format'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import type { PaymentMethod } from '@/types'

/** A mock of the Square payment sheet. Nothing here touches a real network. */
export function PaymentSheet({
  total,
  busy,
  onPay,
}: {
  total: number
  busy: boolean
  onPay: (method: PaymentMethod) => void
}) {
  const [card, setCard] = useState({ number: '', expiry: '', cvv: '', zip: '' })
  const [errors, setErrors] = useState<Record<string, string>>({})

  function payByCard() {
    const next: Record<string, string> = {}
    const digits = card.number.replace(/\s/g, '')
    if (digits.length < 15) next.number = 'Enter a 16-digit card number.'
    if (!/^\d{2}\s?\/\s?\d{2}$/.test(card.expiry)) next.expiry = 'Use MM/YY.'
    if (card.cvv.length < 3) next.cvv = '3 or 4 digits.'
    if (card.zip.trim().length < 3) next.zip = 'Required by your bank.'
    setErrors(next)
    if (Object.keys(next).length > 0) return
    onPay('card')
  }

  return (
    <div className="rounded-card border border-sandal-200 bg-sandal-50 p-5 shadow-card">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="font-display text-[18px] text-stone-900">Payment</h2>
        <span className="inline-flex items-center gap-1.5 text-[12px] text-stone-500">
          <Lock className="size-3.5" aria-hidden />
          Secured by Square
        </span>
      </div>

      {/* Wallet buttons, in Square's own styling */}
      <div className="flex flex-col gap-2">
        <button
          type="button"
          disabled={busy}
          onClick={() => onPay('apple_pay')}
          className={cn(
            'flex h-12 w-full items-center justify-center gap-2 rounded-lg bg-stone-900 text-[15px] font-medium text-white',
            'transition-opacity duration-150 hover:opacity-90 disabled:opacity-50',
          )}
        >
          <Apple className="size-5" aria-hidden />
          Pay
        </button>
        <button
          type="button"
          disabled={busy}
          onClick={() => onPay('google_pay')}
          className={cn(
            'flex h-12 w-full items-center justify-center gap-2 rounded-lg border border-sandal-300 bg-white text-[15px] font-medium text-stone-900',
            'transition-colors duration-150 hover:bg-sandal-100 disabled:opacity-50',
          )}
        >
          <span className="font-sans">
            <span className="text-[#4285F4]">G</span>
            <span className="text-[#EA4335]">o</span>
            <span className="text-[#FBBC05]">o</span>
            <span className="text-[#4285F4]">g</span>
            <span className="text-[#34A853]">l</span>
            <span className="text-[#EA4335]">e</span>
          </span>
          Pay
        </button>
      </div>

      <div className="my-5 flex items-center gap-3">
        <span className="h-px flex-1 bg-sandal-200" aria-hidden />
        <span className="text-[11px] font-semibold tracking-[0.12em] text-stone-500 uppercase">or pay by card</span>
        <span className="h-px flex-1 bg-sandal-200" aria-hidden />
      </div>

      <div className="flex flex-col gap-4">
        <Input
          label="Card number"
          placeholder="4111 1111 1111 1111"
          inputMode="numeric"
          autoComplete="cc-number"
          value={card.number}
          onChange={(e) => {
            const digits = e.target.value.replace(/\D/g, '').slice(0, 16)
            setCard({ ...card, number: digits.replace(/(.{4})/g, '$1 ').trim() })
          }}
          error={errors.number}
          leading={<CreditCard className="size-4" aria-hidden />}
          className="font-mono tabular-nums"
        />
        <div className="grid grid-cols-3 gap-3">
          <Input
            label="Expiry"
            placeholder="MM/YY"
            inputMode="numeric"
            autoComplete="cc-exp"
            value={card.expiry}
            onChange={(e) => {
              const digits = e.target.value.replace(/\D/g, '').slice(0, 4)
              setCard({ ...card, expiry: digits.length > 2 ? `${digits.slice(0, 2)}/${digits.slice(2)}` : digits })
            }}
            error={errors.expiry}
            className="font-mono tabular-nums"
          />
          <Input
            label="CVV"
            placeholder="123"
            inputMode="numeric"
            autoComplete="cc-csc"
            value={card.cvv}
            onChange={(e) => setCard({ ...card, cvv: e.target.value.replace(/\D/g, '').slice(0, 4) })}
            error={errors.cvv}
            className="font-mono tabular-nums"
          />
          <Input
            label="ZIP"
            placeholder="90210"
            autoComplete="postal-code"
            value={card.zip}
            onChange={(e) => setCard({ ...card, zip: e.target.value.slice(0, 10) })}
            error={errors.zip}
            className="font-mono tabular-nums"
          />
        </div>
      </div>

      <Button className="mt-5" size="lg" fullWidth loading={busy} onClick={payByCard}>
        {busy ? 'Processing' : `Pay ${formatMoney(total)}`}
      </Button>

      <p className="mt-3 text-center text-[12px] text-stone-500">
        Prototype only. No card is charged and no details leave this page.
      </p>
    </div>
  )
}
