import { useState } from 'react'

import { Button } from '@/components/ui/Button'
import { Textarea } from '@/components/ui/Input'
import { MakerCheckerNote } from '@/components/flow/MakerCheckerNote'
import { useDb } from '@/store/db'
import { currentUser, useSession } from '@/store/session'
import { gateBlock } from './logic/rules'
import { isAdmin } from './logic/stateMachine'
import type { EventView } from './useEvent'

/** Approve or send back a chosen poster. A different admin from whoever chose it. */
export function PosterDecisionPanel({ view }: { view: EventView }) {
  const { event } = view
  const personaId = useSession((s) => s.personaId)
  const user = currentUser(personaId)
  const decidePoster = useDb((s) => s.decidePoster)
  const [comment, setComment] = useState('')
  const [error, setError] = useState<string>()
  const approveBlock = gateBlock(event, { type: 'APPROVE_POSTER' }, user)

  const run = (decision: 'approved' | 'rejected') => {
    const r = decidePoster(event.id, decision, user, comment)
    setError(r.ok ? undefined : r.error)
    if (r.ok) setComment('')
  }

  return (
    <div className="flex flex-col gap-3">
      <MakerCheckerNote preparedBy={event.lastPreparerId ?? event.createdBy} block={approveBlock} />
      <Textarea label="Comment" placeholder="Required when sending the poster back." value={comment} onChange={(e) => { setComment(e.target.value); setError(undefined) }} />
      {error ? <p role="alert" className="text-[13px] text-danger-600">{error}</p> : null}
      <div className="flex flex-wrap gap-2">
        <Button variant="success" disabled={Boolean(approveBlock)} title={approveBlock ?? undefined} onClick={() => run('approved')}>Approve and publish</Button>
        <Button variant="secondary" disabled={!isAdmin(user) || comment.trim().length < 5} title={isAdmin(user) ? 'Add a comment explaining why.' : 'Only a Sector Admin decides on a poster.'} onClick={() => run('rejected')}>Send back</Button>
      </div>
    </div>
  )
}
