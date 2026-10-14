import type {
  BudgetHead,
  CsrDeal,
  CsrDocument,
  CsrEntity,
  CsrProject,
  CsrTranche,
  CsrUtilisationCertificate,
  Fund,
  Role,
  User,
} from '@/types'

/*
 * Pure CSR checks. The store actions, the CSR pages and the approvals inbox all
 * ask these same functions, so a button is disabled for exactly the reason the
 * action would refuse. Each returns null when the person may act.
 */

export const MAKER_CHECKER = 'You prepared this. Another approver must review it.'

const CA_ROLES: Role[] = ['ca_staff', 'ca_partner']
const MOU_SIGNERS: Role[] = ['ca_partner', 'trustee']

/** Project statuses a company may be pitched for and fund. */
export const FUNDABLE_PROJECT: CsrProject['status'][] = ['OPEN_FOR_FUNDING', 'FUNDED', 'IN_PROGRESS']

/** Tranche statuses that mean the money has arrived. */
export const RECEIVED_TRANCHE: CsrTranche['status'][] = ['RECEIVED', 'UTILISED', 'UC_SIGNED']

/** ICAI UDIN: 18 characters, digits and capital letters. */
export const UDIN_PATTERN = /^[0-9A-Z]{18}$/

/** Step 1 gate: the CA checks the papers, and never their own upload. */
export function csrDocVerifyBlock(user: User, doc: CsrDocument): string | null {
  if (!CA_ROLES.includes(user.role)) return 'Only the CA team verifies compliance documents.'
  if (doc.status === 'verified' || doc.status === 'rejected') return 'This document has already been reviewed.'
  if (doc.uploadedBy === user.id) return MAKER_CHECKER
  return null
}

/** Step 2 gate: Trustees approve a project someone else prepared. */
export function csrProjectDecideBlock(user: User, project: CsrProject): string | null {
  if (user.role !== 'trustee') return 'Only a Trustee approves a CSR project.'
  if (project.status !== 'SUBMITTED') return 'This project is not waiting for approval.'
  if (project.createdBy === user.id) return MAKER_CHECKER
  return null
}

/** Why an entity cannot take CSR money yet, or null when it is CSR_READY. */
export function csrEntityBlock(entity: CsrEntity | undefined): string | null {
  if (!entity) return 'This project has no implementing agency.'
  if (entity.readinessStatus !== 'CSR_READY') {
    return `${entity.legalName} is not CSR-ready. The CA must verify its CSR-1, tax registration and audited accounts first.`
  }
  return null
}

/** Step 3 gate: only a Trustee-approved project of a CSR-ready entity can be pitched. */
export function csrPitchBlock(project: CsrProject | undefined, entity: CsrEntity | undefined): string | null {
  if (!project) return 'Pick a CSR project.'
  if (!FUNDABLE_PROJECT.includes(project.status)) return `"${project.title}" has not been approved by the Trustees yet.`
  return csrEntityBlock(entity)
}

/** Step 4 gate: the CA Partner and a Trustee each sign once, never the deal owner. */
export function csrMouDecideBlock(user: User, deal: CsrDeal): string | null {
  if (!MOU_SIGNERS.includes(user.role)) return 'Only a CA Partner and a Trustee sign a CSR MoU.'
  if (deal.status !== 'MOU_DRAFT') return 'This MoU is not waiting for signatures.'
  if (deal.ownerId === user.id) return MAKER_CHECKER
  if (deal.approvals.some((a) => a.role === user.role && a.decision === 'approved')) {
    return `The ${user.role === 'trustee' ? 'Trustee' : 'CA Partner'} has already signed this MoU.`
  }
  return null
}

/** Step 5 gate: money only arrives on a signed MoU, into its own fund, one instalment after the last UC. */
export function csrTrancheReceiveBlock(
  deal: CsrDeal,
  tranche: CsrTranche,
  entity: CsrEntity | undefined,
): string | null {
  if (deal.status !== 'ACTIVE') return 'The MoU must be signed by the CA Partner and a Trustee first.'
  if (!deal.fundId) return 'This deal has no CSR fund yet.'
  if (RECEIVED_TRANCHE.includes(tranche.status)) return `Tranche #${tranche.seqNo} has already been received.`
  const prev = deal.tranches.find((t) => t.seqNo === tranche.seqNo - 1)
  if (prev && prev.status !== 'UC_SIGNED') {
    return `Tranche #${prev.seqNo} needs a CA-signed Utilisation Certificate before Tranche #${tranche.seqNo} can come in.`
  }
  return csrEntityBlock(entity)
}

/** Step 6 gate: a CA signs the certificate, and never one they drafted. */
export function csrUcSignBlock(user: User, uc: CsrUtilisationCertificate): string | null {
  if (!CA_ROLES.includes(user.role)) return 'Only a Chartered Accountant signs a Utilisation Certificate.'
  if (uc.status === 'signed') return 'This certificate is already signed.'
  if (uc.preparedBy === user.id) return MAKER_CHECKER
  return null
}

/**
 * CSR money is spent only on its own project. A CSR fund may go only to that
 * project's CSR budget head, and a CSR head takes money only from its project's
 * CSR funds, so pooja or general heads can never draw on it.
 */
export function csrAllotmentBlock(fund: Fund, head: BudgetHead): string | null {
  if (fund.csrProjectId && head.csrProjectId !== fund.csrProjectId) {
    return `${fund.name} is CSR money. It can only be allotted to its own CSR project budget, not ${head.name}.`
  }
  if (head.csrProjectId && fund.csrProjectId !== head.csrProjectId) {
    return `${head.name} is a CSR project budget. Only that project's CSR fund can be allotted to it.`
  }
  return null
}
