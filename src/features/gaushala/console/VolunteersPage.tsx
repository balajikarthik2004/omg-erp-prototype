import { useMemo, useState } from 'react'
import { Award, Building2, Clock, Plus, Search, ThumbsDown, ThumbsUp } from 'lucide-react'

import { PageHeader } from '@/components/layout/PageHeader'
import { Button } from '@/components/ui/Button'
import { Card, CardHeader } from '@/components/ui/Card'
import { Drawer } from '@/components/ui/Drawer'
import { EmptyState } from '@/components/ui/EmptyState'
import { Input, Textarea } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { Stat } from '@/components/ui/Stat'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { Table, type Column } from '@/components/ui/Table'
import { formatDate, formatNumber } from '@/lib/format'
import { toast } from '@/lib/toast'
import { VOLUNTEER_INTERESTS, VOLUNTEER_INTEREST_LABEL } from '@/mock/gaushalaPrograms'
import { useDb } from '@/store/db'
import { CERTIFICATE_HOURS } from '@/store/gaushalaProgramActions'
import { useCurrentUser } from '@/store/session'
import type { Volunteer, VolunteerInterest } from '@/types'

const TODAY = new Date().toISOString().slice(0, 10)

export function VolunteersPage() {
  const db = useDb()
  const [query, setQuery] = useState('')
  const [status, setStatus] = useState('all')
  const [focused, setFocused] = useState<string | null>(null)

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase()
    return db.volunteers.filter(
      (v) =>
        (status === 'all' || v.status === status) &&
        (q === '' ||
          v.name.toLowerCase().includes(q) ||
          v.email.toLowerCase().includes(q) ||
          (v.organisation ?? '').toLowerCase().includes(q)),
    )
  }, [db.volunteers, query, status])

  const pending = db.volunteers.filter((v) => v.status === 'pending')
  const approved = db.volunteers.filter((v) => v.status === 'approved')
  const totalHours = approved.reduce((t, v) => t + v.hours, 0)
  const certifiable = approved.filter((v) => v.hours >= CERTIFICATE_HOURS && !v.certificateIssuedAt)

  const columns: Column<Volunteer>[] = [
    {
      key: 'name',
      header: 'Volunteer',
      primary: true,
      cell: (v) => (
        <div className="min-w-0">
          <p className="flex items-center gap-1.5 truncate font-semibold text-navy-950">
            {v.isGroup ? <Building2 className="size-3.5 shrink-0 text-navy-500" aria-hidden /> : null}
            {v.name}
          </p>
          <p className="truncate text-[12.5px] text-navy-600">
            {v.isGroup ? `${v.organisation ?? 'Group'} · ${v.groupSize} people` : v.city}
          </p>
        </div>
      ),
    },
    {
      key: 'interests',
      header: 'Wants to help with',
      hideOnMobile: true,
      cell: (v) => v.interests.map((i) => VOLUNTEER_INTEREST_LABEL[i]).join(', '),
    },
    { key: 'avail', header: 'Available', hideOnMobile: true, cell: (v) => v.availability },
    { key: 'hours', header: 'Hours', align: 'right', cell: (v) => formatNumber(v.hours) },
    { key: 'applied', header: 'Applied', hideOnMobile: true, cell: (v) => formatDate(v.appliedAt) },
    { key: 'status', header: 'Status', cell: (v) => <StatusBadge status={v.status} /> },
  ]

  const current = focused ? db.volunteers.find((v) => v.id === focused) ?? null : null

  return (
    <div>
      <PageHeader
        title="Volunteers"
      >
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
          <div className="sm:w-72">
            <Input
              aria-label="Search volunteers"
              placeholder="Name, email or organisation"
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
                { value: 'pending', label: 'Awaiting review' },
                { value: 'approved', label: 'Approved' },
                { value: 'rejected', label: 'Declined' },
              ]}
            />
          </div>
        </div>
      </PageHeader>

      <div className="mb-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Stat
          label="Awaiting review"
          value={formatNumber(pending.length)}
          sub="people waiting to hear back"
          deltaMeaning="neutral"
          accentClass="bg-marigold-500"
        />
        <Stat label="Active volunteers" value={formatNumber(approved.length)} accentClass="bg-tulsi-500" />
        <Stat label="Hours given" value={formatNumber(totalHours)} sub="across all logged shifts" accentClass="bg-turmeric-500" />
        <Stat
          label="Certificates due"
          value={formatNumber(certifiable.length)}
          sub={`${CERTIFICATE_HOURS} hours earns one`}
          accentClass="bg-peacock-500"
        />
      </div>

      <Table
        columns={columns}
        rows={rows}
        rowKey={(v) => v.id}
        onRowClick={(v) => setFocused(v.id)}
        empty={
          <EmptyState
            title={db.ready ? 'No application matches that' : 'Loading'}
            message={db.ready ? 'Try a shorter search, or clear the filter.' : 'One moment.'}
          />
        }
      />

      <VolunteerDrawer volunteer={current} onClose={() => setFocused(null)} />
    </div>
  )
}

function VolunteerDrawer({ volunteer, onClose }: { volunteer: Volunteer | null; onClose: () => void }) {
  const db = useDb()
  const actor = useCurrentUser()
  const decideVolunteer = useDb((s) => s.decideVolunteer)
  const logVolunteerShift = useDb((s) => s.logVolunteerShift)
  const issueVolunteerCertificate = useDb((s) => s.issueVolunteerCertificate)

  const [note, setNote] = useState('')
  const [shiftDate, setShiftDate] = useState(TODAY)
  const [area, setArea] = useState<VolunteerInterest>('cow_care')
  const [hours, setHours] = useState('4')

  if (!volunteer) return null

  const shifts = db.volunteerShifts.filter((s) => s.volunteerId === volunteer.id)

  function decide(decision: 'approved' | 'rejected') {
    const result = decideVolunteer(volunteer!.id, decision, actor, note)
    if (!result.ok) {
      toast.danger('Could not do that', result.error)
      return
    }
    setNote('')
  }

  function logShift() {
    const result = logVolunteerShift(
      { volunteerId: volunteer!.id, date: shiftDate, area, hours: Number(hours) || 0 },
      actor,
    )
    if (!result.ok) toast.danger('Could not log it', result.error)
  }

  function certify() {
    const result = issueVolunteerCertificate(volunteer!.id, actor)
    if (!result.ok) toast.danger('Not yet', result.error)
  }

  return (
    <Drawer
      open
      onClose={onClose}
      title={volunteer.name}
      subtitle={volunteer.isGroup ? `${volunteer.organisation ?? 'Group'} · ${volunteer.groupSize} people` : volunteer.city}
      width="lg"
      footer={
        volunteer.status === 'pending' ? (
          <div className="flex gap-2">
            <Button variant="success" icon={<ThumbsUp className="size-4" aria-hidden />} onClick={() => decide('approved')}>
              Approve
            </Button>
            <Button variant="danger" icon={<ThumbsDown className="size-4" aria-hidden />} onClick={() => decide('rejected')}>
              Decline
            </Button>
          </div>
        ) : null
      }
    >
      <div className="space-y-5 px-6 py-5">
        <div className="flex flex-wrap items-center gap-2">
          <StatusBadge status={volunteer.status} />
          {volunteer.certificateIssuedAt ? (
            <span className="inline-flex items-center gap-1.5 rounded-full border border-tulsi-50 bg-tulsi-50 px-2.5 py-0.5 text-[12px] font-semibold text-tulsi-700">
              <Award className="size-3.5" aria-hidden />
              Certificate issued
            </span>
          ) : null}
        </div>

        <dl className="grid grid-cols-2 gap-x-4 gap-y-3 text-[13.5px]">
          <Field label="Email" value={<span className="break-all">{volunteer.email}</span>} />
          <Field label="Phone" value={volunteer.phone || '—'} />
          <Field label="Applied" value={formatDate(volunteer.appliedAt)} />
          <Field label="Hours logged" value={formatNumber(volunteer.hours)} />
        </dl>

        <section>
          <h4 className="text-[11.5px] font-extrabold tracking-[0.14em] text-navy-700 uppercase">Wants to help with</h4>
          <ul className="mt-2 flex flex-wrap gap-1.5">
            {volunteer.interests.map((i) => (
              <li key={i} className="rounded-full border border-navy-200 bg-white px-2.5 py-1 text-[12.5px] text-navy-800">
                {VOLUNTEER_INTEREST_LABEL[i]}
              </li>
            ))}
          </ul>
        </section>

        <section>
          <h4 className="text-[11.5px] font-extrabold tracking-[0.14em] text-navy-700 uppercase">What they can do</h4>
          <p className="mt-1.5 text-[13.5px] leading-relaxed text-navy-800">{volunteer.skills || '—'}</p>
          <p className="mt-2 text-[13px] text-navy-600">Free: {volunteer.availability}</p>
        </section>

        {volunteer.status === 'pending' ? (
          <Textarea
            label="Note"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            hint="Required when declining, so they can be told something useful."
          />
        ) : volunteer.reviewNote ? (
          <p className="rounded-xl border border-navy-100 bg-navy-50/50 px-3.5 py-2.5 text-[13.5px] leading-relaxed text-navy-800">
            {volunteer.reviewNote}
          </p>
        ) : null}

        {volunteer.status === 'approved' ? (
          <>
            <Card>
              <CardHeader title="Log a shift" description="Hours accrue towards their certificate." />
              <div className="space-y-3.5">
                <div className="grid gap-3.5 sm:grid-cols-2">
                  <Input label="Date" type="date" value={shiftDate} onChange={(e) => setShiftDate(e.target.value)} />
                  <Input label="Hours" type="number" min={1} max={14} value={hours} onChange={(e) => setHours(e.target.value)} />
                </div>
                <Select
                  label="Area"
                  value={area}
                  onChange={(e) => setArea(e.target.value as VolunteerInterest)}
                  options={VOLUNTEER_INTERESTS.map((i) => ({ value: i.id, label: i.label }))}
                />
                <Button fullWidth icon={<Plus className="size-4" aria-hidden />} onClick={logShift}>
                  Log the shift
                </Button>
              </div>
            </Card>

            <Button
              fullWidth
              variant="secondary"
              icon={<Award className="size-4" aria-hidden />}
              disabled={volunteer.hours < CERTIFICATE_HOURS || Boolean(volunteer.certificateIssuedAt)}
              title={
                volunteer.certificateIssuedAt
                  ? 'Already issued.'
                  : volunteer.hours < CERTIFICATE_HOURS
                    ? `${CERTIFICATE_HOURS - volunteer.hours} more hours needed.`
                    : undefined
              }
              onClick={certify}
            >
              {volunteer.certificateIssuedAt
                ? `Certificate issued ${formatDate(volunteer.certificateIssuedAt)}`
                : `Issue certificate (${volunteer.hours}/${CERTIFICATE_HOURS} hours)`}
            </Button>

            <section>
              <h4 className="text-[11.5px] font-extrabold tracking-[0.14em] text-navy-700 uppercase">Shifts worked</h4>
              {shifts.length === 0 ? (
                <p className="mt-2 text-[13.5px] text-navy-600">None logged yet.</p>
              ) : (
                <ul className="mt-2.5 space-y-2">
                  {shifts.map((shift) => (
                    <li
                      key={shift.id}
                      className="flex items-center justify-between gap-3 rounded-lg border border-navy-100 bg-white px-3.5 py-2.5"
                    >
                      <span className="min-w-0">
                        <span className="block truncate text-[13.5px] font-medium text-navy-950">
                          {VOLUNTEER_INTEREST_LABEL[shift.area]}
                        </span>
                        <span className="block text-[12.5px] text-navy-600">{formatDate(shift.date)}</span>
                      </span>
                      <span className="inline-flex shrink-0 items-center gap-1.5 font-mono text-[13px] text-navy-900 tabular-nums">
                        <Clock className="size-3.5 text-navy-500" aria-hidden />
                        {shift.hours}h
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          </>
        ) : null}
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
