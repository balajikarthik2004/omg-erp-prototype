import { useState } from 'react'
import { Link, Navigate, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { ArrowLeft, CalendarDays, Info } from 'lucide-react'

import { SECTORS, type SectorId } from '@/config'
import { cn } from '@/lib/cn'
import { formatMoney } from '@/lib/format'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { toast } from '@/lib/toast'
import { SectorChip } from '@/components/layout/PhaseChip'
import { Deepam } from '@/components/ui/Ornament'
import { CATALOG, FUNDS } from '@/mock/seed'
import { useSession } from '@/store/session'

/** Computed once, so a re-render never shifts the earliest selectable date. */
const TODAY = new Date().toISOString().slice(0, 10)

const NAKSHATRAS = [
  'Ashwini', 'Bharani', 'Krittika', 'Rohini', 'Mrigashira', 'Thiruvathirai', 'Punarpoosam', 'Pooyam',
  'Ayilyam', 'Magam', 'Pooram', 'Uthiram', 'Hastham', 'Chithirai', 'Swathi', 'Visakam', 'Anusham',
  'Kettai', 'Moolam', 'Pooradam', 'Uthiradam', 'Thiruvonam', 'Avittam', 'Sadhayam', 'Revathi',
]

export function ItemDetailPage() {
  const { sector, itemId } = useParams<{ sector: string; itemId: string }>()
  const [params] = useSearchParams()
  const navigate = useNavigate()
  const addToCart = useSession((s) => s.addToCart)

  const item = CATALOG.find((c) => c.id === itemId)
  const presetFromUrl = Number(params.get('amount'))

  const [amount, setAmount] = useState<number>(
    presetFromUrl > 0 ? presetFromUrl : (item?.price ?? item?.presets?.[1] ?? 2100),
  )
  const [custom, setCustom] = useState('')
  const [name, setName] = useState('')
  const [nakshatra, setNakshatra] = useState('')
  const [gothram, setGothram] = useState('')
  const [serviceDate, setServiceDate] = useState('')
  const [errors, setErrors] = useState<Record<string, string>>({})

  if (!item || !sector) return <Navigate to="/donate/temple" replace />

  const sectorId = item.sectorId as SectorId
  const fund = FUNDS.find((f) => f.id === item.fundId)
  const presets = item.presets ?? (item.price ? [item.price] : [])
  const anyAmount = item.price === null

  function submit() {
    const next: Record<string, string> = {}
    if (amount < 100) next.amount = 'Enter at least $1.00.'
    if (item!.needsDedication && name.trim().length < 2) next.name = 'Enter the name to be recited.'
    if (item!.needsDate && !serviceDate) next.date = 'Pick the date for this service.'
    setErrors(next)
    if (Object.keys(next).length > 0) return

    addToCart({
      itemId: item!.id,
      sectorId,
      amount,
      serviceDate: serviceDate || undefined,
      dedication: item!.needsDedication
        ? { name: name.trim(), nakshatra: nakshatra || undefined, gothram: gothram.trim() || undefined, date: serviceDate || undefined }
        : undefined,
    })
    toast.success('Added to your offering', `${item!.name} · ${formatMoney(amount)}`)
    navigate('/checkout')
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6">
      <Link
        to={`/donate/${sectorId}`}
        className="inline-flex items-center gap-1.5 text-[14px] text-stone-500 hover:text-stone-900"
      >
        <ArrowLeft className="size-4" aria-hidden />
        Back to {SECTORS[sectorId].name}
      </Link>

      <header className="mt-4 mb-6">
        <SectorChip sectorId={sectorId} withTamil />
        <div className="mt-2 flex flex-wrap items-baseline gap-3">
          <h1 className="font-display text-[30px] leading-tight text-stone-900">{item.name}</h1>
          {item.tamil ? <span className="text-[18px] text-stone-500">{item.tamil}</span> : null}
        </div>
        <p className="mt-1 max-w-2xl text-[15px] leading-relaxed text-stone-700">{item.description}</p>
        <div className="gold-rule mt-4" />
      </header>

      <div className="grid gap-6 md:grid-cols-[1.3fr_1fr] md:items-start">
        <div className="flex flex-col gap-6">
          {/* Amount */}
          <section className="rounded-card border border-sandal-200 bg-sandal-50 p-5">
            <h2 className="mb-3 text-[11px] font-semibold tracking-[0.12em] text-stone-500 uppercase">Amount</h2>
            {presets.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {presets.map((preset) => (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => {
                      setAmount(preset)
                      setCustom('')
                    }}
                    aria-pressed={amount === preset && custom === ''}
                    className={cn(
                      'inline-flex h-11 items-center rounded-lg border px-5 font-mono text-[15px] tabular-nums',
                      'transition-colors duration-150',
                      amount === preset && custom === ''
                        ? 'border-kumkum-600 bg-kumkum-50 font-medium text-kumkum-700'
                        : 'border-sandal-300 bg-sandal-50 text-stone-700 hover:border-turmeric-400 hover:bg-turmeric-50',
                    )}
                  >
                    {formatMoney(preset)}
                  </button>
                ))}
              </div>
            ) : null}

            {anyAmount || presets.length === 0 ? (
              <div className="mt-3 max-w-xs">
                <Input
                  label="Other amount"
                  inputMode="decimal"
                  placeholder="0.00"
                  leading={<span className="text-[15px]">$</span>}
                  value={custom}
                  onChange={(e) => {
                    setCustom(e.target.value)
                    const parsed = Math.round(Number(e.target.value.replace(/[^0-9.]/g, '')) * 100)
                    if (!Number.isNaN(parsed)) setAmount(parsed)
                  }}
                  error={errors.amount}
                  className="font-mono tabular-nums"
                />
              </div>
            ) : errors.amount ? (
              <p className="mt-2 text-[13px] text-danger-600">{errors.amount}</p>
            ) : null}
          </section>

          {/* Dedication */}
          {item.needsDedication ? (
            <section className="rounded-card border border-sandal-200 bg-sandal-50 p-5">
              <h2 className="mb-1 inline-flex items-center gap-2 text-[11px] font-semibold tracking-[0.12em] text-stone-500 uppercase">
                <Deepam className="size-4 text-turmeric-500" />
                Dedication
              </h2>
              <p className="mb-4 text-[13px] text-stone-500">
                The archakar recites these at the sanctum during the service.
              </p>
              <div className="grid gap-4 sm:grid-cols-2">
                <Input
                  label="Name to be recited"
                  placeholder="Lakshmi Narayanan"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  error={errors.name}
                />
                <Select
                  label="Nakshatra"
                  value={nakshatra}
                  onChange={(e) => setNakshatra(e.target.value)}
                  options={[{ value: '', label: 'Not sure / skip' }, ...NAKSHATRAS.map((n) => ({ value: n, label: n }))]}
                />
                <Input
                  label="Gothram (optional)"
                  placeholder="Bharadwaja"
                  value={gothram}
                  onChange={(e) => setGothram(e.target.value)}
                />
              </div>
            </section>
          ) : null}

          {/* Date */}
          {item.needsDate ? (
            <section className="rounded-card border border-sandal-200 bg-sandal-50 p-5">
              <h2 className="mb-3 text-[11px] font-semibold tracking-[0.12em] text-stone-500 uppercase">
                Service date
              </h2>
              <div className="max-w-xs">
                <Input
                  type="date"
                  aria-label="Service date"
                  value={serviceDate}
                  min={TODAY}
                  onChange={(e) => setServiceDate(e.target.value)}
                  error={errors.date}
                  leading={<CalendarDays className="size-4" aria-hidden />}
                />
              </div>
            </section>
          ) : null}
        </div>

        {/* Summary */}
        <aside className="md:sticky md:top-20">
          <div className="relative overflow-hidden rounded-card border border-sandal-200 bg-sandal-100 p-5 shadow-card texture-sandal">
            <p className="text-[11px] font-semibold tracking-[0.12em] text-stone-500 uppercase">You are giving</p>
            <p className="mt-2 font-display text-[34px] leading-none text-stone-900">{formatMoney(amount)}</p>
            <p className="mt-2 text-[14px] text-stone-700">{item.name}</p>

            <dl className="mt-4 space-y-2 border-t border-sandal-200 pt-4 text-[13px]">
              <div className="flex justify-between gap-3">
                <dt className="text-stone-500">Fund</dt>
                <dd className="text-right text-stone-700">{fund?.name ?? '—'}</dd>
              </div>
              {fund?.type === 'restricted' ? (
                <div className="flex items-start gap-2 rounded-lg bg-peacock-50 px-3 py-2 text-peacock-700">
                  <Info className="mt-0.5 size-3.5 shrink-0" aria-hidden />
                  <span>This is a restricted fund. It can only be spent on this purpose.</span>
                </div>
              ) : null}
            </dl>

            <Button className="mt-5" fullWidth size="lg" onClick={submit}>
              Add and continue
            </Button>
            <p className="mt-3 text-center text-[12px] text-stone-500">
              You will see the full total before paying.
            </p>
          </div>
        </aside>
      </div>
    </div>
  )
}
