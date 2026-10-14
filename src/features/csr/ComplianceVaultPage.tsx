import { useState } from 'react'
import {
  AlertCircle,
  CheckCircle2,
  Clock,
  Eye,
  FileText,
  Plus,
  ShieldCheck,
  UploadCloud,
  XCircle,
} from 'lucide-react'

import { Button } from '@/components/ui/Button'
import { Card, CardHeader } from '@/components/ui/Card'
import { Dialog } from '@/components/ui/Dialog'
import { Input } from '@/components/ui/Input'
import { Skeleton } from '@/components/ui/Skeleton'
import { PageHeader } from '@/components/layout/PageHeader'
import { userById } from '@/mock/seed'
import { useDb } from '@/store/db'
import { useSession } from '@/store/session'
import type { CsrDocType, CsrDocument } from '@/types'

export function ComplianceVaultPage() {
  const db = useDb()
  const personaId = useSession((s) => s.personaId)
  const user = userById(personaId)

  const [selectedEntityId, setSelectedEntityId] = useState<string>('csr-ent-sevalaya')
  const [uploadModalOpen, setUploadModalOpen] = useState(false)
  const [verifyDocModal, setVerifyDocModal] = useState<CsrDocument | null>(null)
  const [verifyStatus, setVerifyStatus] = useState<'verified' | 'rejected'>('verified')
  const [verifyComment, setVerifyComment] = useState('')

  // New document form state
  const [newDocType, setNewDocType] = useState<CsrDocType>('AUDITED_ACCOUNTS')
  const [newDocLabel, setNewDocLabel] = useState('')
  const [newDocNumber, setNewDocNumber] = useState('')
  const [newDocFy, setNewDocFy] = useState('2025-26')
  const [newDocValidUntil, setNewDocValidUntil] = useState('')

  if (!db.ready) return <Skeleton className="h-96 w-full" />

  const entities = db.csrEntities
  const activeEntity = entities.find((e) => e.id === selectedEntityId) ?? entities[0]
  const entityDocs = db.csrDocuments.filter((d) => d.entityId === activeEntity.id)

  const isCaOrTrustee =
    user?.role === 'ca_partner' ||
    user?.role === 'ca_staff' ||
    user?.role === 'trustee' ||
    user?.role === 'super_admin'

  // Statutory check list items
  const checkItems = [
    {
      key: 'REG_CERT',
      title: 'Registration / Trust Deed',
      desc: 'Registered under Indian Trusts Act / Societies Registration Act',
      found: entityDocs.find((d) => d.docType === 'REG_CERT' && d.status === 'verified'),
    },
    {
      key: 'RNPO_332',
      title: 'RNPO Sec 332 (legacy 12A)',
      desc: 'Recognised Non-Profit Organisation registration under Income-tax Act 2025',
      found: entityDocs.find((d) => d.docType === 'RNPO_332' && d.status === 'verified'),
    },
    {
      key: 'APPROVAL_354',
      title: 'Sec 354 Approval (legacy 80G)',
      desc: 'Tax deduction approval certificate under Income-tax Act 2025',
      found: entityDocs.find((d) => d.docType === 'APPROVAL_354' && d.status === 'verified'),
    },
    {
      key: 'CSR1',
      title: 'MCA Form CSR-1',
      desc: 'Unique registration number issued by Ministry of Corporate Affairs',
      found: entityDocs.find((d) => d.docType === 'CSR1' && d.status === 'verified'),
    },
    {
      key: 'AUDITED_ACCOUNTS',
      title: '3-Year Audited Accounts',
      desc: 'Statutory audit reports proving minimum 3-year track record',
      found: entityDocs.find((d) => d.docType === 'AUDITED_ACCOUNTS' && d.status === 'verified'),
    },
  ]

  const handleUploadSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!newDocLabel || !user) return

    db.uploadCsrDocument(
      {
        entityId: activeEntity.id,
        docType: newDocType,
        label: newDocLabel,
        docNumber: newDocNumber || undefined,
        financialYear: newDocFy || undefined,
        validUntil: newDocValidUntil || null,
        filePath: `/vault/${activeEntity.id}/${Date.now()}-${newDocType.toLowerCase()}.pdf`,
        uploadedBy: user.name,
      },
      user,
    )

    setUploadModalOpen(false)
    setNewDocLabel('')
    setNewDocNumber('')
  }

  const handleVerifySubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!verifyDocModal || !user) return

    db.verifyCsrDocument(verifyDocModal.id, verifyStatus, verifyComment, user)
    setVerifyDocModal(null)
    setVerifyComment('')
  }

  return (
    <div className="space-y-6">
      <PageHeader
        phase="control"
        title="Compliance Vault"
        description="Statutory non-profit registry, Form CSR-1 credentials, Income-tax Act 2025 approvals (Sec 332 & 354), and 3-year track record audit verification."
        actions={
          <Button
            variant="primary"
            icon={<Plus className="size-4" aria-hidden />}
            onClick={() => setUploadModalOpen(true)}
          >
            Upload Document
          </Button>
        }
      />

      {/* Entity Selector Tabs */}
      <div className="flex flex-wrap items-center gap-2 pb-1">
        {entities.map((ent) => {
          const isSelected = ent.id === activeEntity.id
          const isReady = ent.readinessStatus === 'CSR_READY'
          return (
            <button
              key={ent.id}
              onClick={() => setSelectedEntityId(ent.id)}
              className={`flex items-center gap-2.5 rounded-lg px-4 py-2.5 text-sm font-medium transition ${
                isSelected
                  ? 'border border-turmeric-400 bg-turmeric-50/80 text-turmeric-900 shadow-xs'
                  : 'border border-transparent bg-white text-sandalwood-700 hover:border-sandalwood-200 hover:bg-sandalwood-50'
              }`}
            >
              <ShieldCheck
                className={`size-4 ${isReady ? 'text-tulsi-600' : 'text-turmeric-600'}`}
              />
              <span className="font-serif font-semibold">{ent.legalName}</span>
              <span
                className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${
                  isReady ? 'bg-tulsi-100 text-tulsi-800' : 'bg-turmeric-100 text-turmeric-800'
                }`}
              >
                {isReady ? 'Ready' : 'Pending Docs'}
              </span>
            </button>
          )
        })}
      </div>

      {/* Entity Profile & Statutory Gate Banner */}
      <Card className="border border-sandalwood-300/80 bg-white shadow-xs">
        <div className="p-5">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="font-serif text-lg font-bold text-sandalwood-900">
                  {activeEntity.legalName}
                </h2>
                <span className="rounded bg-sandalwood-100 px-2 py-0.5 font-mono text-xs uppercase text-sandalwood-700">
                  {activeEntity.entityType}
                </span>
                <span
                  className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                    activeEntity.readinessStatus === 'CSR_READY'
                      ? 'bg-tulsi-100 text-tulsi-800 border border-tulsi-300'
                      : 'bg-turmeric-100 text-turmeric-800 border border-turmeric-300'
                  }`}
                >
                  {activeEntity.readinessStatus === 'CSR_READY' ? (
                    <CheckCircle2 className="size-3.5" />
                  ) : (
                    <Clock className="size-3.5" />
                  )}
                  {activeEntity.readinessStatus === 'CSR_READY' ? 'CSR READY (MCA Section 135 Compliant)' : 'IN PROGRESS'}
                </span>
              </div>
              <p className="mt-1 text-xs text-sandalwood-600">
                {activeEntity.notes}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4 border-t border-sandalwood-200 pt-3 sm:grid-cols-4 lg:border-t-0 lg:pt-0">
              <div className="rounded border border-sandalwood-200 bg-sandalwood-50/70 p-2 text-center">
                <span className="block text-[10px] uppercase tracking-wider text-sandalwood-500">PAN</span>
                <span className="font-mono text-xs font-bold text-sandalwood-900">{activeEntity.pan}</span>
              </div>
              <div className="rounded border border-sandalwood-200 bg-sandalwood-50/70 p-2 text-center">
                <span className="block text-[10px] uppercase tracking-wider text-sandalwood-500">CSR-1 Number</span>
                <span className="font-mono text-xs font-bold text-tulsi-700">
                  {activeEntity.csr1RegNo ?? 'Pending'}
                </span>
              </div>
              <div className="rounded border border-sandalwood-200 bg-sandalwood-50/70 p-2 text-center">
                <span className="block text-[10px] uppercase tracking-wider text-sandalwood-500">NGO Darpan ID</span>
                <span className="font-mono text-xs font-bold text-sandalwood-900">
                  {activeEntity.darpanId ?? 'N/A'}
                </span>
              </div>
              <div className="rounded border border-sandalwood-200 bg-sandalwood-50/70 p-2 text-center">
                <span className="block text-[10px] uppercase tracking-wider text-sandalwood-500">Registered On</span>
                <span className="font-mono text-xs font-bold text-sandalwood-900">
                  {activeEntity.registrationDate}
                </span>
              </div>
            </div>
          </div>

          {/* 5 Statutory Pillars Checklist */}
          <div className="mt-5 border-t border-sandalwood-200 pt-4">
            <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-sandalwood-600">
              MCA Mandatory Implementing Agency Checklist
            </h3>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
              {checkItems.map((item) => (
                <div
                  key={item.key}
                  className={`flex items-start gap-2.5 rounded-lg border p-3 transition ${
                    item.found
                      ? 'border-tulsi-200 bg-tulsi-50/50'
                      : 'border-sandalwood-200 bg-sandalwood-50/40'
                  }`}
                >
                  {item.found ? (
                    <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-tulsi-600" />
                  ) : (
                    <AlertCircle className="mt-0.5 size-4 shrink-0 text-turmeric-600" />
                  )}
                  <div>
                    <h4 className="font-serif text-xs font-bold text-sandalwood-900">{item.title}</h4>
                    <p className="mt-0.5 text-[11px] leading-tight text-sandalwood-600">{item.desc}</p>
                    <span
                      className={`mt-1.5 inline-block font-mono text-[10px] font-semibold ${
                        item.found ? 'text-tulsi-700' : 'text-turmeric-700'
                      }`}
                    >
                      {item.found ? 'VERIFIED' : 'PENDING'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </Card>

      {/* Compliance Documents Table */}
      <Card>
        <CardHeader
          title={`Compliance Documents Dossier (${entityDocs.length})`}
          description="Legally required tax exemptions, registration certifications, and certified accounts."
        />
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-sandalwood-800">
            <thead className="border-b border-sandalwood-200 bg-sandalwood-50 text-xs font-semibold uppercase tracking-wider text-sandalwood-600">
              <tr>
                <th className="px-4 py-3">Document Title</th>
                <th className="px-4 py-3">Type / Category</th>
                <th className="px-4 py-3">Reference / Number</th>
                <th className="px-4 py-3">Financial Year / Validity</th>
                <th className="px-4 py-3">Verification Status</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-sandalwood-200">
              {entityDocs.map((doc) => {
                const isVerified = doc.status === 'verified'
                const isRejected = doc.status === 'rejected'

                return (
                  <tr key={doc.id} className="hover:bg-sandalwood-50/50 transition">
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-2">
                        <FileText className="size-4 shrink-0 text-sandalwood-400" />
                        <div>
                          <strong className="font-serif text-sm font-semibold text-sandalwood-900">
                            {doc.label}
                          </strong>
                          {doc.comment && (
                            <p className="text-xs text-sandalwood-500 italic">CA Note: {doc.comment}</p>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3.5">
                      <span className="font-mono text-xs rounded bg-sandalwood-100 px-2 py-0.5 text-sandalwood-700">
                        {doc.docType}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 font-mono text-xs text-sandalwood-700">
                      {doc.docNumber ?? '—'}
                    </td>
                    <td className="px-4 py-3.5 text-xs text-sandalwood-700">
                      {doc.financialYear && <span>FY {doc.financialYear}</span>}
                      {doc.validUntil && (
                        <span className="block text-[11px] text-sandalwood-500">
                          Valid until: {doc.validUntil}
                        </span>
                      )}
                      {!doc.financialYear && !doc.validUntil && <span>Permanent</span>}
                    </td>
                    <td className="px-4 py-3.5">
                      <span
                        className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                          isVerified
                            ? 'bg-tulsi-50 text-tulsi-800 border border-tulsi-200'
                            : isRejected
                            ? 'bg-kumkum-50 text-kumkum-800 border border-kumkum-200'
                            : 'bg-turmeric-50 text-turmeric-800 border border-turmeric-200'
                        }`}
                      >
                        {isVerified && <CheckCircle2 className="size-3" />}
                        {isRejected && <XCircle className="size-3" />}
                        {!isVerified && !isRejected && <Clock className="size-3" />}
                        {doc.status.toUpperCase()}
                      </span>
                      {doc.verifiedAt && (
                        <span className="block mt-0.5 text-[10px] text-sandalwood-500">
                          Verified: {doc.verifiedAt.slice(0, 10)}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3.5 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {isCaOrTrustee && (
                          <Button
                            size="sm"
                            variant="secondary"
                            onClick={() => {
                              setVerifyDocModal(doc)
                              setVerifyStatus('verified')
                              setVerifyComment(doc.comment ?? '')
                            }}
                          >
                            Review
                          </Button>
                        )}
                        <a
                          href={doc.filePath}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1 rounded border border-sandalwood-200 bg-white px-2 py-1 text-xs text-sandalwood-700 hover:bg-sandalwood-100"
                        >
                          <Eye className="size-3.5" />
                          View
                        </a>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Upload Document Modal */}
      {uploadModalOpen && (
        <Dialog
          open={uploadModalOpen}
          onClose={() => setUploadModalOpen(false)}
          title="Upload Statutory Document"
        >
          <form onSubmit={handleUploadSubmit} className="space-y-4">
            <p className="text-xs text-sandalwood-600">
              Upload compliance documents for <strong>{activeEntity.legalName}</strong>. All documents are reviewed by a Chartered Accountant prior to sanction.
            </p>

            <div>
              <label className="block text-xs font-medium text-sandalwood-700 mb-1">
                Document Classification
              </label>
              <select
                className="w-full rounded-lg border border-sandalwood-300 bg-white py-2 px-3 text-xs text-sandalwood-900 focus:outline-hidden"
                value={newDocType}
                onChange={(e) => setNewDocType(e.target.value as CsrDocType)}
              >
                <option value="REG_CERT">Trust Deed / Registration Certificate</option>
                <option value="RNPO_332">RNPO Registration (Income-tax Act 2025 Sec 332 / 12A)</option>
                <option value="APPROVAL_354">Tax Approval (Income-tax Act 2025 Sec 354 / 80G)</option>
                <option value="CSR1">MCA Form CSR-1 Registration</option>
                <option value="AUDITED_ACCOUNTS">Audited Balance Sheet & P&L (3 Years)</option>
                <option value="ITR">Income Tax Return (ITR-7)</option>
                <option value="BOARD_RESOLUTION">Board Resolution for CSR Execution</option>
                <option value="DARPAN">NITI Aayog NGO Darpan Certificate</option>
                <option value="BANK_PROOF">Dedicated CSR Bank Account Proof</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-sandalwood-700 mb-1">
                Document Title / Label
              </label>
              <Input
                placeholder="e.g. FY 2024-25 Audited Financial Statements & CA Report"
                value={newDocLabel}
                onChange={(e) => setNewDocLabel(e.target.value)}
                required
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-medium text-sandalwood-700 mb-1">
                  Registration / Approval No.
                </label>
                <Input
                  placeholder="e.g. CSR00028914"
                  value={newDocNumber}
                  onChange={(e) => setNewDocNumber(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-sandalwood-700 mb-1">
                  Financial Year
                </label>
                <Input
                  placeholder="e.g. 2024-25"
                  value={newDocFy}
                  onChange={(e) => setNewDocFy(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-sandalwood-700 mb-1">
                  Valid Until
                </label>
                <Input
                  type="date"
                  value={newDocValidUntil}
                  onChange={(e) => setNewDocValidUntil(e.target.value)}
                />
              </div>
            </div>

            <div className="rounded-lg border-2 border-dashed border-sandalwood-300 p-4 text-center">
              <UploadCloud className="mx-auto size-8 text-sandalwood-400" />
              <p className="mt-1 text-xs font-medium text-sandalwood-800">
                Click or drag PDF file to upload
              </p>
              <p className="text-[11px] text-sandalwood-500">Max size: 25MB (PDF or Signed Scan)</p>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="secondary" onClick={() => setUploadModalOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" variant="primary">
                Upload to Vault
              </Button>
            </div>
          </form>
        </Dialog>
      )}

      {/* CA Verification Modal */}
      {verifyDocModal && (
        <Dialog
          open={Boolean(verifyDocModal)}
          onClose={() => setVerifyDocModal(null)}
          title="CA Statutory Review"
        >
          <form onSubmit={handleVerifySubmit} className="space-y-4">
            <div className="rounded-md border border-turmeric-200 bg-turmeric-50 p-3 text-xs text-turmeric-900">
              <p className="font-semibold">Reviewing: {verifyDocModal.label}</p>
              <p className="mt-0.5 text-[11px]">
                Type: {verifyDocModal.docType} · Entity: {activeEntity.legalName}
              </p>
            </div>

            <div>
              <label className="block text-xs font-medium text-sandalwood-700 mb-1">
                Audit Decision
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setVerifyStatus('verified')}
                  className={`flex items-center justify-center gap-2 rounded-lg border p-2.5 text-xs font-semibold ${
                    verifyStatus === 'verified'
                      ? 'border-tulsi-500 bg-tulsi-50 text-tulsi-900'
                      : 'border-sandalwood-200 bg-white text-sandalwood-700'
                  }`}
                >
                  <CheckCircle2 className="size-4 text-tulsi-600" />
                  Approve & Verify
                </button>
                <button
                  type="button"
                  onClick={() => setVerifyStatus('rejected')}
                  className={`flex items-center justify-center gap-2 rounded-lg border p-2.5 text-xs font-semibold ${
                    verifyStatus === 'rejected'
                      ? 'border-kumkum-500 bg-kumkum-50 text-kumkum-900'
                      : 'border-sandalwood-200 bg-white text-sandalwood-700'
                  }`}
                >
                  <XCircle className="size-4 text-kumkum-600" />
                  Reject / Resubmit
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-sandalwood-700 mb-1">
                CA Auditor Remarks / Ledger Comments
              </label>
              <textarea
                className="w-full rounded-md border border-sandalwood-300 p-2 text-xs focus:border-turmeric-500 focus:outline-hidden"
                rows={3}
                placeholder="Confirm that registration certificate numbers, validity dates and stamp seals match MCA records..."
                value={verifyComment}
                onChange={(e) => setVerifyComment(e.target.value)}
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="secondary" onClick={() => setVerifyDocModal(null)}>
                Cancel
              </Button>
              <Button type="submit" variant="primary">
                Record Verification
              </Button>
            </div>
          </form>
        </Dialog>
      )}
    </div>
  )
}
