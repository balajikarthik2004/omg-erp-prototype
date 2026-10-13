import { useState } from 'react'

import { Button } from '@/components/ui/Button'
import { Card, CardHeader } from '@/components/ui/Card'
import { Textarea } from '@/components/ui/Input'
import { MakerCheckerNote } from '@/components/flow/MakerCheckerNote'
import { useDb } from '@/store/db'
import { currentUser, useSession } from '@/store/session'
import { gateBlock } from './logic/rules'
import type { EventView } from './useEvent'

/** The two budget gates: the CA reviews, then a Trustee approves, and may approve a different amount per line. */
export function BudgetDecisionPanel({ view, approved }: { view: EventView; approved: Record<string, number> }) {
  const { event } = view
  const personaId = useSession((s) => s.personaId)
  const user = currentUser(personaId)
  const decideBudget = useDb((s) => s.decideBudget)
  const [comment, setComment] = useState('')
  const [error, setError] = useState<string>()

  const trustee = event.status === 'budget_ca_ok'
  const approveBlock = gateBlock(event, trustee ? { type: 'APPROVE_BUDGET_TRUSTEE' } : { type: 'APPROVE_BUDGET_CA' }, user)
  const rejectBlock = gateBlock(event, trustee ? { type: 'REJECT_BUDGET_TRUSTEE', comment: 'x' } : { type: 'REJECT_BUDGET_CA', comment: 'x' }, user)

  function decide(decision: 'approved' | 'rejected') {
    const result = decideBudget(event.id, decision, user, { comment, approvedLines: trustee ? approved : undefined })
    if (!result.ok) setError(result.error)
    else {
      setComment('')
      setError(undefined)
    }
  }

  return (
    <Card accentClass="bg-marigold-500">
      <CardHeader
        title={trustee ? 'Trustee approval' : 'CA review'}
        description={trustee ? 'Approve the budget, changing any line amount in the Approved column first if needed.' : 'Review the lines against the suggestions, then pass it to a Trustee or send it back.'}
      />
      <div className="mt-4 flex flex-col gap-3">
        <MakerCheckerNote preparedBy={event.lastPreparerId ?? event.createdBy} block={approveBlock} />
        <Textarea label="Comment" placeholder="Required when sending the budget back." value={comment} onChange={(e) => { setComment(e.target.value); setError(undefined) }} />
        {error ? <p role="alert" className="text-[13px] text-danger-600">{error}</p> : null}
        <div className="flex flex-wrap gap-2">
          <Button variant="success" disabled={Boolean(approveBlock)} title={approveBlock ?? undefined} onClick={() => decide('approved')}>
            {trustee ? 'Approve budget' : 'Pass to a Trustee'}
          </Button>
          <Button variant="secondary" disabled={Boolean(rejectBlock) || comment.trim().length < 5} title={rejectBlock ?? (comment.trim().length < 5 ? 'Add a comment explaining why.' : undefined)} onClick={() => decide('rejected')}>
            Send back
          </Button>
        </div>
      </div>
    </Card>
  )
}
