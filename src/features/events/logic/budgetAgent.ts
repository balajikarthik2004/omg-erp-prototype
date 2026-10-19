import { formatMoneyShort } from '@/lib/format'
import type { CategoryActual, EventRecord, EventsData, Money } from '@/types'
import { roundToNearest, DEFAULT_SUGGESTION } from './budget'
import { detectRecurrence, type PriorEdition, type Recurrence } from './recurrence'

/**
 * The budget agent for recurring events.
 *
 * It reads every earlier edition line by line — what was budgeted against what
 * was actually paid — and reports the things a formula on a single category
 * cannot see: a cost line that every past edition had and this draft forgot,
 * and a line whose budget never matches what it really costs.
 *
 * The division of labour is the one `budget.ts` already sets out: **the agent
 * computes every amount arithmetically from recorded spend, and an advisor only
 * ever writes the words.** `BudgetAdvisor` is the seam — `templateAdvisor`
 * fills it in now, and a model-backed one can take its place without any
 * number in here changing. Nothing is ever applied on its own; each finding is
 * a suggestion a person accepts or ignores.
 */

export type FindingKind = 'missing_line' | 'stale_line' | 'underspend' | 'overspend'
export type Severity = 'high' | 'medium' | 'low'

/**
 * One year's figures for one cost line. Every claim the agent makes points back
 * at these.
 *
 * `budget` is only known when a closed edition recorded it. The ERP also keeps
 * `eventActuals` — spend per event type, year and category, with no budget
 * beside it — which is enough to notice a missing cost line but not enough to
 * say anything about over- or under-spending.
 */
export interface Evidence {
  year: number
  budget?: Money
  spent: Money
}

export interface BudgetFinding {
  id: string
  kind: FindingKind
  category: string
  severity: Severity
  evidence: Evidence[]
  /** What to put in the Requested box if the finding is accepted. Always arithmetic, never prose. */
  suggestedAmount?: Money
  /** The amount in the draft now, for the lines that already exist. */
  currentAmount?: Money
  headline: string
  detail: string
  action?: string
}

export interface BudgetAdvice {
  recurring: boolean
  sameSeries: boolean
  editionsAnalysed: number
  years: number[]
  findings: BudgetFinding[]
  summary: string
  /** Which advisor wrote the words, so the UI can say so. */
  advisorId: string
}

/* ------------------------------------------------------------- thresholds */

export interface AgentConfig {
  /** Spend below budget by at least this share counts as under-used. */
  underspendRatio: number
  /** Spend above budget by at least this share counts as overrun. */
  overspendRatio: number
  /** A line must appear in at least this share of editions before a gap is worth raising. */
  missingAppearance: number
  /** Rounding step for every amount the agent puts forward, in cents. */
  roundTo: number
}

export const DEFAULT_AGENT: AgentConfig = {
  underspendRatio: 0.15,
  overspendRatio: 0.05,
  missingAppearance: 0.6,
  roundTo: DEFAULT_SUGGESTION.roundTo,
}

/* ---------------------------------------------------------------- advisor */

export interface AdviceContext {
  event: EventRecord
  recurrence: Recurrence
  /** Every year the agent found a record for, closed editions and actuals together. */
  years: number[]
}

/** The numbers of a finding, before anyone has put them into words. */
export type RawFinding = Omit<BudgetFinding, 'headline' | 'detail' | 'action'>

export interface BudgetAdvisor {
  readonly id: string
  describe(finding: RawFinding, ctx: AdviceContext): { headline: string; detail: string; action?: string }
  summarise(findings: RawFinding[], ctx: AdviceContext): string
}

const years = (e: Evidence[]) => e.map((x) => x.year).join(', ')
const pct = (n: number) => `${Math.round(Math.abs(n) * 100)}%`

/**
 * What to call the events being compared against.
 *
 * Only a name match earns the word "edition". Where the match is the event type
 * alone — a Thirukalyanam measured against a Vinayagar Chaturthi, both FESTIVAL
 * — saying "earlier edition" would claim a continuity that is not there, and an
 * approver reading it would weigh the finding more heavily than it deserves.
 */
function priorNoun(ctx: AdviceContext, n: number): string {
  const plural = n !== 1
  if (ctx.recurrence.sameSeries) return plural ? `${n} earlier editions` : 'the last edition'
  const kind = ctx.event.eventType.replace(/_/g, ' ').toLowerCase()
  if (ctx.recurrence.editions.length > 0) return plural ? `${n} earlier ${kind} events` : `the last ${kind} event`
  return plural ? `${n} recorded ${kind} budgets` : `the one recorded ${kind} budget`
}

/** Plain sentences built from the figures. No model, no network, same words every time. */
export const templateAdvisor: BudgetAdvisor = {
  id: 'template',

  describe(f, ctx) {
    const n = f.evidence.length
    const editions = priorNoun(ctx, n)

    if (f.kind === 'missing_line') {
      const avg = f.evidence.reduce((s, e) => s + e.spent, 0) / n
      return {
        headline: `"${f.category}" is missing from this budget`,
        detail: `${formatMoneyShort(avg)} a year on average, across ${editions} (${years(f.evidence)}). Nothing in this draft covers it.`,
        action: f.suggestedAmount ? `Add it at ${formatMoneyShort(f.suggestedAmount)}` : undefined,
      }
    }

    if (f.kind === 'stale_line') {
      return {
        headline: `"${f.category}" has no spending behind it`,
        detail: f.evidence.length === 0
          ? 'Nothing comparable budgeted for it before. Worth confirming it is still needed.'
          : `Budgeted in ${years(f.evidence)} but nothing was ever paid against it. It may no longer be needed.`,
      }
    }

    const judged = withBudget(f.evidence)
    const totalBudget = judged.reduce((s, e) => s + e.budget, 0)
    const totalSpent = judged.reduce((s, e) => s + e.spent, 0)
    const gap = totalBudget > 0 ? (totalSpent - totalBudget) / totalBudget : 0

    if (f.kind === 'underspend') {
      return {
        headline: `"${f.category}" is budgeted higher than it costs`,
        detail: `Across ${editions} (${years(f.evidence)}) only ${formatMoneyShort(totalSpent)} of ${formatMoneyShort(totalBudget)} was spent — ${pct(gap)} under budget.`,
        action: f.suggestedAmount ? `Trim to ${formatMoneyShort(f.suggestedAmount)}` : undefined,
      }
    }

    return {
      headline: `"${f.category}" runs over its budget`,
      detail: `Across ${editions} (${years(f.evidence)}) ${formatMoneyShort(totalSpent)} was spent against ${formatMoneyShort(totalBudget)} budgeted — ${pct(gap)} over.`,
      action: f.suggestedAmount ? `Raise to ${formatMoneyShort(f.suggestedAmount)}` : undefined,
    }
  },

  summarise(findings, ctx) {
    const past = priorNoun(ctx, ctx.recurrence.editions.length || ctx.years.length)
    if (findings.length === 0) {
      return `Checked this draft against ${past}. Nothing stands out — the cost lines and their amounts match what has actually been spent.`
    }
    const counts = findings.reduce<Record<FindingKind, number>>(
      (acc, f) => ({ ...acc, [f.kind]: (acc[f.kind] ?? 0) + 1 }),
      {} as Record<FindingKind, number>,
    )
    const bits = [
      counts.missing_line && `${counts.missing_line} missing cost ${counts.missing_line === 1 ? 'line' : 'lines'}`,
      counts.overspend && `${counts.overspend} that ${counts.overspend === 1 ? 'runs' : 'run'} over`,
      counts.underspend && `${counts.underspend} budgeted too high`,
      counts.stale_line && `${counts.stale_line} with nothing spent behind ${counts.stale_line === 1 ? 'it' : 'them'}`,
    ].filter(Boolean)
    return `Compared against ${past}: ${bits.join(', ')}. Every amount below comes from what was actually paid — you decide which to take.`
  },
}

/* ----------------------------------------------------------------- agent */

interface CategoryRun {
  category: string
  evidence: Evidence[]
  /** Distinct years the line shows up in. */
  appearances: number
}

/**
 * Every cost line this event type has a record of.
 *
 * Closed editions come first because they carry both halves of the story, what
 * was set aside and what was paid. `eventActuals` fills in the years no edition
 * covers — the ERP has kept that history all along, and ignoring it would make
 * the agent silent on exactly the first-draft budgets it is most useful for.
 */
function collate(editions: PriorEdition[], actuals: CategoryActual[]): Map<string, CategoryRun> {
  const runs = new Map<string, CategoryRun>()

  const put = (category: string, evidence: Evidence) => {
    const key = category.trim().toLowerCase()
    const run = runs.get(key) ?? { category: category.trim(), evidence: [], appearances: 0 }
    if (run.evidence.some((e) => e.year === evidence.year)) return
    run.evidence.push(evidence)
    run.appearances += 1
    runs.set(key, run)
  }

  for (const edition of editions) {
    for (const line of edition.pnl.lines) {
      put(line.category, { year: edition.year, budget: line.budget, spent: line.spent })
    }
  }
  for (const a of actuals) {
    put(a.category, { year: a.year, spent: a.actual })
  }

  for (const run of runs.values()) run.evidence.sort((a, b) => a.year - b.year)
  return runs
}

/** Evidence rich enough to judge a budget against — a closed edition recorded both numbers. */
const withBudget = (evidence: Evidence[]) =>
  evidence.filter((e): e is Evidence & { budget: Money } => e.budget !== undefined && e.budget > 0)

/** Mean actual spend, rounded — the basis for every amount the agent proposes. */
function fromActuals(evidence: Evidence[], cfg: AgentConfig): Money | undefined {
  const spending = evidence.filter((e) => e.spent > 0)
  if (spending.length === 0) return undefined
  const mean = spending.reduce((s, e) => s + e.spent, 0) / spending.length
  return roundToNearest(mean, cfg.roundTo)
}

export interface DraftLine {
  category: string
  /** What the Requested box holds right now, in cents. */
  requested: Money
}

/**
 * Reviews a budget draft against the event's earlier editions.
 *
 * Returns nothing of substance when the event has no history — a first-time
 * event has nothing to be compared with, and inventing a comparison would be
 * worse than staying quiet.
 */
export function analyseBudget(
  data: EventsData,
  event: EventRecord,
  draft: DraftLine[],
  options: { advisor?: BudgetAdvisor; config?: Partial<AgentConfig> } = {},
): BudgetAdvice {
  const advisor = options.advisor ?? templateAdvisor
  const cfg = { ...DEFAULT_AGENT, ...options.config }
  const recurrence = detectRecurrence(data, event)

  // Strictly earlier years only. An event that has already closed has written its
  // own spend into `eventActuals`, and without this it would be measured against itself.
  const thisYear = new Date(event.startAt).getFullYear()
  const actuals = data.eventActuals.filter((a) => a.eventType === event.eventType && a.year < thisYear)
  const runs = collate(recurrence.editions, actuals)
  const years = [...new Set([...recurrence.editions.map((e) => e.year), ...actuals.map((a) => a.year)])].sort()
  const ctx: AdviceContext = { event, recurrence, years }

  const base = {
    recurring: runs.size > 0,
    sameSeries: recurrence.sameSeries,
    editionsAnalysed: recurrence.editions.length,
    years,
    advisorId: advisor.id,
  }

  if (runs.size === 0) {
    return {
      ...base,
      findings: [],
      summary: 'Nothing comparable has been run and closed before, so there is no history to check this budget against.',
    }
  }

  const drafted = new Set(draft.map((d) => d.category.trim().toLowerCase()))
  const total = years.length
  const raw: RawFinding[] = []

  /* a line every past edition had, that this draft does not */
  for (const [key, run] of runs) {
    if (drafted.has(key)) continue
    if (run.appearances / total < cfg.missingAppearance) continue
    const spending = run.evidence.filter((e) => e.spent > 0)
    if (spending.length === 0) continue
    raw.push({
      id: `missing-${key}`,
      kind: 'missing_line',
      category: run.category,
      severity: run.appearances === total ? 'high' : 'medium',
      evidence: spending,
      suggestedAmount: fromActuals(spending, cfg),
    })
  }

  /* lines in the draft, judged against what they really cost */
  for (const line of draft) {
    const key = line.category.trim().toLowerCase()
    const run = runs.get(key)

    if (!run) continue // no history: the per-line formula already says so

    const spending = run.evidence.filter((e) => e.spent > 0)
    if (spending.length === 0) {
      raw.push({
        id: `stale-${key}`,
        kind: 'stale_line',
        category: line.category,
        severity: 'low',
        evidence: run.evidence,
        currentAmount: line.requested,
      })
      continue
    }

    // Over- and under-spending can only be judged where a budget was recorded
    // alongside the spend. Actuals-only years say what was paid, not what was allowed.
    const judgeable = withBudget(spending)
    if (judgeable.length === 0) continue

    const budgeted = judgeable.reduce((s, e) => s + e.budget, 0)
    const spent = judgeable.reduce((s, e) => s + e.spent, 0)
    const gap = (spent - budgeted) / budgeted
    const proposed = fromActuals(judgeable, cfg)

    if (gap <= -cfg.underspendRatio) {
      raw.push({
        id: `under-${key}`,
        kind: 'underspend',
        category: line.category,
        severity: judgeable.length > 1 && gap <= -0.25 ? 'medium' : 'low',
        evidence: judgeable,
        // Only worth raising if it would actually bring the number down.
        suggestedAmount: proposed !== undefined && proposed < line.requested ? proposed : undefined,
        currentAmount: line.requested,
      })
    } else if (gap >= cfg.overspendRatio) {
      raw.push({
        id: `over-${key}`,
        kind: 'overspend',
        category: line.category,
        severity: gap >= 0.2 ? 'high' : 'medium',
        evidence: judgeable,
        suggestedAmount: proposed !== undefined && proposed > line.requested ? proposed : undefined,
        currentAmount: line.requested,
      })
    }
  }

  const rank: Record<Severity, number> = { high: 0, medium: 1, low: 2 }
  raw.sort((a, b) => rank[a.severity] - rank[b.severity] || a.category.localeCompare(b.category))

  return {
    ...base,
    findings: raw.map((f) => ({ ...f, ...advisor.describe(f, ctx) })),
    summary: advisor.summarise(raw, ctx),
  }
}
