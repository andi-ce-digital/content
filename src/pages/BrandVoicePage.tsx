import { useEffect, useState } from 'react'
import { Card } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'
import { Textarea } from '../components/ui/Textarea'
import { supabase } from '../lib/supabaseClient'
import { useAuth } from '../auth/AuthContext'
import {
  BookOpen,
  FileText,
  Layers,
  Mic2,
  Quote,
  Sparkles,
  Target,
  Upload,
  Waves,
  X,
  Zap,
} from 'lucide-react'
import { cn } from '../lib/utils'

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

type BrandVoiceDocument = {
  id: string
  user_id: string
  brand_voice_id: string
  title: string | null
  description: string | null
  original_filename: string
  mime_type: string | null
  file_size_bytes: number | null
  storage_path: string
  created_at: string
}

function formatBytes(bytes: number | null | undefined) {
  if (!bytes || !Number.isFinite(bytes)) return '—'
  const b = Number(bytes)
  if (b >= 1_000_000) return `${Math.round((b / 1_000_000) * 10) / 10} MB`
  if (b >= 1_000) return `${Math.round((b / 1_000) * 10) / 10} kB`
  return `${Math.round(b)} B`
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

const KNOWLEDGE_ACCEPT =
  '.txt,.pdf,.md,.docx'

const KNOWLEDGE_MIME_WHITELIST = new Set<string>([
  'text/plain',
  'application/pdf',
  'text/markdown',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
])

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

  // Knowledge Documents (RAG input)
  const [documentsLoading, setDocumentsLoading] = useState(false)
  const [documentsError, setDocumentsError] = useState<string | null>(null)
  const [documents, setDocuments] = useState<BrandVoiceDocument[]>([])
  const [uploadingDocs, setUploadingDocs] = useState(false)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const [pendingFiles, setPendingFiles] = useState<File[]>([])
  const [knowledgeUploadOpen, setKnowledgeUploadOpen] = useState(false)
  const [knowledgeUploadStep, setKnowledgeUploadStep] = useState<0 | 1>(0)
  const [pendingFileMeta, setPendingFileMeta] = useState<
    Array<{ title: string; description: string }>
  >([])

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

  useEffect(() => {
    async function loadDocuments() {
      if (!supabase || !user || !selected) return
      setDocumentsLoading(true)
      setDocumentsError(null)
      try {
        const { data, error: err } = await supabase
          .from('brand_voice_documents')
          .select(
            'id, user_id, brand_voice_id, title, description, original_filename, mime_type, file_size_bytes, storage_path, created_at',
          )
          .eq('user_id', user.id)
          .eq('brand_voice_id', selected.id)
          .order('created_at', { ascending: false })

        if (err) throw err
        setDocuments((data ?? []) as BrandVoiceDocument[])
      } catch (e) {
        setDocumentsError((e as Error).message ?? 'Fehler beim Laden der Dokumente.')
        setDocuments([])
      } finally {
        setDocumentsLoading(false)
      }
    }

    void loadDocuments()
  }, [user, selected?.id])

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

  async function handleUploadPendingFiles() {
    if (!supabase || !user || !selected) return
    if (pendingFiles.length === 0) return
    setUploadingDocs(true)
    setUploadError(null)

    try {
      const bucket = 'brand_voice_docs'
      const results: BrandVoiceDocument[] = []

      for (const [idx, file] of pendingFiles.entries()) {
        const mime = file.type || null

        const ext = file.name.toLowerCase().split('.').pop() || ''
        const fallbackMime =
          ext === 'txt'
            ? 'text/plain'
            : ext === 'md'
              ? 'text/markdown'
              : ext === 'pdf'
                ? 'application/pdf'
                : ext === 'docx'
                  ? 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
                  : null

        const resolvedMime = mime || fallbackMime
        if (!resolvedMime || !KNOWLEDGE_MIME_WHITELIST.has(resolvedMime)) {
          throw new Error(`Dateityp nicht erlaubt: ${file.name}`)
        }

        const storagePath = `${user.id}/${selected.id}/${Date.now()}_${file.name}`

        // 1) Datei hochladen
        const { error: uploadErr } = await supabase.storage
          .from(bucket)
          .upload(storagePath, file, {
            contentType: resolvedMime,
            upsert: false,
          })

        if (uploadErr) throw uploadErr

        // 2) Metadaten speichern
        const { data: docRow, error: insertErr } = await supabase
          .from('brand_voice_documents')
          .insert({
            user_id: user.id,
            brand_voice_id: selected.id,
            original_filename: file.name,
            title: pendingFileMeta[idx]?.title ?? file.name,
            description: pendingFileMeta[idx]?.description ?? null,
            mime_type: resolvedMime,
            file_size_bytes: file.size,
            storage_bucket_id: bucket,
            storage_path: storagePath,
          })
          .select(
            'id, user_id, brand_voice_id, title, description, original_filename, mime_type, file_size_bytes, storage_path, created_at',
          )
          .single()

        if (insertErr || !docRow) throw insertErr ?? new Error('Insert fehlgeschlagen.')
        results.push(docRow as BrandVoiceDocument)
      }

      setPendingFiles([])
      setPendingFileMeta([])
      setDocuments((prev) => [...results, ...prev])
      setKnowledgeUploadOpen(false)
      setKnowledgeUploadStep(0)
    } catch (e) {
      setUploadError((e as Error).message ?? 'Fehler beim Upload.')
    } finally {
      setUploadingDocs(false)
    }
  }

  async function handleDeleteDoc(doc: BrandVoiceDocument) {
    if (!supabase || !user) return
    setUploadingDocs(true)
    setUploadError(null)
    try {
      const bucket = 'brand_voice_docs'
      const { error: rmErr } = await supabase.storage
        .from(bucket)
        .remove([doc.storage_path])
      if (rmErr) throw rmErr

      const { error: delErr } = await supabase
        .from('brand_voice_documents')
        .delete()
        .eq('id', doc.id)
        .eq('user_id', user.id)
      if (delErr) throw delErr

      setDocuments((prev) => prev.filter((d) => d.id !== doc.id))
    } catch (e) {
      setUploadError((e as Error).message ?? 'Fehler beim Löschen.')
    } finally {
      setUploadingDocs(false)
    }
  }

  return (
    <>
      <div className="relative mx-auto max-w-6xl space-y-8 pb-4">
        <section className="relative overflow-hidden rounded-[1.75rem] border border-indigo-100/90 bg-gradient-to-br from-white via-indigo-50/40 to-violet-50/30 p-6 shadow-[0_24px_80px_-32px_rgba(79,70,229,0.35)] md:p-10">
          <div className="pointer-events-none absolute -left-24 -top-28 h-72 w-72 rounded-full bg-indigo-400/25 blur-3xl" />
          <div className="pointer-events-none absolute -right-20 top-1/3 h-80 w-80 rounded-full bg-fuchsia-400/15 blur-3xl" />
          <div className="pointer-events-none absolute bottom-0 left-1/2 h-40 w-[min(100%,28rem)] -translate-x-1/2 rounded-full bg-sky-300/20 blur-2xl" />
          <div className="relative flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-2xl space-y-4">
              <div className="inline-flex items-center gap-2 rounded-full border border-indigo-200/80 bg-white/70 px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.2em] text-indigo-700 shadow-sm backdrop-blur">
                <Sparkles className="h-3.5 w-3.5 text-indigo-600" />
                Brand Voice
              </div>
              <h1 className="text-3xl font-bold tracking-tight text-slate-900 md:text-4xl">
                Deine Stimme.{' '}
                <span className="bg-gradient-to-r from-indigo-600 via-violet-600 to-fuchsia-600 bg-clip-text text-transparent">
                  Immer konsistent.
                </span>
              </h1>
              <p className="text-sm leading-relaxed text-slate-600 md:text-base">
                Definiere Tonalität, Werte und Zielgruppe – damit Hooks, Skripte und KI-Outputs
                wie aus einem Guss wirken.
              </p>
              {hasVoices ? (
                <p className="text-xs text-slate-500">
                  <span className="font-semibold text-indigo-600">{voices.length}</span> Profil
                  {voices.length === 1 ? '' : 'e'} aktiv · Wähle links die passende Brand Voice.
                </p>
              ) : null}
            </div>
            <div className="flex min-w-[220px] flex-col gap-3 sm:flex-row lg:flex-col">
              <Button
                type="button"
                size="lg"
                onClick={openWizard}
                className="bg-gradient-to-r from-indigo-600 to-violet-600 px-6 text-white shadow-lg shadow-indigo-500/25 hover:from-indigo-500 hover:to-violet-500"
              >
                <Zap className="mr-2 h-4 w-4" />
                {hasVoices ? 'Neue Brand Voice' : 'Brand Voice erstellen'}
              </Button>
              <p className="text-center text-[11px] text-slate-500 lg:text-left">
                {hasVoices
                  ? 'Kurzer Wizard · Fragen ausfüllen · speichern'
                  : 'Guided Wizard · ca. 15–20 Fragen · speicherbar jederzeit'}
              </p>
            </div>
          </div>
          <div className="relative mt-8 flex flex-wrap gap-2 border-t border-indigo-100/60 pt-6">
            {[
              { icon: Mic2, label: 'Tonalität & Werte' },
              { icon: Target, label: 'Zielgruppe & Feindbild' },
              { icon: BookOpen, label: 'Hooks & Generator' },
            ].map(({ icon: Icon, label }) => (
              <span
                key={label}
                className="inline-flex items-center gap-2 rounded-full border border-indigo-100 bg-white/80 px-3 py-1.5 text-[11px] font-medium text-slate-700 shadow-sm"
              >
                <Icon className="h-3.5 w-3.5 text-indigo-500" />
                {label}
              </span>
            ))}
          </div>
        </section>

        {!hasVoices ? (
          <>
            <div className="grid gap-4 md:grid-cols-3">
              {[
                {
                  icon: Quote,
                  title: 'Ein roter Faden',
                  desc: 'Vision, Mission und Werte – damit dein Content nicht nach Zufall klingt.',
                },
                {
                  icon: Layers,
                  title: 'Stack-ready',
                  desc: 'Ein Profil für Generator, Hooks und KI-Workflows – einmal anlegen, überall nutzen.',
                },
                {
                  icon: Waves,
                  title: 'KI & RAG',
                  desc: 'Optional Dokumente hochladen – Antworten mit echtem Brand-Fit.',
                },
              ].map((f) => {
                const Icon = f.icon
                return (
                  <div
                    key={f.title}
                    className="group relative overflow-hidden rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm transition hover:border-indigo-200 hover:shadow-md"
                  >
                    <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 via-violet-500 to-fuchsia-500 text-white shadow-md">
                      <Icon className="h-5 w-5" />
                    </div>
                    <h3 className="text-sm font-semibold text-slate-900">{f.title}</h3>
                    <p className="mt-2 text-[11px] leading-relaxed text-slate-600">{f.desc}</p>
                  </div>
                )
              })}
            </div>

            <div className="relative overflow-hidden rounded-3xl border border-indigo-200/80 bg-gradient-to-br from-indigo-600 via-violet-600 to-fuchsia-600 p-[1px] shadow-xl">
              <div className="rounded-[calc(1.5rem-1px)] bg-gradient-to-br from-slate-950 to-slate-900 px-6 py-8 text-center md:px-10">
                <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-indigo-300">
                  Los geht&apos;s
                </p>
                <p className="mt-2 text-lg font-semibold text-white md:text-xl">
                  Erstelle deine erste Brand Voice in wenigen Minuten
                </p>
                <p className="mx-auto mt-2 max-w-md text-sm text-slate-400">
                  Wir führen dich Schritt für Schritt durch Vision, Zielgruppe, Tonalität und
                  Content-Prinzipien.
                </p>
                <Button
                  type="button"
                  size="lg"
                  onClick={openWizard}
                  className="mt-6 bg-white text-indigo-700 hover:bg-indigo-50"
                >
                  <Sparkles className="mr-2 h-4 w-4" />
                  Wizard starten
                </Button>
              </div>
            </div>
          </>
        ) : (
          <div className="grid gap-6 lg:grid-cols-[minmax(0,1.35fr),minmax(0,1fr)]">
        <Card
          className="border-indigo-100/80 bg-gradient-to-b from-white to-indigo-50/25 shadow-[0_16px_40px_-24px_rgba(79,70,229,0.35)]"
          title="Brand Voices"
          description="Profile für Hooks, Skripte und Strategien – wähle aktiv oder lege neu an."
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
          <div className="mt-4 flex gap-3 overflow-x-auto pb-1 text-xs [scrollbar-width:thin]">
            {voices.map((voice) => {
              const active = selected?.id === voice.id
              const initial = voice.name.trim().slice(0, 1).toUpperCase() || '?'
              return (
                <button
                  key={voice.id}
                  type="button"
                  onClick={() => setSelected(voice)}
                  className={cn(
                    'group relative min-w-[200px] rounded-2xl border px-3 py-3 text-left transition',
                    active
                      ? 'border-indigo-300 bg-gradient-to-br from-indigo-50 to-violet-50 shadow-md ring-2 ring-indigo-200/60'
                      : 'border-slate-100 bg-white hover:border-indigo-100 hover:bg-slate-50',
                  )}
                >
                  <div className="flex items-start gap-2.5">
                    <span
                      className={cn(
                        'flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-[11px] font-bold text-white shadow-sm',
                        active
                          ? 'bg-gradient-to-br from-indigo-500 to-violet-600'
                          : 'bg-slate-200 text-slate-600 group-hover:bg-indigo-100 group-hover:text-indigo-700',
                      )}
                    >
                      {initial}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[11px] font-semibold text-slate-900">{voice.name}</p>
                      <p className="mt-0.5 text-[10px] text-slate-400">
                        {new Date(voice.created_at).toLocaleDateString('de-DE')}
                      </p>
                    </div>
                  </div>
                </button>
              )
            })}
          </div>
        </Card>

        <Card
          className="border-slate-200/80 bg-gradient-to-b from-white to-slate-50/40"
          title="Profil-Detail"
          description="KI-Zusammenfassung, Fragenkatalog und optionales Wissen für RAG."
        >
          <div className="space-y-3 text-xs">
            {!selected && (
              <p className="text-[11px] text-slate-400">
                Wähle links eine Brand Voice oder lege eine neue an.
              </p>
            )}
            {selected?.ai_brand_voice && (
              <div className="relative overflow-hidden rounded-2xl border border-indigo-200/50 bg-gradient-to-br from-slate-900 via-slate-900 to-indigo-950 p-4 text-slate-100 shadow-lg">
                <div className="pointer-events-none absolute -right-8 -top-8 h-24 w-24 rounded-full bg-indigo-500/30 blur-2xl" />
                <div className="relative flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-amber-300" />
                  <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-indigo-200">
                    AI Brand Voice
                  </p>
                </div>
                <p className="relative mt-2 text-[11px] leading-relaxed text-slate-100/95">
                  {selected.ai_brand_voice}
                </p>
              </div>
            )}
            {selected && (
              <div className="space-y-2 rounded-2xl border border-slate-200/80 bg-white/80 p-3 shadow-inner">
                <div className="flex items-center gap-2 border-b border-slate-100 pb-2">
                  <FileText className="h-4 w-4 text-indigo-500" />
                  <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                    Fragen &amp; Antworten
                  </p>
                </div>
                <div className="max-h-72 space-y-3 overflow-y-auto pr-1 [scrollbar-width:thin]">
                  {selected.questions.map((q, idx) => (
                    <div
                      key={q.id}
                      className={cn(
                        'rounded-xl border px-3 py-2.5',
                        idx % 2 === 0
                          ? 'border-slate-100 bg-slate-50/80'
                          : 'border-transparent bg-white',
                      )}
                    >
                      <p className="text-[10px] font-medium uppercase tracking-wide text-indigo-600/90">
                        {q.label}
                      </p>
                      <p className="mt-1.5 text-[11px] leading-relaxed text-slate-600">
                        {(selected.answers as Record<string, string>)[q.id] ?? (
                          <span className="text-slate-400">—</span>
                        )}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {selected && (
              <div className="space-y-3 rounded-2xl border border-dashed border-indigo-200/70 bg-gradient-to-br from-indigo-50/50 to-white p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex gap-2">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-indigo-100 text-indigo-700">
                      <Layers className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-indigo-700">
                        Wissen (RAG)
                      </p>
                      <p className="mt-1 text-[11px] leading-relaxed text-slate-600">
                        Dokumente als Kontext für diese Brand Voice – Multi-tenant ready.
                      </p>
                    </div>
                  </div>
                  <span className="inline-flex shrink-0 items-center rounded-full border border-indigo-200 bg-white px-2.5 py-1 text-[10px] font-semibold text-indigo-700 shadow-sm">
                    optional
                  </span>
                </div>

                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <p className="text-[10px] text-slate-500">
                    Erlaubt: txt, pdf, md, docx (max. 5MB)
                  </p>
                  <Button
                    type="button"
                    size="sm"
                    variant="secondary"
                    className="shrink-0 border-indigo-200 bg-white hover:bg-indigo-50"
                    onClick={() => {
                      setUploadError(null)
                      setKnowledgeUploadStep(0)
                      setPendingFiles([])
                      setPendingFileMeta([])
                      setKnowledgeUploadOpen(true)
                    }}
                  >
                    <Upload className="mr-1 h-3.5 w-3.5" />
                    Datei hinzufügen
                  </Button>
                </div>

                <div className="mt-1">
                  {documentsLoading ? (
                    <p className="text-[11px] text-slate-500">Dokumente laden…</p>
                  ) : documentsError ? (
                    <p className="text-[11px] text-rose-600">{documentsError}</p>
                  ) : documents.length === 0 ? (
                    <p className="text-[11px] text-slate-500">
                      Noch keine Dokumente für diese Brand Voice.
                    </p>
                  ) : (
                    <div className="max-h-56 space-y-2 overflow-y-auto pr-1">
                      {documents.map((d) => (
                        <div
                          key={d.id}
                          className="flex items-center justify-between gap-3 rounded-2xl border border-slate-200/90 bg-white px-3 py-2.5 shadow-sm transition hover:border-indigo-100"
                        >
                          <div className="flex min-w-0 items-start gap-2">
                            <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-500">
                              <FileText className="h-4 w-4" />
                            </span>
                            <div className="min-w-0">
                            <p className="truncate text-[11px] font-semibold text-slate-900">
                              {d.title ?? d.original_filename}
                            </p>
                            {d.description ? (
                              <p className="mt-0.5 line-clamp-2 text-[10px] text-slate-500">
                                {d.description}
                              </p>
                            ) : null}
                            <p className="mt-1 text-[10px] text-slate-500">
                              {formatBytes(d.file_size_bytes)} ·{' '}
                              {new Date(d.created_at).toLocaleDateString('de-DE')}
                            </p>
                            </div>
                          </div>
                          <Button
                            type="button"
                            size="sm"
                            variant="ghost"
                            onClick={() => {
                              const ok = window.confirm(
                                `Dokument "${d.original_filename}" wirklich löschen?`,
                              )
                              if (!ok) return
                              void handleDeleteDoc(d)
                            }}
                          >
                            <X className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </Card>
          </div>
        )}
      </div>

      {selected && knowledgeUploadOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 p-4">
          <div className="w-full max-w-3xl overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-2xl">
            <div className="flex items-start justify-between gap-3 border-b border-slate-100 px-6 py-4">
              <div>
                <p className="text-[10px] uppercase tracking-[0.18em] text-slate-400">
                  Wissen Upload
                </p>
                <h2 className="mt-1 text-sm font-semibold tracking-tight text-slate-900">
                  {knowledgeUploadStep === 0
                    ? '1) Dateien anlegen'
                    : '2) Benennen & Beschreibung'}
                </h2>
              </div>
              <Button
                type="button"
                size="sm"
                variant="secondary"
                onClick={() => {
                  setKnowledgeUploadOpen(false)
                  setKnowledgeUploadStep(0)
                  setPendingFiles([])
                  setPendingFileMeta([])
                  setUploadError(null)
                }}
              >
                <X className="mr-1 h-4 w-4" />
                Schließen
              </Button>
            </div>

            <div className="max-h-[70vh] space-y-4 overflow-y-auto px-6 py-5">
              {knowledgeUploadStep === 0 ? (
                <div className="space-y-3">
                  <p className="text-[11px] text-slate-500">
                    Datei(en) auswählen. Erlaubt: `txt`, `pdf`, `md`, `docx` (max. 5MB).
                  </p>

                  <input
                    type="file"
                    multiple
                    accept={KNOWLEDGE_ACCEPT}
                    onChange={(e) => {
                      const files = e.target.files
                      if (!files || files.length === 0) return
                      const list = Array.from(files)
                      setPendingFiles(list)
                      setPendingFileMeta(
                        list.map((f) => {
                          const base = f.name.includes('.')
                            ? f.name.replace(/\.[^/.]+$/, '')
                            : f.name
                          return { title: base, description: '' }
                        }),
                      )
                      setUploadError(null)
                    }}
                    className="w-full cursor-pointer rounded-2xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-700"
                  />

                  {pendingFiles.length > 0 ? (
                    <div className="rounded-2xl bg-slate-50 px-3 py-2 text-[11px] text-slate-600">
                      {pendingFiles.length} Datei(en) ausgewählt.
                    </div>
                  ) : null}
                </div>
              ) : (
                <div className="space-y-3">
                  {pendingFiles.length === 0 ? (
                    <p className="text-[11px] text-slate-500">
                      Erst Dateien auswählen.
                    </p>
                  ) : (
                    pendingFiles.map((file, idx) => {
                      const meta = pendingFileMeta[idx] ?? {
                        title: file.name,
                        description: '',
                      }
                      return (
                        <div
                          key={`${file.name}-${file.size}-${file.lastModified}-${idx}`}
                          className="rounded-2xl border border-slate-200 bg-slate-50/40 p-3"
                        >
                          <p className="text-[11px] font-semibold text-slate-900">
                            {file.name}
                          </p>
                          <div className="mt-2 space-y-2">
                            <Input
                              label="Titel"
                              value={meta.title}
                              onChange={(e) => {
                                setPendingFileMeta((prev) => {
                                  const copy = [...prev]
                                  copy[idx] = {
                                    title: e.target.value,
                                    description: copy[idx]?.description ?? '',
                                  }
                                  return copy
                                })
                              }}
                              placeholder="z.B. Brand Messaging Prinzipien"
                            />
                            <Textarea
                              label="Kurze Beschreibung"
                              hint="Wird als Kontext in der RAG-Pipeline verwendet."
                              value={meta.description}
                              onChange={(e) => {
                                setPendingFileMeta((prev) => {
                                  const copy = [...prev]
                                  copy[idx] = {
                                    title: copy[idx]?.title ?? file.name,
                                    description: e.target.value,
                                  }
                                  return copy
                                })
                              }}
                              rows={3}
                              placeholder="Worum geht es im Dokument? (1-2 Sätze)"
                            />
                          </div>
                        </div>
                      )
                    })
                  )}
                </div>
              )}

              {uploadError ? (
                <p className="rounded-2xl bg-rose-50 px-3 py-2 text-[11px] text-rose-600">
                  {uploadError}
                </p>
              ) : null}
            </div>

            <div className="flex items-center justify-between border-t border-slate-100 px-6 py-4">
              <div className="text-xs text-slate-500">
                {knowledgeUploadStep === 0
                  ? 'Schritt 1: Dateien hinzufügen'
                  : 'Schritt 2: Metadaten angeben'}
              </div>
              <div className="flex items-center gap-2">
                {knowledgeUploadStep === 1 ? (
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    onClick={() => setKnowledgeUploadStep(0)}
                    disabled={uploadingDocs}
                  >
                    Zurück
                  </Button>
                ) : null}
                {knowledgeUploadStep === 0 ? (
                  <Button
                    type="button"
                    size="sm"
                    onClick={() => setKnowledgeUploadStep(1)}
                    disabled={pendingFiles.length === 0}
                  >
                    Weiter
                  </Button>
                ) : (
                  <Button
                    type="button"
                    size="sm"
                    onClick={() => void handleUploadPendingFiles()}
                    disabled={uploadingDocs || pendingFiles.length === 0}
                  >
                    {uploadingDocs ? 'Upload…' : 'Abschicken'}
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {isWizardOpen && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-slate-950/25 px-4">
          <div className="relative w-full max-w-3xl overflow-hidden rounded-3xl border border-indigo-100 bg-white p-5 shadow-soft">
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
                  className="rounded-full border border-indigo-200 bg-indigo-50 px-2 py-1 text-[11px] font-medium text-indigo-700 shadow-sm hover:bg-indigo-100"
                >
                  Schließen
                </button>
              </div>

              <div className="flex items-center justify-between text-[10px] text-slate-500">
                <div className="flex items-center gap-2">
                  <span className="inline-flex items-center rounded-full border border-indigo-200 bg-indigo-100 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-indigo-700 shadow-sm">
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

              <div className="rounded-2xl border border-indigo-100 bg-white p-4 shadow-sm">
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

