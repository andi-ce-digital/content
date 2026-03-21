/** Ein Segment aus `transcript_detail` / API (JSON-Array). */
export type TranscriptSegment = {
  start: number
  end: number
  text: string
}

/**
 * Parst `transcript_detail` aus DB (jsonb) oder JSON-String.
 * Unterstützt Feldnamen `transcript_details` / `transcript_detail` auf Row-Ebene (Mapper).
 */
export function parseTranscriptSegments(raw: unknown): TranscriptSegment[] {
  if (raw == null) return []
  let data: unknown = raw
  if (typeof raw === 'string') {
    try {
      data = JSON.parse(raw) as unknown
    } catch {
      return []
    }
  }
  if (!Array.isArray(data)) return []
  const out: TranscriptSegment[] = []
  for (const row of data) {
    if (!row || typeof row !== 'object') continue
    const o = row as Record<string, unknown>
    const start = Number(o.start)
    const end = Number(o.end)
    const text = o.text != null ? String(o.text) : ''
    if (!Number.isFinite(start) || !Number.isFinite(end)) continue
    out.push({ start, end, text })
  }
  return out.sort((a, b) => a.start - b.start)
}

/** Aktives Segment zur Videoposition (Sekunden). */
export function getActiveTranscriptIndex(
  segments: TranscriptSegment[],
  t: number,
): number {
  if (segments.length === 0 || !Number.isFinite(t)) return -1
  for (let i = 0; i < segments.length; i++) {
    const s = segments[i]
    const isLast = i === segments.length - 1
    // Letztes Segment: Ende inklusiv (Video-Ende kann exakt auf `end` liegen)
    if (t >= s.start && (isLast ? t <= s.end + 0.05 : t < s.end)) return i
  }
  return -1
}

export function formatTranscriptTimestamp(seconds: number): string {
  if (!Number.isFinite(seconds)) return '0:00'
  const m = Math.floor(seconds / 60)
  const s = Math.floor(seconds % 60)
  return `${m}:${s.toString().padStart(2, '0')}`
}

/** Kurz in Sekunden, z. B. für Dauer-Anzeige */
export function formatSecondsOneDecimal(seconds: number | null | undefined): string {
  if (seconds == null || !Number.isFinite(seconds)) return '—'
  return `${seconds.toLocaleString('de-DE', { maximumFractionDigits: 1 })} s`
}

/** Zeitfenster aus DB (hook_*, cta_*, …) */
export type PhaseTimingMeta = {
  hookStart?: number | null
  hookEnd?: number | null
  ctaStart?: number | null
  ctaEnd?: number | null
}

export type TranscriptPhase = 'hook' | 'body' | 'cta' | 'neutral'

export const TRANSCRIPT_PHASE_LABEL_DE: Record<TranscriptPhase, string> = {
  hook: 'Hook',
  body: 'Hauptteil',
  cta: 'CTA',
  neutral: 'Sonstiges',
}

/** Phasen-Farben (Tailwind-Klassen für Border/Badge) */
export const TRANSCRIPT_PHASE_STYLES: Record<
  TranscriptPhase,
  { badge: string; border: string; dot: string; softBg: string }
> = {
  hook: {
    badge: 'bg-amber-100 text-amber-900 ring-amber-200/80',
    border: 'border-amber-200/90',
    dot: 'border-amber-500 bg-amber-400',
    softBg: 'from-amber-50/90 to-orange-50/40',
  },
  body: {
    badge: 'bg-violet-100 text-violet-900 ring-violet-200/80',
    border: 'border-violet-200/80',
    dot: 'border-violet-500 bg-violet-400',
    softBg: 'from-violet-50/90 to-indigo-50/30',
  },
  cta: {
    badge: 'bg-emerald-100 text-emerald-900 ring-emerald-200/80',
    border: 'border-emerald-200/90',
    dot: 'border-emerald-500 bg-emerald-400',
    softBg: 'from-emerald-50/90 to-teal-50/40',
  },
  neutral: {
    badge: 'bg-slate-100 text-slate-600 ring-slate-200/80',
    border: 'border-slate-200/80',
    dot: 'border-slate-400 bg-slate-200',
    softBg: 'from-slate-50 to-white',
  },
}

/**
 * Welche Struktur-Phase liegt bei Sekunde `t`?
 * Nutzt hook_start/hook_end und optional cta_start/cta_end.
 * Fehlendes hook_start wird wie 0 behandelt, wenn hook_end gesetzt ist.
 */
export function getPhaseAtTime(t: number, meta: PhaseTimingMeta): TranscriptPhase {
  if (!Number.isFinite(t)) return 'neutral'
  const hs = meta.hookStart ?? 0
  const he = meta.hookEnd
  const cs = meta.ctaStart
  const ce = meta.ctaEnd

  const hookOk = he != null && Number.isFinite(he) && he > hs
  const ctaOk = cs != null && ce != null && Number.isFinite(cs) && Number.isFinite(ce) && ce > cs

  if (hookOk && t >= hs && t <= he) return 'hook'
  if (ctaOk && t >= cs && t <= ce) return 'cta'

  if (hookOk && ctaOk) {
    if (t > he && t < cs) return 'body'
    if (t > ce) return 'body'
    if (t < hs) return 'neutral'
  } else if (hookOk) {
    if (t > he) return 'body'
    if (t < hs) return 'neutral'
  } else if (ctaOk) {
    if (t < cs) return 'body'
    if (t > ce) return 'body'
  }

  return 'neutral'
}

/**
 * Phase für ein Transkript-Segment (Mitte des Intervalls).
 */
export function getSegmentPhase(seg: TranscriptSegment, meta: PhaseTimingMeta): TranscriptPhase {
  const mid = (seg.start + seg.end) / 2
  return getPhaseAtTime(mid, meta)
}

export type StructureBand = {
  from: number
  to: number
  kind: TranscriptPhase
}

/**
 * Zerlegt [0, totalDuration] in Hook-, Hauptteil- und CTA-Bereiche für die Mini-Timeline.
 */
export function buildStructureBands(
  totalDuration: number,
  meta: PhaseTimingMeta,
): StructureBand[] {
  if (!Number.isFinite(totalDuration) || totalDuration <= 0) return []

  const hs = meta.hookStart ?? 0
  const he = meta.hookEnd
  const cs = meta.ctaStart
  const ce = meta.ctaEnd

  const hookOk = he != null && Number.isFinite(he) && he > hs && Number.isFinite(hs)
  const ctaOk =
    cs != null && ce != null && Number.isFinite(cs) && Number.isFinite(ce) && ce > cs && cs >= 0

  const bands: StructureBand[] = []
  let cursor = 0

  if (hookOk) {
    if (hs > cursor) {
      bands.push({ from: cursor, to: Math.min(hs, totalDuration), kind: 'neutral' })
    }
    const hookTo = Math.min(he, totalDuration)
    if (hookTo > Math.max(cursor, hs)) {
      bands.push({ from: Math.max(hs, 0), to: hookTo, kind: 'hook' })
    }
    cursor = Math.max(cursor, he)
  }

  if (ctaOk) {
    const ctaFrom = Math.max(cs, 0)
    const ctaTo = Math.min(ce, totalDuration)
    if (ctaFrom > cursor) {
      bands.push({ from: cursor, to: Math.min(ctaFrom, totalDuration), kind: 'body' })
    }
    if (ctaTo > ctaFrom) {
      bands.push({ from: ctaFrom, to: ctaTo, kind: 'cta' })
    }
    cursor = Math.max(cursor, ce)
  } else if (hookOk && cursor < totalDuration) {
    bands.push({ from: cursor, to: totalDuration, kind: 'body' })
    cursor = totalDuration
  }

  if (cursor < totalDuration) {
    bands.push({ from: cursor, to: totalDuration, kind: 'body' })
  }

  return mergeAdjacentBands(bands)
}

function mergeAdjacentBands(bands: StructureBand[]): StructureBand[] {
  const out: StructureBand[] = []
  for (const b of bands) {
    if (b.to <= b.from) continue
    const prev = out[out.length - 1]
    if (prev && prev.kind === b.kind && prev.to === b.from) {
      prev.to = b.to
    } else {
      out.push({ ...b })
    }
  }
  return out
}
