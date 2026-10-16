import { useState } from 'react'
import {
  AlertTriangle,
  MapPin,
  Plus,
  Trash2,
} from 'lucide-react'

import { formatMoney } from '@/lib/format'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Dialog } from '@/components/ui/Dialog'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { Skeleton } from '@/components/ui/Skeleton'
import { PageHeader } from '@/components/layout/PageHeader'
import { userById } from '@/mock/seed'
import { useDb } from '@/store/db'
import { csrProjectDecideBlock } from '@/store/csrRules'
import { useSession } from '@/store/session'
import type { CsrBudgetCategory, CsrProject, CsrProjectBudgetLine } from '@/types'
import { CSR_SCHEDULE_VII_ITEMS } from '@/mock/csrSeed'

export function CsrProjectsPage() {
  const db = useDb()
  const personaId = useSession((s) => s.personaId)
  const user = userById(personaId)

  const [selectedFilter, setSelectedFilter] = useState<string>('ALL')
  const [newProjectModal, setNewProjectModal] = useState(false)
  const [selectedProject, setSelectedProject] = useState<CsrProject | null>(null)

  // New project form state
  const [entityId, setEntityId] = useState('csr-ent-sevalaya')
  const [title, setTitle] = useState('')
  const [scheduleViiCode, setScheduleViiCode] = useState('i')
  const [description, setDescription] = useState('')
  const [stateName, setStateName] = useState('Tamil Nadu')
  const [district, setDistrict] = useState('')
  const [beneficiaryType, setBeneficiaryType] = useState('Rural families & school children')
  const [beneficiaryTarget, setBeneficiaryTarget] = useState(5000)
  const [startDate] = useState('2026-04-01')
  const [endDate] = useState('2027-03-31')

  // Dynamic budget lines
  const [budgetLines, setBudgetLines] = useState<CsrProjectBudgetLine[]>([
    {
      id: 'b-1',
      category: 'MATERIALS',
      description: 'Raw provisions & nutrition materials',
      amount: 150000000, // ₹15,00,000
      isCapital: false,
    },
    {
      id: 'b-2',
      category: 'EQUIPMENT',
      description: 'Kitchen appliances and storage units',
      amount: 80000000, // ₹8,00,000
      isCapital: true,
    },
    {
      id: 'b-3',
      category: 'ADMIN_OVERHEAD',
      description: 'Project monitoring & administration (capped at 5%)',
      amount: 12000000, // ₹1,20,000
      isCapital: false,
    },
  ])

  if (!db.ready) return <Skeleton className="h-96 w-full" />

  const projects = db.csrProjects
  const entities = db.csrEntities
  const deals = db.csrDeals

  const decideBlock = (project: CsrProject) => (user ? csrProjectDecideBlock(user, project) : 'Pick a persona first.')

  const totalBudget = budgetLines.reduce((sum, line) => sum + line.amount, 0)
  const adminLine = budgetLines.find((l) => l.category === 'ADMIN_OVERHEAD')
  const adminPct = totalBudget > 0 && adminLine ? ((adminLine.amount / totalBudget) * 100).toFixed(1) : '0.0'

  const hasRitualUnchecked = budgetLines.some(
    (l) => (l.category === 'POOJA' || l.category === 'FESTIVAL') && !l.blockedForCsr,
  )

  const handleAddBudgetLine = () => {
    setBudgetLines([
      ...budgetLines,
      {
        id: `b-${Date.now()}`,
        category: 'MATERIALS',
        description: '',
        amount: 5000000,
        isCapital: false,
      },
    ])
  }

  const handleRemoveBudgetLine = (id: string) => {
    setBudgetLines(budgetLines.filter((l) => l.id !== id))
  }

  const handleUpdateLine = (id: string, patch: Partial<CsrProjectBudgetLine>) => {
    setBudgetLines(
      budgetLines.map((l) => {
        if (l.id !== id) return l
        const updated = { ...l, ...patch }
        if (updated.category === 'POOJA' || updated.category === 'FESTIVAL') {
          updated.blockedForCsr = true
        }
        return updated
      }),
    )
  }

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!title || budgetLines.length === 0 || !user) return

    const result = db.createCsrProject(
      {
        entityId,
        title,
        scheduleViiCode,
        description,
        state: stateName,
        district,
        beneficiaryType,
        beneficiaryTarget,
        startDate,
        endDate,
        totalBudget,
        budgetLines,
        createdBy: user.id,
      },
      user,
    )

    if (result.ok) {
      setNewProjectModal(false)
      setTitle('')
      setDescription('')
    }
  }

  const handleDecide = (projectId: string, decision: 'approved' | 'rejected') => {
    if (!user) return
    db.decideCsrProject(projectId, decision, user)
    if (selectedProject?.id === projectId) {
      setSelectedProject(null)
    }
  }

  const filteredProjects = projects.filter((p) => {
    if (selectedFilter === 'ALL') return true
    return p.scheduleViiCode === selectedFilter
  })

  return (
    <div className="space-y-6">
      <PageHeader
        title="CSR Project Builder & Schedule VII"
        actions={
          <Button
            variant="primary"
            icon={<Plus className="size-4" aria-hidden />}
            onClick={() => setNewProjectModal(true)}
          >
            Create CSR Project
          </Button>
        }
      />

      {/* Schedule VII Category Filters */}
      <div className="flex flex-wrap items-center gap-2 pb-1">
        <button
          onClick={() => setSelectedFilter('ALL')}
          className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
            selectedFilter === 'ALL'
              ? 'bg-turmeric-600 text-white shadow-xs'
              : 'bg-white text-sandalwood-700 hover:bg-sandalwood-100 border border-sandalwood-200'
          }`}
        >
          All Categories ({projects.length})
        </button>
        {CSR_SCHEDULE_VII_ITEMS.map((item) => (
          <button
            key={item.code}
            onClick={() => setSelectedFilter(item.code)}
            className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
              selectedFilter === item.code
                ? 'bg-turmeric-600 text-white shadow-xs'
                : 'bg-white text-sandalwood-700 hover:bg-sandalwood-100 border border-sandalwood-200'
            }`}
          >
            <span className="font-mono">({item.code})</span>
            <span>{item.title}</span>
          </button>
        ))}
      </div>

      {/* Projects Grid */}
      <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
        {filteredProjects.map((prj) => {
          const entity = entities.find((e) => e.id === prj.entityId)
          const activeDeals = deals.filter((d) => d.projectId === prj.id)
          const totalCommitted = activeDeals.reduce((sum, d) => sum + d.committedAmount, 0)

          const isSubmitted = prj.status === 'SUBMITTED'
          const isOpen = prj.status === 'OPEN_FOR_FUNDING'
          const isFunded = prj.status === 'FUNDED' || prj.status === 'IN_PROGRESS'

          return (
            <Card key={prj.id} className="flex flex-col justify-between hover:border-turmeric-300 transition">
              <div className="p-5">
                <div className="flex items-start justify-between gap-2">
                  <span className="inline-flex items-center gap-1 rounded bg-turmeric-50 px-2 py-0.5 font-mono text-[11px] font-semibold text-turmeric-800 border border-turmeric-200">
                    Schedule VII ({prj.scheduleViiCode})
                  </span>
                  <span
                    className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                      isOpen
                        ? 'bg-tulsi-100 text-tulsi-800 border border-tulsi-200'
                        : isSubmitted
                        ? 'bg-marigold-100 text-marigold-800 border border-marigold-200'
                        : isFunded
                        ? 'bg-peacock-100 text-peacock-800 border border-peacock-200'
                        : 'bg-sandalwood-100 text-sandalwood-700'
                    }`}
                  >
                    {prj.status.replace(/_/g, ' ')}
                  </span>
                </div>

                <h3 className="mt-2.5 font-serif text-base font-bold text-sandalwood-900 leading-snug">
                  {prj.title}
                </h3>
                <p className="mt-1 text-xs text-sandalwood-600 line-clamp-2">
                  {prj.description}
                </p>

                <div className="mt-4 space-y-2 border-t border-sandalwood-200/80 pt-3 text-xs">
                  <div className="flex items-center justify-between text-sandalwood-600">
                    <span>Implementing Agency:</span>
                    <strong className="text-sandalwood-900">{entity?.legalName.slice(0, 24)}...</strong>
                  </div>
                  <div className="flex items-center justify-between text-sandalwood-600">
                    <span>Location:</span>
                    <span className="flex items-center gap-1 font-medium text-sandalwood-800">
                      <MapPin className="size-3 text-turmeric-600" />
                      {prj.district}, {prj.state}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-sandalwood-600">
                    <span>Target Impact:</span>
                    <span className="font-semibold text-sandalwood-900">
                      {prj.beneficiaryTarget.toLocaleString()} {prj.beneficiaryType}
                    </span>
                  </div>
                </div>

                {/* Financial Progress */}
                <div className="mt-4 rounded-lg bg-sandalwood-50 p-3">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-sandalwood-600">Budget:</span>
                    <strong className="font-mono text-sandalwood-900">{formatMoney(prj.totalBudget)}</strong>
                  </div>
                  <div className="mt-1 flex items-center justify-between text-xs">
                    <span className="text-sandalwood-600">Committed Grant:</span>
                    <strong className="font-mono text-tulsi-700">{formatMoney(totalCommitted)}</strong>
                  </div>
                  <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-sandalwood-200">
                    <div
                      className="h-full rounded-full bg-tulsi-600"
                      style={{
                        width: `${Math.min(100, Math.round((totalCommitted / prj.totalBudget) * 100))}%`,
                      }}
                    />
                  </div>
                </div>
              </div>

              {/* Action Footer */}
              <div className="border-t border-sandalwood-200 bg-sandalwood-50/50 p-3.5 flex items-center justify-between">
                <button
                  onClick={() => setSelectedProject(prj)}
                  className="text-xs font-semibold text-turmeric-800 hover:text-turmeric-900"
                >
                  View Budget Lines ({prj.budgetLines.length}) →
                </button>

                {isSubmitted && (
                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      variant="secondary"
                      disabled={Boolean(decideBlock(prj))}
                      title={decideBlock(prj) ?? 'Send this project back for revision'}
                      onClick={() => handleDecide(prj.id, 'rejected')}
                    >
                      Reject
                    </Button>
                    <Button
                      size="sm"
                      variant="primary"
                      disabled={Boolean(decideBlock(prj))}
                      title={decideBlock(prj) ?? 'Approve this project for CSR funding'}
                      onClick={() => handleDecide(prj.id, 'approved')}
                    >
                      Sanction
                    </Button>
                  </div>
                )}
              </div>
            </Card>
          )
        })}
      </div>

      {/* Project Detail / Budget Line Drawer / Dialog */}
      {selectedProject && (
        <Dialog
          open={Boolean(selectedProject)}
          onClose={() => setSelectedProject(null)}
          title={`Project Dossier: ${selectedProject.title}`}
        >
          <div className="space-y-4">
            <div className="rounded-lg bg-sandalwood-50 p-3 text-xs space-y-1">
              <p><strong>Schedule VII Item:</strong> ({selectedProject.scheduleViiCode}) {CSR_SCHEDULE_VII_ITEMS.find((s) => s.code === selectedProject.scheduleViiCode)?.title}</p>
              <p><strong>District & State:</strong> {selectedProject.district}, {selectedProject.state}</p>
              <p><strong>Timeline:</strong> {selectedProject.startDate} to {selectedProject.endDate}</p>
              <p><strong>Total Approved Budget:</strong> <span className="font-mono font-bold text-sandalwood-900">{formatMoney(selectedProject.totalBudget)}</span></p>
            </div>

            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-sandalwood-700 mb-2">
                Detailed Budget Heads
              </h4>
              <div className="divide-y divide-sandalwood-200 border rounded-lg overflow-hidden">
                {selectedProject.budgetLines.map((line) => (
                  <div key={line.id} className="p-3 text-xs flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-semibold text-[10px] uppercase bg-sandalwood-200 text-sandalwood-800 px-1.5 py-0.5 rounded">
                          {line.category}
                        </span>
                        {line.isCapital && (
                          <span className="text-[10px] font-semibold text-peacock-700 bg-peacock-50 px-1 rounded">
                            Capital Asset
                          </span>
                        )}
                        {line.blockedForCsr && (
                          <span className="text-[10px] font-bold text-kumkum-700 bg-kumkum-50 px-1 rounded">
                            BLOCKED FOR CSR
                          </span>
                        )}
                      </div>
                      <p className="mt-1 font-medium text-sandalwood-900">{line.description}</p>
                    </div>
                    <span className="font-mono font-bold text-sandalwood-900">
                      {formatMoney(line.amount)}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <Button variant="secondary" onClick={() => setSelectedProject(null)}>
                Close
              </Button>
            </div>
          </div>
        </Dialog>
      )}

      {/* New Project Modal */}
      {newProjectModal && (
        <Dialog
          open={newProjectModal}
          onClose={() => setNewProjectModal(false)}
          title="Create New CSR Project (Schedule VII)"
        >
          <form onSubmit={handleCreateSubmit} className="space-y-4">
            <div className="rounded-md border border-turmeric-200 bg-turmeric-50 p-3 text-xs text-turmeric-900">
              <p className="font-semibold">MCA Schedule VII Compliance Guidelines:</p>
              <p className="mt-0.5 text-[11px] leading-relaxed">
                Administrative overheads must strictly remain within 5.0% of total CSR expenditure. Ritual, pooja, and temple religious ceremonies are legally barred from CSR funds per General Circular 21/2014.
              </p>
            </div>

            <div>
              <Select
                label="Implementing Agency"
                value={entityId}
                onChange={(e) => setEntityId(e.target.value)}
                options={entities.map((e) => ({
                  value: e.id,
                  label: `${e.legalName} (${e.readinessStatus})`,
                }))}
              />
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div className="col-span-2">
                <label className="block text-xs font-medium text-sandalwood-700 mb-1">
                  Project Title
                </label>
                <Input
                  placeholder="e.g. Akshaya Annadhanam Feeding Programme"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                />
              </div>
              <div>
                <Select
                  label="Schedule VII Clause"
                  value={scheduleViiCode}
                  onChange={(e) => setScheduleViiCode(e.target.value)}
                  options={CSR_SCHEDULE_VII_ITEMS.map((item) => ({
                    value: item.code,
                    label: `(${item.code}) ${item.title}`,
                  }))}
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-sandalwood-700 mb-1">
                Project Scope & Beneficiary Impact Narrative
              </label>
              <textarea
                className="w-full rounded-md border border-sandalwood-300 p-2 text-xs focus:border-turmeric-500 focus:outline-hidden"
                rows={2}
                placeholder="Comprehensive project objectives, targeting disadvantaged groups..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                required
              />
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div>
                <label className="block text-xs font-medium text-sandalwood-700 mb-1">State</label>
                <Input value={stateName} onChange={(e) => setStateName(e.target.value)} required />
              </div>
              <div>
                <label className="block text-xs font-medium text-sandalwood-700 mb-1">District</label>
                <Input
                  placeholder="e.g. Thanjavur"
                  value={district}
                  onChange={(e) => setDistrict(e.target.value)}
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-sandalwood-700 mb-1">Beneficiaries</label>
                <Input
                  type="number"
                  value={beneficiaryTarget}
                  onChange={(e) => setBeneficiaryTarget(Number(e.target.value))}
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-sandalwood-700 mb-1">Type</label>
                <Input
                  value={beneficiaryType}
                  onChange={(e) => setBeneficiaryType(e.target.value)}
                  required
                />
              </div>
            </div>

            {/* Dynamic Budget Lines */}
            <div className="border-t border-sandalwood-200 pt-3">
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-xs font-bold uppercase tracking-wider text-sandalwood-700">
                  Budget Line Breakdown ({budgetLines.length})
                </h4>
                <Button type="button" size="sm" variant="secondary" onClick={handleAddBudgetLine}>
                  <Plus className="size-3 mr-1" /> Add Head
                </Button>
              </div>

              <div className="space-y-2">
                {budgetLines.map((line) => (
                  <div
                    key={line.id}
                    className="flex flex-wrap items-center gap-2 rounded-md border border-sandalwood-200 bg-sandalwood-50/50 p-2 text-xs"
                  >
                    <div className="w-44">
                      <Select
                        size="sm"
                        value={line.category}
                        onChange={(e) =>
                          handleUpdateLine(line.id, {
                            category: e.target.value as CsrBudgetCategory,
                          })
                        }
                        options={[
                          { value: 'MATERIALS', label: 'MATERIALS' },
                          { value: 'SALARIES', label: 'SALARIES' },
                          { value: 'EQUIPMENT', label: 'EQUIPMENT' },
                          { value: 'CONSTRUCTION', label: 'CONSTRUCTION' },
                          { value: 'ADMIN_OVERHEAD', label: 'ADMIN_OVERHEAD' },
                          { value: 'POOJA', label: 'POOJA (BLOCKED)' },
                          { value: 'FESTIVAL', label: 'FESTIVAL (BLOCKED)' },
                        ]}
                      />
                    </div>

                    <div className="flex-1 min-w-[150px]">
                      <Input
                        placeholder="Description of item or service"
                        value={line.description}
                        onChange={(e) => handleUpdateLine(line.id, { description: e.target.value })}
                        required
                      />
                    </div>

                    <div className="w-28">
                      <Input
                        type="number"
                        placeholder="Amount in ₹"
                        value={line.amount / 100}
                        onChange={(e) =>
                          handleUpdateLine(line.id, { amount: Number(e.target.value) * 100 })
                        }
                        required
                      />
                    </div>

                    <label className="flex items-center gap-1 text-[11px] text-sandalwood-700 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={Boolean(line.isCapital)}
                        onChange={(e) => handleUpdateLine(line.id, { isCapital: e.target.checked })}
                      />
                      Capital
                    </label>

                    {budgetLines.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveBudgetLine(line.id)}
                        className="text-sandalwood-400 hover:text-kumkum-600 transition"
                      >
                        <Trash2 className="size-4" />
                      </button>
                    )}
                  </div>
                ))}
              </div>

              {/* Total and Admin Check Banner */}
              <div className="mt-3 flex items-center justify-between rounded-lg bg-sandalwood-100 p-3 text-xs">
                <div>
                  <span className="text-sandalwood-600">Total Project Outlay:</span>
                  <strong className="ml-2 font-mono text-sm font-bold text-sandalwood-900">
                    {formatMoney(totalBudget)}
                  </strong>
                </div>
                <div>
                  <span className="text-sandalwood-600">Admin Overhead:</span>
                  <strong
                    className={`ml-1 font-mono font-bold ${
                      Number(adminPct) > 5.0 ? 'text-kumkum-700' : 'text-tulsi-700'
                    }`}
                  >
                    {adminPct}% {Number(adminPct) > 5.0 ? '(EXCEEDS 5% CAP)' : '(COMPLIANT)'}
                  </strong>
                </div>
              </div>

              {hasRitualUnchecked && (
                <div className="mt-2 flex items-center gap-2 rounded-md bg-kumkum-50 p-2 text-xs text-kumkum-900 border border-kumkum-200">
                  <AlertTriangle className="size-4 text-kumkum-600 shrink-0" />
                  <span>
                    Religious ritual / pooja heads are flagged and blocked for CSR compliance.
                  </span>
                </div>
              )}
            </div>

            <div className="flex justify-end gap-2 pt-3">
              <Button type="button" variant="secondary" onClick={() => setNewProjectModal(false)}>
                Cancel
              </Button>
              <Button type="submit" variant="primary">
                Submit for Trustee Sanction
              </Button>
            </div>
          </form>
        </Dialog>
      )}
    </div>
  )
}
