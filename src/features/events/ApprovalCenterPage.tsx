import { useMemo, useState } from 'react'
import { ArrowRight, CalendarDays, ClipboardCheck, Clock, FileCheck2, ImageIcon, MapPin, Search, ShieldCheck, UserRoundCheck } from 'lucide-react'

import { cn } from '@/lib/cn'
import { formatAge, formatDate, formatDue } from '@/lib/format'
import { Button } from '@/components/ui/Button'
import { Card, CardHeader } from '@/components/ui/Card'
import { EmptyState } from '@/components/ui/EmptyState'
import { Input } from '@/components/ui/Input'
import { Money } from '@/components/ui/Money'
import { Select } from '@/components/ui/Select'
import { Stat } from '@/components/ui/Stat'
import { Tabs } from '@/components/ui/Tabs'
import { PageHeader } from '@/components/layout/PageHeader'
import { SectorChip } from '@/components/layout/PhaseChip'
import { initials } from '@/lib/format'
import { ROLE_LABEL, userName, userById } from '@/mock/seed'
import { useDb } from '@/store/db'
import { approvalTasks, taskBlock } from '@/store/selectors'
import { currentUser, useSession } from '@/store/session'
import type { ApprovalTask, EventApproval, EventRecord } from '@/types'
import { ApprovalDetailDrawer } from './ApprovalDetailDrawer'

/** Fixed at load, so a render never reads the clock. Close enough for a "starts within 30 days" flag. */
const LOADED_AT = Date.now()

const PERSONAS = [
  { id: 'u-adm', label: 'Preparer / Admin' },
  { id: 'u-adm2', label: '2nd Admin / Poster' },
  { id: 'u-cas', label: 'CA / Step 1' },
  { id: 'u-tru', label: 'Trustee / Step 2' },
]

interface Request {
  task: ApprovalTask
  event: EventRecord
  stage: string
  block: string | null
  priority: boolean
}

interface Step {
  title: string
  detail: string
  state: 'done' | 'pending' | 'todo' | 'rejected'
}

function timeline(r: Request, approvals: EventApproval[]): Step[] {
  const mine = approvals.filter((a) => a.entityId === r.event.id)
  const describe = (a: EventApproval | undefined): Step['state'] => (a?.decision === 'approved' ? 'done' : a?.decision === 'rejected' ? 'rejected' : a ? 'pending' : 'todo')
  if (r.task.kind === 'event_poster') {
    const a = [...mine].reverse().find((x) => x.entityType === 'event_poster')
    return [
      { title: 'Design chosen', detail: `by ${userName(r.event.lastPreparerId ?? r.event.createdBy)}`, state: 'done' },
      { title: 'Admin review', detail: a?.decision ? `${a.decision === 'approved' ? 'Approved' : 'Sent back'} by ${userName(a.decidedBy ?? '')}` : 'Pending approval', state: describe(a) },
      { title: 'Published', detail: r.event.status === 'published' ? 'Registration is open' : '—', state: r.event.status === 'published' ? 'done' : 'todo' },
    ]
  }
  const step = (n: number) => [...mine].reverse().find((x) => x.entityType === 'event_budget' && x.step === n)
  const ca = step(1)
  const tr = step(2)
  const first = mine.find((x) => x.entityType === 'event_budget')
  return [
    { title: 'Submitted', detail: `${first ? formatDate(first.createdAt) : '—'} by ${userName(r.event.lastPreparerId ?? r.event.createdBy)}`, state: 'done' },
    { title: 'Under CA review', detail: ca?.decision ? `${ca.decision === 'approved' ? 'Approved' : 'Sent back'} by ${userName(ca.decidedBy ?? '')}` : 'Pending approval', state: describe(ca) },
    { title: 'Trustee approval', detail: tr?.decision ? `${tr.decision === 'approved' ? 'Approved' : 'Sent back'} by ${userName(tr.decidedBy ?? '')}` : tr ? 'Pending approval' : 'Pending', state: describe(tr) },
    { title: 'Completed', detail: ['budget_approved', 'confirmed'].includes(r.event.status) ? 'Budget approved' : '—', state: r.event.status === 'budget_approved' ? 'done' : 'todo' },
  ]
}

const DOT: Record<Step['state'], string> = { done: 'bg-tulsi-500', pending: 'bg-marigold-500', todo: 'bg-sandal-300', rejected: 'bg-danger-600' }

/** Every event budget and poster waiting on a person, with the four-eyes rule stated beside each one. */
export function ApprovalCenterPage() {
  const db = useDb()
  const filter = useSession((s) => s.sectorFilter)
  const personaId = useSession((s) => s.personaId)
  const setPersona = useSession((s) => s.setPersona)
  const user = currentUser(personaId)
  const [tab, setTab] = useState('all')
  const [query, setQuery] = useState('')
  const [sort, setSort] = useState('newest')
  const [selectedId, setSelectedId] = useState<string>()
  const [open, setOpen] = useState<Request>()

  const requests = useMemo<Request[]>(() => {
    if (!db.ready) return []
    return approvalTasks(db, filter)
      .filter((t) => t.kind === 'event_budget' || t.kind === 'event_poster')
      .flatMap((task) => {
        const event = db.events.find((e) => e.id === task.id)
        if (!event) return []
        const days = (new Date(event.startAt).getTime() - LOADED_AT) / 86_400_000
        return [{
          task, event,
          stage: task.kind === 'event_poster' ? 'SECTOR ADMIN REVIEW' : event.status === 'budget_ca_ok' ? 'TRUSTEE APPROVAL' : 'CA REVIEW',
          block: taskBlock(db, task, user),
          priority: formatDue(task.dueAt).overdue || days < 30,
        }]
      })
  }, [db, filter, user])

  const decided = useMemo(() => db.eventApprovals.filter((a) => a.decision).sort((a, b) => (b.decidedAt ?? '').localeCompare(a.decidedAt ?? '')), [db.eventApprovals])
  const shown = requests
    .filter((r) => (tab === 'budget' ? r.task.kind === 'event_budget' : tab === 'poster' ? r.task.kind === 'event_poster' : true))
    .filter((r) => { const q = query.trim().toLowerCase(); return q === '' || r.event.name.toLowerCase().includes(q) || r.event.id.includes(q) || r.event.venue.toLowerCase().includes(q) })
    .sort((a, b) => (sort === 'oldest' ? a.task.preparedAt.localeCompare(b.task.preparedAt) : sort === 'amount' ? b.task.amount - a.task.amount : b.task.preparedAt.localeCompare(a.task.preparedAt)))
  const selected = shown.find((r) => r.task.id === selectedId && r.task.kind === shown[0]?.task.kind) ?? shown.find((r) => r.task.id === selectedId) ?? shown[0]
  const mine = requests.filter((r) => !r.block).length

  return (
    <div>
      <PageHeader
        phase="control"
        title={<span className="flex flex-wrap items-center gap-3">Approval Center<span className="inline-flex items-center gap-1.5 rounded-full border border-turmeric-100 bg-turmeric-50 px-3 py-1 font-sans text-[13px] font-medium text-turmeric-700"><ShieldCheck className="size-4" aria-hidden />Four-eyes governance</span></span>}
        description="Review event budgets and posters with clear accountability. Whoever prepared something can never approve it."
        actions={
          <div className="flex flex-wrap items-center gap-1.5 rounded-lg border border-sandal-200 bg-sandal-100 p-1" role="group" aria-label="Switch role">
            <span className="px-2 text-[12px] text-stone-500">Switch role</span>
            {PERSONAS.map((p) => (
              <button key={p.id} type="button" aria-pressed={personaId === p.id} onClick={() => setPersona(p.id)} className={cn('rounded-md px-3 py-1.5 text-[13px] transition-colors duration-150', personaId === p.id ? 'bg-stone-900 font-medium text-sandal-50' : 'text-stone-700 hover:bg-sandal-50')}>
                {userById(p.id)?.name.split(' ')[0]} <span className="opacity-70">({p.label})</span>
              </button>
            ))}
          </div>
        }
      />

      <div className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Stat label="Pending queue" value={requests.length} sub={`${mine} awaiting your action`} accentClass="bg-marigold-500" icon={<Clock className="size-4" aria-hidden />} />
        <Stat label="Budget reviews" value={requests.filter((r) => r.task.kind === 'event_budget').length} sub="Need CA, then Trustee, approval" accentClass="bg-tulsi-500" icon={<FileCheck2 className="size-4" aria-hidden />} />
        <Stat label="Poster reviews" value={requests.filter((r) => r.task.kind === 'event_poster').length} sub="Awaiting a different admin" accentClass="bg-peacock-500" icon={<ImageIcon className="size-4" aria-hidden />} />
        <Stat label="Maker-checker controls" value="Active" sub="Enforced across all approvals" accentClass="bg-kumkum-600" icon={<ShieldCheck className="size-4" aria-hidden />} />
      </div>

      <div className="grid gap-6 xl:grid-cols-[1fr_340px] xl:items-start">
        <Card padded={false}>
          <div className="p-5 pb-0">
            <h2 className="font-display text-[20px] text-stone-900">Approval requests</h2>
            <Tabs className="mt-3" value={tab} onChange={setTab} items={[
              { id: 'all', label: 'All pending', count: requests.length },
              { id: 'budget', label: 'Budget reviews', count: requests.filter((r) => r.task.kind === 'event_budget').length },
              { id: 'poster', label: 'Poster reviews', count: requests.filter((r) => r.task.kind === 'event_poster').length },
              { id: 'audit', label: 'Audit trail', count: decided.length },
            ]} />
          </div>

          {tab !== 'audit' ? (
            <div className="flex flex-col gap-4 p-5">
              <div className="grid gap-3 sm:grid-cols-[1fr_180px]">
                <Input aria-label="Search requests" placeholder="Search by event name, ID or venue" value={query} onChange={(e) => setQuery(e.target.value)} leading={<Search className="size-4" aria-hidden />} />
                <Select aria-label="Sort" value={sort} onChange={(e) => setSort(e.target.value)} options={[{ value: 'newest', label: 'Sort: Newest' }, { value: 'oldest', label: 'Sort: Oldest' }, { value: 'amount', label: 'Sort: Amount' }]} />
              </div>

              {shown.length === 0 ? (
                <EmptyState icon={<ClipboardCheck className="size-6" aria-hidden />} title="Nothing is waiting" message={requests.length === 0 ? 'Every event budget and poster has been decided.' : 'No request matches. Clear the search or pick another tab.'} />
              ) : (
                <ul className="flex flex-col gap-4">
                  {shown.map((r) => {
                    const lines = db.eventBudgetLines.filter((l) => l.eventId === r.event.id)
                    const due = formatDue(r.task.dueAt)
                    const prep = userById(r.task.preparedBy)
                    return (
                      <li key={`${r.task.kind}-${r.task.id}`}>
                        <div role="button" tabIndex={0} onClick={() => setSelectedId(r.task.id)} onKeyDown={(e) => e.key === 'Enter' && setSelectedId(r.task.id)}
                          className={cn('cursor-pointer rounded-card border bg-sandal-50 p-4 transition-colors duration-150 hover:border-turmeric-400', selected && r.task.id === selected.task.id && r.task.kind === selected.task.kind ? 'border-turmeric-500 shadow-card' : 'border-sandal-200')}>
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="rounded-md bg-marigold-50 px-2 py-1 text-[11px] font-semibold tracking-[0.06em] text-marigold-500">{r.stage}</span>
                              <span className="font-mono text-[12px] text-stone-500">ID: {r.event.id}</span>
                            </div>
                            <div className="flex flex-wrap items-center gap-2">
                              <SectorChip sectorId={r.event.sectorId} />
                              <span className="rounded-md border border-peacock-50 bg-peacock-50 px-2 py-1 text-[12px] text-peacock-700">{r.task.kind === 'event_poster' ? 'Poster approval' : 'Budget approval'}</span>
                              {r.priority ? <span className="inline-flex items-center gap-1 text-[12px] font-medium text-danger-600"><span className="size-1.5 rounded-full bg-danger-600" aria-hidden />High priority</span> : null}
                            </div>
                          </div>

                          <div className="mt-3 grid gap-3 md:grid-cols-[1.3fr_0.7fr_1fr_auto] md:items-center">
                            <div className="min-w-0">
                              <p className="font-medium text-stone-900">{r.event.name}</p>
                              <p className="mt-1 flex flex-wrap items-center gap-x-3 text-[13px] text-stone-500">
                                <span className="inline-flex items-center gap-1"><MapPin className="size-3.5" aria-hidden />{r.event.venue}</span>
                                <span className="inline-flex items-center gap-1"><CalendarDays className="size-3.5" aria-hidden />{formatDate(r.event.startAt)}</span>
                              </p>
                            </div>
                            <div>
                              {r.task.kind === 'event_budget' ? (<><p className="text-[11px] text-stone-500">Amount</p><Money value={r.task.amount} className="text-[18px] font-medium" /><p className="text-[12px] text-stone-500">({lines.length} services)</p></>) : <p className="text-[13px] text-stone-500">Poster for {r.event.name}</p>}
                            </div>
                            <div className="flex items-center gap-2.5">
                              <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-stone-900 font-mono text-[12px] text-sandal-50">{initials(prep?.name ?? '?')}</span>
                              <div className="text-[13px]">
                                <p className="text-stone-500">Submitted by</p>
                                <p className="font-medium text-stone-900">{userName(r.task.preparedBy)}</p>
                                <p className="text-stone-500">{prep ? ROLE_LABEL[prep.role] : ''} · {formatAge(r.task.preparedAt)}</p>
                              </div>
                            </div>
                            <div className="flex flex-col items-start gap-1.5 md:items-end">
                              <span className={cn('text-[13px]', due.overdue ? 'text-danger-600' : 'text-stone-500')}>{r.block ? <span className="inline-flex items-center gap-1 text-marigold-500"><UserRoundCheck className="size-4" aria-hidden />{r.block.startsWith('You prepared') ? 'Prepared by you' : 'Waiting on someone else'}</span> : 'Awaiting you'}</span>
                              <Button size="sm" variant={r.block ? 'secondary' : 'primary'} rightIcon={<ArrowRight className="size-4" aria-hidden />} onClick={(e) => { e.stopPropagation(); setOpen(r) }}>View details</Button>
                            </div>
                          </div>
                          {r.block ? <p className="mt-2 text-[12px] text-stone-500">{r.block}</p> : null}

                          {r.task.kind === 'event_budget' ? (
                            <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-sandal-200 pt-3">
                              <span className="text-[11px] font-semibold tracking-[0.1em] text-stone-500 uppercase">Allocated services</span>
                              {lines.slice(0, 4).map((l) => (<span key={l.id} className="rounded-md border border-turmeric-100 bg-turmeric-50 px-2 py-0.5 text-[12px] text-stone-700">{l.category.split(/[ ,&]/)[0]}: <span className="font-mono tabular-nums">{new Intl.NumberFormat(undefined, { notation: 'compact', style: 'currency', currency: 'USD' }).format(l.requestedAmount / 100)}</span></span>))}
                              {lines.length > 4 ? <span className="text-[12px] text-stone-500">+{lines.length - 4} more</span> : null}
                            </div>
                          ) : null}
                        </div>
                      </li>
                    )
                  })}
                </ul>
              )}
            </div>
          ) : (
            <ul className="divide-y divide-sandal-200 p-2">
              {decided.length === 0 ? <li className="p-5 text-[14px] text-stone-500">No decisions yet.</li> : null}
              {decided.map((a) => (
                <li key={a.id} className="flex flex-wrap items-start justify-between gap-3 px-3 py-3 text-[14px]">
                  <div>
                    <p className="text-stone-900">{db.events.find((e) => e.id === a.entityId)?.name ?? a.entityId} · {a.entityType === 'event_poster' ? 'Poster' : a.step === 1 ? 'Budget, CA review' : 'Budget, Trustee'}</p>
                    <p className="text-[13px] text-stone-500">{a.decision === 'approved' ? 'Approved' : 'Sent back'} by {userName(a.decidedBy ?? '')}{a.comment ? `: ${a.comment}` : ''}</p>
                  </div>
                  <span className="font-mono text-[12px] text-stone-500 tabular-nums">{a.decidedAt ? formatDate(a.decidedAt) : ''}</span>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <aside className="flex flex-col gap-6">
          <Card>
            <CardHeader title="Review guidance" />
            <ol className="mt-3 flex flex-col gap-3 text-[14px]">
              <li className="flex gap-3"><span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-turmeric-500 font-mono text-[13px] text-stone-900">1</span><span><span className="font-medium text-stone-900">CA review</span><br /><span className="text-stone-500">Verify the budget and its content</span></span></li>
              <li className="flex gap-3"><span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-turmeric-500 font-mono text-[13px] text-stone-900">2</span><span><span className="font-medium text-stone-900">Trustee approval</span><br /><span className="text-stone-500">Final authorisation, with any line trimmed</span></span></li>
            </ol>
            <p className="mt-4 rounded-lg border border-tulsi-50 bg-tulsi-50 px-3 py-2.5 text-[13px] leading-snug text-tulsi-700"><span className="font-medium">Four-eyes governance.</span> The preparer cannot approve their own transactions. Each request must be reviewed by an independent person at the next gate.</p>
          </Card>

          {selected ? (
            <Card>
              <CardHeader title="Approval timeline" description={selected.event.name} />
              <ol className="mt-4 flex flex-col">
                {timeline(selected, db.eventApprovals).map((s, i, all) => (
                  <li key={s.title} className="relative flex gap-3 pb-5 last:pb-0">
                    {i < all.length - 1 ? <span className="absolute top-3 left-[5px] h-full w-px bg-sandal-200" aria-hidden /> : null}
                    <span className={cn('relative mt-1 size-[11px] shrink-0 rounded-full', DOT[s.state])} aria-hidden />
                    <div className="text-[14px]">
                      <p className="font-medium text-stone-900">{s.title}</p>
                      <p className={cn('text-[13px]', s.state === 'pending' ? 'text-marigold-500' : s.state === 'rejected' ? 'text-danger-600' : 'text-stone-500')}>{s.detail}</p>
                    </div>
                  </li>
                ))}
              </ol>
            </Card>
          ) : null}
        </aside>
      </div>

      <ApprovalDetailDrawer key={open ? `${open.task.kind}-${open.event.id}` : 'none'} eventId={open?.event.id} kind={(open?.task.kind as 'event_budget' | 'event_poster') ?? 'event_budget'} onClose={() => setOpen(undefined)} />
    </div>
  )
}
