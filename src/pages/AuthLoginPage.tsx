import { useState, type FormEvent } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'
import { supabase } from '../lib/supabaseClient'
import { AuthBranding } from '../components/auth/AuthBranding'
import { AuthCard } from '../components/auth/AuthCard'

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
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-gradient-to-b from-slate-50 via-white to-slate-50 px-4 py-10">
      <div className="auth-bg-grid pointer-events-none absolute inset-0 opacity-50" />
      <div className="auth-orb-float pointer-events-none absolute -left-16 top-8 h-56 w-56 rounded-full bg-indigo-300/35 blur-3xl" />
      <div className="auth-orb-drift pointer-events-none absolute right-0 top-20 h-48 w-48 rounded-full bg-violet-300/25 blur-3xl" />
      <div className="auth-orb-float pointer-events-none absolute bottom-8 left-1/3 h-44 w-44 rounded-full bg-sky-200/40 blur-3xl" />

      <AuthCard>
        <div className="space-y-8">
          <AuthBranding subtitle="Melde dich an, um fortzufahren." />

          <div className="space-y-2">
            <h1 className="text-xl font-semibold tracking-tight text-slate-900 sm:text-[1.35rem]">
              Willkommen zurück
            </h1>
            <p className="text-[12px] leading-relaxed text-slate-500">
              Greif auf Brand Voice, Content-Patterns und Generator-Setups zu.
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
              <p className="rounded-2xl bg-rose-50 px-3 py-2 text-[11px] text-rose-600 ring-1 ring-rose-100">
                {error}
              </p>
            )}
            <Button
              type="submit"
              fullWidth
              size="lg"
              className="mt-2 bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-lg shadow-indigo-500/25 transition hover:from-indigo-700 hover:to-violet-700 hover:shadow-indigo-500/35"
              disabled={loading}
            >
              {loading ? 'Wird eingeloggt…' : 'Einloggen'}
            </Button>
          </form>

          <div className="rounded-2xl border border-slate-200/80 bg-slate-50/80 px-4 py-3 text-center text-[11px] text-slate-600 backdrop-blur-sm">
            Noch keinen Account?{' '}
            <Link
              to="/auth/register"
              className="font-semibold text-indigo-600 underline-offset-2 transition hover:text-indigo-700 hover:underline"
            >
              Jetzt registrieren
            </Link>
          </div>
        </div>
      </AuthCard>
    </div>
  )
}
