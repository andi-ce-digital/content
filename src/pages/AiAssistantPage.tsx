import { useEffect, useMemo, useRef, useState } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'
import * as THREE from 'three'
import { Button } from '../components/ui/Button'
import { Card } from '../components/ui/Card'
import { Textarea } from '../components/ui/Textarea'
import { cn } from '../lib/utils'
import { supabase } from '../lib/supabaseClient'
import { useAuth } from '../auth/AuthContext'
import { PenLine, SendHorizontal } from 'lucide-react'
import { StudioReelShowcase } from '../components/studio/StudioReelShowcase'
import { useUserReelSlides } from '../hooks/useUserReelSlides'

type ChatMessage = {
  id: string
  role: 'user' | 'assistant'
  content: string
  createdAt: number
}

/** Animierter Fullscreen-Hintergrund (CSS + WebGL). */
function AiStudioBackground() {
  return (
    <div className="pointer-events-none fixed inset-0 -z-10 w-full max-w-[100vw] overflow-hidden">
      <div className="ai-studio-bg-mesh absolute inset-0 max-w-full" aria-hidden />
      <div
        className="ai-studio-orb ai-studio-orb--a absolute blur-[100px]"
        aria-hidden
      />
      <div
        className="ai-studio-orb ai-studio-orb--b absolute blur-[100px]"
        aria-hidden
      />
      <div
        className="ai-studio-orb ai-studio-orb--c absolute blur-[80px]"
        aria-hidden
      />
      <div className="absolute inset-0 opacity-[0.32] sm:opacity-40 md:opacity-[0.45]">
        <Canvas
          camera={{ position: [0, 0, 6], fov: 55 }}
          className="h-full min-h-[100dvh] w-full"
          style={{ width: '100%', height: '100%' }}
        >
          <color attach="background" args={['#ffffff']} />
          <ambientLight intensity={0.5} />
          <FloatingScene />
          <OrbitControls enableZoom={false} enablePan={false} />
        </Canvas>
      </div>
      <div
        className="absolute inset-0 bg-gradient-to-b from-white/80 via-white/45 to-white/92"
        aria-hidden
      />
    </div>
  )
}

function FloatingScene() {
  const group = useRef<THREE.Group | null>(null)

  useFrame((state) => {
    const t = state.clock.getElapsedTime()
    if (!group.current) return
    group.current.rotation.y = t * 0.15
    group.current.rotation.x = Math.sin(t * 0.35) * 0.08

    const children = group.current.children
    for (let i = 0; i < children.length; i += 1) {
      const mesh = children[i] as THREE.Mesh
      mesh.position.y = Math.sin(t + i) * 0.25
      mesh.position.x = Math.cos(t * 0.7 + i) * 0.15
    }
  })

  return (
    <>
      <ambientLight intensity={0.8} />
      <directionalLight position={[3, 5, 2]} intensity={1.1} />
      <group ref={group}>
        {Array.from({ length: 22 }).map((_, i) => {
          const geometry = new THREE.TorusKnotGeometry(0.18, 0.06, 130, 12)
          const hue = 250 + (i % 6) * 8
          const material = new THREE.MeshStandardMaterial({
            color: new THREE.Color(`hsl(${hue} 90% 70%)`),
            metalness: 0.45,
            roughness: 0.25,
            emissive: new THREE.Color(`hsl(${hue} 90% 65%)`),
            emissiveIntensity: 0.4,
          })
          return (
            <mesh
              key={i}
              geometry={geometry}
              material={material}
              position={[
                Math.cos(i * 0.35) * 1.1,
                Math.sin(i * 0.35) * 0.3,
                Math.sin(i * 0.35) * 1.1,
              ]}
              scale={[1, 1, 1]}
            />
          )
        })}
      </group>
    </>
  )
}

const QUICK_SUGGESTIONS = [
  'Gib mir 5 Hook-Ideen für meine Zielgruppe',
  'Erkläre mir eine einfache Content-Strategie in 5 Punkten',
  'Formuliere eine freundliche Antwort auf eine Kundenanfrage',
] as const

const EXAMPLE_QUESTIONS = [
  'Wie schreibe ich einen stärkeren Hook in den ersten 3 Sekunden?',
  'Welche KPIs sind für Reels am sinnvollsten?',
  'Wie formuliere ich einen klaren CTA ohne zu verkäuferisch zu wirken?',
] as const

function AssistantComposer({
  value,
  onChange,
  disabled,
  onSend,
  placeholder,
}: {
  value: string
  onChange: (next: string) => void
  disabled?: boolean
  onSend: () => void
  placeholder: string
}) {
  return (
    <div className="flex min-w-0 max-w-full flex-nowrap items-center gap-1.5 rounded-2xl border border-slate-200 bg-white/80 px-2 py-1.5 shadow-sm backdrop-blur sm:grid sm:grid-cols-[auto_1fr_auto] sm:items-center sm:gap-3 sm:px-3 sm:py-2.5">
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-900/5 text-indigo-700 sm:h-9 sm:w-9">
        <PenLine className="h-4 w-4" />
      </div>
      <div className="flex min-h-0 min-w-0 flex-1 items-center sm:min-h-[36px]">
        <Textarea
          noWrapper
          value={value}
          onChange={(e) => onChange(e.target.value)}
          rows={1}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault()
              if (!disabled) onSend()
            }
          }}
          placeholder={placeholder}
          className="w-full min-h-0 resize-none border-0 bg-transparent py-1 text-xs leading-snug text-slate-800 outline-none placeholder:text-slate-400 focus:ring-0 sm:min-h-[36px] sm:py-2 sm:leading-5"
          style={{ maxHeight: 120 }}
        />
      </div>

      <Button
        type="button"
        onClick={onSend}
        disabled={disabled}
        className="h-8 shrink-0 justify-self-end rounded-full bg-indigo-600 px-0 text-white hover:bg-indigo-700 sm:h-9 sm:justify-self-auto sm:min-w-0 sm:px-4 [&>span]:inline-flex [&>span]:h-8 [&>span]:min-w-8 [&>span]:items-center [&>span]:justify-center [&>span]:gap-2 sm:[&>span]:h-9 sm:[&>span]:min-w-0 sm:[&>span]:px-4"
        aria-label="Senden"
      >
        <SendHorizontal className="h-4 w-4 shrink-0" strokeWidth={2.25} />
        <span className="hidden sm:inline">Senden</span>
      </Button>
    </div>
  )
}

export function AiAssistantPage() {
  const { user } = useAuth()
  const [profileFullName, setProfileFullName] = useState<string | null>(null)
  const [input, setInput] = useState('')
  const [messages, setMessages] = useState<ChatMessage[]>(() => [
    {
      id: 'welcome',
      role: 'assistant',
      content:
        'Hallo! Frag mich nach Content-Ideen, Hook-Varianten, Brand-Voice-Formulierungen oder einer Strategie – ich helfe dir sofort.',
      createdAt: Date.now(),
    },
  ])
  const [sending, setSending] = useState(false)
  const listRef = useRef<HTMLDivElement | null>(null)
  const [stage, setStage] = useState<'welcome' | 'chat'>('welcome')
  const { slides: userReelSlides, loading: userReelsLoading } = useUserReelSlides()

  const lastUserMessage = useMemo(() => {
    for (let i = messages.length - 1; i >= 0; i -= 1) {
      if (messages[i].role === 'user') return messages[i].content
    }
    return null
  }, [messages])

  useEffect(() => {
    listRef.current?.scrollTo({ top: 999999, behavior: 'smooth' })
  }, [messages.length])

  useEffect(() => {
    async function loadProfileName() {
      if (!supabase || !user) {
        setProfileFullName(null)
        return
      }
      const { data } = await supabase
        .from('profiles')
        .select('first_name, last_name')
        .eq('id', user.id)
        .maybeSingle<{
          first_name: string | null
          last_name: string | null
        }>()
      const fullName = `${data?.first_name ?? ''} ${data?.last_name ?? ''}`.trim()
      setProfileFullName(fullName.length > 0 ? fullName : null)
    }
    void loadProfileName()
  }, [user?.id])

  const greetingName =
    profileFullName ?? user?.email?.split('@')[0] ?? ''

  const salutation = useMemo(() => {
    const h = new Date().getHours()
    if (h < 11) return 'Guten Morgen'
    if (h < 18) return 'Guten Tag'
    return 'Guten Abend'
  }, [])

  async function handleSend() {
    const text = input.trim()
    if (!text || sending) return

    // Switch erst nach dem Absenden: Welcome bleibt sichtbar,
    // bis der User wirklich eine Nachricht geschickt hat.
    setStage('chat')

    setSending(true)
    setInput('')

    const userId = crypto.randomUUID?.() ?? String(Date.now())
    const assistantId = crypto.randomUUID
      ? crypto.randomUUID()
      : String(Date.now() + 1)

    const userMsg: ChatMessage = {
      id: userId,
      role: 'user',
      content: text,
      createdAt: Date.now(),
    }

    // Platzhalter für „thinking“ wie in ChatGPT.
    const assistantPlaceholder: ChatMessage = {
      id: assistantId,
      role: 'assistant',
      content: '',
      createdAt: Date.now(),
    }

    setMessages((prev) => [...prev, userMsg, assistantPlaceholder])

    // Demo-AI (lokal). Für echte KI kann später ein Endpoint angebunden werden.
    const assistantContent = await new Promise<string>((resolve) => {
      window.setTimeout(() => {
        const lower = text.toLowerCase()
        if (lower.includes('hook')) {
          resolve(
            'Hook-Ideen (kurz & stark):\n1) „Das macht dich sofort glaubwürdiger – ohne mehr Content.“\n2) „Du machst es falsch, wenn du nur Features postest.“\n3) „Wenn du X wirklich willst, brauchst du Y (nicht Z).“\n\nWenn du mir deine Zielgruppe sagst, mache ich dir Hooks 1:1 passend.'
          )
          return
        }
        if (lower.includes('strategie') || lower.includes('plan')) {
          resolve(
            'Strategie-Blueprint:\n- Ziel: 1 klarer KPI (z. B. Saves/Kommentare)\n- Hook-Framework: Problem → Konsequenz → neue Perspektive\n- Content-Rhythmus: 60% Evergreen, 30% Proof/Case, 10% Contrarian\n- CTA: niedrige Hürde („Kommentiere X“, nicht „Kauf jetzt“)\n\nSag mir Plattform + Zielgruppe, dann formatiere ich das als 7-Tage-Plan.'
          )
          return
        }
        if (lower.includes('brand') || lower.includes('tone') || lower.includes('stil')) {
          resolve(
            'Brand-Voice Vorschlag (Tonalität & Formulierungen):\n- Direkt, aber freundlich\n- Kurze Sätze, starke Kontraste\n- „No Bullshit“-Mikroformulierungen\n\nSchick mir 3 Stichworte zu deiner Brand, dann generiere ich dir eine Mini-Voice (10–12 Sätze) + Beispiel-Posts.'
          )
          return
        }
        resolve(
          `Alles klar. Ich kann dir helfen mit:\n- Hook-Varianten\n- CTA-Formulierungen\n- Content-Serien & Formate\n- Proof/Case-Struktur\n\nFrag mich z. B. „Gib mir 5 Hooks für {Zielgruppe} zum Thema {Thema}“ – oder sag mir einfach direkt, was du gerade brauchst.`
        )
      }, 650)
    })

    setMessages((prev) =>
      prev.map((m) =>
        m.id === assistantId ? { ...m, content: assistantContent } : m,
      ),
    )
    setSending(false)
  }

  return (
    <div className="relative isolate min-h-screen w-full min-w-0 max-w-full overflow-x-clip">
      <AiStudioBackground />

      <div
        className={cn(
          'relative z-0 mx-auto w-full min-w-0 max-w-full',
          stage === 'welcome'
            ? 'flex min-h-[100dvh] flex-col px-3 pb-10 pt-5 sm:px-8 sm:pb-14 sm:pt-10 lg:px-14'
            : 'flex max-w-full min-h-0 flex-1 flex-col px-3 py-4 sm:px-4 sm:py-5 lg:max-w-7xl',
        )}
      >
        <div
          className={cn(
            'relative min-w-0',
            stage === 'welcome' ? 'flex min-h-0 flex-1 flex-col' : 'flex min-h-0 flex-1 flex-col',
          )}
        >
          <div
            className={cn(
              'transition-opacity duration-300',
              stage === 'welcome'
                ? 'flex min-h-0 flex-1 flex-col opacity-100'
                : 'pointer-events-none absolute inset-0 opacity-0',
            )}
          >
            {/* Full-Page-Willkommen: Header → Text → Abstand → Eingabe (im Fluss, nicht fixed) */}
            <div className="flex min-h-0 flex-1 flex-col">
              <header className="flex w-full min-w-0 shrink-0 flex-col gap-5 sm:flex-row sm:items-start sm:justify-between sm:gap-8">
                <div className="max-w-2xl min-w-0 text-left">
                  <p className="text-[10px] uppercase tracking-[0.22em] text-slate-400">
                    KI-Studio
                  </p>
                  <h1 className="mt-2 text-3xl font-semibold leading-tight tracking-tight text-slate-900 sm:mt-3 sm:text-3xl md:text-4xl">
                    {user ? `${salutation}, ${greetingName}` : salutation}
                  </h1>
                  <p className="mt-3 text-sm leading-relaxed text-slate-600 sm:text-base">
                    Wobei kann ich dir{' '}
                    <span className="font-semibold text-indigo-700">
                      <span className="rounded-md bg-indigo-100/90 px-1.5 py-0.5">
                        heute helfen?
                      </span>
                    </span>
                  </p>
                </div>
                <div className="hidden shrink-0 overflow-hidden sm:block md:pt-1">
                  <div className="relative flex h-16 w-16 items-center justify-center overflow-hidden rounded-full bg-gradient-to-br from-indigo-500 via-violet-500 to-fuchsia-500 shadow-[0_24px_60px_rgba(139,92,246,0.35)] sm:h-20 sm:w-20 md:h-24 md:w-24">
                    <div className="absolute -inset-4 rounded-full bg-indigo-500/20 blur-2xl sm:-inset-5 md:-inset-6" />
                    <div className="relative h-5 w-5 rounded-full bg-white/35 md:h-6 md:w-6" />
                  </div>
                </div>
              </header>

              <p className="mt-5 max-w-2xl text-left text-sm leading-relaxed text-slate-500 sm:mt-6 md:mt-8 md:text-[15px]">
                Content-Ideen, Hooks, Brand Voice oder Strategie – stell eine Frage oder gib
                einen Auftrag ein.
              </p>

              <StudioReelShowcase
                slides={userReelSlides}
                loading={userReelsLoading}
                className="mt-6 shrink-0 md:mt-8"
              />

              <div className="min-h-0 flex-1" aria-hidden />

              <div className="mt-auto w-full min-w-0 shrink-0 pt-6 pb-[max(3.75rem,calc(env(safe-area-inset-bottom)+1.25rem))] sm:pt-8 sm:pb-[max(3.25rem,env(safe-area-inset-bottom))]">
                <div className="mx-auto w-full max-w-5xl min-w-0">
                  <div className="rounded-[22px] border border-slate-200 bg-white px-3 py-3 shadow-sm sm:px-5 sm:py-4">
                    <div className="flex items-start gap-2.5 text-[12px] leading-snug text-slate-600 sm:items-center sm:text-[13px]">
                      <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-slate-900/5 text-indigo-700">
                        <PenLine className="h-4 w-4" />
                      </span>
                      <span>Stelle der KI eine Frage oder gib einen Auftrag.</span>
                    </div>

                    <div className="mt-3 flex flex-nowrap items-center gap-1.5 rounded-2xl border border-slate-200 bg-white px-2 py-1.5 sm:grid sm:grid-cols-[auto_1fr_auto] sm:items-center sm:gap-3 sm:px-3 sm:py-2.5">
                      <div className="flex shrink-0 items-center">
                        <Button
                          type="button"
                          variant="secondary"
                          size="sm"
                          className="inline-flex h-8 shrink-0 items-center justify-center rounded-full border border-slate-200 bg-white px-2.5 text-[11px] text-slate-700 shadow-sm sm:h-9 sm:px-3"
                          disabled
                        >
                          Anhang
                        </Button>
                      </div>

                      <div className="flex min-h-0 min-w-0 flex-1 items-center sm:min-h-[36px]">
                        <Textarea
                          noWrapper
                          value={input}
                          onChange={(e) => setInput(e.target.value)}
                          placeholder="Nachfrage oder neue Frage stellen …"
                          rows={1}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' && !e.shiftKey) {
                              e.preventDefault()
                              void handleSend()
                            }
                          }}
                          className="w-full min-h-0 resize-none border-0 bg-transparent py-1 text-xs leading-snug text-slate-800 outline-none placeholder:text-slate-400 focus:ring-0 sm:min-h-[36px] sm:py-2 sm:leading-5"
                          style={{ maxHeight: 120 }}
                        />
                      </div>

                      <div className="flex shrink-0 justify-end sm:justify-center">
                        <Button
                          type="button"
                          size="sm"
                          onClick={() => void handleSend()}
                          disabled={!input.trim() || sending}
                          className="h-8 w-8 shrink-0 rounded-full bg-indigo-600 p-0 text-white hover:bg-indigo-700 sm:h-9 sm:w-9 [&>span]:flex [&>span]:h-full [&>span]:w-full [&>span]:items-center [&>span]:justify-center"
                          aria-label="Senden"
                        >
                          <SendHorizontal className="h-4 w-4" strokeWidth={2.25} />
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div
            className={cn(
              'transition-opacity duration-300',
              stage === 'chat'
                ? 'flex min-h-0 flex-1 flex-col opacity-100'
                : 'pointer-events-none absolute inset-0 opacity-0',
            )}
          >
          <div className="flex min-h-0 w-full min-w-0 max-w-full flex-col gap-4 lg:flex-row lg:items-stretch">
            <div className="min-h-0 min-w-0 max-w-full flex-1">
              <Card className="flex min-h-0 max-w-full flex-col overflow-hidden sm:min-h-[72vh]">
                <div className="min-h-0 flex-1 bg-slate-50/60">
                  <div
                    ref={listRef}
                    className="h-[min(72vh,calc(100dvh-14rem))] min-h-[200px] space-y-3 overflow-y-auto overflow-x-hidden p-3 sm:h-[72vh] sm:min-h-0 sm:space-y-4 sm:p-4"
                  >
                    {messages.map((m) => {
                      const isUser = m.role === 'user'
                      return (
                        <div
                          key={m.id}
                          className={cn(
                            'flex w-full',
                            isUser ? 'justify-end' : 'justify-start',
                          )}
                        >
                          <div
                            className={cn(
                              'max-w-[min(85%,100%)] min-w-0 break-words rounded-2xl border px-3 py-2.5 text-xs shadow-sm sm:px-4 sm:py-3',
                              isUser
                                ? 'border-indigo-200 bg-indigo-600 text-white'
                                : 'border-slate-200 bg-white text-slate-800',
                            )}
                          >
                            {m.content ? (
                              <p className="whitespace-pre-wrap break-words leading-relaxed">
                                {m.content}
                              </p>
                            ) : (
                              <div className="flex items-center gap-2">
                                <span className="h-2 w-2 rounded-full bg-white/70" />
                                <span className="h-2 w-2 rounded-full bg-white/70" />
                                <span className="h-2 w-2 rounded-full bg-white/70" />
                              </div>
                            )}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>

                <div className="border-t border-slate-100 bg-white p-3 sm:p-4">
                  <AssistantComposer
                    value={input}
                    onChange={setInput}
                    disabled={!input.trim() || sending}
                    onSend={() => void handleSend()}
                    placeholder="Frag nach Hooks, Brand Voice oder einer Strategie…"
                  />
                  {lastUserMessage ? (
                    <p className="mt-2 text-[11px] text-slate-500">
                      Tipp: Schreib z. B. „Generator-Style“ oder „Brand Voice Tonalität“,
                      dann passe ich die Antworten an.
                    </p>
                  ) : null}
                </div>
              </Card>

              {/* Mobile / Tablet: Schnellzugriff (Sidebar ist ab lg sichtbar) */}
              <div className="space-y-3 lg:hidden">
                <Card title="Vorschläge" description="Tippe zum Übernehmen" className="shadow-sm">
                  <div className="flex flex-col gap-2">
                    {QUICK_SUGGESTIONS.map((t) => (
                      <button
                        key={t}
                        type="button"
                        className="w-full rounded-2xl border border-slate-100 bg-white px-3 py-2.5 text-left text-[11px] leading-snug text-slate-700 shadow-sm active:bg-slate-50 hover:border-indigo-200 hover:bg-indigo-50/30"
                        onClick={() => setInput(t)}
                      >
                        {t}
                      </button>
                    ))}
                  </div>
                </Card>
                <Card title="Beispielfragen" className="shadow-sm">
                  <div className="flex flex-col gap-2">
                    {EXAMPLE_QUESTIONS.map((q) => (
                      <button
                        key={q}
                        type="button"
                        className="w-full rounded-2xl border border-slate-100 bg-white px-3 py-2.5 text-left text-[11px] leading-snug text-slate-700 shadow-sm active:bg-slate-50 hover:border-indigo-200 hover:bg-indigo-50/30"
                        onClick={() => setInput(q)}
                      >
                        {q}
                      </button>
                    ))}
                  </div>
                </Card>
              </div>
            </div>

            <div className="hidden w-full min-w-0 max-w-full shrink-0 space-y-4 lg:block lg:w-[min(320px,100%)]">
              <Card
                title="Quellen"
                description="Demo: keine echten Uploads, nur Oberfläche zur Vorschau."
              >
                <div className="space-y-3 text-xs text-slate-600">
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                    <Button type="button" size="sm" variant="secondary" className="w-full shrink-0">
                      Datei hochladen
                    </Button>
                    <Button type="button" size="sm" variant="secondary" className="w-full shrink-0">
                      Medien hochladen
                    </Button>
                  </div>
                  <div className="rounded-2xl border border-slate-200 bg-white p-3 text-[11px]">
                    Verknüpfe Wissen oder lade Dateien in diesen Chat.
                  </div>

                  <div className="space-y-2">
                    <p className="text-[10px] font-medium uppercase tracking-[0.16em] text-slate-400">
                      Beispieldaten
                    </p>
                    <div className="grid gap-2">
                      {[
                        { t: 'Beispiel: Content-Strategie PDF', s: 'intern' },
                        { t: 'Beispiel: Markenrichtlinien', s: 'intern' },
                      ].map((x) => (
                        <div
                          key={x.t}
                          className="flex items-start justify-between gap-2 rounded-2xl border border-slate-100 bg-white px-3 py-2"
                        >
                          <div className="min-w-0">
                            <p className="truncate text-[11px] font-medium text-slate-900">
                              {x.t}
                            </p>
                            <p className="truncate text-[10px] text-slate-500">{x.s}</p>
                          </div>
                          <span className="mt-0.5 text-[10px] text-indigo-700">★</span>
                        </div>
                      ))}
                      <div className="text-[11px] text-slate-500">+3 weitere</div>
                    </div>
                  </div>
                </div>
              </Card>

              <Card title="Vorschläge" description="Schnellstart (fügt Text ins Eingabefeld ein)">
                <div className="flex flex-col gap-2">
                  {QUICK_SUGGESTIONS.map((t) => (
                    <button
                      key={t}
                      type="button"
                      className="w-full rounded-2xl border border-slate-100 bg-white px-3 py-2 text-left text-[11px] text-slate-700 shadow-sm hover:border-indigo-200 hover:bg-indigo-50/30"
                      onClick={() => setInput(t)}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </Card>

              <Card title="Beispielfragen" description="">
                <div className="flex flex-col gap-2">
                  {EXAMPLE_QUESTIONS.map((q) => (
                    <button
                      key={q}
                      type="button"
                      className="w-full rounded-2xl border border-slate-100 bg-white px-3 py-2 text-left text-[11px] text-slate-700 shadow-sm hover:border-indigo-200 hover:bg-indigo-50/30"
                      onClick={() => setInput(q)}
                    >
                      {q}
                    </button>
                  ))}
                </div>
              </Card>
            </div>
          </div>
          </div>
        </div>
      </div>
    </div>
  )
}

