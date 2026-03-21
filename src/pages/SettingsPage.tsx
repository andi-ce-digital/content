import { useEffect, useMemo, useRef, useState, type ChangeEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { Card } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { useAuth } from '../auth/AuthContext'
import { supabase } from '../lib/supabaseClient'
import {
  LogOut,
  Settings2,
  Sparkles,
  Shield,
  Mail,
  UserRound,
  Camera,
  Loader2,
} from 'lucide-react'

type ProfileRow = {
  first_name: string | null
  last_name: string | null
  email: string | null
  avatar_url?: string | null
}

function getFileExtension(file: File): string {
  const part = file.name.split('.').pop()
  return part ? part.toLowerCase() : 'jpg'
}

export function SettingsPage() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [profile, setProfile] = useState<ProfileRow | null>(null)
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)
  const [loggingOut, setLoggingOut] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [sessionError, setSessionError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement | null>(null)

  useEffect(() => {
    async function loadProfile() {
      if (!supabase || !user) return
      setLoading(true)
      setError(null)
      const { data, error: loadError } = await supabase
        .from('profiles')
        .select('first_name, last_name, email, avatar_url')
        .eq('id', user.id)
        .maybeSingle<ProfileRow>()

      if (loadError) {
        setError(loadError.message)
      } else {
        setProfile(data ?? null)
        setAvatarUrl(data?.avatar_url ?? null)
      }
      setLoading(false)
    }
    void loadProfile()
  }, [user])

  const displayName = useMemo(() => {
    const first = profile?.first_name?.trim() ?? ''
    const last = profile?.last_name?.trim() ?? ''
    const combined = `${first} ${last}`.trim()
    if (combined) return combined
    return user?.email?.split('@')[0] ?? 'Workspace User'
  }, [profile?.first_name, profile?.last_name, user?.email])

  const emailDisplay = profile?.email ?? user?.email ?? '—'

  const initials = useMemo(() => displayName.slice(0, 2).toUpperCase(), [displayName])

  async function handleAvatarUpload(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file || !supabase || !user) return

    setUploading(true)
    setError(null)
    setSuccess(null)

    const ext = getFileExtension(file)
    const filePath = `${user.id}/avatar.${ext}`

    const { error: uploadError } = await supabase.storage
      .from('avatars')
      .upload(filePath, file, { cacheControl: '3600', upsert: true })

    if (uploadError) {
      setUploading(false)
      setError(uploadError.message)
      return
    }

    const { data } = supabase.storage.from('avatars').getPublicUrl(filePath)
    const nextUrl = data.publicUrl

    const { error: profileError } = await supabase
      .from('profiles')
      .update({ avatar_url: nextUrl })
      .eq('id', user.id)

    setUploading(false)
    if (profileError) {
      setError(profileError.message)
      return
    }

    setAvatarUrl(nextUrl)
    setSuccess('Avatar erfolgreich aktualisiert.')
  }

  async function handleLogout() {
    if (!supabase || loggingOut) return
    setLoggingOut(true)
    setSessionError(null)
    const { error: signOutError } = await supabase.auth.signOut()
    setLoggingOut(false)
    if (signOutError) {
      setSessionError(signOutError.message)
      return
    }
    navigate('/auth/login', { replace: true })
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6 pb-10">
      {/* Hero */}
      <div className="relative overflow-hidden rounded-[1.75rem] border border-slate-200/60 bg-gradient-to-br from-white via-indigo-50/40 to-violet-50/50 p-6 shadow-[0_24px_60px_-20px_rgba(67,56,202,0.18)] sm:p-8">
        <div className="pointer-events-none absolute -right-16 -top-20 h-48 w-48 rounded-full bg-indigo-400/25 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-12 -left-10 h-40 w-40 rounded-full bg-violet-400/20 blur-3xl" />
        <div className="relative flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 rounded-full border border-indigo-200/80 bg-white/70 px-3 py-1 text-[11px] font-medium text-indigo-700 shadow-sm backdrop-blur">
              <Sparkles className="h-3.5 w-3.5" />
              Dein Workspace
            </div>
            <h1 className="text-2xl font-semibold tracking-tight text-slate-900 sm:text-[1.65rem]">
              Einstellungen
            </h1>
            <p className="max-w-xl text-sm leading-relaxed text-slate-600">
              Profil, Avatar und Sitzung — alles an einem Ort, im gleichen Look wie der Rest der App.
            </p>
          </div>
          <div className="hidden shrink-0 sm:block">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-white/80 bg-white/60 shadow-inner backdrop-blur">
              <Settings2 className="h-7 w-7 text-indigo-600" strokeWidth={1.75} />
            </div>
          </div>
        </div>
      </div>

      <Card
        title="Profil"
        description="Avatar und öffentliche Anzeige deines Namens."
        className="border-slate-200/70 bg-white/90 p-5 shadow-[0_16px_48px_rgba(15,23,42,0.07)] sm:p-6"
      >
        {loading ? (
          <div className="flex items-center gap-3 py-8">
            <div className="h-10 w-10 animate-pulse rounded-full bg-slate-200" />
            <div className="space-y-2">
              <div className="h-3 w-40 rounded bg-slate-200" />
              <div className="h-3 w-28 rounded bg-slate-100" />
            </div>
          </div>
        ) : (
          <div className="grid gap-6 lg:grid-cols-[minmax(0,240px),1fr]">
            <div className="flex flex-col items-center gap-4 rounded-2xl border border-slate-200/80 bg-gradient-to-b from-slate-50/90 to-white p-5 shadow-inner">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="sr-only"
                onChange={handleAvatarUpload}
                disabled={uploading}
              />
              <div className="relative inline-flex">
                <div className="absolute -inset-1 rounded-full bg-gradient-to-br from-indigo-500 via-violet-500 to-sky-400 opacity-75 blur-[2px]" />
                <div className="relative">
                  {avatarUrl ? (
                    <img
                      src={avatarUrl}
                      alt={displayName}
                      className="h-28 w-28 rounded-full border-4 border-white object-cover shadow-lg"
                    />
                  ) : (
                    <div className="flex h-28 w-28 items-center justify-center rounded-full border-4 border-white bg-gradient-to-br from-indigo-500 via-violet-500 to-sky-500 text-2xl font-semibold text-white shadow-lg">
                      {initials}
                    </div>
                  )}
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploading}
                    aria-label={uploading ? 'Avatar wird hochgeladen' : 'Avatar ändern'}
                    className="group absolute -bottom-0.5 -right-0.5 flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-indigo-600 to-violet-600 text-white shadow-[0_8px_24px_-4px_rgba(79,70,229,0.55)] ring-[3px] ring-white transition hover:scale-[1.06] hover:shadow-[0_12px_28px_-4px_rgba(79,70,229,0.65)] active:scale-100 disabled:pointer-events-none disabled:opacity-70"
                  >
                    {uploading ? (
                      <Loader2 className="h-[18px] w-[18px] animate-spin" strokeWidth={2.5} />
                    ) : (
                      <Camera className="h-[18px] w-[18px] transition group-hover:scale-110" strokeWidth={2.25} />
                    )}
                  </button>
                </div>
              </div>
              <div className="text-center">
                <p className="text-sm font-semibold text-slate-900">{displayName}</p>
                <p className="mt-0.5 text-[11px] text-slate-500">{emailDisplay}</p>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading}
                  className="mt-2 inline-flex items-center justify-center rounded-full px-3 py-1 text-[11px] font-medium text-indigo-600 underline decoration-indigo-300/80 underline-offset-2 transition hover:bg-indigo-50 hover:text-indigo-700 hover:decoration-indigo-500 disabled:opacity-50"
                >
                  {uploading ? 'Wird hochgeladen…' : 'Anderes Foto wählen'}
                </button>
              </div>
            </div>

            <div className="space-y-4 rounded-2xl border border-slate-100 bg-slate-50/50 p-5">
              <div className="flex items-start gap-3 rounded-xl border border-slate-200/60 bg-white p-4 shadow-sm">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-indigo-500/10 text-indigo-600">
                  <UserRound className="h-4 w-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-[11px] font-medium uppercase tracking-[0.12em] text-slate-400">
                    Anzeigename
                  </p>
                  <p className="mt-0.5 text-sm font-semibold text-slate-900">{displayName}</p>
                </div>
              </div>
              <div className="flex items-start gap-3 rounded-xl border border-slate-200/60 bg-white p-4 shadow-sm">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-violet-500/10 text-violet-600">
                  <Mail className="h-4 w-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-[11px] font-medium uppercase tracking-[0.12em] text-slate-400">
                    E-Mail
                  </p>
                  <p className="mt-0.5 break-all text-sm text-slate-700">{emailDisplay}</p>
                </div>
              </div>
              <p className="rounded-xl border border-dashed border-slate-200 bg-white/80 px-3 py-2.5 text-[11px] leading-relaxed text-slate-500">
                Avatar wird in Supabase Storage (<code className="rounded bg-slate-100 px-1 py-0.5">avatars</code>)
                abgelegt; die URL steht in <code className="rounded bg-slate-100 px-1 py-0.5">avatar_url</code>.
              </p>
              {error && (
                <p className="rounded-xl bg-rose-50 px-3 py-2 text-[11px] text-rose-600 ring-1 ring-rose-100">
                  {error}
                </p>
              )}
              {success && (
                <p className="rounded-xl bg-emerald-50 px-3 py-2 text-[11px] text-emerald-700 ring-1 ring-emerald-100">
                  {success}
                </p>
              )}
            </div>
          </div>
        )}
      </Card>

      <section className="relative overflow-hidden rounded-[1.75rem] border border-slate-200/70 bg-white/95 p-5 shadow-[0_16px_48px_rgba(15,23,42,0.07)] backdrop-blur sm:p-6">
        <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-slate-300/50 to-transparent" />
        <header className="mb-5 flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-sm font-semibold tracking-tight text-slate-900">Account & Sitzung</h2>
            <p className="text-xs text-slate-500">Sicher abmelden auf diesem Gerät.</p>
          </div>
          <div className="hidden h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-slate-50 sm:flex">
            <Shield className="h-4 w-4 text-slate-500" />
          </div>
        </header>

        <div className="flex flex-col gap-4 rounded-2xl border border-slate-100 bg-gradient-to-br from-slate-50/80 to-white p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5">
          <div className="min-w-0 space-y-1">
            <p className="text-[11px] font-medium uppercase tracking-[0.12em] text-slate-400">
              Angemeldet als
            </p>
            <p className="truncate text-sm font-medium text-slate-900">{emailDisplay}</p>
            <p className="text-[11px] text-slate-500">
              Nach dem Abmelden musst du dich erneut mit E-Mail und Passwort anmelden.
            </p>
          </div>
          <div className="flex w-full flex-col items-stretch gap-3 sm:w-auto sm:items-end">
            {sessionError && (
              <p className="rounded-lg bg-rose-50 px-3 py-2 text-[11px] text-rose-600 ring-1 ring-rose-100 sm:text-right">
                {sessionError}
              </p>
            )}
            <Button
              type="button"
              variant="secondary"
              className="shrink-0 border-rose-200/90 bg-white text-rose-700 shadow-sm hover:bg-rose-50 sm:min-w-[160px]"
              disabled={loggingOut || !supabase}
              iconLeft={<LogOut className="h-4 w-4" />}
              onClick={() => void handleLogout()}
            >
              {loggingOut ? 'Wird abgemeldet…' : 'Abmelden'}
            </Button>
          </div>
        </div>
      </section>
    </div>
  )
}
