import {
  forwardRef,
  useId,
  useRef,
  useState,
  useEffect,
  type ReactNode,
  type SelectHTMLAttributes,
} from 'react'
import { Check, ChevronDown } from 'lucide-react'
import { cn } from '@/lib/cn'

export interface SelectOption {
  value: string
  label: string
  hint?: string
  disabled?: boolean
}

export interface SelectProps extends Omit<SelectHTMLAttributes<HTMLSelectElement>, 'size'> {
  label?: ReactNode
  hint?: ReactNode
  options: SelectOption[]
  size?: 'default' | 'sm'
  containerClassName?: string
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(function Select(
  {
    label,
    hint,
    options,
    className,
    containerClassName,
    id,
    value,
    defaultValue,
    onChange,
    disabled,
    size = 'default',
    ...rest
  },
  ref,
) {
  const autoId = useId()
  const fieldId = id ?? autoId
  const containerRef = useRef<HTMLDivElement>(null)
  const listboxRef = useRef<HTMLDivElement>(null)
  const selectRef = useRef<HTMLSelectElement | null>(null)

  const [isOpen, setIsOpen] = useState(false)
  const [popDirection, setPopDirection] = useState<'down' | 'up'>('down')
  const [internalValue, setInternalValue] = useState<string>(
    defaultValue !== undefined
      ? String(defaultValue)
      : options[0]?.value !== undefined
        ? String(options[0].value)
        : '',
  )

  const currentValue = value !== undefined ? String(value) : internalValue
  const currentOption = options.find((opt) => String(opt.value) === currentValue) ?? options[0]

  const [focusedIndex, setFocusedIndex] = useState(() => {
    const idx = options.findIndex((opt) => String(opt.value) === currentValue)
    return idx >= 0 ? idx : 0
  })

  // Synchronize internal state when value prop changes
  useEffect(() => {
    if (value !== undefined) {
      setInternalValue(String(value))
      const idx = options.findIndex((opt) => String(opt.value) === String(value))
      if (idx >= 0) setFocusedIndex(idx)
    }
  }, [value, options])

  // Click outside listener
  useEffect(() => {
    if (!isOpen) return

    const handlePointerDown = (e: MouseEvent | TouchEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handlePointerDown)
    document.addEventListener('touchstart', handlePointerDown)
    return () => {
      document.removeEventListener('mousedown', handlePointerDown)
      document.removeEventListener('touchstart', handlePointerDown)
    }
  }, [isOpen])

  // Check popover direction (flip up if close to viewport bottom)
  useEffect(() => {
    if (!isOpen || !containerRef.current) return
    const rect = containerRef.current.getBoundingClientRect()
    const spaceBelow = window.innerHeight - rect.bottom
    const spaceAbove = rect.top
    if (spaceBelow < 250 && spaceAbove > spaceBelow) {
      setPopDirection('up')
    } else {
      setPopDirection('down')
    }

    // Scroll selected item into view inside listbox
    const curIdx = options.findIndex((opt) => String(opt.value) === currentValue)
    if (curIdx >= 0) {
      setFocusedIndex(curIdx)
      requestAnimationFrame(() => {
        const itemEl = listboxRef.current?.querySelector(`[data-index="${curIdx}"]`) as HTMLElement | null
        itemEl?.scrollIntoView({ block: 'nearest' })
      })
    }
  }, [isOpen, currentValue, options])

  const handleSelect = (val: string) => {
    if (value === undefined) {
      setInternalValue(val)
    }
    setIsOpen(false)

    if (selectRef.current) {
      selectRef.current.value = val
      const nativeEvent = new Event('change', { bubbles: true })
      selectRef.current.dispatchEvent(nativeEvent)
    }

    if (onChange) {
      const syntheticEvent = {
        target: { value: val, name: rest.name ?? '' },
        currentTarget: { value: val, name: rest.name ?? '' },
        preventDefault: () => {},
        stopPropagation: () => {},
      } as unknown as React.ChangeEvent<HTMLSelectElement>
      onChange(syntheticEvent)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (disabled) return

    if (!isOpen) {
      if (e.key === 'ArrowDown' || e.key === 'ArrowUp' || e.key === ' ' || e.key === 'Enter') {
        e.preventDefault()
        setIsOpen(true)
      }
      return
    }

    if (e.key === 'Escape') {
      e.preventDefault()
      setIsOpen(false)
    } else if (e.key === 'ArrowDown') {
      e.preventDefault()
      setFocusedIndex((prev) => {
        const next = prev + 1 < options.length ? prev + 1 : 0
        const itemEl = listboxRef.current?.querySelector(`[data-index="${next}"]`) as HTMLElement | null
        itemEl?.scrollIntoView({ block: 'nearest' })
        return next
      })
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setFocusedIndex((prev) => {
        const next = prev - 1 >= 0 ? prev - 1 : options.length - 1
        const itemEl = listboxRef.current?.querySelector(`[data-index="${next}"]`) as HTMLElement | null
        itemEl?.scrollIntoView({ block: 'nearest' })
        return next
      })
    } else if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      if (focusedIndex >= 0 && focusedIndex < options.length) {
        handleSelect(options[focusedIndex].value)
      }
    } else if (e.key === 'Tab') {
      setIsOpen(false)
    }
  }

  return (
    <div ref={containerRef} className={cn('relative w-full', containerClassName)}>
      {label ? (
        <label htmlFor={fieldId} className="mb-1.5 block text-[13px] font-bold text-stone-900">
          {label}
        </label>
      ) : null}

      <div className="relative">
        <button
          type="button"
          id={fieldId}
          disabled={disabled}
          onClick={() => !disabled && setIsOpen((prev) => !prev)}
          onKeyDown={handleKeyDown}
          aria-haspopup="listbox"
          aria-expanded={isOpen}
          aria-label={rest['aria-label'] || (typeof label === 'string' ? label : undefined)}
          className={cn(
            'w-full appearance-none rounded-xl border border-sandal-200 bg-sandal-50 py-2.5 pr-9 pl-3.5',
            'text-[15px] text-stone-900 font-medium transition-all duration-150 shadow-2xs',
            'focus:border-kumkum-500 focus:ring-3 focus:ring-kumkum-500/15 focus:outline-none',
            'disabled:bg-sandal-100 disabled:border-sandal-200 disabled:text-stone-500',
            className,
          )}
        >
          <span className="truncate pr-2">{currentOption?.label ?? 'Select...'}</span>
          <ChevronDown
            className={cn(
              'size-4 shrink-0 text-navy-500 transition-transform duration-200',
              isOpen && 'rotate-180 text-kumkum-600',
            )}
            aria-hidden
          />
        </button>

        {isOpen ? (
          <div
            ref={listboxRef}
            role="listbox"
            aria-label={typeof label === 'string' ? label : rest['aria-label']}
            className={cn(
              'absolute left-0 z-50 w-full min-w-[200px] overflow-hidden rounded-xl',
              'border border-navy-200/90 bg-white p-1.5 shadow-xl ring-1 ring-black/5',
              popDirection === 'up' ? 'bottom-full mb-1.5 origin-bottom' : 'top-full mt-1.5 origin-top',
            )}
            style={{ animation: 'omg-fade-in 120ms ease-out' }}
          >
            <div className="max-h-60 overflow-y-auto scrollbar-thin space-y-0.5">
              {options.map((opt, index) => {
                const isSelected = String(opt.value) === currentValue
                const isFocused = index === focusedIndex
                return (
                  <div
                    key={opt.value}
                    data-index={index}
                    role="option"
                    aria-selected={isSelected}
                    onClick={() => handleSelect(opt.value)}
                    onMouseEnter={() => setFocusedIndex(index)}
                    className={cn(
                      'flex items-center justify-between gap-2 rounded-lg px-3 py-2 text-[13.5px] transition-colors cursor-pointer select-none',
                      isSelected
                        ? 'bg-navy-50 text-navy-950 font-bold'
                        : 'text-navy-800 font-medium hover:bg-navy-50/80 hover:text-navy-950',
                      isFocused && !isSelected && 'bg-navy-50/60 text-navy-950',
                      opt.disabled && 'opacity-40 cursor-not-allowed pointer-events-none',
                    )}
                  >
                    <div className="flex flex-col min-w-0 pr-1">
                      <span className="truncate">{opt.label}</span>
                      {opt.hint ? (
                        <span className="text-[11.5px] text-navy-500 font-normal">{opt.hint}</span>
                      ) : null}
                    </div>
                    {isSelected ? (
                      <Check className="size-4 shrink-0 text-kumkum-600 stroke-[2.5]" aria-hidden />
                    ) : null}
                  </div>
                )
              })}
            </div>
          </div>
        ) : null}

        {/* Hidden native select for form accessibility and tests */}
        <select
          ref={(node) => {
            selectRef.current = node
            if (typeof ref === 'function') ref(node)
            else if (ref) (ref as React.MutableRefObject<HTMLSelectElement | null>).current = node
          }}
          id={`${fieldId}-native`}
          value={currentValue}
          tabIndex={-1}
          aria-hidden="true"
          className="sr-only absolute pointer-events-none opacity-0 h-0 w-0"
          disabled={disabled}
          onChange={onChange}
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
