import { useMemo, useState, type ReactNode } from 'react'
import { ArrowDown, ArrowUp, ChevronsUpDown } from 'lucide-react'
import { cn } from '@/lib/cn'

export interface Column<T> {
  key: string
  header: ReactNode
  /** Rendered in the desktop table and as the value in the mobile card. */
  cell: (row: T) => ReactNode
  align?: 'left' | 'right' | 'center'
  className?: string
  /** Hide this column from the stacked mobile card. */
  hideOnMobile?: boolean
  /** Promote to the mobile card title row. */
  primary?: boolean
  /**
   * Make the column sortable by returning what to sort on. Kept separate
   * from `cell`, because a cell renders a `<Money>` or a badge and you sort
   * on the number or the status behind it.
   */
  sortValue?: (row: T) => string | number
}

export interface TableProps<T> {
  columns: Column<T>[]
  rows: T[]
  rowKey: (row: T) => string
  onRowClick?: (row: T) => void
  empty?: ReactNode
  className?: string
  /** Extra classes per row, e.g. to flag overdue items. */
  rowClassName?: (row: T) => string | undefined
  /** A caption for assistive tech, naming what the table lists. */
  label?: string
}

const ALIGN = { left: 'text-left', right: 'text-right', center: 'text-center' } as const
const JUSTIFY = { left: 'justify-start', right: 'justify-end', center: 'justify-center' } as const

type Sort = { key: string; dir: 'asc' | 'desc' } | null

export function Table<T>({
  columns,
  rows,
  rowKey,
  onRowClick,
  empty,
  className,
  rowClassName,
  label,
}: TableProps<T>) {
  const [sort, setSort] = useState<Sort>(null)

  const sorted = useMemo(() => {
    if (!sort) return rows
    const col = columns.find((c) => c.key === sort.key)
    if (!col?.sortValue) return rows
    const read = col.sortValue
    // Copied before sorting: the caller's array is its own state.
    return [...rows].sort((a, b) => {
      const x = read(a)
      const y = read(b)
      const d = typeof x === 'number' && typeof y === 'number' ? x - y : String(x).localeCompare(String(y))
      return sort.dir === 'asc' ? d : -d
    })
  }, [rows, sort, columns])

  if (rows.length === 0 && empty) return <>{empty}</>

  function toggle(key: string) {
    setSort((s) =>
      s?.key !== key ? { key, dir: 'asc' } : s.dir === 'asc' ? { key, dir: 'desc' } : null,
    )
  }

  return (
    <div className={className}>
      {/* Desktop and tablet: a real table, scrolling inside its own container.
          The head stays put, so a long list never loses its column names. */}
      <div className="scrollbar-thin hidden max-h-[70vh] overflow-auto rounded-card border border-sandal-200 bg-sandal-50 shadow-card md:block">
        <table className="w-full border-collapse text-[14px]">
          {label ? <caption className="sr-only">{label}</caption> : null}
          <thead>
            <tr>
              {columns.map((col) => {
                const active = sort?.key === col.key
                const align = col.align ?? 'left'
                return (
                  <th
                    key={col.key}
                    scope="col"
                    aria-sort={active ? (sort.dir === 'asc' ? 'ascending' : 'descending') : undefined}
                    className={cn(
                      'sticky top-0 z-10 bg-sandal-100 shadow-[inset_0_-1px_0_var(--color-sandal-200)]',
                      'text-[11px] font-bold uppercase tracking-[0.08em] text-stone-500',
                      col.sortValue ? 'p-0' : 'px-4 py-2.5',
                      ALIGN[align],
                      col.className,
                    )}
                  >
                    {col.sortValue ? (
                      <button
                        type="button"
                        onClick={() => toggle(col.key)}
                        className={cn(
                          'flex w-full items-center gap-1.5 px-4 py-2.5 transition-colors duration-150',
                          'hover:text-stone-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-navy-400',
                          active && 'text-stone-900',
                          JUSTIFY[align],
                        )}
                      >
                        <span>{col.header}</span>
                        {active ? (
                          sort.dir === 'asc' ? (
                            <ArrowUp className="size-3 shrink-0" aria-hidden />
                          ) : (
                            <ArrowDown className="size-3 shrink-0" aria-hidden />
                          )
                        ) : (
                          <ChevronsUpDown className="size-3 shrink-0 opacity-0 group-hover/head:opacity-40" aria-hidden />
                        )}
                      </button>
                    ) : (
                      col.header
                    )}
                  </th>
                )
              })}
            </tr>
          </thead>
          <tbody>
            {sorted.map((row) => (
              <tr
                key={rowKey(row)}
                onClick={onRowClick ? () => onRowClick(row) : undefined}
                tabIndex={onRowClick ? 0 : undefined}
                onKeyDown={
                  onRowClick
                    ? (e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault()
                          onRowClick(row)
                        }
                      }
                    : undefined
                }
                className={cn(
                  'group border-b border-sandal-200 transition-colors duration-150 last:border-b-0',
                  onRowClick &&
                    'cursor-pointer hover:bg-sandal-100 focus-visible:bg-sandal-100 focus-visible:outline-none',
                  rowClassName?.(row),
                )}
              >
                {columns.map((col) => (
                  <td
                    key={col.key}
                    className={cn('px-4 py-2.5 text-stone-700', ALIGN[col.align ?? 'left'], col.className)}
                  >
                    {col.cell(row)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile: one card per row. Plain divs rather than a dl with
          `display: contents`, which WebKit has dropped from the a11y tree. */}
      <ul className="flex flex-col gap-2.5 md:hidden">
        {sorted.map((row) => {
          const primary = columns.filter((c) => c.primary)
          const rest = columns.filter((c) => !c.primary && !c.hideOnMobile)
          return (
            <li key={rowKey(row)}>
              <div
                role={onRowClick ? 'button' : undefined}
                tabIndex={onRowClick ? 0 : undefined}
                onClick={onRowClick ? () => onRowClick(row) : undefined}
                onKeyDown={
                  onRowClick
                    ? (e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault()
                          onRowClick(row)
                        }
                      }
                    : undefined
                }
                className={cn(
                  'rounded-card border border-sandal-200 bg-sandal-50 p-4 shadow-card',
                  onRowClick && 'cursor-pointer active:bg-sandal-100',
                  rowClassName?.(row),
                )}
              >
                {primary.length > 0 ? (
                  <div className="mb-3 flex flex-wrap items-center justify-between gap-2 border-b border-sandal-200 pb-3">
                    {primary.map((col) => (
                      <div key={col.key}>{col.cell(row)}</div>
                    ))}
                  </div>
                ) : null}
                <div className="flex flex-col gap-1.5">
                  {rest.map((col) => (
                    <div key={col.key} className="flex items-baseline justify-between gap-4">
                      <span className="text-[11px] font-bold uppercase tracking-[0.08em] text-stone-500">
                        {col.header}
                      </span>
                      <span className="min-w-0 text-right text-[14px] text-stone-900">{col.cell(row)}</span>
                    </div>
                  ))}
                </div>
              </div>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
