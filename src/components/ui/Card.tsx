import type { ReactNode } from 'react'
import { cn } from '../../lib/utils'

interface CardProps {
  title?: string
  description?: string
  children?: ReactNode
  footer?: ReactNode
  className?: string
}

export function Card({ title, description, children, footer, className }: CardProps) {
  return (
    <section
      className={cn(
        'relative overflow-hidden rounded-3xl border border-slate-200/70 bg-white/95 p-5 shadow-[0_12px_32px_rgba(15,23,42,0.06)] backdrop-blur',
        className,
      )}
    >
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-brand-300/40 to-transparent" />
      {(title || description) && (
        <header className="mb-4 space-y-1.5">
          {title && (
            <h2 className="text-sm font-semibold tracking-tight text-slate-900">
              {title}
            </h2>
          )}
          {description && (
            <p className="text-xs text-slate-500">{description}</p>
          )}
        </header>
      )}
      {children}
      {footer && <footer className="mt-5">{footer}</footer>}
    </section>
  )
}

