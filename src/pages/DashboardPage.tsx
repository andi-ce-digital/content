import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus } from 'lucide-react'
import { Button } from '../components/ui/Button'
import { Card } from '../components/ui/Card'
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { supabase } from '../lib/supabaseClient'
import { useAuth } from '../auth/AuthContext'
import {
  DashboardReelsSection,
  formatCompactNumber,
  formatEngagementRate,
  type UserAccountContentRow,
} from '../components/dashboard/DashboardReelsPanel'

function AddAccountCircleButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      title="Weiteren Account hinzufügen"
      aria-label="Weiteren Account hinzufügen"
      className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-dashed border-indigo-300 bg-white text-indigo-600 shadow-sm transition hover:border-indigo-400 hover:bg-indigo-50 hover:text-indigo-700"
    >
      <Plus className="h-4 w-4" strokeWidth={2.25} />
    </button>
  )
}

export function DashboardPage() {
  type ChartRange = '1D' | '7D' | '14D' | '30D' | '3M' | '6M' | '12M'
  const navigate = useNavigate()
  const { user, loading: authLoading } = useAuth()
  const [hasSourceAccounts, setHasSourceAccounts] = useState<boolean | null>(null)
  const [accountsLoading, setAccountsLoading] = useState(false)
  const [accounts, setAccounts] = useState<
    Array<{ id: string; platform: string; handle: string; display_name: string | null }>
  >([])
  const [activeAccountId, setActiveAccountId] = useState<string | null>(null)
  const [accountContent, setAccountContent] = useState<UserAccountContentRow[]>([])
  const [contentLoading, setContentLoading] = useState(false)

  useEffect(() => {
    async function checkSourceAccounts() {
      if (!user) return
      if (!supabase) {
        setHasSourceAccounts(null)
        return
      }

      const { count, error } = await supabase
        .from('user_accounts')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', user.id)

      if (error) {
        // Wenn wir die Accounts nicht prüfen können (z.B. Tabelle fehlt),
        // zeigen wir das Dashboard bewusst NICHT an.
        setHasSourceAccounts(false)
        return
      }

      setHasSourceAccounts((count ?? 0) > 0)
    }

    void checkSourceAccounts()
  }, [user?.id])

  useEffect(() => {
    async function loadUserAccounts() {
      if (!user) return
      if (!supabase) return
      setAccountsLoading(true)
      const { data, error } = await supabase
        .from('user_accounts')
        .select('id, platform, handle, display_name')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      setAccountsLoading(false)
      if (error) {
        setAccounts([])
        setActiveAccountId(null)
        return
      }

      const list =
        (data ?? []).map((row) => ({
          id: String(row.id),
          platform: String(row.platform ?? 'instagram'),
          handle: String((row as Record<string, unknown>).handle ?? ''),
          display_name:
            (row as Record<string, unknown>).display_name != null
              ? String((row as Record<string, unknown>).display_name)
              : null,
        })) ?? []

      setAccounts(list)
      setActiveAccountId((prev) => {
        if (prev && list.some((a) => a.id === prev)) return prev
        return list[0]?.id ?? null
      })
    }

    // erst, wenn die Gate-Logik „hat Accounts“ true ist, laden wir die Liste.
    if (hasSourceAccounts) {
      void loadUserAccounts()
    }
  }, [user?.id, hasSourceAccounts])

  useEffect(() => {
    async function loadAccountContent() {
      if (!user || !supabase || !activeAccountId) {
        setAccountContent([])
        return
      }
      setContentLoading(true)
      const { data, error } = await supabase
        .from('user_account_content')
        .select(
          [
            'id',
            'platform',
            'title',
            'caption',
            'thumbnail_url',
            'media_url',
            'source_url',
            'views',
            'likes',
            'comments',
            'shares',
            'engagement_rate',
            'performance_score',
            'published_at',
            'created_at',
            'hook_type',
            'content_format',
            'hook_strength_score',
            'viral_potential_score',
            'like_rate',
            'comment_rate',
            'save_rate',
            'share_rate',
            'duration_seconds',
            'topic',
          ].join(', '),
        )
        .eq('user_account_id', activeAccountId)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(200)

      setContentLoading(false)
      if (error || !data) {
        setAccountContent([])
        return
      }

      const rows = data as unknown as Record<string, unknown>[]
      const mapped: UserAccountContentRow[] = rows.map((row) => ({
        id: String(row.id),
        platform: String(row.platform ?? 'instagram'),
        title: row.title != null ? String(row.title) : null,
        caption: row.caption != null ? String(row.caption) : null,
        thumbnail_url: row.thumbnail_url != null ? String(row.thumbnail_url) : null,
        media_url: row.media_url != null ? String(row.media_url) : null,
        source_url: row.source_url != null ? String(row.source_url) : null,
        views: row.views != null ? Number(row.views) : null,
        likes: row.likes != null ? Number(row.likes) : null,
        comments: row.comments != null ? Number(row.comments) : null,
        shares: row.shares != null ? Number(row.shares) : null,
        engagement_rate: row.engagement_rate != null ? Number(row.engagement_rate) : null,
        performance_score: row.performance_score != null ? Number(row.performance_score) : null,
        published_at: row.published_at != null ? String(row.published_at) : null,
        created_at: row.created_at != null ? String(row.created_at) : null,
        hook_type: row.hook_type != null ? String(row.hook_type) : null,
        content_format: row.content_format != null ? String(row.content_format) : null,
        hook_strength_score: row.hook_strength_score != null ? Number(row.hook_strength_score) : null,
        viral_potential_score: row.viral_potential_score != null ? Number(row.viral_potential_score) : null,
        like_rate: row.like_rate != null ? Number(row.like_rate) : null,
        comment_rate: row.comment_rate != null ? Number(row.comment_rate) : null,
        save_rate: row.save_rate != null ? Number(row.save_rate) : null,
        share_rate: row.share_rate != null ? Number(row.share_rate) : null,
        duration_seconds: row.duration_seconds != null ? Number(row.duration_seconds) : null,
        topic: row.topic != null ? String(row.topic) : null,
      }))
      setAccountContent(mapped)
    }

    void loadAccountContent()
  }, [user?.id, activeAccountId])

  const [range, setRange] = useState<ChartRange>('30D')

  function contentTimestamp(row: UserAccountContentRow): Date | null {
    const s = row.published_at || row.created_at
    if (!s) return null
    const d = new Date(s)
    return Number.isNaN(d.getTime()) ? null : d
  }

  const chartData = useMemo(() => {
    const now = Date.now()
    const rangeMs: Record<ChartRange, number> = {
      '1D': 24 * 60 * 60 * 1000,
      '7D': 7 * 24 * 60 * 60 * 1000,
      '14D': 14 * 24 * 60 * 60 * 1000,
      '30D': 30 * 24 * 60 * 60 * 1000,
      '3M': 92 * 24 * 60 * 60 * 1000,
      '6M': 184 * 24 * 60 * 60 * 1000,
      '12M': 365 * 24 * 60 * 60 * 1000,
    }
    const bucketCfg: Record<ChartRange, { n: number; hourly: boolean; label: string }> = {
      '1D': { n: 24, hourly: true, label: 'Std' },
      '7D': { n: 7, hourly: false, label: 'Tag' },
      '14D': { n: 14, hourly: false, label: 'Tag' },
      '30D': { n: 30, hourly: false, label: 'Tag' },
      '3M': { n: 12, hourly: false, label: 'Woche' },
      '6M': { n: 6, hourly: false, label: 'Monat' },
      '12M': { n: 12, hourly: false, label: 'Monat' },
    }

    const win = rangeMs[range]
    const start = now - win
    const { n, hourly, label } = bucketCfg[range]

    const viewsPerBucket = new Array<number>(n).fill(0)
    const reelsPerBucket = new Array<number>(n).fill(0)

    for (const row of accountContent) {
      const t = contentTimestamp(row)
      if (!t) continue
      const ts = t.getTime()
      if (ts < start || ts > now) continue

      let idx: number
      if (hourly) {
        idx = Math.min(n - 1, Math.max(0, Math.floor(((ts - start) / win) * n)))
      } else {
        idx = Math.min(n - 1, Math.max(0, Math.floor(((ts - start) / win) * n)))
      }
      viewsPerBucket[idx] += row.views ?? 0
      reelsPerBucket[idx] += 1
    }

    const hasData = accountContent.some((r) => {
      const t = contentTimestamp(r)
      return t && t.getTime() >= start && t.getTime() <= now
    })

    if (!hasData && accountContent.length > 0) {
      // Fallback: alle geladenen Reels liegen außerhalb des Zeitraums — trotzdem Kurve aus Gesamtdaten
      const totalViews = accountContent.reduce((s, r) => s + (r.views ?? 0), 0)
      return Array.from({ length: n }).map((_, i) => ({
        x: hourly ? `${label} ${i + 1}` : `${label} ${i + 1}`,
        views: i === n - 1 ? totalViews : 0,
        reels: i === n - 1 ? accountContent.length : 0,
      }))
    }

    return viewsPerBucket.map((v, i) => ({
      x: hourly ? `${i + 1}h` : `${label} ${i + 1}`,
      views: Math.round(v),
      reels: reelsPerBucket[i] ?? 0,
    }))
  }, [range, accountContent])

  const kpis = useMemo(() => {
    const n = accountContent.length
    const sumViews = accountContent.reduce((s, r) => s + (r.views ?? 0), 0)
    const engagements = accountContent
      .map((r) => r.engagement_rate)
      .filter((v): v is number => v != null && !Number.isNaN(v))
    const avgEr =
      engagements.length > 0 ? engagements.reduce((a, b) => a + b, 0) / engagements.length : null
    const perf = accountContent
      .map((r) => r.performance_score)
      .filter((v): v is number => v != null && !Number.isNaN(v))
    const avgPerf =
      perf.length > 0 ? perf.reduce((a, b) => a + b, 0) / perf.length : null

    return [
      {
        title: 'Reels im Account',
        value: String(n),
        hint: contentLoading ? 'Lädt…' : n === 0 ? 'Noch keine Einträge importiert' : 'Alle geladenen Posts',
      },
      {
        title: 'Summe Views',
        value: formatCompactNumber(sumViews),
        hint: 'Über alle geladenen Reels',
      },
      {
        title: 'Ø Engagement',
        value: formatEngagementRate(avgEr),
        hint: 'Mittelwert, wo ER gesetzt ist',
      },
      {
        title: 'Ø Performance',
        value: avgPerf != null ? avgPerf.toFixed(2) : '—',
        hint: 'Score aus Pipeline (falls vorhanden)',
      },
    ]
  }, [accountContent, contentLoading])

  if (authLoading || hasSourceAccounts === null) {
    return (
      <div className="relative mx-auto max-w-6xl space-y-5 px-1 pb-6">
        <div className="rounded-3xl border border-slate-100 bg-white/60 p-6 text-xs text-slate-500 shadow-sm">
          Lade Dashboard-Kontext…
        </div>
      </div>
    )
  }

  if (!hasSourceAccounts) {
    return (
      <div className="relative mx-auto max-w-6xl space-y-5 px-1 pb-6">
        <Card
          title="Erst Account hinzufügen"
          description="Damit du das Dashboard nutzen kannst, hinterlege zuerst mindestens einen Account."
          className="bg-white/95"
        >
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-xs text-slate-500">
              Tipp: Klicke unten auf „Account hinzufügen“, dann öffnet sich direkt das
              passende Formular (mit Plattform-Auswahl).
            </p>
            <div className="flex gap-2">
              <Button
                size="sm"
                onClick={() => navigate('/library?addAccount=1')}
              >
                Account hinzufügen
              </Button>
              <Button
                size="sm"
                variant="secondary"
                onClick={() => navigate('/library')}
              >
                Später
              </Button>
            </div>
          </div>
        </Card>
      </div>
    )
  }

  function platformMicColor(p: string) {
    switch (p) {
      case 'tiktok':
        return { bg: 'bg-emerald-50', fg: 'text-emerald-700', ring: 'ring-emerald-100' }
      case 'youtube':
        return { bg: 'bg-rose-50', fg: 'text-rose-700', ring: 'ring-rose-100' }
      case 'instagram':
      default:
        return { bg: 'bg-indigo-50', fg: 'text-indigo-700', ring: 'ring-indigo-100' }
    }
  }

  return (
    <div className="relative mx-auto max-w-6xl space-y-5 px-1 pb-6 overflow-x-hidden">
      <div className="pointer-events-none absolute inset-x-0 -top-10 -z-10 h-52 rounded-[60px] bg-gradient-to-r from-indigo-100/60 via-sky-50 to-violet-100/60 blur-3xl" />

      <section className="flex flex-col gap-3 xl:flex-row xl:items-end xl:justify-between">
        <div className="flex flex-col gap-2">
          <p className="text-[10px] font-medium uppercase tracking-[0.16em] text-slate-400">
            Accounts
          </p>
          {accountsLoading ? (
            <div className="flex flex-wrap items-center gap-2">
              <p className="text-xs text-slate-500">Accounts werden geladen…</p>
              <AddAccountCircleButton onClick={() => navigate('/library?addAccount=1')} />
            </div>
          ) : (
            <div className="flex flex-wrap items-center gap-2">
              {accounts.length === 0 ? (
                <p className="text-xs text-slate-500">Keine Accounts gefunden.</p>
              ) : (
                accounts.map((a) => {
                  const isActive = a.id === activeAccountId
                  const colors = platformMicColor(a.platform)
                  return (
                    <button
                      key={a.id}
                      type="button"
                      onClick={() => setActiveAccountId(a.id)}
                      className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-[11px] font-medium transition ${
                        isActive
                          ? `border-indigo-200 ${colors.bg} ${colors.fg} ${colors.ring}`
                          : 'border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100'
                      }`}
                    >
                      <span
                        className={`inline-flex h-6 w-6 items-center justify-center rounded-full border ${colors.bg} ${colors.fg} ${colors.ring}`}
                      >
                        <svg className="h-3.5 w-3.5" viewBox="0 0 20 20" aria-hidden="true">
                          <use href="/icons.svg#social-icon" />
                        </svg>
                      </span>
                      <span className="max-w-[140px] truncate">{a.display_name ?? a.handle}</span>
                    </button>
                  )
                })
              )}
              <AddAccountCircleButton onClick={() => navigate('/library?addAccount=1')} />
            </div>
          )}
        </div>
        <div className="flex flex-wrap items-center gap-2 rounded-2xl border border-slate-200 bg-white/80 p-2 shadow-sm">
          {(['1D', '7D', '14D', '30D', '3M', '6M', '12M'] as const).map((r) => (
            <button
              key={r}
              type="button"
              onClick={() => setRange(r)}
              className={`rounded-full border px-3 py-1 text-[11px] font-medium transition ${
                range === r
                  ? 'border-indigo-200 bg-indigo-50 text-indigo-700'
                  : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
              }`}
            >
              {r}
            </button>
          ))}
        </div>
      </section>

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {kpis.map((k) => (
          <Card
            key={k.title}
            className="min-h-[120px] bg-white/80 p-4 shadow-sm"
          >
            <div className="flex items-start justify-between">
              <div>
                <p className="text-[10px] font-medium uppercase tracking-[0.14em] text-slate-400">
                  {k.title}
                </p>
                <p className="mt-2 text-xl font-semibold tabular-nums text-slate-900">{k.value}</p>
              </div>
            </div>
            <p className="mt-2 text-[11px] text-slate-500">{k.hint}</p>
          </Card>
        ))}
      </section>

      <section>
        <Card
          className="bg-white/80"
          title="Views im Zeitraum"
          description={`Aggregiert nach ${range} · Daten aus importierten Reels (published/created)`}
        >
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-[11px] text-slate-500">
              <span className="inline-flex h-2 w-2 rounded-full bg-indigo-500" />
              <span>Views (Summe pro Bucket)</span>
              <span className="ml-3 inline-flex h-2 w-2 rounded-full bg-emerald-500" />
              <span>Neue Reels im Bucket</span>
            </div>
            {contentLoading ? (
              <span className="text-[11px] text-slate-400">Metriken werden geladen…</span>
            ) : null}
          </div>

          <div className="mt-4 h-[320px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                <CartesianGrid stroke="#e2e8f0" strokeDasharray="3 3" />
                <XAxis dataKey="x" tick={{ fontSize: 10, fill: '#64748b' }} interval="preserveStartEnd" />
                <YAxis yAxisId="left" tick={{ fontSize: 11, fill: '#64748b' }} />
                <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 11, fill: '#64748b' }} />
                <Tooltip />
                <Line
                  yAxisId="left"
                  type="monotone"
                  dataKey="views"
                  name="Views"
                  stroke="#6366f1"
                  strokeWidth={2}
                  dot={false}
                />
                <Line
                  yAxisId="right"
                  type="monotone"
                  dataKey="reels"
                  name="Reels"
                  stroke="#10b981"
                  strokeWidth={2}
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>

          <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-4">
            <p className="text-[11px] text-slate-500">
              Tipp: Ohne Datum im Import erscheinen Posts im Chart ggf. nicht im gewählten Fenster.
            </p>
            <Button variant="secondary" size="sm" onClick={() => navigate('/library')}>
              Zur Content Library
            </Button>
          </div>
        </Card>
      </section>

      <section>
        <DashboardReelsSection items={accountContent} />
      </section>
    </div>
  )
}

