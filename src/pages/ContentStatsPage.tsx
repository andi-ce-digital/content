import { useEffect, useMemo, useRef, useState } from 'react'
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
import { cn } from '../lib/utils'
import {
  buildStructureBands,
  formatSecondsOneDecimal,
  formatTranscriptTimestamp,
  getActiveTranscriptIndex,
  getPhaseAtTime,
  getSegmentPhase,
  parseTranscriptSegments,
  TRANSCRIPT_PHASE_LABEL_DE,
  TRANSCRIPT_PHASE_STYLES,
  type PhaseTimingMeta,
} from '../lib/transcript'
import { Anchor, Clock, Target, Zap } from 'lucide-react'

/** Anzahl gleichzeitig sichtbarer Transkript-Blöcke (Rest folgt automatisch mit dem Playback). */
const TRANSCRIPT_VISIBLE_COUNT = 5

function getTranscriptWindowStart(
  segmentCount: number,
  activeIndex: number,
  visibleCount: number,
): number {
  if (segmentCount <= visibleCount) return 0
  if (activeIndex < 0) return 0
  const maxStart = segmentCount - visibleCount
  const centered = activeIndex - Math.floor((visibleCount - 1) / 2)
  return Math.max(0, Math.min(centered, maxStart))
}

function ReelWithTranscript({ item }: { item: ContentItem }) {
  const videoRef = useRef<HTMLVideoElement | null>(null)
  const [currentTime, setCurrentTime] = useState(0)
  const [mediaDuration, setMediaDuration] = useState(0)
  const hasVideo = Boolean(item.mediaUrl?.trim())
  const hasThumb = Boolean(item.thumbnailUrl?.trim())
  const segments = useMemo(
    () => parseTranscriptSegments(item.transcriptDetail),
    [item.transcriptDetail],
  )
  const hasTranscript = segments.length > 0

  const phaseMeta: PhaseTimingMeta = useMemo(
    () => ({
      hookStart: item.hookStart,
      hookEnd: item.hookEnd,
      ctaStart: item.ctaStart,
      ctaEnd: item.ctaEnd,
    }),
    [item.hookStart, item.hookEnd, item.ctaStart, item.ctaEnd],
  )

  const totalDuration = useMemo(() => {
    if (mediaDuration > 0 && Number.isFinite(mediaDuration)) return mediaDuration
    if (item.durationSeconds > 0) return item.durationSeconds
    const last = segments[segments.length - 1]
    return last?.end ?? 0
  }, [mediaDuration, item.durationSeconds, segments])

  const progressPct =
    hasVideo && totalDuration > 0
      ? Math.min(100, Math.max(0, (currentTime / totalDuration) * 100))
      : 0

  const structureBands = useMemo(
    () => buildStructureBands(totalDuration, phaseMeta),
    [totalDuration, phaseMeta],
  )

  const currentPhase = useMemo(
    () => (hasVideo ? getPhaseAtTime(currentTime, phaseMeta) : ('neutral' as const)),
    [hasVideo, currentTime, phaseMeta],
  )

  const activeIndex = useMemo(() => {
    if (!hasVideo) return -1
    return getActiveTranscriptIndex(segments, currentTime)
  }, [hasVideo, segments, currentTime])

  const transcriptWindowStart = useMemo(
    () => getTranscriptWindowStart(segments.length, activeIndex, TRANSCRIPT_VISIBLE_COUNT),
    [segments.length, activeIndex],
  )

  const visibleTranscriptSegments = useMemo(() => {
    return segments.slice(
      transcriptWindowStart,
      transcriptWindowStart + TRANSCRIPT_VISIBLE_COUNT,
    )
  }, [segments, transcriptWindowStart])

  const seekTo = (start: number) => {
    const v = videoRef.current
    if (!v) return
    v.currentTime = Math.max(0, start)
    setCurrentTime(v.currentTime)
    void v.play().catch(() => {})
  }

  const mediaBlock =
    hasVideo ? (
      <div className="group relative mx-auto max-w-[300px]">
        <div
          className="absolute -inset-3 rounded-[2rem] bg-gradient-to-br from-indigo-500/30 via-violet-500/20 to-fuchsia-500/25 blur-2xl transition duration-500 group-hover:from-indigo-500/40 group-hover:via-violet-500/30"
          aria-hidden
        />
        <div className="relative rounded-[1.35rem] bg-gradient-to-br from-indigo-500 via-violet-600 to-fuchsia-600 p-[3px] shadow-[0_24px_60px_-12px_rgba(99,102,241,0.45)]">
          <div className="overflow-hidden rounded-[1.28rem] bg-slate-950 ring-1 ring-white/20">
            <video
              ref={videoRef}
              src={item.mediaUrl!.trim()}
              poster={item.thumbnailUrl?.trim() || undefined}
              controls
              playsInline
              preload="metadata"
              onLoadedMetadata={(e) => {
                const d = e.currentTarget.duration
                if (Number.isFinite(d) && d > 0) setMediaDuration(d)
              }}
              onTimeUpdate={() => {
                const v = videoRef.current
                if (v) setCurrentTime(v.currentTime)
              }}
              onSeeked={() => {
                const v = videoRef.current
                if (v) setCurrentTime(v.currentTime)
              }}
              className="aspect-[9/16] max-h-[min(70vh,720px)] w-full object-cover"
            >
              Dein Browser unterstützt keine Videowiedergabe.
            </video>
          </div>
        </div>
        <div className="pointer-events-none absolute -bottom-1 left-1/2 flex -translate-x-1/2 gap-1">
          <span className="h-1 w-8 rounded-full bg-gradient-to-r from-indigo-400/80 to-fuchsia-400/80 opacity-80" />
        </div>
      </div>
    ) : hasThumb ? (
      <div className="mx-auto flex max-w-[300px] flex-col items-center gap-3">
        <div className="rounded-[1.35rem] bg-gradient-to-br from-slate-200 to-slate-300 p-[2px] shadow-lg">
          <img
            src={item.thumbnailUrl!.trim()}
            alt=""
            className="aspect-[9/16] w-full rounded-[1.28rem] object-cover"
          />
        </div>
        <p className="text-center text-[11px] text-slate-500">
          Keine Video-URL – nur Vorschaubild.
        </p>
      </div>
    ) : (
      <p className="text-xs text-slate-500">Kein Video oder Vorschaubild hinterlegt.</p>
    )

  if (!hasTranscript) {
    return (
      <div className="flex min-h-[min(60vh,560px)] w-full items-center justify-center px-2 py-8">
        {mediaBlock}
      </div>
    )
  }

  const hs = item.hookStart ?? 0
  const he = item.hookEnd
  const hookWindowOk = he != null && Number.isFinite(he) && he > hs
  const ctaWindowOk =
    item.ctaStart != null &&
    item.ctaEnd != null &&
    item.ctaEnd > item.ctaStart

  return (
    <div className="flex flex-col gap-8 lg:flex-row lg:items-stretch lg:justify-between lg:gap-10 xl:gap-14">
      <div className="flex w-full shrink-0 items-center justify-center self-stretch px-2 py-6 sm:py-8 lg:w-[min(100%,340px)] lg:flex-none lg:px-0 lg:py-0 xl:w-[min(100%,360px)]">
        {mediaBlock}
      </div>

      <div className="relative min-h-0 min-w-0 w-full flex-1 lg:min-w-0 lg:max-w-none xl:pl-2">
        <div
          className="pointer-events-none absolute -left-4 top-8 hidden h-32 w-32 rounded-full bg-violet-400/15 blur-3xl lg:block"
          aria-hidden
        />
        <div className="relative overflow-hidden rounded-3xl border border-slate-200/80 bg-gradient-to-br from-slate-50 via-white to-indigo-50/40 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.9),0_20px_50px_-24px_rgba(79,70,229,0.18)]">
          <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-indigo-300/60 to-transparent" />
          <div className="border-b border-slate-100/90 bg-white/60 px-4 py-4 backdrop-blur-sm sm:px-5">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
              <div className="min-w-0">
                <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-slate-400">
                  Transkript
                </p>
                <p className="mt-1 text-[11px] leading-snug text-slate-500">
                  {hasVideo
                    ? 'Synchron mit dem Video · Block antippen zum Springen'
                    : 'Nur Lesen (ohne Video)'}
                </p>
              </div>
              {hasVideo && totalDuration > 0 ? (
                <div className="flex shrink-0 flex-wrap items-center gap-2 sm:justify-end">
                  <span
                    className={cn(
                      'rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.12em] ring-1',
                      TRANSCRIPT_PHASE_STYLES[currentPhase].badge,
                    )}
                  >
                    {TRANSCRIPT_PHASE_LABEL_DE[currentPhase]}
                  </span>
                  <div className="flex items-center gap-1.5 rounded-full border border-slate-200/90 bg-white/90 px-2.5 py-1 font-mono text-[11px] tabular-nums text-slate-600 shadow-sm">
                    <Clock className="h-3 w-3 text-indigo-500" aria-hidden />
                    <span className="text-slate-800">
                      {formatTranscriptTimestamp(currentTime)}
                    </span>
                    <span className="text-slate-400">/</span>
                    <span>{formatTranscriptTimestamp(totalDuration)}</span>
                  </div>
                </div>
              ) : null}
            </div>

            {/* Meta: Hook/CTA-Zeiten, Framework, Scores … */}
            <div className="mt-3 flex flex-wrap gap-2 border-t border-slate-100/80 pt-3">
              {hookWindowOk ? (
                <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-200/90 bg-amber-50/90 px-2.5 py-1 text-[10px] font-medium text-amber-950 shadow-sm">
                  <Anchor className="h-3 w-3 shrink-0 text-amber-600" aria-hidden />
                  Hook{' '}
                  <span className="font-mono tabular-nums text-amber-900/90">
                    {formatTranscriptTimestamp(hs)}–{formatTranscriptTimestamp(he)}
                  </span>
                  {item.hookDuration != null ? (
                    <span className="text-amber-700/80">
                      · {formatSecondsOneDecimal(item.hookDuration)}
                    </span>
                  ) : (
                    <span className="text-amber-700/80">
                      · {formatSecondsOneDecimal(he - hs)}
                    </span>
                  )}
                </span>
              ) : null}
              {ctaWindowOk ? (
                <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200/90 bg-emerald-50/90 px-2.5 py-1 text-[10px] font-medium text-emerald-950 shadow-sm">
                  <Target className="h-3 w-3 shrink-0 text-emerald-600" aria-hidden />
                  CTA{' '}
                  <span className="font-mono tabular-nums text-emerald-900/90">
                    {formatTranscriptTimestamp(item.ctaStart!)}–
                    {formatTranscriptTimestamp(item.ctaEnd!)}
                  </span>
                </span>
              ) : null}
              {item.bodyDuration != null && item.bodyDuration > 0 ? (
                <span className="inline-flex items-center gap-1 rounded-full border border-violet-200/80 bg-violet-50/80 px-2.5 py-1 text-[10px] font-medium text-violet-900">
                  <Zap className="h-3 w-3 text-violet-600" aria-hidden />
                  Hauptteil-Dauer {formatSecondsOneDecimal(item.bodyDuration)}
                </span>
              ) : null}
              {item.timeToHook != null && Number.isFinite(item.timeToHook) ? (
                <span className="rounded-full border border-slate-200 bg-white px-2.5 py-1 text-[10px] text-slate-600">
                  Time-to-Hook: {formatSecondsOneDecimal(item.timeToHook)}
                </span>
              ) : null}
              {item.hookFramework ? (
                <span
                  className="max-w-[220px] truncate rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-[10px] text-slate-700"
                  title={item.hookFramework}
                >
                  Framework: {item.hookFramework}
                </span>
              ) : null}
              {item.storytellingType ? (
                <span className="rounded-full border border-slate-200 bg-white px-2.5 py-1 text-[10px] text-slate-600">
                  Story: {item.storytellingType}
                </span>
              ) : null}
              {item.contentFormat ? (
                <span className="rounded-full border border-slate-200 bg-white px-2.5 py-1 text-[10px] text-slate-600">
                  Format: {item.contentFormat}
                </span>
              ) : null}
              {item.hookStrengthScore != null ? (
                <span className="rounded-full border border-indigo-100 bg-indigo-50/80 px-2.5 py-1 text-[10px] font-medium text-indigo-900">
                  HS {item.hookStrengthScore}
                </span>
              ) : null}
              {item.viralPotentialScore != null ? (
                <span className="rounded-full border border-fuchsia-100 bg-fuchsia-50/80 px-2.5 py-1 text-[10px] font-medium text-fuchsia-900">
                  VP {item.viralPotentialScore}
                </span>
              ) : null}
            </div>

            {item.patternInterrupts && item.patternInterrupts.length > 0 ? (
              <div className="mt-2 rounded-2xl border border-dashed border-slate-200/90 bg-slate-50/50 px-3 py-2">
                <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">
                  Pattern-Interrupts
                </p>
                <ul className="mt-1.5 list-inside list-disc space-y-0.5 text-[11px] leading-relaxed text-slate-600">
                  {item.patternInterrupts.map((p) => (
                    <li key={p}>{p}</li>
                  ))}
                </ul>
              </div>
            ) : null}

            {/* Struktur-Timeline (Hook / Hauptteil / CTA) + Playhead */}
            {hasVideo && totalDuration > 0 ? (
              <div className="mt-3 space-y-2">
                <div className="relative h-3 w-full overflow-hidden rounded-full bg-slate-200/70 shadow-inner">
                  {structureBands.map((b, i) => (
                    <div
                      key={`${b.from}-${b.to}-${b.kind}-${i}`}
                      className={cn(
                        'absolute inset-y-0',
                        b.kind === 'hook' && 'bg-amber-400/55',
                        b.kind === 'body' && 'bg-violet-400/40',
                        b.kind === 'cta' && 'bg-emerald-400/45',
                        b.kind === 'neutral' && 'bg-slate-300/40',
                      )}
                      style={{
                        left: `${(b.from / totalDuration) * 100}%`,
                        width: `${((b.to - b.from) / totalDuration) * 100}%`,
                      }}
                      title={TRANSCRIPT_PHASE_LABEL_DE[b.kind]}
                    />
                  ))}
                  <div
                    className="pointer-events-none absolute inset-y-0 z-10 w-[2px] -translate-x-px bg-white shadow-[0_0_10px_rgba(255,255,255,0.95)]"
                    style={{ left: `${progressPct}%` }}
                  />
                </div>
                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[10px] text-slate-500">
                  <span className="inline-flex items-center gap-1">
                    <span className="h-2 w-2 rounded-sm bg-amber-400/80" /> Hook
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <span className="h-2 w-2 rounded-sm bg-violet-400/80" /> Hauptteil
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <span className="h-2 w-2 rounded-sm bg-emerald-400/80" /> CTA
                  </span>
                </div>
              </div>
            ) : null}
          </div>

          <div
            className="space-y-0 overflow-hidden px-4 py-4 sm:px-5"
            role="log"
            aria-live="polite"
            aria-relevant="additions text"
          >
            {segments.length > TRANSCRIPT_VISIBLE_COUNT ? (
              <p className="mb-3 text-center text-[10px] font-medium text-slate-400">
                Zeigt {TRANSCRIPT_VISIBLE_COUNT} von {segments.length} Blöcken · folgt der Wiedergabe
              </p>
            ) : null}
            <div className="relative pl-2">
              <div
                className="absolute bottom-2 left-[11px] top-2 w-px bg-gradient-to-b from-indigo-300/80 via-violet-300/50 to-fuchsia-300/40"
                aria-hidden
              />
              {visibleTranscriptSegments.map((seg, localIdx) => {
                const i = transcriptWindowStart + localIdx
                const active = i === activeIndex
                const phase = getSegmentPhase(seg, phaseMeta)
                const ph = TRANSCRIPT_PHASE_STYLES[phase]
                return (
                  <button
                    key={`${seg.start}-${i}`}
                    type="button"
                    disabled={!hasVideo}
                    onClick={() => seekTo(seg.start)}
                    className={cn(
                      'relative mb-3 w-full rounded-2xl border text-left transition-all duration-300 last:mb-0',
                      'pl-8 pr-3 py-3',
                      active
                        ? cn(
                            'bg-gradient-to-br shadow-[0_8px_30px_-8px_rgba(99,102,241,0.28),inset_0_1px_0_0_rgba(255,255,255,0.95)]',
                            'ring-1 ring-indigo-200/70',
                            ph.border,
                            ph.softBg,
                          )
                        : cn(
                            'border-transparent bg-white/50 hover:bg-white/95',
                            'hover:shadow-md hover:shadow-slate-200/50',
                            'hover:border-slate-200/90',
                          ),
                      !active && phase !== 'neutral' && ph.border,
                      !hasVideo ? 'cursor-default opacity-95' : 'cursor-pointer',
                    )}
                  >
                    <span
                      className={cn(
                        'absolute left-[7px] top-4 z-10 h-2.5 w-2.5 rounded-full border-2 transition-all duration-300',
                        ph.dot,
                        active && 'scale-125 shadow-[0_0_12px_rgba(99,102,241,0.45)]',
                      )}
                      aria-hidden
                    />
                    <div className="mb-1.5 flex flex-wrap items-center gap-2">
                      <span
                        className={cn(
                          'rounded-full px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider ring-1',
                          ph.badge,
                        )}
                      >
                        {TRANSCRIPT_PHASE_LABEL_DE[phase]}
                      </span>
                      <span
                        className={cn(
                          'inline-flex items-center gap-1.5 font-mono text-[10px] font-semibold tabular-nums tracking-wide',
                          active ? 'text-slate-800' : 'text-slate-400',
                        )}
                      >
                        {formatTranscriptTimestamp(seg.start)}
                        <span className="font-normal text-slate-300">—</span>
                        {formatTranscriptTimestamp(seg.end)}
                      </span>
                    </div>
                    <p
                      className={cn(
                        'text-[13px] leading-relaxed',
                        active ? 'text-slate-900' : 'text-slate-600',
                      )}
                    >
                      {seg.text}
                    </p>
                  </button>
                )
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
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
    hook: String(row.hook ?? row.caption ?? ''),
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

      const { data: fromLibrary, error: libErr } = await supabase
        .from('content_items')
        .select('*')
        .eq('user_id', user.id)
        .eq('id', id)
        .maybeSingle()

      if (libErr) {
        setLoading(false)
        setError(libErr.message)
        return
      }
      if (fromLibrary) {
        setLoading(false)
        setItem(mapRowToContentItem(fromLibrary as Record<string, unknown>))
        return
      }

      const { data: fromAccount, error: uaErr } = await supabase
        .from('user_account_content')
        .select('*')
        .eq('user_id', user.id)
        .eq('id', id)
        .maybeSingle()

      setLoading(false)
      if (uaErr) {
        setError(uaErr.message)
        return
      }
      if (!fromAccount) {
        setItem(null)
        return
      }
      setItem(mapRowToContentItem(fromAccount as Record<string, unknown>))
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
      { subject: 'Likes', score: (item?.likeRate ?? 0) * 100 },
      { subject: 'Komm.', score: (item?.commentRate ?? 0) * 100 },
      { subject: 'Saves', score: (item?.saveRate ?? 0) * 100 },
    ],
    [item],
  )

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
          onClick={() => navigate(-1)}
        >
          ← Zurück
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
        <div className="space-y-4">
          <Card
            title="Reel & Transkript"
            description="Player mit Farbrand und Live-Transkript – aktueller Block, Fortschrittsbalken und Timeline sind aufeinander abgestimmt."
          >
            <ReelWithTranscript item={item} />
          </Card>

          <div className="grid gap-4 lg:grid-cols-2">
          <Card title="Performance Übersicht" description="Aufrufe und Engagement">
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="rounded-2xl border border-indigo-100 bg-indigo-50 p-3">
                <p className="text-[10px] text-indigo-500">Aufrufe</p>
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

          <Card title="Qualitäts-Score Radar" description="Hook, Viral-Potenzial und Engagement-Raten">
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
        </div>
      )}
    </div>
  )
}
