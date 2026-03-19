import { useEffect, useState } from 'react'
import { Card } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { supabase } from '../lib/supabaseClient'
import { useAuth } from '../auth/AuthContext'

type BrandVoiceQuestion = {
  id: string
  label: string
}

type BrandVoiceRecord = {
  id: string
  name: string
  questions: BrandVoiceQuestion[]
  answers: Record<string, string>
  ai_brand_voice: string | null
  created_at: string
}

const QUESTIONS: BrandVoiceQuestion[] = [
  { id: 'vision', label: 'Was ist deine langfristige Vision/Legacy?' },
  {
    id: 'mission',
    label: 'Wie lautet in einem Satz die Mission deiner Brand?',
  },
  {
    id: 'target_core',
    label: 'Wer ist deine primäre Zielgruppe – so konkret wie möglich?',
  },
  {
    id: 'target_problem',
    label: 'Was ist das größte Problem/Defizit deiner Zielgruppe heute?',
  },
  {
    id: 'identity',
    label:
      'Welche Identität soll dein Follower durch deine Brand annehmen (Idealbild)?',
  },
  {
    id: 'not_voice',
    label: 'Wie willst du NICHT wirken? Welche Typen willst du vermeiden?',
  },
  {
    id: 'values',
    label: 'Welche 3–5 Werte sind für deine Brand nicht verhandelbar?',
  },
  {
    id: 'beliefs',
    label:
      'Welche Glaubenssätze willst du in deiner Zielgruppe zerstören/neu schreiben?',
  },
  {
    id: 'enemy',
    label:
      'Wer oder was ist dein „Feindbild“ (z.B. Durchschnittsmann 2026, Fake-Coaches)?',
  },
  {
    id: 'tone',
    label:
      'Wie soll deine Tonalität wahrgenommen werden? (3–5 Adjektive: z.B. ruhig, maskulin, direkt …)',
  },
  {
    id: 'lead_vs_open',
    label:
      'Wie viel Prozent Führung vs. Offenheit soll deine Brand haben? (z.B. 70% Führung, 30% Offenheit – beschreibe es)',
  },
  {
    id: 'doc_vs_motivation',
    label:
      'Was ist der Unterschied zwischen „Motivation“ und „Dokumentation“ in deinem Content?',
  },
  {
    id: 'content_principles',
    label:
      'Welche Content-Prinzipien sind fix? (Formate, Zahlen, „No Bullshit“-Regeln, etc.)',
  },
  {
    id: 'series',
    label:
      'Welche wiederkehrenden Content-Serien oder Rubriken willst du etablieren?',
  },
  {
    id: 'areas',
    label:
      'Welche Lebensbereiche deckt deine Brand konkret ab? (Körper, Finanzen, Mindset, Stil, Beziehungen …)',
  },
  {
    id: 'emotions',
    label:
      'Wie gehst du mit Emotionen im Content um? Was zeigst du, was nicht – und wie rahmst du es?',
  },
  {
    id: 'standards',
    label:
      'Welche Zahlen/Standards sollen immer wieder auftauchen (Routinen, Trainings, Umsatz, etc.)?',
  },
  {
    id: 'change_30_days',
    label:
      'Was soll jemand nach 30 Tagen Content-Konsum konkret verändert haben?',
  },
  {
    id: 'repel',
    label:
      'Wen willst du bewusst abschrecken? Wer soll sich NICHT wohlfühlen mit deiner Brand?',
  },
  {
    id: 'phase1',
    label:
      'Wie sieht Phase 1 deiner eigenen Reise aus – und was dokumentierst du davon?',
  },
]

export function BrandVoicePage() {
  const { user } = useAuth()
  const [voices, setVoices] = useState<BrandVoiceRecord[]>([])
  const [selected, setSelected] = useState<BrandVoiceRecord | null>(null)
  const [error, setError] = useState<string | null>(null)

  const brandVoiceWebhookUrl = import.meta.env
    .VITE_N8N_BRAND_VOICE_WEBHOOK_URL as string | undefined

  // Modal / Wizard State
  const [isWizardOpen, setIsWizardOpen] = useState(false)
  const [wizardStep, setWizardStep] = useState(0)
  const [wizardName, setWizardName] = useState('')
  const [wizardAnswers, setWizardAnswers] = useState<Record<string, string>>({})
  const [saving, setSaving] = useState(false)
  const hasVoices = voices.length > 0

  useEffect(() => {
    async function loadVoices() {
      if (!supabase || !user) return
      const { data, error: err } = await supabase
        .from('brand_voices')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
      if (err) {
        return
      }
      setVoices((data ?? []) as BrandVoiceRecord[])
      if (data && data.length > 0) {
        setSelected(data[0] as BrandVoiceRecord)
      }
    }
    loadVoices()
  }, [user])

  function openWizard() {
    setWizardName('')
    setWizardAnswers({})
    setWizardStep(0)
    setError(null)
    setIsWizardOpen(true)
  }

  function closeWizard() {
    if (saving) return
    setIsWizardOpen(false)
  }

  async function handleSaveWizard() {
    if (!supabase || !user) {
      setError('Supabase oder User-Session nicht verfügbar.')
      return
    }
    if (!wizardName.trim()) {
      setError('Gib deiner Brand Voice einen Namen.')
      return
    }
    const hasAnyAnswer = Object.values(wizardAnswers).some(
      (value) => value && value.trim().length > 0,
    )
    if (!hasAnyAnswer) {
      setError('Beantworte mindestens eine Frage, bevor du speicherst.')
      return
    }
    setError(null)
    setSaving(true)
    const { data, error: err } = await supabase
      .from('brand_voices')
      .insert({
        user_id: user.id,
        name: wizardName,
        questions: QUESTIONS,
        answers: wizardAnswers,
        ai_brand_voice: null,
      })
      .select('*')
      .single()

    setSaving(false)
    if (err || !data) {
      setError(err?.message ?? 'Brand Voice konnte nicht gespeichert werden.')
      return
    }
    const record = data as BrandVoiceRecord
    setVoices((prev) => [record, ...prev])
    setSelected(record)

    // An n8n-Webhook senden (z.B. für AI-Brand-Brief-Generierung)
    try {
      if (brandVoiceWebhookUrl) {
        void fetch(brandVoiceWebhookUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            brandVoiceId: record.id,
            userId: user.id,
            name: record.name,
            questions: record.questions,
            answers: record.answers,
            source: 'content-saas-ui',
          }),
        })
      }
    } catch {
      // Fehler des Webhooks ignorieren, UI bleibt trotzdem erfolgreich
    }

    setIsWizardOpen(false)
  }

  return (
    <>
      {!hasVoices ? (
        <div className="mx-auto max-w-6xl">
          <Card className="relative overflow-hidden border-indigo-100 bg-gradient-to-br from-white via-indigo-50/50 to-sky-50/60 p-8">
            <div className="pointer-events-none absolute -left-12 -top-16 h-48 w-48 rounded-full bg-indigo-300/30 blur-3xl" />
            <div className="pointer-events-none absolute -right-12 bottom-0 h-52 w-52 rounded-full bg-violet-300/25 blur-3xl" />
            <div className="relative flex flex-col items-start gap-5 md:flex-row md:items-center md:justify-between">
              <div className="space-y-3">
                <p className="inline-flex items-center rounded-full border border-indigo-200 bg-indigo-100/70 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-indigo-700 animate-pulse">
                  Erster Schritt
                </p>
                <h1 className="text-2xl font-semibold tracking-tight text-slate-900 md:text-3xl">
                  Erstelle jetzt deine erste Brand Voice
                </h1>
                <p className="max-w-2xl text-sm text-slate-600">
                  Lege zuerst die Brand Voice an. Sie ist die Grundlage fuer Hooks,
                  Skripte und deine gesamte Content-Strategie im Workspace.
                </p>
              </div>
              <div className="w-full max-w-xs space-y-2">
                <Button
                  type="button"
                  size="lg"
                  fullWidth
                  onClick={openWizard}
                  className="bg-indigo-600 text-white hover:bg-indigo-700"
                >
                  + Erste Brand Voice erstellen
                </Button>
                <p className="text-xs text-slate-500">
                  Dauert nur wenige Minuten und fuehrt dich Schritt fuer Schritt durch
                  die wichtigsten Fragen.
                </p>
              </div>
            </div>
          </Card>
        </div>
      ) : (
      <div className="mx-auto grid max-w-6xl gap-4 md:grid-cols-[minmax(0,1.4fr),minmax(0,1fr)]">
        <Card
          title="Brand Voices"
          description="Verwalte verschiedene Brand-Profile, die später für Hooks, Skripte und Strategien genutzt werden."
        >
          <div className="flex items-center justify-between text-xs">
            <div>
              <p className="text-[11px] text-slate-500">
                {voices.length > 0
                  ? `${voices.length} Brand Voice${
                      voices.length > 1 ? 's' : ''
                    } gespeichert`
                  : 'Noch keine Brand Voices gespeichert'}
              </p>
            </div>
            <Button
              type="button"
              size="sm"
              variant="secondary"
              onClick={openWizard}
            >
              Brand Voice hinzufügen
            </Button>
          </div>
          <div className="mt-4 flex gap-2 overflow-x-auto pb-1 text-xs">
            {voices.map((voice) => (
              <button
                key={voice.id}
                type="button"
                onClick={() => setSelected(voice)}
                className={`min-w-[180px] rounded-2xl border px-3 py-2 text-left ${
                  selected?.id === voice.id
                    ? 'border-indigo-200 bg-indigo-50 text-slate-900'
                    : 'border-slate-100 bg-slate-50 text-slate-600'
                }`}
              >
                <p className="text-[11px] font-semibold">{voice.name}</p>
                <p className="mt-0.5 text-[10px] text-slate-400">
                  {new Date(voice.created_at).toLocaleDateString('de-DE')}
                </p>
              </button>
            ))}
          </div>
        </Card>

        <Card
          title="Brand Voice Detail"
          description="AI-Zusammenfassung und beantwortete Fragen für das aktuell ausgewählte Profil."
        >
          <div className="space-y-3 text-xs">
            {!selected && (
              <p className="text-[11px] text-slate-400">
                Wähle links eine Brand Voice oder lege eine neue an.
              </p>
            )}
            {selected?.ai_brand_voice && (
              <div className="space-y-1 rounded-2xl bg-slate-900 p-3 text-slate-100">
                <p className="text-[10px] uppercase tracking-[0.18em] text-indigo-300">
                  AI Brand Voice
                </p>
                <p className="text-[11px] text-slate-100">
                  {selected.ai_brand_voice}
                </p>
              </div>
            )}
            {selected && (
              <div className="space-y-1 rounded-2xl border border-dashed border-slate-200 p-3">
                <p className="text-[10px] uppercase tracking-[0.18em] text-slate-400">
                  Fragen & Antworten (Snapshot)
                </p>
                <div className="max-h-64 space-y-2 overflow-y-auto pr-1">
                  {selected.questions.map((q) => (
                    <div key={q.id}>
                      <p className="text-[11px] font-medium text-slate-700">
                        {q.label}
                      </p>
                      <p className="mt-0.5 text-[11px] text-slate-500">
                        {(selected.answers as Record<string, string>)[q.id] ??
                          '—'}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </Card>
      </div>
      )}

      {isWizardOpen && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-slate-950/40 px-4">
          <div className="relative w-full max-w-3xl overflow-hidden rounded-3xl border border-indigo-100 bg-gradient-to-br from-white via-indigo-50/30 to-sky-50/50 p-5 shadow-soft backdrop-blur">
            <div className="pointer-events-none absolute -left-10 -top-16 h-40 w-40 rounded-full bg-indigo-100/70 blur-3xl" />
            <div className="pointer-events-none absolute -right-10 bottom-0 h-40 w-40 rounded-full bg-sky-100/70 blur-3xl" />
            <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-brand-300/50 to-transparent" />
            <div className="relative space-y-4 text-xs">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-[10px] uppercase tracking-[0.18em] text-slate-400">
                    Neue Brand Voice
                  </p>
                  <h2 className="text-sm font-semibold tracking-tight text-slate-900">
                    Fragenkatalog ausfüllen
                  </h2>
                </div>
                <button
                  type="button"
                  onClick={closeWizard}
                  className="rounded-full border border-indigo-200 bg-indigo-50/70 px-2 py-1 text-[11px] font-medium text-indigo-700 shadow-sm hover:bg-indigo-100"
                >
                  Schließen
                </button>
              </div>

              <div className="flex items-center justify-between text-[10px] text-slate-500">
                <div className="flex items-center gap-2">
                  <span className="inline-flex items-center rounded-full border border-indigo-200 bg-indigo-100/70 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-indigo-700 shadow-sm animate-pulse">
                    Schritt {wizardStep + 1} von {QUESTIONS.length + 1}
                  </span>
                  <span>
                    {wizardStep === 0
                      ? 'Name der Brand Voice'
                      : QUESTIONS[wizardStep - 1].label}
                  </span>
                </div>
              </div>

              {error && (
                <p className="rounded-2xl bg-rose-50 px-3 py-2 text-[11px] text-rose-600">
                  {error}
                </p>
              )}

              <div className="rounded-2xl border border-indigo-100 bg-white/70 p-4 shadow-sm">
                {wizardStep === 0 ? (
                  <div className="space-y-2">
                    <p className="text-[11px] font-medium text-slate-700">
                      Wie soll diese Brand Voice heißen?
                    </p>
                    <textarea
                      rows={2}
                      className="w-full resize-none rounded-2xl border border-indigo-200 bg-white px-3 py-2 text-xs text-slate-800 placeholder:text-slate-400 shadow-sm focus:border-brand-300 focus:ring-2 focus:ring-brand-100"
                      placeholder='z.B. "THE MAN – 100% Life"'
                      value={wizardName}
                      onChange={(e) => setWizardName(e.target.value)}
                    />
                  </div>
                ) : (
                  <div className="space-y-2">
                    <p className="text-[11px] font-medium text-slate-700">
                      {QUESTIONS[wizardStep - 1].label}
                    </p>
                    <textarea
                      rows={4}
                      className="w-full resize-none rounded-2xl border border-indigo-200 bg-white px-3 py-2 text-xs text-slate-800 placeholder:text-slate-400 shadow-sm focus:border-brand-300 focus:ring-2 focus:ring-brand-100"
                      placeholder="Deine Antwort…"
                      value={wizardAnswers[QUESTIONS[wizardStep - 1].id] ?? ''}
                      onChange={(e) =>
                        setWizardAnswers((prev) => ({
                          ...prev,
                          [QUESTIONS[wizardStep - 1].id]: e.target.value,
                        }))
                      }
                    />
                  </div>
                )}
              </div>

              <div className="flex items-center justify-between">
                <div className="text-[10px] text-slate-400">
                  Du kannst Antworten später jederzeit in einer neuen Version
                  aktualisieren.
                </div>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() =>
                      setWizardStep((prev) => (prev > 0 ? prev - 1 : prev))
                    }
                    disabled={wizardStep === 0 || saving}
                  >
                    Zurück
                  </Button>
                  {wizardStep < QUESTIONS.length ? (
                    <Button
                      type="button"
                      size="sm"
                      variant="secondary"
                      onClick={() =>
                        setWizardStep((prev) =>
                          prev < QUESTIONS.length ? prev + 1 : prev,
                        )
                      }
                      disabled={saving}
                    >
                      Weiter
                    </Button>
                  ) : (
                    <Button
                      type="button"
                      size="sm"
                      onClick={() => {
                        void handleSaveWizard()
                      }}
                      disabled={saving}
                    >
                      {saving ? 'Wird gespeichert…' : 'Brand Voice speichern'}
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

