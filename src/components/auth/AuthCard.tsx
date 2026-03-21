import type { ReactNode } from 'react'
import { cn } from '../../lib/utils'

type AuthCardProps = {
  children: ReactNode
  /** Register-Formular: breitere Card für Namen + Felder in zwei Spalten */
  variant?: 'default' | 'wide'
  className?: string
}

/** Gemeinsame „Glass“-Card für Login & Register: weicher Schatten, Blur, dezente Highlights. */
export function AuthCard({ children, variant = 'default', className }: AuthCardProps) {
  return (
    <div
      className={cn(
        'relative w-full overflow-hidden',
        variant === 'wide' ? 'max-w-[min(500px,100%)]' : 'max-w-[440px]',
        'rounded-[1.75rem] border border-slate-200/50 bg-white/75',
        'shadow-[0_28px_90px_-20px_rgba(67,56,202,0.22),0_0_0_1px_rgba(255,255,255,0.8)_inset]',
        'backdrop-blur-2xl',
        'p-8 sm:p-9',
        className,
      )}
    >
      {/* Licht von oben */}
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-indigo-400/45 to-transparent" />
      {/* weicher Farb-Fleck */}
      <div className="pointer-events-none absolute -right-24 -top-24 h-56 w-56 rounded-full bg-gradient-to-br from-indigo-500/25 via-violet-400/15 to-transparent blur-3xl" />
      <div className="pointer-events-none absolute -bottom-20 -left-16 h-44 w-44 rounded-full bg-sky-400/20 blur-3xl" />
      {/* feine Rand-Glow */}
      <div className="pointer-events-none absolute inset-0 rounded-[inherit] ring-1 ring-inset ring-white/40" />

      <div className="relative">{children}</div>
    </div>
  )
}
