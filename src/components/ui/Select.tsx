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
        <label htmlFor={fieldId} className="mb-1.5 block text-[13px] font-medium text-stone-700">
          {label}
        </label>
      ) : null}
      <div className="relative">
        <select
          ref={ref}
          id={fieldId}
          className={cn(
            'w-full appearance-none rounded-lg border border-sandal-300 bg-sandal-50 py-2 pr-9 pl-3',
            'text-[15px] text-stone-900 transition-colors duration-150',
            'focus:border-turmeric-400 focus:ring-2 focus:ring-turmeric-400 focus:outline-none',
            'disabled:bg-sandal-100 disabled:text-stone-500',
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
          className="pointer-events-none absolute top-1/2 right-3 size-4 -translate-y-1/2 text-stone-500"
          aria-hidden
        />
      </div>
      {hint ? <p className="mt-1 text-[13px] text-stone-500">{hint}</p> : null}
    </div>
  )
})
