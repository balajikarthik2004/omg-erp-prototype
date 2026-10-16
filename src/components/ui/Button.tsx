import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from 'react'
import { Loader2 } from 'lucide-react'
import { cn } from '@/lib/cn'
import { Tooltip, type TooltipProps } from './Tooltip'

type Variant = 'primary' | 'secondary' | 'navy' | 'ghost' | 'danger' | 'success' | 'accent'
type Size = 'sm' | 'md' | 'lg'

const VARIANTS: Record<Variant, string> = {
  // OMG primary: flat brand red. No gradients on buttons.
  primary:
    'bg-kumkum-600 text-white font-bold shadow-flat hover:bg-kumkum-700 active:bg-kumkum-800 disabled:opacity-50 disabled:cursor-not-allowed',
  secondary:
    'bg-sandal-50 text-stone-900 font-semibold border border-sandal-200 shadow-flat hover:bg-sandal-100 disabled:bg-sandal-100 disabled:text-stone-500',
  // The OMG secondary: navy, for a solid action that must not read as primary.
  navy:
    'bg-navy-900 text-white font-semibold shadow-flat hover:bg-navy-950 disabled:opacity-50 disabled:cursor-not-allowed',
  ghost: 'bg-transparent text-stone-700 font-semibold hover:bg-sandal-100 hover:text-stone-900 disabled:text-stone-500',
  danger:
    'bg-danger-600 text-white font-semibold shadow-flat hover:bg-danger-700 disabled:opacity-50 disabled:cursor-not-allowed',

  success:
    'bg-tulsi-500 text-white font-semibold shadow-flat hover:bg-tulsi-700 disabled:opacity-50 disabled:cursor-not-allowed',
  accent:
    'bg-turmeric-400 text-stone-900 font-semibold shadow-flat hover:bg-turmeric-500 disabled:opacity-50 disabled:cursor-not-allowed',
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
  tooltip?: ReactNode
  tooltipPosition?: TooltipProps['position']
  tooltipAlign?: TooltipProps['align']
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  {
    variant = 'primary',
    size = 'md',
    loading,
    icon,
    rightIcon,
    fullWidth,
    className,
    children,
    disabled,
    tooltip,
    tooltipPosition = 'bottom',
    tooltipAlign = 'end',
    title,
    ...rest
  },
  ref,
) {
  const tooltipContent = tooltip || title

  const buttonElement = (
    <button
      ref={ref}
      disabled={disabled || loading}
      className={cn(
        'inline-flex items-center justify-center font-medium whitespace-nowrap',
        'transition-colors duration-150 ease-out-soft',
        'focus-visible:ring-2 focus-visible:ring-navy-400 focus-visible:ring-offset-2 focus-visible:ring-offset-sandal-50',
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

  if (tooltipContent) {
    return (
      <Tooltip
        content={tooltipContent}
        position={tooltipPosition}
        align={tooltipAlign}
        className={fullWidth ? 'w-full' : undefined}
      >
        {buttonElement}
      </Tooltip>
    )
  }

  return buttonElement
})

