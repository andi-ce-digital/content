import { useState, type FormEvent } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'
import { supabase } from '../lib/supabaseClient'

export function AuthLoginPage() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    if (!supabase) {
      setError('Supabase ist noch nicht konfiguriert.')
      return
    }
    setLoading(true)
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password,
    })
    setLoading(false)
    if (signInError) {
      setError(signInError.message)
      return
    }
    navigate('/')
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-gradient-to-b from-slate-50 via-white to-slate-50 px-4 py-8">
      <div className="auth-bg-grid pointer-events-none absolute inset-0 opacity-50" />
      <div className="auth-orb-float pointer-events-none absolute -left-16 top-8 h-56 w-56 rounded-full bg-indigo-300/35 blur-3xl" />
      <div className="auth-orb-drift pointer-events-none absolute right-0 top-20 h-48 w-48 rounded-full bg-violet-300/25 blur-3xl" />
      <div className="auth-orb-float pointer-events-none absolute bottom-8 left-1/3 h-44 w-44 rounded-full bg-sky-200/40 blur-3xl" />

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
                <p className="text-[11px] text-slate-500">Melde dich an, um fortzufahren</p>
              </div>
            </div>
          </div>

          <div>
            <h1 className="text-base font-semibold tracking-tight text-slate-900">
              Willkommen zurueck
            </h1>
            <p className="mt-1 text-[11px] text-slate-500">
              Greife auf deine Brand Voices, Content Patterns und Generator-Setups zu.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-3 text-xs">
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
              autoComplete="current-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
            />
            {error && (
              <p className="rounded-2xl bg-rose-50 px-3 py-2 text-[11px] text-rose-600">
                {error}
              </p>
            )}
            <Button
              type="submit"
              fullWidth
              size="lg"
              className="bg-indigo-600 text-white shadow-sm hover:bg-indigo-700"
              disabled={loading}
            >
              {loading ? 'Wird eingeloggt…' : 'Einloggen'}
            </Button>
          </form>

          <p className="text-center text-[11px] text-slate-500">
            Noch keinen Account?{' '}
            <Link
              to="/auth/register"
              className="font-medium text-indigo-600 hover:underline"
            >
              Jetzt registrieren
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}

