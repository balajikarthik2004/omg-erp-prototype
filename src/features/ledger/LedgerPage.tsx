import { useMemo, useState } from 'react'
import {
  AlertCircle,
  ArrowDownLeft,
  ArrowUpRight,
  Calendar,
  Check,
  CheckCircle2,
  ChevronRight,
  Download,
  Info,
  Lock,
  RotateCcw,
  Search,
  SlidersHorizontal,
  Undo2,
} from 'lucide-react'

import { formatDate, formatMoney } from '@/lib/format'
import { toast } from '@/lib/toast'
import { Button } from '@/components/ui/Button'
import { EmptyState } from '@/components/ui/EmptyState'
import { Input } from '@/components/ui/Input'
import { Money } from '@/components/ui/Money'
import { Select } from '@/components/ui/Select'
import { Skeleton } from '@/components/ui/Skeleton'
import { PageHeader } from '@/components/layout/PageHeader'
import { SectorChip } from '@/components/layout/PhaseChip'
import { SECTOR_IDS, SECTORS } from '@/config'
import { FUNDS } from '@/mock/seed'
import { useDb } from '@/store/db'
import { useSession, type SectorFilter } from '@/store/session'
import { inSector } from '@/store/selectors'
import type { JournalEntry } from '@/types'

const PAGE_SIZE = 20

type TransactionType = 'all' | 'payment' | 'donation' | 'allotment' | 'opening' | 'reversal' | 'csr'
type DateRange = 'all' | '7d' | '30d' | '90d' | 'this_year'
type BalanceStatus = 'all' | 'balanced' | 'unbalanced'
type SortBy = 'date_desc' | 'date_asc' | 'amount_desc' | 'amount_asc'

function getTransactionType(entry: JournalEntry): TransactionType {
  if (entry.reversalOf || entry.memo.toLowerCase().includes('reversal') || entry.memo.toLowerCase().includes('refund')) {
    return 'reversal'
  }
  if (entry.memo.toLowerCase().includes('supplier payment') || entry.sourceRef.startsWith('inv-')) {
    return 'payment'
  }
  if (entry.memo.toLowerCase().includes('donation') || entry.sourceRef.startsWith('don-')) {
    return 'donation'
  }
  if (entry.memo.toLowerCase().includes('fund allotment') || entry.sourceRef.startsWith('alt-')) {
    return 'allotment'
  }
  if (entry.memo.toLowerCase().includes('opening balance') || entry.sourceRef.startsWith('OPENING')) {
    return 'opening'
  }
  if (entry.memo.toLowerCase().includes('csr') || entry.memo.toLowerCase().includes('tranche')) {
    return 'csr'
  }
  return 'all'
}

function getAccountImpact(account: string, debit: number, credit: number): string {
  const acc = account.toLowerCase()
  if (acc.includes('bank') || acc.includes('cash')) {
    return debit > 0 ? 'Cash inflow to bank account' : 'Cash outflow from bank account'
  }
  if (acc.includes('donation') || acc.includes('income') || acc.includes('grant') || acc.includes('revenue')) {
    return credit > 0 ? 'Revenue / donor gift credited' : 'Income reversed'
  }
  if (acc.includes('expenditure') || acc.includes('expense') || acc.includes('fee')) {
    return debit > 0 ? 'Operational expense debited' : 'Expense reversal'
  }
  if (acc.includes('fund') || acc.includes('corpus') || acc.includes('balance') || acc.includes('allotted')) {
    return debit > 0 ? 'Fund appropriation / draw' : 'Fund corpus addition'
  }
  if (acc.includes('budget')) {
    return credit > 0 ? 'Budget head credited with allocation' : 'Budget reduction'
  }
  return debit > 0 ? 'Debit balance increase' : 'Credit balance increase'
}

export function LedgerPage() {
  const db = useDb()
  const globalSectorFilter = useSession((s) => s.sectorFilter)

  // Filters state
  const [query, setQuery] = useState('')
  const [sectorFilter, setSectorFilter] = useState<SectorFilter>('all')
  const [fundId, setFundId] = useState('all')
  const [typeFilter, setTypeFilter] = useState<TransactionType>('all')
  const [dateRange, setDateRange] = useState<DateRange>('all')
  const [balanceFilter, setBalanceFilter] = useState<BalanceStatus>('all')
  const [sortBy, setSortBy] = useState<SortBy>('date_desc')

  // Pagination & expansion state
  const [page, setPage] = useState(0)
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set())
  const [showFilters, setShowFilters] = useState(false)

  // Active sector calculation (inherits global sector filter if not overridden)
  const effectiveSector = sectorFilter !== 'all' ? sectorFilter : globalSectorFilter

  // All entries matching sector
  const baseEntries = useMemo(() => {
    return inSector(db.journal, effectiveSector)
  }, [db.journal, effectiveSector])

  // Filtered entries
  const filteredEntries = useMemo(() => {
    const q = query.trim().toLowerCase()
    const now = Date.now()

    return baseEntries.filter((entry) => {
      // Fund filter
      if (fundId !== 'all' && !entry.lines.some((l) => l.fundId === fundId)) {
        return false
      }

      // Transaction type filter
      if (typeFilter !== 'all' && getTransactionType(entry) !== typeFilter) {
        return false
      }

      // Balance status filter
      const debitSum = entry.lines.reduce((s, l) => s + l.debit, 0)
      const creditSum = entry.lines.reduce((s, l) => s + l.credit, 0)
      const isBalanced = debitSum === creditSum && debitSum > 0
      if (balanceFilter === 'balanced' && !isBalanced) return false
      if (balanceFilter === 'unbalanced' && isBalanced) return false

      // Date range filter
      if (dateRange !== 'all') {
        const entryTime = new Date(entry.date).getTime()
        if (!isNaN(entryTime)) {
          if (dateRange === '7d' && now - entryTime > 7 * 24 * 60 * 60 * 1000) return false
          if (dateRange === '30d' && now - entryTime > 30 * 24 * 60 * 60 * 1000) return false
          if (dateRange === '90d' && now - entryTime > 90 * 24 * 60 * 60 * 1000) return false
          if (dateRange === 'this_year') {
            const curYear = new Date().getFullYear()
            const entryYear = new Date(entry.date).getFullYear()
            if (curYear !== entryYear) return false
          }
        }
      }

      // Text query
      if (q !== '') {
        const matchesMemo = entry.memo.toLowerCase().includes(q)
        const matchesSource = entry.sourceRef.toLowerCase().includes(q)
        const matchesId = entry.id.toLowerCase().includes(q)
        const matchesLine = entry.lines.some(
          (l) => l.account.toLowerCase().includes(q) || l.fundId.toLowerCase().includes(q),
        )
        if (!matchesMemo && !matchesSource && !matchesId && !matchesLine) {
          return false
        }
      }

      return true
    })
  }, [baseEntries, fundId, typeFilter, balanceFilter, dateRange, query])

  // Sorted entries
  const sortedEntries = useMemo(() => {
    const list = [...filteredEntries]
    list.sort((a, b) => {
      if (sortBy === 'date_desc') {
        return b.date.localeCompare(a.date)
      }
      if (sortBy === 'date_asc') {
        return a.date.localeCompare(b.date)
      }
      const amountA = Math.max(
        a.lines.reduce((s, l) => s + l.debit, 0),
        a.lines.reduce((s, l) => s + l.credit, 0),
      )
      const amountB = Math.max(
        b.lines.reduce((s, l) => s + l.debit, 0),
        b.lines.reduce((s, l) => s + l.credit, 0),
      )
      if (sortBy === 'amount_desc') {
        return amountB - amountA
      }
      if (sortBy === 'amount_asc') {
        return amountA - amountB
      }
      return 0
    })
    return list
  }, [filteredEntries, sortBy])

  // Paged entries
  const paged = useMemo(() => {
    return sortedEntries.slice(page * PAGE_SIZE, page * PAGE_SIZE + PAGE_SIZE)
  }, [sortedEntries, page])

  // Summary figures calculated strictly from filtered entries
  const summary = useMemo(() => {
    let totalDebits = 0
    let totalCredits = 0
    let balancedCount = 0

    for (const entry of sortedEntries) {
      const d = entry.lines.reduce((s, l) => s + l.debit, 0)
      const c = entry.lines.reduce((s, l) => s + l.credit, 0)
      totalDebits += d
      totalCredits += c
      if (d === c && d > 0) balancedCount++
    }

    const latestDate = sortedEntries[0]?.date ? formatDate(sortedEntries[0].date) : '—'

    return {
      totalDebits,
      totalCredits,
      balancedCount,
      totalCount: sortedEntries.length,
      latestDate,
    }
  }, [sortedEntries])

  // Dynamic funds list (combining seed and runtime funds from db)
  const fundOptions = useMemo(() => {
    const map = new Map<string, string>()
    FUNDS.forEach((f) => map.set(f.id, f.name))
    db.funds.forEach((f) => map.set(f.id, f.name))
    return [
      { value: 'all', label: 'All funds' },
      ...Array.from(map.entries()).map(([id, name]) => ({ value: id, label: name })),
    ]
  }, [db.funds])

  // Fund name helper
  const getFundLabel = (fid: string) => {
    const fund = db.funds.find((f) => f.id === fid) ?? FUNDS.find((f) => f.id === fid)
    if (fund) return fund.name
    const budget = db.budgets.find((b) => b.id === fid)
    if (budget) return budget.name
    return fid
  }

  // Toggle expansion
  const toggleExpand = (id: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const expandAll = () => {
    setExpandedIds(new Set(paged.map((e) => e.id)))
  }

  const collapseAll = () => {
    setExpandedIds(new Set())
  }

  const clearAllFilters = () => {
    setQuery('')
    setFundId('all')
    setSectorFilter('all')
    setTypeFilter('all')
    setDateRange('all')
    setBalanceFilter('all')
    setSortBy('date_desc')
    setPage(0)
  }

  const hasActiveFilters =
    query.trim() !== '' ||
    fundId !== 'all' ||
    sectorFilter !== 'all' ||
    typeFilter !== 'all' ||
    dateRange !== 'all' ||
    balanceFilter !== 'all' ||
    sortBy !== 'date_desc'

  // CSV export
  const handleExportCsv = () => {
    if (sortedEntries.length === 0) {
      toast.warning('No entries to export', 'Adjust your filters to include ledger entries.')
      return
    }

    const headers = ['Entry ID', 'Date', 'Sector', 'Memo', 'Source Reference', 'Debit Total', 'Credit Total', 'Status']
    const csvLines = [headers.join(',')]

    for (const row of sortedEntries) {
      const d = row.lines.reduce((s, l) => s + l.debit, 0)
      const c = row.lines.reduce((s, l) => s + l.credit, 0)
      const statusStr = d === c ? 'Balanced' : 'Unbalanced'
      csvLines.push(
        [
          `"${row.id}"`,
          `"${formatDate(row.date)}"`,
          `"${row.sectorId}"`,
          `"${row.memo.replace(/"/g, '""')}"`,
          `"${row.sourceRef}"`,
          (d / 100).toFixed(2),
          (c / 100).toFixed(2),
          `"${statusStr}"`,
        ].join(','),
      )
    }

    const blob = new Blob([csvLines.join('\n')], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `ledger-export-${new Date().toISOString().slice(0, 10)}.csv`
    a.click()
    URL.revokeObjectURL(url)

    toast.success('Ledger exported', `Successfully exported ${sortedEntries.length} entries to CSV.`)
  }

  return (
    <div className="space-y-5">
      <PageHeader
        phase="control"
        title="Ledger"
        description="Every financial entry, recorded in order and preserved for audit. Entries are never edited or deleted — a mistake is corrected with an append-only reversal."
        actions={
          <div className="flex items-center gap-2">
            <span
              title="Immutable record: once committed, entries cannot be modified or deleted."
              className="inline-flex items-center gap-1.5 rounded-full border border-navy-200/90 bg-white px-3 py-1 text-[12px] font-semibold text-navy-800 shadow-2xs"
            >
              <Lock className="size-3 text-navy-500" aria-hidden />
              Append-only
            </span>
            <Button
              variant="secondary"
              size="sm"
              icon={<Download className="size-3.5 text-navy-600" aria-hidden />}
              onClick={handleExportCsv}
            >
              Export CSV
            </Button>
          </div>
        }
      />

      {/* A. FINANCIAL SUMMARY OVERVIEW */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {/* Total Debits */}
        <div className="relative overflow-hidden rounded-xl border border-navy-100/90 bg-white p-3.5 sm:p-4 shadow-card">
          <div className="absolute inset-x-0 top-0 h-1 bg-navy-600" aria-hidden />
          <div className="flex items-center justify-between gap-2">
            <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-navy-600">Total Debits</p>
            <span className="flex size-6 items-center justify-center rounded-md bg-navy-50 text-navy-600 border border-navy-100">
              <ArrowDownLeft className="size-3.5 stroke-2" aria-hidden />
            </span>
          </div>
          <p className="mt-2 font-heritage text-[20px] sm:text-[23px] font-bold text-navy-950 tracking-tight leading-tight">
            {formatMoney(summary.totalDebits)}
          </p>
          <p className="mt-1 text-[11.5px] text-navy-500 font-medium">Selected period & filters</p>
        </div>

        {/* Total Credits */}
        <div className="relative overflow-hidden rounded-xl border border-navy-100/90 bg-white p-3.5 sm:p-4 shadow-card">
          <div className="absolute inset-x-0 top-0 h-1 bg-navy-600" aria-hidden />
          <div className="flex items-center justify-between gap-2">
            <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-navy-600">Total Credits</p>
            <span className="flex size-6 items-center justify-center rounded-md bg-navy-50 text-navy-600 border border-navy-100">
              <ArrowUpRight className="size-3.5 stroke-2" aria-hidden />
            </span>
          </div>
          <p className="mt-2 font-heritage text-[20px] sm:text-[23px] font-bold text-navy-950 tracking-tight leading-tight">
            {formatMoney(summary.totalCredits)}
          </p>
          <p className="mt-1 text-[11.5px] text-navy-500 font-medium">Selected period & filters</p>
        </div>

        {/* Balanced Entries */}
        <div className="relative overflow-hidden rounded-xl border border-navy-100/90 bg-white p-3.5 sm:p-4 shadow-card">
          <div
            className={`absolute inset-x-0 top-0 h-1 ${summary.balancedCount === summary.totalCount && summary.totalCount > 0 ? 'bg-emerald-500' : 'bg-amber-500'}`}
            aria-hidden
          />
          <div className="flex items-center justify-between gap-2">
            <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-navy-600">Balanced Entries</p>
            <span
              className={`flex size-6 items-center justify-center rounded-md border ${
                summary.balancedCount === summary.totalCount && summary.totalCount > 0
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                  : 'bg-amber-50 text-amber-700 border-amber-200'
              }`}
            >
              <CheckCircle2 className="size-3.5 stroke-2" aria-hidden />
            </span>
          </div>
          <p className="mt-2 font-heritage text-[20px] sm:text-[23px] font-bold text-navy-950 tracking-tight leading-tight">
            {summary.balancedCount} <span className="text-[15px] font-semibold text-navy-400">/ {summary.totalCount}</span>
          </p>
          <p className="mt-1 text-[11.5px] font-medium text-emerald-700">
            {summary.balancedCount === summary.totalCount && summary.totalCount > 0
              ? 'All debits = credits (100%)'
              : `${summary.totalCount - summary.balancedCount} unbalanced`}
          </p>
        </div>

        {/* Latest Entry */}
        <div className="relative overflow-hidden rounded-xl border border-navy-100/90 bg-white p-3.5 sm:p-4 shadow-card">
          <div className="absolute inset-x-0 top-0 h-1 bg-navy-600" aria-hidden />
          <div className="flex items-center justify-between gap-2">
            <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-navy-600">Latest Entry</p>
            <span className="flex size-6 items-center justify-center rounded-md bg-navy-50 text-navy-600 border border-navy-100">
              <Calendar className="size-3.5" aria-hidden />
            </span>
          </div>
          <p className="mt-2 font-heritage text-[18px] sm:text-[21px] font-bold text-navy-950 tracking-tight leading-tight truncate">
            {summary.latestDate}
          </p>
          <p className="mt-1 text-[11.5px] text-navy-500 font-medium">Chronological order</p>
        </div>
      </div>

      {/* B. SEARCH & FILTER TOOLBAR */}
      <div className="rounded-xl border border-navy-100/90 bg-white p-3 sm:p-4 shadow-card space-y-3">
        {/* Primary Filter Row */}
        <div className="grid gap-2.5 sm:grid-cols-2 lg:grid-cols-[1fr_220px_180px_auto]">
          <Input
            aria-label="Search the ledger"
            placeholder="Search memo, invoice, PO or source ref..."
            value={query}
            onChange={(e) => {
              setQuery(e.target.value)
              setPage(0)
            }}
            leading={<Search className="size-4 text-navy-400" aria-hidden />}
          />

          <Select
            aria-label="Filter by fund"
            value={fundId}
            onChange={(e) => {
              setFundId(e.target.value)
              setPage(0)
            }}
            options={fundOptions}
          />

          <Select
            aria-label="Filter by sector"
            value={sectorFilter}
            onChange={(e) => {
              setSectorFilter(e.target.value as SectorFilter)
              setPage(0)
            }}
            options={[
              { value: 'all', label: 'All sectors' },
              ...SECTOR_IDS.map((sid) => ({ value: sid, label: SECTORS[sid].name })),
            ]}
          />

          <Button
            variant={showFilters ? 'primary' : 'secondary'}
            onClick={() => setShowFilters((prev) => !prev)}
            icon={<SlidersHorizontal className="size-3.5" aria-hidden />}
            className="whitespace-nowrap"
          >
            Filters
            {hasActiveFilters ? (
              <span className="ml-1 size-2 rounded-full bg-kumkum-500" aria-hidden />
            ) : null}
          </Button>
        </div>

        {/* Secondary Expandable Filter Bar */}
        {showFilters ? (
          <div className="pt-2 border-t border-navy-100 grid gap-2.5 sm:grid-cols-2 lg:grid-cols-4 items-center">
            {/* Transaction Type */}
            <Select
              size="sm"
              aria-label="Filter by transaction type"
              value={typeFilter}
              onChange={(e) => {
                setTypeFilter(e.target.value as TransactionType)
                setPage(0)
              }}
              options={[
                { value: 'all', label: 'All transaction types' },
                { value: 'payment', label: 'Supplier payments' },
                { value: 'donation', label: 'Donations & receipts' },
                { value: 'allotment', label: 'Fund allotments' },
                { value: 'reversal', label: 'Reversals & refunds' },
                { value: 'csr', label: 'CSR grant receipts' },
                { value: 'opening', label: 'Opening balances' },
              ]}
            />

            {/* Date Range */}
            <Select
              size="sm"
              aria-label="Filter by date range"
              value={dateRange}
              onChange={(e) => {
                setDateRange(e.target.value as DateRange)
                setPage(0)
              }}
              options={[
                { value: 'all', label: 'All time' },
                { value: '7d', label: 'Last 7 days' },
                { value: '30d', label: 'Last 30 days' },
                { value: '90d', label: 'Last 90 days' },
                { value: 'this_year', label: 'Current financial year' },
              ]}
            />

            {/* Balance Status */}
            <Select
              size="sm"
              aria-label="Filter by balance status"
              value={balanceFilter}
              onChange={(e) => {
                setBalanceFilter(e.target.value as BalanceStatus)
                setPage(0)
              }}
              options={[
                { value: 'all', label: 'All balance statuses' },
                { value: 'balanced', label: 'Balanced (Debits = Credits)' },
                { value: 'unbalanced', label: 'Unbalanced / Exceptions' },
              ]}
            />

            {/* Sort order */}
            <Select
              size="sm"
              aria-label="Sort ledger entries"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as SortBy)}
              options={[
                { value: 'date_desc', label: 'Date: Newest first' },
                { value: 'date_asc', label: 'Date: Oldest first' },
                { value: 'amount_desc', label: 'Amount: High to Low' },
                { value: 'amount_asc', label: 'Amount: Low to High' },
              ]}
            />
          </div>
        ) : null}

        {/* Toolbar Footer Actions */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-1 text-[12.5px] text-navy-600">
          <div className="flex items-center gap-2">
            <span>
              Showing <strong className="text-navy-950 font-bold">{sortedEntries.length}</strong> matching transactions
            </span>
            {hasActiveFilters ? (
              <button
                type="button"
                onClick={clearAllFilters}
                className="inline-flex items-center gap-1 font-semibold text-kumkum-600 hover:text-kumkum-700 transition-colors"
              >
                <RotateCcw className="size-3" aria-hidden />
                Clear all filters
              </button>
            ) : null}
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={expandedIds.size > 0 ? collapseAll : expandAll}
              className="font-medium text-navy-700 hover:text-navy-950 transition-colors cursor-pointer"
            >
              {expandedIds.size > 0 ? 'Collapse all lines' : 'Expand all accounting lines'}
            </button>
          </div>
        </div>
      </div>

      {/* C. LEDGER TRANSACTION LIST */}
      {!db.ready ? (
        <div className="flex flex-col gap-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-20 w-full rounded-xl" />
          ))}
        </div>
      ) : sortedEntries.length === 0 ? (
        <EmptyState
          title="No ledger entries found"
          message="No financial records match your selected filters. Try broadening your search or clearing active filters."
          action={
            <Button variant="secondary" onClick={clearAllFilters}>
              Reset all filters
            </Button>
          }
        />
      ) : (
        <div className="space-y-3">
          <ul className="flex flex-col gap-2.5">
            {paged.map((entry) => {
              const debitTotal = entry.lines.reduce((s, l) => s + l.debit, 0)
              const creditTotal = entry.lines.reduce((s, l) => s + l.credit, 0)
              const isBalanced = debitTotal === creditTotal && debitTotal > 0
              const primaryAmount = Math.max(debitTotal, creditTotal)
              const isExpanded = expandedIds.has(entry.id)
              const primaryFundId = entry.lines[0]?.fundId ?? ''
              const fundLabel = getFundLabel(primaryFundId)

              return (
                <li
                  key={entry.id}
                  className="overflow-hidden rounded-xl border border-navy-100/90 bg-white shadow-2xs hover:border-navy-200 transition-all duration-150"
                >
                  {/* Summary Header Row (Compact & Scannable) */}
                  <div
                    onClick={() => toggleExpand(entry.id)}
                    className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 sm:p-4 cursor-pointer hover:bg-navy-50/30 transition-colors select-none"
                  >
                    {/* Left: Indicator, Title & References */}
                    <div className="flex items-start gap-3 min-w-0 flex-1">
                      <button
                        type="button"
                        aria-label={isExpanded ? 'Collapse transaction details' : 'Expand transaction details'}
                        className="mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-md border border-navy-200 bg-white text-navy-600 transition-transform duration-150"
                      >
                        <ChevronRight
                          className={`size-3.5 transition-transform duration-200 ${isExpanded ? 'rotate-90' : ''}`}
                          aria-hidden
                        />
                      </button>

                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <h4 className="font-semibold text-[14.5px] text-navy-950 tracking-tight leading-snug">
                            {entry.memo}
                          </h4>
                          {entry.reversalOf ? (
                            <span className="inline-flex items-center gap-1 rounded-full bg-danger-50 border border-danger-200/80 px-2 py-0.5 text-[11px] font-bold text-danger-700">
                              <Undo2 className="size-2.5" aria-hidden />
                              Reversal
                            </span>
                          ) : null}
                        </div>

                        <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 font-mono text-[11.5px] text-navy-600">
                          <span className="font-semibold text-navy-800">{entry.id}</span>
                          <span className="text-navy-300">·</span>
                          <span>source {entry.sourceRef}</span>
                          <span className="text-navy-300">·</span>
                          <span className="text-navy-500">{formatDate(entry.date)}</span>
                        </div>
                      </div>
                    </div>

                    {/* Right: Sector, Fund, Amount & Status */}
                    <div className="flex items-center justify-between sm:justify-end gap-3 sm:gap-4 shrink-0 border-t sm:border-t-0 pt-2 sm:pt-0 border-navy-100">
                      <div className="flex items-center gap-2">
                        <SectorChip sectorId={entry.sectorId} />
                        <span
                          title={fundLabel}
                          className="hidden md:inline-block max-w-[140px] truncate rounded-md bg-navy-50 px-2 py-0.5 text-[11.5px] font-medium text-navy-700 border border-navy-100"
                        >
                          {fundLabel}
                        </span>
                      </div>

                      {/* Prominent Amount */}
                      <div className="text-right min-w-[100px]">
                        <Money
                          value={primaryAmount}
                          className="font-heritage text-[17px] font-bold text-navy-950 tabular-nums"
                        />
                      </div>

                      {/* Balanced Badge */}
                      <div className="shrink-0 min-w-[110px] text-right">
                        {isBalanced ? (
                          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 border border-emerald-200/80 px-2.5 py-0.5 text-[11.5px] font-bold text-emerald-800">
                            <Check className="size-3 stroke-[2.5]" aria-hidden />
                            Debits = Credits
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 border border-amber-200 px-2.5 py-0.5 text-[11.5px] font-bold text-amber-800">
                            <AlertCircle className="size-3" aria-hidden />
                            Unbalanced
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Expanded Detail View: Full Accounting Entries */}
                  {isExpanded ? (
                    <div className="border-t border-navy-100 bg-navy-50/40 p-4 animate-in fade-in-0 duration-150">
                      {/* Explanatory accounting guidance bar */}
                      <div className="mb-3 flex items-start gap-2 rounded-lg border border-navy-100 bg-white p-2.5 text-[12px] text-navy-700">
                        <Info className="size-4 shrink-0 text-navy-500 mt-0.5" aria-hidden />
                        <div>
                          <strong className="text-navy-900 font-semibold">Accounting Double-Entry Rules: </strong>
                          Debits record expense increases or asset receipts; Credits record revenue earnings or cash disbursements from bank accounts.
                        </div>
                      </div>

                      {/* Journal Lines Table */}
                      <div className="overflow-hidden rounded-lg border border-navy-200/90 bg-white shadow-2xs">
                        <div className="scrollbar-thin overflow-x-auto">
                          <table className="w-full border-collapse text-[13.5px]">
                            <thead>
                              <tr className="border-b border-navy-100 bg-navy-50/70 text-[11px] font-bold uppercase tracking-[0.1em] text-navy-600">
                                <th className="px-3.5 py-2.5 text-left">Account</th>
                                <th className="px-3.5 py-2.5 text-left">Fund Allocation</th>
                                <th className="px-3.5 py-2.5 text-left">Accounting Impact</th>
                                <th className="px-3.5 py-2.5 text-right">Debit</th>
                                <th className="px-3.5 py-2.5 text-right">Credit</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-navy-100">
                              {entry.lines.map((line, idx) => {
                                const lineFundName = getFundLabel(line.fundId)
                                const impactDescription = getAccountImpact(line.account, line.debit, line.credit)

                                return (
                                  <tr key={idx} className="hover:bg-navy-50/30 transition-colors">
                                    <td className="px-3.5 py-2.5 font-semibold text-navy-950">
                                      {line.account}
                                    </td>
                                    <td className="px-3.5 py-2.5 text-navy-700">
                                      <span className="font-mono text-[12px] font-medium text-navy-600 block">
                                        {line.fundId}
                                      </span>
                                      <span className="text-[11.5px] text-navy-500 truncate max-w-[200px] block">
                                        {lineFundName}
                                      </span>
                                    </td>
                                    <td className="px-3.5 py-2.5 text-[12.5px] text-navy-600">
                                      {impactDescription}
                                    </td>
                                    <td className="px-3.5 py-2.5 text-right font-mono font-medium text-navy-950 tabular-nums">
                                      {line.debit > 0 ? (
                                        <Money value={line.debit} />
                                      ) : (
                                        <span className="text-navy-300">—</span>
                                      )}
                                    </td>
                                    <td className="px-3.5 py-2.5 text-right font-mono font-medium text-navy-950 tabular-nums">
                                      {line.credit > 0 ? (
                                        <Money value={line.credit} />
                                      ) : (
                                        <span className="text-navy-300">—</span>
                                      )}
                                    </td>
                                  </tr>
                                )
                              })}
                            </tbody>
                            <tfoot>
                              <tr className="border-t-2 border-navy-200 bg-navy-50/80 font-semibold text-navy-950">
                                <td colSpan={3} className="px-3.5 py-2.5">
                                  <div className="flex items-center gap-2">
                                    {isBalanced ? (
                                      <span className="inline-flex items-center gap-1 text-[12px] text-emerald-800 font-bold">
                                        <Check className="size-3.5 text-emerald-600 stroke-[2.5]" aria-hidden />
                                        Debits and credits match perfectly (Balanced)
                                      </span>
                                    ) : (
                                      <span className="inline-flex items-center gap-1 text-[12px] text-amber-800 font-bold">
                                        <AlertCircle className="size-3.5 text-amber-600" aria-hidden />
                                        Out of balance by {formatMoney(Math.abs(debitTotal - creditTotal))}
                                      </span>
                                    )}
                                  </div>
                                </td>
                                <td className="px-3.5 py-2.5 text-right font-mono font-bold text-navy-950 tabular-nums">
                                  <Money value={debitTotal} />
                                </td>
                                <td className="px-3.5 py-2.5 text-right font-mono font-bold text-navy-950 tabular-nums">
                                  <Money value={creditTotal} />
                                </td>
                              </tr>
                            </tfoot>
                          </table>
                        </div>
                      </div>

                      {/* Reversal audit note */}
                      {entry.reversalOf ? (
                        <p className="mt-2 text-[12px] text-danger-700 flex items-center gap-1.5 font-medium">
                          <Undo2 className="size-3" aria-hidden />
                          This entry is an append-only reversal of transaction <code>{entry.reversalOf}</code>.
                        </p>
                      ) : null}
                    </div>
                  ) : null}
                </li>
              )
            })}
          </ul>

          {/* D. PAGINATION FOOTER */}
          <nav
            className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 border-t border-navy-100"
            aria-label="Pagination"
          >
            <p className="text-[13px] text-navy-600">
              Showing <span className="font-semibold text-navy-950">{page * PAGE_SIZE + 1}</span>–
              <span className="font-semibold text-navy-950">
                {Math.min(sortedEntries.length, (page + 1) * PAGE_SIZE)}
              </span>{' '}
              of <span className="font-semibold text-navy-950">{sortedEntries.length.toLocaleString()}</span> entries
              {' · '}
              <span className="font-semibold text-navy-950">{formatMoney(summary.totalDebits)}</span> total debited in view
            </p>

            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant="secondary"
                disabled={page === 0}
                onClick={() => setPage((p) => p - 1)}
              >
                Previous
              </Button>
              <span className="text-[12.5px] font-medium text-navy-600 px-1">
                Page {page + 1} of {Math.max(1, Math.ceil(sortedEntries.length / PAGE_SIZE))}
              </span>
              <Button
                size="sm"
                variant="secondary"
                disabled={(page + 1) * PAGE_SIZE >= sortedEntries.length}
                onClick={() => setPage((p) => p + 1)}
              >
                Next
              </Button>
            </div>
          </nav>
        </div>
      )}
    </div>
  )
}
