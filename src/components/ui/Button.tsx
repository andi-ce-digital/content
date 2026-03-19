import * as React from 'react'
import { Slot } from '@radix-ui/react-slot'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '../../lib/utils'

const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-full text-sm font-medium transition-all duration-200 ring-offset-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50',
  {
    variants: {
      variant: {
        primary:
          'bg-brand-600 text-white shadow-soft hover:bg-brand-700 hover:shadow-md',
        secondary:
          'border border-brand-200 bg-brand-50 text-brand-700 hover:bg-brand-100',
        ghost: 'text-slate-600 hover:bg-slate-900/5',
      },
      size: {
        sm: 'h-8 px-3 text-xs',
        md: 'h-9 px-4 text-sm',
        lg: 'h-10 px-5 text-sm',
      },
      fullWidth: {
        true: 'w-full',
        false: '',
      },
    },
    defaultVariants: {
      variant: 'primary',
      size: 'md',
      fullWidth: false,
    },
  },
)

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean
    iconLeft?: React.ReactNode
    iconRight?: React.ReactNode
  }

export function Button({
  className,
  variant,
  size,
  fullWidth,
  asChild = false,
  iconLeft,
  iconRight,
  children,
  ...props
}: ButtonProps) {
  const Comp = asChild ? Slot : 'button'
  return (
    <Comp className={cn(buttonVariants({ variant, size, fullWidth }), className)} {...props}>
      {iconLeft}
      {children ? <span>{children}</span> : null}
      {iconRight}
    </Comp>
  )
}

export { buttonVariants }

