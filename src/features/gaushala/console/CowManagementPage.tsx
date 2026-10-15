import { useMemo, useState } from 'react'
import { Plus, Search, Stethoscope } from 'lucide-react'

import { PageHeader } from '@/components/layout/PageHeader'
import { Button } from '@/components/ui/Button'
import { Drawer } from '@/components/ui/Drawer'
import { EmptyState } from '@/components/ui/EmptyState'
import { Input, Textarea } from '@/components/ui/Input'
import { Money } from '@/components/ui/Money'
import { Select } from '@/components/ui/Select'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { Table, type Column } from '@/components/ui/Table'
import { formatDate, titleCase } from '@/lib/format'
import { toast } from '@/lib/toast'
import { USERS, userName } from '@/mock/seed'
import { useDb } from '@/store/db'
import { useCurrentUser } from '@/store/session'
import type { Cow, CowHealthRecord } from '@/types'
import { CowPortrait } from '../GaushalaArt'

const STATUSES: Cow['status'][] = ['adoptable', 'adopted', 'sick', 'recovering', 'deceased']
const KINDS: Cow['kind'][] = ['cow', 'calf', 'bull', 'ox']

/** Computed once, so a re-render never shifts the default arrival date. */
const TODAY = new Date().toISOString().slice(0, 10)

const CARETAKER_OPTIONS = USERS.filter(
  (u) => u.role === 'gaushala_caretaker' || u.role === 'store_keeper' || u.role === 'gaushala_admin',
).map((u) => ({ value: u.id, label: u.name }))

export function CowManagementPage() {
  const cows = useDb((s) => s.cows)
  const ready = useDb((s) => s.ready)
  const [query, setQuery] = useState('')
  const [status, setStatus] = useState('all')
  const [editing, setEditing] = useState<Cow | null>(null)
  const [creating, setCreating] = useState(false)
  const [healthFor, setHealthFor] = useState<Cow | null>(null)

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase()
    return cows.filter(
      (cow) =>
        (status === 'all' || cow.status === status) &&
        (q === '' || cow.name.toLowerCase().includes(q) || cow.breed.toLowerCase().includes(q)),
    )
  }, [cows, query, status])

  const columns: Column<Cow>[] = [
    {
      key: 'name',
      header: 'Cow',
      primary: true,
      cell: (cow) => (
        <div className="flex items-center gap-3">
          <span className="flex size-10 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-navy-100 bg-navy-50">
            <CowPortrait cow={cow} size={38} />
          </span>
          <div className="min-w-0">
            <p className="truncate text-navy-950 font-semibold">{cow.name}</p>
            <p className="truncate text-[13px] text-navy-600">
              {cow.breed} · {titleCase(cow.kind)}
            </p>
          </div>
        </div>
      ),
    },
    { key: 'age', header: 'Age', align: 'right', cell: (cow) => `${cow.ageYears}y` },
    { key: 'status', header: 'Status', cell: (cow) => <StatusBadge status={cow.status} /> },
    {
      key: 'caretaker',
      header: 'Caretaker',
      hideOnMobile: true,
      cell: (cow) => userName(cow.caretakerId),
    },
    { key: 'rescued', header: 'Rescued', hideOnMobile: true, cell: (cow) => formatDate(cow.rescuedAt) },
    { key: 'care', header: 'Care / month', align: 'right', cell: (cow) => <Money value={cow.monthlyCare} /> },
    {
      key: 'actions',
      header: '',
      align: 'right',
      cell: (cow) => (
        <div className="flex justify-end gap-1">
          <Button
            size="sm"
            variant="ghost"
            icon={<Stethoscope className="size-4" aria-hidden />}
            onClick={(e) => {
              e.stopPropagation()
              setHealthFor(cow)
            }}
          >
            Health
          </Button>
        </div>
      ),
    },
  ]

  return (
    <div>
      <PageHeader
        title="Cow management"
        description="The register of every animal in the shelter, its health record and who looks after it."
        phase="collect"
        actions={
          <Button icon={<Plus className="size-4" aria-hidden />} onClick={() => setCreating(true)}>
            Add a cow
          </Button>
        }
      >
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
          <div className="sm:w-72">
            <Input
              aria-label="Search the herd"
              placeholder="Search by name or breed"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              leading={<Search className="size-4" aria-hidden />}
            />
          </div>
          <div className="sm:w-56">
            <Select
              aria-label="Filter by status"
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              options={[
                { value: 'all', label: 'Every status' },
                ...STATUSES.map((s) => ({ value: s, label: titleCase(s) })),
              ]}
            />
          </div>
        </div>
      </PageHeader>

      <Table
        columns={columns}
        rows={rows}
        rowKey={(cow) => cow.id}
        onRowClick={(cow) => setEditing(cow)}
        empty={
          <EmptyState
            title={ready ? 'No cow matches that' : 'Loading the register'}
            message={
              ready
                ? 'Try a shorter word, or clear the status filter.'
                : 'One moment while the shelter register loads.'
            }
          />
        }
      />

      <CowDrawer cow={editing} onClose={() => setEditing(null)} />
      <NewCowDrawer open={creating} onClose={() => setCreating(false)} />
      <HealthDrawer cow={healthFor} onClose={() => setHealthFor(null)} />
    </div>
  )
}

/* ------------------------------------------------------------------ edit */

function CowDrawer({ cow, onClose }: { cow: Cow | null; onClose: () => void }) {
  const updateCow = useDb((s) => s.updateCow)
  const actor = useCurrentUser()
  const [status, setStatus] = useState<Cow['status']>('adoptable')
  const [caretakerId, setCaretakerId] = useState('')
  const [healthNote, setHealthNote] = useState('')
  const [loaded, setLoaded] = useState<string | null>(null)

  // Load the row into the form the first time this cow is opened.
  if (cow && loaded !== cow.id) {
    setLoaded(cow.id)
    setStatus(cow.status)
    setCaretakerId(cow.caretakerId)
    setHealthNote(cow.healthNote ?? '')
  }

  if (!cow) return null

  function save() {
    const result = updateCow(
      cow!.id,
      { status, caretakerId, healthNote: healthNote.trim() || undefined },
      actor,
    )
    if (!result.ok) {
      toast.danger('Could not save', result.error)
      return
    }
    onClose()
  }

  return (
    <Drawer
      open
      onClose={onClose}
      title={cow.name}
      subtitle={`${cow.breed} · ${titleCase(cow.kind)} · ${cow.ageYears} years`}
      footer={
        <div className="flex gap-2">
          <Button onClick={save}>Save changes</Button>
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
        </div>
      }
    >
      <div className="space-y-5 px-6 py-5">
        <div className="flex items-center gap-4">
          <span className="flex size-24 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-navy-100 bg-navy-50">
            <CowPortrait cow={cow} size={92} />
          </span>
          <p className="text-[13.5px] leading-relaxed text-navy-700">{cow.story}</p>
        </div>

        <Select
          label="Status"
          value={status}
          onChange={(e) => setStatus(e.target.value as Cow['status'])}
          options={STATUSES.map((s) => ({ value: s, label: titleCase(s) }))}
        />
        <Select
          label="Caretaker"
          value={caretakerId}
          onChange={(e) => setCaretakerId(e.target.value)}
          options={CARETAKER_OPTIONS}
        />
        <Textarea
          label="Health note"
          value={healthNote}
          onChange={(e) => setHealthNote(e.target.value)}
          hint="Shown on her public profile. Leave empty if there is nothing to flag."
        />
      </div>
    </Drawer>
  )
}

/* ------------------------------------------------------------------- new */

function NewCowDrawer({ open, onClose }: { open: boolean; onClose: () => void }) {
  const createCow = useDb((s) => s.createCow)
  const actor = useCurrentUser()

  const [name, setName] = useState('')
  const [tamil, setTamil] = useState('')
  const [kind, setKind] = useState<Cow['kind']>('cow')
  const [breed, setBreed] = useState('')
  const [ageYears, setAgeYears] = useState('4')
  const [status, setStatus] = useState<Cow['status']>('adoptable')
  const [story, setStory] = useState('')
  const [rescuedAt, setRescuedAt] = useState(TODAY)
  const [caretakerId, setCaretakerId] = useState(CARETAKER_OPTIONS[0]?.value ?? '')
  const [monthlyCare, setMonthlyCare] = useState('65')

  if (!open) return null

  function save() {
    const result = createCow(
      {
        name,
        tamil: tamil || undefined,
        kind,
        breed,
        gender: kind === 'cow' ? 'female' : 'male',
        ageYears: Number(ageYears) || 0,
        status,
        story,
        rescuedAt,
        caretakerId,
        monthlyCare: Math.round((Number(monthlyCare) || 0) * 100),
      },
      actor,
    )
    if (!result.ok) {
      toast.danger('Could not add her', result.error)
      return
    }
    setName('')
    setTamil('')
    setBreed('')
    setStory('')
    onClose()
  }

  return (
    <Drawer
      open
      onClose={onClose}
      title="Add a cow"
      subtitle="A new arrival on the shelter register."
      footer={
        <div className="flex gap-2">
          <Button onClick={save}>Add to the register</Button>
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
        </div>
      }
    >
      <div className="space-y-4 px-6 py-5">
        <Input label="Name" value={name} onChange={(e) => setName(e.target.value)} />
        <Input
          label="Name in Tamil"
          value={tamil}
          onChange={(e) => setTamil(e.target.value)}
          hint="Optional. Shown beside her name on the public page."
        />
        <Select
          label="Kind"
          value={kind}
          onChange={(e) => setKind(e.target.value as Cow['kind'])}
          options={KINDS.map((k) => ({ value: k, label: titleCase(k) }))}
        />
        <Input label="Breed" value={breed} onChange={(e) => setBreed(e.target.value)} />
        <Input
          label="Age in years"
          type="number"
          min={0}
          max={30}
          value={ageYears}
          onChange={(e) => setAgeYears(e.target.value)}
        />
        <Select
          label="Status"
          value={status}
          onChange={(e) => setStatus(e.target.value as Cow['status'])}
          options={STATUSES.map((s) => ({ value: s, label: titleCase(s) }))}
        />
        <Input label="Date she arrived" type="date" value={rescuedAt} onChange={(e) => setRescuedAt(e.target.value)} />
        <Select
          label="Caretaker"
          value={caretakerId}
          onChange={(e) => setCaretakerId(e.target.value)}
          options={CARETAKER_OPTIONS}
        />
        <Input
          label="Monthly care cost"
          type="number"
          min={0}
          step="0.01"
          value={monthlyCare}
          onChange={(e) => setMonthlyCare(e.target.value)}
          hint="In dollars. It is what her sponsorship tier is priced from."
        />
        <Textarea
          label="Her story"
          value={story}
          onChange={(e) => setStory(e.target.value)}
          hint="Shown on her public profile. How she came here, and what she is like."
        />
      </div>
    </Drawer>
  )
}

/* ---------------------------------------------------------------- health */

const HEALTH_KINDS: CowHealthRecord['kind'][] = ['checkup', 'vaccination', 'treatment', 'surgery', 'deworming']

function HealthDrawer({ cow, onClose }: { cow: Cow | null; onClose: () => void }) {
  const records = useDb((s) => s.cowHealth)
  const addRecord = useDb((s) => s.addCowHealthRecord)
  const actor = useCurrentUser()

  const [kind, setKind] = useState<CowHealthRecord['kind']>('checkup')
  const [note, setNote] = useState('')
  const [vet, setVet] = useState('Dr. S. Rajalakshmi')
  const [cost, setCost] = useState('0')
  const [nextDueAt, setNextDueAt] = useState('')

  if (!cow) return null

  const mine = records.filter((r) => r.cowId === cow.id)

  function save() {
    const result = addRecord(
      {
        cowId: cow!.id,
        kind,
        note,
        vet,
        cost: Math.round((Number(cost) || 0) * 100),
        nextDueAt: nextDueAt || undefined,
      },
      actor,
    )
    if (!result.ok) {
      toast.danger('Could not log it', result.error)
      return
    }
    setNote('')
    setCost('0')
    setNextDueAt('')
  }

  return (
    <Drawer open onClose={onClose} title={`${cow.name} — health record`} width="lg">
      <div className="space-y-6 px-6 py-5">
        <section className="rounded-2xl border border-navy-100 bg-navy-50/50 p-4">
          <h3 className="text-[11.5px] font-extrabold tracking-[0.14em] text-navy-700 uppercase">Log a visit</h3>
          <div className="mt-3.5 space-y-3.5">
            <Select
              label="What was done"
              value={kind}
              onChange={(e) => setKind(e.target.value as CowHealthRecord['kind'])}
              options={HEALTH_KINDS.map((k) => ({ value: k, label: titleCase(k) }))}
            />
            <Textarea label="Note" value={note} onChange={(e) => setNote(e.target.value)} />
            <div className="grid gap-3.5 sm:grid-cols-2">
              <Input label="Vet" value={vet} onChange={(e) => setVet(e.target.value)} />
              <Input
                label="Cost"
                type="number"
                min={0}
                step="0.01"
                value={cost}
                onChange={(e) => setCost(e.target.value)}
              />
            </div>
            <Input
              label="Next due"
              type="date"
              value={nextDueAt}
              onChange={(e) => setNextDueAt(e.target.value)}
              hint="For a vaccination or a review. Leave empty if there is nothing to come back for."
            />
            <Button onClick={save} fullWidth>
              Add to the record
            </Button>
          </div>
        </section>

        <section>
          <h3 className="text-[11.5px] font-extrabold tracking-[0.14em] text-navy-700 uppercase">History</h3>
          {mine.length === 0 ? (
            <p className="mt-3 text-[13.5px] text-navy-600">Nothing logged for her yet.</p>
          ) : (
            <ul className="mt-3 space-y-2.5">
              {mine.map((r) => (
                <li key={r.id} className="rounded-xl border border-navy-100 bg-white px-3.5 py-3">
                  <div className="flex items-baseline justify-between gap-3">
                    <span className="text-[13.5px] font-bold text-navy-950">{titleCase(r.kind)}</span>
                    <span className="font-mono text-[12.5px] text-navy-600 tabular-nums">{formatDate(r.at)}</span>
                  </div>
                  <p className="mt-1 text-[13px] leading-relaxed text-navy-700">{r.note}</p>
                  <p className="mt-1.5 text-[12.5px] text-navy-600">
                    {r.vet} · <Money value={r.cost} />
                    {r.nextDueAt ? ` · next due ${formatDate(r.nextDueAt)}` : ''}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </Drawer>
  )
}
