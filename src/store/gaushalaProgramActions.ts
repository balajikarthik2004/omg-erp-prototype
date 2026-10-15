import type { StoreApi } from 'zustand'

import { formatMoney } from '@/lib/format'
import { toast } from '@/lib/toast'
import type {
  Adoption,
  AdoptionTier,
  AdopterUpdate,
  Booking,
  GaushalaEvent,
  GaushalaEventRsvp,
  User,
  Volunteer,
  VolunteerInterest,
  VolunteerShift,
} from '@/types'
import { adoptionPrice, visitServiceById } from '@/mock/gaushalaPrograms'
import { audit, type DbState } from './db'

type Set = StoreApi<DbState>['setState']
type Get = StoreApi<DbState>['getState']

type Result<T = object> = ({ ok: true } & T) | { ok: false; error: string }

export interface BookingInput {
  slotId: string
  name: string
  email: string
  phone: string
  people: number
  consent: boolean
  note?: string
}

export interface RsvpInput {
  eventId: string
  name: string
  email: string
  people: number
}

export interface VolunteerInput {
  name: string
  email: string
  phone: string
  city: string
  skills: string
  availability: string
  interests: VolunteerInterest[]
  isGroup: boolean
  groupSize?: number
  organisation?: string
}

export interface GaushalaProgramActions {
  /* adopt a cow */
  adoptCow: (cowId: string, tier: AdoptionTier, adopter: { name: string; email: string }, actor: User) => Result<{ adoption: Adoption }>
  cancelAdoption: (id: string, actor: User) => Result
  renewAdoption: (id: string, actor: User) => Result
  postAdopterUpdate: (adoptionId: string, update: Omit<AdopterUpdate, 'id' | 'at'>, actor: User) => Result

  /* visit & book */
  createBooking: (input: BookingInput, actor: User) => Result<{ booking: Booking }>
  decideBooking: (id: string, decision: 'confirmed' | 'cancelled', actor: User, note?: string) => Result
  checkInBooking: (qrToken: string, actor: User) => Result<{ booking: Booking }>
  setSlotBlackout: (slotId: string, blackout: boolean, reason: string, actor: User) => Result

  /* events */
  saveGaushalaEvent: (event: Partial<GaushalaEvent> & { id?: string }, actor: User) => Result<{ event: GaushalaEvent }>
  rsvpGaushalaEvent: (input: RsvpInput, actor: User) => Result<{ rsvp: GaushalaEventRsvp }>
  cancelRsvp: (id: string, actor: User) => Result

  /* volunteer */
  applyVolunteer: (input: VolunteerInput, actor: User) => Result<{ volunteer: Volunteer }>
  decideVolunteer: (id: string, decision: 'approved' | 'rejected', actor: User, note?: string) => Result
  logVolunteerShift: (input: Omit<VolunteerShift, 'id' | 'loggedBy'>, actor: User) => Result
  issueVolunteerCertificate: (id: string, actor: User) => Result
}

/** Hours of work before a volunteer certificate is worth issuing. */
export const CERTIFICATE_HOURS = 20

/**
 * The five Gaushala programmes.
 *
 * Money still never moves in here. An adoption, a paid visit and a paid
 * festival ticket are all bought through the ordinary cart, so the ledger,
 * the receipt and the fund balances stay the one shared machinery. What lives
 * here is the shelter's own bookkeeping around them: who has a slot, who
 * turned up, who is sponsoring which cow and who has done the hours.
 */
export function createProgramActions(set: Set, get: Get): GaushalaProgramActions {
  const nextId = (prefix: string, count: number, width = 4) =>
    `${prefix}-${String(count + 1).padStart(width, '0')}`

  return {
    /* ------------------------------------------------------- adopt a cow */

    adoptCow: (cowId, tier, adopter, actor) => {
      const state = get()
      const cow = state.cows.find((c) => c.id === cowId)
      if (!cow) return { ok: false, error: 'That cow is not on the register.' }
      if (cow.status === 'deceased') return { ok: false, error: `${cow.name} is no longer with us.` }
      if (adopter.name.trim().length < 2) return { ok: false, error: 'Enter the name for the certificate.' }
      if (!/^\S+@\S+\.\S+$/.test(adopter.email.trim())) {
        return { ok: false, error: 'We need a working email to send the monthly updates to.' }
      }

      const already = state.adoptions.filter((a) => a.cowId === cowId && a.status === 'active')
      const fullTaken = already.some((a) => a.tier === 'full_monthly' || a.tier === 'full_yearly')
      if (fullTaken) {
        return { ok: false, error: `${cow.name} is already fully sponsored. A shared tier is still open.` }
      }
      // Four shares make a whole cow, and no more than that.
      if (already.length >= 4) {
        return { ok: false, error: `${cow.name} already has four sponsors, which covers her keep.` }
      }

      const year = new Date().getFullYear()
      const seq = state.adoptions.length + 1
      const yearly = tier === 'full_yearly' || tier === 'shared_yearly'
      const renews = new Date()
      if (yearly) renews.setFullYear(renews.getFullYear() + 1)
      else renews.setMonth(renews.getMonth() + 1)

      const adoption: Adoption = {
        id: nextId('ADP', state.adoptions.length),
        cowId,
        adopterName: adopter.name.trim(),
        adopterEmail: adopter.email.trim(),
        tier,
        amount: adoptionPrice(cow, tier),
        currency: 'USD',
        startedAt: new Date().toISOString(),
        renewsAt: renews.toISOString(),
        status: 'active',
        certificateNo: `GAU-ADP-${String(year).slice(2)}-${String(seq).padStart(4, '0')}`,
        updates: [],
      }

      set((s) => ({
        adoptions: [adoption, ...s.adoptions],
        cows: s.cows.map((c) => (c.id === cowId ? { ...c, status: 'adopted', adoptedBy: adoption.adopterName } : c)),
        audit: [
          audit(actor, `${cow.name} adopted — ${adoption.certificateNo}`, 'Adoption', adoption.id, {
            sectorId: 'sevalaya',
            after: 'active',
          }),
          ...s.audit,
        ],
      }))
      toast.success('Adoption recorded', `${cow.name} · ${formatMoney(adoption.amount)} · certificate ${adoption.certificateNo}`)
      return { ok: true, adoption }
    },

    cancelAdoption: (id, actor) => {
      const adoption = get().adoptions.find((a) => a.id === id)
      if (!adoption) return { ok: false, error: 'That adoption does not exist.' }
      if (adoption.status === 'cancelled') return { ok: false, error: 'It is already cancelled.' }

      set((s) => {
        const stillSponsored = s.adoptions.some(
          (a) => a.cowId === adoption.cowId && a.id !== id && a.status === 'active',
        )
        return {
          adoptions: s.adoptions.map((a) => (a.id === id ? { ...a, status: 'cancelled' } : a)),
          // She goes back on the list only if nobody else is sponsoring her.
          cows: s.cows.map((c) =>
            c.id === adoption.cowId && !stillSponsored ? { ...c, status: 'adoptable', adoptedBy: undefined } : c,
          ),
          audit: [
            audit(actor, `Adoption cancelled — ${adoption.certificateNo}`, 'Adoption', id, {
              sectorId: 'sevalaya',
              before: adoption.status,
              after: 'cancelled',
            }),
            ...s.audit,
          ],
        }
      })
      toast.info('Adoption cancelled', 'No further renewal will be taken.')
      return { ok: true }
    },

    renewAdoption: (id, actor) => {
      const adoption = get().adoptions.find((a) => a.id === id)
      if (!adoption) return { ok: false, error: 'That adoption does not exist.' }
      if (adoption.status === 'cancelled') return { ok: false, error: 'A cancelled adoption cannot be renewed.' }

      const yearly = adoption.tier === 'full_yearly' || adoption.tier === 'shared_yearly'
      const renews = new Date(adoption.renewsAt)
      // Renew from the date it was due, not from today, so a late renewal does
      // not quietly shorten the next period.
      if (yearly) renews.setFullYear(renews.getFullYear() + 1)
      else renews.setMonth(renews.getMonth() + 1)

      set((s) => ({
        adoptions: s.adoptions.map((a) =>
          a.id === id ? { ...a, status: 'active', renewsAt: renews.toISOString() } : a,
        ),
        audit: [
          audit(actor, `Adoption renewed — ${adoption.certificateNo}`, 'Adoption', id, {
            sectorId: 'sevalaya',
            before: adoption.status,
            after: 'active',
          }),
          ...s.audit,
        ],
      }))
      toast.success('Renewed', `Next renewal ${renews.toDateString()}.`)
      return { ok: true }
    },

    postAdopterUpdate: (adoptionId, update, actor) => {
      const adoption = get().adoptions.find((a) => a.id === adoptionId)
      if (!adoption) return { ok: false, error: 'That adoption does not exist.' }
      if (update.title.trim().length < 3) return { ok: false, error: 'Give the update a title.' }
      if (update.body.trim().length < 10) return { ok: false, error: 'Write a line or two for the adopter.' }

      const record: AdopterUpdate = {
        ...update,
        id: `upd-${Date.now().toString(36)}`,
        at: new Date().toISOString(),
      }
      set((s) => ({
        adoptions: s.adoptions.map((a) =>
          a.id === adoptionId ? { ...a, updates: [record, ...a.updates] } : a,
        ),
        audit: [
          audit(actor, `Adopter update sent — ${adoption.certificateNo}`, 'Adoption', adoptionId, {
            sectorId: 'sevalaya',
            after: update.kind,
          }),
          ...s.audit,
        ],
      }))
      toast.success('Update sent', `${adoption.adopterName} will get it by email.`)
      return { ok: true }
    },

    /* ------------------------------------------------------ visit & book */

    createBooking: ({ slotId, name, email, phone, people, consent, note }, actor) => {
      const state = get()
      const slot = state.slots.find((s) => s.id === slotId)
      if (!slot) return { ok: false, error: 'That slot does not exist.' }
      if (slot.blackout) return { ok: false, error: slot.blackoutReason ?? 'The shelter is closed that day.' }

      const service = visitServiceById(slot.serviceId)
      if (!service) return { ok: false, error: 'That visit is no longer offered.' }
      if (name.trim().length < 2) return { ok: false, error: 'Enter the name for the booking.' }
      if (!/^\S+@\S+\.\S+$/.test(email.trim())) return { ok: false, error: 'We send the QR code by email, so we need a working one.' }
      if (people < service.minPeople) return { ok: false, error: `${service.name} takes at least ${service.minPeople}.` }
      if (people > service.maxPeople) return { ok: false, error: `${service.name} takes at most ${service.maxPeople}.` }
      if (slot.booked + people > slot.capacity) {
        return { ok: false, error: `Only ${slot.capacity - slot.booked} place${slot.capacity - slot.booked === 1 ? '' : 's'} left in that slot.` }
      }
      // The waiver is accepted before the visit, never after.
      if (!consent) return { ok: false, error: 'Please accept the visitor safety rules before booking.' }

      const booking: Booking = {
        id: nextId('BK', state.bookings.length, 5),
        slotId,
        serviceId: service.id,
        name: name.trim(),
        email: email.trim(),
        phone: phone.trim(),
        people,
        amount: service.pricePerPerson * people,
        currency: 'USD',
        // A group visit is looked at by a person before it is confirmed.
        status: service.needsApproval ? 'pending' : 'confirmed',
        qrToken: `gau-visit-${slotId}-${Date.now().toString(36)}`,
        consentAcceptedAt: new Date().toISOString(),
        bookedAt: new Date().toISOString(),
        note: note?.trim() || undefined,
      }

      set((s) => ({
        bookings: [booking, ...s.bookings],
        slots: s.slots.map((sl) => (sl.id === slotId ? { ...sl, booked: sl.booked + people } : sl)),
        audit: [
          audit(actor, `Visit booked — ${service.name}`, 'Booking', booking.id, {
            sectorId: 'sevalaya',
            after: booking.status,
          }),
          ...s.audit,
        ],
      }))

      toast.success(
        service.needsApproval ? 'Request sent' : 'Booked',
        service.needsApproval
          ? 'The shelter will confirm a group visit by email, usually within a day.'
          : `${service.name} · ${slot.date} at ${slot.startTime}. Your QR code is on the confirmation.`,
      )
      return { ok: true, booking }
    },

    decideBooking: (id, decision, actor, note) => {
      const booking = get().bookings.find((b) => b.id === id)
      if (!booking) return { ok: false, error: 'That booking does not exist.' }
      if (booking.status === 'checked_in') return { ok: false, error: 'They have already been checked in.' }
      if (booking.status === decision) return { ok: false, error: 'It is already in that state.' }

      set((s) => ({
        bookings: s.bookings.map((b) => (b.id === id ? { ...b, status: decision, note: note?.trim() || b.note } : b)),
        // Cancelling gives the places back to the slot.
        slots:
          decision === 'cancelled'
            ? s.slots.map((sl) => (sl.id === booking.slotId ? { ...sl, booked: Math.max(0, sl.booked - booking.people) } : sl))
            : s.slots,
        audit: [
          audit(actor, `Booking ${decision} — ${booking.name}`, 'Booking', id, {
            sectorId: 'sevalaya',
            before: booking.status,
            after: decision,
          }),
          ...s.audit,
        ],
      }))
      toast.success(decision === 'confirmed' ? 'Confirmed' : 'Cancelled', `${booking.name}, ${booking.people} people.`)
      return { ok: true }
    },

    checkInBooking: (qrToken, actor) => {
      const token = qrToken.trim()
      if (!token) return { ok: false, error: 'Scan or paste the code from the visitor.' }
      const booking = get().bookings.find((b) => b.qrToken === token)
      if (!booking) return { ok: false, error: 'That code does not match any booking.' }
      if (booking.status === 'cancelled') return { ok: false, error: 'That booking was cancelled.' }
      if (booking.status === 'pending') return { ok: false, error: 'That group visit has not been confirmed yet.' }
      if (booking.status === 'checked_in') return { ok: false, error: `${booking.name} has already been checked in.` }
      if (!booking.consentAcceptedAt) return { ok: false, error: 'The safety waiver has not been accepted.' }

      const at = new Date().toISOString()
      const next: Booking = { ...booking, status: 'checked_in', checkedInAt: at }
      set((s) => ({
        bookings: s.bookings.map((b) => (b.id === booking.id ? next : b)),
        audit: [
          audit(actor, `Visitor checked in — ${booking.name}`, 'Booking', booking.id, {
            sectorId: 'sevalaya',
            before: booking.status,
            after: 'checked_in',
          }),
          ...s.audit,
        ],
      }))
      toast.success('Checked in', `${booking.name} · ${booking.people} ${booking.people === 1 ? 'person' : 'people'}.`)
      return { ok: true, booking: next }
    },

    setSlotBlackout: (slotId, blackout, reason, actor) => {
      const slot = get().slots.find((s) => s.id === slotId)
      if (!slot) return { ok: false, error: 'That slot does not exist.' }
      if (blackout && slot.booked > 0) {
        return { ok: false, error: `${slot.booked} ${slot.booked === 1 ? 'person has' : 'people have'} already booked that slot. Cancel those first.` }
      }
      if (blackout && reason.trim().length < 3) return { ok: false, error: 'Say why it is closed.' }

      set((s) => ({
        slots: s.slots.map((sl) =>
          sl.id === slotId
            ? { ...sl, blackout: blackout || undefined, blackoutReason: blackout ? reason.trim() : undefined }
            : sl,
        ),
        audit: [
          audit(actor, blackout ? `Slot closed — ${reason.trim()}` : 'Slot reopened', 'Slot', slotId, {
            sectorId: 'sevalaya',
            after: blackout ? 'blackout' : 'open',
          }),
          ...s.audit,
        ],
      }))
      toast.success(blackout ? 'Slot closed' : 'Slot reopened')
      return { ok: true }
    },

    /* ----------------------------------------------------------- events */

    saveGaushalaEvent: (input, actor) => {
      const state = get()
      if (!input.name || input.name.trim().length < 3) return { ok: false, error: 'Give the festival a name.' }
      if (!input.startAt || !input.endAt) return { ok: false, error: 'Set when it starts and ends.' }
      if (new Date(input.endAt).getTime() <= new Date(input.startAt).getTime()) {
        return { ok: false, error: 'It has to end after it starts.' }
      }
      if (input.isPaid && !input.ticketPrice) return { ok: false, error: 'A paid registration needs a price.' }

      const existing = input.id ? state.gaushalaEvents.find((e) => e.id === input.id) : undefined
      const event: GaushalaEvent = {
        id: existing?.id ?? nextId('GEV', state.gaushalaEvents.length),
        name: input.name.trim(),
        tamil: input.tamil?.trim() || undefined,
        startAt: new Date(input.startAt).toISOString(),
        endAt: new Date(input.endAt).toISOString(),
        venue: input.venue?.trim() || existing?.venue || 'OMG Gaushala',
        summary: input.summary?.trim() ?? existing?.summary ?? '',
        rituals: input.rituals ?? existing?.rituals ?? [],
        status: input.status ?? existing?.status ?? 'draft',
        isPaid: input.isPaid ?? false,
        ticketPrice: input.isPaid ? input.ticketPrice : undefined,
        capacity: input.capacity ?? existing?.capacity,
        registered: existing?.registered ?? 0,
        livestreamUrl: input.livestreamUrl?.trim() || undefined,
        galleryArt: existing?.galleryArt ?? [],
      }

      set((s) => ({
        gaushalaEvents: existing
          ? s.gaushalaEvents.map((e) => (e.id === event.id ? event : e)).sort((a, b) => a.startAt.localeCompare(b.startAt))
          : [...s.gaushalaEvents, event].sort((a, b) => a.startAt.localeCompare(b.startAt)),
        audit: [
          audit(actor, `${existing ? 'Festival updated' : 'Festival added'} — ${event.name}`, 'GaushalaEvent', event.id, {
            sectorId: 'sevalaya',
            before: existing?.status,
            after: event.status,
          }),
          ...s.audit,
        ],
      }))
      toast.success(existing ? 'Festival updated' : 'Festival added', event.name)
      return { ok: true, event }
    },

    rsvpGaushalaEvent: ({ eventId, name, email, people }, actor) => {
      const state = get()
      const event = state.gaushalaEvents.find((e) => e.id === eventId)
      if (!event) return { ok: false, error: 'That festival is not on the calendar.' }
      if (event.status === 'cancelled') return { ok: false, error: 'That festival has been cancelled.' }
      if (event.status === 'completed') return { ok: false, error: 'That one has already been held.' }
      if (name.trim().length < 2) return { ok: false, error: 'Enter the name to register under.' }
      if (!/^\S+@\S+\.\S+$/.test(email.trim())) return { ok: false, error: 'We send the pass by email, so we need a working one.' }
      if (people < 1) return { ok: false, error: 'At least one person.' }
      if (event.capacity && event.registered + people > event.capacity) {
        const left = event.capacity - event.registered
        return { ok: false, error: left > 0 ? `Only ${left} place${left === 1 ? '' : 's'} left.` : 'This one is full.' }
      }

      const rsvp: GaushalaEventRsvp = {
        id: nextId('RSVP', state.eventRsvps.length, 5),
        eventId,
        name: name.trim(),
        email: email.trim(),
        people,
        amount: event.isPaid ? (event.ticketPrice ?? 0) * people : 0,
        currency: 'USD',
        status: 'going',
        qrToken: `gau-rsvp-${eventId}-${Date.now().toString(36)}`,
        rsvpAt: new Date().toISOString(),
      }

      set((s) => ({
        eventRsvps: [rsvp, ...s.eventRsvps],
        gaushalaEvents: s.gaushalaEvents.map((e) =>
          e.id === eventId ? { ...e, registered: e.registered + people } : e,
        ),
        audit: [
          audit(actor, `Festival registration — ${event.name}`, 'GaushalaEventRsvp', rsvp.id, {
            sectorId: 'sevalaya',
            after: 'going',
          }),
          ...s.audit,
        ],
      }))
      toast.success(
        'You are registered',
        event.isPaid
          ? `${event.name} · ${formatMoney(rsvp.amount)}. The pass is on its way by email.`
          : `${event.name}. The pass is on its way by email.`,
      )
      return { ok: true, rsvp }
    },

    cancelRsvp: (id, actor) => {
      const rsvp = get().eventRsvps.find((r) => r.id === id)
      if (!rsvp) return { ok: false, error: 'That registration does not exist.' }
      if (rsvp.status !== 'going') return { ok: false, error: 'It is not an open registration.' }

      set((s) => ({
        eventRsvps: s.eventRsvps.map((r) => (r.id === id ? { ...r, status: 'cancelled' } : r)),
        gaushalaEvents: s.gaushalaEvents.map((e) =>
          e.id === rsvp.eventId ? { ...e, registered: Math.max(0, e.registered - rsvp.people) } : e,
        ),
        audit: [
          audit(actor, `Festival registration cancelled — ${rsvp.name}`, 'GaushalaEventRsvp', id, {
            sectorId: 'sevalaya',
            before: 'going',
            after: 'cancelled',
          }),
          ...s.audit,
        ],
      }))
      toast.info('Registration cancelled', 'The places have gone back to the pool.')
      return { ok: true }
    },

    /* -------------------------------------------------------- volunteer */

    applyVolunteer: (input, actor) => {
      if (input.name.trim().length < 2) return { ok: false, error: 'Tell us your name.' }
      if (!/^\S+@\S+\.\S+$/.test(input.email.trim())) return { ok: false, error: 'We need a working email to reply to.' }
      if (input.interests.length === 0) return { ok: false, error: 'Pick at least one thing you would like to help with.' }
      if (input.availability.trim().length < 3) return { ok: false, error: 'Tell us roughly when you are free.' }
      if (input.isGroup && (!input.groupSize || input.groupSize < 2)) {
        return { ok: false, error: 'How many people are coming?' }
      }

      const volunteer: Volunteer = {
        id: nextId('VOL', get().volunteers.length),
        name: input.name.trim(),
        email: input.email.trim(),
        phone: input.phone.trim(),
        city: input.city.trim(),
        skills: input.skills.trim(),
        availability: input.availability.trim(),
        interests: input.interests,
        isGroup: input.isGroup,
        groupSize: input.isGroup ? input.groupSize : undefined,
        organisation: input.isGroup ? input.organisation?.trim() || undefined : undefined,
        appliedAt: new Date().toISOString(),
        status: 'pending',
        hours: 0,
      }

      set((s) => ({
        volunteers: [volunteer, ...s.volunteers],
        audit: [
          audit(actor, `Volunteer application — ${volunteer.name}`, 'Volunteer', volunteer.id, {
            sectorId: 'sevalaya',
            after: 'pending',
          }),
          ...s.audit,
        ],
      }))
      toast.success('Application received', 'Someone at the shelter will write back within a few days.')
      return { ok: true, volunteer }
    },

    decideVolunteer: (id, decision, actor, note) => {
      const volunteer = get().volunteers.find((v) => v.id === id)
      if (!volunteer) return { ok: false, error: 'That application does not exist.' }
      if (volunteer.status === decision) return { ok: false, error: 'It is already in that state.' }
      if (decision === 'rejected' && (note ?? '').trim().length < 5) {
        return { ok: false, error: 'Say why, so they can be told something useful.' }
      }

      set((s) => ({
        volunteers: s.volunteers.map((v) =>
          v.id === id ? { ...v, status: decision, reviewedBy: actor.id, reviewNote: note?.trim() || undefined } : v,
        ),
        audit: [
          audit(actor, `Volunteer ${decision} — ${volunteer.name}`, 'Volunteer', id, {
            sectorId: 'sevalaya',
            before: volunteer.status,
            after: decision,
          }),
          ...s.audit,
        ],
      }))
      toast.success(decision === 'approved' ? 'Approved' : 'Declined', volunteer.name)
      return { ok: true }
    },

    logVolunteerShift: (input, actor) => {
      const volunteer = get().volunteers.find((v) => v.id === input.volunteerId)
      if (!volunteer) return { ok: false, error: 'That volunteer does not exist.' }
      if (volunteer.status !== 'approved') return { ok: false, error: 'Only an approved volunteer can be put on a shift.' }
      if (input.hours <= 0 || input.hours > 14) return { ok: false, error: 'Hours have to be between 1 and 14.' }
      if (!input.date) return { ok: false, error: 'Pick the date of the shift.' }

      const shift: VolunteerShift = {
        ...input,
        id: `VSH-${Date.now().toString(36)}`,
        loggedBy: actor.id,
      }
      set((s) => ({
        volunteerShifts: [shift, ...s.volunteerShifts],
        volunteers: s.volunteers.map((v) =>
          v.id === input.volunteerId ? { ...v, hours: v.hours + input.hours } : v,
        ),
        audit: [
          audit(actor, `Shift logged — ${volunteer.name}, ${input.hours}h`, 'VolunteerShift', shift.id, {
            sectorId: 'sevalaya',
          }),
          ...s.audit,
        ],
      }))
      toast.success('Shift logged', `${volunteer.name} · ${input.hours} hours.`)
      return { ok: true }
    },

    issueVolunteerCertificate: (id, actor) => {
      const volunteer = get().volunteers.find((v) => v.id === id)
      if (!volunteer) return { ok: false, error: 'That volunteer does not exist.' }
      if (volunteer.status !== 'approved') return { ok: false, error: 'Only an approved volunteer gets a certificate.' }
      if (volunteer.hours < CERTIFICATE_HOURS) {
        return { ok: false, error: `${volunteer.name} has ${volunteer.hours} hours. A certificate needs ${CERTIFICATE_HOURS}.` }
      }

      const at = new Date().toISOString()
      set((s) => ({
        volunteers: s.volunteers.map((v) => (v.id === id ? { ...v, certificateIssuedAt: at } : v)),
        audit: [
          audit(actor, `Volunteer certificate issued — ${volunteer.name}`, 'Volunteer', id, { sectorId: 'sevalaya' }),
          ...s.audit,
        ],
      }))
      toast.success('Certificate issued', `${volunteer.name} · ${volunteer.hours} hours.`)
      return { ok: true }
    },
  }
}
