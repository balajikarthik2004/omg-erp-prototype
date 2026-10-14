import { forwardRef, useId, type ReactNode, type SelectHTMLAttributes } from 'react'
import { ChevronDown } from 'lucide-react'
import { cn } from '@/lib/cn'

export interface SelectOption {
  value: string
  label: string
}

export interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: ReactNode
  hint?: ReactNode
  options: SelectOption[]
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(function Select(
  { label, hint, options, className, id, ...rest },
  ref,
) {
  const autoId = useId()
  const fieldId = id ?? autoId

  return (
    <div className="w-full">
      {label ? (
        <label htmlFor={fieldId} className="mb-1.5 block text-[13px] font-bold text-navy-900">
          {label}
        </label>
      ) : null}
      <div className="relative">
        <select
          ref={ref}
          id={fieldId}
          className={cn(
            'w-full appearance-none rounded-xl border border-navy-200/90 bg-white py-2.5 pr-9 pl-3.5',
            'text-[15px] text-navy-950 font-medium transition-all duration-150 shadow-2xs',
            'focus:border-kumkum-500 focus:ring-3 focus:ring-kumkum-500/15 focus:outline-none',
            'disabled:bg-navy-50 disabled:border-navy-100 disabled:text-navy-400',
            className,
          )}
          {...rest}
        >
          {options.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
        <ChevronDown
          className="pointer-events-none absolute top-1/2 right-3 size-4 -translate-y-1/2 text-navy-500"
          aria-hidden
        />
      </div>
      {hint ? <p className="mt-1 text-[13px] text-stone-500">{hint}</p> : null}
    </div>
  )
})
