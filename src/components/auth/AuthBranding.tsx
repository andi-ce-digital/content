import { Link } from 'react-router-dom'
import reachboxLogo from '../../assets/reachbox.svg'
import { cn } from '../../lib/utils'

type AuthBrandingProps = {
  /** Eine kurze Zeile unter dem Logo (optional) */
  subtitle?: string
  logoTo?: string
  className?: string
}

export function AuthBranding({ subtitle, logoTo, className }: AuthBrandingProps) {
  const logo = (
    <img
      src={reachboxLogo}
      alt="Reachbox"
      className="h-10 w-auto max-w-[min(300px,92vw)] object-contain drop-shadow-[0_12px_32px_rgba(99,102,241,0.18)] sm:h-11"
    />
  )

  return (
    <div className={cn('flex flex-col items-center gap-3 text-center', className)}>
      {logoTo ? (
        <Link
          to={logoTo}
          className="rounded-2xl outline-none ring-offset-2 transition hover:opacity-95 focus-visible:ring-2 focus-visible:ring-indigo-400/70"
        >
          {logo}
        </Link>
      ) : (
        logo
      )}
      {subtitle ? (
        <p className="mx-auto max-w-sm text-[13px] leading-relaxed text-slate-500">{subtitle}</p>
      ) : null}
    </div>
  )
}
