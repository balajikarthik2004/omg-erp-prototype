import { useMemo, useState } from 'react'
import { AlertTriangle, RefreshCw, Search, Send, XCircle } from 'lucide-react'

import { PageHeader } from '@/components/layout/PageHeader'
import { Button } from '@/components/ui/Button'
import { Drawer } from '@/components/ui/Drawer'
import { EmptyState } from '@/components/ui/EmptyState'
import { Input, Textarea } from '@/components/ui/Input'
import { Money } from '@/components/ui/Money'
import { Select } from '@/components/ui/Select'
import { Stat } from '@/components/ui/Stat'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { Table, type Column } from '@/components/ui/Table'
import { formatDate, formatDue, formatNumber } from '@/lib/format'
import { toast } from '@/lib/toast'
import { ADOPTION_TIER_LABEL } from '@/mock/gaushalaPrograms'
import { useDb } from '@/store/db'
import { useCurrentUser } from '@/store/session'
import type { Adoption, AdopterUpdate } from '@/types'
import { CowPortrait } from '../GaushalaArt'

/** Renewals falling due inside this many days are the ones to chase. */
const RENEWAL_WINDOW_DAYS = 30
const LOADED_AT = Date.now()

export function AdoptionsPage() {
  const db = useDb()
  const [query, setQuery] = useState('')
  const [status, setStatus] = useState('all')
  const [focused, setFocused] = useState<string | null>(null)

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase()
    return db.adoptions.filter((a) => {
      const cow = db.cows.find((c) => c.id === a.cowId)
      return (
        (status === 'all' || a.status === status) &&
        (q === '' ||
          a.adopterName.toLowerCase().includes(q) ||
          a.certificateNo.toLowerCase().includes(q) ||
          (cow?.name ?? '').toLowerCase().includes(q))
      )
    })
  }, [db.adoptions, db.cows, query, status])

  const stats = useMemo(() => {
    const active = db.adoptions.filter((a) => a.status === 'active')
    const dueSoon = active.filter(
      (a) => new Date(a.renewsAt).getTime() - LOADED_AT < RENEWAL_WINDOW_DAYS * 86_400_000,
    )
    const lapsed = db.adoptions.filter((a) => a.status === 'lapsed')
    // What the sponsorships are worth in a year, monthly tiers annualised.
    const annualised = active.reduce(
      (t, a) => t + (a.tier.endsWith('yearly') ? a.amount : a.amount * 12),
      0,
    )
    return { active, dueSoon, lapsed, annualised }
  }, [db.adoptions])

  const columns: Column<Adoption>[] = [
    {
      key: 'cow',
      header: 'Cow',
      primary: true,
      cell: (a) => {
        const cow = db.cows.find((c) => c.id === a.cowId)
        return (
          <div className="flex items-center gap-3">
            <span className="flex size-10 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-navy-100 bg-navy-50">
              {cow ? <CowPortrait portrait={cow.portrait} size={38} /> : null}
            </span>
            <div className="min-w-0">
              <p className="truncate font-semibold text-navy-950">{cow?.name ?? a.cowId}</p>
              <p className="truncate font-mono text-[12px] text-navy-600">{a.certificateNo}</p>
            </div>
          </div>
        )
      },
    },
    { key: 'adopter', header: 'Adopter', cell: (a) => a.adopterName },
    { key: 'tier', header: 'Tier', hideOnMobile: true, cell: (a) => ADOPTION_TIER_LABEL[a.tier] },
    { key: 'amount', header: 'Amount', align: 'right', cell: (a) => <Money value={a.amount} /> },
    {
      key: 'renews',
      header: 'Renews',
      cell: (a) => {
        if (a.status !== 'active') return <span className="text-navy-600">—</span>
        const due = formatDue(a.renewsAt)
        return (
          <span className={due.overdue ? 'font-semibold text-danger-600' : 'text-navy-800'}>{due.label}</span>
        )
      },
    },
    { key: 'status', header: 'Status', cell: (a) => <StatusBadge status={a.status === 'lapsed' ? 'overdue' : a.status} /> },
  ]

  const current = focused ? db.adoptions.find((a) => a.id === focused) ?? null : null

  return (
    <div>
      <PageHeader
        title="Adoptions"
        description="Who is sponsoring which cow, what it is worth, and which renewals need chasing."
        phase="collect"
      >
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
          <div className="sm:w-72">
            <Input
              aria-label="Search adoptions"
              placeholder="Cow, adopter or certificate no"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              leading={<Search className="size-4" aria-hidden />}
            />
          </div>
          <div className="sm:w-52">
            <Select
              aria-label="Filter by status"
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              options={[
                { value: 'all', label: 'Every status' },
                { value: 'active', label: 'Active' },
                { value: 'lapsed', label: 'Lapsed' },
                { value: 'cancelled', label: 'Cancelled' },
              ]}
            />
          </div>
        </div>
      </PageHeader>

      <div className="mb-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Stat label="Active sponsorships" value={formatNumber(stats.active.length)} accentClass="bg-tulsi-500" />
        <Stat
          label="Worth, annualised"
          value={<Money value={stats.annualised} />}
          sub="monthly tiers counted twelve times"
          accentClass="bg-turmeric-500"
        />
        <Stat
          label="Renewing within 30 days"
          value={formatNumber(stats.dueSoon.length)}
          sub="a reminder goes out before each one"
          deltaMeaning="neutral"
          accentClass="bg-peacock-500"
        />
        <Stat
          label="Lapsed"
          value={formatNumber(stats.lapsed.length)}
          sub={stats.lapsed.length > 0 ? 'the cow is back on the public list' : 'nothing outstanding'}
          accentClass="bg-kumkum-500"
        />
      </div>

      {stats.lapsed.length > 0 ? (
        <p className="mb-5 flex items-start gap-2.5 rounded-xl border border-marigold-50 bg-marigold-50/60 px-4 py-3 text-[13.5px] leading-relaxed text-marigold-500">
          <AlertTriangle className="mt-0.5 size-4 shrink-0" aria-hidden />
          <span>
            {stats.lapsed.length} sponsorship{stats.lapsed.length === 1 ? ' has' : 's have'} lapsed. The cow goes back
            on the public list automatically, but the adopter is usually worth a telephone call first.
          </span>
        </p>
      ) : null}

      <Table
        columns={columns}
        rows={rows}
        rowKey={(a) => a.id}
        onRowClick={(a) => setFocused(a.id)}
        empty={
          <EmptyState
            title={db.ready ? 'No adoption matches that' : 'Loading'}
            message={db.ready ? 'Try a shorter search, or clear the status filter.' : 'One moment.'}
          />
        }
      />

      <AdoptionDrawer adoption={current} onClose={() => setFocused(null)} />
    </div>
  )
}

function AdoptionDrawer({ adoption, onClose }: { adoption: Adoption | null; onClose: () => void }) {
  const db = useDb()
  const actor = useCurrentUser()
  const renewAdoption = useDb((s) => s.renewAdoption)
  const cancelAdoption = useDb((s) => s.cancelAdoption)
  const postAdopterUpdate = useDb((s) => s.postAdopterUpdate)

  const [kind, setKind] = useState<AdopterUpdate['kind']>('photo')
  const [title, setTitle] = useState('')
  const [body, setBody] = useState('')

  if (!adoption) return null
  const cow = db.cows.find((c) => c.id === adoption.cowId)

  function act(result: { ok: boolean; error?: string }, closeAfter = false) {
    if (!result.ok) {
      toast.danger('Could not do that', result.error)
      return
    }
    if (closeAfter) onClose()
  }

  function send() {
    const result = postAdopterUpdate(
      adoption!.id,
      { kind, title, body, art: Math.floor(Math.random() * 6) },
      actor,
    )
    if (!result.ok) {
      toast.danger('Could not send it', result.error)
      return
    }
    setTitle('')
    setBody('')
  }

  return (
    <Drawer
      open
      onClose={onClose}
      title={cow?.name ?? adoption.cowId}
      subtitle={`${adoption.adopterName} · ${adoption.certificateNo}`}
      width="lg"
      footer={
        adoption.status !== 'cancelled' ? (
          <div className="flex flex-wrap gap-2">
            <Button icon={<RefreshCw className="size-4" aria-hidden />} onClick={() => act(renewAdoption(adoption.id, actor))}>
              Renew
            </Button>
            <Button
              variant="danger"
              icon={<XCircle className="size-4" aria-hidden />}
              onClick={() => act(cancelAdoption(adoption.id, actor), true)}
            >
              Cancel sponsorship
            </Button>
          </div>
        ) : null
      }
    >
      <div className="space-y-5 px-6 py-5">
        <div className="flex items-center gap-4">
          <span className="flex size-20 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-navy-100 bg-navy-50">
            {cow ? <CowPortrait portrait={cow.portrait} size={76} /> : null}
          </span>
          <dl className="grid flex-1 grid-cols-2 gap-x-4 gap-y-2 text-[13.5px]">
            <Field label="Tier" value={ADOPTION_TIER_LABEL[adoption.tier]} />
            <Field label="Amount" value={<Money value={adoption.amount} />} />
            <Field label="Started" value={formatDate(adoption.startedAt)} />
            <Field label="Renews" value={formatDate(adoption.renewsAt)} />
            <Field label="Email" value={<span className="break-all">{adoption.adopterEmail}</span>} />
            <Field label="Status" value={<StatusBadge status={adoption.status === 'lapsed' ? 'overdue' : adoption.status} />} />
          </dl>
        </div>

        <section className="rounded-xl border border-navy-100 bg-navy-50/50 p-4">
          <h4 className="text-[11.5px] font-extrabold tracking-[0.14em] text-navy-700 uppercase">
            Send the adopter an update
          </h4>
          <p className="mt-1 text-[12.5px] leading-relaxed text-navy-600">
            This is what they paid for. A photograph a month is the promise on the public page.
          </p>
          <div className="mt-3.5 space-y-3.5">
            <Select
              label="Kind"
              value={kind}
              onChange={(e) => setKind(e.target.value as AdopterUpdate['kind'])}
              options={[
                { value: 'photo', label: 'Photograph' },
                { value: 'health', label: 'Health report' },
                { value: 'note', label: 'A note' },
              ]}
            />
            <Input label="Title" value={title} onChange={(e) => setTitle(e.target.value)} />
            <Textarea label="What to say" value={body} onChange={(e) => setBody(e.target.value)} />
            <Button fullWidth icon={<Send className="size-4" aria-hidden />} onClick={send}>
              Send to {adoption.adopterName.split(' ')[0]}
            </Button>
          </div>
        </section>

        <section>
          <h4 className="text-[11.5px] font-extrabold tracking-[0.14em] text-navy-700 uppercase">Already sent</h4>
          {adoption.updates.length === 0 ? (
            <p className="mt-2.5 text-[13.5px] text-navy-600">Nothing yet. They are waiting.</p>
          ) : (
            <ul className="mt-3 space-y-2.5">
              {adoption.updates.map((update) => (
                <li key={update.id} className="rounded-xl border border-navy-100 bg-white px-3.5 py-3">
                  <div className="flex items-baseline justify-between gap-3">
                    <span className="text-[13.5px] font-bold text-navy-950">{update.title}</span>
                    <span className="shrink-0 font-mono text-[12px] text-navy-600">{formatDate(update.at)}</span>
                  </div>
                  <p className="mt-0.5 text-[13px] leading-relaxed text-navy-700">{update.body}</p>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </Drawer>
  )
}

function Field({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <dt className="text-[11px] tracking-[0.12em] text-navy-600 uppercase">{label}</dt>
      <dd className="mt-0.5 text-navy-950">{value}</dd>
    </div>
  )
}
