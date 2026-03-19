import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Card } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { type ContentItem } from '../data/mockData'
import { supabase } from '../lib/supabaseClient'
import { useAuth } from '../auth/AuthContext'

type FilterState = {
  platform: 'all' | 'instagram' | 'tiktok' | 'youtube'
  hookType: 'all' | 'question' | 'contrarian' | 'opportunity'
  search: string
}

export function ContentLibraryPage() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [filters, setFilters] = useState<FilterState>({
    platform: 'all',
    hookType: 'all',
    search: '',
  })
  const [items, setItems] = useState<ContentItem[]>([])
  const [selected, setSelected] = useState<ContentItem | null>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [addAccountOpen, setAddAccountOpen] = useState(false)
  const [addPlatform, setAddPlatform] = useState<'instagram' | 'tiktok' | 'youtube'>('instagram')
  const [addHandle, setAddHandle] = useState('')
  const [savingAccount, setSavingAccount] = useState(false)
  const [accountError, setAccountError] = useState<string | null>(null)

  const sourceAccountsWebhookUrl = import.meta.env
    .VITE_N8N_SOURCE_ACCOUNTS_WEBHOOK_URL as string | undefined

  useEffect(() => {
    async function load() {
      if (!supabase || !user) {
        setItems([])
        setSelected(null)
        return
      }
      const { data } = await supabase
        .from('content_items')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
      const nextItems = data?.length ? mapRowsToContentItems(data) : []
      setItems(nextItems)
      setSelected((prev) =>
        prev && nextItems.some((item) => item.id === prev.id) ? prev : null,
      )
    }
    load()
  }, [user])

  function mapRowsToContentItems(rows: Record<string, unknown>[]): ContentItem[] {
    return rows.map((row) => ({
      id: String(row.id),
      platform: (row.platform as ContentItem['platform']) ?? 'instagram',
      creatorName: String(row.creator_name ?? ''),
      creatorHandle: String(row.creator_handle ?? ''),
      title: row.title != null ? String(row.title) : undefined,
      hook: String(row.hook ?? ''),
      firstSentence: row.first_sentence != null ? String(row.first_sentence) : undefined,
      cta: row.cta != null ? String(row.cta) : undefined,
      views: Number(row.views ?? 0),
      likes: Number(row.likes ?? 0),
      comments: Number(row.comments ?? 0),
      shares: Number(row.shares ?? 0),
      durationSeconds: Number(row.duration_seconds ?? 0),
      topic: String(row.topic ?? ''),
      contentAngle: String(row.content_angle ?? ''),
      hookType: String(row.hook_type ?? ''),
      engagementRate: row.engagement_rate != null ? Number(row.engagement_rate) : undefined,
      performanceScore: row.performance_score != null ? Number(row.performance_score) : undefined,
      viralPotentialScore: row.viral_potential_score != null ? Number(row.viral_potential_score) : undefined,
      contentStage: row.content_stage != null ? String(row.content_stage) : undefined,
      emotion: row.emotion != null ? String(row.emotion) : undefined,
      thumbnailUrl: row.thumbnail_url != null ? String(row.thumbnail_url) : null,
      mediaUrl: row.media_url != null ? String(row.media_url) : null,
      frameworkType: row.framework_type != null ? String(row.framework_type) : null,
      hookFramework: row.hook_framework != null ? String(row.hook_framework) : null,
      openingLine: row.opening_line != null ? String(row.opening_line) : null,
      mainMessage: row.main_message != null ? String(row.main_message) : null,
      primaryPainPoint:
        row.primary_pain_point != null ? String(row.primary_pain_point) : null,
      primaryDesire:
        row.primary_desire != null ? String(row.primary_desire) : null,
      viralTrigger: row.viral_trigger != null ? String(row.viral_trigger) : null,
      storytellingType:
        row.storytelling_type != null ? String(row.storytelling_type) : null,
      contentFormat: row.content_format != null ? String(row.content_format) : null,
      targetAudience: row.target_audience != null ? String(row.target_audience) : null,
      patternInterrupts: Array.isArray(row.pattern_interrupts)
        ? (row.pattern_interrupts as string[])
        : null,
      ctaSource: row.cta_source != null ? String(row.cta_source) : null,

      hookStrengthScore:
        row.hook_strength_score != null ? Number(row.hook_strength_score) : null,
      likeRate: row.like_rate != null ? Number(row.like_rate) : null,
      commentRate: row.comment_rate != null ? Number(row.comment_rate) : null,
      saveRate: row.save_rate != null ? Number(row.save_rate) : null,
      shareRate: row.share_rate != null ? Number(row.share_rate) : null,
      reachRatio: row.reach_ratio != null ? Number(row.reach_ratio) : null,

      transcriptDetail: row.transcript_detail != null ? row.transcript_detail : null,

      hookStart: row.hook_start != null ? Number(row.hook_start) : null,
      hookEnd: row.hook_end != null ? Number(row.hook_end) : null,
      hookDuration: row.hook_duration != null ? Number(row.hook_duration) : null,
      ctaStart: row.cta_start != null ? Number(row.cta_start) : null,
      ctaEnd: row.cta_end != null ? Number(row.cta_end) : null,
      bodyDuration: row.body_duration != null ? Number(row.body_duration) : null,
      timeToHook: row.time_to_hook != null ? Number(row.time_to_hook) : null,
    }))
  }

  function formatMaybePercent(value?: number | null) {
    if (value == null || Number.isNaN(value)) return null
    return value.toLocaleString('de-DE', {
      style: 'percent',
      minimumFractionDigits: 1,
      maximumFractionDigits: 1,
    })
  }

  const filtered = items.filter((item) => {
    const matchesPlatform =
      filters.platform === 'all' || item.platform === filters.platform
    const matchesHook =
      filters.hookType === 'all' || item.hookType === filters.hookType
    const search = filters.search.toLowerCase()
    const matchesSearch =
      !search ||
      item.creatorName.toLowerCase().includes(search) ||
      item.creatorHandle.toLowerCase().includes(search) ||
      (item.title ?? '').toLowerCase().includes(search)
    return matchesPlatform && matchesHook && matchesSearch
  })

  useEffect(() => {
    setCurrentPage(1)
  }, [filters.platform, filters.hookType, filters.search])

  const pageSize = 9
  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize))
  const safePage = Math.min(currentPage, totalPages)
  const paginatedItems = filtered.slice(
    (safePage - 1) * pageSize,
    safePage * pageSize,
  )

  async function handleAddAccount(e: React.FormEvent) {
    e.preventDefault()
    setAccountError(null)
    const handle = addHandle.trim().replace(/^@/, '')
    if (!handle) {
      setAccountError('Handle oder URL eingeben.')
      return
    }
    if (!supabase || !user) {
      setAccountError('Nicht eingeloggt oder Supabase nicht konfiguriert.')
      return
    }
    setSavingAccount(true)
    const sourceUrl = getPlaceholderUrl(addPlatform, handle)
    const { data: inserted, error } = await supabase
      .from('source_accounts')
      .insert({
        user_id: user.id,
        platform: addPlatform,
        handle,
        source_url: sourceUrl,
      })
      .select('id, platform, handle, source_url, created_at')
      .single()
    setSavingAccount(false)
    if (error) {
      setAccountError(error.message)
      return
    }
    try {
      if (sourceAccountsWebhookUrl) {
        await fetch(sourceAccountsWebhookUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            source_account_id: inserted?.id,
            user_id: user.id,
            platform: addPlatform,
            handle,
            source_url: sourceUrl,
            created_at: inserted?.created_at,
          }),
        })
      }
    } catch {
      // Webhook-Fehler ignorieren, Account ist gespeichert
    }
    setAddAccountOpen(false)
    setAddHandle('')
  }

  function toYouTubeEmbedUrl(url: string): string {
    const m = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]+)/)
    const id = m?.[1] ?? ''
    return id ? `https://www.youtube.com/embed/${id}` : url
  }

  function getPlaceholderUrl(platform: string, handle: string): string {
    if (handle.startsWith('http')) return handle
    switch (platform) {
      case 'instagram':
        return `https://www.instagram.com/${handle}/`
      case 'tiktok':
        return `https://www.tiktok.com/@${handle}`
      case 'youtube':
        return `https://www.youtube.com/@${handle}`
      default:
        return `https://${platform}.com/${handle}`
    }
  }

  return (
    <>
      <div className="mx-auto max-w-6xl space-y-5">
        <div className="relative overflow-hidden rounded-3xl border border-slate-100 bg-gradient-to-br from-slate-50 via-white to-indigo-50/30 px-5 py-6 shadow-sm">
          <div className="pointer-events-none absolute right-0 top-0 h-32 w-64 rounded-full bg-indigo-100/50 blur-3xl" />
          <div className="relative flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-[10px] font-medium uppercase tracking-[0.2em] text-slate-400">
                Content Library
              </p>
              <h1 className="mt-1 text-lg font-semibold tracking-tight text-slate-900">
                Reels, Hooks & Metriken
              </h1>
              <p className="mt-1 text-xs text-slate-500">
                {filtered.length} Einträge
                {filters.platform !== 'all' || filters.hookType !== 'all' || filters.search
                  ? ` (gefiltert)`
                  : ''}
                {' · '}
                <button
                  type="button"
                  onClick={() => setAddAccountOpen(true)}
                  className="font-medium text-indigo-600 underline hover:no-underline"
                >
                  Creator-Account hinzufügen
                </button>
              </p>
            </div>
            <Button
              type="button"
              size="md"
              onClick={() => setAddAccountOpen(true)}
              className="shrink-0"
            >
              + Account hinzufügen
            </Button>
          </div>
        </div>

        <div className="flex flex-col gap-4 lg:flex-row">
          <section className="flex-1 space-y-4">
            <Card
              title="Filter"
              description="Plattform, Hook-Typ und Suche eingrenzen. Neue Quellen über „Account hinzufügen“."
            >
              <div className="flex flex-wrap items-center gap-2">
                <Button
                  type="button"
                  size="sm"
                  variant="secondary"
                  onClick={() => setAddAccountOpen(true)}
                  className="sm:hidden"
                >
                  + Account hinzufügen
                </Button>
                <select
                  className="rounded-2xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-700 shadow-sm"
                  value={filters.platform}
                  onChange={(e) =>
                    setFilters((prev) => ({
                      ...prev,
                      platform: e.target.value as FilterState['platform'],
                    }))
                  }
                >
                  <option value="all">Alle Plattformen</option>
                  <option value="instagram">Instagram</option>
                  <option value="tiktok">TikTok</option>
                  <option value="youtube">YouTube Shorts</option>
                </select>
                <select
                  className="rounded-2xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-700 shadow-sm"
                  value={filters.hookType}
                  onChange={(e) =>
                    setFilters((prev) => ({
                      ...prev,
                      hookType: e.target.value as FilterState['hookType'],
                    }))
                  }
                >
                  <option value="all">Alle Hook-Typen</option>
                  <option value="question">Question Hook</option>
                  <option value="contrarian">Contrarian Hook</option>
                  <option value="opportunity">Opportunity Hook</option>
                </select>
                <input
                  type="search"
                  placeholder="Creator oder Titel suchen…"
                  className="min-w-[200px] flex-1 rounded-2xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-700 placeholder:text-slate-400 shadow-sm"
                  value={filters.search}
                  onChange={(e) =>
                    setFilters((prev) => ({ ...prev, search: e.target.value }))
                  }
                />
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() =>
                    setFilters({
                      platform: 'all',
                      hookType: 'all',
                      search: '',
                    })
                  }
                >
                  Zurücksetzen
                </Button>
              </div>
            </Card>

            <div className="grid grid-cols-2 gap-3 xl:grid-cols-3">
              {paginatedItems.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setSelected(item)}
                  className={`group relative overflow-hidden rounded-2xl border bg-white text-left shadow-sm transition hover:border-indigo-200 hover:shadow-md ${
                    selected?.id === item.id
                      ? 'border-indigo-300 ring-2 ring-indigo-100'
                      : 'border-slate-100'
                  }`}
                >
                  <div className="relative aspect-[9/16] w-full overflow-hidden bg-gradient-to-b from-slate-100 to-slate-50">
                    {item.thumbnailUrl ? (
                      <img
                        src={item.thumbnailUrl}
                        alt=""
                        className="h-full w-full object-cover"
                      />
                    ) : item.mediaUrl ? (
                      <video
                        src={item.mediaUrl}
                        muted
                        playsInline
                        preload="metadata"
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-slate-300">
                        <span className="text-4xl opacity-60">
                          {item.platform === 'instagram'
                            ? '▷'
                            : item.platform === 'tiktok'
                              ? '♪'
                              : '▶'}
                        </span>
                      </div>
                    )}
                    <div className="absolute right-2 top-2 rounded-full bg-slate-900/70 px-2 py-0.5 text-[10px] font-medium text-white">
                      {item.durationSeconds > 0
                        ? `${Math.round(item.durationSeconds)}s`
                        : item.platform}
                    </div>
                  </div>
                  <div className="p-3">
                    <p className="line-clamp-2 text-[11px] font-semibold text-slate-900">
                      {item.title || item.hook.slice(0, 60) + '…'}
                    </p>
                    <p className="mt-1 text-[10px] text-slate-500">
                      {item.creatorName} (@{item.creatorHandle})
                    </p>
                    <div className="mt-2 flex flex-wrap items-center gap-1.5">
                      <span className="rounded-full bg-indigo-50 px-2 py-0.5 text-[10px] font-medium text-indigo-700">
                        {item.hookType}
                      </span>
                      <span className="text-[10px] text-slate-400">
                        {item.views.toLocaleString('de-DE')} Views
                      </span>
                      {(item.engagementRate ?? 0) > 0 && (
                        <span className="text-[10px] text-slate-400">
                          {(item.engagementRate ?? 0).toLocaleString('de-DE', {
                            style: 'percent',
                            minimumFractionDigits: 1,
                            maximumFractionDigits: 1,
                          })}
                        </span>
                      )}
                    </div>
                  </div>
                </button>
              ))}
            </div>
            {filtered.length === 0 && (
              <Card>
                <p className="text-center text-xs text-slate-500">
                  Keine Einträge – passe die Filter an oder füge einen Account
                  hinzu, um Content zu importieren.
                </p>
              </Card>
            )}
            {filtered.length > 0 && (
              <div className="flex items-center justify-between rounded-3xl border border-slate-100 bg-slate-50 px-3 py-2 text-xs text-slate-600">
                <p>
                  Seite <span className="font-semibold">{safePage}</span> von{' '}
                  <span className="font-semibold">{totalPages}</span> ·{' '}
                  {filtered.length} Einträge
                </p>
                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    size="sm"
                    variant="secondary"
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    disabled={safePage === 1}
                  >
                    Zurück
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="secondary"
                    onClick={() =>
                      setCurrentPage((p) => Math.min(totalPages, p + 1))
                    }
                    disabled={safePage === totalPages}
                  >
                    Weiter
                  </Button>
                </div>
              </div>
            )}
          </section>

          <aside className="w-full lg:w-[360px] lg:shrink-0">
            <div className="sticky top-4">
              <Card
                title="Detail"
                description="Hook, CTA und erkannte Patterns des gewählten Clips."
              >
                {selected ? (
                  <div className="space-y-4 text-xs">
                    {(selected.mediaUrl || selected.thumbnailUrl) && (
                      <div className="overflow-hidden rounded-2xl border border-slate-100 bg-slate-50">
                        {selected.mediaUrl &&
                        (selected.mediaUrl.includes('youtube.com') ||
                          selected.mediaUrl.includes('youtu.be')) ? (
                          <iframe
                            title="Video"
                            className="aspect-video w-full"
                            src={toYouTubeEmbedUrl(selected.mediaUrl)}
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                            allowFullScreen
                          />
                        ) : selected.mediaUrl &&
                          /\.(mp4|webm|ogg)(\?|$)/i.test(
                            selected.mediaUrl.split('?')[0] ?? '',
                          ) ? (
                          <video
                            src={selected.mediaUrl}
                            controls
                            playsInline
                            className="aspect-[9/16] w-full max-h-[320px] object-contain bg-black"
                          />
                        ) : selected.mediaUrl ? (
                          <video
                            src={selected.mediaUrl}
                            controls
                            playsInline
                            className="aspect-[9/16] w-full max-h-[320px] object-contain bg-black"
                          />
                        ) : selected.thumbnailUrl ? (
                          <img
                            src={selected.thumbnailUrl}
                            alt=""
                            className="aspect-[9/16] w-full object-cover"
                          />
                        ) : null}
                      </div>
                    )}
                    <div>
                      <p className="text-[11px] font-semibold text-slate-900">
                        {selected.title || 'Ohne Titel'}
                      </p>
                      <p className="text-[11px] text-slate-500">
                        {selected.platform} · {selected.creatorName} (@
                        {selected.creatorHandle})
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      <span className="rounded-full bg-indigo-100 px-2 py-0.5 text-[10px] font-medium text-indigo-700">
                        Hook: {selected.hookType}
                      </span>
                      {selected.contentStage && (
                        <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] text-slate-700">
                          {selected.contentStage}
                        </span>
                      )}
                      {selected.emotion && (
                        <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] text-slate-700">
                          {selected.emotion}
                        </span>
                      )}
                    </div>
                    <div className="rounded-2xl bg-slate-50 p-3">
                      <p className="text-[10px] font-medium uppercase tracking-wider text-slate-400">
                        Hook
                      </p>
                      <p className="mt-1 text-[11px] leading-relaxed text-slate-800">
                        {selected.hook}
                      </p>
                    </div>
                    {selected.firstSentence && (
                      <div className="rounded-2xl bg-slate-50 p-3">
                        <p className="text-[10px] font-medium uppercase tracking-wider text-slate-400">
                          Opening Line
                        </p>
                        <p className="mt-1 text-[11px] leading-relaxed text-slate-800">
                          {selected.firstSentence}
                        </p>
                      </div>
                    )}
                    {selected.cta && (
                      <div className="rounded-2xl bg-slate-900 p-3 text-white">
                        <p className="text-[10px] font-medium uppercase tracking-wider text-indigo-300">
                          CTA
                        </p>
                        <p className="mt-1 text-[11px] leading-relaxed text-slate-100">
                          {selected.cta}
                        </p>
                      </div>
                    )}
                    <div className="rounded-2xl border border-dashed border-slate-200 p-3">
                      <p className="text-[10px] font-medium uppercase tracking-wider text-slate-400">
                        Erkannte Patterns
                      </p>
                      <ul className="mt-2 list-disc space-y-1 pl-4 text-[11px] text-slate-600">
                        <li>Problem → Konsequenz → Lösung</li>
                        <li>Question / Contrarian Statement</li>
                        <li>Selbsterkenntnis + Identitäts-Shift</li>
                      </ul>
                    </div>

                    <div className="flex items-center justify-between gap-3">
                      <button
                        type="button"
                        onClick={() => {
                          if (selected?.id) navigate(`/library/${selected.id}/stats`)
                        }}
                        className="inline-flex items-center gap-2 rounded-full bg-slate-900/5 px-3 py-2 text-[11px] font-medium text-slate-700 hover:bg-slate-900/10"
                      >
                        Detaillierte Stats ansehen
                        <span className="text-slate-400">↗</span>
                      </button>
                      <p className="text-[10px] text-slate-400">
                        {selected.views.toLocaleString('de-DE')} Views •{' '}
                        {formatMaybePercent(selected.engagementRate) ??
                          '—'}{' '}
                        Engagement
                      </p>
                    </div>

                  </div>
                ) : (
                  <p className="text-xs text-slate-500">
                    Wähle links einen Clip, um Hook, CTA und Patterns zu sehen.
                  </p>
                )}
              </Card>
            </div>
          </aside>
        </div>
      </div>

      {addAccountOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4">
          <div className="w-full max-w-md overflow-hidden rounded-3xl border border-slate-100 bg-white shadow-xl">
            <div className="border-b border-slate-100 px-5 py-4">
              <h2 className="text-sm font-semibold text-slate-900">
                Account hinzufügen
              </h2>
              <p className="mt-0.5 text-[11px] text-slate-500">
                Creator oder Kanal, dessen Content du in deine Library holen
                willst.
              </p>
            </div>
            <form onSubmit={handleAddAccount} className="space-y-4 p-5">
              <div className="space-y-1.5">
                <label className="text-[11px] font-medium text-slate-700">
                  Plattform
                </label>
                <select
                  className="w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-800"
                  value={addPlatform}
                  onChange={(e) =>
                    setAddPlatform(
                      e.target.value as 'instagram' | 'tiktok' | 'youtube',
                    )
                  }
                >
                  <option value="instagram">Instagram</option>
                  <option value="tiktok">TikTok</option>
                  <option value="youtube">YouTube</option>
                </select>
              </div>
              <div className="space-y-1.5">
                <label className="text-[11px] font-medium text-slate-700">
                  Handle oder Profil-URL
                </label>
                <input
                  type="text"
                  className="w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-800 placeholder:text-slate-400"
                  placeholder="z.B. jpegan7 oder https://instagram.com/jpegan7"
                  value={addHandle}
                  onChange={(e) => setAddHandle(e.target.value)}
                />
              </div>
              {accountError && (
                <p className="rounded-2xl bg-rose-50 px-3 py-2 text-[11px] text-rose-600">
                  {accountError}
                </p>
              )}
              <div className="flex gap-2 pt-2">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setAddAccountOpen(false)
                    setAccountError(null)
                  }}
                  disabled={savingAccount}
                  className="flex-1"
                >
                  Abbrechen
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  disabled={savingAccount}
                  className="flex-1"
                >
                  {savingAccount ? 'Wird gespeichert…' : 'Speichern'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

    </>
  )
}
