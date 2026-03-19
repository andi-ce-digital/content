import type { InputHTMLAttributes, ReactNode } from 'react'
import { cn } from '../../lib/utils'

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string
  hint?: string
  iconLeft?: ReactNode
  wrapperClassName?: string
}

export function Input({
  label,
  hint,
  iconLeft,
  wrapperClassName,
  className,
  ...props
}: InputProps) {
  return (
    <label className={cn('block space-y-1.5 text-xs', wrapperClassName)}>
      <span className="inline-flex items-center gap-1 text-[11px] font-medium text-slate-700">
        {label}
      </span>
      <div className="group relative flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-3 py-2.5 text-xs text-slate-800 shadow-sm transition focus-within:border-brand-300 focus-within:shadow-[0_0_0_4px_rgba(99,102,241,0.12)]">
        {iconLeft && (
          <span className="text-slate-400 transition group-focus-within:text-brand-500" aria-hidden="true">
            {iconLeft}
          </span>
        )}
        <input
          className={cn(
            'w-full border-none bg-transparent text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none',
            className,
          )}
          {...props}
        />
      </div>
      {hint && <p className="text-[10px] text-slate-400">{hint}</p>}
    </label>
  )
}

