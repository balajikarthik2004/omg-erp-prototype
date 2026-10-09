import {
  AlertTriangle,
  CheckCircle2,
  CircleDot,
  FileText,
  Hourglass,
  Info,
  Lock,
  type LucideIcon,
} from 'lucide-react'

export type StatusTone = 'draft' | 'pending' | 'done' | 'committed' | 'danger' | 'info'

export interface StatusStyle {
  label: string
  tone: StatusTone
  className: string
  icon: LucideIcon
  /** For a small leading dot in dense tables. */
  dotClass: string
}

const TONES: Record<StatusTone, { className: string; icon: LucideIcon; dotClass: string }> = {
  draft: {
    className: 'bg-sandal-100 text-stone-700 border-sandal-200',
    icon: FileText,
    dotClass: 'bg-stone-500',
  },
  pending: {
    className: 'bg-marigold-50 text-marigold-500 border-marigold-50',
    icon: CircleDot,
    dotClass: 'bg-marigold-500',
  },
  done: {
    className: 'bg-tulsi-50 text-tulsi-700 border-tulsi-50',
    icon: CheckCircle2,
    dotClass: 'bg-tulsi-500',
  },
  committed: {
    className: 'bg-turmeric-50 text-turmeric-700 border-turmeric-100',
    icon: Lock,
    dotClass: 'bg-turmeric-500',
  },
  danger: {
    className: 'bg-danger-50 text-danger-600 border-danger-50',
    icon: AlertTriangle,
    dotClass: 'bg-danger-600',
  },
  info: {
    className: 'bg-peacock-50 text-peacock-700 border-peacock-50',
    icon: Info,
    dotClass: 'bg-peacock-500',
  },
}

/** Every status string in the app maps to exactly one tone + label here. */
const MAP: Record<string, { label: string; tone: StatusTone; icon?: LucideIcon }> = {
  // flow alignment
  awaiting_webhook: { label: 'Awaiting Square', tone: 'pending', icon: Hourglass },
  awaiting_release: { label: 'Approved, awaiting release', tone: 'committed' },
  open: { label: 'Open', tone: 'info' },
  confirmed: { label: 'Confirmed', tone: 'done' },
  live: { label: 'Live', tone: 'done' },

  // generic
  draft: { label: 'Draft', tone: 'draft' },
  pending: { label: 'Pending approval', tone: 'pending' },
  pending_ca: { label: 'Awaiting CA', tone: 'pending', icon: Hourglass },
  payment_pending: { label: 'Payment pending', tone: 'pending', icon: Hourglass },
  escalated: { label: 'Escalated', tone: 'pending' },
  approved: { label: 'Approved', tone: 'done' },
  rejected: { label: 'Rejected', tone: 'danger' },
  cancelled: { label: 'Cancelled', tone: 'danger' },

  // donations
  paid: { label: 'Paid', tone: 'done' },
  receipted: { label: 'Receipted', tone: 'done' },
  reconciled: { label: 'Reconciled', tone: 'done' },
  allotted: { label: 'Allotted', tone: 'done' },
  refunded: { label: 'Refunded', tone: 'danger' },
  failed: { label: 'Failed', tone: 'danger' },
  disputed: { label: 'Disputed', tone: 'danger' },

  // purchase orders
  sent: { label: 'Sent', tone: 'info' },
  partially_received: { label: 'Partially received', tone: 'info' },
  received: { label: 'Received', tone: 'done' },
  invoiced: { label: 'Invoiced', tone: 'info' },
  closed: { label: 'Closed', tone: 'done' },
  committed: { label: 'Committed', tone: 'committed' },

  // invoices / matching
  matched: { label: 'Matched', tone: 'done' },
  variance: { label: 'Price mismatch', tone: 'danger' },
  unmatched: { label: 'Unmatched', tone: 'danger' },
  partial: { label: 'Partially matched', tone: 'info' },

  // budgets, suppliers, stock
  over_budget: { label: 'Over budget', tone: 'danger' },
  near_limit: { label: 'Near limit', tone: 'pending' },
  healthy: { label: 'Healthy', tone: 'done' },
  active: { label: 'Active', tone: 'done' },
  blocked: { label: 'Blocked', tone: 'danger' },
  low_stock: { label: 'Low stock', tone: 'danger' },
  in_stock: { label: 'In stock', tone: 'done' },
  overdue: { label: 'Overdue', tone: 'danger' },
}

/** The one place a status becomes colour. Never style a status inline. */
export function statusStyle(status: string): StatusStyle {
  const entry = MAP[status]
  const tone = entry?.tone ?? 'draft'
  const base = TONES[tone]
  return {
    label: entry?.label ?? status.replace(/[_-]+/g, ' ').replace(/^\w/, (c) => c.toUpperCase()),
    tone,
    className: base.className,
    icon: entry?.icon ?? base.icon,
    dotClass: base.dotClass,
  }
}

export function statusTone(status: string): StatusTone {
  return MAP[status]?.tone ?? 'draft'
}
