import type { StoreApi } from 'zustand'

import { formatMoney } from '@/lib/format'
import { toast } from '@/lib/toast'
import type {
  CsrCompany,
  CsrDeal,
  CsrDealStatus,
  CsrDocument,
  CsrProject,
  CsrProjectStatus,
  CsrProgressUpdate,
  CsrUtilisationCertificate,
  User,
} from '@/types'
import { audit, type DbState } from './db'

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

export function createCsrActions(set: Set, get: Get): CsrActions {
  return {
    /* ------------------------------------------------------------- Compliance */
    verifyCsrDocument: (docId, status, comment, actor) => {
      const allowedRoles = ['ca_partner', 'ca_staff', 'trustee', 'super_admin']
      if (!allowedRoles.includes(actor.role)) {
        const error = 'Only CA or Trustees can verify compliance documents.'
        toast.danger(error)
        return { ok: false, error }
      }

      const doc = get().csrDocuments.find((d) => d.id === docId)
      if (!doc) {
        return { ok: false, error: 'Document not found' }
      }

      const now = new Date().toISOString()
      const updatedDocs = get().csrDocuments.map((d) => {
        if (d.id !== docId) return d
        return {
          ...d,
          status,
          verifiedBy: actor.id,
          verifiedAt: now,
          comment: comment ?? d.comment,
        }
      })

      // Recalculate entity readiness status
      const entityId = doc.entityId
      const entityDocs = updatedDocs.filter((d) => d.entityId === entityId)
      const hasReg = entityDocs.some((d) => d.docType === 'REG_CERT' && d.status === 'verified')
      const hasRnpo = entityDocs.some((d) => d.docType === 'RNPO_332' && d.status === 'verified')
      const hasApproval = entityDocs.some((d) => d.docType === 'APPROVAL_354' && d.status === 'verified')
      const hasCsr1 = entityDocs.some((d) => d.docType === 'CSR1' && d.status === 'verified')
      const hasAudited = entityDocs.some((d) => d.docType === 'AUDITED_ACCOUNTS' && d.status === 'verified')

      const isCsrReady = hasReg && hasRnpo && hasApproval && hasCsr1 && hasAudited

      const updatedEntities = get().csrEntities.map((ent) => {
        if (ent.id !== entityId) return ent
        return {
          ...ent,
          readinessStatus: isCsrReady ? ('CSR_READY' as const) : ('CA_VERIFIED' as const),
        }
      })

      const aud = audit(actor, `csr_doc_${status}`, 'CsrDocument', docId, {
        before: doc.status,
        after: status,
      })

      set((s) => ({
        csrDocuments: updatedDocs,
        csrEntities: updatedEntities,
        audit: [aud, ...s.audit],
      }))

      if (status === 'verified') {
        toast.success(`Document "${doc.label}" verified successfully.`)
      } else {
        toast.info(`Document "${doc.label}" was rejected.`)
      }

      return { ok: true }
    },

    uploadCsrDocument: (input, actor) => {
      const id = `csr-doc-${Date.now()}`
      const newDoc: CsrDocument = {
        ...input,
        id,
        uploadedBy: actor.id,
        uploadedAt: new Date().toISOString(),
        status: 'pending',
      }

      const updatedEntities = get().csrEntities.map((ent) => {
        if (ent.id !== input.entityId) return ent
        if (ent.readinessStatus === 'NOT_READY') {
          return { ...ent, readinessStatus: 'DOCS_UPLOADED' as const }
        }
        return ent
      })

      const aud = audit(actor, 'csr_doc_uploaded', 'CsrDocument', id, {
        after: input.label,
      })

      set((s) => ({
        csrDocuments: [newDoc, ...s.csrDocuments],
        csrEntities: updatedEntities,
        audit: [aud, ...s.audit],
      }))

      toast.success(`Uploaded "${input.label}" to Compliance Vault.`)
      return { ok: true, id }
    },

    /* ------------------------------------------------------------- Projects */
    createCsrProject: (input, actor) => {
      // Validate pooja / ritual block rule
      const hasUncheckedRitual = input.budgetLines.some(
        (line) => (line.category === 'POOJA' || line.category === 'FESTIVAL') && !line.blockedForCsr,
      )
      if (hasUncheckedRitual) {
        const error =
          'Religious and ritual ceremonies cannot be funded via CSR under MCA Schedule VII rules. Please mark them as blocked or remove them.'
        toast.danger(error)
        return { ok: false, error }
      }

      const id = `csr-prj-${Date.now()}`
      const newPrj: CsrProject = {
        ...input,
        id,
        status: 'SUBMITTED',
        createdBy: actor.id,
        createdAt: new Date().toISOString(),
      }

      const aud = audit(actor, 'csr_project_created', 'CsrProject', id, {
        after: input.title,
      })

      set((s) => ({
        csrProjects: [newPrj, ...s.csrProjects],
        audit: [aud, ...s.audit],
      }))

      toast.success(`CSR Project "${input.title}" submitted for Trustee approval.`)
      return { ok: true, id }
    },

    decideCsrProject: (projectId, decision, actor, comment) => {
      const allowedRoles = ['trustee', 'ca_partner', 'super_admin']
      if (!allowedRoles.includes(actor.role)) {
        const error = 'Only Trustees or CA Partners can approve CSR Projects.'
        toast.danger(error)
        return { ok: false, error }
      }

      const project = get().csrProjects.find((p) => p.id === projectId)
      if (!project) return { ok: false, error: 'Project not found' }

      const newStatus: CsrProjectStatus = decision === 'approved' ? 'OPEN_FOR_FUNDING' : 'DRAFT'
      const updatedProjects: CsrProject[] = get().csrProjects.map((p) => {
        if (p.id !== projectId) return p
        return {
          ...p,
          status: newStatus,
          approvedBy: actor.id,
          approvedAt: new Date().toISOString(),
        }
      })

      const aud = audit(actor, `csr_project_${decision}`, 'CsrProject', projectId, {
        before: project.status,
        after: newStatus,
      })

      set((s) => ({
        csrProjects: updatedProjects,
        audit: [aud, ...s.audit],
      }))

      if (decision === 'approved') {
        toast.success(`Project "${project.title}" approved and opened for CSR proposals.`)
      } else {
        toast.info(`Project "${project.title}" returned for revision.${comment ? ` (${comment})` : ''}`)
      }

      return { ok: true }
    },

    /* ------------------------------------------------------------- Companies & Deals */
    createCsrCompany: (input, actor) => {
      const id = `csr-cmp-${Date.now()}`
      const newCompany: CsrCompany = {
        ...input,
        id,
      }

      const aud = audit(actor, 'csr_company_added', 'CsrCompany', id, {
        after: input.name,
      })

      set((s) => ({
        csrCompanies: [...s.csrCompanies, newCompany],
        audit: [aud, ...s.audit],
      }))

      toast.success(`Added corporate partner "${input.name}".`)
      return { ok: true, id }
    },

    createCsrDeal: (input, actor) => {
      // 5% Admin overhead cap rule
      if (input.adminCapPct > 5.0) {
        const error = `Administrative overhead is ${input.adminCapPct}%, exceeding the statutory 5.0% cap under Section 135(5).`
        toast.danger(error)
        return { ok: false, error }
      }

      const id = `csr-deal-${Date.now()}`
      const newDeal: CsrDeal = {
        ...input,
        id,
        status: 'MOU_DRAFT',
        approvals: [],
      }

      const aud = audit(actor, 'csr_deal_created', 'CsrDeal', id, {
        after: `${formatMoney(input.committedAmount)} grant proposal`,
      })

      set((s) => ({
        csrDeals: [newDeal, ...s.csrDeals],
        audit: [aud, ...s.audit],
      }))

      toast.success('MoU proposal drafted. Ready for CA & Trustee review.')
      return { ok: true, id }
    },

    updateCsrDealStatus: (dealId, status, actor, lostReason) => {
      const deal = get().csrDeals.find((d) => d.id === dealId)
      if (!deal) return { ok: false, error: 'Deal not found' }

      const updatedDeals = get().csrDeals.map((d) => {
        if (d.id !== dealId) return d
        return {
          ...d,
          status,
          lostReason: lostReason ?? d.lostReason,
        }
      })

      const aud = audit(actor, 'csr_deal_status_changed', 'CsrDeal', dealId, {
        before: deal.status,
        after: status,
      })

      set((s) => ({
        csrDeals: updatedDeals,
        audit: [aud, ...s.audit],
      }))

      toast.info(`Deal status updated to ${status}.`)
      return { ok: true }
    },

    decideCsrMoU: (dealId, decision, actor, comment) => {
      const allowedRoles = ['ca_partner', 'trustee', 'super_admin']
      if (!allowedRoles.includes(actor.role)) {
        const error = 'Only CA Partners and Trustees can review and sanction CSR MoUs.'
        toast.danger(error)
        return { ok: false, error }
      }

      const deal = get().csrDeals.find((d) => d.id === dealId)
      if (!deal) return { ok: false, error: 'Deal not found' }

      const now = new Date().toISOString()
      const newStep = {
        role: actor.role,
        userId: actor.id,
        decision,
        at: now,
        comment,
      }

      const otherSteps = deal.approvals.filter((a) => a.role !== actor.role)
      const nextApprovals = [...otherSteps, newStep]

      // Check if both CA and Trustee approved
      const caApproved = nextApprovals.some((a) => a.role === 'ca_partner' && a.decision === 'approved')
      const trusteeApproved = nextApprovals.some((a) => a.role === 'trustee' && a.decision === 'approved')
      const anyRejected = nextApprovals.some((a) => a.decision === 'rejected')

      let nextStatus = deal.status
      if (anyRejected) {
        nextStatus = 'MOU_DRAFT'
      } else if (caApproved && trusteeApproved) {
        nextStatus = 'ACTIVE' // Sanctioned and active for disbursements
      }

      const updatedDeals = get().csrDeals.map((d) => {
        if (d.id !== dealId) return d
        return {
          ...d,
          approvals: nextApprovals,
          status: nextStatus,
          mouSignedOn: nextStatus === 'ACTIVE' ? now.slice(0, 10) : d.mouSignedOn,
        }
      })

      const aud = audit(actor, `csr_mou_${decision}`, 'CsrDeal', dealId, {
        before: deal.status,
        after: nextStatus,
      })

      set((s) => ({
        csrDeals: updatedDeals,
        audit: [aud, ...s.audit],
      }))

      if (nextStatus === 'ACTIVE') {
        toast.success('Dual approval complete! MoU is fully executed and ready for fund disbursements.')
      } else {
        toast.success(`${actor.role === 'trustee' ? 'Trustee' : 'CA Partner'} recorded approval for MoU.`)
      }

      return { ok: true }
    },

    /* ------------------------------------------------------------- Tranches & Money */
    receiveCsrTranche: (dealId, trancheId, bankRef, actor) => {
      const deal = get().csrDeals.find((d) => d.id === dealId)
      if (!deal) return { ok: false, error: 'Deal not found' }

      const trancheIndex = deal.tranches.findIndex((t) => t.id === trancheId)
      if (trancheIndex === -1) return { ok: false, error: 'Tranche not found' }

      const targetTranche = deal.tranches[trancheIndex]

      // Hard gate: Tranche N+1 requires previous tranche's UC to be signed
      if (targetTranche.seqNo > 1) {
        const prevTranche = deal.tranches.find((t) => t.seqNo === targetTranche.seqNo - 1)
        if (prevTranche && prevTranche.status !== 'UTILISED' && prevTranche.status !== 'UC_SIGNED') {
          const error = `Cannot disburse Tranche #${targetTranche.seqNo}: Tranche #${prevTranche.seqNo} Utilisation Certificate is not signed.`
          toast.danger(error)
          return { ok: false, error }
        }
      }

      const today = new Date().toISOString().slice(0, 10)
      const updatedTranches = deal.tranches.map((t) => {
        if (t.id !== trancheId) return t
        return {
          ...t,
          status: 'RECEIVED' as const,
          receivedOn: today,
          bankRef,
        }
      })

      const updatedDeals = get().csrDeals.map((d) => {
        if (d.id !== dealId) return d
        return {
          ...d,
          tranches: updatedTranches,
        }
      })

      // Credit the dedicated restricted CSR fund
      let updatedFunds = get().funds
      if (deal.fundId) {
        updatedFunds = get().funds.map((f) => {
          if (f.id !== deal.fundId) return f
          return {
            ...f,
            balance: f.balance + targetTranche.amount,
          }
        })
      }

      const aud = audit(actor, 'csr_tranche_received', 'CsrTranche', trancheId, {
        after: `Received ${formatMoney(targetTranche.amount)} via ${bankRef}`,
      })

      set((s) => ({
        csrDeals: updatedDeals,
        funds: updatedFunds,
        audit: [aud, ...s.audit],
      }))

      toast.success(`Disbursement of ${formatMoney(targetTranche.amount)} received into dedicated CSR fund.`)

      return { ok: true }
    },

    /* ------------------------------------------------------------- UCs & Reports */
    createCsrUc: (input, actor) => {
      const id = `csr-uc-${Date.now()}`
      const newUc: CsrUtilisationCertificate = {
        ...input,
        id,
        status: 'draft',
        preparedBy: actor.id,
        preparedAt: new Date().toISOString(),
      }

      const aud = audit(actor, 'csr_uc_prepared', 'CsrUtilisationCertificate', id, {
        after: `Tranche #${input.trancheSeq} (${formatMoney(input.amountUtilised)} utilised)`,
      })

      set((s) => ({
        csrUtilisationCertificates: [newUc, ...s.csrUtilisationCertificates],
        audit: [aud, ...s.audit],
      }))

      toast.info('Utilisation Certificate drafted. Awaiting CA UDIN signature.')
      return { ok: true, id }
    },

    signCsrUc: (ucId, caUdin, caMembershipNo, actor) => {
      const allowedRoles = ['ca_partner', 'ca_staff', 'super_admin']
      if (!allowedRoles.includes(actor.role)) {
        const error = 'Only a Chartered Accountant can issue and sign a statutory Utilisation Certificate.'
        toast.danger(error)
        return { ok: false, error }
      }

      if (!caUdin || caUdin.trim().length < 8) {
        const error = 'A valid 18-character ICAI Unique Document Identification Number (UDIN) is required.'
        toast.danger(error)
        return { ok: false, error }
      }

      const uc = get().csrUtilisationCertificates.find((u) => u.id === ucId)
      if (!uc) return { ok: false, error: 'Certificate not found' }

      const now = new Date().toISOString()
      const updatedUcs = get().csrUtilisationCertificates.map((u) => {
        if (u.id !== ucId) return u
        return {
          ...u,
          status: 'signed' as const,
          caSignedBy: actor.id,
          caMembershipNo,
          caUdin: caUdin.trim().toUpperCase(),
          signedAt: now,
        }
      })

      // Mark tranche as UC_SIGNED
      const updatedDeals = get().csrDeals.map((d) => {
        if (d.id !== uc.dealId) return d
        return {
          ...d,
          tranches: d.tranches.map((t) => {
            if (t.id !== uc.trancheId) return t
            return {
              ...t,
              status: 'UC_SIGNED' as const,
              ucId: uc.id,
            }
          }),
        }
      })

      const aud = audit(actor, 'csr_uc_signed', 'CsrUtilisationCertificate', ucId, {
        after: `UDIN: ${caUdin.toUpperCase()}`,
      })

      set((s) => ({
        csrUtilisationCertificates: updatedUcs,
        csrDeals: updatedDeals,
        audit: [aud, ...s.audit],
      }))

      toast.success(`Utilisation Certificate signed with UDIN ${caUdin.toUpperCase()}. Tranche audit complete.`)

      return { ok: true }
    },

    addCsrProgressUpdate: (input, actor) => {
      const id = `csr-prog-${Date.now()}`
      const newUpdate: CsrProgressUpdate = {
        ...input,
        id,
        createdAt: new Date().toISOString(),
        createdBy: actor.id,
      }

      const aud = audit(actor, 'csr_progress_added', 'CsrProgressUpdate', id, {
        after: `${input.beneficiariesReached} beneficiaries`,
      })

      set((s) => ({
        csrProgressUpdates: [newUpdate, ...s.csrProgressUpdates],
        audit: [aud, ...s.audit],
      }))

      toast.success('Photo progress milestone logged and added to corporate report.')
      return { ok: true, id }
    },
  }
}
