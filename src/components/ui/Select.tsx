import type { ReactNode, SelectHTMLAttributes } from 'react'
import { cn } from '../../lib/utils'

export type SelectOption = {
  value: string
  label: ReactNode
}

interface SelectProps
  extends Omit<SelectHTMLAttributes<HTMLSelectElement>, 'onChange' | 'value'> {
  value: string
  onChange: (value: string) => void
  options: SelectOption[]
  label?: string
  hint?: string
  wrapperClassName?: string
  iconLeft?: ReactNode
}

export function Select({
  value,
  onChange,
  options,
  label,
  hint,
  wrapperClassName,
  className,
  iconLeft,
  ...props
}: SelectProps) {
  const selectEl = (
    <div
      className={cn(
        'group relative flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-3 py-2.5 text-xs text-slate-800 shadow-sm transition focus-within:border-brand-300 focus-within:shadow-[0_0_0_4px_rgba(99,102,241,0.12)]',
        wrapperClassName,
      )}
    >
      {iconLeft ? (
        <span className="text-slate-400 transition group-focus-within:text-brand-500" aria-hidden>
          {iconLeft}
        </span>
      ) : null}
      <select
        className={cn(
          'w-full border-none bg-transparent p-0 text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none',
          className,
        )}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        {...props}
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    </div>
  )

  if (!label) return selectEl

  return (
    <label className="block space-y-1.5 text-xs">
      <span className="inline-flex items-center gap-1 text-[11px] font-medium text-slate-700">
        {label}
      </span>
      {selectEl}
      {hint ? <p className="text-[10px] text-slate-400">{hint}</p> : null}
    </label>
  )
}

