import { useState } from 'react'
import {
  Bot,
  Building2,
  Mail,
  Phone,
  Plus,
  Send,
  Sparkles,
} from 'lucide-react'

import { formatMoneyShort } from '@/lib/format'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Dialog } from '@/components/ui/Dialog'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { Skeleton } from '@/components/ui/Skeleton'
import { PageHeader } from '@/components/layout/PageHeader'
import { userById } from '@/mock/seed'
import { useDb } from '@/store/db'
import { csrPitchBlock } from '@/store/csrRules'
import { useSession } from '@/store/session'
import type { CsrCompany, CsrDealStatus, CsrProject } from '@/types'

const STAGES: Array<{ key: CsrDealStatus; label: string; color: string }> = [
  { key: 'LEAD', label: '1. Lead Identified', color: 'bg-sandal-100 text-stone-900' },
  { key: 'SHORTLISTED', label: '2. Shortlisted', color: 'bg-turmeric-100 text-turmeric-800' },
  { key: 'PITCHED', label: '3. Pitched', color: 'bg-marigold-100 text-marigold-800' },
  { key: 'PROPOSAL_SENT', label: '4. Proposal Sent', color: 'bg-peacock-100 text-peacock-800' },
  { key: 'DUE_DILIGENCE', label: '5. Due Diligence', color: 'bg-peacock-50 text-peacock-700' },
  { key: 'ACTIVE', label: '6. MoU Active', color: 'bg-tulsi-100 text-tulsi-800' },
]

export function CompanyPipelinePage() {
  const db = useDb()
  const personaId = useSession((s) => s.personaId)
  const user = userById(personaId)

  const [addCompanyModal, setAddCompanyModal] = useState(false)
  const [aiProposalModal, setAiProposalModal] = useState<{
    company: CsrCompany
    project: CsrProject
  } | null>(null)

  // Add company form
  const [name, setName] = useState('')
  const [cin, setCin] = useState('')
  const [hqState, setHqState] = useState('Tamil Nadu')
  const [avgObligation, setAvgObligation] = useState(100)
  const [focusAreas, setFocusAreas] = useState('Eradicating hunger, rural education')
  const [contactName, setContactName] = useState('')
  const [contactEmail, setContactEmail] = useState('')
  const [contactPhone, setContactPhone] = useState('')

  // AI Proposal state
  const [selectedProjectId, setSelectedProjectId] = useState<string>('')
  const [generating, setGenerating] = useState(false)
  const [generatedText, setGeneratedText] = useState('')

  if (!db.ready) return <Skeleton className="h-96 w-full" />

  const companies = db.csrCompanies
  // Step 3 gate: only Trustee-approved projects of a CSR-ready entity can be pitched.
  const projects = db.csrProjects.filter(
    (p) => !csrPitchBlock(p, db.csrEntities.find((e) => e.id === p.entityId)),
  )
  const deals = db.csrDeals

  const handleAddCompany = (e: React.FormEvent) => {
    e.preventDefault()
    if (!name || !cin || !user) return

    db.createCsrCompany(
      {
        name,
        cin,
        hqState,
        avgCsrObligation: avgObligation,
        focusAreas: focusAreas.split(',').map((s) => s.trim()),
        focusStates: [hqState],
        contactName,
        contactEmail,
        contactPhone,
      },
      user,
    )

    setAddCompanyModal(false)
    setName('')
    setCin('')
  }

  const handleOpenAiGenerator = (comp: CsrCompany) => {
    const defaultProj = projects[0]
    setSelectedProjectId(defaultProj?.id ?? '')
    triggerAiSynthesis(comp, defaultProj)
  }

  const triggerAiSynthesis = (comp: CsrCompany, proj?: CsrProject) => {
    if (!proj) return
    setGenerating(true)
    setGeneratedText('')
    setAiProposalModal({ company: comp, project: proj })

    setTimeout(() => {
      const text = `EXECUTIVE CSR GRANT PROPOSAL
To: CSR Board Committee, ${comp.name}
From: One Mandir & Allied Social Welfare Trusts
Statutory Framework: Companies Act 2013, Section 135 & Schedule VII Clause (${proj.scheduleViiCode})

1. PROJECT OVERVIEW: "${proj.title}"
Target Geography: ${proj.district}, ${proj.state}
Target Beneficiaries: ${proj.beneficiaryTarget.toLocaleString()} ${proj.beneficiaryType}
Total Project Budget: ${formatMoneyShort(proj.totalBudget)}
Statutory Category: Schedule VII Clause (${proj.scheduleViiCode})

2. STRATEGIC FIT WITH ${comp.name.toUpperCase()} CSR MANDATE
With ${comp.name}'s annual CSR budget of approximately ₹${comp.avgCsrObligation} Crores and strategic focus on ${comp.focusAreas.join(', ')}, this project offers quantifiable, auditable grassroots impact.

3. STATUTORY GUARANTEES & 5% ADMIN CAP
- Administrative overhead is strictly capped at 4.8% of the grant outlay, fully compliant with the 5.0% statutory ceiling under Section 135(5).
- Zero pooja, ritual or worship expenses are included in this project, in strict accordance with MCA General Circular 21/2014.
- All disbursements will be deposited into a dedicated restricted bank account and tracked in real-time.

4. TRANCHE DISBURSEMENT & AUDIT CERTIFICATION
- Tranche 1: 50% mobilization advance upon bilateral MoU execution.
- Tranche 2: 50% upon milestone delivery, accompanied by an ICAI Chartered Accountant certified Utilisation Certificate bearing a valid 18-digit UDIN and high-resolution photo progress records.

Submitted with board resolution authorization.`

      setGeneratedText(text)
      setGenerating(false)
    }, 600)
  }

  const handleConvertProposalToDeal = () => {
    if (!aiProposalModal || !user) return

    const { company, project } = aiProposalModal
    const grantAmount = Math.min(project.totalBudget, 300000000)

    db.createCsrDeal(
      {
        projectId: project.id,
        companyId: company.id,
        status: 'PROPOSAL_SENT',
        committedAmount: grantAmount,
        adminCapPct: 4.8,
        needsImpactAssessment: false,
        ownerId: user.id,
        proposalText: generatedText,
        tranches: [
          {
            id: `trn-${Date.now()}-1`,
            dealId: '',
            seqNo: 1,
            amount: grantAmount / 2,
            dueDate: '2026-06-30',
            conditionText: 'Execution of bilateral MoU and dedicated CSR bank account confirmation',
            status: 'SCHEDULED',
          },
          {
            id: `trn-${Date.now()}-2`,
            dealId: '',
            seqNo: 2,
            amount: grantAmount / 2,
            dueDate: '2026-11-30',
            conditionText: 'Milestone progress report and CA-certified Utilisation Certificate with UDIN',
            status: 'SCHEDULED',
          },
        ],
      },
      user,
    )

    setAiProposalModal(null)
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Corporate pipeline"
        description="Companies at every stage, from first contact to due diligence. A partner that clears due diligence is ready for an MoU."
        actions={
          <Button
            variant="primary"
            icon={<Plus className="size-4" aria-hidden />}
            onClick={() => setAddCompanyModal(true)}
          >
            Add Corporate Partner
          </Button>
        }
      />

      {/* Corporate Pipeline Kanban Columns */}
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {companies.map((comp) => {
          const companyDeals = deals.filter((d) => d.companyId === comp.id)
          const activeDeal = companyDeals[0]

          return (
            <Card key={comp.id} className="flex flex-col justify-between hover:border-turmeric-400 transition">
              <div className="p-5">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-turmeric-100 text-turmeric-800">
                      <Building2 className="size-5" />
                    </div>
                    <div>
                      <h3 className="font-display text-base font-bold text-stone-900 leading-tight">
                        {comp.name}
                      </h3>
                      <span className="font-mono text-[11px] text-stone-500">
                        CIN: {comp.cin}
                      </span>
                    </div>
                  </div>

                  <span
                    className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                      activeDeal
                        ? STAGES.find((s) => s.key === activeDeal.status)?.color ?? 'bg-sandal-100'
                        : 'bg-sandal-100 text-stone-700'
                    }`}
                  >
                    {activeDeal ? activeDeal.status.replace(/_/g, ' ') : 'PROSPECT'}
                  </span>
                </div>

                <div className="mt-4 space-y-2 border-t border-sandal-200/80 pt-3 text-xs">
                  <div className="flex items-center justify-between text-stone-700">
                    <span>Est. Annual CSR Obligation:</span>
                    <strong className="font-mono text-stone-900">
                      ₹{comp.avgCsrObligation} Crores
                    </strong>
                  </div>
                  <div className="flex items-center justify-between text-stone-700">
                    <span>Headquarters:</span>
                    <span className="font-medium text-stone-900">{comp.hqState}</span>
                  </div>
                  <div>
                    <span className="text-stone-500 block mb-1">Focus Schedule VII Areas:</span>
                    <div className="flex flex-wrap gap-1">
                      {comp.focusAreas.map((f, i) => (
                        <span
                          key={i}
                          className="rounded bg-sandal-100 px-2 py-0.5 text-[11px] text-stone-900"
                        >
                          {f}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Point of Contact */}
                <div className="mt-4 rounded-lg bg-sandal-50 p-3 text-xs text-stone-700">
                  <p className="font-semibold text-stone-900">{comp.contactName}</p>
                  <div className="mt-1 flex flex-col gap-0.5 text-[11px] text-stone-700">
                    <span className="flex items-center gap-1.5">
                      <Mail className="size-3 text-turmeric-700" />
                      {comp.contactEmail}
                    </span>
                    <span className="flex items-center gap-1.5">
                      <Phone className="size-3 text-turmeric-700" />
                      {comp.contactPhone}
                    </span>
                  </div>
                </div>
              </div>

              {/* Action Strip */}
              <div className="border-t border-sandal-200 bg-sandal-50/50 p-3 flex items-center justify-between">
                <span className="text-xs text-stone-500">
                  {activeDeal ? `${formatMoneyShort(activeDeal.committedAmount)} grant` : 'No active MoU'}
                </span>
                <Button
                  size="sm"
                  variant="secondary"
                  icon={<Bot className="size-3.5 text-turmeric-700" />}
                  disabled={projects.length === 0}
                  title={projects.length === 0 ? 'No project is ready to pitch. A Trustee must approve one for a CSR-ready entity.' : 'Draft a proposal for this company'}
                  onClick={() => handleOpenAiGenerator(comp)}
                >
                  AI Proposal
                </Button>
              </div>
            </Card>
          )
        })}
      </div>

      {/* AI Proposal Generator Dialog */}
      {aiProposalModal && (
        <Dialog
          open={Boolean(aiProposalModal)}
          onClose={() => setAiProposalModal(null)}
          title={`AI CSR Proposal Generator: ${aiProposalModal.company.name}`}
        >
          <div className="space-y-4">
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex-1">
                <Select
                  label="Target CSR Project"
                  value={selectedProjectId}
                  onChange={(e) => {
                    setSelectedProjectId(e.target.value)
                    const p = projects.find((x) => x.id === e.target.value)
                    if (p) triggerAiSynthesis(aiProposalModal.company, p)
                  }}
                  options={projects.map((p) => ({
                    value: p.id,
                    label: `${p.title} (${formatMoneyShort(p.totalBudget)})`,
                  }))}
                  hint="Only Trustee-approved projects of a CSR-ready entity are listed."
                />
              </div>
            </div>

            {generating ? (
              <div className="rounded-lg border border-turmeric-200 bg-turmeric-50/50 p-8 text-center space-y-2">
                <Sparkles className="mx-auto size-6 text-turmeric-600 animate-pulse" />
                <p className="text-xs font-semibold text-turmeric-900">
                  Synthesizing Schedule VII executive pitch, 5% admin covenant, and milestone tranches...
                </p>
              </div>
            ) : (
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-stone-700 mb-1">
                  Generated Executive Proposal (Draft MoU Annexure)
                </label>
                <textarea
                  className="w-full font-mono text-xs text-stone-900 bg-sandal-50 border border-sandal-300 rounded-lg p-3 leading-relaxed focus:outline-hidden"
                  rows={14}
                  value={generatedText}
                  onChange={(e) => setGeneratedText(e.target.value)}
                />
              </div>
            )}

            <div className="flex items-center justify-between pt-2 border-t border-sandal-200">
              <Button variant="secondary" onClick={() => setAiProposalModal(null)}>
                Cancel
              </Button>
              <Button
                variant="primary"
                icon={<Send className="size-4" />}
                onClick={handleConvertProposalToDeal}
                disabled={generating || !generatedText}
              >
                Draft Formal MoU Deal
              </Button>
            </div>
          </div>
        </Dialog>
      )}

      {/* Add Company Modal */}
      {addCompanyModal && (
        <Dialog
          open={addCompanyModal}
          onClose={() => setAddCompanyModal(false)}
          title="Add Corporate CSR Partner"
        >
          <form onSubmit={handleAddCompany} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-stone-700 mb-1">
                Company Legal Name
              </label>
              <Input
                placeholder="e.g. TVS Motor Company Limited"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-stone-700 mb-1">
                  Corporate Identity Number (CIN)
                </label>
                <Input
                  placeholder="e.g. L35999TN1992PLC022845"
                  value={cin}
                  onChange={(e) => setCin(e.target.value)}
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-stone-700 mb-1">
                  HQ State
                </label>
                <Input
                  value={hqState}
                  onChange={(e) => setHqState(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-stone-700 mb-1">
                  Est. Annual CSR Budget (₹ Cr)
                </label>
                <Input
                  type="number"
                  value={avgObligation}
                  onChange={(e) => setAvgObligation(Number(e.target.value))}
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-stone-700 mb-1">
                  Focus Schedule VII Areas
                </label>
                <Input
                  placeholder="Hunger, heritage, education"
                  value={focusAreas}
                  onChange={(e) => setFocusAreas(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="border-t border-sandal-200 pt-3">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-stone-700 mb-2">
                Primary Contact Details
              </h4>
              <div className="space-y-2">
                <Input
                  placeholder="CSR Lead / Executive Name"
                  value={contactName}
                  onChange={(e) => setContactName(e.target.value)}
                  required
                />
                <div className="grid grid-cols-2 gap-2">
                  <Input
                    type="email"
                    placeholder="email@company.com"
                    value={contactEmail}
                    onChange={(e) => setContactEmail(e.target.value)}
                    required
                  />
                  <Input
                    placeholder="+91 98..."
                    value={contactPhone}
                    onChange={(e) => setContactPhone(e.target.value)}
                    required
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="secondary" onClick={() => setAddCompanyModal(false)}>
                Cancel
              </Button>
              <Button type="submit" variant="primary">
                Add Partner
              </Button>
            </div>
          </form>
        </Dialog>
      )}
    </div>
  )
}
