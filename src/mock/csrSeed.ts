import type {
  CsrCompany,
  CsrDeal,
  CsrDocument,
  CsrEntity,
  CsrProgressUpdate,
  CsrProject,
  CsrScheduleViiItem,
  CsrUtilisationCertificate,
} from '@/types'

/* ------------------------------------------------------------------ 1. Schedule VII Items */

export const CSR_SCHEDULE_VII_ITEMS: CsrScheduleViiItem[] = [
  {
    code: 'i',
    title: 'Hunger, Poverty & Healthcare',
    category: 'Eradicating hunger, poverty, malnutrition, promoting healthcare and sanitation',
    examples: 'Annadhanam feeding centers, medical camps, nutrition kits, dialysis assistance',
    active: true,
  },
  {
    code: 'ii',
    title: 'Education & Vocational Skills',
    category: 'Promoting education, special education, and employment-enhancing vocational skills',
    examples: 'Smart classrooms, scholarships, digital literacy labs, rural student hostel support',
    active: true,
  },
  {
    code: 'iii',
    title: 'Gender Equality & Social Welfare',
    category: 'Promoting gender equality, setting up homes and day care for women and seniors',
    examples: 'Destitute women shelters, senior citizen care homes, orphan assistance programs',
    active: true,
  },
  {
    code: 'iv',
    title: 'Environment & Animal Welfare',
    category: 'Ensuring environmental sustainability, ecological balance, and animal welfare',
    examples: 'Gaushala fodder and medical care, temple tank desilting, native tree afforestation',
    active: true,
  },
  {
    code: 'v',
    title: 'Heritage, Art & Culture',
    category: 'Protection of national heritage, art and culture; restoration of historic structures',
    examples: 'Ancient stone temple mandapam restoration, palm-leaf manuscript preservation, sthapati arts',
    active: true,
  },
]

/* ------------------------------------------------------------------ 2. Entities & Compliance Vault */

export const CSR_ENTITIES: CsrEntity[] = [
  {
    id: 'csr-ent-sevalaya',
    sector: 'sevalaya',
    legalName: 'Sevalaya Social Welfare & Charitable Trust',
    entityType: 'trust',
    pan: 'AAATS9823M',
    registrationDate: '2018-04-12',
    csr1RegNo: 'CSR00028914',
    darpanId: 'TN/2019/0219482',
    isPartnerNgo: false,
    readinessStatus: 'CSR_READY',
    notes: 'Fully compliant implementing agency with active RNPO Sec 332 and Sec 354 tax approvals.',
  },
  {
    id: 'csr-ent-heritage',
    sector: 'temple',
    legalName: 'One Mandir Heritage & Ancient Monument Trust',
    entityType: 'trust',
    pan: 'AAATO4512K',
    registrationDate: '2020-01-15',
    csr1RegNo: 'CSR00041289',
    darpanId: 'TN/2020/0273819',
    isPartnerNgo: false,
    readinessStatus: 'CSR_READY',
    notes: 'Dedicated charitable trust established specifically for heritage restoration under Schedule VII (v).',
  },
  {
    id: 'csr-ent-sangam',
    sector: 'sangam',
    legalName: 'Tamil Sangam Cultural & Educational Foundation',
    entityType: 'society',
    pan: 'AAATS3120Q',
    registrationDate: '2024-06-20',
    darpanId: 'TN/2024/0394810',
    isPartnerNgo: false,
    readinessStatus: 'DOCS_UPLOADED',
    notes: 'Incorporated June 2024. Completing 3-year track record and audited accounts before CSR-1 filing.',
  },
]

export const CSR_DOCUMENTS: CsrDocument[] = [
  {
    id: 'csr-doc-sev-reg',
    entityId: 'csr-ent-sevalaya',
    docType: 'REG_CERT',
    label: 'Trust Deed & Registration Certificate',
    docNumber: 'BK-IV-412/2018',
    issuedOn: '2018-04-12',
    validUntil: null,
    filePath: '/vault/sevalaya-trust-deed.pdf',
    uploadedBy: 'u-adm',
    uploadedAt: '2026-01-10T10:00:00Z',
    verifiedBy: 'u-cas',
    verifiedAt: '2026-01-12T14:30:00Z',
    status: 'verified',
    comment: 'Original registered deed verified with Sub-Registrar seal.',
  },
  {
    id: 'csr-doc-sev-332',
    entityId: 'csr-ent-sevalaya',
    docType: 'RNPO_332',
    label: 'Section 332 RNPO Tax-Exempt Order (Old 12AB)',
    legacyRef: '12AB',
    docNumber: 'ITBA/EXM/RNPO/2026/0129',
    issuedOn: '2026-04-01',
    validUntil: '2031-03-31',
    filePath: '/vault/sevalaya-sec332.pdf',
    uploadedBy: 'u-adm',
    uploadedAt: '2026-04-05T09:00:00Z',
    verifiedBy: 'u-cap',
    verifiedAt: '2026-04-06T11:20:00Z',
    status: 'verified',
    comment: 'Valid 5-year order under Income-tax Act 2025.',
  },
  {
    id: 'csr-doc-sev-354',
    entityId: 'csr-ent-sevalaya',
    docType: 'APPROVAL_354',
    label: 'Section 354 Donor Deduction Approval (Old 80G)',
    legacyRef: '80G',
    docNumber: 'ITBA/EXM/80G/2026/8492',
    issuedOn: '2026-04-01',
    validUntil: '2031-03-31',
    filePath: '/vault/sevalaya-sec354.pdf',
    uploadedBy: 'u-adm',
    uploadedAt: '2026-04-05T09:15:00Z',
    verifiedBy: 'u-cap',
    verifiedAt: '2026-04-06T11:25:00Z',
    status: 'verified',
    comment: 'Donor tax deduction certificate on record.',
  },
  {
    id: 'csr-doc-sev-csr1',
    entityId: 'csr-ent-sevalaya',
    docType: 'CSR1',
    label: 'MCA Form CSR-1 Registration Letter',
    docNumber: 'CSR00028914',
    issuedOn: '2021-06-18',
    validUntil: null,
    filePath: '/vault/sevalaya-csr1-mca.pdf',
    uploadedBy: 'u-adm',
    uploadedAt: '2026-01-10T10:15:00Z',
    verifiedBy: 'u-cas',
    verifiedAt: '2026-01-12T14:40:00Z',
    status: 'verified',
    comment: 'Active on MCA portal with Practicing CA digital signature.',
  },
  {
    id: 'csr-doc-sev-audit',
    entityId: 'csr-ent-sevalaya',
    docType: 'AUDITED_ACCOUNTS',
    label: 'Audited Financial Statements (Last 3 Years Pack)',
    financialYear: '2023-2026',
    issuedOn: '2026-08-25',
    validUntil: null,
    filePath: '/vault/sevalaya-3yr-audited-pack.pdf',
    uploadedBy: 'u-adm',
    uploadedAt: '2026-09-01T11:00:00Z',
    verifiedBy: 'u-cas',
    verifiedAt: '2026-09-02T16:00:00Z',
    status: 'verified',
    comment: 'Clean audit reports without qualifications.',
  },
  {
    id: 'csr-doc-sev-darpan',
    entityId: 'csr-ent-sevalaya',
    docType: 'DARPAN',
    label: 'NITI Aayog NGO Darpan Registration Card',
    docNumber: 'TN/2019/0219482',
    issuedOn: '2019-11-04',
    validUntil: null,
    filePath: '/vault/sevalaya-darpan.pdf',
    uploadedBy: 'u-adm',
    uploadedAt: '2026-01-10T10:30:00Z',
    verifiedBy: 'u-cas',
    verifiedAt: '2026-01-12T14:45:00Z',
    status: 'verified',
  },
  ...heritageDocs(),
  {
    id: 'csr-doc-sgm-reg',
    entityId: 'csr-ent-sangam',
    docType: 'REG_CERT',
    label: 'Society Registration Certificate',
    docNumber: 'SRG-CHN-118/2024',
    issuedOn: '2024-06-20',
    validUntil: null,
    filePath: '/vault/sangam-society-reg.pdf',
    uploadedBy: 'u-adm',
    uploadedAt: '2026-10-08T10:00:00Z',
    status: 'pending',
  },
]

/** The heritage trust's five verified papers, so its CSR_READY status has evidence behind it. */
function heritageDocs(): CsrDocument[] {
  const base = { entityId: 'csr-ent-heritage', uploadedBy: 'u-adm', verifiedBy: 'u-cap', status: 'verified' as const }
  return [
    { ...base, id: 'csr-doc-her-reg', docType: 'REG_CERT', label: 'Heritage Trust Deed & Registration', docNumber: 'BK-IV-077/2020', issuedOn: '2020-01-15', validUntil: null, filePath: '/vault/heritage-deed.pdf', uploadedAt: '2026-02-02T10:00:00Z', verifiedAt: '2026-02-04T12:00:00Z' },
    { ...base, id: 'csr-doc-her-332', docType: 'RNPO_332', legacyRef: '12AB', label: 'Section 332 RNPO Order (Old 12AB)', docNumber: 'ITBA/EXM/RNPO/2026/0211', issuedOn: '2026-04-01', validUntil: '2031-03-31', filePath: '/vault/heritage-sec332.pdf', uploadedAt: '2026-04-08T10:00:00Z', verifiedAt: '2026-04-09T12:00:00Z' },
    { ...base, id: 'csr-doc-her-354', docType: 'APPROVAL_354', legacyRef: '80G', label: 'Section 354 Approval (Old 80G)', docNumber: 'ITBA/EXM/80G/2026/9120', issuedOn: '2026-04-01', validUntil: '2031-03-31', filePath: '/vault/heritage-sec354.pdf', uploadedAt: '2026-04-08T10:10:00Z', verifiedAt: '2026-04-09T12:10:00Z' },
    { ...base, id: 'csr-doc-her-csr1', docType: 'CSR1', label: 'MCA Form CSR-1 Registration Letter', docNumber: 'CSR00041289', issuedOn: '2023-02-10', validUntil: null, filePath: '/vault/heritage-csr1.pdf', uploadedAt: '2026-02-02T10:20:00Z', verifiedAt: '2026-02-04T12:20:00Z' },
    { ...base, id: 'csr-doc-her-audit', docType: 'AUDITED_ACCOUNTS', financialYear: '2023-2026', label: 'Audited Accounts (Last 3 Years)', issuedOn: '2026-08-20', validUntil: null, filePath: '/vault/heritage-audited.pdf', uploadedAt: '2026-08-28T10:00:00Z', verifiedAt: '2026-08-30T12:00:00Z' },
  ]
}

/* ------------------------------------------------------------------ 3. Projects */

export const CSR_PROJECTS: CsrProject[] = [
  {
    id: 'csr-prj-anna',
    entityId: 'csr-ent-sevalaya',
    title: 'Akshaya Annadhanam — Hot Cooked Meals for Destitute Pilgrims & Elderly',
    scheduleViiCode: 'i',
    description:
      'Daily hygienic breakfast and lunch distribution serving 1,200 vulnerable seniors, children, and poor pilgrims at temple town community centers.',
    state: 'Tamil Nadu',
    district: 'Thanjavur',
    beneficiaryType: 'Destitute elderly, school students & rural pilgrims',
    beneficiaryTarget: 1200,
    startDate: '2026-04-01',
    endDate: '2027-03-31',
    totalBudget: 450000000, // ₹45,00,000
    status: 'IN_PROGRESS',
    createdBy: 'u-adm',
    createdAt: '2026-02-15T09:00:00Z',
    approvedBy: 'u-tru',
    approvedAt: '2026-02-20T14:00:00Z',
    budgetLines: [
      {
        id: 'cbl-1',
        category: 'MATERIALS',
        description: 'Rice, pulses, cooking oils, vegetables and dry provisions',
        amount: 280000000,
      },
      {
        id: 'cbl-2',
        category: 'EQUIPMENT',
        description: 'Steam cooking boiler, vegetable cutter and insulated food containers',
        amount: 80000000,
        isCapital: true,
      },
      {
        id: 'cbl-3',
        category: 'SALARIES',
        description: 'Kitchen head cooks, assistants and distribution hygiene staff',
        amount: 68000000,
      },
      {
        id: 'cbl-4',
        category: 'ADMIN_OVERHEAD',
        description: 'Quality audit, logistics, monitoring and documentation (4.8% cap)',
        amount: 22000000,
      },
    ],
  },
  {
    id: 'csr-prj-heritage',
    entityId: 'csr-ent-heritage',
    title: 'Ancient Thousand-Pillar Mandapam & Stucco Art Preservation',
    scheduleViiCode: 'v',
    description:
      'Scientific lime-mortar stabilization, laser cleaning of stone carvings, and traditional sthapati stucco icon restoration under archaeological guidance.',
    state: 'Tamil Nadu',
    district: 'Madurai',
    beneficiaryType: 'Cultural heritage conservation & visiting community',
    beneficiaryTarget: 25000,
    startDate: '2026-07-01',
    endDate: '2027-06-30',
    totalBudget: 600000000, // ₹60,00,000
    status: 'FUNDED',
    createdBy: 'u-adm',
    createdAt: '2026-05-10T11:00:00Z',
    approvedBy: 'u-tru',
    approvedAt: '2026-05-15T16:30:00Z',
    budgetLines: [
      {
        id: 'cbl-h1',
        category: 'MATERIALS',
        description: 'Natural hydraulic lime, jaggery water, river sand and organic pigments',
        amount: 320000000,
      },
      {
        id: 'cbl-h2',
        category: 'SALARIES',
        description: 'Senior Sthapatis, stone artisans and conservation supervisors',
        amount: 200000000,
      },
      {
        id: 'cbl-h3',
        category: 'EQUIPMENT',
        description: 'Laser cleaning apparatus, heavy scaffolding and lighting fixtures',
        amount: 50000000,
        isCapital: true,
      },
      {
        id: 'cbl-h4',
        category: 'ADMIN_OVERHEAD',
        description: 'Architectural documentation, photogrammetry & CA certification (5%)',
        amount: 30000000,
      },
    ],
  },
  {
    id: 'csr-prj-smart',
    entityId: 'csr-ent-sevalaya',
    title: 'Vidya Jyothi — Solar-Powered Digital Smart Classrooms',
    scheduleViiCode: 'ii',
    description:
      'Setting up interactive smart boards, solar backup systems, and bilingual STEM computer labs in 6 rural government-aided schools.',
    state: 'Tamil Nadu',
    district: 'Dindigul',
    beneficiaryType: 'Rural high school students (grades 6 to 10)',
    beneficiaryTarget: 1800,
    startDate: '2026-09-01',
    endDate: '2027-03-31',
    totalBudget: 250000000, // ₹25,00,000
    status: 'TRUSTEE_APPROVED',
    createdBy: 'u-adm',
    createdAt: '2026-08-01T10:00:00Z',
    approvedBy: 'u-tru',
    approvedAt: '2026-08-10T12:00:00Z',
    budgetLines: [
      {
        id: 'cbl-v1',
        category: 'EQUIPMENT',
        description: '6 Interactive smart flat panels, 30 student laptops and 5kVA solar inverter',
        amount: 175000000,
        isCapital: true,
      },
      {
        id: 'cbl-v2',
        category: 'MATERIALS',
        description: 'Bilingual STEM software licenses, offline curriculum kits and furniture',
        amount: 45000000,
      },
      {
        id: 'cbl-v3',
        category: 'SALARIES',
        description: 'Two itinerant computer instructors and teacher training honoraria',
        amount: 18000000,
      },
      {
        id: 'cbl-v4',
        category: 'ADMIN_OVERHEAD',
        description: 'School baseline surveys, child consent logging, project management (4.8%)',
        amount: 12000000,
      },
    ],
  },
]

/* ------------------------------------------------------------------ 4. Corporate Partners (Companies) */

export const CSR_COMPANIES: CsrCompany[] = [
  {
    id: 'csr-cmp-tvs',
    name: 'TVS Motor Company Limited (CSR Trust)',
    cin: 'L35921TN1992PLC022845',
    hqState: 'Tamil Nadu',
    focusAreas: ['Hunger & Nutrition', 'Rural Welfare', 'Heritage Preservation'],
    focusStates: ['Tamil Nadu', 'Karnataka', 'Himachal Pradesh'],
    avgCsrObligation: 4200, // ₹42 Cr
    contactName: 'R. K. Ramanathan',
    contactEmail: 'rk.ramanathan@tvsmotor.com',
    contactPhone: '+91 98401 23456',
    notes: 'Prioritizes temple town nutrition and heritage preservation in Tamil Nadu with strict 2-tranche milestone agreements.',
  },
  {
    id: 'csr-cmp-murugappa',
    name: 'Murugappa Group / E.I.D. Parry CSR Foundation',
    cin: 'L24211TN1975PLC006989',
    hqState: 'Tamil Nadu',
    focusAreas: ['Traditional Arts & Heritage', 'Education', 'Environment'],
    focusStates: ['Tamil Nadu', 'Andhra Pradesh'],
    avgCsrObligation: 2800, // ₹28 Cr
    contactName: 'Sundaresan V.',
    contactEmail: 'sundaresanv@murugappa.com',
    contactPhone: '+91 94440 98765',
    notes: 'Interested in authentic Sthapati temple stone and stucco restoration in southern districts.',
  },
  {
    id: 'csr-cmp-tcs',
    name: 'Tata Consultancy Services Foundation',
    cin: 'L22210MH1995PLC084781',
    hqState: 'Maharashtra',
    focusAreas: ['Digital Education', 'STEM Training', 'Healthcare Access'],
    focusStates: ['All India', 'Tamil Nadu', 'Maharashtra'],
    avgCsrObligation: 85000, // ₹850 Cr
    contactName: 'Priyanka Sen',
    contactEmail: 'priyanka.sen@tcs.com',
    contactPhone: '+91 98200 11223',
    notes: 'Large corporate CSR desk. Requires full digital student consent records and impact analytics.',
  },
  {
    id: 'csr-cmp-lt',
    name: 'Larsen & Toubro Public Charitable Trust',
    cin: 'L99999MH1946PLC004768',
    hqState: 'Maharashtra',
    focusAreas: ['Heritage Conservation', 'Vocational Skill Labs', 'Water Security'],
    focusStates: ['Tamil Nadu', 'Gujarat', 'Maharashtra'],
    avgCsrObligation: 15000, // ₹150 Cr
    contactName: 'M. S. Natarajan',
    contactEmail: 'ms.natarajan@larsentoubro.com',
    contactPhone: '+91 98199 44556',
  },
]

/* ------------------------------------------------------------------ 5. Active Deals & MoUs */

export const CSR_DEALS: CsrDeal[] = [
  {
    id: 'csr-deal-tvs-anna',
    projectId: 'csr-prj-anna',
    companyId: 'csr-cmp-tvs',
    status: 'ACTIVE',
    committedAmount: 300000000, // ₹30,00,000
    adminCapPct: 4.8,
    needsImpactAssessment: false,
    fundId: 'fund-csr-tvs-anna',
    mouSignedOn: '2026-04-15',
    mouFilePath: '/mous/mou-tvs-sevalaya-2026.pdf',
    ownerId: 'u-adm',
    proposalText:
      'Executive Proposal: Partnership between TVS CSR Trust and Sevalaya Social Welfare Trust for daily hot meal provision across Thanjavur district.',
    approvals: [
      { role: 'ca_partner', userId: 'u-cap', decision: 'approved', at: '2026-04-12T15:00:00Z', comment: 'MoU clauses, bank account, and 4.8% admin cap verified.' },
      { role: 'trustee', userId: 'u-tru', decision: 'approved', at: '2026-04-14T11:00:00Z', comment: 'Sanctioned by the Board of Trustees.' },
    ],
    tranches: [
      {
        id: 'trn-1',
        dealId: 'csr-deal-tvs-anna',
        seqNo: 1,
        amount: 150000000, // ₹15,00,000
        dueDate: '2026-04-20',
        conditionText: 'Initial setup grant upon signed MoU and dedicated CSR bank account confirmation',
        status: 'UC_SIGNED',
        receivedOn: '2026-04-25',
        bankRef: 'CMS/TVS/9482103859/NEFT',
        ucId: 'uc-tvs-trn1',
      },
      {
        id: 'trn-2',
        dealId: 'csr-deal-tvs-anna',
        seqNo: 2,
        amount: 150000000, // ₹15,00,000
        dueDate: '2026-09-15',
        conditionText: 'Release conditional on Tranche 1 CA-certified UC and 6-month progress photo report',
        status: 'RECEIVED',
        receivedOn: '2026-09-20',
        bankRef: 'CMS/TVS/1092839182/NEFT',
      },
    ],
  },
  {
    id: 'csr-deal-murugappa-art',
    projectId: 'csr-prj-heritage',
    companyId: 'csr-cmp-murugappa',
    status: 'ACTIVE',
    committedAmount: 250000000, // ₹25,00,000
    adminCapPct: 5.0,
    needsImpactAssessment: false,
    fundId: 'fund-csr-heritage',
    mouSignedOn: '2026-10-01',
    ownerId: 'u-adm',
    proposalText:
      'Conservation of Thousand-Pillar Mandapam stone sculptures by master Sthapatis, supported under Murugappa Heritage Foundation.',
    approvals: [
      { role: 'ca_partner', userId: 'u-cap', decision: 'approved', at: '2026-09-28T16:00:00Z', comment: 'Complies with Schedule VII (v) heritage conservation rules.' },
      { role: 'trustee', userId: 'u-tru', decision: 'approved', at: '2026-09-30T10:30:00Z', comment: 'Approved for formal MoU execution with corporate sponsor.' },
    ],
    tranches: [
      {
        id: 'trn-m1',
        dealId: 'csr-deal-murugappa-art',
        seqNo: 1,
        amount: 125000000,
        dueDate: '2026-10-25',
        conditionText: 'Execution of bilateral agreement and archaeological restoration permission',
        status: 'SCHEDULED',
      },
      {
        id: 'trn-m2',
        dealId: 'csr-deal-murugappa-art',
        seqNo: 2,
        amount: 125000000,
        dueDate: '2027-02-15',
        conditionText: 'Tranche 1 UC signed by CA with UDIN and photographic milestone proof',
        status: 'SCHEDULED',
      },
    ],
  },
  {
    id: 'csr-deal-tcs-vidya',
    projectId: 'csr-prj-smart',
    companyId: 'csr-cmp-tcs',
    status: 'PITCHED',
    committedAmount: 250000000,
    adminCapPct: 4.5,
    needsImpactAssessment: false,
    ownerId: 'u-adm',
    proposalText:
      'Comprehensive rural high school digital inclusion program spanning 6 institutions in Dindigul district.',
    approvals: [],
    tranches: [],
  },
]

/* ------------------------------------------------------------------ 6. Utilisation Certificates */

export const CSR_UTILISATION_CERTIFICATES: CsrUtilisationCertificate[] = [
  {
    id: 'uc-tvs-trn1',
    dealId: 'csr-deal-tvs-anna',
    trancheId: 'trn-1',
    trancheSeq: 1,
    amountReceived: 150000000,
    amountUtilised: 150000000,
    balanceRemaining: 0,
    preparedBy: 'u-cas',
    preparedAt: '2026-09-05T11:00:00Z',
    caSignedBy: 'u-cap',
    caMembershipNo: '048291',
    caUdin: '26048291AAAAAA1081',
    signedAt: '2026-09-10T15:30:00Z',
    status: 'signed',
    narrative:
      'Certified that ₹15,00,000 received under Tranche 1 of TVS CSR Agreement has been fully utilised for grain provisions (₹9,45,000), kitchen steam equipment (₹4,85,000), and monitoring expenses (₹70,000), with nil unspent balance.',
  },
]

/* ------------------------------------------------------------------ 7. Progress Updates */

export const CSR_PROGRESS_UPDATES: CsrProgressUpdate[] = [
  {
    id: 'csr-upd-1',
    projectId: 'csr-prj-anna',
    periodStart: '2026-04-01',
    periodEnd: '2026-08-31',
    beneficiariesReached: 184500,
    narrative:
      'Successfully served 1,84,500 hot nutritious meals across 153 operating days. Installed commercial steam boiler reducing LPG cooking costs by 28%. Zero health or hygiene incidents.',
    photos: [
      {
        url: '/images/project-rajagopuram.webp',
        caption: 'Central Annadhanam meal preparation in modern hygienic kitchen',
        consentOk: true,
        takenAt: '2026-07-15',
      },
    ],
    createdBy: 'u-adm',
    createdAt: '2026-09-02T10:00:00Z',
  },
]
