import { useState, type FormEvent } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'
import { supabase } from '../lib/supabaseClient'
import { UserPlus2 } from 'lucide-react'

export function AuthRegisterPage() {
  const navigate = useNavigate()
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [confirmationNotice, setConfirmationNotice] = useState<string | null>(null)

  function getPasswordStrength(value: string): {
    score: number
    label: string
    barClass: string
  } {
    if (!value) {
      return { score: 0, label: 'Keine Eingabe', barClass: 'bg-slate-200' }
    }
    let score = 0
    if (value.length >= 8) score += 1
    if (value.length >= 12) score += 1
    if (/[a-z]/.test(value) && /[A-Z]/.test(value)) score += 1
    if (/\d/.test(value)) score += 1
    if (/[^A-Za-z0-9]/.test(value)) score += 1

    if (score <= 1) {
      return { score, label: 'Schwach', barClass: 'bg-rose-500' }
    }
    if (score <= 3) {
      return { score, label: 'Mittel', barClass: 'bg-amber-500' }
    }
    if (score === 4) {
      return { score, label: 'Gut', barClass: 'bg-lime-500' }
    }
    return { score, label: 'Sehr stark', barClass: 'bg-emerald-500' }
  }

  const passwordStrength = getPasswordStrength(password)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    setConfirmationNotice(null)
    if (!supabase) {
      setError('Supabase ist noch nicht konfiguriert.')
      return
    }
    if (password !== confirmPassword) {
      setError('Die Passwoerter stimmen nicht ueberein.')
      return
    }
    setLoading(true)

    const { data, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          first_name: firstName,
          last_name: lastName,
        },
      },
    })

    if (signUpError || !data.user) {
      setLoading(false)
      setError(signUpError?.message ?? 'Registrierung fehlgeschlagen.')
      return
    }

    setLoading(false)

    // Falls E-Mail-Bestätigung aktiv ist, sieht der User diesen Hinweis.
    if (!data.session) {
      setConfirmationNotice(
        'Fast geschafft: Bitte bestaetige jetzt deine E-Mail-Adresse ueber den Link in deinem Postfach.',
      )
      return
    }

    navigate('/')
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-gradient-to-b from-slate-50 via-white to-slate-50 px-4 py-8">
      <div className="auth-bg-grid pointer-events-none absolute inset-0 opacity-50" />
      <div className="auth-orb-drift pointer-events-none absolute -left-14 top-10 h-56 w-56 rounded-full bg-violet-300/30 blur-3xl" />
      <div className="auth-orb-float pointer-events-none absolute right-2 top-24 h-48 w-48 rounded-full bg-indigo-300/25 blur-3xl" />
      <div className="auth-orb-float pointer-events-none absolute bottom-8 left-1/3 h-44 w-44 rounded-full bg-sky-200/35 blur-3xl" />

      <div className="relative w-full max-w-md overflow-hidden rounded-[30px] border border-slate-200/80 bg-white/90 p-6 shadow-[0_20px_60px_rgba(15,23,42,0.10)] backdrop-blur">
        <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-brand-300/50 to-transparent" />
        <div className="relative space-y-5">
          <div className="flex items-center">
            <div className="flex items-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500 via-violet-500 to-sky-500 text-[11px] font-semibold text-white shadow-soft">
                CS
              </div>
              <div>
                <p className="text-xs font-semibold tracking-tight text-slate-900">
                  content-saas
                </p>
                <p className="text-[11px] text-slate-500">Erstelle deinen Workspace</p>
              </div>
            </div>
          </div>

          <div>
            <h1 className="text-base font-semibold tracking-tight text-slate-900">
              Account erstellen
            </h1>
            <p className="mt-1 text-[11px] text-slate-500">
              Lege deine Zugangsdaten fest und starte direkt mit deinem Workspace.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-3 text-xs">
            <div className="grid gap-3 md:grid-cols-2">
              <Input
                label="Vorname"
                required
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                placeholder="z.B. Max"
              />
              <Input
                label="Nachname"
                required
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                placeholder="z.B. Mustermann"
              />
            </div>
            <Input
              label="E-Mail"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="du@beispiel.de"
            />
            <Input
              label="Passwort"
              type="password"
              autoComplete="new-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Mind. 6 Zeichen"
            />
            <Input
              label="Passwort bestaetigen"
              type="password"
              autoComplete="new-password"
              required
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Passwort wiederholen"
            />
            <div className="rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2">
              <div className="mb-1 flex items-center justify-between text-[11px]">
                <span className="text-slate-500">Passwortstärke</span>
                <span className="font-medium text-slate-700">{passwordStrength.label}</span>
              </div>
              <div className="h-1.5 overflow-hidden rounded-full bg-slate-200">
                <div
                  className={`h-full rounded-full transition-all duration-300 ${passwordStrength.barClass}`}
                  style={{ width: `${(passwordStrength.score / 5) * 100}%` }}
                />
              </div>
            </div>
            {error && (
              <p className="rounded-2xl bg-rose-50 px-3 py-2 text-[11px] text-rose-600">
                {error}
              </p>
            )}
            {confirmationNotice && (
              <p className="rounded-2xl bg-emerald-50 px-3 py-2 text-[11px] text-emerald-700">
                {confirmationNotice}
              </p>
            )}
            <div className="flex items-center gap-1.5 rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 text-[11px] text-slate-600">
              <UserPlus2 className="h-3.5 w-3.5 text-brand-600" />
              Dein Konto wird in wenigen Sekunden eingerichtet.
            </div>
            <Button
              type="submit"
              fullWidth
              size="lg"
              className="bg-indigo-600 text-white shadow-sm hover:bg-indigo-700"
              disabled={loading}
            >
              {loading ? 'Account wird erstellt…' : 'Account erstellen'}
            </Button>
          </form>
          <p className="text-center text-[11px] text-slate-500">
            Schon registriert?{' '}
            <Link
              to="/auth/login"
              className="font-medium text-indigo-600 hover:underline"
            >
              Zum Login
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}

