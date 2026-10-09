import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from 'react'
import { Loader2 } from 'lucide-react'
import { cn } from '@/lib/cn'

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'success' | 'accent'
type Size = 'sm' | 'md' | 'lg'

const VARIANTS: Record<Variant, string> = {
  primary:
    'bg-kumkum-600 text-sandal-50 shadow-flat hover:bg-kumkum-700 active:bg-kumkum-900 disabled:bg-sandal-300 disabled:text-stone-500 disabled:shadow-none',
  secondary:
    'bg-sandal-50 text-stone-900 border border-sandal-300 hover:border-stone-500 hover:bg-sandal-100 disabled:border-sandal-200 disabled:bg-sandal-100 disabled:text-stone-500',
  ghost: 'bg-transparent text-stone-700 hover:bg-sandal-100 hover:text-stone-900 disabled:text-stone-500',
  danger:
    'bg-danger-600 text-sandal-50 shadow-flat hover:bg-kumkum-700 disabled:bg-sandal-300 disabled:text-stone-500 disabled:shadow-none',
  success:
    'bg-tulsi-500 text-sandal-50 shadow-flat hover:bg-tulsi-700 disabled:bg-sandal-300 disabled:text-stone-500 disabled:shadow-none',
  accent:
    'bg-turmeric-500 text-stone-900 shadow-flat hover:bg-turmeric-400 disabled:bg-sandal-300 disabled:text-stone-500 disabled:shadow-none',
}

const SIZES: Record<Size, string> = {
  sm: 'h-8 px-3 text-[13px] gap-1.5 rounded-lg',
  md: 'h-10 px-4 text-[14px] gap-2 rounded-lg',
  lg: 'h-12 px-6 text-[15px] gap-2 rounded-[10px]',
}

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant
  size?: Size
  loading?: boolean
  icon?: ReactNode
  rightIcon?: ReactNode
  fullWidth?: boolean
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { variant = 'primary', size = 'md', loading, icon, rightIcon, fullWidth, className, children, disabled, ...rest },
  ref,
) {
  return (
    <button
      ref={ref}
      disabled={disabled || loading}
      className={cn(
        'inline-flex items-center justify-center font-medium whitespace-nowrap',
        'transition-colors duration-150 ease-out-soft',
        'focus-visible:ring-2 focus-visible:ring-turmeric-400 focus-visible:ring-offset-2 focus-visible:ring-offset-sandal-50',
        'disabled:cursor-not-allowed',
        SIZES[size],
        VARIANTS[variant],
        fullWidth && 'w-full',
        className,
      )}
      {...rest}
    >
      {loading ? <Loader2 className="size-4 animate-spin" aria-hidden /> : icon}
      {children}
      {rightIcon}
    </button>
  )
})
