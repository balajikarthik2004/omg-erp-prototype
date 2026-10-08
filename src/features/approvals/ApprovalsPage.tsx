import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Boxes, ClipboardCheck, Landmark, Receipt, ShoppingCart, type LucideIcon } from 'lucide-react'

import { cn } from '@/lib/cn'
import { formatAge, formatDue } from '@/lib/format'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { EmptyState } from '@/components/ui/EmptyState'
import { Money } from '@/components/ui/Money'
import { Stat } from '@/components/ui/Stat'
import { Skeleton } from '@/components/ui/Skeleton'
import { Tabs } from '@/components/ui/Tabs'
import { PageHeader } from '@/components/layout/PageHeader'
import { SectorChip } from '@/components/layout/PhaseChip'
import { approvalBlock, roleLabel, useDb } from '@/store/db'
import { currentUser, useSession } from '@/store/session'
import { approvalTasks, approvalsForTask } from '@/store/selectors'
import { userName } from '@/mock/seed'
import type { ApprovalKind, ApprovalTask } from '@/types'

const GROUPS: { kind: ApprovalKind; label: string; icon: LucideIcon }[] = [
  { kind: 'allotment', label: 'Fund allotments', icon: Landmark },
  { kind: 'purchase_order', label: 'Purchase orders', icon: ShoppingCart },
  { kind: 'payment', label: 'Supplier payments', icon: Receipt },
  { kind: 'inventory_request', label: 'Inventory requests', icon: Boxes },
  { kind: 'refund', label: 'Refunds and disputes', icon: Receipt },
]

export function ApprovalsPage() {
  const db = useDb()
  const filter = useSession((s) => s.sectorFilter)
  const personaId = useSession((s) => s.personaId)
  const user = currentUser(personaId)
  const [tab, setTab] = useState('mine')

  const tasks = useMemo(() => (db.ready ? approvalTasks(db, filter) : []), [db, filter])

  const withBlock = useMemo(
    () =>
      tasks.map((task) => ({
        task,
        block: approvalBlock(user, task.preparedBy, task.amount, approvalsForTask(db, task)),
      })),
    [tasks, user, db],
  )

  const mine = withBlock.filter((t) => t.block === null)
  const rows = tab === 'mine' ? mine : withBlock

  const overdue = tasks.filter((t) => formatDue(t.dueAt).overdue).length
  const totalValue = tasks.reduce((s, t) => s + t.amount, 0)

  return (
    <div>
      <PageHeader
        phase="control"
        title="Approvals"
        description={`Everything waiting on a decision. You are signed in as ${roleLabel(user.role)}.`}
      >
        <Tabs
          value={tab}
          onChange={setTab}
          items={[
            { id: 'mine', label: 'Waiting on me', count: mine.length },
            { id: 'all', label: 'Everything pending', count: withBlock.length },
          ]}
        />
      </PageHeader>

      {!db.ready ? (
        <div className="flex flex-col gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-28 w-full" />
          ))}
        </div>
      ) : (
        <div className="flex flex-col gap-6">
          <div className="grid gap-4 sm:grid-cols-3">
            <Stat
              label="Waiting on you"
              value={mine.length}
              sub={`of ${tasks.length} pending in total`}
              accentClass="bg-kumkum-600"
              icon={<ClipboardCheck className="size-4" aria-hidden />}
            />
            <Stat
              label="Overdue"
              value={overdue}
              sub="past their due date"
              accentClass={overdue > 0 ? 'bg-danger-600' : 'bg-tulsi-500'}
            />
            <Stat label="Value held up" value={<Money value={totalValue} />} accentClass="bg-marigold-500" />
          </div>

          {rows.length === 0 ? (
            <EmptyState
              title={tab === 'mine' ? 'Nothing is waiting on you' : 'Nothing is pending'}
              message={
                tab === 'mine'
                  ? 'Either everything is signed off, or the remaining items need a different role. Switch persona in the top bar to see the rest.'
                  : 'Every allotment, order and payment has been decided.'
              }
            />
          ) : (
            GROUPS.map((group) => {
              const items = rows.filter((r) => r.task.kind === group.kind)
              if (items.length === 0) return null
              const Icon = group.icon
              return (
                <section key={group.kind}>
                  <h2 className="mb-3 flex items-center gap-2 text-[11px] font-semibold tracking-[0.12em] text-stone-500 uppercase">
                    <Icon className="size-4" aria-hidden />
                    {group.label}
                    <span className="font-mono text-stone-700 tabular-nums">({items.length})</span>
                  </h2>
                  <ul className="flex flex-col gap-3">
                    {items.map(({ task, block }) => (
                      <li key={`${task.kind}-${task.id}`}>
                        <TaskRow task={task} block={block} />
                      </li>
                    ))}
                  </ul>
                </section>
              )
            })
          )}
        </div>
      )}
    </div>
  )
}

function TaskRow({ task, block }: { task: ApprovalTask; block: string | null }) {
  const due = formatDue(task.dueAt)
  return (
    <Card
      accentClass={due.overdue ? 'bg-danger-600' : block ? 'bg-sandal-300' : 'bg-turmeric-500'}
      className={cn(due.overdue && 'border-danger-50')}
    >
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-[15px] font-medium text-stone-900">{task.title}</h3>
            <SectorChip sectorId={task.sectorId} />
          </div>
          <p className="mt-1 text-[14px] text-stone-700">{task.subtitle}</p>
          <p className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-[13px]">
            <span className="text-stone-500">
              Prepared by {userName(task.preparedBy)} · {formatAge(task.preparedAt)}
            </span>
            <span className={due.overdue ? 'font-medium text-danger-600' : 'text-stone-500'}>{due.label}</span>
          </p>
          {block ? <p className="mt-2 text-[13px] text-marigold-500">{block}</p> : null}
        </div>

        <div className="flex shrink-0 flex-col items-end gap-2">
          <Money value={task.amount} className="text-[18px]" />
          <Link to={task.href}>
            <Button size="sm" variant={block ? 'secondary' : 'primary'}>
              {block ? 'View' : 'Review and decide'}
            </Button>
          </Link>
        </div>
      </div>
    </Card>
  )
}
