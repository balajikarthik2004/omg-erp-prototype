import type { ApprovalStep, Money, SectorId } from './index'

/* ------------------------------------------------------------------ 1. Compliance Vault */

export type CsrEntityType = 'trust' | 'society' | 'section8'

export type CsrReadinessStatus =
  | 'NOT_READY'
  | 'DOCS_UPLOADED'
  | 'CA_VERIFIED'
  | 'CSR_READY'
  | 'EXPIRING_SOON'

export type CsrDocType =
  | 'REG_CERT'
  | 'RNPO_332' // New Income-tax Act 2025 RNPO (legacy 12A/12AB)
  | 'APPROVAL_354' // New Income-tax Act 2025 (legacy 80G)
  | 'CSR1' // Form CSR-1 registration
  | 'AUDITED_ACCOUNTS'
  | 'ITR'
  | 'BOARD_RESOLUTION'
  | 'GOVERNING_BODY'
  | 'DARPAN'
  | 'BANK_PROOF'

export interface CsrEntity {
  id: string
  tenantId?: string
  sector: SectorId
  legalName: string
  entityType: CsrEntityType
  pan: string
  registrationDate: string
  csr1RegNo?: string
  darpanId?: string
  isPartnerNgo?: boolean
  readinessStatus: CsrReadinessStatus
  notes?: string
}

export interface CsrDocument {
  id: string
  entityId: string
  docType: CsrDocType
  label: string
  legacyRef?: string
  docNumber?: string
  financialYear?: string
  issuedOn?: string
  validUntil?: string | null
  filePath: string
  uploadedBy: string
  uploadedAt: string
  verifiedBy?: string
  verifiedAt?: string
  status: 'pending' | 'verified' | 'rejected' | 'expiring'
  comment?: string
}

/* ------------------------------------------------------------------ 2. Schedule VII Config & Projects */

export interface CsrScheduleViiItem {
  code: string
  title: string
  category: string
  examples: string
  active: boolean
}

export type CsrBudgetCategory =
  | 'MATERIALS'
  | 'SALARIES'
  | 'EQUIPMENT'
  | 'CONSTRUCTION'
  | 'ADMIN_OVERHEAD'
  | 'POOJA' // Blocked for CSR
  | 'FESTIVAL' // Blocked for CSR

export interface CsrProjectBudgetLine {
  id: string
  category: CsrBudgetCategory
  description: string
  amount: Money
  isCapital?: boolean
  blockedForCsr?: boolean
}

export type CsrProjectStatus =
  | 'DRAFT'
  | 'SUBMITTED'
  | 'TRUSTEE_APPROVED'
  | 'OPEN_FOR_FUNDING'
  | 'FUNDED'
  | 'IN_PROGRESS'
  | 'COMPLETED'
  | 'CLOSED'

export interface CsrProject {
  id: string
  tenantId?: string
  entityId: string
  title: string
  scheduleViiCode: string
  description: string
  state: string
  district: string
  beneficiaryType: string
  beneficiaryTarget: number
  startDate: string
  endDate: string
  totalBudget: Money
  status: CsrProjectStatus
  createdBy: string
  createdAt: string
  approvedBy?: string
  approvedAt?: string
  budgetLines: CsrProjectBudgetLine[]
}

/* ------------------------------------------------------------------ 3. Companies & Pipeline */

export interface CsrCompany {
  id: string
  name: string
  cin: string
  hqState: string
  focusAreas: string[]
  focusStates: string[]
  avgCsrObligation: number // In ₹ Lakhs
  contactName: string
  contactEmail: string
  contactPhone: string
  notes?: string
}

export type CsrDealStatus =
  | 'LEAD'
  | 'SHORTLISTED'
  | 'PITCHED'
  | 'PROPOSAL_SENT'
  | 'DUE_DILIGENCE'
  | 'MOU_DRAFT'
  | 'MOU_APPROVED'
  | 'MOU_SIGNED'
  | 'ACTIVE'
  | 'COMPLETED'
  | 'LOST'

export type CsrTrancheStatus =
  | 'SCHEDULED'
  | 'CONDITIONS_MET'
  | 'REQUESTED'
  | 'RECEIVED'
  | 'UTILISED'
  | 'UC_SIGNED'

export interface CsrTranche {
  id: string
  dealId: string
  seqNo: number
  amount: Money
  dueDate: string
  conditionText: string
  status: CsrTrancheStatus
  receivedOn?: string
  bankRef?: string
  ucId?: string
}

export interface CsrDeal {
  id: string
  tenantId?: string
  projectId: string
  companyId: string
  status: CsrDealStatus
  committedAmount: Money
  adminCapPct: number // Default 5.0%
  needsImpactAssessment: boolean
  fundId?: string // Dedicated restricted CSR fund in the ledger
  mouSignedOn?: string
  mouFilePath?: string
  ownerId: string
  proposalText?: string
  approvals: ApprovalStep[]
  tranches: CsrTranche[]
  lostReason?: string
}

/* ------------------------------------------------------------------ 4. Reporting & Utilisation Certificates */

export interface CsrProgressUpdate {
  id: string
  projectId: string
  periodStart: string
  periodEnd: string
  beneficiariesReached: number
  narrative: string
  photos: Array<{
    url: string
    caption: string
    consentOk: boolean
    takenAt?: string
  }>
  createdBy: string
  createdAt: string
}

export interface CsrUtilisationCertificate {
  id: string
  dealId: string
  trancheId: string
  trancheSeq: number
  amountReceived: Money
  amountUtilised: Money
  balanceRemaining: Money
  preparedBy: string
  preparedAt: string
  caSignedBy?: string
  caMembershipNo?: string
  caUdin?: string
  signedAt?: string
  status: 'draft' | 'signed'
  narrative?: string
}

/* ------------------------------------------------------------------ 5. CSR State Bundle */

export interface CsrData {
  csrEntities: CsrEntity[]
  csrDocuments: CsrDocument[]
  csrProjects: CsrProject[]
  csrCompanies: CsrCompany[]
  csrDeals: CsrDeal[]
  csrUtilisationCertificates: CsrUtilisationCertificate[]
  csrProgressUpdates: CsrProgressUpdate[]
}

