import type { TextareaHTMLAttributes, ReactNode } from 'react'
import { cn } from '../../lib/utils'

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string
  hint?: string
  iconLeft?: ReactNode
  wrapperClassName?: string
  noWrapper?: boolean
}

export function Textarea({
  label,
  hint,
  iconLeft,
  wrapperClassName,
  noWrapper,
  className,
  ...props
}: TextareaProps) {
  if (noWrapper) {
    return (
      <textarea
        className={cn(
          'w-full resize-none border-none bg-transparent p-0 text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none',
          className,
        )}
        {...props}
      />
    )
  }

  const content = (
    <div
      className={cn(
        'group relative flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-3 py-2.5 text-xs text-slate-800 shadow-sm transition focus-within:border-brand-300 focus-within:shadow-[0_0_0_4px_rgba(99,102,241,0.12)]',
        wrapperClassName,
      )}
    >
      {iconLeft && (
        <span
          className="text-slate-400 transition group-focus-within:text-brand-500"
          aria-hidden="true"
        >
          {iconLeft}
        </span>
      )}
      <textarea
        className={cn(
          'w-full resize-none border-none bg-transparent p-0 text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none',
          className,
        )}
        {...props}
      />
    </div>
  )

  if (!label) return content

  return (
    <label className="block space-y-1.5 text-xs">
      <span className="inline-flex items-center gap-1 text-[11px] font-medium text-slate-700">
        {label}
      </span>
      {content}
      {hint ? <p className="text-[10px] text-slate-400">{hint}</p> : null}
    </label>
  )
}

