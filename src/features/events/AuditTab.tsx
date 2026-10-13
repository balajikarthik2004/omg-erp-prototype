import { History } from 'lucide-react'

import { formatDateTime } from '@/lib/format'
import { EmptyState } from '@/components/ui/EmptyState'
import { ROLE_LABEL } from '@/mock/seed'
import { useDb } from '@/store/db'
import type { EventView } from './useEvent'

/** Everything anyone did to this event: who, what, when, and what it changed. */
export function AuditTab({ view }: { view: EventView }) {
  const audit = useDb((s) => s.audit)
  const rows = audit.filter((a) => a.entity === 'Event' && a.entityId === view.event.name)

  if (rows.length === 0) {
    return <EmptyState icon={<History className="size-6" aria-hidden />} title="No recorded actions yet" message="Every approval, edit, order and status change on this event is written here as it happens." />
  }

  return (
    <div className="overflow-x-auto rounded-card border border-sandal-200 bg-sandal-50">
      <table className="w-full min-w-[640px] border-collapse text-[14px]">
        <thead>
          <tr className="bg-sandal-100 text-left text-[11px] font-semibold tracking-[0.1em] text-stone-500 uppercase">
            <th className="px-4 py-3">When</th>
            <th className="px-3 py-3">Who</th>
            <th className="px-3 py-3">What</th>
            <th className="px-3 py-3">Change</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((a) => (
            <tr key={a.id} className="border-t border-sandal-200 align-top">
              <td className="px-4 py-3 font-mono text-[12px] whitespace-nowrap text-stone-700 tabular-nums">{formatDateTime(a.at)}</td>
              <td className="px-3 py-3"><span className="text-stone-900">{a.userName}</span><span className="block text-[12px] text-stone-500">{ROLE_LABEL[a.role]}</span></td>
              <td className="px-3 py-3 text-stone-900">{a.action}</td>
              <td className="px-3 py-3 font-mono text-[12px] text-stone-700">{a.before || a.after ? `${a.before ?? '—'} → ${a.after ?? '—'}` : '—'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
