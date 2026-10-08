import { cn } from '@/lib/cn'

export function Skeleton({ className }: { className?: string }) {
  return (
    <div
      className={cn('rounded-md bg-sandal-100', className)}
      style={{
        backgroundImage:
          'linear-gradient(90deg, var(--color-sandal-100) 0%, var(--color-sandal-200) 50%, var(--color-sandal-100) 100%)',
        backgroundSize: '800px 100%',
        animation: 'omg-shimmer 1.4s linear infinite',
      }}
      aria-hidden
    />
  )
}

export function TableSkeleton({ rows = 6, cols = 5 }: { rows?: number; cols?: number }) {
  return (
    <div className="overflow-hidden rounded-card border border-sandal-200" aria-busy="true" aria-label="Loading">
      <div className="flex gap-4 border-b border-sandal-200 bg-sandal-100 px-4 py-3">
        {Array.from({ length: cols }).map((_, i) => (
          <Skeleton key={i} className="h-3 flex-1" />
        ))}
      </div>
      {Array.from({ length: rows }).map((_, r) => (
        <div key={r} className="flex gap-4 border-b border-sandal-200 px-4 py-3.5 last:border-0">
          {Array.from({ length: cols }).map((_, c) => (
            <Skeleton key={c} className="h-4 flex-1" />
          ))}
        </div>
      ))}
    </div>
  )
}

export function CardSkeleton({ count = 3 }: { count?: number }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3" aria-busy="true" aria-label="Loading">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="rounded-card border border-sandal-200 bg-sandal-50 p-5">
          <Skeleton className="h-3 w-24" />
          <Skeleton className="mt-3 h-7 w-32" />
          <Skeleton className="mt-3 h-3 w-full" />
        </div>
      ))}
    </div>
  )
}
