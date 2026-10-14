import { Button } from '@/components/ui/Button'
import { EmptyState } from '@/components/ui/EmptyState'

/** Shared by every Gaushala tab that can be searched. */
export function NoMatches({ what, query, onClear }: { what: string; query: string; onClear: () => void }) {
  return (
    <EmptyState
      title="Nothing matches that"
      message={
        query ? `No ${what} matches “${query}”. Try a shorter word.` : `There is nothing here yet.`
      }
      action={
        query ? (
          <Button variant="secondary" onClick={onClear}>
            Clear search
          </Button>
        ) : undefined
      }
    />
  )
}
