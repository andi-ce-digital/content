import { useRef } from 'react'
import type { LucideIcon } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { BarChart3, ExternalLink, Film, Heart, MessageCircle, Play, TrendingUp } from 'lucide-react'
import { Card } from '../ui/Card'

export type UserAccountContentRow = {
  id: string
  platform: string
  title: string | null
  caption: string | null
  thumbnail_url: string | null
  media_url: string | null
  source_url: string | null
  views: number | null
  likes: number | null
  comments: number | null
  shares: number | null
  engagement_rate: number | null
  performance_score: number | null
  published_at: string | null
  created_at: string | null
  hook_type: string | null
  content_format: string | null
  hook_strength_score: number | null
  viral_potential_score: number | null
  like_rate: number | null
  comment_rate: number | null
  save_rate: number | null
  share_rate: number | null
  duration_seconds: number | null
  topic: string | null
}

export function formatCompactNumber(n: number | null | undefined): string {
  if (n == null || Number.isNaN(n)) return '—'
  const v = Math.abs(n)
  if (v >= 1_000_000) return `${(Math.sign(n) * (v / 1_000_000)).toFixed(1)}M`
  if (v >= 10_000) return `${(Math.sign(n) * (v / 1_000)).toFixed(1)}k`
  if (v >= 1_000) return `${(Math.sign(n) * (v / 1_000)).toFixed(2)}k`
  return String(Math.round(n))
}

/** engagement_rate kann als 0–1 oder schon als % kommen */
export function formatEngagementRate(v: number | null | undefined): string {
  if (v == null || Number.isNaN(v)) return '—'
  const pct = v > 0 && v <= 1 ? v * 100 : v
  return `${pct.toFixed(2)}%`
}

/** Thumbnail sichtbar; bei media_url zusätzlich Video mit poster — Hover startet Wiedergabe. */
function DashboardReelThumb({ item }: { item: UserAccountContentRow }) {
  const media = item.media_url?.trim()
  const thumb = item.thumbnail_url?.trim()
  const videoRef = useRef<HTMLVideoElement>(null)

  return (
    <div
      className="absolute inset-0"
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
          className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.03]"
          aria-hidden
        />
      ) : thumb ? (
        <img
          src={thumb}
          alt=""
          className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.03]"
          loading="lazy"
        />
      ) : (
        <div className="flex h-full w-full flex-col items-center justify-center gap-2 bg-gradient-to-b from-slate-100 to-slate-50 p-4 text-center">
          <Play className="h-10 w-10 opacity-50" />
          <span className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">
            {item.platform}
          </span>
        </div>
      )}
    </div>
  )
}

function platformStyle(p: string) {
  switch (p?.toLowerCase()) {
    case 'tiktok':
      return 'from-emerald-500/20 to-teal-500/10 text-emerald-800 ring-emerald-200/60'
    case 'youtube':
      return 'from-rose-500/20 to-orange-500/10 text-rose-800 ring-rose-200/60'
    case 'instagram':
    default:
      return 'from-fuchsia-500/20 to-violet-500/10 text-violet-900 ring-fuchsia-200/60'
  }
}

function ReelMetric({
  icon: Icon,
  label,
  value,
  accent,
}: {
  icon: LucideIcon
  label: string
  value: string
  accent?: string
}) {
  return (
    <div
      className={`flex items-center gap-1.5 rounded-xl border border-slate-200/80 bg-slate-50/90 px-2.5 py-1.5 text-[11px] font-medium text-slate-600 ${accent ?? ''}`}
    >
      <Icon className="h-3.5 w-3.5 shrink-0 text-slate-400" aria-hidden />
      <span className="text-slate-500">{label}</span>
      <span className="tabular-nums font-semibold text-slate-900">{value}</span>
    </div>
  )
}

export function DashboardReelsSection({
  items,
}: {
  items: UserAccountContentRow[]
}) {
  const navigate = useNavigate()

  return (
    <section>
      <Card
        className="border-slate-200/80 bg-white p-5 shadow-sm"
        title="Reels & Posts"
        description="Neueste Inhalte — jeder Post als eigene Card. Klick aufs Bild oder den Link öffnet den Original-Post."
      >
        <div className="space-y-4">
          {items.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-slate-200 bg-slate-50/80 px-4 py-12 text-center">
              <Film className="mx-auto h-10 w-10 text-slate-300" />
              <p className="mt-2 text-sm font-medium text-slate-700">Noch keine Reels für diesen Account</p>
              <p className="mt-1 text-[11px] text-slate-500">
                Sobald dein Workflow Posts schreibt, erscheinen sie hier automatisch.
              </p>
            </div>
          ) : (
            items.map((item) => (
              <article
                key={item.id}
                className="group overflow-hidden rounded-3xl border border-slate-200/90 bg-gradient-to-b from-white to-slate-50/90 shadow-md shadow-slate-200/40 ring-1 ring-slate-100 transition hover:border-indigo-200/90 hover:shadow-lg hover:shadow-indigo-100/50"
              >
                <div className="flex flex-col sm:flex-row sm:items-stretch">
                  <div className="flex w-full shrink-0 flex-col sm:w-[140px]">
                    <a
                      href={item.source_url ?? '#'}
                      target="_blank"
                      rel="noreferrer noopener"
                      className={`group/thumb relative block aspect-[9/16] w-full overflow-hidden sm:aspect-auto sm:h-auto sm:min-h-[180px] ${platformStyle(item.platform)}`}
                      aria-label="Post öffnen"
                      onClick={(e) => {
                        if (!item.source_url) e.preventDefault()
                      }}
                    >
                      <DashboardReelThumb item={item} />
                      <span className="pointer-events-none absolute bottom-2 right-2 z-10 rounded-lg bg-black/60 px-2 py-0.5 text-[10px] font-medium text-white backdrop-blur-sm">
                        {item.duration_seconds != null && item.duration_seconds > 0
                          ? `${Math.round(item.duration_seconds)}s`
                          : 'Reel'}
                      </span>
                    </a>
                  </div>

                  <div className="flex min-w-0 flex-1 flex-col justify-between p-4 sm:p-5">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="line-clamp-2 text-base font-semibold leading-snug text-slate-900">
                          {item.title?.trim() || item.caption?.trim()?.slice(0, 140) || 'Ohne Titel'}
                        </p>
                        {item.topic ? (
                          <p className="mt-1 line-clamp-1 text-[12px] text-slate-500">{item.topic}</p>
                        ) : null}
                      </div>
                      {item.source_url ? (
                        <a
                          href={item.source_url}
                          target="_blank"
                          rel="noreferrer noopener"
                          className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-500 shadow-sm transition hover:border-indigo-200 hover:bg-indigo-50 hover:text-indigo-700"
                          aria-label="Extern öffnen"
                        >
                          <ExternalLink className="h-4 w-4" />
                        </a>
                      ) : null}
                    </div>

                    <div className="mt-4 flex flex-wrap items-center gap-2">
                      <ReelMetric icon={Play} label="Aufrufe" value={formatCompactNumber(item.views)} />
                      <ReelMetric
                        icon={Heart}
                        label="Likes"
                        value={formatCompactNumber(item.likes)}
                        accent="text-rose-700"
                      />
                      <ReelMetric
                        icon={MessageCircle}
                        label="Kommentare"
                        value={formatCompactNumber(item.comments)}
                      />
                      <ReelMetric
                        icon={TrendingUp}
                        label="Engagement"
                        value={formatEngagementRate(item.engagement_rate)}
                        accent="text-indigo-800"
                      />
                      <button
                        type="button"
                        onClick={() => navigate(`/library/${item.id}/stats`)}
                        className="flex items-center gap-1.5 rounded-xl border border-slate-200/80 bg-slate-50/90 px-2.5 py-1.5 text-[11px] font-medium text-slate-600 shadow-sm transition hover:border-indigo-200 hover:bg-indigo-50/90 hover:text-indigo-800"
                        title="Detaillierte Statistiken"
                      >
                        <BarChart3 className="h-3.5 w-3.5 shrink-0 text-indigo-500" aria-hidden />
                        <span className="text-slate-600">Statistik</span>
                      </button>
                    </div>

                    <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-slate-100 pt-4">
                      <span
                        className={`rounded-full bg-gradient-to-r px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide ring-1 ${platformStyle(item.platform)}`}
                      >
                        {item.platform}
                      </span>
                      {item.hook_type ? (
                        <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[10px] font-medium text-slate-700 ring-1 ring-slate-200/80">
                          Hook: {item.hook_type}
                        </span>
                      ) : null}
                      {item.content_format ? (
                        <span className="rounded-full bg-amber-50 px-2.5 py-1 text-[10px] font-medium text-amber-900 ring-1 ring-amber-100">
                          {item.content_format}
                        </span>
                      ) : null}
                      {item.hook_strength_score != null ? (
                        <span className="text-[10px] text-slate-400">
                          HS {item.hook_strength_score}
                          {item.viral_potential_score != null ? ` · VP ${item.viral_potential_score}` : ''}
                        </span>
                      ) : null}
                    </div>
                  </div>
                </div>
              </article>
            ))
          )}
        </div>
      </Card>
    </section>
  )
}
