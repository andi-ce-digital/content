import { useEffect, useMemo, useState } from 'react'
import { Card } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { contentLibraryMock, exampleStrategy } from '../data/mockData'
import { supabase } from '../lib/supabaseClient'
import { useAuth } from '../auth/AuthContext'

export function GeneratorPage() {
  type Mode = 'hooks' | 'script' | 'cta'
  type Platform = 'instagram' | 'tiktok' | 'youtube'

  const { user } = useAuth()
  const [mode, setMode] = useState<Mode>('hooks')
  const [platform, setPlatform] = useState<Platform>('instagram')
  const [hookPattern, setHookPattern] = useState('Contrarian Hook')
  const [goal, setGoal] = useState('Lead-Generierung')
  const [referenceId, setReferenceId] = useState(contentLibraryMock[0]?.id ?? '')
  const [selectedTopics, setSelectedTopics] = useState<string[]>([])
  const reference = useMemo(
    () => contentLibraryMock.find((x) => x.id === referenceId) ?? contentLibraryMock[0],
    [referenceId],
  )

  // Hooks Wizard
  const [isHookWizardOpen, setIsHookWizardOpen] = useState(false)
  const [hookWizardStep, setHookWizardStep] = useState(0)
  const [topicQueryLoading, setTopicQueryLoading] = useState(false)
  const [topicQueryError, setTopicQueryError] = useState<string | null>(null)
  const [topTopics, setTopTopics] = useState<
    { topic: string; score: number; count: number; avgEngagement: number }[]
  >([])
  const [topicSelection, setTopicSelection] = useState<string[]>([])
  const [customTopicInput, setCustomTopicInput] = useState('')

  function PlatformBadge({ p }: { p: Platform }) {
    const bg =
      p === 'instagram'
        ? 'bg-gradient-to-br from-fuchsia-500 to-amber-400'
        : p === 'tiktok'
          ? 'bg-slate-900'
          : 'bg-gradient-to-br from-red-500 to-red-600'
    return (
      <span
        className={`inline-flex h-8 w-8 items-center justify-center rounded-2xl text-white ${bg}`}
        aria-label={p}
      >
        {p === 'instagram' && (
          <svg viewBox="0 0 24 24" className="h-4 w-4 fill-none stroke-current">
            <rect x="4" y="4" width="16" height="16" rx="4" strokeWidth="2" />
            <circle cx="12" cy="12" r="3.5" strokeWidth="2" />
            <circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none" />
          </svg>
        )}
        {p === 'tiktok' && (
          <svg viewBox="0 0 24 24" className="h-4 w-4 fill-current">
            <path d="M15.5 4c.7 1.8 1.9 3 3.8 3.7V11a7.6 7.6 0 0 1-3.6-1v5.5A5.6 5.6 0 1 1 10 10v3a2.6 2.6 0 1 0 2.7 2.6V4h2.8z" />
          </svg>
        )}
        {p === 'youtube' && (
          <svg viewBox="0 0 24 24" className="h-4 w-4 fill-current">
            <path d="M21.5 8.2a2.8 2.8 0 0 0-2-2c-1.8-.5-7.5-.5-7.5-.5s-5.7 0-7.5.5a2.8 2.8 0 0 0-2 2A29 29 0 0 0 2 12a29 29 0 0 0 .5 3.8 2.8 2.8 0 0 0 2 2c1.8.5 7.5.5 7.5.5s5.7 0 7.5-.5a2.8 2.8 0 0 0 2-2A29 29 0 0 0 22 12a29 29 0 0 0-.5-3.8zM10 15.2V8.8L15.5 12 10 15.2z" />
          </svg>
        )}
      </span>
    )
  }

  function openHookWizard() {
    setMode('hooks')
    setHookWizardStep(0)
    setTopicSelection(selectedTopics)
    setCustomTopicInput('')
    setTopicQueryError(null)
    setIsHookWizardOpen(true)
  }

  function closeHookWizard() {
    setIsHookWizardOpen(false)
  }

  function toggleTopic(t: string) {
    setTopicSelection((prev) =>
      prev.includes(t) ? prev.filter((x) => x !== t) : [...prev, t],
    )
  }

  function computeScore(row: {
    engagement_rate?: number | null
    performance_score?: number | null
    viral_potential_score?: number | null
    views?: number | null
  }) {
    const e = Number(row.engagement_rate ?? 0)
    const p = Number(row.performance_score ?? 0)
    const v = Number(row.viral_potential_score ?? 0)
    const views = Number(row.views ?? 0)
    // Gewichtung: Engagement und Viral > Performance; Views leicht rein
    return e * 100 + v * 10 + p * 10 + Math.log10(Math.max(1, views)) * 2
  }

  useEffect(() => {
    async function loadTopics() {
      if (!isHookWizardOpen) return
      if (!supabase || !user) return
      setTopicQueryLoading(true)
      setTopicQueryError(null)

      const { data, error } = await supabase
        .from('content_items')
        .select('topic, engagement_rate, performance_score, viral_potential_score, views')
        .eq('user_id', user.id)
        .not('topic', 'is', null)
        .limit(500)

      setTopicQueryLoading(false)
      if (error) {
        setTopicQueryError(error.message)
        return
      }

      const rows = (data ?? []) as {
        topic: string | null
        engagement_rate: number | null
        performance_score: number | null
        viral_potential_score: number | null
        views: number | null
      }[]

      const map = new Map<
        string,
        { sumScore: number; count: number; sumEngagement: number }
      >()
      for (const r of rows) {
        const t = (r.topic ?? '').trim()
        if (!t) continue
        const key = t
        const prev = map.get(key) ?? { sumScore: 0, count: 0, sumEngagement: 0 }
        prev.sumScore += computeScore(r)
        prev.sumEngagement += Number(r.engagement_rate ?? 0)
        prev.count += 1
        map.set(key, prev)
      }

      const ranked = Array.from(map.entries())
        .map(([topic, agg]) => ({
          topic,
          score: agg.sumScore / Math.max(1, agg.count),
          count: agg.count,
          avgEngagement: agg.sumEngagement / Math.max(1, agg.count),
        }))
        .sort((a, b) => b.score - a.score)
        .slice(0, 16)

      setTopTopics(ranked)
    }
    void loadTopics()
  }, [isHookWizardOpen, user])

  return (
    <div className="mx-auto max-w-6xl space-y-4">
      <div className="relative overflow-hidden rounded-3xl border border-slate-100 bg-gradient-to-br from-slate-50 via-white to-indigo-50/30 px-5 py-6 shadow-sm">
        <div className="pointer-events-none absolute right-0 top-0 h-32 w-64 rounded-full bg-indigo-100/50 blur-3xl" />
        <div className="relative flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-[10px] font-medium uppercase tracking-[0.2em] text-slate-400">
              Generator
            </p>
            <h1 className="mt-1 text-lg font-semibold tracking-tight text-slate-900">
              Was willst du generieren?
            </h1>
            <p className="mt-1 text-xs text-slate-500">
              Wähle eine Aktion, setze Plattform und Referenz – Output rechts als Demo.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setPlatform('instagram')}
              className={`flex items-center gap-2 rounded-full px-3 py-2 text-xs font-medium ${
                platform === 'instagram'
                  ? 'bg-indigo-600 text-white'
                  : 'bg-slate-900/5 text-slate-700 hover:bg-slate-900/10'
              }`}
            >
              <PlatformBadge p="instagram" />
              Instagram
            </button>
            <button
              type="button"
              onClick={() => setPlatform('tiktok')}
              className={`flex items-center gap-2 rounded-full px-3 py-2 text-xs font-medium ${
                platform === 'tiktok'
                  ? 'bg-indigo-600 text-white'
                  : 'bg-slate-900/5 text-slate-700 hover:bg-slate-900/10'
              }`}
            >
              <PlatformBadge p="tiktok" />
              TikTok
            </button>
            <button
              type="button"
              onClick={() => setPlatform('youtube')}
              className={`flex items-center gap-2 rounded-full px-3 py-2 text-xs font-medium ${
                platform === 'youtube'
                  ? 'bg-indigo-600 text-white'
                  : 'bg-slate-900/5 text-slate-700 hover:bg-slate-900/10'
              }`}
            >
              <PlatformBadge p="youtube" />
              YouTube
            </button>
          </div>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-[minmax(0,1.25fr),minmax(0,1.75fr)]">
        <div className="space-y-4">
          <Card
            title="Aktionen"
            description="Klick eine Karte – das ist der Output, den du erzeugen willst."
          >
            <div className="grid gap-3 sm:grid-cols-2">
              <button
                type="button"
                onClick={openHookWizard}
                className={`rounded-3xl border p-4 text-left transition ${
                  mode === 'hooks'
                    ? 'border-indigo-200 bg-indigo-50'
                    : 'border-slate-100 bg-white/60 hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <PlatformBadge p={platform} />
                    <p className="text-xs font-semibold text-slate-900">
                      Hooks generieren
                    </p>
                  </div>
                  <span className="rounded-full bg-slate-900/5 px-2 py-0.5 text-[10px] text-slate-600">
                    10 Varianten
                  </span>
                </div>
                <p className="mt-2 text-[11px] text-slate-600">
                  Schnell 10 Hook-Varianten basierend auf Pattern + Referenz.
                </p>
              </button>

              <button
                type="button"
                onClick={() => setMode('script')}
                className={`rounded-3xl border p-4 text-left transition ${
                  mode === 'script'
                    ? 'border-indigo-200 bg-indigo-50'
                    : 'border-slate-100 bg-white/60 hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <PlatformBadge p={platform} />
                    <p className="text-xs font-semibold text-slate-900">
                      Skript generieren
                    </p>
                  </div>
                  <span className="rounded-full bg-slate-900/5 px-2 py-0.5 text-[10px] text-slate-600">
                    55s
                  </span>
                </div>
                <p className="mt-2 text-[11px] text-slate-600">
                  Voller Aufbau: Hook → Reframe → Mechanism → Proof → CTA.
                </p>
              </button>

              <button
                type="button"
                onClick={() => setMode('cta')}
                className={`rounded-3xl border p-4 text-left transition sm:col-span-2 ${
                  mode === 'cta'
                    ? 'border-indigo-200 bg-indigo-50'
                    : 'border-slate-100 bg-white/60 hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <PlatformBadge p={platform} />
                    <p className="text-xs font-semibold text-slate-900">
                      CTA & Caption generieren
                    </p>
                  </div>
                  <span className="rounded-full bg-slate-900/5 px-2 py-0.5 text-[10px] text-slate-600">
                    Kommentar / DM
                  </span>
                </div>
                <p className="mt-2 text-[11px] text-slate-600">
                  CTA-Pattern, Caption-First-Line, Hashtag-Approach – passend zur Plattform.
                </p>
              </button>
            </div>
          </Card>

          <Card
            title="Konfiguration"
            description="Diese Inputs steuern die Generierung (Demo)."
          >
            <div className="space-y-3 text-xs">
              <div className="grid gap-3 md:grid-cols-2">
                <div className="space-y-1.5">
                  <label className="text-[11px] font-medium text-slate-700">
                    Primäres Ziel
                  </label>
                  <select
                    className="w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-700"
                    value={goal}
                    onChange={(e) => setGoal(e.target.value)}
                  >
                    <option>Lead-Generierung</option>
                    <option>Awareness</option>
                    <option>Education</option>
                    <option>Personal Brand</option>
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-[11px] font-medium text-slate-700">
                    Hook-Pattern
                  </label>
                  <select
                    className="w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-700"
                    value={hookPattern}
                    onChange={(e) => setHookPattern(e.target.value)}
                  >
                    <option>Contrarian Hook</option>
                    <option>Question Hook</option>
                    <option>Story Hook</option>
                    <option>Consequence Hook</option>
                  </select>
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-[11px] font-medium text-slate-700">
                  Referenz-Content
                </label>
                <select
                  className="w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-700"
                  value={referenceId}
                  onChange={(e) => setReferenceId(e.target.value)}
                >
                  {contentLibraryMock.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.platform} • {item.creatorName} – {item.title}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="secondary" size="sm">
                  Varianten
                </Button>
                <Button size="sm">
                  {mode === 'hooks'
                    ? 'Hooks generieren'
                    : mode === 'cta'
                      ? 'CTA generieren'
                      : 'Skript generieren'}
                </Button>
              </div>
              {selectedTopics.length > 0 && (
                <div className="flex flex-wrap gap-1.5 text-[10px] text-slate-600">
                  <span className="rounded-full bg-slate-900/5 px-2 py-0.5">
                    Topics:
                  </span>
                  {selectedTopics.slice(0, 6).map((t) => (
                    <span
                      key={t}
                      className="rounded-full bg-indigo-50 px-2 py-0.5 text-indigo-700"
                    >
                      {t}
                    </span>
                  ))}
                  {selectedTopics.length > 6 && (
                    <span className="rounded-full bg-slate-900/5 px-2 py-0.5">
                      +{selectedTopics.length - 6}
                    </span>
                  )}
                </div>
              )}
              <div className="rounded-2xl border border-dashed border-slate-200 p-3 text-[11px] text-slate-500">
                Demo: Der Output ist statisch – später wird hier dein Model + Supabase-History genutzt.
              </div>
            </div>
          </Card>
        </div>

        <div className="space-y-4">
          <Card
            title="Strategy Layer"
            description="Automatisch aus Referenz-Content und Brand Voice abgeleitet (Demo)."
          >
            <div className="space-y-2 text-[11px] text-slate-700">
              <p>
                <span className="font-medium">Ziel:</span> {goal}
              </p>
              <p>
                <span className="font-medium">Hook-Pattern:</span> {hookPattern}
              </p>
              <p className="text-slate-500">
                <span className="font-medium text-slate-700">Referenz:</span>{' '}
                {reference?.creatorName} (@{reference?.creatorHandle}) – {reference?.title}
              </p>
              <div className="mt-3 rounded-3xl bg-slate-50 p-3">
                <p className="text-[10px] font-medium uppercase tracking-[0.18em] text-slate-400">
                  Why this should work
                </p>
                <p className="mt-1 text-[11px] text-slate-600">
                  {exampleStrategy.strategy_summary.why_this_should_work}
                </p>
              </div>
            </div>
          </Card>

          <Card
            title={mode === 'hooks' ? 'Hook Output' : mode === 'cta' ? 'CTA Output' : 'Script Output'}
            description="Preview des Generators (Demo)."
          >
            {mode === 'hooks' && (
              <div className="grid gap-2 text-[11px]">
                {[
                  'Mehr Calls sind nicht die Lösung.',
                  'Dein Problem ist nicht Sales – es ist dein System.',
                  'Wenn du das glaubst, blockierst du deinen Umsatz.',
                  'Du trainierst zu wenig, weil du zu beschäftigt bist.',
                  'Die Wahrheit? Mehr Quantität macht dich nicht besser.',
                ].map((h) => (
                  <div key={h} className="rounded-3xl bg-slate-50 p-3">
                    <p className="font-medium text-slate-900">{h}</p>
                    <p className="mt-1 text-[10px] text-slate-500">
                      Pattern: {hookPattern} • Platform: {platform}
                      {selectedTopics.length > 0 ? ` • Topics: ${selectedTopics.slice(0, 2).join(', ')}` : ''}
                    </p>
                  </div>
                ))}
              </div>
            )}

            {mode === 'cta' && (
              <div className="space-y-3 text-[11px]">
                <div className="rounded-3xl bg-slate-50 p-3">
                  <p className="text-[10px] font-medium uppercase tracking-[0.18em] text-slate-400">
                    Caption First Line
                  </p>
                  <p className="mt-1 font-medium text-slate-900">
                    Mehr Calls machen wird deine Close Rate nicht retten. 👇
                  </p>
                </div>
                <div className="rounded-3xl bg-slate-900 p-3 text-white">
                  <p className="text-[10px] font-medium uppercase tracking-[0.18em] text-indigo-200">
                    CTA
                  </p>
                  <p className="mt-1">
                    Schreib „30k“ in die Kommentare – ich schicke dir die genaue Struktur.
                  </p>
                </div>
                <div className="rounded-3xl bg-slate-50 p-3">
                  <p className="text-[10px] font-medium uppercase tracking-[0.18em] text-slate-400">
                    Hashtags
                  </p>
                  <p className="mt-1 text-slate-700">
                    #salestraining #closerate #vertrieb #salesmindset #closing
                  </p>
                </div>
              </div>
            )}

            {mode === 'script' && (
              <div className="grid gap-3 text-[11px] md:grid-cols-2">
                <div className="space-y-2">
                  <div className="rounded-3xl bg-slate-900 p-3 text-white">
                    <p className="text-[10px] font-medium uppercase tracking-[0.18em] text-indigo-200">
                      Hook
                    </p>
                    <p className="mt-1">
                      Mehr Calls zu machen ist der teuerste Fehler im Sales.
                    </p>
                  </div>
                  <div className="rounded-3xl bg-slate-50 p-3">
                    <p className="text-[10px] font-medium uppercase tracking-[0.18em] text-slate-400">
                      Mechanism
                    </p>
                    <p className="mt-1 text-slate-700">
                      Wenn 100% deiner Zeit auf Calls läuft, bleibt 0% für Training.
                    </p>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="rounded-3xl bg-slate-50 p-3">
                    <p className="text-[10px] font-medium uppercase tracking-[0.18em] text-slate-400">
                      Proof
                    </p>
                    <p className="mt-1 text-slate-700">
                      25% → 40% Close Rate durch Call-Review-System, nicht durch mehr Calls.
                    </p>
                  </div>
                  <div className="rounded-3xl bg-slate-900 p-3 text-white">
                    <p className="text-[10px] font-medium uppercase tracking-[0.18em] text-indigo-200">
                      CTA
                    </p>
                    <p className="mt-1">
                      Kommentiere eine Zahl: Wie viele Stunden trainierst du pro Woche wirklich?
                    </p>
                  </div>
                </div>
              </div>
            )}
          </Card>
        </div>
      </div>

      {isHookWizardOpen && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-slate-900/25 p-4">
          <div className="w-full max-w-4xl overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-[0_24px_80px_rgba(15,23,42,0.18)]">
            <div className="flex items-start justify-between gap-3 border-b border-slate-100 px-6 py-4">
              <div>
                <p className="text-[10px] font-medium uppercase tracking-[0.2em] text-slate-400">
                  Hooks generieren
                </p>
                <p className="mt-1 text-sm font-semibold text-slate-900">
                  Wähle Topics, die gerade performen
                </p>
                <p className="mt-1 text-[11px] text-slate-500">
                  Topics werden aus deinen `content_items` abgeleitet und nach Score sortiert.
                </p>
              </div>
              <button
                type="button"
                onClick={closeHookWizard}
                className="rounded-full bg-slate-900/5 px-3 py-1 text-[11px] text-slate-600 hover:bg-slate-900/10"
              >
                Schließen
              </button>
            </div>

            <div className="grid gap-4 px-6 py-5 md:grid-cols-[1.6fr,1fr]">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="text-[11px] text-slate-500">
                    Schritt {hookWizardStep + 1} von 3
                  </div>
                  <div className="text-[11px] text-slate-500">
                    Ausgewählt: {topicSelection.length}
                  </div>
                </div>

                {hookWizardStep === 0 && (
                  <div className="space-y-3">
                    <div className="rounded-3xl bg-slate-50 p-4">
                      <p className="text-[11px] font-medium text-slate-900">
                        Topics aus deiner Library (Top Performer)
                      </p>
                      <p className="mt-1 text-[11px] text-slate-500">
                        Mehrfachauswahl möglich. Klick auf Chips.
                      </p>

                      <div className="mt-3">
                        {topicQueryLoading && (
                          <p className="text-[11px] text-slate-500">
                            Lade Topics…
                          </p>
                        )}
                        {topicQueryError && (
                          <p className="text-[11px] text-rose-600">
                            {topicQueryError}
                          </p>
                        )}
                        {!topicQueryLoading && topTopics.length === 0 && (
                          <p className="text-[11px] text-slate-500">
                            Noch keine Topics in `content_items`. Du kannst im nächsten Schritt eigene Topics eingeben.
                          </p>
                        )}
                        <div className="mt-3 flex flex-wrap gap-2">
                          {topTopics.map((t) => {
                            const active = topicSelection.includes(t.topic)
                            return (
                              <button
                                key={t.topic}
                                type="button"
                                onClick={() => toggleTopic(t.topic)}
                                className={`rounded-full border px-3 py-1.5 text-[11px] transition ${
                                  active
                                    ? 'border-indigo-200 bg-indigo-50 text-indigo-700'
                                    : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                                }`}
                                title={`Score: ${t.score.toFixed(1)} · Avg ER: ${(t.avgEngagement * 100).toFixed(1)}% · n=${t.count}`}
                              >
                                {t.topic}
                                <span className="ml-2 text-[10px] text-slate-400">
                                  n={t.count}
                                </span>
                              </button>
                            )
                          })}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {hookWizardStep === 1 && (
                  <div className="space-y-3">
                    <div className="rounded-3xl bg-slate-50 p-4">
                      <p className="text-[11px] font-medium text-slate-900">
                        Eigene Topics hinzufügen
                      </p>
                      <p className="mt-1 text-[11px] text-slate-500">
                        Optional. Trenne mehrere Topics mit Zeilenumbrüchen oder Kommas.
                      </p>
                      <textarea
                        rows={5}
                        className="mt-3 w-full resize-none rounded-2xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-800 placeholder:text-slate-400"
                        placeholder="z.B.\nDisziplin\nFitness\nGeld verdienen\nMindset"
                        value={customTopicInput}
                        onChange={(e) => setCustomTopicInput(e.target.value)}
                      />
                    </div>
                  </div>
                )}

                {hookWizardStep === 2 && (
                  <div className="space-y-3">
                    <div className="rounded-3xl bg-slate-50 p-4">
                      <p className="text-[11px] font-medium text-slate-900">
                        Zusammenfassung
                      </p>
                      <p className="mt-1 text-[11px] text-slate-500">
                        Diese Topics werden für die Hook-Generierung genutzt.
                      </p>
                      <div className="mt-3 flex flex-wrap gap-2">
                        {topicSelection.length === 0 ? (
                          <span className="text-[11px] text-slate-500">—</span>
                        ) : (
                          topicSelection.map((t) => (
                            <span
                              key={t}
                              className="rounded-full bg-indigo-50 px-3 py-1.5 text-[11px] font-medium text-indigo-700"
                            >
                              {t}
                            </span>
                          ))
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div className="space-y-3">
                <div className="rounded-3xl bg-white p-4 border border-slate-200">
                  <p className="text-[10px] font-medium uppercase tracking-[0.18em] text-slate-400">
                    Kontext (Demo)
                  </p>
                  <p className="mt-2 text-[11px] text-slate-700">
                    <span className="font-medium">Plattform:</span> {platform}
                  </p>
                  <p className="mt-1 text-[11px] text-slate-700">
                    <span className="font-medium">Hook-Pattern:</span> {hookPattern}
                  </p>
                  <p className="mt-1 text-[11px] text-slate-700">
                    <span className="font-medium">Ziel:</span> {goal}
                  </p>
                </div>

                <div className="flex items-center justify-between pt-2">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setHookWizardStep((s) => Math.max(0, s - 1))}
                    disabled={hookWizardStep === 0}
                  >
                    Zurück
                  </Button>
                  {hookWizardStep < 2 ? (
                    <Button
                      type="button"
                      size="sm"
                      onClick={() => {
                        if (hookWizardStep === 1) {
                          // Custom topics in die Auswahl mergen (einmalig beim Weiter)
                          const custom = customTopicInput
                            .split(/\\n|,/g)
                            .map((x) => x.trim())
                            .filter(Boolean)
                          setTopicSelection((prev) => {
                            const s = new Set(prev)
                            for (const c of custom) s.add(c)
                            return Array.from(s)
                          })
                        }
                        setHookWizardStep((s) => Math.min(2, s + 1))
                      }}
                    >
                      Weiter
                    </Button>
                  ) : (
                    <Button
                      type="button"
                      size="sm"
                      onClick={() => {
                        setSelectedTopics(topicSelection)
                        setIsHookWizardOpen(false)
                      }}
                    >
                      Auswahl übernehmen
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

