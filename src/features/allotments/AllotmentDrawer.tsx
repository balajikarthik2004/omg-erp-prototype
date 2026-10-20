import { useState } from 'react'
import { ShieldCheck } from 'lucide-react'

import { approvalTierLabel } from '@/config'
import { formatAge, formatDate, titleCase } from '@/lib/format'
import { userName } from '@/mock/seed'
import { approvalBlock, available, useDb } from '@/store/db'
import { currentUser, useSession } from '@/store/session'
import type { Allotment } from '@/types'

import { Drawer } from '@/components/ui/Drawer'
import { Money } from '@/components/ui/Money'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { SectorChip } from '@/components/layout/PhaseChip'
import { ApprovalTimeline } from '@/components/flow/ApprovalTimeline'
import { DecisionFooter } from '@/components/flow/DecisionFooter'
import { AllotmentTransfer } from './AllotmentTransfer'
import { AllotmentEffect } from './AllotmentEffect'

export function AllotmentDrawer({ allotment, onClose }: { allotment?: Allotment; onClose: () => void }) {
  const db = useDb()
  const personaId = useSession((s) => s.personaId)
  const user = currentUser(personaId)
  const decideAllotment = useDb((s) => s.decideAllotment)
  const [comment, setComment] = useState('')

  const head = allotment ? db.budgets.find((b) => b.id === allotment.toBudgetHeadId) : undefined
  const fund = allotment ? db.funds.find((f) => f.id === allotment.fromFundId) : undefined
  const block = allotment ? approvalBlock(user, allotment.preparedBy, allotment.amount, allotment.approvals) : null

  const close = () => {
    setComment('')
    onClose()
  }

  const decide = (decision: 'approved' | 'rejected') => {
    if (!allotment) return
    decideAllotment(allotment.id, decision, user, comment || undefined)
    close()
  }

  return (
    <Drawer
      open={Boolean(allotment)}
      onClose={close}
      accent="kumkum"
      tone="canvas"
      width="lg"
      title={head ? `Allot to ${head.name}` : 'Allotment'}
      subtitle={
        allotment
          ? `${allotment.id} · prepared ${formatDate(allotment.preparedAt)} by ${userName(allotment.preparedBy)}`
          : undefined
      }
      headerExtra={
        allotment ? (
          <>
            <StatusBadge status={allotment.status} />
            <SectorChip sectorId={allotment.sectorId} />
            <span className="text-[12px] text-stone-500">{formatAge(allotment.preparedAt)}</span>
          </>
        ) : null
      }
      footer={
        allotment?.status === 'pending' ? (
          <DecisionFooter
            preparedBy={allotment.preparedBy}
            block={block}
            comment={comment}
            onCommentChange={setComment}
            approveLabel="Approve allotment"
            onApprove={() => decide('approved')}
            onReject={() => decide('rejected')}
          />
        ) : null
      }
    >
      {allotment ? (
        <div className="flex flex-col gap-6">
          {/* The figure under decision, given the weight it carries. A white
              card on the tinted canvas rather than a tinted one: a pink fill
              reads as an error, and this is the headline, not an alarm. */}
          <div className="relative overflow-hidden rounded-card border border-sandal-200 bg-sandal-50 px-5 py-4 shadow-card">
            <span className="absolute inset-y-0 left-0 w-1 bg-kumkum-600" aria-hidden />
            <div className="flex flex-wrap items-end justify-between gap-x-4 gap-y-2">
              <div>
                <p className="text-[11px] font-semibold tracking-[0.12em] text-stone-500 uppercase">Amount to allot</p>
                <Money
                  value={allotment.amount}
                  exact
                  className="mt-1 block font-display text-[26px] font-bold text-stone-900 sm:text-[32px]"
                />
              </div>
              <span className="mb-1 inline-flex items-center gap-1.5 rounded-full bg-kumkum-50 px-2.5 py-1 text-[12px] font-medium text-kumkum-700">
                <ShieldCheck className="size-3.5" aria-hidden />
                {approvalTierLabel(allotment.amount)}
              </span>
            </div>
          </div>

          {fund && head ? (
            <AllotmentTransfer
              fromName={fund.name}
              fromLabel={`${titleCase(fund.type)} fund`}
              fromBefore={fund.balance}
              toName={head.name}
              toLabel={head.period}
              toBefore={available(head)}
              amount={allotment.amount}
            />
          ) : null}

          <section>
            <h3 className="mb-2 text-[11px] font-semibold tracking-[0.12em] text-stone-500 uppercase">Reason given</h3>
            <blockquote className="relative rounded-card border border-sandal-200 bg-sandal-50 py-3 pr-4 pl-5 shadow-flat">
              <span className="absolute inset-y-3 left-0 w-0.5 rounded-full bg-sandal-300" aria-hidden />
              <p className="text-[14px] leading-relaxed text-stone-700 italic">{allotment.reason}</p>
              <footer className="mt-1.5 text-[12px] text-stone-500 not-italic">
                &mdash; {userName(allotment.preparedBy)}
              </footer>
            </blockquote>
          </section>

          {head ? <AllotmentEffect head={head} amount={allotment.amount} /> : null}

          <section className="rounded-card border border-sandal-200 bg-sandal-50 p-4 shadow-flat">
            <ApprovalTimeline steps={allotment.approvals} amount={allotment.amount} />
          </section>
        </div>
      ) : null}
    </Drawer>
  )
}
