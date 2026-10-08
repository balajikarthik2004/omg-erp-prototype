import type { ReactNode } from 'react'
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
}

const ALIGN = { left: 'text-left', right: 'text-right', center: 'text-center' } as const

export function Table<T>({
  columns,
  rows,
  rowKey,
  onRowClick,
  empty,
  className,
  rowClassName,
}: TableProps<T>) {
  if (rows.length === 0 && empty) return <>{empty}</>

  return (
    <div className={className}>
      {/* Desktop and tablet: a real table, scrolling inside its own container */}
      <div className="scrollbar-thin hidden overflow-x-auto rounded-card border border-sandal-200 shadow-flat md:block">
        <table className="w-full border-collapse text-[14px]">
          <thead>
            <tr className="bg-sandal-100">
              {columns.map((col) => (
                <th
                  key={col.key}
                  scope="col"
                  className={cn(
                    'border-b border-sandal-200 px-4 py-2.5',
                    'text-[11px] font-semibold tracking-[0.1em] text-stone-500 uppercase',
                    ALIGN[col.align ?? 'left'],
                    col.className,
                  )}
                >
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
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
                  'group bg-sandal-50 transition-colors duration-150',
                  'border-b border-sandal-200 last:border-b-0',
                  onRowClick && 'cursor-pointer hover:bg-turmeric-50 focus-visible:bg-turmeric-50',
                  rowClassName?.(row),
                )}
              >
                {columns.map((col) => (
                  <td
                    key={col.key}
                    className={cn(
                      'px-4 py-3 text-stone-700',
                      ALIGN[col.align ?? 'left'],
                      col.className,
                    )}
                  >
                    {col.cell(row)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile: stacked cards */}
      <ul className="flex flex-col gap-3 md:hidden">
        {rows.map((row) => {
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
                  'rounded-card border border-sandal-200 bg-sandal-50 p-4 shadow-flat',
                  onRowClick && 'cursor-pointer active:bg-turmeric-50',
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
                <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-2">
                  {rest.map((col) => (
                    <div key={col.key} className="contents">
                      <dt className="text-[11px] tracking-[0.1em] text-stone-500 uppercase">{col.header}</dt>
                      <dd className="text-right text-[14px] text-stone-700">{col.cell(row)}</dd>
                    </div>
                  ))}
                </dl>
              </div>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
