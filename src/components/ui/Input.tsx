import { forwardRef, useId, type InputHTMLAttributes, type ReactNode, type TextareaHTMLAttributes } from 'react'
import { cn } from '@/lib/cn'

const FIELD =
  'w-full rounded-lg border border-sandal-300 bg-sandal-50 px-3 py-2 text-[15px] text-stone-900 ' +
  'placeholder:text-stone-500 transition-colors duration-150 ' +
  'focus:border-turmeric-400 focus:ring-2 focus:ring-turmeric-400 focus:outline-none ' +
  'disabled:bg-sandal-100 disabled:text-stone-500'

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: ReactNode
  hint?: ReactNode
  error?: string
  leading?: ReactNode
}

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { label, hint, error, leading, className, id, ...rest },
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
        {leading ? (
          <span className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-stone-500">
            {leading}
          </span>
        ) : null}
        <input
          ref={ref}
          id={fieldId}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? `${fieldId}-error` : undefined}
          className={cn(FIELD, leading && 'pl-9', error && 'border-danger-600', className)}
          {...rest}
        />
      </div>
      {error ? (
        <p id={`${fieldId}-error`} className="mt-1 text-[13px] text-danger-600">
          {error}
        </p>
      ) : hint ? (
        <p className="mt-1 text-[13px] text-stone-500">{hint}</p>
      ) : null}
    </div>
  )
})

export interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: ReactNode
  hint?: ReactNode
  error?: string
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(function Textarea(
  { label, hint, error, className, id, ...rest },
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
      <textarea
        ref={ref}
        id={fieldId}
        aria-invalid={error ? true : undefined}
        className={cn(FIELD, 'min-h-[88px] resize-y', error && 'border-danger-600', className)}
        {...rest}
      />
      {error ? (
        <p className="mt-1 text-[13px] text-danger-600">{error}</p>
      ) : hint ? (
        <p className="mt-1 text-[13px] text-stone-500">{hint}</p>
      ) : null}
    </div>
  )
})
