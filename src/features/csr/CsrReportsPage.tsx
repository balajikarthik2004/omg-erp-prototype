import { useState } from 'react'
import {
  CheckCircle2,
  FileCheck2,
  Plus,
  ShieldCheck,
  Users,
} from 'lucide-react'

import { formatMoneyShort } from '@/lib/format'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Dialog } from '@/components/ui/Dialog'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { Skeleton } from '@/components/ui/Skeleton'
import { Tabs } from '@/components/ui/Tabs'
import { PageHeader } from '@/components/layout/PageHeader'
import { userById, userName } from '@/mock/seed'
import { useDb } from '@/store/db'
import { csrUcSignBlock } from '@/store/csrRules'
import { useSession } from '@/store/session'
import type { CsrDeal, CsrUtilisationCertificate } from '@/types'
import { CsrFundStatement } from './CsrFundStatement'

export function CsrReportsPage() {
  const db = useDb()
  const personaId = useSession((s) => s.personaId)
  const user = userById(personaId)

  const [activeTab, setActiveTab] = useState<'ucs' | 'progress'>('ucs')
  const [draftUcModal, setDraftUcModal] = useState(false)
  const [signUcModal, setSignUcModal] = useState<CsrUtilisationCertificate | null>(null)
  const [addProgressModal, setAddProgressModal] = useState(false)

  // UC Signing Form
  const [caUdin, setCaUdin] = useState('26048912AAAAAA9812')
  const [caMembershipNo, setCaMembershipNo] = useState('048912')

  // Draft UC Form
  const [selectedDealId, setSelectedDealId] = useState('')
  const [selectedTrancheId, setSelectedTrancheId] = useState('')
  const [amountUtilised, setAmountUtilised] = useState(1500000) // ₹15L
  const [ucNarrative, setUcNarrative] = useState(
    'Certified that the grant has been strictly utilised for the purposes of Akshaya Annadhanam meals distribution without any religious worship / pooja expenses.',
  )

  // Progress Update Form
  const [progressProjectId, setProgressProjectId] = useState('')
  const [progressStart] = useState('2026-04-01')
  const [progressEnd] = useState('2026-09-30')
  const [beneficiaries, setBeneficiaries] = useState(4800)
  const [progressNarrative, setProgressNarrative] = useState('')
  const [photoCaption, setPhotoCaption] = useState('Daily annadhanam hot meal service at rural feeding point')

  if (!db.ready) return <Skeleton className="h-96 w-full" />

  const ucs = db.csrUtilisationCertificates
  const progressUpdates = db.csrProgressUpdates
  const deals = db.csrDeals
  const projects = db.csrProjects
  const companies = db.csrCompanies

  const signBlock = (uc: CsrUtilisationCertificate) => (user ? csrUcSignBlock(user, uc) : 'Pick a persona first.')
  // A UC is drafted for a tranche that has arrived and has no certificate yet.
  const ucReady = (d: CsrDeal) => d.tranches.filter((t) => t.status === 'RECEIVED')
  const ucDeals = deals.filter((d) => ucReady(d).length > 0)
  const activeDeals = deals.filter((d) => d.status === 'ACTIVE' || d.status === 'COMPLETED')

  const handleDraftUcSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return
    const deal = ucDeals.find((d) => d.id === selectedDealId) ?? ucDeals[0]
    const tranche = deal && (ucReady(deal).find((t) => t.id === selectedTrancheId) ?? ucReady(deal)[0])
    if (!deal || !tranche) return

    const utilisedPaise = amountUtilised * 100
    const remainingPaise = Math.max(0, tranche.amount - utilisedPaise)

    db.createCsrUc(
      {
        dealId: deal.id,
        trancheId: tranche.id,
        trancheSeq: tranche.seqNo,
        amountReceived: tranche.amount,
        amountUtilised: utilisedPaise,
        balanceRemaining: remainingPaise,
        preparedBy: user.id,
        narrative: ucNarrative,
      },
      user,
    )

    setDraftUcModal(false)
  }

  const handleSignUcSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!signUcModal || !caUdin || !user) return

    db.signCsrUc(signUcModal.id, caUdin, caMembershipNo, user)
    setSignUcModal(null)
  }

  const handleAddProgressSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return
    const prj = projects.find((p) => p.id === progressProjectId) ?? projects[0]
    if (!prj) return

    db.addCsrProgressUpdate(
      {
        projectId: prj.id,
        periodStart: progressStart,
        periodEnd: progressEnd,
        beneficiariesReached: beneficiaries,
        narrative: progressNarrative || 'Milestone achieved with photo documentation and beneficiary records.',
        photos: [
          {
            url: 'https://images.unsplash.com/photo-1593113598332-cd288d649433?auto=format&fit=crop&w=800&q=80',
            caption: photoCaption,
            consentOk: true,
            takenAt: new Date().toISOString(),
          },
        ],
        createdBy: user.id,
      },
      user,
    )

    setAddProgressModal(false)
    setProgressNarrative('')
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="UCs and reports"
        description="A utilisation certificate is what the company files with the MCA: proof that the grant was spent on the project it was given for. Nothing is certified until the spend is in the ledger."
      >
        <div className="flex flex-wrap items-center justify-between gap-3">
          {/* The shared Tabs control, so this page switches views the same
              way every other console page does. */}
          <Tabs
            value={activeTab}
            onChange={(id) => setActiveTab(id as typeof activeTab)}
            items={[
              { id: 'ucs', label: 'Utilisation certificates', count: ucs.length },
              { id: 'progress', label: 'Field milestones', count: progressUpdates.length },
            ]}
          />

          <div className="flex items-center gap-2">
            <Button
              variant="secondary"
              icon={<Plus className="size-4 shrink-0" />}
              onClick={() => setAddProgressModal(true)}
            >
              Log milestone
            </Button>
            <Button
              icon={<FileCheck2 className="size-4 shrink-0" />}
              disabled={ucDeals.length === 0}
              title={ucDeals.length === 0 ? 'Every received tranche already has a certificate.' : 'Draft a certificate for a received tranche'}
              onClick={() => setDraftUcModal(true)}
            >
              Draft certificate
            </Button>
          </div>
        </div>
      </PageHeader>

      {activeTab === 'ucs' ? (
        <div className="grid gap-6">
          <CsrFundStatement deals={activeDeals} />
          {ucs.map((uc) => {
            const deal = deals.find((d) => d.id === uc.dealId)
            const company = companies.find((c) => c.id === deal?.companyId)
            const project = projects.find((p) => p.id === deal?.projectId)
            const isSigned = uc.status === 'signed'

            return (
              <Card key={uc.id} className="overflow-hidden border border-sandal-300">
                <div className="p-5">
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-xs font-bold uppercase tracking-wider text-turmeric-800">
                          {company?.name}
                        </span>
                        <span className="text-stone-500">→</span>
                        <h3 className="font-display text-base font-bold text-stone-900">
                          {project?.title} (Tranche #{uc.trancheSeq})
                        </h3>
                        <span
                          className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                            isSigned
                              ? 'bg-tulsi-100 text-tulsi-800 border border-tulsi-200'
                              : 'bg-marigold-100 text-marigold-800 border border-marigold-200'
                          }`}
                        >
                          {isSigned ? 'CA CERTIFIED & SIGNED' : 'DRAFT AWAITING SIGNATURE'}
                        </span>
                      </div>

                      <div className="mt-2 text-xs text-stone-700 space-y-1">
                        <p>{uc.narrative}</p>
                        <p className="text-[11px] text-stone-500">
                          Prepared by: <strong className="text-stone-700">{userName(uc.preparedBy)}</strong> on {uc.preparedAt.slice(0, 10)}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {!isSigned && (
                        <Button
                          size="sm"
                          variant="primary"
                          disabled={Boolean(signBlock(uc))}
                          title={signBlock(uc) ?? 'Certify this tranche with your UDIN'}
                          icon={<ShieldCheck className="size-4" />}
                          onClick={() => setSignUcModal(uc)}
                        >
                          Certify & Sign with UDIN
                        </Button>
                      )}
                    </div>
                  </div>

                  {/* Financial Metrics Strip */}
                  <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-3 rounded-lg bg-sandal-50 p-3 text-xs">
                    <div>
                      <span className="text-stone-500 block">Tranche Received</span>
                      <strong className="font-mono text-sm font-bold text-stone-900">
                        {formatMoneyShort(uc.amountReceived)}
                      </strong>
                    </div>
                    <div>
                      <span className="text-stone-500 block">Amount Utilised</span>
                      <strong className="font-mono text-sm font-bold text-tulsi-700">
                        {formatMoneyShort(uc.amountUtilised)}
                      </strong>
                    </div>
                    <div>
                      <span className="text-stone-500 block">Balance Remaining</span>
                      <strong className="font-mono text-sm font-bold text-stone-900">
                        {formatMoneyShort(uc.balanceRemaining)}
                      </strong>
                    </div>
                  </div>

                  {/* Digital Signature & UDIN Seal Box */}
                  {isSigned && (
                    <div className="mt-4 rounded-lg border border-tulsi-300 bg-tulsi-50/60 p-3.5 text-xs text-tulsi-900">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <CheckCircle2 className="size-5 text-tulsi-600 shrink-0" />
                          <div>
                            <p className="font-display font-bold text-tulsi-950">
                              Digitally Verified by Chartered Accountant
                            </p>
                            <p className="text-[11px] text-tulsi-800">
                              ICAI Membership No: <strong className="font-mono">{uc.caMembershipNo}</strong> · Certified on {uc.signedAt?.slice(0, 10)}
                            </p>
                          </div>
                        </div>

                        <div className="rounded bg-white px-3 py-1.5 border border-tulsi-200 text-right">
                          <span className="block text-[10px] uppercase font-bold text-stone-500">ICAI UDIN</span>
                          <span className="font-mono text-xs font-bold text-tulsi-900 tracking-wider">
                            {uc.caUdin}
                          </span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </Card>
            )
          })}
        </div>
      ) : (
        /* Field Photo Evidence & Beneficiary Impact */
        <div className="grid gap-6 md:grid-cols-2">
          {progressUpdates.map((upd) => {
            const project = projects.find((p) => p.id === upd.projectId)

            return (
              <Card key={upd.id} className="overflow-hidden border border-sandal-300">
                <div className="p-5">
                  <div className="flex items-center justify-between gap-2">
                    <h3 className="font-display text-base font-bold text-stone-900">
                      {project?.title}
                    </h3>
                    <span className="inline-flex items-center gap-1 rounded bg-peacock-50 px-2.5 py-0.5 text-xs font-semibold text-peacock-800 border border-peacock-200">
                      <Users className="size-3.5" />
                      {upd.beneficiariesReached.toLocaleString()} Beneficiaries
                    </span>
                  </div>

                  <p className="mt-2 text-xs text-stone-700 leading-relaxed">
                    {upd.narrative}
                  </p>

                  <div className="mt-1 text-[11px] text-stone-500">
                    Period: {upd.periodStart} to {upd.periodEnd} · Recorded by {userName(upd.createdBy)}
                  </div>

                  {/* Photo Evidence Grid */}
                  <div className="mt-4 grid grid-cols-1 gap-2">
                    {upd.photos.map((ph, idx) => (
                      <div key={idx} className="rounded-lg overflow-hidden border border-sandal-200 bg-sandal-50">
                        <img
                          src={ph.url}
                          alt={ph.caption}
                          className="h-48 w-full object-cover"
                        />
                        <div className="p-2.5 flex items-center justify-between text-xs">
                          <span className="font-medium text-stone-900">{ph.caption}</span>
                          <span className="text-[10px] font-semibold text-tulsi-700 bg-tulsi-50 px-2 py-0.5 rounded">
                            Consent Verified
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </Card>
            )
          })}
        </div>
      )}

      {/* Sign UC Modal with UDIN */}
      {signUcModal && (
        <Dialog
          open={Boolean(signUcModal)}
          onClose={() => setSignUcModal(null)}
          title="Sign Statutory Utilisation Certificate (Form GFR-12A)"
        >
          <form onSubmit={handleSignUcSubmit} className="space-y-4">
            <div className="rounded-md border border-turmeric-200 bg-turmeric-50 p-3 text-xs text-turmeric-900">
              <p className="font-semibold">Chartered Accountant Attestation:</p>
              <p className="mt-0.5 text-[11px]">
                Under ICAI Standards, signing this certificate certifies that voucher audit, dedicated bank statement verification, and 5% admin cap compliance were verified.
              </p>
            </div>

            <div>
              <label className="block text-xs font-medium text-stone-700 mb-1">
                ICAI Membership Number
              </label>
              <Input
                placeholder="e.g. 048912"
                value={caMembershipNo}
                onChange={(e) => setCaMembershipNo(e.target.value)}
                required
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-stone-700 mb-1">
                18-Digit ICAI UDIN (Unique Document Identification Number)
              </label>
              <Input
                placeholder="e.g. 26048912AAAAAA9812"
                value={caUdin}
                onChange={(e) => setCaUdin(e.target.value)}
                required
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="secondary" onClick={() => setSignUcModal(null)}>
                Cancel
              </Button>
              <Button type="submit" variant="primary">
                Affix Digital Seal & Certify
              </Button>
            </div>
          </form>
        </Dialog>
      )}

      {/* Draft UC Modal */}
      {draftUcModal && (
        <Dialog
          open={draftUcModal}
          onClose={() => setDraftUcModal(false)}
          title="Draft Utilisation Certificate"
        >
          <form onSubmit={handleDraftUcSubmit} className="space-y-4">
            <div>
              <Select
                label="Select Active Corporate Grant"
                value={selectedDealId}
                onChange={(e) => {
                  setSelectedDealId(e.target.value)
                  const d = ucDeals.find((x) => x.id === e.target.value)
                  if (d && ucReady(d)[0]) setSelectedTrancheId(ucReady(d)[0]!.id)
                }}
                options={ucDeals.map((d) => ({
                  value: d.id,
                  label: `${companies.find((c) => c.id === d.companyId)?.name} — ${formatMoneyShort(d.committedAmount)}`,
                }))}
              />
            </div>

            <div>
              <Select
                label="Instalment / Tranche"
                value={selectedTrancheId}
                onChange={(e) => setSelectedTrancheId(e.target.value)}
                options={ucReady(ucDeals.find((d) => d.id === selectedDealId) ?? ucDeals[0]!).map((t) => ({
                  value: t.id,
                  label: `Tranche #${t.seqNo} (${formatMoneyShort(t.amount)}) — ${t.status}`,
                }))}
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-stone-700 mb-1">
                Amount Utilised (₹)
              </label>
              <Input
                type="number"
                value={amountUtilised}
                onChange={(e) => setAmountUtilised(Number(e.target.value))}
                required
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-stone-700 mb-1">
                Utilisation & Audit Narrative
              </label>
              <textarea
                className="w-full rounded-md border border-sandal-300 p-2 text-xs focus:border-turmeric-500 focus:outline-hidden"
                rows={3}
                value={ucNarrative}
                onChange={(e) => setUcNarrative(e.target.value)}
                required
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="secondary" onClick={() => setDraftUcModal(false)}>
                Cancel
              </Button>
              <Button type="submit" variant="primary">
                Draft Certificate
              </Button>
            </div>
          </form>
        </Dialog>
      )}

      {/* Add Field Progress Milestone Modal */}
      {addProgressModal && (
        <Dialog
          open={addProgressModal}
          onClose={() => setAddProgressModal(false)}
          title="Log Field Progress & Evidence Milestone"
        >
          <form onSubmit={handleAddProgressSubmit} className="space-y-4">
            <div>
              <Select
                label="CSR Project"
                value={progressProjectId}
                onChange={(e) => setProgressProjectId(e.target.value)}
                options={projects.map((p) => ({
                  value: p.id,
                  label: p.title,
                }))}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-stone-700 mb-1">
                  Beneficiaries Directly Reached
                </label>
                <Input
                  type="number"
                  value={beneficiaries}
                  onChange={(e) => setBeneficiaries(Number(e.target.value))}
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-stone-700 mb-1">
                  Photo Caption
                </label>
                <Input
                  value={photoCaption}
                  onChange={(e) => setPhotoCaption(e.target.value)}
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-stone-700 mb-1">
                Progress Narrative Summary
              </label>
              <textarea
                className="w-full rounded-md border border-sandal-300 p-2 text-xs focus:border-turmeric-500 focus:outline-hidden"
                rows={3}
                placeholder="Details of food distribution, equipment installation, student attendance..."
                value={progressNarrative}
                onChange={(e) => setProgressNarrative(e.target.value)}
                required
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="secondary" onClick={() => setAddProgressModal(false)}>
                Cancel
              </Button>
              <Button type="submit" variant="primary">
                Save Milestone
              </Button>
            </div>
          </form>
        </Dialog>
      )}
    </div>
  )
}
