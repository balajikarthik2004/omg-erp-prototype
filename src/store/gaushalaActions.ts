import type { StoreApi } from 'zustand'

import { formatMoney } from '@/lib/format'
import { toast } from '@/lib/toast'
import type {
  Cow,
  CowHealthRecord,
  ProofMedia,
  SewaOrder,
  User,
} from '@/types'
import { audit, type DbState } from './db'

type Set = StoreApi<DbState>['setState']
type Get = StoreApi<DbState>['getState']

type Result = { ok: true } | { ok: false; error: string }

export interface NewCowInput {
  name: string
  tamil?: string
  kind: Cow['kind']
  breed: string
  gender: Cow['gender']
  ageYears: number
  status: Cow['status']
  story: string
  rescuedAt: string
  caretakerId: string
  monthlyCare: number
  milkYield?: number
  healthNote?: string
}

export interface NewHealthRecordInput {
  cowId: string
  kind: CowHealthRecord['kind']
  note: string
  vet: string
  cost: number
  nextDueAt?: string
}

export interface GaushalaActions {
  /* cows */
  createCow: (input: NewCowInput, actor: User) => Result
  updateCow: (id: string, patch: Partial<Cow>, actor: User) => Result
  addCowHealthRecord: (input: NewHealthRecordInput, actor: User) => Result

  /* sewa catalogue */
  setSewaActive: (sewaId: string, active: boolean, actor: User) => void
  setSewaPopular: (sewaId: string, popular: boolean, actor: User) => void

  /* fulfilment queue */
  assignSewaOrder: (orderId: string, caretakerId: string, actor: User) => Result
  completeSewaOrder: (orderId: string, proof: ProofMedia, actor: User) => Result
}

/**
 * Gaushala store actions.
 *
 * Deliberately thin: money never moves here. A sewa is paid for through the
 * ordinary cart and donation flow, so the ledger, the receipt and the fund
 * balances are the same machinery as every other offering on the site. What
 * lives here is the shelter's own record-keeping — the herd, its health, and
 * whether a paid sewa has actually been carried out yet.
 */
export function createGaushalaActions(set: Set, get: Get): GaushalaActions {
  const cowOf = (id: string) => get().cows.find((c) => c.id === id)
  const orderOf = (id: string) => get().sewaOrders.find((o) => o.id === id)

  return {
    createCow: (input, actor) => {
      if (input.name.trim().length < 2) return { ok: false, error: 'Give the cow a name.' }
      const seq = get().cows.length + 1
      const cow: Cow = {
        id: `cow-${String(seq).padStart(3, '0')}`,
        name: input.name.trim(),
        tamil: input.tamil?.trim() || undefined,
        kind: input.kind,
        breed: input.breed.trim(),
        gender: input.gender,
        ageYears: input.ageYears,
        status: input.status,
        story: input.story.trim(),
        rescuedAt: new Date(input.rescuedAt).toISOString(),
        caretakerId: input.caretakerId,
        portrait: seq % 6,
        monthlyCare: input.monthlyCare,
        milkYield: input.milkYield,
        healthNote: input.healthNote?.trim() || undefined,
      }
      set((s) => ({
        cows: [cow, ...s.cows],
        audit: [
          audit(actor, `Cow added to the herd — ${cow.name}`, 'Cow', cow.id, {
            sectorId: 'sevalaya',
            after: cow.status,
          }),
          ...s.audit,
        ],
      }))
      toast.success('Cow added', `${cow.name} is now on the register.`)
      return { ok: true }
    },

    updateCow: (id, patch, actor) => {
      const cow = cowOf(id)
      if (!cow) return { ok: false, error: 'That cow is not on the register.' }
      const next = { ...cow, ...patch }
      set((s) => ({
        cows: s.cows.map((c) => (c.id === id ? next : c)),
        audit: [
          audit(actor, `Cow record updated — ${next.name}`, 'Cow', id, {
            sectorId: 'sevalaya',
            before: cow.status,
            after: next.status,
          }),
          ...s.audit,
        ],
      }))
      toast.success('Saved', `${next.name}'s record has been updated.`)
      return { ok: true }
    },

    addCowHealthRecord: (input, actor) => {
      const cow = cowOf(input.cowId)
      if (!cow) return { ok: false, error: 'That cow is not on the register.' }
      if (input.note.trim().length < 3) return { ok: false, error: 'Write what was done.' }
      const record: CowHealthRecord = {
        id: `chr-${input.cowId}-${Date.now().toString(36)}`,
        cowId: input.cowId,
        at: new Date().toISOString(),
        kind: input.kind,
        note: input.note.trim(),
        vet: input.vet.trim(),
        cost: input.cost,
        nextDueAt: input.nextDueAt ? new Date(input.nextDueAt).toISOString() : undefined,
      }
      set((s) => ({
        cowHealth: [record, ...s.cowHealth],
        audit: [
          audit(actor, `${input.kind} logged for ${cow.name}`, 'CowHealthRecord', record.id, {
            sectorId: 'sevalaya',
            after: input.kind,
          }),
          ...s.audit,
        ],
      }))
      toast.success('Health record added', `${cow.name} — ${input.kind}, ${formatMoney(input.cost)}.`)
      return { ok: true }
    },

    /**
     * The catalogue flags are demo-local: the sewa list itself is seeded
     * module data, so a toggle is recorded in the audit trail and reflected
     * on screen without pretending to write back to a catalogue service.
     */
    setSewaActive: (sewaId, active, actor) => {
      set((s) => ({
        audit: [
          audit(actor, `Sewa ${active ? 'published' : 'withdrawn'} — ${sewaId}`, 'GaushalaSewa', sewaId, {
            sectorId: 'sevalaya',
            before: active ? 'inactive' : 'active',
            after: active ? 'active' : 'inactive',
          }),
          ...s.audit,
        ],
      }))
      toast.success(active ? 'Sewa published' : 'Sewa withdrawn', active ? 'Donors can see it now.' : 'It is hidden from the public page.')
    },

    setSewaPopular: (sewaId, popular, actor) => {
      set((s) => ({
        audit: [
          audit(actor, `Sewa ${popular ? 'marked' : 'unmarked'} popular — ${sewaId}`, 'GaushalaSewa', sewaId, {
            sectorId: 'sevalaya',
          }),
          ...s.audit,
        ],
      }))
      toast.info(popular ? 'Marked popular' : 'Popular badge removed')
    },

    assignSewaOrder: (orderId, caretakerId, actor) => {
      const order = orderOf(orderId)
      if (!order) return { ok: false, error: 'That sewa order does not exist.' }
      if (order.status !== 'paid') {
        return { ok: false, error: 'Only a paid sewa that has not been assigned can be handed to a caretaker.' }
      }
      if (!caretakerId) return { ok: false, error: 'Choose a caretaker to carry it out.' }

      const next: SewaOrder = {
        ...order,
        status: 'assigned',
        assignedTo: caretakerId,
        assignedAt: new Date().toISOString(),
      }
      set((s) => ({
        sewaOrders: s.sewaOrders.map((o) => (o.id === orderId ? next : o)),
        audit: [
          audit(actor, `Sewa assigned for fulfilment — ${orderId}`, 'SewaOrder', orderId, {
            sectorId: 'sevalaya',
            before: 'paid',
            after: 'assigned',
          }),
          ...s.audit,
        ],
      }))
      toast.success('Assigned', 'It is now on that caretaker’s list for the day.')
      return { ok: true }
    },

    /**
     * Proof of sewa. A donor abroad paid for something they cannot come and
     * see, so nothing is marked done without a photograph or a video against
     * it — that evidence is what they are sent afterwards.
     */
    completeSewaOrder: (orderId, proof, actor) => {
      const order = orderOf(orderId)
      if (!order) return { ok: false, error: 'That sewa order does not exist.' }
      if (order.status !== 'assigned') {
        return { ok: false, error: 'Assign it to a caretaker before marking it done.' }
      }
      if (proof.caption.trim().length < 5) {
        return { ok: false, error: 'Describe what the donor is looking at in the proof.' }
      }

      const at = new Date().toISOString()
      const next: SewaOrder = {
        ...order,
        status: 'completed',
        completedAt: at,
        proofMedia: [...(order.proofMedia ?? []), { ...proof, at }],
      }
      set((s) => ({
        sewaOrders: s.sewaOrders.map((o) => (o.id === orderId ? next : o)),
        audit: [
          audit(actor, `Sewa completed with proof — ${orderId}`, 'SewaOrder', orderId, {
            sectorId: 'sevalaya',
            before: 'assigned',
            after: 'completed',
          }),
          ...s.audit,
        ],
      }))
      toast.success(
        'Marked complete',
        `${order.donorName} will be sent the ${proof.kind} and can see it in their devotee account.`,
      )
      return { ok: true }
    },
  }
}
