import type { StoreApi } from 'zustand'

import { formatMoney } from '@/lib/format'
import { toast } from '@/lib/toast'
import type {
  BudgetHead,
  CsrCompany,
  CsrDeal,
  CsrDealStatus,
  CsrDocType,
  CsrDocument,
  CsrProject,
  CsrProjectStatus,
  CsrProgressUpdate,
  CsrReadinessStatus,
  CsrUtilisationCertificate,
  Fund,
  User,
} from '@/types'
import { audit, journalEntry, type DbState } from './db'
import {
  csrDocVerifyBlock,
  csrMouDecideBlock,
  csrPitchBlock,
  csrProjectDecideBlock,
  csrTrancheReceiveBlock,
  csrUcSignBlock,
  RECEIVED_TRANCHE,
  UDIN_PATTERN,
} from './csrRules'
import { closedPeriodError } from './rules'

type Set = StoreApi<DbState>['setState']
type Get = StoreApi<DbState>['getState']

type Result<T = object> = ({ ok: true } & T) | { ok: false; error: string }

export interface CsrActions {
  /* Compliance Vault */
  verifyCsrDocument: (
    docId: string,
    status: 'verified' | 'rejected',
    comment: string | undefined,
    actor: User,
  ) => Result
  uploadCsrDocument: (
    input: Omit<CsrDocument, 'id' | 'uploadedAt' | 'status'>,
    actor: User,
  ) => Result<{ id: string }>

  /* Projects & Schedule VII */
  createCsrProject: (
    input: Omit<CsrProject, 'id' | 'createdAt' | 'status'>,
    actor: User,
  ) => Result<{ id: string }>
  decideCsrProject: (
    projectId: string,
    decision: 'approved' | 'rejected',
    actor: User,
    comment?: string,
  ) => Result

  /* Companies & Pipeline */
  createCsrCompany: (
    input: Omit<CsrCompany, 'id'>,
    actor: User,
  ) => Result<{ id: string }>
  createCsrDeal: (
    input: Omit<CsrDeal, 'id' | 'approvals'>,
    actor: User,
  ) => Result<{ id: string }>
  updateCsrDealStatus: (
    dealId: string,
    status: CsrDealStatus,
    actor: User,
    lostReason?: string,
  ) => Result
  decideCsrMoU: (
    dealId: string,
    decision: 'approved' | 'rejected',
    actor: User,
    comment?: string,
  ) => Result

  /* Tranches & Money */
  receiveCsrTranche: (
    dealId: string,
    trancheId: string,
    bankRef: string,
    actor: User,
  ) => Result

  /* Reporting & UCs */
  createCsrUc: (
    input: Omit<CsrUtilisationCertificate, 'id' | 'preparedAt' | 'status'>,
    actor: User,
  ) => Result<{ id: string }>
  signCsrUc: (
    ucId: string,
    caUdin: string,
    caMembershipNo: string,
    actor: User,
  ) => Result
  addCsrProgressUpdate: (
    input: Omit<CsrProgressUpdate, 'id' | 'createdAt'>,
    actor: User,
  ) => Result<{ id: string }>
}

/** The five papers an entity needs, verified and in date, to be CSR_READY. */
const REQUIRED_DOCS: CsrDocType[] = ['REG_CERT', 'RNPO_332', 'APPROVAL_354', 'CSR1', 'AUDITED_ACCOUNTS']

const RECEIPT_ROLES = ['sector_admin', 'ca_staff', 'ca_partner']

let seq = 0
/** Unique even for two records made in the same millisecond. */
const newId = (prefix: string) => `${prefix}-${Date.now().toString(36)}${(seq++).toString(36)}`

function readinessOf(docs: CsrDocument[], today: string): CsrReadinessStatus {
  const valid = (d: CsrDocument) => d.status === 'verified' && (!d.validUntil || d.validUntil >= today)
  if (REQUIRED_DOCS.every((type) => docs.some((d) => d.docType === type && valid(d)))) return 'CSR_READY'
  if (docs.some(valid)) return 'CA_VERIFIED'
  return docs.length > 0 ? 'DOCS_UPLOADED' : 'NOT_READY'
}

function refuse(error: string): { ok: false; error: string } {
  toast.danger(error)
  return { ok: false, error }
}

export function createCsrActions(set: Set, get: Get): CsrActions {
  return {
    /* ------------------------------------------------------------- Compliance */
    verifyCsrDocument: (docId, status, comment, actor) => {
      const doc = get().csrDocuments.find((d) => d.id === docId)
      if (!doc) return { ok: false, error: 'Document not found' }

      const block = csrDocVerifyBlock(actor, doc)
      if (block) return refuse(block)
      if (status === 'rejected' && !comment?.trim()) return refuse('Say why the document is rejected.')

      const now = new Date().toISOString()
      const updatedDocs = get().csrDocuments.map((d) =>
        d.id === docId ? { ...d, status, verifiedBy: actor.id, verifiedAt: now, comment: comment ?? d.comment } : d,
      )

      const entity = get().csrEntities.find((e) => e.id === doc.entityId)
      const readiness = readinessOf(updatedDocs.filter((d) => d.entityId === doc.entityId), now.slice(0, 10))

      set((s) => ({
        csrDocuments: updatedDocs,
        csrEntities: s.csrEntities.map((e) => (e.id === doc.entityId ? { ...e, readinessStatus: readiness } : e)),
        audit: [
          audit(actor, `csr_doc_${status}`, 'CsrDocument', docId, { sectorId: entity?.sector, before: doc.status, after: status }),
          ...s.audit,
        ],
      }))

      if (status === 'verified') {
        toast.success(`"${doc.label}" verified. ${entity?.legalName ?? 'Entity'} is now ${readiness.replace('_', ' ')}.`)
      } else {
        toast.info(`"${doc.label}" rejected. The uploader must replace it.`)
      }
      return { ok: true }
    },

    uploadCsrDocument: (input, actor) => {
      const id = newId('csr-doc')
      const newDoc: CsrDocument = {
        ...input,
        id,
        uploadedBy: actor.id,
        uploadedAt: new Date().toISOString(),
        status: 'pending',
      }
      const entity = get().csrEntities.find((e) => e.id === input.entityId)

      set((s) => ({
        csrDocuments: [newDoc, ...s.csrDocuments],
        csrEntities: s.csrEntities.map((ent) =>
          ent.id === input.entityId && ent.readinessStatus === 'NOT_READY'
            ? { ...ent, readinessStatus: 'DOCS_UPLOADED' as const }
            : ent,
        ),
        audit: [audit(actor, 'csr_doc_uploaded', 'CsrDocument', id, { sectorId: entity?.sector, after: input.label }), ...s.audit],
      }))

      toast.success(`Uploaded "${input.label}". Waiting for the CA to verify it.`)
      return { ok: true, id }
    },

    /* ------------------------------------------------------------- Projects */
    createCsrProject: (input, actor) => {
      const hasUncheckedRitual = input.budgetLines.some(
        (line) => (line.category === 'POOJA' || line.category === 'FESTIVAL') && !line.blockedForCsr,
      )
      if (hasUncheckedRitual) {
        return refuse(
          'Religious and ritual ceremonies cannot be funded via CSR under MCA Schedule VII rules. Please mark them as blocked or remove them.',
        )
      }

      const id = newId('csr-prj')
      const newPrj: CsrProject = {
        ...input,
        id,
        status: 'SUBMITTED',
        createdBy: actor.id,
        createdAt: new Date().toISOString(),
      }
      const entity = get().csrEntities.find((e) => e.id === input.entityId)

      set((s) => ({
        csrProjects: [newPrj, ...s.csrProjects],
        audit: [audit(actor, 'csr_project_created', 'CsrProject', id, { sectorId: entity?.sector, after: input.title }), ...s.audit],
      }))

      toast.success(`CSR project "${input.title}" submitted. A Trustee must approve it.`)
      return { ok: true, id }
    },

    decideCsrProject: (projectId, decision, actor, comment) => {
      const project = get().csrProjects.find((p) => p.id === projectId)
      if (!project) return { ok: false, error: 'Project not found' }

      const block = csrProjectDecideBlock(actor, project)
      if (block) return refuse(block)

      const newStatus: CsrProjectStatus = decision === 'approved' ? 'OPEN_FOR_FUNDING' : 'DRAFT'
      const entity = get().csrEntities.find((e) => e.id === project.entityId)

      set((s) => ({
        csrProjects: s.csrProjects.map((p) =>
          p.id === projectId ? { ...p, status: newStatus, approvedBy: actor.id, approvedAt: new Date().toISOString() } : p,
        ),
        audit: [
          audit(actor, `csr_project_${decision}`, 'CsrProject', projectId, {
            sectorId: entity?.sector,
            before: project.status,
            after: newStatus,
          }),
          ...s.audit,
        ],
      }))

      if (decision === 'approved') {
        toast.success(`"${project.title}" approved. It can now be pitched to companies.`)
      } else {
        toast.info(`"${project.title}" returned for revision.${comment ? ` (${comment})` : ''}`)
      }
      return { ok: true }
    },

    /* ------------------------------------------------------------- Companies & Deals */
    createCsrCompany: (input, actor) => {
      const id = newId('csr-cmp')
      set((s) => ({
        csrCompanies: [...s.csrCompanies, { ...input, id }],
        audit: [audit(actor, 'csr_company_added', 'CsrCompany', id, { after: input.name }), ...s.audit],
      }))
      toast.success(`Added corporate partner "${input.name}".`)
      return { ok: true, id }
    },

    createCsrDeal: (input, actor) => {
      if (input.adminCapPct > 5.0) {
        return refuse(
          `Administrative overhead is ${input.adminCapPct}%, exceeding the statutory 5.0% cap under Section 135(5).`,
        )
      }

      const project = get().csrProjects.find((p) => p.id === input.projectId)
      const entity = get().csrEntities.find((e) => e.id === project?.entityId)
      const pitch = csrPitchBlock(project, entity)
      if (pitch) return refuse(pitch)

      if (input.fundId) {
        const fund = get().funds.find((f) => f.id === input.fundId)
        if (!fund || fund.csrProjectId !== input.projectId) {
          return refuse('That fund belongs to another CSR project. Each deal uses its own project CSR fund.')
        }
      }

      const id = newId('csr-deal')
      const newDeal: CsrDeal = {
        ...input,
        id,
        status: 'MOU_DRAFT',
        approvals: [],
        createdAt: new Date().toISOString(),
        tranches: input.tranches.map((t) => ({ ...t, dealId: id })),
      }

      set((s) => ({
        csrDeals: [newDeal, ...s.csrDeals],
        audit: [
          audit(actor, 'csr_deal_created', 'CsrDeal', id, {
            sectorId: entity?.sector,
            after: `${formatMoney(input.committedAmount)} grant proposal`,
          }),
          ...s.audit,
        ],
      }))

      toast.success('MoU drafted. It needs signatures from the CA Partner and a Trustee.')
      return { ok: true, id }
    },

    updateCsrDealStatus: (dealId, status, actor, lostReason) => {
      const deal = get().csrDeals.find((d) => d.id === dealId)
      if (!deal) return { ok: false, error: 'Deal not found' }

      set((s) => ({
        csrDeals: s.csrDeals.map((d) => (d.id === dealId ? { ...d, status, lostReason: lostReason ?? d.lostReason } : d)),
        audit: [audit(actor, 'csr_deal_status_changed', 'CsrDeal', dealId, { before: deal.status, after: status }), ...s.audit],
      }))

      toast.info(`Deal status updated to ${status}.`)
      return { ok: true }
    },

    decideCsrMoU: (dealId, decision, actor, comment) => {
      const state = get()
      const deal = state.csrDeals.find((d) => d.id === dealId)
      if (!deal) return { ok: false, error: 'Deal not found' }

      const block = csrMouDecideBlock(actor, deal)
      if (block) return refuse(block)
      if (decision === 'rejected' && !comment?.trim()) return refuse('Say what must change in the MoU.')

      const now = new Date().toISOString()
      const project = state.csrProjects.find((p) => p.id === deal.projectId)
      const entity = state.csrEntities.find((e) => e.id === project?.entityId)

      // A rejection sends the draft back to its owner; both signatures start again.
      if (decision === 'rejected') {
        set((s) => ({
          csrDeals: s.csrDeals.map((d) => (d.id === dealId ? { ...d, approvals: [] } : d)),
          audit: [
            audit(actor, 'csr_mou_rejected', 'CsrDeal', dealId, { sectorId: entity?.sector, before: deal.status, after: `MOU_DRAFT: ${comment}` }),
            ...s.audit,
          ],
        }))
        toast.info(`MoU sent back to its owner: ${comment}`)
        return { ok: true }
      }

      const approvals = [
        ...deal.approvals.filter((a) => a.role !== actor.role),
        { role: actor.role, userId: actor.id, decision: 'approved' as const, at: now, comment },
      ]
      const signed =
        approvals.some((a) => a.role === 'ca_partner' && a.decision === 'approved') &&
        approvals.some((a) => a.role === 'trustee' && a.decision === 'approved')

      if (!signed) {
        set((s) => ({
          csrDeals: s.csrDeals.map((d) => (d.id === dealId ? { ...d, approvals } : d)),
          audit: [
            audit(actor, 'csr_mou_approved', 'CsrDeal', dealId, { sectorId: entity?.sector, before: 'MOU_DRAFT', after: `signed by ${actor.role}` }),
            ...s.audit,
          ],
        }))
        toast.success(`${actor.role === 'trustee' ? 'Trustee' : 'CA Partner'} signed. Waiting for the ${actor.role === 'trustee' ? 'CA Partner' : 'Trustee'}.`)
        return { ok: true }
      }

      // Both signatures: the deal goes live with its own restricted fund and project budget.
      const company = state.csrCompanies.find((c) => c.id === deal.companyId)
      const sectorId = entity?.sector ?? 'sevalaya'
      const existingFund = state.funds.find((f) => f.id === deal.fundId && f.csrProjectId === deal.projectId)
      const fund: Fund = existingFund ?? {
        id: `fund-csr-${deal.id}`,
        sectorId,
        name: `${company?.name ?? 'Company'} CSR · ${project?.title ?? 'Project'}`,
        type: 'restricted',
        csrProjectId: deal.projectId,
        balance: 0,
      }
      const existingHead = state.budgets.find((b) => b.fundId === fund.id && b.csrProjectId === deal.projectId)
      const head: BudgetHead = existingHead ?? {
        id: `bh-csr-${deal.id}`,
        sectorId: fund.sectorId,
        name: `CSR · ${project?.title ?? 'Project'}`,
        period: `FY ${new Date().getFullYear()}`,
        fundId: fund.id,
        allocated: 0,
        committed: 0,
        spent: 0,
        csrProjectId: deal.projectId,
      }

      set((s) => ({
        csrDeals: s.csrDeals.map((d) =>
          d.id === dealId ? { ...d, approvals, status: 'ACTIVE', fundId: fund.id, mouSignedOn: now.slice(0, 10) } : d,
        ),
        csrProjects: s.csrProjects.map((p) =>
          p.id === deal.projectId && p.status === 'OPEN_FOR_FUNDING' ? { ...p, status: 'FUNDED' } : p,
        ),
        funds: existingFund ? s.funds : [...s.funds, fund],
        budgets: existingHead ? s.budgets : [...s.budgets, head],
        audit: [
          audit(actor, 'csr_mou_approved', 'CsrDeal', dealId, { sectorId, before: 'MOU_DRAFT', after: 'ACTIVE' }),
          ...s.audit,
        ],
      }))

      toast.success(`MoU signed by the CA Partner and a Trustee. Tranches now go into ${fund.name}.`)
      return { ok: true }
    },

    /* ------------------------------------------------------------- Tranches & Money */
    receiveCsrTranche: (dealId, trancheId, bankRef, actor) => {
      const state = get()
      const deal = state.csrDeals.find((d) => d.id === dealId)
      if (!deal) return { ok: false, error: 'Deal not found' }
      const tranche = deal.tranches.find((t) => t.id === trancheId)
      if (!tranche) return { ok: false, error: 'Tranche not found' }

      if (!RECEIPT_ROLES.includes(actor.role)) return refuse('Only a Sector Admin or the CA team records a CSR receipt.')
      if (!bankRef.trim()) return refuse('Enter the bank UTR or NEFT reference.')

      const project = state.csrProjects.find((p) => p.id === deal.projectId)
      const entity = state.csrEntities.find((e) => e.id === project?.entityId)
      const block = csrTrancheReceiveBlock(deal, tranche, entity)
      if (block) return refuse(block)

      const now = new Date().toISOString()
      const closed = closedPeriodError(state.periodCloses, now)
      if (closed) return refuse(closed)

      const fund = state.funds.find((f) => f.id === deal.fundId)
      if (!fund) return refuse('This deal has no CSR fund yet.')

      set((s) => ({
        csrDeals: s.csrDeals.map((d) =>
          d.id === dealId
            ? {
                ...d,
                tranches: d.tranches.map((t) =>
                  t.id === trancheId ? { ...t, status: 'RECEIVED' as const, receivedOn: now.slice(0, 10), bankRef } : t,
                ),
              }
            : d,
        ),
        csrProjects: s.csrProjects.map((p) =>
          p.id === deal.projectId && (p.status === 'OPEN_FOR_FUNDING' || p.status === 'FUNDED') ? { ...p, status: 'IN_PROGRESS' } : p,
        ),
        funds: s.funds.map((f) => (f.id === fund.id ? { ...f, balance: f.balance + tranche.amount } : f)),
        journal: [
          journalEntry(
            `je-csr-${tranche.id}`,
            now,
            fund.sectorId,
            `CSR grant received — Tranche #${tranche.seqNo} (${bankRef})`,
            [
              { account: 'Bank', fundId: fund.id, debit: tranche.amount, credit: 0 },
              { account: 'CSR grant income', fundId: fund.id, debit: 0, credit: tranche.amount },
            ],
            tranche.id,
          ),
          ...s.journal,
        ],
        audit: [
          audit(actor, 'csr_tranche_received', 'CsrTranche', trancheId, {
            sectorId: fund.sectorId,
            before: tranche.status,
            after: `Received ${formatMoney(tranche.amount)} via ${bankRef}`,
          }),
          ...s.audit,
        ],
      }))

      toast.success(`${formatMoney(tranche.amount)} received into ${fund.name} and posted to the ledger.`)
      return { ok: true }
    },

    /* ------------------------------------------------------------- UCs & Reports */
    createCsrUc: (input, actor) => {
      const deal = get().csrDeals.find((d) => d.id === input.dealId)
      const tranche = deal?.tranches.find((t) => t.id === input.trancheId)
      if (!deal || !tranche) return refuse('Pick a deal and a tranche.')
      if (!RECEIVED_TRANCHE.includes(tranche.status)) return refuse(`Tranche #${tranche.seqNo} has not been received yet.`)
      if (get().csrUtilisationCertificates.some((u) => u.trancheId === tranche.id)) {
        return refuse(`Tranche #${tranche.seqNo} already has a Utilisation Certificate.`)
      }
      if (input.amountUtilised > input.amountReceived) return refuse('Utilised cannot be more than received.')

      const id = newId('csr-uc')
      const newUc: CsrUtilisationCertificate = {
        ...input,
        trancheSeq: tranche.seqNo,
        id,
        status: 'draft',
        preparedBy: actor.id,
        preparedAt: new Date().toISOString(),
      }

      set((s) => ({
        csrUtilisationCertificates: [newUc, ...s.csrUtilisationCertificates],
        csrDeals: s.csrDeals.map((d) =>
          d.id === deal.id
            ? { ...d, tranches: d.tranches.map((t) => (t.id === tranche.id ? { ...t, status: 'UTILISED' as const } : t)) }
            : d,
        ),
        audit: [
          audit(actor, 'csr_uc_prepared', 'CsrUtilisationCertificate', id, {
            after: `Tranche #${tranche.seqNo} (${formatMoney(input.amountUtilised)} utilised)`,
          }),
          ...s.audit,
        ],
      }))

      toast.info('Utilisation Certificate drafted. A different CA must sign it with a UDIN.')
      return { ok: true, id }
    },

    signCsrUc: (ucId, caUdin, caMembershipNo, actor) => {
      const uc = get().csrUtilisationCertificates.find((u) => u.id === ucId)
      if (!uc) return { ok: false, error: 'Certificate not found' }

      const block = csrUcSignBlock(actor, uc)
      if (block) return refuse(block)

      const udin = caUdin.trim().toUpperCase()
      if (!UDIN_PATTERN.test(udin)) return refuse('Enter the 18-character ICAI UDIN (digits and capital letters).')
      if (!caMembershipNo.trim()) return refuse('Enter the CA membership number.')

      const now = new Date().toISOString()
      set((s) => ({
        csrUtilisationCertificates: s.csrUtilisationCertificates.map((u) =>
          u.id === ucId
            ? { ...u, status: 'signed' as const, caSignedBy: actor.id, caMembershipNo: caMembershipNo.trim(), caUdin: udin, signedAt: now }
            : u,
        ),
        csrDeals: s.csrDeals.map((d) =>
          d.id === uc.dealId
            ? { ...d, tranches: d.tranches.map((t) => (t.id === uc.trancheId ? { ...t, status: 'UC_SIGNED' as const, ucId: uc.id } : t)) }
            : d,
        ),
        audit: [audit(actor, 'csr_uc_signed', 'CsrUtilisationCertificate', ucId, { before: 'draft', after: `UDIN ${udin}` }), ...s.audit],
      }))

      toast.success(`Utilisation Certificate for Tranche #${uc.trancheSeq} signed (UDIN ${udin}). The next tranche can now come in.`)
      return { ok: true }
    },

    addCsrProgressUpdate: (input, actor) => {
      const id = newId('csr-prog')
      set((s) => ({
        csrProgressUpdates: [{ ...input, id, createdAt: new Date().toISOString(), createdBy: actor.id }, ...s.csrProgressUpdates],
        audit: [audit(actor, 'csr_progress_added', 'CsrProgressUpdate', id, { after: `${input.beneficiariesReached} beneficiaries` }), ...s.audit],
      }))

      toast.success('Progress update logged for the company report.')
      return { ok: true, id }
    },
  }
}
