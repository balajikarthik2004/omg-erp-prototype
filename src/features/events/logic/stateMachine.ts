import type { EventApproval, EventRecord, EventStatus, User } from '@/types'

/**
 * The event lifecycle as one deterministic function. Ported from the OMG Events
 * service. Every gate, role check and four-eyes rule lives here, so the UI and
 * the store cannot disagree about what is allowed.
 */

export type EventAction =
  | { type: 'SUBMIT_BUDGET'; totalRequested: number }
  | { type: 'APPROVE_BUDGET_CA'; comment?: string }
  | { type: 'REJECT_BUDGET_CA'; comment: string }
  | { type: 'APPROVE_BUDGET_TRUSTEE'; comment?: string }
  | { type: 'REJECT_BUDGET_TRUSTEE'; comment: string }
  | { type: 'CONFIRM_EVENT'; fundId: string }
  | { type: 'SELECT_POSTER_DESIGN'; designId: string }
  | { type: 'APPROVE_POSTER'; comment?: string }
  | { type: 'REJECT_POSTER'; comment: string }
  | { type: 'START_EVENT' }
  | { type: 'END_EVENT' }
  | { type: 'CLOSE_EVENT'; pnl: EventRecord['closurePnl'] }
  | { type: 'CANCEL_EVENT'; reason: string }
  | { type: 'UPDATE_EVENT_FIELDS'; fields: EditableFields }

export type EditableFields = Partial<
  Pick<
    EventRecord,
    'name' | 'startAt' | 'endAt' | 'venue' | 'chiefGuest' | 'contactName' | 'contactPhone' | 'ticketPrice' | 'capacity' | 'ticketTaxNote'
  >
>

export interface TransitionResult {
  success: boolean
  event: EventRecord
  error?: string
  /** The gate decision to record, when the action was an approval or a rejection. */
  decision?: Omit<EventApproval, 'id' | 'createdAt'>
}

export const isAdmin = (u: User) => u.role === 'sector_admin'
export const isCA = (u: User) => u.role === 'ca_staff' || u.role === 'ca_partner'
export const isTrustee = (u: User) => u.role === 'trustee'

const ROLE_NAME: Record<string, string> = {
  sector_admin: 'Sector Admin',
  ca_staff: 'CA Staff',
  ca_partner: 'CA Partner',
  trustee: 'Trustee',
}
const roleName = (u: User) => ROLE_NAME[u.role] ?? u.role.replace(/_/g, ' ')

/** Poster generation is separate from the budget workflow and can be done at any stage. */
export function canGeneratePoster(event: EventRecord): { allowed: boolean; reason?: string } {
  if (event.status === 'closed' || event.status === 'cancelled') {
    return { allowed: false, reason: `Posters cannot be made for an event that is ${event.status}.` }
  }
  return { allowed: true }
}

/** Fields printed on the poster. Changing one after publishing makes the poster stale. */
const POSTER_FIELDS = ['name', 'startAt', 'endAt', 'venue', 'chiefGuest', 'contactName', 'contactPhone', 'ticketPrice'] as const
const EDITABLE_FIELDS = [...POSTER_FIELDS, 'capacity', 'ticketTaxNote'] as const

export function transition(event: EventRecord, action: EventAction, user: User): TransitionResult {
  const now = new Date().toISOString()
  const fail = (error: string): TransitionResult => ({ success: false, event, error })
  const preparer = () => event.lastPreparerId ?? event.createdBy
  const isPreparer = () => user.id === event.createdBy || user.id === event.lastPreparerId
  const needRole = (ok: boolean, what: string, need: string) =>
    ok ? null : fail(`${roleName(user)} cannot ${what}. This needs ${need}.`)

  if (event.status === 'closed') return fail('This event is closed and locked. Nothing more can change.')
  if (event.status === 'cancelled') return fail('This event was cancelled. Nothing more can change.')

  const expect = (status: EventStatus, doing: string) =>
    event.status === status ? null : fail(`You cannot ${doing} while the event is ${event.status.replace(/_/g, ' ')}.`)

  const decision = (
    entityType: EventApproval['entityType'],
    step: number,
    requiredRole: EventApproval['requiredRole'],
    d: 'approved' | 'rejected',
    comment?: string,
  ): TransitionResult['decision'] => ({
    entityType,
    entityId: event.id,
    step,
    requiredRole,
    preparedBy: preparer(),
    decidedBy: user.id,
    decision: d,
    comment,
    decidedAt: now,
  })

  switch (action.type) {
    case 'SUBMIT_BUDGET': {
      const bad = expect('draft', 'submit the budget') ?? needRole(isAdmin(user), 'submit a budget', 'a Sector Admin')
      if (bad) return bad
      if (action.totalRequested <= 0) return fail('The budget must be more than zero.')
      return { success: true, event: { ...event, status: 'budget_submitted', lastPreparerId: user.id, updatedAt: now } }
    }

    case 'APPROVE_BUDGET_CA':
    case 'REJECT_BUDGET_CA': {
      const bad =
        expect('budget_submitted', 'give the CA review') ?? needRole(isCA(user), 'review a budget as the CA', 'the CA team')
      if (bad) return bad
      if (action.type === 'APPROVE_BUDGET_CA') {
        if (isPreparer()) return fail('You prepared this budget. Another approver must review it.')
        return {
          success: true,
          event: { ...event, status: 'budget_ca_ok', updatedAt: now },
          decision: decision('event_budget', 1, 'ca', 'approved', action.comment),
        }
      }
      if (!action.comment.trim()) return fail('Say why the budget is being sent back.')
      return {
        success: true,
        event: { ...event, status: 'draft', updatedAt: now },
        decision: decision('event_budget', 1, 'ca', 'rejected', action.comment),
      }
    }

    case 'APPROVE_BUDGET_TRUSTEE':
    case 'REJECT_BUDGET_TRUSTEE': {
      const bad =
        expect('budget_ca_ok', 'give the Trustee approval') ?? needRole(isTrustee(user), 'approve a budget as a Trustee', 'a Trustee')
      if (bad) return bad
      if (action.type === 'APPROVE_BUDGET_TRUSTEE') {
        if (isPreparer()) return fail('You prepared this budget. Another approver must review it.')
        return {
          success: true,
          event: { ...event, status: 'budget_approved', updatedAt: now },
          decision: decision('event_budget', 2, 'trustee', 'approved', action.comment),
        }
      }
      if (!action.comment.trim()) return fail('Say why the budget is being sent back.')
      return {
        success: true,
        event: { ...event, status: 'draft', updatedAt: now },
        decision: decision('event_budget', 2, 'trustee', 'rejected', action.comment),
      }
    }

    case 'CONFIRM_EVENT': {
      const bad = expect('budget_approved', 'confirm the event') ?? needRole(isAdmin(user), 'confirm an event', 'a Sector Admin')
      if (bad) return bad
      const missing: string[] = []
      if (!event.startAt) missing.push('date')
      if (!event.venue.trim()) missing.push('venue')
      if (!event.chiefGuest?.trim()) missing.push('chief guest')
      if (missing.length > 0) return fail(`Fix the ${missing.join(', ')} before confirming the event.`)
      return { success: true, event: { ...event, status: 'confirmed', fundId: action.fundId, updatedAt: now } }
    }

    case 'SELECT_POSTER_DESIGN': {
      const bad = needRole(isAdmin(user), 'choose a poster design', 'a Sector Admin')
      if (bad) return bad
      const isConfirmedOrPending = event.status === 'confirmed' || event.status === 'poster_pending'
      return {
        success: true,
        event: {
          ...event,
          status: isConfirmedOrPending ? 'poster_pending' : event.status,
          posterStatus: isConfirmedOrPending ? 'pending' : event.posterStatus,
          selectedPosterDesignId: action.designId,
          lastPreparerId: user.id,
          updatedAt: now,
        },
      }
    }

    case 'APPROVE_POSTER':
    case 'REJECT_POSTER': {
      const bad =
        expect('poster_pending', 'decide on the poster') ?? needRole(isAdmin(user), 'decide on a poster', 'a Sector Admin')
      if (bad) return bad
      if (action.type === 'APPROVE_POSTER') {
        // The poster's maker is whoever chose the design. A different admin approves it.
        if (user.id === event.lastPreparerId) return fail('You chose this poster. A different admin must approve it.')
        return {
          success: true,
          event: { ...event, status: 'published', posterStatus: 'published', updatedAt: now },
          decision: decision('event_poster', 1, 'sector_admin', 'approved', action.comment),
        }
      }
      if (!action.comment.trim()) return fail('Say why the poster is being sent back.')
      return {
        success: true,
        event: { ...event, status: 'confirmed', posterStatus: 'none', selectedPosterDesignId: undefined, updatedAt: now },
        decision: decision('event_poster', 1, 'sector_admin', 'rejected', action.comment),
      }
    }

    case 'START_EVENT': {
      const bad = expect('published', 'start the event') ?? needRole(isAdmin(user), 'start an event', 'a Sector Admin')
      return bad ?? { success: true, event: { ...event, status: 'live', updatedAt: now } }
    }

    case 'END_EVENT': {
      const bad = expect('live', 'end the event') ?? needRole(isAdmin(user), 'end an event', 'a Sector Admin')
      return bad ?? { success: true, event: { ...event, status: 'completed', updatedAt: now } }
    }

    case 'CLOSE_EVENT': {
      const bad = expect('completed', 'close the event') ?? needRole(isCA(user), 'close an event', 'the CA team')
      return bad ?? { success: true, event: { ...event, status: 'closed', closurePnl: action.pnl, updatedAt: now } }
    }

    case 'CANCEL_EVENT': {
      const bad = needRole(isAdmin(user), 'cancel an event', 'a Sector Admin')
      if (bad) return bad
      if (!['draft', 'confirmed', 'published'].includes(event.status)) {
        return fail('An event can be cancelled only while it is a draft, confirmed or published.')
      }
      if (!action.reason.trim()) return fail('Give a reason for cancelling.')
      return {
        success: true,
        event: {
          ...event,
          status: 'cancelled',
          cancelReason: action.reason.trim(),
          posterStatus: event.posterStatus === 'published' ? 'stale' : event.posterStatus,
          updatedAt: now,
        },
      }
    }

    case 'UPDATE_EVENT_FIELDS': {
      const bad = needRole(isAdmin(user), 'edit an event', 'a Sector Admin')
      if (bad) return bad
      const changes: Partial<EventRecord> = {}
      let touchedPoster = false
      for (const key of EDITABLE_FIELDS) {
        const next = action.fields[key]
        if (next === undefined) continue
        ;(changes as Record<string, unknown>)[key] = next
        if (next !== event[key] && (POSTER_FIELDS as readonly string[]).includes(key)) touchedPoster = true
      }
      // Changing anything printed on a live poster pulls the poster down until it is remade and re-approved.
      const staleNow = (event.status === 'published' || event.status === 'poster_pending') && touchedPoster
      return {
        success: true,
        event: {
          ...event,
          ...changes,
          ...(staleNow ? { status: 'confirmed' as const, posterStatus: 'stale' as const, selectedPosterDesignId: undefined } : {}),
          updatedAt: now,
        },
      }
    }
  }
}
