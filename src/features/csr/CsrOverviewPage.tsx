import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import {
  FileCheck2,
  Handshake,
  ShieldCheck,
  TrendingUp,
} from 'lucide-react'

import { formatMoneyShort } from '@/lib/format'
import { Button } from '@/components/ui/Button'
import { Card, CardHeader } from '@/components/ui/Card'
import { Skeleton } from '@/components/ui/Skeleton'
import { Stat } from '@/components/ui/Stat'
import { PageHeader } from '@/components/layout/PageHeader'
import { CsrLifecycleStrip } from './CsrLifecycleStrip'
import { StatusBadge } from '@/components/ui/StatusBadge'
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
        title="CSR overview"
        description="Corporate grants, end to end: a company is courted, an MoU is signed, the money arrives in tranches into its own dedicated fund, it is spent on a Schedule VII project, and a utilisation certificate proves it."
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
          value={formatMoneyShort(stats.totalCommitted)}
          sub="Legally sanctioned MoUs"
          accentClass="bg-marigold-500"
          icon={<Handshake className="size-4" aria-hidden />}
        />
        <Stat
          label="Disbursed Funds"
          value={formatMoneyShort(stats.totalReceived)}
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

      <CsrLifecycleStrip />

      {/* Main Grid: Compliance Status & Active MoUs */}
      <div className="grid gap-4 lg:grid-cols-2">
        {/* Implementing Entities Readiness */}
        <Card>
          <CardHeader
            title="Implementing agencies"
            action={
              <Link to="/console/csr/compliance" className="text-[12.5px] font-semibold text-navy-600 hover:text-navy-800 hover:underline">
                Open Compliance Vault →
              </Link>
            }
          />
          <div className="divide-y divide-sandal-200/70 p-1 sm:p-2">
            {stats.entities.map((entity) => {
              const isReady = entity.readinessStatus === 'CSR_READY'
              const docs = stats.ucs ? db.csrDocuments.filter((d) => d.entityId === entity.id) : []
              const verifiedDocs = docs.filter((d) => d.status === 'verified').length

              return (
                <div key={entity.id} className="p-3 sm:p-3.5 transition hover:bg-sandal-50/50">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="font-display text-sm font-semibold text-stone-900">
                          {entity.legalName}
                        </h4>
                        <span className="text-[11px] font-mono uppercase text-stone-500">
                          ({entity.entityType})
                        </span>
                      </div>
                      <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-stone-700">
                        <span>PAN: <strong className="font-mono font-medium">{entity.pan}</strong></span>
                        {entity.csr1RegNo && (
                          <span>CSR-1: <strong className="font-mono font-medium text-tulsi-700">{entity.csr1RegNo}</strong></span>
                        )}
                        {entity.darpanId && (
                          <span>DARPAN: <strong className="font-mono font-medium">{entity.darpanId}</strong></span>
                        )}
                      </div>
                    </div>
                    <StatusBadge
                      status={isReady ? 'CSR_READY' : 'DOCS_UPLOADED'}
                      className="shrink-0"
                    />
                  </div>

                  <div className="mt-3 flex items-center justify-between rounded-lg border border-sandal-200 bg-sandal-100 px-3 py-2 text-xs">
                    <span className="text-stone-700">
                      Compliance dossier: <strong>{verifiedDocs} of {docs.length}</strong> verified by CA
                    </span>
                    <span className="font-medium text-stone-900">
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
            title="Active corporate grants"
            action={
              <Link to="/console/csr/deals" className="text-[12.5px] font-semibold text-navy-600 hover:text-navy-800 hover:underline">
                View all MoUs →
              </Link>
            }
          />
          <div className="divide-y divide-sandal-200/70 p-2">
            {stats.deals.map((deal) => {
              const company = stats.companies.find((c) => c.id === deal.companyId)
              const project = stats.projects.find((p) => p.id === deal.projectId)

              const receivedTranches = deal.tranches.filter(
                (t) => t.status === 'RECEIVED' || t.status === 'UTILISED' || t.status === 'UC_SIGNED',
              )
              const totalReceived = receivedTranches.reduce((sum, t) => sum + t.amount, 0)
              const pctReceived = Math.round((totalReceived / deal.committedAmount) * 100)

              return (
                <div key={deal.id} className="p-3 transition-colors duration-150 hover:bg-sandal-100 sm:p-3.5">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-[13px] font-semibold text-navy-700">{company?.name}</span>
                        <span className="text-xs text-stone-500">→</span>
                        <h4 className="font-display text-sm font-semibold text-stone-900">
                          {project?.title}
                        </h4>
                      </div>
                      <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-stone-700">
                        <span>Grant: <strong className="text-stone-900">{formatMoneyShort(deal.committedAmount)}</strong></span>
                        <span>Admin Cap: <strong className="font-mono text-tulsi-700">{deal.adminCapPct}%</strong> (&le; 5.0% cap)</span>
                        <span>MoU Signed: <strong>{deal.mouSignedOn ?? 'Pending'}</strong></span>
                      </div>
                    </div>
                    <StatusBadge status={deal.status} className="shrink-0" />
                  </div>

                  {/* Tranche progress bar */}
                  <div className="mt-2.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-stone-700">
                        Disbursed: <strong className="text-stone-900">{formatMoneyShort(totalReceived)}</strong> ({pctReceived}%)
                      </span>
                      <span className="text-[12px] text-stone-500">
                        <span className="font-mono tabular-nums">
                          {receivedTranches.length} of {deal.tranches.length}
                        </span>{' '}
                        tranches released
                      </span>
                    </div>
                    <div className="mt-1.5 h-2 w-full overflow-hidden rounded-full bg-sandal-200">
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
                        className="flex items-center justify-between gap-2 rounded-lg border border-sandal-200 bg-sandal-50 px-2.5 py-1.5"
                      >
                        <span className="text-[12px] text-stone-700">
                          Tranche {t.seqNo}
                          <strong className="ml-1.5 font-mono text-stone-900 tabular-nums">
                            {formatMoneyShort(t.amount)}
                          </strong>
                        </span>
                        <StatusBadge status={t.status} compact />
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
