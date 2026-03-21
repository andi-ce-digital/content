import { useEffect, useMemo, useState } from 'react'
import { Card } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { supabase } from '../lib/supabaseClient'
import { useAuth } from '../auth/AuthContext'

type Creator = {
  id: string
  platform: string
  creator_name: string
  creator_handle: string
  followers: number | null
  profile_picture_url: string | null
  biography: string | null
  external_link: string | null
  verified: boolean | null
  related_profiles: Array<string | Record<string, unknown>> | null
}

type ContentItemRow = {
  id: string
  title: string | null
  hook: string | null
  views: number | null
  engagement_rate: number | null
  duration_seconds: number | null
  thumbnail_url: string | null
  media_url: string | null
}

type RelatedProfile = {
  id: string
  full_name: string
  username: string
  profile_pic_url: string | null
  profile_url?: string | null
  is_verified?: boolean
}

function normalizeCreatorRow(row: Record<string, unknown>): Creator {
  const profilePictureFromHd =
    typeof (row.hd_profile_pic_url_info as { url?: unknown } | undefined)?.url ===
    'string'
      ? ((row.hd_profile_pic_url_info as { url?: string }).url ?? null)
      : null

  return {
    id: String(row.id ?? ''),
    platform: typeof row.platform === 'string' ? row.platform : 'instagram',
    creator_name:
      typeof row.creator_name === 'string'
        ? row.creator_name
        : typeof row.full_name === 'string'
          ? row.full_name
          : 'Unbekannt',
    creator_handle:
      typeof row.creator_handle === 'string'
        ? row.creator_handle
        : typeof row.username === 'string'
          ? row.username
          : 'unknown',
    followers: typeof row.followers === 'number' ? row.followers : null,
    profile_picture_url:
      typeof row.profile_picture_url === 'string'
        ? row.profile_picture_url
        : typeof row.profile_pic_url === 'string'
          ? row.profile_pic_url
          : profilePictureFromHd,
    biography: typeof row.biography === 'string' ? row.biography : null,
    external_link: typeof row.external_link === 'string' ? row.external_link : null,
    verified: Boolean(row.verified),
    related_profiles: Array.isArray(row.related_profiles)
      ? (row.related_profiles as Array<string | Record<string, unknown>>)
      : null,
  }
}

function parseRelatedProfile(raw: string | Record<string, unknown>): RelatedProfile | null {
  try {
    const data =
      typeof raw === 'string'
        ? (JSON.parse(raw) as Partial<RelatedProfile>)
        : (raw as Partial<RelatedProfile>)

    if (!data) return null
    const normalizedId =
      typeof data.id === 'string' || typeof data.id === 'number'
        ? String(data.id)
        : null
    if (!normalizedId) return null

    return {
      id: normalizedId,
      full_name: typeof data.full_name === 'string' ? data.full_name : 'Unbekannt',
      username: typeof data.username === 'string' ? data.username : 'unknown',
      profile_pic_url:
        typeof data.profile_pic_url === 'string'
          ? data.profile_pic_url
          : typeof (data as { profile_picture_url?: unknown }).profile_picture_url ===
              'string'
            ? ((data as { profile_picture_url?: string }).profile_picture_url ?? null)
            : typeof (data as { hd_profile_pic_url_info?: { url?: unknown } })
                  .hd_profile_pic_url_info?.url === 'string'
              ? ((data as { hd_profile_pic_url_info?: { url?: string } })
                  .hd_profile_pic_url_info?.url ?? null)
              : null,
      profile_url: typeof data.profile_url === 'string' ? data.profile_url : null,
      is_verified: Boolean(data.is_verified),
    }
  } catch {
    return null
  }
}

function toRelatedProfileUrl(profile: RelatedProfile): string | null {
  const normalizedProfileUrl = normalizeImageUrl(profile.profile_url ?? null)
  if (normalizedProfileUrl) return normalizedProfileUrl
  if (!profile.username || profile.username === 'unknown') return null
  return `https://www.instagram.com/${profile.username.replace(/^@/, '')}/`
}

function normalizeImageUrl(url: string | null | undefined): string | null {
  if (!url) return null
  const trimmed = url.trim()
  if (!trimmed) return null
  if (trimmed.startsWith('//')) return `https:${trimmed}`
  return trimmed
}

function withCacheBust(url: string, retryAttempt: number): string {
  if (retryAttempt <= 0) return url
  const separator = url.includes('?') ? '&' : '?'
  return `${url}${separator}img_refresh=${Date.now()}_${retryAttempt}`
}

function SafeAvatar({
  src,
  fallback,
  className,
  onExhausted,
}: {
  src: string | null
  fallback: string
  className: string
  onExhausted?: () => void
}) {
  const [errored, setErrored] = useState(false)
  const [retryAttempt, setRetryAttempt] = useState(0)
  const primary = normalizeImageUrl(src)
  const currentSrc =
    !errored && primary ? withCacheBust(primary, retryAttempt) : null

  useEffect(() => {
    setErrored(false)
    setRetryAttempt(0)
  }, [primary])

  if (!currentSrc) {
    return (
      <div className={`${className} flex items-center justify-center bg-slate-900/5 text-slate-600`}>
        {fallback}
      </div>
    )
  }
  return (
    <img
      src={currentSrc}
      alt=""
      className={`${className} object-cover`}
      onError={() => {
        if (retryAttempt < 2) {
          setRetryAttempt((prev) => prev + 1)
          return
        }
        setErrored(true)
        onExhausted?.()
      }}
      loading="lazy"
    />
  )
}

function SafeReelPreview({
  thumbnail,
  media,
}: {
  thumbnail: string | null
  media: string | null
}) {
  const [thumbError, setThumbError] = useState(false)
  const [videoError, setVideoError] = useState(false)

  if (thumbnail && !thumbError) {
    return (
      <img
        src={thumbnail}
        alt=""
        className="h-full w-full object-cover"
        onError={() => setThumbError(true)}
        referrerPolicy="no-referrer"
      />
    )
  }

  if (media && !videoError) {
    return (
      <video
        src={media}
        muted
        playsInline
        preload="metadata"
        className="h-full w-full object-cover"
        onError={() => setVideoError(true)}
      />
    )
  }

  return (
    <div className="flex h-full w-full items-center justify-center text-slate-300">
      <span className="text-2xl">▷</span>
    </div>
  )
}

export function CreatorsPage() {
  const { user } = useAuth()
  const [creators, setCreators] = useState<Creator[]>([])
  const [selected, setSelected] = useState<Creator | null>(null)
  const [contentItems, setContentItems] = useState<ContentItemRow[]>([])
  const [loadingCreators, setLoadingCreators] = useState(false)
  const [loadingContent, setLoadingContent] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [reelsPage, setReelsPage] = useState(1)
  const [creatorRefreshTick, setCreatorRefreshTick] = useState(0)
  const [lastFailedAvatarUrl, setLastFailedAvatarUrl] = useState<string | null>(null)
  const [confirmProfile, setConfirmProfile] = useState<RelatedProfile | null>(null)
  const [savingProfile, setSavingProfile] = useState(false)
  const [confirmError, setConfirmError] = useState<string | null>(null)
  const [scrapeOpen, setScrapeOpen] = useState(false)
  const [profileFitRatings, setProfileFitRatings] = useState<
    Record<string, 'bad' | 'good' | 'super'>
  >({})

  useEffect(() => {
    async function loadCreators() {
      if (!supabase || !user) return
      setLoadingCreators(true)
      setError(null)
      const { data, error: err } = await supabase
        .from('creators')
        .select('*')
        .eq('user_id', user.id)
        .order('followers', { ascending: false, nullsFirst: false })
      setLoadingCreators(false)
      if (err) {
        setError(err.message)
        return
      }
      const list = ((data ?? []) as Record<string, unknown>[]).map(normalizeCreatorRow)
      setCreators(list)
      setSelected((previous) => {
        if (list.length === 0) return null
        if (!previous) return list[0]
        return list.find((entry) => entry.id === previous.id) ?? list[0]
      })
    }
    void loadCreators()
  }, [user, creatorRefreshTick])

  useEffect(() => {
    async function loadContent() {
      if (!supabase || !user || !selected) return
      setLoadingContent(true)
      const { data } = await supabase
        .from('content_items')
        .select(
          'id, title, hook, views, engagement_rate, duration_seconds, thumbnail_url, media_url, creator_handle',
        )
        .eq('user_id', user.id)
        .eq('creator_handle', selected.creator_handle)
        .order('published_at', { ascending: false, nullsFirst: false })
        .limit(30)
      setLoadingContent(false)
      setContentItems((data ?? []) as ContentItemRow[])
    }
    void loadContent()
  }, [selected?.id, user])

  useEffect(() => {
    setReelsPage(1)
  }, [selected?.id])

  useEffect(() => {
    setLastFailedAvatarUrl(null)
  }, [selected?.id, selected?.profile_picture_url])

  function formatFollowers(f: number | null) {
    if (!f) return '—'
    if (f >= 1_000_000) return `${(f / 1_000_000).toFixed(1)}M`
    if (f >= 1_000) return `${(f / 1_000).toFixed(1)}k`
    return f.toLocaleString('de-DE')
  }

  const reelsPerPage = 9
  const totalReelPages = Math.max(1, Math.ceil(contentItems.length / reelsPerPage))
  const safeReelsPage = Math.min(reelsPage, totalReelPages)
  const pagedReels = contentItems.slice(
    (safeReelsPage - 1) * reelsPerPage,
    safeReelsPage * reelsPerPage,
  )
  const scrapeProfiles = useMemo(() => {
    if (!selected?.related_profiles) return []
    return selected.related_profiles
      .map((raw) => parseRelatedProfile(raw))
      .filter((p): p is RelatedProfile => p !== null)
  }, [selected?.id, selected?.related_profiles])

  return (
    <div className="flex flex-col gap-4 lg:flex-row">
      <section className="w-full lg:w-72 lg:shrink-0">
        <Card
          title="Creators"
          description="Alle analysierten Accounts in deinem Workspace."
        >
          {error && (
            <p className="mb-2 text-xs text-rose-600">
              {error}
            </p>
          )}
          {loadingCreators && (
            <p className="text-xs text-slate-500">Lade Creators…</p>
          )}
          {!loadingCreators && creators.length === 0 && (
            <p className="text-xs text-slate-500">
              Noch keine Creators – füge zuerst Accounts in der Content Library hinzu.
            </p>
          )}
          <div className="mt-2 flex max-h-[420px] flex-col gap-1.5 overflow-y-auto pr-1 text-xs">
            {creators.map((c) => {
              const isActive = selected?.id === c.id
              return (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => setSelected(c)}
                  className={`flex items-center gap-2 rounded-2xl px-2.5 py-1.5 text-left transition ${
                    isActive
                      ? 'bg-indigo-50 text-slate-900 ring-1 ring-indigo-100'
                      : 'bg-white text-slate-700 hover:bg-slate-50 border border-slate-100'
                  }`}
                >
                  <SafeAvatar
                    src={c.profile_picture_url}
                    fallback={c.creator_name?.charAt(0).toUpperCase() ?? '?'}
                    className="h-7 w-7 rounded-full text-[11px] font-semibold"
                  />
                  <div className="flex flex-col">
                    <span className="line-clamp-1 text-[11px] font-medium">
                      {c.creator_name}
                    </span>
                    <span className="text-[10px] text-slate-500">
                      @{c.creator_handle} · {formatFollowers(c.followers)} Follower
                    </span>
                  </div>
                </button>
              )
            })}
          </div>
          <div className="mt-3">
            <Button
              size="sm"
              className="w-full"
              disabled={!selected}
              onClick={() => setScrapeOpen(true)}
            >
              Creator scrapen
            </Button>
          </div>
        </Card>
      </section>

      <section className="flex-1 space-y-4">
        <Card>
          {selected ? (
            <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between text-xs">
              <div className="flex items-start gap-3">
                <div className="rounded-full bg-gradient-to-br from-indigo-200 via-sky-200 to-violet-200 p-[2px]">
                  <SafeAvatar
                    src={selected.profile_picture_url}
                    fallback={selected.creator_name?.charAt(0).toUpperCase() ?? '?'}
                    className="h-16 w-16 rounded-full bg-white text-base font-semibold"
                    onExhausted={() => {
                      const failedUrl = normalizeImageUrl(selected.profile_picture_url)
                      if (!failedUrl || lastFailedAvatarUrl === failedUrl) return
                      setLastFailedAvatarUrl(failedUrl)
                      setCreatorRefreshTick((value) => value + 1)
                    }}
                  />
                </div>
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-semibold text-slate-900">
                      {selected.creator_name}
                    </p>
                    {selected.verified && (
                      <span className="inline-flex items-center gap-1 rounded-full border border-sky-200 bg-gradient-to-r from-sky-50 to-indigo-50 px-2.5 py-1 text-[10px] font-semibold text-sky-700 shadow-sm">
                        <svg
                          viewBox="0 0 20 20"
                          className="h-3.5 w-3.5"
                          aria-hidden="true"
                        >
                          <circle cx="10" cy="10" r="9" fill="currentColor" />
                          <path
                            d="M14.7 7.8a.8.8 0 0 0-1.1-1.1L9.2 11 7.4 9.2a.8.8 0 1 0-1.1 1.1l2.4 2.4a.8.8 0 0 0 1.1 0z"
                            fill="white"
                          />
                        </svg>
                        Verified
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-slate-500">
                    @{selected.creator_handle}
                  </p>
                  <div className="mt-1 flex flex-wrap gap-3 text-[11px] text-slate-600">
                    <span>
                      <span className="font-semibold">
                        {formatFollowers(selected.followers)}
                      </span>{' '}
                      Follower
                    </span>
                  </div>
                  {selected.biography && (
                    <p className="mt-2 max-w-xl whitespace-pre-line text-[11px] text-slate-700">
                      {selected.biography}
                    </p>
                  )}
                  {selected.external_link && (
                    <a
                      href={selected.external_link}
                      target="_blank"
                      rel="noreferrer"
                      className="mt-2 inline-flex items-center gap-1 text-[11px] font-medium text-indigo-600 hover:underline"
                    >
                      {selected.external_link}
                    </a>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2 md:flex-col md:items-end md:gap-1">
                <Button size="sm">Profil analysieren</Button>
                <Button size="sm" variant="secondary">
                  Reels aktualisieren
                </Button>
              </div>
            </div>
          ) : (
            <p className="text-xs text-slate-500">
              Wähle links einen Creator aus, um das Profil zu sehen.
            </p>
          )}
        </Card>

        {selected && (
          <div className="grid gap-4 md:grid-cols-[minmax(0,1.4fr),minmax(0,1.2fr)]">
            <Card
              title="Reels von diesem Creator"
              description="Ausschnitt deiner analysefähigen Reels."
            >
              {loadingContent && (
                <p className="text-xs text-slate-500">Lade Reels…</p>
              )}
              {!loadingContent && contentItems.length === 0 && (
                <p className="text-xs text-slate-500">
                  Noch keine Reels für diesen Creator importiert.
                </p>
              )}
              <div className="mt-3 grid grid-cols-2 gap-3 text-xs xl:grid-cols-3">
                {pagedReels.map((item) => (
                  <article
                    key={item.id}
                    className="rounded-3xl border border-slate-100 bg-white p-3 shadow-sm"
                  >
                    <div className="relative aspect-[9/16] w-full overflow-hidden rounded-2xl bg-slate-100">
                      <SafeReelPreview
                        thumbnail={item.thumbnail_url}
                        media={item.media_url}
                      />
                      <span className="absolute right-2 top-2 rounded-full bg-slate-900/80 px-2 py-0.5 text-[10px] font-medium text-white">
                        {item.duration_seconds
                          ? `${Math.round(item.duration_seconds)}s`
                          : 'Reel'}
                      </span>
                    </div>
                    <p className="mt-2 line-clamp-2 text-[11px] font-semibold text-slate-900">
                      {item.title || item.hook || 'Ohne Titel'}
                    </p>
                    <p className="mt-1 text-[10px] text-slate-500">
                      {item.views?.toLocaleString('de-DE') ?? 0} Views ·{' '}
                      {item.engagement_rate != null
                        ? `${(item.engagement_rate * 100).toFixed(1)} %`
                        : '—'}
                    </p>
                  </article>
                ))}
              </div>
              {contentItems.length > 0 && (
                <div className="mt-3 flex items-center justify-between rounded-3xl border border-slate-100 bg-slate-50 px-3 py-2 text-xs text-slate-600">
                  <p>
                    Seite <span className="font-semibold">{safeReelsPage}</span> von{' '}
                    <span className="font-semibold">{totalReelPages}</span> ·{' '}
                    {contentItems.length} Reels
                  </p>
                  <div className="flex items-center gap-2">
                    <Button
                      type="button"
                      size="sm"
                      variant="secondary"
                      onClick={() => setReelsPage((p) => Math.max(1, p - 1))}
                      disabled={safeReelsPage === 1}
                    >
                      Zurück
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant="secondary"
                      onClick={() =>
                        setReelsPage((p) => Math.min(totalReelPages, p + 1))
                      }
                      disabled={safeReelsPage === totalReelPages}
                    >
                      Weiter
                    </Button>
                  </div>
                </div>
              )}
            </Card>

            <Card
              title="Ähnliche Profile"
              description="Von Instagram vorgeschlagene verwandte Accounts."
            >
              <div className="grid gap-2 text-[11px] sm:grid-cols-2">
                {selected.related_profiles && selected.related_profiles.length > 0 ? (
                  selected.related_profiles.map((raw) => {
                    const parsed = parseRelatedProfile(raw)
                    if (!parsed) return null
                    const profileUrl = toRelatedProfileUrl(parsed)
                    return (
                      <div
                        key={parsed.id}
                        className="flex items-center justify-between rounded-2xl border border-slate-100 bg-white px-3 py-2.5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
                      >
                        <div className="flex items-center gap-2">
                          <div className="rounded-full bg-gradient-to-br from-slate-200 via-indigo-100 to-sky-100 p-[1.5px]">
                            <SafeAvatar
                              src={parsed.profile_pic_url}
                              fallback={parsed.full_name?.charAt(0).toUpperCase() ?? '?'}
                              className="h-9 w-9 rounded-full bg-white text-[11px] font-semibold"
                            />
                          </div>
                          <div className="flex flex-col">
                            <span className="inline-flex items-center gap-1 line-clamp-1 font-medium text-slate-900">
                              {parsed.full_name}
                              {parsed.is_verified && (
                                <svg
                                  viewBox="0 0 20 20"
                                  className="h-3.5 w-3.5 text-sky-600"
                                  aria-hidden="true"
                                >
                                  <circle cx="10" cy="10" r="9" fill="currentColor" />
                                  <path
                                    d="M14.7 7.8a.8.8 0 0 0-1.1-1.1L9.2 11 7.4 9.2a.8.8 0 1 0-1.1 1.1l2.4 2.4a.8.8 0 0 0 1.1 0z"
                                    fill="white"
                                  />
                                </svg>
                              )}
                            </span>
                            <span className="text-[10px] text-slate-500">
                              @{parsed.username}
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            aria-label="Zu Creator-Library hinzufügen"
                            onClick={() => {
                              setConfirmError(null)
                              setConfirmProfile(parsed)
                            }}
                            className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-emerald-500 text-white shadow-sm transition hover:bg-emerald-600"
                          >
                            <svg
                              viewBox="0 0 20 20"
                              className="h-3.5 w-3.5"
                              aria-hidden="true"
                            >
                              <circle cx="10" cy="10" r="9" fill="currentColor" />
                              <path
                                d="M14.2 7.4a.8.8 0 0 0-1.1-1.1L9 10.4 7.1 8.5a.8.8 0 1 0-1.1 1.1l2.4 2.4a.8.8 0 0 0 1.1 0z"
                                fill="white"
                              />
                            </svg>
                          </button>
                          <Button
                            size="sm"
                            variant="secondary"
                            type="button"
                            onClick={() => {
                              if (profileUrl)
                                window.open(profileUrl, '_blank', 'noopener,noreferrer')
                            }}
                            disabled={!profileUrl}
                          >
                            Ansehen
                          </Button>
                        </div>
                      </div>
                    )
                  })
                ) : (
                  <p className="text-[11px] text-slate-500">
                    Für diesen Creator wurden noch keine ähnlichen Profile gespeichert.
                  </p>
                )}
              </div>
            </Card>
          </div>
        )}
      </section>
      {confirmProfile && selected && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-slate-950/40 px-4">
          <div className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-5 shadow-xl">
            <h2 className="text-sm font-semibold text-slate-900">
              Account zur Creator-Library hinzufügen?
            </h2>
            <p className="mt-1 text-xs text-slate-600">
              Willst du{' '}
              <span className="font-medium text-slate-900">
                {confirmProfile.full_name}
              </span>{' '}
              (@{confirmProfile.username}) als eigenen Creator in deiner Library
              speichern?
            </p>
            {confirmError && (
              <p className="mt-3 rounded-2xl bg-rose-50 px-3 py-2 text-[11px] text-rose-600">
                {confirmError}
              </p>
            )}
            <div className="mt-4 flex gap-2">
              <Button
                type="button"
                size="sm"
                variant="ghost"
                className="flex-1 text-slate-600 hover:bg-slate-100"
                disabled={savingProfile}
                onClick={() => {
                  setConfirmProfile(null)
                  setConfirmError(null)
                }}
              >
                Nein, abbrechen
              </Button>
              <Button
                type="button"
                size="sm"
                className="flex-1 bg-emerald-500 text-white hover:bg-emerald-600"
                disabled={savingProfile}
                onClick={async () => {
                  if (!supabase || !user || !confirmProfile) return
                  setSavingProfile(true)
                  setConfirmError(null)
                  const { error: insertError } = await supabase.from('creators').insert({
                    user_id: user.id,
                    platform: 'instagram',
                    creator_name: confirmProfile.full_name,
                    creator_handle: confirmProfile.username,
                    profile_picture_url: confirmProfile.profile_pic_url,
                    verified: confirmProfile.is_verified ?? false,
                  })
                  setSavingProfile(false)
                  if (insertError) {
                    setConfirmError(insertError.message)
                    return
                  }
                  setConfirmProfile(null)
                  setCreatorRefreshTick((tick) => tick + 1)
                }}
              >
                {savingProfile ? 'Wird hinzugefügt…' : 'Ja, hinzufügen'}
              </Button>
            </div>
          </div>
        </div>
      )}
      {scrapeOpen && selected && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-slate-950/40 px-4">
          <div className="w-full max-w-4xl rounded-3xl border border-slate-200 bg-white p-5 shadow-xl">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="text-sm font-semibold text-slate-900">
                  Creator Scrape: @{selected.creator_handle}
                </h2>
                <p className="mt-1 text-xs text-slate-600">
                  Related Profiles mit Metadaten bewerten: Schlecht passt, Gut passt oder Super fit.
                </p>
              </div>
              <Button
                size="sm"
                variant="secondary"
                onClick={() => setScrapeOpen(false)}
              >
                Schließen
              </Button>
            </div>

            <div className="mt-4 max-h-[68vh] space-y-2 overflow-y-auto pr-1">
              {scrapeProfiles.length === 0 ? (
                <p className="rounded-2xl bg-slate-50 px-3 py-2 text-xs text-slate-500">
                  Keine related profiles gefunden.
                </p>
              ) : (
                scrapeProfiles.map((p) => {
                  const profileUrl = toRelatedProfileUrl(p)
                  const fit = profileFitRatings[p.id]
                  return (
                    <div
                      key={p.id}
                      className="rounded-2xl border border-slate-100 bg-white p-3 shadow-sm"
                    >
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div className="flex items-center gap-2">
                          <SafeAvatar
                            src={p.profile_pic_url}
                            fallback={p.full_name?.charAt(0).toUpperCase() ?? '?'}
                            className="h-10 w-10 rounded-full bg-white text-[12px] font-semibold"
                          />
                          <div>
                            <p className="text-xs font-semibold text-slate-900">{p.full_name}</p>
                            <p className="text-[11px] text-slate-500">@{p.username}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {p.is_verified ? (
                            <span className="rounded-full bg-sky-50 px-2 py-1 text-[10px] font-medium text-sky-700">
                              Verified
                            </span>
                          ) : null}
                          {fit ? (
                            <span
                              className={`rounded-full px-2 py-1 text-[10px] font-medium ${
                                fit === 'super'
                                  ? 'bg-emerald-50 text-emerald-700'
                                  : fit === 'good'
                                    ? 'bg-indigo-50 text-indigo-700'
                                    : 'bg-rose-50 text-rose-700'
                              }`}
                            >
                              {fit === 'super'
                                ? 'Super fit'
                                : fit === 'good'
                                  ? 'Gut passt'
                                  : 'Schlecht passt'}
                            </span>
                          ) : null}
                        </div>
                      </div>

                      <div className="mt-2 rounded-xl border border-slate-200 bg-slate-50 px-2.5 py-2 text-[11px] text-slate-600">
                        <p>
                          Profil-ID: <span className="font-medium text-slate-800">{p.id}</span>
                        </p>
                        <p className="mt-1 truncate">
                          URL:{' '}
                          <span className="font-medium text-slate-800">
                            {profileUrl ?? '—'}
                          </span>
                        </p>
                      </div>

                      <div className="mt-3 flex flex-wrap items-center gap-2">
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={() => {
                            if (profileUrl) window.open(profileUrl, '_blank', 'noopener,noreferrer')
                          }}
                          disabled={!profileUrl}
                        >
                          Profil ansehen
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() =>
                            setProfileFitRatings((prev) => ({ ...prev, [p.id]: 'bad' }))
                          }
                        >
                          Schlecht passt
                        </Button>
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={() =>
                            setProfileFitRatings((prev) => ({ ...prev, [p.id]: 'good' }))
                          }
                        >
                          Gut passt
                        </Button>
                        <Button
                          size="sm"
                          onClick={() =>
                            setProfileFitRatings((prev) => ({ ...prev, [p.id]: 'super' }))
                          }
                        >
                          Super fit
                        </Button>
                      </div>
                    </div>
                  )
                })
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

