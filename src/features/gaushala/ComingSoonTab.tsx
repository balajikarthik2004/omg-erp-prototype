import { CalendarClock } from 'lucide-react'

import { Button } from '@/components/ui/Button'
import { EmptyState } from '@/components/ui/EmptyState'

/**
 * The tabs that are specified but not built yet.
 *
 * They are shown rather than hidden on purpose: the brief defines ten tabs and
 * the shape of the page should be the shape that was agreed, with the delivery
 * phase stated plainly instead of a dead link or a tab that quietly vanishes.
 */

const WHAT: Record<string, string> = {
  adopt:
    'Cow profiles with sponsorship tiers, an adopter area inside your devotee account, monthly photo updates, health reports, a digital certificate and renewals.',
  visit:
    'Slot booking for cow feeding, pooja, darshan, guided tours and school or corporate visits — with capacity limits, blackout days, payment at booking and a QR code for check-in.',
  events:
    'The festival calendar — Govardhan Puja, Gopashtami, Makar Sankranti cow puja, Pradosh — with times in your own time zone, RSVP, paid registration and the live-stream link.',
  volunteer:
    'The volunteer application: skills, availability, what you would like to help with, and group or corporate requests.',
  transparency:
    'Annual reports, audited financials, the monthly expense breakdown, the utilisation chart, the cow census and the registration numbers of the legal entity.',
}

export function ComingSoonTab({
  tab,
  onBrowseSewas,
}: {
  tab: { id: string; label: string; tamil?: string }
  onBrowseSewas: () => void
}) {
  return (
    <EmptyState
      icon={<CalendarClock className="size-6" aria-hidden />}
      title={`${tab.label} — next release`}
      message={WHAT[tab.id] ?? 'This section is specified and will follow in the next release.'}
      action={
        <Button variant="secondary" onClick={onBrowseSewas}>
          Browse sewas instead
        </Button>
      }
    />
  )
}
