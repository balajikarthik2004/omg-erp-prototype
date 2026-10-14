import { useState } from 'react'
import {
  CheckCircle2,
  Clock,
  Coins,
  Lock,
  LockOpen,
  ShieldCheck,
} from 'lucide-react'

import { formatMoney } from '@/lib/format'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Dialog } from '@/components/ui/Dialog'
import { Input } from '@/components/ui/Input'
import { Skeleton } from '@/components/ui/Skeleton'
import { PageHeader } from '@/components/layout/PageHeader'
import { userById } from '@/mock/seed'
import { available, useDb } from '@/store/db'
import { csrMouDecideBlock, csrTrancheReceiveBlock } from '@/store/csrRules'
import { useSession } from '@/store/session'
import type { CsrDeal, CsrTranche } from '@/types'

export function CsrDealsPage() {
  const db = useDb()
  const personaId = useSession((s) => s.personaId)
  const user = userById(personaId)

  const [selectedDeal, setSelectedDeal] = useState<CsrDeal | null>(null)
  const [receiveTrancheModal, setReceiveTrancheModal] = useState<{
    deal: CsrDeal
    tranche: CsrTranche
  } | null>(null)
  const [bankRef, setBankRef] = useState('')
  const [mouDecisionModal, setMouDecisionModal] = useState<CsrDeal | null>(null)
  const [mouComment, setMouComment] = useState('')

  if (!db.ready) return <Skeleton className="h-96 w-full" />

  const deals = db.csrDeals
  const companies = db.csrCompanies
  const projects = db.csrProjects
  const funds = db.funds

  const mouBlock = (deal: CsrDeal) => (user ? csrMouDecideBlock(user, deal) : 'Pick a persona first.')

  const handleReceiveTranche = (e: React.FormEvent) => {
    e.preventDefault()
    if (!receiveTrancheModal || !bankRef || !user) return

    const { deal, tranche } = receiveTrancheModal
    const res = db.receiveCsrTranche(deal.id, tranche.id, bankRef, user)
    if (res.ok) {
      setReceiveTrancheModal(null)
      setBankRef('')
    }
  }

  const handleMouSign = (decision: 'approved' | 'rejected') => {
    if (!mouDecisionModal || !user) return
    db.decideCsrMoU(mouDecisionModal.id, decision, user, mouComment)
    setMouDecisionModal(null)
    setMouComment('')
  }

  return (
    <div className="space-y-6">
      <PageHeader
        phase="control"
        title="MoUs, Grants & Tranche Disbursements"
        description="MCA bilateral agreements, dual-signatory CA & Trustee sanction, 5% admin cap covenants, and sequential UC gates for instalment release."
      />

      <div className="space-y-6">
        {deals.map((deal) => {
          const comp = companies.find((c) => c.id === deal.companyId)
          const proj = projects.find((p) => p.id === deal.projectId)
          const dedicatedFund = funds.find((f) => f.id === deal.fundId)
          const csrHead = db.budgets.find((b) => b.fundId === deal.fundId && b.csrProjectId === deal.projectId)
          const entity = db.csrEntities.find((e) => e.id === proj?.entityId)

          const caApproval = deal.approvals.find((a) => a.role === 'ca_partner')
          const trusteeApproval = deal.approvals.find((a) => a.role === 'trustee')
          const isFullySanctioned = caApproval?.decision === 'approved' && trusteeApproval?.decision === 'approved'

          const receivedTotal = deal.tranches
            .filter((t) => t.status === 'RECEIVED' || t.status === 'UTILISED' || t.status === 'UC_SIGNED')
            .reduce((sum, t) => sum + t.amount, 0)

          return (
            <Card key={deal.id} className="overflow-hidden border border-sandalwood-300">
              {/* Header Banner */}
              <div className="border-b border-sandalwood-200 bg-sandalwood-50/70 p-5">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-xs font-bold uppercase tracking-wider text-turmeric-800">
                        {comp?.name}
                      </span>
                      <span className="text-sandalwood-400">→</span>
                      <h3 className="font-serif text-lg font-bold text-sandalwood-900">
                        {proj?.title}
                      </h3>
                      <span className="rounded-full bg-tulsi-100 px-2.5 py-0.5 text-xs font-semibold text-tulsi-800 border border-tulsi-200">
                        {deal.status}
                      </span>
                    </div>

                    <div className="mt-2 flex flex-wrap items-center gap-x-5 gap-y-1 text-xs text-sandalwood-600">
                      <span>Total Sanctioned Grant: <strong className="font-mono text-sandalwood-900">{formatMoney(deal.committedAmount)}</strong></span>
                      <span>Admin Overhead: <strong className="font-mono text-tulsi-700">{deal.adminCapPct}%</strong> (Max 5.0% cap)</span>
                      <span>Dedicated Restricted Fund: <strong className="font-mono text-sandalwood-800">{dedicatedFund?.name ?? deal.fundId ?? 'Pending creation'}</strong></span>
                      {deal.mouSignedOn && <span>Executed On: <strong>{deal.mouSignedOn}</strong></span>}
                      {dedicatedFund && <span>Unallotted in fund: <strong className="font-mono text-stone-900">{formatMoney(dedicatedFund.balance)}</strong></span>}
                      {csrHead && (
                        <span>
                          Project budget: <strong className="font-mono text-stone-900">{formatMoney(csrHead.allocated)}</strong> allotted ·{' '}
                          <strong className="font-mono text-stone-900">{formatMoney(csrHead.spent)}</strong> spent ·{' '}
                          <strong className="font-mono text-tulsi-700">{formatMoney(available(csrHead))}</strong> available
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {deal.status === 'MOU_DRAFT' && !isFullySanctioned && (
                      <Button
                        size="sm"
                        variant="primary"
                        disabled={Boolean(mouBlock(deal))}
                        title={mouBlock(deal) ?? 'Sign or send back this MoU'}
                        icon={<ShieldCheck className="size-4" />}
                        onClick={() => setMouDecisionModal(deal)}
                      >
                        Sanction MoU
                      </Button>
                    )}
                    <button
                      onClick={() => setSelectedDeal(deal)}
                      className="rounded border border-sandalwood-300 bg-white px-3 py-1.5 text-xs font-semibold text-sandalwood-700 hover:bg-sandalwood-50 transition"
                    >
                      View MoU Proposal
                    </button>
                  </div>
                </div>

                {/* Dual Governance Sign-Off Status */}
                <div className="mt-4 flex flex-wrap items-center gap-4 border-t border-sandalwood-200/80 pt-3 text-xs">
                  <div className="flex items-center gap-2">
                    <span className="text-sandalwood-500">CA Partner Sanction:</span>
                    {caApproval?.decision === 'approved' ? (
                      <span className="inline-flex items-center gap-1 font-semibold text-tulsi-700">
                        <CheckCircle2 className="size-3.5" /> Approved ({caApproval.at?.slice(0, 10)})
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 font-semibold text-turmeric-700">
                        <Clock className="size-3.5" /> Pending Review
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-sandalwood-500">Board Trustee Sanction:</span>
                    {trusteeApproval?.decision === 'approved' ? (
                      <span className="inline-flex items-center gap-1 font-semibold text-tulsi-700">
                        <CheckCircle2 className="size-3.5" /> Approved ({trusteeApproval.at?.slice(0, 10)})
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 font-semibold text-turmeric-700">
                        <Clock className="size-3.5" /> Pending Sanction
                      </span>
                    )}
                  </div>

                  <div className="ml-auto text-xs font-mono font-medium text-sandalwood-700">
                    Disbursed: <strong className="text-tulsi-700">{formatMoney(receivedTotal)}</strong> / {formatMoney(deal.committedAmount)}
                  </div>
                </div>
              </div>

              {/* Tranche Milestone Schedule Table */}
              <div className="p-4">
                <h4 className="text-xs font-bold uppercase tracking-wider text-sandalwood-700 mb-3">
                  Instalment & Utilisation Certificate Gate Schedule
                </h4>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm text-sandalwood-800">
                    <thead className="border-b border-sandalwood-200 bg-sandalwood-50 text-xs font-semibold uppercase tracking-wider text-sandalwood-600">
                      <tr>
                        <th className="px-3 py-2.5">Tranche</th>
                        <th className="px-3 py-2.5">Scheduled Outlay</th>
                        <th className="px-3 py-2.5">Due Date</th>
                        <th className="px-3 py-2.5">Pre-Disbursement Statutory Condition</th>
                        <th className="px-3 py-2.5">Instalment Status</th>
                        <th className="px-3 py-2.5 text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-sandalwood-200 text-xs">
                      {deal.tranches.map((t) => {
                        const receiveBlock = csrTrancheReceiveBlock(deal, t, entity)
                        const isReceived =
                          t.status === 'RECEIVED' || t.status === 'UTILISED' || t.status === 'UC_SIGNED'
                        const isUcSigned = t.status === 'UC_SIGNED'

                        return (
                          <tr key={t.id} className="hover:bg-sandalwood-50/50">
                            <td className="px-3 py-3 font-mono font-bold text-sandalwood-900">
                              #{t.seqNo}
                            </td>
                            <td className="px-3 py-3 font-mono font-bold text-sandalwood-900">
                              {formatMoney(t.amount)}
                            </td>
                            <td className="px-3 py-3 text-sandalwood-600">
                              {t.dueDate}
                            </td>
                            <td className="px-3 py-3 text-sandalwood-700 max-w-xs">
                              {t.conditionText}
                              {t.bankRef && (
                                <span className="block mt-0.5 font-mono text-[10px] text-tulsi-700">
                                  Bank UTR: {t.bankRef}
                                </span>
                              )}
                            </td>
                            <td className="px-3 py-3">
                              <span
                                className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${
                                  isUcSigned
                                    ? 'bg-tulsi-100 text-tulsi-800'
                                    : t.status === 'RECEIVED'
                                    ? 'bg-peacock-100 text-peacock-800'
                                    : 'bg-sandalwood-100 text-sandalwood-700'
                                }`}
                              >
                                {isUcSigned && <CheckCircle2 className="size-3" />}
                                {t.status === 'RECEIVED' && <Coins className="size-3" />}
                                {!isReceived && <Clock className="size-3" />}
                                {t.status}
                              </span>
                            </td>
                            <td className="px-3 py-3 text-right">
                              {!isReceived ? (
                                !receiveBlock ? (
                                  <Button
                                    size="sm"
                                    variant="primary"
                                    icon={<LockOpen className="size-3.5" />}
                                    onClick={() => setReceiveTrancheModal({ deal, tranche: t })}
                                  >
                                    Record Receipt
                                  </Button>
                                ) : (
                                  <span className="inline-flex items-center gap-1 text-[11px] font-medium text-kumkum-700 bg-kumkum-50 px-2 py-1 rounded border border-kumkum-200">
                                    <Lock className="size-3" />
                                    {receiveBlock}
                                  </span>
                                )
                              ) : (
                                <span className="text-xs text-sandalwood-500 font-mono">
                                  Credited {t.receivedOn}
                                </span>
                              )}
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </Card>
          )
        })}
      </div>

      {/* Record Tranche Receipt Modal */}
      {receiveTrancheModal && (
        <Dialog
          open={Boolean(receiveTrancheModal)}
          onClose={() => setReceiveTrancheModal(null)}
          title={`Record CSR Disbursement: Tranche #${receiveTrancheModal.tranche.seqNo}`}
        >
          <form onSubmit={handleReceiveTranche} className="space-y-4">
            <div className="rounded-lg bg-tulsi-50 border border-tulsi-200 p-3 text-xs text-tulsi-900 space-y-1">
              <p>
                <strong>Disbursement Amount:</strong>{' '}
                <span className="font-mono text-sm font-bold">
                  {formatMoney(receiveTrancheModal.tranche.amount)}
                </span>
              </p>
              <p>
                <strong>Pre-condition:</strong> {receiveTrancheModal.tranche.conditionText}
              </p>
              <p className="text-[11px] text-tulsi-700">
                Proceeding will immediately credit the dedicated restricted CSR project fund in the double-entry ledger.
              </p>
            </div>

            <div>
              <label className="block text-xs font-medium text-sandalwood-700 mb-1">
                Bank Transfer UTR / NEFT Reference Number
              </label>
              <Input
                placeholder="e.g. CMS/TVS/9482103859/NEFT"
                value={bankRef}
                onChange={(e) => setBankRef(e.target.value)}
                required
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="secondary" onClick={() => setReceiveTrancheModal(null)}>
                Cancel
              </Button>
              <Button type="submit" variant="primary">
                Confirm & Post to Ledger
              </Button>
            </div>
          </form>
        </Dialog>
      )}

      {/* Sanction MoU Modal */}
      {mouDecisionModal && (
        <Dialog
          open={Boolean(mouDecisionModal)}
          onClose={() => setMouDecisionModal(null)}
          title="Dual Sanction Review: CSR Bilateral MoU"
        >
          <div className="space-y-4">
            <div className="rounded-md border border-turmeric-200 bg-turmeric-50 p-3 text-xs text-turmeric-900">
              <p className="font-semibold">Statutory Compliance Affirmation:</p>
              <p className="mt-0.5 text-[11px]">
                By sanctioning this agreement, you confirm that administrative overhead is within the 5.0% cap under Section 135(5), and no pooja or ritual expenses are funded.
              </p>
            </div>

            <div>
              <label className="block text-xs font-medium text-sandalwood-700 mb-1">
                Review Remarks / Resolution Reference
              </label>
              <textarea
                className="w-full rounded-md border border-sandalwood-300 p-2 text-xs focus:border-turmeric-500 focus:outline-hidden"
                rows={3}
                placeholder="Sanctioned by Board Resolution / CA Partner concurrence..."
                value={mouComment}
                onChange={(e) => setMouComment(e.target.value)}
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button variant="secondary" onClick={() => handleMouSign('rejected')}>
                Return for Revision
              </Button>
              <Button variant="primary" onClick={() => handleMouSign('approved')}>
                Sanction MoU Execution
              </Button>
            </div>
          </div>
        </Dialog>
      )}

      {/* View MoU Proposal Drawer / Dialog */}
      {selectedDeal && (
        <Dialog
          open={Boolean(selectedDeal)}
          onClose={() => setSelectedDeal(null)}
          title="Bilateral Agreement & Proposal Dossier"
        >
          <div className="space-y-3">
            <textarea
              readOnly
              className="w-full font-mono text-xs text-sandalwood-900 bg-sandalwood-50 border border-sandalwood-300 rounded-lg p-3 leading-relaxed"
              rows={15}
              value={selectedDeal.proposalText ?? 'No proposal text attached.'}
            />
            <div className="flex justify-end pt-2">
              <Button variant="secondary" onClick={() => setSelectedDeal(null)}>
                Close
              </Button>
            </div>
          </div>
        </Dialog>
      )}
    </div>
  )
}
