import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from 'react'
import { Loader2 } from 'lucide-react'
import { cn } from '@/lib/cn'

type Variant = 'primary' | 'secondary' | 'navy' | 'ghost' | 'danger' | 'success' | 'accent'
type Size = 'sm' | 'md' | 'lg'

const VARIANTS: Record<Variant, string> = {
  // OMG primary: the brand red gradient.
  primary:
    'bg-gradient-to-r from-kumkum-500 to-kumkum-600 text-white font-bold shadow-sm hover:from-kumkum-600 hover:to-kumkum-700 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed transition-all',
  secondary:
    'bg-white text-navy-950 font-bold border-2 border-navy-200/90 shadow-2xs hover:bg-navy-50 hover:border-navy-300 active:scale-[0.98] disabled:border-navy-100 disabled:bg-navy-50 disabled:text-navy-400 transition-all',
  // The OMG secondary: navy, for a solid action that must not read as primary.
  navy:
    'bg-navy-900 text-white font-bold shadow-sm hover:bg-navy-950 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed transition-all',
  ghost: 'bg-transparent text-navy-800 font-semibold hover:bg-navy-100/70 hover:text-navy-950 disabled:text-navy-400 transition-all',
  danger:
    'bg-danger-600 text-white font-bold shadow-sm hover:bg-danger-700 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed transition-all',

  success:
    'bg-emerald-600 text-white font-bold shadow-sm hover:bg-emerald-700 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed transition-all',
  accent:
    'bg-turmeric-400 text-navy-950 font-bold shadow-sm hover:bg-turmeric-300 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed transition-all',
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
        'focus-visible:ring-2 focus-visible:ring-kumkum-500 focus-visible:ring-offset-2 focus-visible:ring-offset-white',
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
