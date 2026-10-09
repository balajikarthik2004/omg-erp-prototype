import { useState } from 'react'
import { CheckCircle2, Circle, Plus, Trash2 } from 'lucide-react'

import { SECTORS } from '@/config'
import { formatMoney } from '@/lib/format'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { api } from '@/mock/api'
import type { Role } from '@/types'
import type { StepProps } from './WizardStepsA'
import { DEMO_TEAM, MODULE_LABELS, REQUIRED_ROLES, ROLE_OPTIONS, templateCounts, toCents } from './wizard'

export function SquareStep({ draft, set }: StepProps) {
  const [busy, setBusy] = useState(false)

  async function verify() {
    setBusy(true)
    await api.process(1000)
    setBusy(false)
    set({ squareVerified: draft.squareLocationId.trim().length >= 6 })
  }

  return (
    <div className="flex max-w-lg flex-col gap-4">
      <Input
        label="Square location ID"
        placeholder="L8K2M4Q7ZP"
        value={draft.squareLocationId}
        onChange={(e) => set({ squareLocationId: e.target.value, squareVerified: false })}
        hint="From the Square dashboard. Card, Apple Pay and Google Pay settle to this location."
        className="font-mono"
      />
      <div className="flex items-center gap-3">
        <Button variant="secondary" loading={busy} disabled={draft.squareLocationId.trim().length < 6} onClick={() => void verify()}>
          Verify connection
        </Button>
        {draft.squareVerified ? (
          <span className="inline-flex items-center gap-1.5 text-[14px] text-tulsi-700">
            <CheckCircle2 className="size-4" aria-hidden />
            Connected. Webhooks will be accepted from this location.
          </span>
        ) : (
          <span className="text-[13px] text-stone-500">Use at least 6 characters. This is a mock check.</span>
        )}
      </div>
    </div>
  )
}

export function ThresholdsStep({ draft, set }: StepProps) {
  const staff = toCents(draft.staffMax)
  const partner = toCents(draft.partnerMax)
  return (
    <div className="flex flex-col gap-5">
      <div className="grid max-w-lg gap-4 sm:grid-cols-2">
        <Input
          label="CA Staff can approve up to"
          inputMode="decimal"
          leading={<span>$</span>}
          value={draft.staffMax}
          onChange={(e) => set({ staffMax: e.target.value })}
          className="font-mono tabular-nums"
        />
        <Input
          label="CA Partner can approve up to"
          inputMode="decimal"
          leading={<span>$</span>}
          value={draft.partnerMax}
          onChange={(e) => set({ partnerMax: e.target.value })}
          className="font-mono tabular-nums"
        />
      </div>
      <ul className="max-w-lg divide-y divide-sandal-200 rounded-card border border-sandal-200 text-[14px]">
        <li className="flex justify-between px-4 py-2.5">
          <span className="text-stone-700">Up to {formatMoney(staff || 0)}</span>
          <span className="text-stone-900">CA Staff</span>
        </li>
        <li className="flex justify-between px-4 py-2.5">
          <span className="text-stone-700">
            {formatMoney(staff || 0)} to {formatMoney(partner || 0)}
          </span>
          <span className="text-stone-900">CA Partner</span>
        </li>
        <li className="flex justify-between px-4 py-2.5">
          <span className="text-stone-700">Above {formatMoney(partner || 0)}</span>
          <span className="text-stone-900">CA Partner + Trustee</span>
        </li>
      </ul>
      <p className="text-[13px] text-stone-500">The person who prepares a transaction can never approve it, whatever the amount.</p>
    </div>
  )
}

export function UsersStep({ draft, set }: StepProps) {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [role, setRole] = useState<Role>('sector_admin')

  const add = (u: { name: string; email: string; role: Role }) =>
    set({ users: [...draft.users, { ...u, id: `tu-${Date.now().toString(36)}-${draft.users.length}` }] })

  return (
    <div className="flex flex-col gap-5">
      <ul className="grid gap-2 sm:grid-cols-2">
        {REQUIRED_ROLES.map((r) => {
          const filled = draft.users.some((u) => u.role === r)
          const Icon = filled ? CheckCircle2 : Circle
          return (
            <li key={r} className="flex items-center gap-2 text-[14px]">
              <Icon className={filled ? 'size-4 text-tulsi-700' : 'size-4 text-stone-500'} aria-hidden />
              <span className={filled ? 'text-stone-900' : 'text-stone-500'}>
                {ROLE_OPTIONS.find((o) => o.value === r)?.label} {filled ? '' : '(required)'}
              </span>
            </li>
          )
        })}
      </ul>

      <div className="grid gap-3 rounded-card border border-sandal-200 bg-sandal-100 p-4 sm:grid-cols-[1fr_1fr_180px_auto] sm:items-end">
        <Input label="Name" value={name} onChange={(e) => setName(e.target.value)} />
        <Input label="Email" value={email} onChange={(e) => setEmail(e.target.value)} />
        <Select label="Role" value={role} onChange={(e) => setRole(e.target.value as Role)} options={ROLE_OPTIONS} />
        <Button
          icon={<Plus className="size-4" aria-hidden />}
          disabled={name.trim().length < 2 || !email.includes('@')}
          onClick={() => {
            add({ name: name.trim(), email: email.trim(), role })
            setName('')
            setEmail('')
          }}
        >
          Add
        </Button>
      </div>

      <div>
        <Button variant="ghost" size="sm" onClick={() => DEMO_TEAM.forEach((u) => add(u))} disabled={draft.users.length > 0}>
          Fill the four approver roles with a demo team
        </Button>
      </div>

      {draft.users.length > 0 ? (
        <ul className="divide-y divide-sandal-200 rounded-card border border-sandal-200">
          {draft.users.map((u) => (
            <li key={u.id} className="flex items-center justify-between gap-3 px-4 py-2.5 text-[14px]">
              <span className="min-w-0">
                <span className="block truncate text-stone-900">{u.name}</span>
                <span className="block truncate text-[13px] text-stone-500">{u.email}</span>
              </span>
              <span className="flex items-center gap-3">
                <span className="text-stone-700">{ROLE_OPTIONS.find((o) => o.value === u.role)?.label}</span>
                <button
                  type="button"
                  aria-label={`Remove ${u.name}`}
                  onClick={() => set({ users: draft.users.filter((x) => x.id !== u.id) })}
                  className="rounded-lg p-1.5 text-stone-500 hover:bg-sandal-100 hover:text-danger-600"
                >
                  <Trash2 className="size-4" aria-hidden />
                </button>
              </span>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  )
}

export function ReviewStep({ draft }: StepProps) {
  const t = templateCounts(draft.verticals)
  const rows: [string, string][] = [
    ['Customer', `${draft.name} · ${draft.domain}`],
    ['Verticals', draft.verticals.map((v) => SECTORS[v].name).join(', ')],
    ['Modules', draft.modules.map((m) => MODULE_LABELS[m].label).join(', ')],
    ['Template', `${t.catalog.length} catalog items, ${t.funds} funds, ${t.budgets} budget heads, ${t.inventory} stock items`],
    ['Square', `${draft.squareLocationId} (verified)`],
    ['Approvals', `Staff to ${formatMoney(toCents(draft.staffMax))}, Partner to ${formatMoney(toCents(draft.partnerMax))}, then Partner + Trustee`],
    ['Users', `${draft.users.length} users across ${new Set(draft.users.map((u) => u.role)).size} roles`],
  ]
  return (
    <dl className="divide-y divide-sandal-200 rounded-card border border-sandal-200">
      {rows.map(([k, v]) => (
        <div key={k} className="grid gap-1 px-4 py-3 sm:grid-cols-[160px_1fr]">
          <dt className="text-[11px] font-semibold tracking-[0.12em] text-stone-500 uppercase">{k}</dt>
          <dd className="text-[14px] text-stone-900">{v}</dd>
        </div>
      ))}
    </dl>
  )
}
