import type { StoreApi } from 'zustand'

import { suggestForCategory, growthDefaultFor } from '@/features/events/logic/budget'
import { calculatePnl } from '@/features/events/logic/pnl'
import { generateDesigns } from '@/features/events/logic/poster'
import {
  committedOnLine,
  checkInBlock,
  lineLimit,
  orderDecideBlock,
  orderPayBlock,
  orderRaiseBlock,
  overrunMessage,
  recordBlock,
  REGISTRATION_STATES,
  seatsTaken,
  SPEND_STATES,
} from '@/features/events/logic/rules'
import { canGeneratePoster, transition, type EditableFields, type EventAction } from '@/features/events/logic/stateMachine'
import { issueTicketToken, verifyTicketToken } from '@/features/events/logic/tickets'
import { formatMoney } from '@/lib/format'
import { toast } from '@/lib/toast'
import type {
  EventApproval,
  EventBudgetLine,
  EventRecord,
  EventRegistration,
  JournalEntry,
  SectorId,
  User,
} from '@/types'
import { audit, journalEntry, type DbState } from './db'
import { closedPeriodError } from './rules'

type Result<T = object> = { ok: true } & T | { ok: false; error: string }

export interface NewEventInput {
  name: string
  sectorId: SectorId
  eventType: string
  startAt: string
  endAt: string
  venue: string
  chiefGuest?: string
  contactName: string
  contactPhone: string
  capacity?: number
  isPaid: boolean
  ticketPrice?: number
  ticketTaxNote?: string
}

export interface BudgetLineInput {
  id?: string
  category: string
  requestedAmount: number
  suggestedAmount?: number
  suggestionNote?: string
  history?: EventBudgetLine['history']
}

export interface EventActions {
  createEvent: (input: NewEventInput, actor: User) => Result<{ id: string }>
  updateEvent: (eventId: string, fields: EditableFields, actor: User) => Result
  suggestBudget: (eventId: string, categories?: string[]) => ReturnType<typeof suggestForCategory>[]
  saveBudgetLines: (eventId: string, lines: BudgetLineInput[], actor: User) => Result
  submitBudget: (eventId: string, actor: User) => Result
  decideBudget: (
    eventId: string,
    decision: 'approved' | 'rejected',
    actor: User,
    opts?: { comment?: string; approvedLines?: Record<string, number> },
  ) => Result
  confirmEvent: (eventId: string, actor: User, fix?: Pick<EditableFields, 'chiefGuest' | 'venue' | 'startAt' | 'endAt'>) => Result
  generatePosters: (eventId: string, actor: User) => Result
  selectPoster: (eventId: string, designId: string, actor: User) => Result
  decidePoster: (eventId: string, decision: 'approved' | 'rejected', actor: User, comment?: string) => Result
  startEvent: (eventId: string, actor: User) => Result
  endEvent: (eventId: string, actor: User) => Result
  cancelEvent: (eventId: string, reason: string, actor: User) => Result
  closeEvent: (eventId: string, actor: User) => Result
  registerAttendee: (
    eventId: string,
    input: { name: string; phone: string; email?: string; qty: number },
    actor: User,
  ) => Result<{ registration: EventRegistration }>
  checkInTicket: (eventId: string, token: string, actor: User) => Result<{ registration: EventRegistration }>
  addSponsor: (eventId: string, input: { sponsorName: string; kind: 'cash' | 'in_kind'; amount: number; description?: string }, actor: User) => Result
  addEventDonation: (eventId: string, input: { donorName: string; amount: number; note?: string }, actor: User) => Result
  raiseOrder: (
    eventId: string,
    input: { budgetLineId: string; vendorName: string; itemDescription: string; amount: number },
    actor: User,
  ) => Result
  decideOrder: (eventId: string, orderId: string, decision: 'approved' | 'rejected', actor: User, comment?: string) => Result
  payOrder: (eventId: string, orderId: string, actor: User) => Result
}

type Set = StoreApi<DbState>['setState']
type Get = StoreApi<DbState>['getState']

let seq = 0
const newId = (prefix: string) => `${prefix}-${Date.now().toString(36)}${(seq++).toString(36)}`
const fail = (error: string): { ok: false; error: string } => ({ ok: false, error })

export function createEventActions(set: Set, get: Get): EventActions {
  const eventOf = (id: string) => get().events.find((e) => e.id === id)
  const linesOf = (id: string) => get().eventBudgetLines.filter((l) => l.eventId === id)
  const generalFundOf = (sectorId: SectorId) => get().funds.find((f) => f.sectorId === sectorId && f.type === 'unrestricted')

  const saveEvent = (event: EventRecord) => (s: DbState) => ({ events: s.events.map((e) => (e.id === event.id ? event : e)) })

  /** Run one state-machine action. On success the caller gets the new event; on failure, the plain-language reason. */
  function run(eventId: string, action: EventAction, actor: User) {
    const event = eventOf(eventId)
    if (!event) return { ok: false as const, error: 'Event not found.' }
    const result = transition(event, action, actor)
    if (!result.success) return { ok: false as const, error: result.error ?? 'Not allowed.' }
    return { ok: true as const, before: event, event: result.event, decision: result.decision }
  }

  const postLedger = (s: DbState, entry: JournalEntry, fundDeltas: Record<string, number>) => ({
    journal: [entry, ...s.journal],
    funds: s.funds.map((f) => (fundDeltas[f.id] !== undefined ? { ...f, balance: f.balance + fundDeltas[f.id]! } : f)),
  })

  const lockError = () => closedPeriodError(get().periodCloses, new Date().toISOString())

  /** Money back to the sector's general fund: whatever the event fund still holds. */
  function releaseFund(s: DbState, event: EventRecord, at: string, memo: string) {
    const fund = s.funds.find((f) => f.id === event.fundId)
    const general = generalFundOf(event.sectorId)
    if (!fund || !general || fund.balance <= 0) return { journal: s.journal, funds: s.funds }
    const entry = journalEntry(newId('je-evt-rel'), at, event.sectorId, memo, [
      { account: 'Event fund allocation', fundId: fund.id, debit: fund.balance, credit: 0 },
      { account: 'Fund allotted', fundId: general.id, debit: 0, credit: fund.balance },
    ], event.id)
    return postLedger(s, entry, { [fund.id]: -fund.balance, [general.id]: fund.balance })
  }

  const stamp = (event: EventRecord, actor: User, what: string, extra?: { before?: string; after?: string }) =>
    audit(actor, what, 'Event', event.name, { sectorId: event.sectorId, ...extra })

  return {
    createEvent: (input, actor) => {
      if (actor.role !== 'sector_admin') return fail('Only a Sector Admin can create an event.')
      if (!input.name.trim() || !input.venue.trim() || !input.contactName.trim() || !input.contactPhone.trim()) {
        return fail('Name, venue and a contact name and phone are required.')
      }
      const start = new Date(input.startAt).getTime()
      const end = new Date(input.endAt).getTime()
      if (Number.isNaN(start) || Number.isNaN(end) || end < start) return fail('Pick a start date, and an end that is not before it.')
      if (input.capacity !== undefined && !(input.capacity > 0)) return fail('Capacity must be a positive number.')
      if (input.isPaid && !(input.ticketPrice && input.ticketPrice > 0)) return fail('A paid event needs a ticket price.')

      const now = new Date().toISOString()
      const event: EventRecord = {
        id: newId('evt'),
        sectorId: input.sectorId,
        eventType: input.eventType.trim().toUpperCase() || 'GENERAL',
        name: input.name.trim(),
        startAt: input.startAt,
        endAt: input.endAt,
        venue: input.venue.trim(),
        chiefGuest: input.chiefGuest?.trim() || undefined,
        contactName: input.contactName.trim(),
        contactPhone: input.contactPhone.trim(),
        capacity: input.capacity,
        isPaid: input.isPaid,
        ticketPrice: input.isPaid ? input.ticketPrice : undefined,
        ticketTaxNote: input.ticketTaxNote?.trim() || undefined,
        status: 'draft',
        posterStatus: 'none',
        createdBy: actor.id,
        createdAt: now,
        updatedAt: now,
        tenantId: get().activeTenantId,
      }
      set((s) => ({ events: [event, ...s.events], audit: [stamp(event, actor, 'Created event', { after: 'draft' }), ...s.audit] }))
      toast.success('Event created', `${event.name} is a draft. Set its budget next.`)
      return { ok: true, id: event.id }
    },

    updateEvent: (eventId, fields, actor) => {
      const r = run(eventId, { type: 'UPDATE_EVENT_FIELDS', fields }, actor)
      if (!r.ok) return r
      const unpublished = r.before.status !== r.event.status
      set((s) => ({ ...saveEvent(r.event)(s), audit: [stamp(r.event, actor, 'Edited event', { before: r.before.status, after: r.event.status }), ...s.audit] }))
      if (unpublished) toast.warning('Poster is out of date', `You changed something printed on the poster. ${r.event.name} is back to Confirmed and needs a new poster.`)
      else toast.success('Event updated', r.event.name)
      return { ok: true }
    },

    suggestBudget: (eventId, categories) => {
      const event = eventOf(eventId)
      if (!event) return []
      return (categories ?? []).map((category) => {
        const history = get().eventActuals.filter((a) => a.eventType === event.eventType && a.category === category).map((a) => ({ year: a.year, actual: a.actual }))
        return suggestForCategory(category, history, { defaultSingleYearGrowth: growthDefaultFor(event.eventType) })
      })
    },

    saveBudgetLines: (eventId, inputs, actor) => {
      const event = eventOf(eventId)
      if (!event) return fail('Event not found.')
      if (actor.role !== 'sector_admin') return fail('Only a Sector Admin can edit the budget.')
      if (event.status !== 'draft') return fail('The budget is locked once it is submitted. The approvers review exactly what they were sent.')
      if (inputs.length === 0) return fail('Add at least one cost line.')
      for (const l of inputs) {
        if (!l.category.trim()) return fail('Every cost line needs a category.')
        if (!Number.isFinite(l.requestedAmount) || l.requestedAmount < 0) return fail(`The amount for ${l.category} is not valid.`)
      }
      const saved: EventBudgetLine[] = inputs.map((l, i) => ({
        id: l.id ?? `${eventId}-bl${Date.now().toString(36)}${i}`,
        eventId,
        category: l.category.trim(),
        history: l.history,
        suggestedAmount: l.suggestedAmount,
        suggestionNote: l.suggestionNote,
        requestedAmount: Math.round(l.requestedAmount),
      }))
      set((s) => ({ eventBudgetLines: [...s.eventBudgetLines.filter((l) => l.eventId !== eventId), ...saved] }))
      return { ok: true }
    },

    submitBudget: (eventId, actor) => {
      const total = linesOf(eventId).reduce((s, l) => s + l.requestedAmount, 0)
      if (linesOf(eventId).length === 0) return fail('Add at least one cost line before submitting.')
      const r = run(eventId, { type: 'SUBMIT_BUDGET', totalRequested: total }, actor)
      if (!r.ok) return r
      const approval: EventApproval = {
        id: newId('appr'), entityType: 'event_budget', entityId: eventId, step: 1, requiredRole: 'ca', preparedBy: actor.id, createdAt: new Date().toISOString(),
      }
      set((s) => ({ ...saveEvent(r.event)(s), eventApprovals: [...s.eventApprovals, approval], audit: [stamp(r.event, actor, 'Submitted event budget', { before: 'draft', after: 'budget_submitted' }), ...s.audit] }))
      toast.success('Budget submitted', `${formatMoney(total)} for ${r.event.name} is waiting for the CA.`)
      return { ok: true }
    },

    decideBudget: (eventId, decision, actor, opts = {}) => {
      const event = eventOf(eventId)
      if (!event) return fail('Event not found.')
      const trusteeStep = event.status === 'budget_ca_ok'
      const comment = opts.comment ?? ''
      const action: EventAction = trusteeStep
        ? decision === 'approved' ? { type: 'APPROVE_BUDGET_TRUSTEE', comment } : { type: 'REJECT_BUDGET_TRUSTEE', comment }
        : decision === 'approved' ? { type: 'APPROVE_BUDGET_CA', comment } : { type: 'REJECT_BUDGET_CA', comment }
      const r = run(eventId, action, actor)
      if (!r.ok) return r

      const lines = linesOf(eventId)
      const approvedOf = (l: EventBudgetLine) => opts.approvedLines?.[l.id] ?? l.requestedAmount
      if (trusteeStep && decision === 'approved') {
        for (const l of lines) {
          const v = approvedOf(l)
          if (!Number.isFinite(v) || v < 0) return fail(`The approved amount for ${l.category} is not valid.`)
        }
      }

      const step = trusteeStep ? 2 : 1
      const now = new Date().toISOString()
      set((s) => {
        const open = s.eventApprovals.find((a) => a.entityType === 'event_budget' && a.entityId === eventId && a.step === step && !a.decision)
        const decided: EventApproval = { ...(open ?? { id: newId('appr'), entityType: 'event_budget', entityId: eventId, step, requiredRole: trusteeStep ? 'trustee' : 'ca', preparedBy: r.before.lastPreparerId ?? r.before.createdBy, createdAt: now }), ...r.decision!, } as EventApproval
        const next: EventApproval[] = []
        if (!trusteeStep && decision === 'approved') {
          next.push({ id: newId('appr'), entityType: 'event_budget', entityId: eventId, step: 2, requiredRole: 'trustee', preparedBy: decided.preparedBy, createdAt: now })
        }
        return {
          ...saveEvent(r.event)(s),
          eventApprovals: [...s.eventApprovals.filter((a) => a.id !== decided.id), decided, ...next],
          eventBudgetLines:
            trusteeStep && decision === 'approved'
              ? s.eventBudgetLines.map((l) => (l.eventId === eventId ? { ...l, approvedAmount: approvedOf(l) } : l))
              : s.eventBudgetLines,
          audit: [stamp(r.event, actor, `${decision === 'approved' ? 'Approved' : 'Rejected'} event budget (${trusteeStep ? 'Trustee' : 'CA'})`, { before: r.before.status, after: r.event.status }), ...s.audit],
        }
      })

      const approvedTotal = lines.reduce((sum, l) => sum + approvedOf(l), 0)
      if (decision === 'rejected') toast.danger('Budget sent back', `${r.event.name} is a draft again. ${comment}`)
      else if (trusteeStep) toast.success('Budget approved', `${formatMoney(approvedTotal)} approved for ${r.event.name}. It can be confirmed now.`)
      else toast.info('CA review recorded', `${r.event.name} now waits for a Trustee.`)
      return { ok: true }
    },

    confirmEvent: (eventId, actor, fix) => {
      const event = eventOf(eventId)
      if (!event) return fail('Event not found.')
      const candidate: EventRecord = {
        ...event,
        ...(fix?.chiefGuest?.trim() ? { chiefGuest: fix.chiefGuest.trim() } : {}),
        ...(fix?.venue?.trim() ? { venue: fix.venue.trim() } : {}),
        ...(fix?.startAt ? { startAt: fix.startAt } : {}),
        ...(fix?.endAt ? { endAt: fix.endAt } : {}),
      }
      const fundId = `fund-evt-${event.id}`
      const result = transition(candidate, { type: 'CONFIRM_EVENT', fundId }, actor)
      if (!result.success) return fail(result.error ?? 'Not allowed.')

      const locked = lockError()
      if (locked) return fail(locked)
      const allocated = linesOf(eventId).reduce((s, l) => s + lineLimit(l), 0)
      const general = generalFundOf(event.sectorId)
      if (!general) return fail('This customer has no general fund for the sector.')
      if (general.balance < allocated) {
        return fail(`${general.name} holds only ${formatMoney(general.balance)}, and this event needs ${formatMoney(allocated)} set aside.`)
      }

      const now = new Date().toISOString()
      set((s) => {
        const entry = journalEntry(newId('je-evt'), now, event.sectorId, `Event fund set aside — ${event.name}`, [
          { account: 'Fund allotted', fundId: general.id, debit: allocated, credit: 0 },
          { account: 'Event fund allocation', fundId, debit: 0, credit: allocated },
        ], event.id)
        const posted = postLedger(s, entry, { [general.id]: -allocated })
        return {
          ...saveEvent(result.event)(s),
          journal: posted.journal,
          funds: [...posted.funds, { id: fundId, sectorId: event.sectorId, name: `${event.name} Fund`, type: 'restricted' as const, eventId: event.id, balance: allocated }],
          audit: [stamp(result.event, actor, 'Confirmed event and set money aside', { before: 'budget_approved', after: 'confirmed' }), ...s.audit],
        }
      })
      toast.success('Event confirmed', `${formatMoney(allocated)} set aside from ${general.name} into the ${event.name} Fund.`)
      return { ok: true }
    },

    generatePosters: (eventId, actor) => {
      const event = eventOf(eventId)
      if (!event) return fail('Event not found.')
      if (actor.role !== 'sector_admin') return fail('Only a Sector Admin can make a poster.')
      const guard = canGeneratePoster(event)
      if (!guard.allowed) return fail(guard.reason!)
      if (event.status === 'poster_pending') return fail('A design is waiting for approval. Pick another design, or have the approver send it back first.')

      const previous = get().eventPosters.filter((d) => d.eventId === eventId)
      const batchNo = previous.reduce((m, d) => Math.max(m, d.batchNo), 0) + 1
      const today = new Date().toDateString()
      const todays = new Set(previous.filter((d) => new Date(d.createdAt).toDateString() === today).map((d) => d.batchNo)).size
      if (todays >= 3) return fail('You have made three sets of designs today. Try again tomorrow, or pick one of these.')

      const designs = generateDesigns(event, batchNo, actor.id, () => newId('des'))
      set((s) => ({ eventPosters: [...s.eventPosters, ...designs], audit: [stamp(event, actor, `Generated poster designs (set ${batchNo})`), ...s.audit] }))
      toast.success('Three designs ready', `Set ${batchNo} for ${event.name}. The words, logo and QR come from the event record.`)
      return { ok: true }
    },

    selectPoster: (eventId, designId, actor) => {
      const event = eventOf(eventId)
      if (!event) return fail('Event not found.')
      if (!get().eventPosters.some((d) => d.id === designId && d.eventId === eventId)) return fail('That design is not part of this event.')
      const r = run(eventId, { type: 'SELECT_POSTER_DESIGN', designId }, actor)
      if (!r.ok) return r
      set((s) => ({
        ...saveEvent(r.event)(s),
        eventApprovals: [
          ...s.eventApprovals.filter((a) => !(a.entityType === 'event_poster' && a.entityId === eventId && !a.decision)),
          { id: newId('appr'), entityType: 'event_poster' as const, entityId: eventId, step: 1, requiredRole: 'sector_admin' as const, preparedBy: actor.id, createdAt: new Date().toISOString() },
        ],
        audit: [stamp(r.event, actor, 'Chose poster design', { before: r.before.status, after: 'poster_pending' }), ...s.audit],
      }))
      toast.success('Poster sent for approval', `A different admin must approve it before ${r.event.name} goes public.`)
      return { ok: true }
    },

    decidePoster: (eventId, decision, actor, comment = '') => {
      const design = get().eventPosters.find((d) => d.id === eventOf(eventId)?.selectedPosterDesignId)
      if (decision === 'approved' && !design) return fail('No design is selected for this event.')
      const r = run(eventId, decision === 'approved' ? { type: 'APPROVE_POSTER', comment } : { type: 'REJECT_POSTER', comment }, actor)
      if (!r.ok) return r
      set((s) => {
        const open = s.eventApprovals.find((a) => a.entityType === 'event_poster' && a.entityId === eventId && !a.decision)
        const decided = { ...(open ?? { id: newId('appr'), entityType: 'event_poster', entityId: eventId, step: 1, requiredRole: 'sector_admin', preparedBy: r.before.lastPreparerId ?? r.before.createdBy, createdAt: new Date().toISOString() }), ...r.decision! } as EventApproval
        return {
          ...saveEvent(r.event)(s),
          eventApprovals: [...s.eventApprovals.filter((a) => a.id !== decided.id), decided],
          audit: [stamp(r.event, actor, decision === 'approved' ? 'Approved poster' : 'Sent poster back', { before: 'poster_pending', after: r.event.status }), ...s.audit],
        }
      })
      if (decision === 'approved') toast.success('Poster approved', `${r.event.name} is public. Registration is open.`)
      else toast.warning('Poster sent back', `${r.event.name} is Confirmed again. ${comment}`)
      return { ok: true }
    },

    startEvent: (eventId, actor) => {
      const r = run(eventId, { type: 'START_EVENT' }, actor)
      if (!r.ok) return r
      set((s) => ({ ...saveEvent(r.event)(s), audit: [stamp(r.event, actor, 'Started event', { before: 'published', after: 'live' }), ...s.audit] }))
      toast.success('Event is live', `Check-in is open for ${r.event.name}.`)
      return { ok: true }
    },

    endEvent: (eventId, actor) => {
      const r = run(eventId, { type: 'END_EVENT' }, actor)
      if (!r.ok) return r
      set((s) => ({ ...saveEvent(r.event)(s), audit: [stamp(r.event, actor, 'Ended event', { before: 'live', after: 'completed' }), ...s.audit] }))
      toast.success('Event completed', `${r.event.name} now waits for the CA to close it.`)
      return { ok: true }
    },

    cancelEvent: (eventId, reason, actor) => {
      const r = run(eventId, { type: 'CANCEL_EVENT', reason }, actor)
      if (!r.ok) return r
      const locked = r.before.fundId ? lockError() : null
      if (locked) return fail(locked)
      const now = new Date().toISOString()
      set((s) => {
        const released = releaseFund(s, r.event, now, `Event fund released — ${r.event.name} cancelled`)
        return {
          ...saveEvent(r.event)(s),
          journal: released.journal,
          funds: released.funds,
          eventOrders: s.eventOrders.map((o) => (o.eventId === eventId && (o.status === 'pending_ca' || o.status === 'approved') ? { ...o, status: 'cancelled' as const } : o)),
          eventRegistrations: s.eventRegistrations.map((x) => (x.eventId === eventId && x.status === 'active' ? { ...x, status: x.amountPaid > 0 ? ('refunded' as const) : ('cancelled' as const) } : x)),
          audit: [stamp(r.event, actor, 'Cancelled event', { before: r.before.status, after: `cancelled (${reason.trim()})` }), ...s.audit],
        }
      })
      toast.warning('Event cancelled', 'The fund went back to the sector, open orders were cancelled and paid tickets are marked for refund.')
      return { ok: true }
    },

    closeEvent: (eventId, actor) => {
      const event = eventOf(eventId)
      if (!event) return fail('Event not found.')
      const open = get().eventOrders.filter((o) => o.eventId === eventId && (o.status === 'pending_ca' || o.status === 'approved'))
      if (open.length > 0) return fail(`${open.length} order${open.length === 1 ? ' is' : 's are'} still open. Pay, reject or cancel ${open.length === 1 ? 'it' : 'them'} first.`)
      const locked = lockError()
      if (locked) return fail(locked)

      const pnl = calculatePnl(get(), eventId)
      const r = run(eventId, { type: 'CLOSE_EVENT', pnl: { ticketIncome: pnl.ticketIncome, sponsorIncome: pnl.sponsorIncome, donationIncome: pnl.donationIncome, expenses: pnl.expenses, net: pnl.net } }, actor)
      if (!r.ok) return r

      const year = new Date(event.startAt).getFullYear()
      const now = new Date().toISOString()
      set((s) => {
        const released = releaseFund(s, r.event, now, `Unspent event fund returned — ${r.event.name} closed`)
        // What was actually spent, per line, is what next year's suggestion is built from.
        const actuals = s.eventBudgetLines
          .filter((l) => l.eventId === eventId)
          .map((l) => ({ eventType: event.eventType, year, category: l.category, actual: pnl.lines.find((p) => p.lineId === l.id)?.spent ?? 0 }))
        return {
          ...saveEvent(r.event)(s),
          journal: released.journal,
          funds: released.funds,
          eventActuals: [...s.eventActuals.filter((a) => !(a.eventType === event.eventType && a.year === year && actuals.some((n) => n.category === a.category))), ...actuals],
          audit: [stamp(r.event, actor, 'Closed event and locked P&L', { before: 'completed', after: 'closed' }), ...s.audit],
        }
      })
      toast.success('Event closed', `${r.event.name} is locked. ${pnl.net >= 0 ? 'Profit' : 'Loss'} of ${formatMoney(Math.abs(pnl.net))}. Actuals now guide next year's budget.`)
      return { ok: true }
    },

    registerAttendee: (eventId, input, actor) => {
      const event = eventOf(eventId)
      if (!event) return fail('Event not found.')
      if (!REGISTRATION_STATES.includes(event.status)) return fail('Registration opens once the poster is approved.')
      if (!input.name.trim() || !input.phone.trim()) return fail('Name and phone are required.')
      if (!Number.isInteger(input.qty) || input.qty < 1 || input.qty > 10) return fail('Choose between 1 and 10 tickets.')
      if (event.capacity) {
        const left = event.capacity - seatsTaken(get(), eventId)
        if (input.qty > left) return fail(left <= 0 ? 'This event is full.' : `Only ${left} seat${left === 1 ? '' : 's'} left.`)
      }
      const id = newId('reg')
      const amountPaid = event.isPaid ? (event.ticketPrice ?? 0) * input.qty : 0
      const registration: EventRegistration = {
        id, eventId, name: input.name.trim(), phone: input.phone.trim(), email: input.email?.trim() || undefined, qty: input.qty, amountPaid,
        paymentRef: event.isPaid ? newId('pay') : undefined,
        ticketToken: issueTicketToken(eventId, id, input.qty),
        status: 'active', createdAt: new Date().toISOString(),
      }
      set((s) => {
        const base = { eventRegistrations: [...s.eventRegistrations, registration], audit: [audit(actor, 'Registered for event', 'Event', event.name, { sectorId: event.sectorId, after: `${input.qty} ticket${input.qty === 1 ? '' : 's'}` }), ...s.audit] }
        if (amountPaid <= 0 || !event.fundId) return base
        const entry = journalEntry(newId('je-evt'), registration.createdAt, event.sectorId, `Ticket sales — ${event.name}`, [
          { account: 'Bank', fundId: event.fundId, debit: amountPaid, credit: 0 },
          { account: 'Event income', fundId: event.fundId, debit: 0, credit: amountPaid },
        ], registration.id)
        return { ...base, ...postLedger(s, entry, { [event.fundId]: amountPaid }) }
      })
      toast.success('You are registered', `${input.qty} ticket${input.qty === 1 ? '' : 's'} for ${event.name}.`)
      return { ok: true, registration }
    },

    checkInTicket: (eventId, token, actor) => {
      const event = eventOf(eventId)
      if (!event) return fail('Event not found.')
      const block = checkInBlock(actor)
      if (block) return fail(block)
      if (event.status !== 'live') return fail('Check-in is open only while the event is live.')
      if (!token.trim()) return fail('Scan or paste a ticket code.')
      const regs = get().eventRegistrations.filter((r) => r.eventId === eventId)
      const verdict = verifyTicketToken(eventId, token, (id) => regs.find((r) => r.id === id)?.qty)
      const reg = verdict.valid ? regs.find((r) => r.id === verdict.regId) : undefined
      if (!reg) return fail('This ticket is not valid for this event.')
      if (reg.status !== 'active') return fail(`This ticket is ${reg.status}. Entry refused.`)
      if (reg.checkedInAt) return fail(`Already scanned at ${new Date(reg.checkedInAt).toLocaleTimeString()}. Entry refused.`)
      const updated = { ...reg, checkedInAt: new Date().toISOString() }
      set((s) => ({ eventRegistrations: s.eventRegistrations.map((r) => (r.id === reg.id ? updated : r)), audit: [audit(actor, 'Checked in ticket', 'Event', event.name, { sectorId: event.sectorId, after: reg.name }), ...s.audit] }))
      toast.success('Checked in', `${reg.name}, ${reg.qty} ${reg.qty === 1 ? 'person' : 'people'}.`)
      return { ok: true, registration: updated }
    },

    addSponsor: (eventId, input, actor) => {
      const event = eventOf(eventId)
      if (!event) return fail('Event not found.')
      const block = recordBlock(actor)
      if (block) return fail(block)
      if (!SPEND_STATES.includes(event.status)) return fail('Sponsors are recorded once the event is confirmed and before it is closed.')
      if (!input.sponsorName.trim() || !(input.amount > 0)) return fail('A sponsor name and an amount above zero are required.')
      const locked = input.kind === 'cash' ? lockError() : null
      if (locked) return fail(locked)
      const now = new Date().toISOString()
      set((s) => {
        const sponsor = { id: newId('spn'), eventId, sponsorName: input.sponsorName.trim(), kind: input.kind, amount: input.amount, description: input.description?.trim() || undefined, receiptNo: newId('rcpt'), receivedAt: now }
        const base = { eventSponsors: [...s.eventSponsors, sponsor], audit: [stamp(event, actor, `Recorded ${input.kind === 'cash' ? 'cash' : 'in-kind'} sponsor`, { after: formatMoney(input.amount) }), ...s.audit] }
        if (input.kind !== 'cash' || !event.fundId) return base
        const entry = journalEntry(newId('je-evt'), now, event.sectorId, `Cash sponsorship — ${input.sponsorName.trim()} for ${event.name}`, [
          { account: 'Bank', fundId: event.fundId, debit: input.amount, credit: 0 },
          { account: 'Event income', fundId: event.fundId, debit: 0, credit: input.amount },
        ], sponsor.id)
        return { ...base, ...postLedger(s, entry, { [event.fundId]: input.amount }) }
      })
      toast.success('Sponsor recorded', input.kind === 'cash' ? `${formatMoney(input.amount)} added to the ${event.name} Fund.` : `${formatMoney(input.amount)} in-kind, shown separately from cash.`)
      return { ok: true }
    },

    addEventDonation: (eventId, input, actor) => {
      const event = eventOf(eventId)
      if (!event) return fail('Event not found.')
      const block = recordBlock(actor)
      if (block) return fail(block)
      if (!SPEND_STATES.includes(event.status)) return fail('Donations are recorded once the event is confirmed and before it is closed.')
      if (!input.donorName.trim() || !(input.amount > 0)) return fail('A donor name and an amount above zero are required.')
      const locked = lockError()
      if (locked) return fail(locked)
      const now = new Date().toISOString()
      set((s) => {
        const donation = { id: newId('don'), eventId, donorName: input.donorName.trim(), amount: input.amount, note: input.note?.trim() || undefined, receiptNo: newId('dr'), receivedAt: now }
        const base = { eventDonations: [...s.eventDonations, donation], audit: [stamp(event, actor, 'Recorded event donation', { after: formatMoney(input.amount) }), ...s.audit] }
        if (!event.fundId) return base
        const entry = journalEntry(newId('je-evt'), now, event.sectorId, `Event donation — ${input.donorName.trim()} for ${event.name}`, [
          { account: 'Bank', fundId: event.fundId, debit: input.amount, credit: 0 },
          { account: 'Event income', fundId: event.fundId, debit: 0, credit: input.amount },
        ], donation.id)
        return { ...base, ...postLedger(s, entry, { [event.fundId]: input.amount }) }
      })
      toast.success('Donation recorded', `${formatMoney(input.amount)} went into the ${event.name} Fund.`)
      return { ok: true }
    },

    raiseOrder: (eventId, input, actor) => {
      const event = eventOf(eventId)
      if (!event) return fail('Event not found.')
      const block = orderRaiseBlock(actor, event)
      if (block) return fail(block)
      if (!(input.amount > 0)) return fail('Enter an order amount above zero.')
      const line = linesOf(eventId).find((l) => l.id === input.budgetLineId)
      if (!line) return fail('Pick a budget line for this order.')
      const committed = committedOnLine(get().eventOrders.filter((o) => o.eventId === eventId), line.id)
      if (committed + input.amount > lineLimit(line)) return fail(overrunMessage(line, committed, input.amount))
      set((s) => ({
        eventOrders: [...s.eventOrders, { id: newId('po'), eventId, budgetLineId: line.id, vendorName: input.vendorName.trim() || 'Vendor', itemDescription: input.itemDescription.trim() || 'Event item', amount: input.amount, status: 'pending_ca' as const, preparedBy: actor.id, createdAt: new Date().toISOString() }],
        audit: [stamp(event, actor, 'Raised event order', { after: `${formatMoney(input.amount)} on ${line.category}` }), ...s.audit],
      }))
      toast.success('Order raised', `${formatMoney(input.amount)} on ${line.category} is waiting for the CA.`)
      return { ok: true }
    },

    decideOrder: (eventId, orderId, decision, actor, comment = '') => {
      const event = eventOf(eventId)
      const order = get().eventOrders.find((o) => o.id === orderId && o.eventId === eventId)
      if (!event || !order) return fail('Order not found.')
      if (event.status === 'closed' || event.status === 'cancelled') return fail(`This event is ${event.status}. Orders can no longer change.`)
      if (order.status !== 'pending_ca') return fail(`This order is already ${order.status.replace('_', ' ')}.`)
      const block = orderDecideBlock(actor, order)
      if (block) return fail(block)
      if (decision === 'rejected' && !comment.trim()) return fail('Say why the order is rejected.')
      if (decision === 'approved') {
        const line = linesOf(eventId).find((l) => l.id === order.budgetLineId)
        if (!line) return fail('The budget line for this order no longer exists.')
        const committed = committedOnLine(get().eventOrders.filter((o) => o.eventId === eventId), line.id, order.id)
        if (committed + order.amount > lineLimit(line)) return fail(overrunMessage(line, committed, order.amount))
      }
      const now = new Date().toISOString()
      set((s) => ({
        eventOrders: s.eventOrders.map((o) => (o.id === orderId ? { ...o, status: decision, decidedBy: actor.id, decidedAt: now, comment: comment.trim() || undefined } : o)),
        audit: [stamp(event, actor, `${decision === 'approved' ? 'Approved' : 'Rejected'} event order`, { before: 'pending_ca', after: decision }), ...s.audit],
      }))
      if (decision === 'approved') toast.success('Order approved', `${order.vendorName}, ${formatMoney(order.amount)}. The items can be bought now.`)
      else toast.danger('Order rejected', comment)
      return { ok: true }
    },

    payOrder: (eventId, orderId, actor) => {
      const event = eventOf(eventId)
      const order = get().eventOrders.find((o) => o.id === orderId && o.eventId === eventId)
      if (!event || !order) return fail('Order not found.')
      if (event.status === 'closed' || event.status === 'cancelled') return fail(`This event is ${event.status}. Orders can no longer change.`)
      if (order.status !== 'approved') return fail('Only an approved order can be paid.')
      const block = orderPayBlock(actor, order)
      if (block) return fail(block)
      const locked = lockError()
      if (locked) return fail(locked)
      const fund = get().funds.find((f) => f.id === event.fundId)
      if (!fund || fund.balance < order.amount) return fail(`The ${event.name} Fund holds ${formatMoney(fund?.balance ?? 0)}, less than this order.`)
      const now = new Date().toISOString()
      set((s) => {
        const entry = journalEntry(newId('je-evt'), now, event.sectorId, `Event expense paid — ${order.vendorName}, ${event.name}`, [
          { account: 'Event expenditure', fundId: fund.id, debit: order.amount, credit: 0 },
          { account: 'Bank', fundId: fund.id, debit: 0, credit: order.amount },
        ], order.id)
        return {
          eventOrders: s.eventOrders.map((o) => (o.id === orderId ? { ...o, status: 'paid' as const, paidBy: actor.id, paidAt: now } : o)),
          ...postLedger(s, entry, { [fund.id]: -order.amount }),
          audit: [stamp(event, actor, 'Paid event order', { before: 'approved', after: 'paid' }), ...s.audit],
        }
      })
      toast.success('Order paid', `${formatMoney(order.amount)} to ${order.vendorName} from the ${event.name} Fund.`)
      return { ok: true }
    },
  }
}
