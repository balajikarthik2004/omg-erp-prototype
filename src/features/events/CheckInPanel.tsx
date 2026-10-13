import { useState } from 'react'
import { CircleCheck, CircleX, ScanLine } from 'lucide-react'

import { formatDateTime } from '@/lib/format'
import { Button } from '@/components/ui/Button'
import { Card, CardHeader } from '@/components/ui/Card'
import { Input } from '@/components/ui/Input'
import { useDb } from '@/store/db'
import { currentUser, useSession } from '@/store/session'
import { checkInBlock } from './logic/rules'
import type { EventView } from './useEvent'

interface Attempt {
  ok: boolean
  text: string
  at: string
}

/** The check-in desk. One scan per ticket, only while the event is live. Paste a code here, or open a registration and scan it. */
export function CheckInPanel({ view }: { view: EventView }) {
  const { event, registrations } = view
  const personaId = useSession((s) => s.personaId)
  const user = currentUser(personaId)
  const checkIn = useDb((s) => s.checkInTicket)
  const [token, setToken] = useState('')
  const [attempts, setAttempts] = useState<Attempt[]>([])

  const block = checkInBlock(user) ?? (event.status === 'live' ? null : 'Check-in opens when the event goes live.')
  const recent = registrations.filter((r) => r.checkedInAt).sort((a, b) => (b.checkedInAt ?? '').localeCompare(a.checkedInAt ?? '')).slice(0, 6)

  function scan(code: string) {
    const r = checkIn(event.id, code, user)
    setAttempts((a) => [{ ok: r.ok, text: r.ok ? `${r.registration.name} is in (${r.registration.qty}).` : r.error, at: new Date().toISOString() }, ...a].slice(0, 6))
    if (r.ok) setToken('')
  }

  return (
    <div className="grid gap-6 lg:grid-cols-2 lg:items-start">
      <Card accentClass={block ? 'bg-sandal-300' : 'bg-tulsi-500'}>
        <CardHeader title="Scan a ticket" description="Each ticket carries a signed code. A copied, edited or other-event code is refused." />
        <div className="mt-4 flex flex-col gap-3">
          <Input label="Ticket code" placeholder="tkt-…" value={token} onChange={(e) => setToken(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && !block && scan(token)} className="font-mono" disabled={Boolean(block)} />
          {block ? <p className="text-[13px] text-marigold-500">{block}</p> : null}
          <Button icon={<ScanLine className="size-4" aria-hidden />} disabled={Boolean(block) || !token.trim()} onClick={() => scan(token)}>Check in</Button>
        </div>
        {attempts.length > 0 ? (
          <ul className="mt-4 flex flex-col gap-2" aria-live="polite">
            {attempts.map((a, i) => (
              <li key={i} className={a.ok ? 'flex items-start gap-2 rounded-lg bg-tulsi-50 px-3 py-2 text-[13px] text-tulsi-700' : 'flex items-start gap-2 rounded-lg bg-danger-50 px-3 py-2 text-[13px] text-danger-600'}>
                {a.ok ? <CircleCheck className="mt-0.5 size-4 shrink-0" aria-hidden /> : <CircleX className="mt-0.5 size-4 shrink-0" aria-hidden />}
                {a.text}
              </li>
            ))}
          </ul>
        ) : null}
      </Card>

      <Card>
        <CardHeader title="Just checked in" />
        {recent.length === 0 ? (
          <p className="mt-3 text-[14px] text-stone-500">Nobody has been scanned in yet.</p>
        ) : (
          <ul className="mt-3 divide-y divide-sandal-200">
            {recent.map((r) => (
              <li key={r.id} className="flex items-center justify-between gap-3 py-2.5 text-[14px]">
                <span className="text-stone-900">{r.name} <span className="text-stone-500">· {r.qty}</span></span>
                <span className="font-mono text-[12px] text-stone-500 tabular-nums">{formatDateTime(r.checkedInAt!)}</span>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  )
}
