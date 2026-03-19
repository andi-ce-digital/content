import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
} from 'recharts'
import { Button } from '../components/ui/Button'
import { Card } from '../components/ui/Card'
import { useAuth } from '../auth/AuthContext'
import { supabase } from '../lib/supabaseClient'
import { type ContentItem } from '../data/mockData'

function formatPercent(value: number | null | undefined): string {
  if (value == null || Number.isNaN(value)) return '—'
  return value.toLocaleString('de-DE', {
    style: 'percent',
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  })
}

function PrettyTooltip({
  active,
  payload,
  label,
}: any) {
  if (!active || !payload || payload.length === 0) return null
  const value = payload[0]?.value as unknown
  const safeText =
    typeof value === 'number'
      ? value.toLocaleString('de-DE')
      : typeof value === 'string'
        ? value
        : value == null
          ? '—'
          : String(value)
  return (
    <div className="rounded-2xl border border-slate-200 bg-white/95 px-3 py-2 text-xs shadow-lg backdrop-blur">
      {label ? (
        <p className="text-[10px] uppercase tracking-wide text-slate-400">
          {String(label)}
        </p>
      ) : null}
      <p className="mt-0.5 font-semibold text-slate-900">
        {safeText}
      </p>
    </div>
  )
}

function mapRowToContentItem(row: Record<string, unknown>): ContentItem {
  return {
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
    primaryPainPoint: row.primary_pain_point != null ? String(row.primary_pain_point) : null,
    primaryDesire: row.primary_desire != null ? String(row.primary_desire) : null,
    viralTrigger: row.viral_trigger != null ? String(row.viral_trigger) : null,
    storytellingType: row.storytelling_type != null ? String(row.storytelling_type) : null,
    contentFormat: row.content_format != null ? String(row.content_format) : null,
    targetAudience: row.target_audience != null ? String(row.target_audience) : null,
    patternInterrupts: Array.isArray(row.pattern_interrupts)
      ? (row.pattern_interrupts as string[])
      : null,
    ctaSource: row.cta_source != null ? String(row.cta_source) : null,
    hookStrengthScore: row.hook_strength_score != null ? Number(row.hook_strength_score) : null,
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
  }
}

export function ContentStatsPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { user } = useAuth()
  const [item, setItem] = useState<ContentItem | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function load() {
      if (!id || !supabase || !user) return
      setLoading(true)
      setError(null)
      const { data, error: queryError } = await supabase
        .from('content_items')
        .select('*')
        .eq('user_id', user.id)
        .eq('id', id)
        .maybeSingle()
      setLoading(false)
      if (queryError) {
        setError(queryError.message)
        return
      }
      if (!data) {
        setItem(null)
        return
      }
      setItem(mapRowToContentItem(data as Record<string, unknown>))
    }
    void load()
  }, [id, user])

  const engagementBars = useMemo(
    () => [
      { name: 'Likes', value: item?.likes ?? 0 },
      { name: 'Kommentare', value: item?.comments ?? 0 },
    ],
    [item],
  )

  const qualityRadar = useMemo(
    () => [
      { subject: 'Hook', score: item?.hookStrengthScore ?? 0 },
      { subject: 'Viral', score: item?.viralPotentialScore ?? 0 },
      { subject: 'Perf.', score: item?.performanceScore ?? 0 },
      { subject: 'Like', score: (item?.likeRate ?? 0) * 100 },
      { subject: 'Comment', score: (item?.commentRate ?? 0) * 100 },
    ],
    [item],
  )

  const conversionRate = useMemo(() => {
    if (!item) return null
    return item.reachRatio ?? item.saveRate ?? item.commentRate ?? null
  }, [item])

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between rounded-3xl border border-slate-100 bg-white p-4 shadow-sm">
        <div>
          <p className="text-[10px] uppercase tracking-[0.18em] text-slate-400">Content Stats</p>
          <h1 className="text-base font-semibold text-slate-900">
            {item?.title || 'Detaillierte Analyse'}
          </h1>
        </div>
        <Button
          type="button"
          variant="secondary"
          size="sm"
          className="bg-indigo-100 text-indigo-700 hover:bg-indigo-200"
          onClick={() => navigate('/library')}
        >
          ← Zurück zur Library
        </Button>
      </div>

      {loading && (
        <Card>
          <p className="text-xs text-slate-500">Lade KPI-Daten…</p>
        </Card>
      )}
      {error && (
        <Card>
          <p className="text-xs text-rose-600">{error}</p>
        </Card>
      )}
      {!loading && !error && !item && (
        <Card>
          <p className="text-xs text-slate-500">Kein Datensatz gefunden.</p>
        </Card>
      )}

      {!loading && !error && item && (
        <div className="grid gap-4 lg:grid-cols-2">
          <Card title="Performance Übersicht" description="Views, Engagement und Score">
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="rounded-2xl border border-indigo-100 bg-indigo-50 p-3">
                <p className="text-[10px] text-indigo-500">Views</p>
                <p className="text-xl font-semibold text-slate-900">{item.views.toLocaleString('de-DE')}</p>
              </div>
              <div className="rounded-2xl border border-violet-100 bg-violet-50 p-3">
                <p className="text-[10px] text-violet-500">Engagement</p>
                <p className="text-xl font-semibold text-slate-900">
                  {item.engagementRate != null
                    ? item.engagementRate.toLocaleString('de-DE', { style: 'percent', minimumFractionDigits: 1, maximumFractionDigits: 1 })
                    : '—'}
                </p>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-white p-3">
                <p className="text-[10px] text-slate-500">Performance Score</p>
                <p className="text-lg font-semibold text-slate-900">{item.performanceScore ?? '—'}</p>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-white p-3">
                <p className="text-[10px] text-slate-500">Conversion Rate</p>
                <p className="text-lg font-semibold text-slate-900">{formatPercent(conversionRate)}</p>
                <p className="mt-0.5 text-[10px] text-slate-400">Basierend auf erreichbaren Rate-Feldern</p>
              </div>
            </div>
          </Card>

          <Card title="Engagement Mix" description="Verteilung von Likes und Kommentaren">
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={engagementBars} margin={{ top: 12, right: 8, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#64748b' }} />
                  <YAxis tick={{ fontSize: 11, fill: '#64748b' }} />
                  <Tooltip
                    content={(props: any) => <PrettyTooltip {...props} />}
                    cursor={{ fill: 'rgba(99,102,241,0.08)' }}
                  />
                  <Bar dataKey="value" fill="#6366f1" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card>

          <Card title="Qualitäts-Score Radar" description="Hook- und Performance-Dimensionen">
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart data={qualityRadar}>
                  <PolarGrid />
                  <PolarAngleAxis dataKey="subject" tick={{ fontSize: 11, fill: '#64748b' }} />
                  <Radar dataKey="score" fill="#8b5cf6" fillOpacity={0.35} stroke="#7c3aed" strokeWidth={2} />
                  <Tooltip content={(props: any) => <PrettyTooltip {...props} />} />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          </Card>

          <Card title="Story & Messaging" description="Thema, Angle, Hook und CTA">
            <div className="grid gap-3 text-xs md:grid-cols-2">
              <div className="rounded-2xl border border-indigo-100 bg-gradient-to-br from-indigo-50 to-white p-3 shadow-sm">
                <p className="text-[10px] font-medium uppercase tracking-wide text-indigo-600">
                  Topic
                </p>
                <p className="mt-1 leading-relaxed text-slate-800">
                  {item.topic || '—'}
                </p>
              </div>
              <div className="rounded-2xl border border-indigo-100 bg-gradient-to-br from-indigo-50 to-white p-3 shadow-sm">
                <p className="text-[10px] font-medium uppercase tracking-wide text-indigo-600">
                  Angle
                </p>
                <p className="mt-1 leading-relaxed text-slate-800">
                  {item.contentAngle || '—'}
                </p>
              </div>
              <div className="rounded-2xl border border-indigo-100 bg-gradient-to-br from-indigo-50 to-white p-3 shadow-sm md:col-span-2">
                <p className="text-[10px] font-medium uppercase tracking-wide text-indigo-600">
                  Hook
                </p>
                <p className="mt-1 leading-relaxed text-slate-800">{item.hook || '—'}</p>
              </div>
              <div className="rounded-2xl border border-indigo-100 bg-gradient-to-br from-indigo-50 to-white p-3 shadow-sm md:col-span-2">
                <p className="text-[10px] font-medium uppercase tracking-wide text-indigo-600">
                  CTA
                </p>
                <p className="mt-1 leading-relaxed text-slate-800">{item.cta || '—'}</p>
              </div>

              {item.targetAudience && (
                <div className="rounded-2xl border border-indigo-100 bg-gradient-to-br from-indigo-50 to-white p-3 shadow-sm">
                  <p className="text-[10px] font-medium uppercase tracking-wide text-indigo-600">
                    Zielgruppe
                  </p>
                  <p className="mt-1 leading-relaxed text-slate-800">
                    {item.targetAudience}
                  </p>
                </div>
              )}

              {item.storytellingType && (
                <div className="rounded-2xl border border-indigo-100 bg-gradient-to-br from-indigo-50 to-white p-3 shadow-sm">
                  <p className="text-[10px] font-medium uppercase tracking-wide text-indigo-600">
                    Storytelling
                  </p>
                  <p className="mt-1 leading-relaxed text-slate-800">
                    {item.storytellingType}
                  </p>
                </div>
              )}
            </div>
          </Card>
        </div>
      )}
    </div>
  )
}
