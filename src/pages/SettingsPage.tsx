import { useEffect, useMemo, useRef, useState, type ChangeEvent } from 'react'
import { Card } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { useAuth } from '../auth/AuthContext'
import { supabase } from '../lib/supabaseClient'

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
  const { user } = useAuth()
  const [profile, setProfile] = useState<ProfileRow | null>(null)
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
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

  return (
    <div className="space-y-4">
      <Card
        title="Einstellungen"
        description="Verwalte deinen Account und dein Profilbild."
      >
        {loading ? (
          <p className="text-xs text-slate-500">Lade Profil…</p>
        ) : (
          <div className="grid gap-4 lg:grid-cols-[220px,minmax(0,1fr)]">
            <div className="flex flex-col items-center gap-3 rounded-3xl border border-slate-100 bg-slate-50 p-4">
              {avatarUrl ? (
                <img
                  src={avatarUrl}
                  alt={displayName}
                  className="h-24 w-24 rounded-full border border-slate-200 object-cover"
                />
              ) : (
                <div className="flex h-24 w-24 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 via-violet-500 to-sky-500 text-xl font-semibold text-white">
                  {initials}
                </div>
              )}
              <p className="text-center text-xs font-medium text-slate-700">{displayName}</p>
              <label className="w-full">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleAvatarUpload}
                  disabled={uploading}
                />
                <Button
                  type="button"
                  fullWidth
                  size="sm"
                  variant="secondary"
                  onClick={() => {
                    fileInputRef.current?.click()
                  }}
                  disabled={uploading}
                >
                  {uploading ? 'Wird hochgeladen…' : 'Avatar ändern'}
                </Button>
              </label>
            </div>

            <div className="space-y-3 rounded-3xl border border-slate-100 bg-white p-4">
              <div>
                <p className="text-[11px] uppercase tracking-[0.14em] text-slate-400">Name</p>
                <p className="text-sm font-semibold text-slate-900">{displayName}</p>
              </div>
              <div>
                <p className="text-[11px] uppercase tracking-[0.14em] text-slate-400">E-Mail</p>
                <p className="text-sm text-slate-700">{profile?.email ?? user?.email ?? '—'}</p>
              </div>
              <p className="rounded-2xl bg-slate-50 px-3 py-2 text-[11px] text-slate-500">
                Dein Avatar wird in Supabase Storage (Bucket <code>avatars</code>)
                gespeichert und in deinem Profil unter <code>avatar_url</code> hinterlegt.
              </p>
              {error && (
                <p className="rounded-2xl bg-rose-50 px-3 py-2 text-[11px] text-rose-600">
                  {error}
                </p>
              )}
              {success && (
                <p className="rounded-2xl bg-emerald-50 px-3 py-2 text-[11px] text-emerald-700">
                  {success}
                </p>
              )}
            </div>
          </div>
        )}
      </Card>
    </div>
  )
}
