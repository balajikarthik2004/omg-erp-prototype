import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import {
  ArrowRight,
  Building2,
  CheckCircle2,
  Clock,
  FileCheck2,
  Handshake,
  ScrollText,
  ShieldCheck,
  TrendingUp,
} from 'lucide-react'

import { formatMoney } from '@/lib/format'
import { Button } from '@/components/ui/Button'
import { Card, CardHeader } from '@/components/ui/Card'
import { Skeleton } from '@/components/ui/Skeleton'
import { Stat } from '@/components/ui/Stat'
import { PageHeader } from '@/components/layout/PageHeader'
import { useDb } from '@/store/db'

export function CsrOverviewPage() {
  const db = useDb()

  const stats = useMemo(() => {
    if (!db.ready) return null
    const entities = db.csrEntities
    const projects = db.csrProjects
    const companies = db.csrCompanies
    const deals = db.csrDeals
    const ucs = db.csrUtilisationCertificates

    const totalCommitted = deals.reduce((sum, d) => sum + d.committedAmount, 0)
    const totalReceived = deals.flatMap((d) => d.tranches)
      .filter((t) => t.status === 'RECEIVED' || t.status === 'UTILISED' || t.status === 'UC_SIGNED')
      .reduce((sum, t) => sum + t.amount, 0)

    const csrReadyCount = entities.filter((e) => e.readinessStatus === 'CSR_READY').length
    const signedUcs = ucs.filter((u) => u.status === 'signed').length

    return {
      entities,
      projects,
      companies,
      deals,
      ucs,
      totalCommitted,
      totalReceived,
      csrReadyCount,
      signedUcs,
    }
  }, [db])

  if (!stats) return <Skeleton className="h-96 w-full" />

  return (
    <div className="space-y-4 sm:space-y-5">
      <PageHeader
        phase="collect"
        title="Corporate Social Responsibility (CSR)"
        description="MCA Section 135 compliance, Schedule VII project builder, 5% admin cap enforcement, and CA-signed Utilisation Certificates with UDIN."
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <Link to="/console/csr/compliance">
              <Button variant="secondary" icon={<ShieldCheck className="size-4" aria-hidden />}>
                Compliance Vault
              </Button>
            </Link>
            <Link to="/console/csr/deals">
              <Button variant="primary" icon={<Handshake className="size-4" aria-hidden />}>
                Active MoUs
              </Button>
            </Link>
          </div>
        }
      />

      {/* Top Level Metric Cards */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Stat
          label="Grants Committed"
          value={formatMoney(stats.totalCommitted)}
          sub="Legally sanctioned MoUs"
          accentClass="bg-marigold-500"
          icon={<Handshake className="size-4" aria-hidden />}
        />
        <Stat
          label="Disbursed Funds"
          value={formatMoney(stats.totalReceived)}
          sub="Direct to restricted project funds"
          accentClass="bg-tulsi-500"
          icon={<TrendingUp className="size-4" aria-hidden />}
        />
        <Stat
          label="Implementing Agencies"
          value={`${stats.csrReadyCount} of ${stats.entities.length}`}
          sub="CSR-Ready & CA verified"
          accentClass="bg-peacock-500"
          icon={<ShieldCheck className="size-4" aria-hidden />}
        />
        <Stat
          label="Signed UCs (UDIN)"
          value={`${stats.signedUcs} certified`}
          sub="Statutory compliance complete"
          accentClass="bg-kumkum-600"
          icon={<FileCheck2 className="size-4" aria-hidden />}
        />
      </div>

      {/* 6-Step Module Navigator Strip */}
      <Card className="border border-sandalwood-300/80 bg-white shadow-xs">
        <div className="p-4 sm:p-5">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="font-serif text-base font-semibold text-sandalwood-900">
              CSR Lifecycle & Governance Workflow
            </h2>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-turmeric-50 px-2.5 py-0.5 text-xs font-medium text-turmeric-800">
              MCA Sec 135 & Schedule VII
            </span>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
            <Link
              to="/console/csr/compliance"
              className="group flex flex-col justify-between rounded-lg border border-sandalwood-200 bg-sandalwood-50/50 p-3.5 transition hover:border-turmeric-400 hover:bg-white hover:shadow-sm"
            >
              <div>
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs font-semibold text-turmeric-700">01. VAULT</span>
                  <ShieldCheck className="size-4 text-turmeric-600 group-hover:scale-110 transition-transform" />
                </div>
                <h3 className="mt-1 font-serif text-sm font-semibold text-sandalwood-900">Compliance Vault</h3>
                <p className="mt-0.5 text-xs text-sandalwood-600">
                  CSR-1, RNPO 332, 354 approval & 3-yr audited records.
                </p>
              </div>
              <div className="mt-3 flex items-center gap-1 text-xs font-medium text-turmeric-700">
                <span>View entities</span>
                <ArrowRight className="size-3 group-hover:translate-x-0.5 transition-transform" />
              </div>
            </Link>

            <Link
              to="/console/csr/projects"
              className="group flex flex-col justify-between rounded-lg border border-sandalwood-200 bg-sandalwood-50/50 p-3.5 transition hover:border-turmeric-400 hover:bg-white hover:shadow-sm"
            >
              <div>
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs font-semibold text-turmeric-700">02. BUILDER</span>
                  <ScrollText className="size-4 text-turmeric-600 group-hover:scale-110 transition-transform" />
                </div>
                <h3 className="mt-1 font-serif text-sm font-semibold text-sandalwood-900">Project Builder</h3>
                <p className="mt-0.5 text-xs text-sandalwood-600">
                  Schedule VII item mapping & pooja-block validation.
                </p>
              </div>
              <div className="mt-3 flex items-center gap-1 text-xs font-medium text-turmeric-700">
                <span>Configure heads</span>
                <ArrowRight className="size-3 group-hover:translate-x-0.5 transition-transform" />
              </div>
            </Link>

            <Link
              to="/console/csr/pipeline"
              className="group flex flex-col justify-between rounded-lg border border-sandalwood-200 bg-sandalwood-50/50 p-3.5 transition hover:border-turmeric-400 hover:bg-white hover:shadow-sm"
            >
              <div>
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs font-semibold text-turmeric-700">03. PIPELINE</span>
                  <Building2 className="size-4 text-turmeric-600 group-hover:scale-110 transition-transform" />
                </div>
                <h3 className="mt-1 font-serif text-sm font-semibold text-sandalwood-900">Corporate CRM</h3>
                <p className="mt-0.5 text-xs text-sandalwood-600">
                  Mandatory CSR obligation tracking & AI proposals.
                </p>
              </div>
              <div className="mt-3 flex items-center gap-1 text-xs font-medium text-turmeric-700">
                <span>View partners</span>
                <ArrowRight className="size-3 group-hover:translate-x-0.5 transition-transform" />
              </div>
            </Link>

            <Link
              to="/console/csr/deals"
              className="group flex flex-col justify-between rounded-lg border border-sandalwood-200 bg-sandalwood-50/50 p-3.5 transition hover:border-turmeric-400 hover:bg-white hover:shadow-sm"
            >
              <div>
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs font-semibold text-turmeric-700">04. MOUS</span>
                  <Handshake className="size-4 text-turmeric-600 group-hover:scale-110 transition-transform" />
                </div>
                <h3 className="mt-1 font-serif text-sm font-semibold text-sandalwood-900">Deals & Tranches</h3>
                <p className="mt-0.5 text-xs text-sandalwood-600">
                  Dual sign-off (CA+Trustee) and 5% admin cap check.
                </p>
              </div>
              <div className="mt-3 flex items-center gap-1 text-xs font-medium text-turmeric-700">
                <span>Review tranches</span>
                <ArrowRight className="size-3 group-hover:translate-x-0.5 transition-transform" />
              </div>
            </Link>

            <Link
              to="/console/csr/reports"
              className="group flex flex-col justify-between rounded-lg border border-sandalwood-200 bg-sandalwood-50/50 p-3.5 transition hover:border-turmeric-400 hover:bg-white hover:shadow-sm"
            >
              <div>
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs font-semibold text-turmeric-700">05. CERTIFY</span>
                  <FileCheck2 className="size-4 text-turmeric-600 group-hover:scale-110 transition-transform" />
                </div>
                <h3 className="mt-1 font-serif text-sm font-semibold text-sandalwood-900">UC & Reporting</h3>
                <p className="mt-0.5 text-xs text-sandalwood-600">
                  CA-signed Utilisation Certificates with UDIN seal.
                </p>
              </div>
              <div className="mt-3 flex items-center gap-1 text-xs font-medium text-turmeric-700">
                <span>Sign certificates</span>
                <ArrowRight className="size-3 group-hover:translate-x-0.5 transition-transform" />
              </div>
            </Link>
          </div>
        </div>
      </Card>

      {/* Main Grid: Compliance Status & Active MoUs */}
      <div className="grid gap-4 lg:grid-cols-2">
        {/* Implementing Entities Readiness */}
        <Card>
          <CardHeader
            title="Implementing Agencies & Readiness Status"
            action={
              <Link to="/console/csr/compliance" className="text-xs font-medium text-turmeric-700 hover:underline">
                Open Compliance Vault →
              </Link>
            }
          />
          <div className="divide-y divide-sandalwood-200/70 p-1 sm:p-2">
            {stats.entities.map((entity) => {
              const isReady = entity.readinessStatus === 'CSR_READY'
              const docs = stats.ucs ? db.csrDocuments.filter((d) => d.entityId === entity.id) : []
              const verifiedDocs = docs.filter((d) => d.status === 'verified').length

              return (
                <div key={entity.id} className="p-3 sm:p-3.5 transition hover:bg-sandalwood-50/50">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="font-serif text-sm font-semibold text-sandalwood-900">
                          {entity.legalName}
                        </h4>
                        <span className="text-[11px] font-mono uppercase text-sandalwood-500">
                          ({entity.entityType})
                        </span>
                      </div>
                      <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-sandalwood-600">
                        <span>PAN: <strong className="font-mono font-medium">{entity.pan}</strong></span>
                        {entity.csr1RegNo && (
                          <span>CSR-1: <strong className="font-mono font-medium text-tulsi-700">{entity.csr1RegNo}</strong></span>
                        )}
                        {entity.darpanId && (
                          <span>DARPAN: <strong className="font-mono font-medium">{entity.darpanId}</strong></span>
                        )}
                      </div>
                    </div>
                    <span
                      className={`inline-flex shrink-0 items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${
                        isReady
                          ? 'border border-tulsi-200 bg-tulsi-50 text-tulsi-800'
                          : 'border border-turmeric-200 bg-turmeric-50 text-turmeric-800'
                      }`}
                    >
                      {isReady ? <CheckCircle2 className="size-3.5" /> : <Clock className="size-3.5" />}
                      {isReady ? 'CSR READY' : 'DOCS UPLOADED'}
                    </span>
                  </div>

                  <div className="mt-3 flex items-center justify-between rounded-md bg-sandalwood-100/60 px-3 py-2 text-xs">
                    <span className="text-sandalwood-700">
                      Compliance dossier: <strong>{verifiedDocs} of {docs.length}</strong> verified by CA
                    </span>
                    <span className="font-medium text-sandalwood-900">
                      {isReady ? 'Sanctioned for execution' : 'Track record review in progress'}
                    </span>
                  </div>
                </div>
              )
            })}
          </div>
        </Card>

        {/* Active MoUs & Grant Disbursements */}
        <Card>
          <CardHeader
            title="Active Corporate Grants & Tranches"
            action={
              <Link to="/console/csr/deals" className="text-xs font-medium text-turmeric-700 hover:underline">
                View all MoUs →
              </Link>
            }
          />
          <div className="divide-y divide-sandalwood-200/70 p-2">
            {stats.deals.map((deal) => {
              const company = stats.companies.find((c) => c.id === deal.companyId)
              const project = stats.projects.find((p) => p.id === deal.projectId)

              const receivedTranches = deal.tranches.filter(
                (t) => t.status === 'RECEIVED' || t.status === 'UTILISED' || t.status === 'UC_SIGNED',
              )
              const totalReceived = receivedTranches.reduce((sum, t) => sum + t.amount, 0)
              const pctReceived = Math.round((totalReceived / deal.committedAmount) * 100)

              return (
                <div key={deal.id} className="p-3 sm:p-3.5 transition hover:bg-sandalwood-50/50">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-semibold uppercase tracking-wider text-turmeric-700">
                          {company?.name}
                        </span>
                        <span className="text-xs text-sandalwood-400">→</span>
                        <h4 className="font-serif text-sm font-semibold text-sandalwood-900">
                          {project?.title}
                        </h4>
                      </div>
                      <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-sandalwood-600">
                        <span>Grant: <strong className="text-sandalwood-900">{formatMoney(deal.committedAmount)}</strong></span>
                        <span>Admin Cap: <strong className="font-mono text-tulsi-700">{deal.adminCapPct}%</strong> (&le; 5.0% cap)</span>
                        <span>MoU Signed: <strong>{deal.mouSignedOn ?? 'Pending'}</strong></span>
                      </div>
                    </div>
                    <span className="inline-flex shrink-0 items-center rounded-full bg-tulsi-50 px-2.5 py-0.5 text-xs font-medium text-tulsi-700 border border-tulsi-200">
                      {deal.status}
                    </span>
                  </div>

                  {/* Tranche progress bar */}
                  <div className="mt-2.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-sandalwood-600">
                        Disbursed: <strong className="text-sandalwood-900">{formatMoney(totalReceived)}</strong> ({pctReceived}%)
                      </span>
                      <span className="font-mono text-[11px] text-sandalwood-500">
                        {receivedTranches.length} of {deal.tranches.length} Tranches released
                      </span>
                    </div>
                    <div className="mt-1.5 h-2 w-full overflow-hidden rounded-full bg-sandalwood-200">
                      <div
                        className="h-full rounded-full bg-tulsi-600 transition-all duration-500"
                        style={{ width: `${pctReceived}%` }}
                      />
                    </div>
                  </div>

                  {/* Tranches pill list */}
                  <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
                    {deal.tranches.map((t) => (
                      <div
                        key={t.id}
                        className="flex items-center justify-between rounded border border-sandalwood-200 bg-white px-2.5 py-1.5"
                      >
                        <span className="font-mono font-medium text-sandalwood-800">
                          Tranche #{t.seqNo}: {formatMoney(t.amount)}
                        </span>
                        <span
                          className={`rounded px-1.5 py-0.5 text-[10px] font-semibold uppercase ${
                            t.status === 'UC_SIGNED'
                              ? 'bg-tulsi-100 text-tulsi-800'
                              : t.status === 'RECEIVED'
                              ? 'bg-peacock-100 text-peacock-800'
                              : 'bg-sandalwood-100 text-sandalwood-600'
                          }`}
                        >
                          {t.status}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )
            })}
          </div>
        </Card>
      </div>
    </div>
  )
}
