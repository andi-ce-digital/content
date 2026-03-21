import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
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

/** Eigene Reels (groß): media_url als Video mit poster; Hover spielt ab. */
function OwnReelMediaLarge({ item }: { item: ContentItem }) {
  const media = item.mediaUrl?.trim()
  const thumb = item.thumbnailUrl?.trim()
  const videoRef = useRef<HTMLVideoElement>(null)

  return (
    <div
      className="relative aspect-[9/16] w-full overflow-hidden bg-gradient-to-b from-slate-100 to-slate-50"
      onMouseEnter={() => {
        void videoRef.current?.play().catch(() => {})
      }}
      onMouseLeave={() => {
        const el = videoRef.current
        if (el) {
          el.pause()
          el.currentTime = 0
        }
      }}
    >
      {media ? (
        <video
          ref={videoRef}
          src={media}
          poster={thumb || undefined}
          muted
          loop
          playsInline
          preload="metadata"
          className="h-full w-full object-cover"
          aria-hidden
        />
      ) : thumb ? (
        <img src={thumb} alt="" className="h-full w-full object-cover" loading="lazy" />
      ) : (
        <div className="flex h-full w-full items-center justify-center text-slate-300">
          <span className="text-4xl opacity-60">
            {item.platform === 'instagram' ? '▷' : item.platform === 'tiktok' ? '♪' : '▶'}
          </span>
        </div>
      )}
    </div>
  )
}

/** Referenz-Content: klassische Library-Logik — Thumbnail zuerst, sonst Video. */
function ReferenceClipMediaLarge({ item }: { item: ContentItem }) {
  return (
    <div className="relative aspect-[9/16] w-full overflow-hidden bg-gradient-to-b from-slate-100 to-slate-50">
      {item.thumbnailUrl ? (
        <img src={item.thumbnailUrl} alt="" className="h-full w-full object-cover" />
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
            {item.platform === 'instagram' ? '▷' : item.platform === 'tiktok' ? '♪' : '▶'}
          </span>
        </div>
      )}
    </div>
  )
}

const ownReelCardClass =
  'group relative overflow-hidden rounded-2xl border bg-white text-left shadow-sm transition hover:border-indigo-200 hover:shadow-md'

const referenceClipCardClass =
  'group relative overflow-hidden rounded-2xl border bg-white text-left shadow-sm transition hover:border-indigo-200 hover:shadow-md'

export function ContentLibraryPage() {
  type LibraryTab = 'content' | 'creators' | 'snippets'
  type GeneratorRunListItem = {
    id: string
    status: 'queued' | 'running' | 'succeeded' | 'failed' | string
    created_at: string
    started_at: string | null
    finished_at: string | null
    config_json: Record<string, unknown> | null
    result_json: Record<string, unknown> | null
    error_text: string | null
    action: { title?: string; action_key?: string } | null
  }

  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { user } = useAuth()
  const [libraryTab, setLibraryTab] = useState<LibraryTab>('content')
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
  const [runs, setRuns] = useState<GeneratorRunListItem[]>([])
  const [runsLoading, setRunsLoading] = useState(false)
  const [ownContentItems, setOwnContentItems] = useState<ContentItem[]>([])
  const [ownContentLoading, setOwnContentLoading] = useState(false)

  const shouldOpenAddAccount = searchParams.get('addAccount') === '1'

  useEffect(() => {
    if (!shouldOpenAddAccount) return

    // Erst wenn der User mind. einen Instagram Account hinterlegt,
    // soll er ins Dashboard – daher standardmäßig Instagram öffnen.
    setAddPlatform('instagram')
    setAddAccountOpen(true)
    setAddHandle('')
    setAccountError(null)
  }, [shouldOpenAddAccount])

  // Eigenen Account (Dashboard / ?addAccount=1): nur user_accounts + fester n8n-Workflow.
  const webhookUserOwnAccount =
    'https://n8n.srv999320.hstgr.cloud/webhook/faa3ab2b-6e38-46c0-a326-eac8ae30229c'
  // Creator-Referenz (Content Library ohne Dashboard-Query): creators + Scraping-Workflow.
  const webhookCreatorScrape =
    'https://n8n.srv999320.hstgr.cloud/webhook/9f796f61-49e9-4a00-a490-744c79180db0'

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

  useEffect(() => {
    async function loadOwnAccountContent() {
      if (!supabase || !user) {
        setOwnContentItems([])
        return
      }
      setOwnContentLoading(true)
      const { data, error } = await supabase
        .from('user_account_content')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(200)
      setOwnContentLoading(false)
      if (error || !data) {
        setOwnContentItems([])
        return
      }
      const rows = data as unknown as Record<string, unknown>[]
      setOwnContentItems(mapUserAccountContentRowsToContentItems(rows))
    }
    void loadOwnAccountContent()
  }, [user])

  useEffect(() => {
    async function loadRuns() {
      if (!supabase || !user) {
        setRuns([])
        return
      }
      setRunsLoading(true)
      const { data, error } = await supabase
        .from('generator_action_runs')
        .select(
          'id, status, created_at, started_at, finished_at, config_json, result_json, error_text, action:generator_actions(title, action_key)',
        )
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(50)
      if (!error) {
        setRuns((data ?? []) as GeneratorRunListItem[])
      } else {
        setRuns([])
      }
      setRunsLoading(false)
    }
    void loadRuns()
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

      transcriptDetail:
        row.transcript_detail != null
          ? row.transcript_detail
          : row.transcript_details != null
            ? row.transcript_details
            : null,

      hookStart: row.hook_start != null ? Number(row.hook_start) : null,
      hookEnd: row.hook_end != null ? Number(row.hook_end) : null,
      hookDuration: row.hook_duration != null ? Number(row.hook_duration) : null,
      ctaStart: row.cta_start != null ? Number(row.cta_start) : null,
      ctaEnd: row.cta_end != null ? Number(row.cta_end) : null,
      bodyDuration: row.body_duration != null ? Number(row.body_duration) : null,
      timeToHook: row.time_to_hook != null ? Number(row.time_to_hook) : null,
    }))
  }

  function normalizeContentPlatform(p: string): ContentItem['platform'] {
    const x = p.toLowerCase()
    if (x === 'tiktok' || x === 'youtube' || x === 'instagram') return x
    return 'instagram'
  }

  function mapUserAccountContentRowsToContentItems(
    rows: Record<string, unknown>[],
  ): ContentItem[] {
    return rows.map((row) => {
      const platform = normalizeContentPlatform(String(row.platform ?? 'instagram'))
      const hook = String(row.hook ?? row.caption ?? row.title ?? '')
      return {
        id: String(row.id),
        platform,
        creatorName: String(row.creator_name ?? ''),
        creatorHandle: String(row.creator_handle ?? ''),
        title: row.title != null ? String(row.title) : undefined,
        hook,
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
        viralPotentialScore:
          row.viral_potential_score != null ? Number(row.viral_potential_score) : undefined,
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
        primaryDesire: row.primary_desire != null ? String(row.primary_desire) : null,
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
        transcriptDetail:
        row.transcript_detail != null
          ? row.transcript_detail
          : row.transcript_details != null
            ? row.transcript_details
            : null,
        hookStart: row.hook_start != null ? Number(row.hook_start) : null,
        hookEnd: row.hook_end != null ? Number(row.hook_end) : null,
        hookDuration: row.hook_duration != null ? Number(row.hook_duration) : null,
        ctaStart: row.cta_start != null ? Number(row.cta_start) : null,
        ctaEnd: row.cta_end != null ? Number(row.cta_end) : null,
        bodyDuration: row.body_duration != null ? Number(row.body_duration) : null,
        timeToHook: row.time_to_hook != null ? Number(row.time_to_hook) : null,
        isOwnAccountContent: true,
        sourcePostUrl: row.source_url != null ? String(row.source_url) : null,
      }
    })
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

  const filteredOwn = useMemo(() => {
    return ownContentItems.filter((item) => {
      const matchesPlatform =
        filters.platform === 'all' || item.platform === filters.platform
      const matchesHook =
        filters.hookType === 'all' ||
        item.hookType.toLowerCase() === filters.hookType.toLowerCase()
      const search = filters.search.toLowerCase()
      const matchesSearch =
        !search ||
        item.creatorName.toLowerCase().includes(search) ||
        item.creatorHandle.toLowerCase().includes(search) ||
        (item.title ?? '').toLowerCase().includes(search) ||
        item.hook.toLowerCase().includes(search)
      return matchesPlatform && matchesHook && matchesSearch
    })
  }, [ownContentItems, filters.platform, filters.hookType, filters.search])

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
  const snippetRuns = runs.filter((r) => r.action?.action_key === 'reel_elements_generate')

  async function handleAddAccount(e: React.FormEvent) {
    e.preventDefault()
    setAccountError(null)
    const handle = addHandle.trim().replace(/^@/, '').toLowerCase()
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

    // --- A) Dashboard: eigener Account -> user_accounts + Webhook faa3ab2b (Pflicht)
    if (shouldOpenAddAccount) {
      const { data: accountRow, error: accountErr } = await supabase
        .from('user_accounts')
        .upsert(
          {
            user_id: user.id,
            platform: addPlatform,
            handle,
            display_name: handle,
            source_url: sourceUrl,
          },
          { onConflict: 'user_id,platform,handle' },
        )
        .select('id, platform, handle, source_url, display_name, created_at')
        .single()

      if (accountErr || !accountRow) {
        setSavingAccount(false)
        setAccountError(accountErr?.message ?? 'Account konnte nicht gespeichert werden.')
        return
      }

      const body = {
        user_account_id: accountRow.id,
        user_id: user.id,
        platform: addPlatform,
        handle,
        source_url: sourceUrl,
        display_name: (accountRow.display_name as string | null) ?? handle,
        created_at: accountRow.created_at as string,
      }

      try {
        const resp = await fetch(webhookUserOwnAccount, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        })
        const responseText = await resp.text()
        if (!resp.ok) {
          setSavingAccount(false)
          setAccountError(
            `n8n-Workflow konnte nicht gestartet werden (${resp.status}): ${responseText.slice(0, 200)}`,
          )
          return
        }
      } catch (e) {
        setSavingAccount(false)
        setAccountError((e as Error).message ?? 'Netzwerkfehler beim Webhook.')
        return
      }

      setSavingAccount(false)
      setAddAccountOpen(false)
      setAddHandle('')
      navigate('/', { replace: true })
      return
    }

    // --- B) Content Library: Referenz-Creator -> creators + Scraping-Webhook
    const { data: existingCreator, error: existingError } = await supabase
      .from('creators')
      .select('id, platform, creator_handle, creator_name, created_at')
      .eq('user_id', user.id)
      .eq('platform', addPlatform)
      .eq('creator_handle', handle)
      .maybeSingle()

    if (existingError) {
      setSavingAccount(false)
      setAccountError(existingError.message)
      return
    }

    let creatorRow:
      | {
          id: string
          platform: string
          creator_handle: string
          creator_name: string | null
          created_at: string | null
        }
      | null = existingCreator as {
          id: string
          platform: string
          creator_handle: string
          creator_name: string | null
          created_at: string | null
        } | null

    if (!creatorRow) {
      const { data: insertedCreator, error: insertError } = await supabase
        .from('creators')
        .insert({
          user_id: user.id,
          platform: addPlatform,
          creator_name: handle,
          creator_handle: handle,
          external_link: sourceUrl,
        })
        .select('id, platform, creator_handle, creator_name, created_at')
        .single()

      if (insertError) {
        setSavingAccount(false)
        setAccountError(insertError.message)
        return
      }
      creatorRow = insertedCreator as {
        id: string
        platform: string
        creator_handle: string
        creator_name: string | null
        created_at: string | null
      }
    }
    setSavingAccount(false)

    try {
      const payload = {
        creator_id: creatorRow?.id ?? null,
        user_id: user.id,
        platform: addPlatform,
        creator_handle: handle,
        handle,
        source_url: sourceUrl,
        creator_name: creatorRow?.creator_name ?? handle,
        created_at: creatorRow?.created_at ?? null,
      }
      await fetch(webhookCreatorScrape, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
    } catch {
      // Webhook optional: Creator ist gespeichert
    }
    setAddAccountOpen(false)
    setAddHandle('')

    navigate('/library', { replace: true })
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

  function statusPill(status: string) {
    if (status === 'succeeded') return 'bg-emerald-50 text-emerald-700 border-emerald-100'
    if (status === 'running' || status === 'queued')
      return 'bg-indigo-50 text-indigo-700 border-indigo-100'
    return 'bg-rose-50 text-rose-700 border-rose-100'
  }

  function formatDateTime(value: string | null) {
    if (!value) return '—'
    const d = new Date(value)
    if (Number.isNaN(d.getTime())) return value
    return d.toLocaleString('de-DE')
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
                {libraryTab === 'content'
                  ? `${filteredOwn.length} eigene Reels${
                      filters.platform !== 'all' || filters.hookType !== 'all' || filters.search
                        ? ' (gefiltert)'
                        : ''
                    }`
                  : libraryTab === 'creators'
                    ? `${filtered.length} Referenz-Einträge${
                        filters.platform !== 'all' || filters.hookType !== 'all' || filters.search
                          ? ' (gefiltert)'
                          : ''
                      }`
                    : `${snippetRuns.length} Snippet-Runs`}
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

        <div className="flex flex-wrap items-center gap-2 rounded-3xl border border-slate-100 bg-white p-2 shadow-sm">
          <button
            type="button"
            onClick={() => setLibraryTab('content')}
            className={`rounded-full px-3 py-2 text-xs font-medium transition ${
              libraryTab === 'content'
                ? 'bg-indigo-600 text-white'
                : 'bg-slate-900/5 text-slate-700 hover:bg-slate-900/10'
            }`}
          >
            Dein Content
          </button>
          <button
            type="button"
            onClick={() => setLibraryTab('creators')}
            className={`rounded-full px-3 py-2 text-xs font-medium transition ${
              libraryTab === 'creators'
                ? 'bg-indigo-600 text-white'
                : 'bg-slate-900/5 text-slate-700 hover:bg-slate-900/10'
            }`}
          >
            Deine Creator
          </button>
          <button
            type="button"
            onClick={() => setLibraryTab('snippets')}
            className={`rounded-full px-3 py-2 text-xs font-medium transition ${
              libraryTab === 'snippets'
                ? 'bg-indigo-600 text-white'
                : 'bg-slate-900/5 text-slate-700 hover:bg-slate-900/10'
            }`}
          >
            Deine Snippets
          </button>
        </div>

        {(libraryTab === 'content' || libraryTab === 'creators') && (
          <div className="flex flex-col gap-4 lg:flex-row">
          <section className="flex-1 space-y-4">
            <Card
              title="Filter"
              description={
                libraryTab === 'content'
                  ? 'Plattform, Hook-Typ und Suche für deine Reels. Referenz-Content findest du im Tab „Deine Creator“.'
                  : 'Plattform, Hook-Typ und Suche für den Referenz-Content (Creator / Inspiration).'
              }
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

            {libraryTab === 'content' && (
              <Card
                title="Deine Reels"
                description="Videos aus deinen verbundenen Accounts — dieselben Daten wie im Dashboard, große Karten (9:16)."
              >
                {ownContentLoading ? (
                  <p className="text-xs text-slate-500">Deine Reels werden geladen…</p>
                ) : filteredOwn.length === 0 ? (
                  <p className="text-xs text-slate-500">
                    Noch keine Reels importiert. Verbinde einen Account (Dashboard oder „+ Account
                    hinzufügen“), dann erscheinen sie hier.
                  </p>
                ) : (
                  <div className="grid grid-cols-2 gap-3 xl:grid-cols-3">
                    {filteredOwn.map((item) => (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => setSelected(item)}
                        className={`${ownReelCardClass} ${
                          selected?.id === item.id
                            ? 'border-indigo-300 ring-2 ring-indigo-100'
                            : 'border-slate-100'
                        }`}
                      >
                        <div className="relative">
                          <OwnReelMediaLarge item={item} />
                          <div className="absolute right-2 top-2 rounded-full bg-slate-900/70 px-2 py-0.5 text-[10px] font-medium text-white">
                            {item.durationSeconds > 0
                              ? `${Math.round(item.durationSeconds)}s`
                              : item.platform}
                          </div>
                          <div className="absolute left-2 top-2 rounded-full bg-indigo-600/90 px-2 py-0.5 text-[9px] font-semibold uppercase tracking-wide text-white">
                            Dein Account
                          </div>
                        </div>
                        <div className="p-3">
                          <p className="line-clamp-2 text-[11px] font-semibold text-slate-900">
                            {item.title ||
                              (item.hook
                                ? `${item.hook.slice(0, 60)}${item.hook.length > 60 ? '…' : ''}`
                                : 'Ohne Titel')}
                          </p>
                          <p className="mt-1 text-[10px] text-slate-500">
                            {item.creatorName || '—'}
                            {item.creatorHandle ? ` (@${item.creatorHandle})` : ''}
                          </p>
                          <div className="mt-2 flex flex-wrap items-center gap-1.5">
                            <span className="rounded-full bg-indigo-50 px-2 py-0.5 text-[10px] font-medium text-indigo-700">
                              {item.hookType || '—'}
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
                )}
              </Card>
            )}

            {libraryTab === 'creators' && (
              <>
                <div>
                  <p className="mb-2 text-[11px] font-semibold text-slate-800">
                    Referenz-Content{' '}
                    <span className="font-normal text-slate-500">(Creator / Inspiration)</span>
                  </p>
                  <div className="grid grid-cols-2 gap-3 xl:grid-cols-3">
                    {paginatedItems.map((item) => (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => setSelected(item)}
                        className={`${referenceClipCardClass} ${
                          selected?.id === item.id
                            ? 'border-indigo-300 ring-2 ring-indigo-100'
                            : 'border-slate-100'
                        }`}
                      >
                        <div className="relative">
                          <ReferenceClipMediaLarge item={item} />
                          <div className="absolute right-2 top-2 rounded-full bg-slate-900/70 px-2 py-0.5 text-[10px] font-medium text-white">
                            {item.durationSeconds > 0
                              ? `${Math.round(item.durationSeconds)}s`
                              : item.platform}
                          </div>
                        </div>
                        <div className="p-3">
                          <p className="line-clamp-2 text-[11px] font-semibold text-slate-900">
                            {item.title ||
                              (item.hook
                                ? `${item.hook.slice(0, 60)}${item.hook.length > 60 ? '…' : ''}`
                                : 'Ohne Titel')}
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
                </div>
                {filtered.length === 0 && (
                  <Card>
                    <p className="text-center text-xs text-slate-500">
                      Keine Referenz-Einträge – passe die Filter an oder füge einen Account hinzu,
                      um Creator-Content zu importieren.
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
              </>
            )}
          </section>

          <aside className="w-full lg:w-[360px] lg:shrink-0">
            <div className="sticky top-4">
              <Card
                title="Detail"
                description={
                  selected?.isOwnAccountContent
                    ? 'Dein importierter Reel — Hook, CTA und Link zum Original.'
                    : 'Hook, CTA und erkannte Patterns des gewählten Clips.'
                }
              >
                {selected ? (
                  <div className="space-y-4 text-xs">
                    {(selected.mediaUrl || selected.thumbnailUrl) && (
                      <div
                        role="button"
                        tabIndex={0}
                        className="group relative cursor-pointer overflow-hidden rounded-2xl border border-slate-100 bg-slate-50 text-left transition hover:border-indigo-200 hover:shadow-md focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400"
                        onClick={() => {
                          if (selected?.id) navigate(`/library/${selected.id}/stats`)
                        }}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' || e.key === ' ') {
                            e.preventDefault()
                            if (selected?.id) navigate(`/library/${selected.id}/stats`)
                          }
                        }}
                      >
                        {selected.mediaUrl &&
                        (selected.mediaUrl.includes('youtube.com') ||
                          selected.mediaUrl.includes('youtu.be')) ? (
                          <iframe
                            title="Video"
                            className="pointer-events-none aspect-video w-full"
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
                            onClick={(e) => e.stopPropagation()}
                          />
                        ) : selected.mediaUrl ? (
                          <video
                            src={selected.mediaUrl}
                            controls
                            playsInline
                            className="aspect-[9/16] w-full max-h-[320px] object-contain bg-black"
                            onClick={(e) => e.stopPropagation()}
                          />
                        ) : selected.thumbnailUrl ? (
                          <img
                            src={selected.thumbnailUrl}
                            alt=""
                            className="aspect-[9/16] w-full object-cover"
                          />
                        ) : null}
                        <div className="pointer-events-none absolute bottom-2 right-2 rounded-full bg-black/55 px-2 py-0.5 text-[9px] font-medium text-white opacity-0 shadow-sm transition group-hover:opacity-100">
                          Zur Reel-Analyse
                        </div>
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
                      {selected.isOwnAccountContent ? (
                        <span className="mt-2 inline-flex rounded-full bg-indigo-600 px-2 py-0.5 text-[9px] font-semibold uppercase tracking-wide text-white">
                          Dein Account
                        </span>
                      ) : null}
                    </div>
                    {selected.isOwnAccountContent && selected.sourcePostUrl ? (
                      <a
                        href={selected.sourcePostUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="flex w-full items-center justify-center rounded-2xl border border-indigo-200 bg-indigo-50 px-3 py-2.5 text-[11px] font-semibold text-indigo-800 transition hover:bg-indigo-100"
                        onClick={(e) => e.stopPropagation()}
                      >
                        Original-Post öffnen <span className="ml-1 text-indigo-500">↗</span>
                      </a>
                    ) : null}
                    <div className="flex flex-wrap gap-1.5">
                      <span className="rounded-full bg-indigo-100 px-2 py-0.5 text-[10px] font-medium text-indigo-700">
                        Hook: {selected.hookType || '—'}
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

                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <button
                        type="button"
                        onClick={() => {
                          if (selected?.id) navigate(`/library/${selected.id}/stats`)
                        }}
                        className="inline-flex items-center gap-2 rounded-full bg-slate-900/5 px-3 py-2 text-[11px] font-medium text-slate-700 hover:bg-slate-900/10"
                      >
                        Detaillierte Stats &amp; Reel-Ansicht
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
        )}

        {libraryTab === 'snippets' && (
          <Card
            title="Deine Snippets"
            description="Video-Run-Results aus `generator_action_runs` nur für Snippet-Action."
          >
            {runsLoading ? (
              <p className="text-xs text-slate-500">Runs laden…</p>
            ) : snippetRuns.length === 0 ? (
              <p className="text-xs text-slate-500">Noch keine Runs vorhanden.</p>
            ) : (
              <div className="space-y-3">
                {snippetRuns.map((r) => {
                  const outputUrl =
                    (r.result_json?.public_url as string | undefined) ??
                    (r.result_json?.output_url as string | undefined) ??
                    null
                  const prompt =
                    (r.config_json?.prompt as string | undefined) ??
                    (r.config_json?.additionalPoints as string | undefined) ??
                    ''
                  return (
                    <div
                      key={r.id}
                      className="rounded-2xl border border-slate-100 bg-white p-3"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div>
                          <p className="text-xs font-semibold text-slate-900">
                            {r.action?.title ?? 'Snippet Action'}
                          </p>
                          <p className="mt-0.5 text-[10px] text-slate-500">
                            Run ID: {r.id}
                          </p>
                        </div>
                        <span
                          className={`rounded-full border px-2 py-0.5 text-[10px] font-medium ${statusPill(r.status)}`}
                        >
                          {r.status}
                        </span>
                      </div>
                      <div className="mt-2 grid gap-2 text-[11px] text-slate-600 sm:grid-cols-3">
                        <p>Erstellt: {formatDateTime(r.created_at)}</p>
                        <p>Gestartet: {formatDateTime(r.started_at)}</p>
                        <p>Fertig: {formatDateTime(r.finished_at)}</p>
                      </div>
                      {prompt ? (
                        <p className="mt-2 line-clamp-2 rounded-xl bg-slate-50 px-2.5 py-2 text-[11px] text-slate-700">
                          Prompt: {prompt}
                        </p>
                      ) : null}
                      {outputUrl ? (
                        <div className="mt-2 flex flex-wrap items-center gap-2">
                          <a
                            href={outputUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex rounded-full bg-indigo-600 px-3 py-1.5 text-[11px] font-medium text-white hover:bg-indigo-700"
                          >
                            Video öffnen
                          </a>
                          <span className="truncate text-[10px] text-slate-500">
                            {outputUrl}
                          </span>
                        </div>
                      ) : null}
                      {r.error_text ? (
                        <p className="mt-2 rounded-xl bg-rose-50 px-2.5 py-2 text-[11px] text-rose-700">
                          {r.error_text}
                        </p>
                      ) : null}
                    </div>
                  )
                })}
              </div>
            )}
          </Card>
        )}
      </div>

      {addAccountOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/25 p-4">
          <div className="w-full max-w-md overflow-hidden rounded-3xl border border-indigo-100 bg-gradient-to-br from-white via-white to-indigo-50/35 shadow-[0_24px_80px_rgba(15,23,42,0.18)] backdrop-blur">
            <div className="border-b border-slate-100 bg-gradient-to-r from-indigo-50 to-sky-50/30 px-5 py-4">
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
                  className="w-full rounded-2xl border border-indigo-100 bg-white/90 px-3 py-2 text-xs text-slate-800"
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
                  className="w-full rounded-2xl border border-indigo-100 bg-white/90 px-3 py-2 text-xs text-slate-800 placeholder:text-slate-400"
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
                  variant="secondary"
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
