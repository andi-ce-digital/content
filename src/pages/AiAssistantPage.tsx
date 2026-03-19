import { useEffect, useMemo, useRef, useState } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'
import * as THREE from 'three'
import { Button } from '../components/ui/Button'
import { Card } from '../components/ui/Card'
import { cn } from '../lib/utils'
import { useAuth } from '../auth/AuthContext'
import { SendHorizontal } from 'lucide-react'

type ChatMessage = {
  id: string
  role: 'user' | 'assistant'
  content: string
  createdAt: number
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

export function AiAssistantPage() {
  const { user } = useAuth()
  const [input, setInput] = useState('')
  const [messages, setMessages] = useState<ChatMessage[]>(() => [
    {
      id: 'welcome',
      role: 'assistant',
      content:
        'Hi! Frag mich nach Content-Ideen, Hook-Varianten, Brand-Voice-Formulierungen oder einer Strategie. Ich helfe dir sofort.',
      createdAt: Date.now(),
    },
  ])
  const [sending, setSending] = useState(false)
  const listRef = useRef<HTMLDivElement | null>(null)

  const lastUserMessage = useMemo(() => {
    for (let i = messages.length - 1; i >= 0; i -= 1) {
      if (messages[i].role === 'user') return messages[i].content
    }
    return null
  }, [messages])

  useEffect(() => {
    listRef.current?.scrollTo({ top: 999999, behavior: 'smooth' })
  }, [messages.length])

  async function handleSend() {
    const text = input.trim()
    if (!text || sending) return
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

  const quickPrompts = useMemo(
    () => [
      'Gib mir 7 Hook-Varianten für eine {Zielgruppe} zum Thema {Thema}.',
      'Erstelle eine 5-Tage Content-Serie mit CTA.',
      'Formuliere meine Brand-Voice in 10 Sätzen + 2 Beispielposts.',
      'Schreibe 3 kurze CTAs, die Kommentare statt Saves holen.',
    ],
    [],
  )

  return (
    <div className="relative min-h-screen">
      <div className="pointer-events-none absolute inset-0 -z-10 hidden md:block">
        <Canvas
          camera={{ position: [0, 0, 6], fov: 55 }}
          style={{ width: '100%', height: '100%' }}
        >
          <color attach="background" args={['#ffffff']} />
          <ambientLight intensity={0.5} />
          <FloatingScene />
          <OrbitControls enableZoom={false} enablePan={false} />
        </Canvas>
        <div className="absolute inset-0 bg-gradient-to-b from-white/90 via-white/55 to-white/80" />
      </div>

      <div className="mx-auto max-w-4xl px-4 py-5">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <p className="text-[10px] uppercase tracking-[0.18em] text-slate-400">
              AI Assistant
            </p>
            <h1 className="mt-1 text-lg font-semibold tracking-tight text-slate-900">
              Chat mit deinem Content-Coach
            </h1>
          </div>
          <span className="hidden rounded-full border border-slate-200 bg-white/70 px-3 py-1 text-[10px] font-medium text-slate-600 md:inline-flex">
            {user ? `Hallo, ${user.email?.split('@')[0]}` : 'Demo Mode'}
          </span>
        </div>

        <Card className="flex min-h-[72vh] flex-col overflow-hidden">
          <div className="flex-1 bg-slate-50/60">
            <div
              ref={listRef}
              className="h-[72vh] space-y-4 overflow-y-auto p-4"
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
                    <div className={cn('max-w-[85%] rounded-2xl border px-4 py-3 text-xs shadow-sm', isUser
                      ? 'border-indigo-200 bg-indigo-600 text-white'
                      : 'border-slate-200 bg-white text-slate-800'
                    )}>
                      {m.content ? (
                        <p className="whitespace-pre-wrap leading-relaxed">
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

          <div className="border-t border-slate-100 bg-white p-4">
            <div className="mb-3 flex flex-wrap gap-2">
              {quickPrompts.map((q) => (
                <button
                  key={q}
                  type="button"
                  className="rounded-full border border-slate-200 bg-white px-3 py-1 text-[11px] text-slate-700 shadow-sm transition hover:border-indigo-200 hover:bg-indigo-50/50"
                  onClick={() => setInput(q)}
                >
                  {q.length > 42 ? q.slice(0, 42) + '…' : q}
                </button>
              ))}
            </div>

            <div className="flex items-end gap-2">
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                rows={1}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault()
                    void handleSend()
                  }
                }}
                placeholder="Frag nach Hooks, Brand Voice oder einer Strategie…"
                className="min-h-[44px] flex-1 resize-none rounded-2xl border border-slate-200 bg-white px-4 py-2 text-xs text-slate-800 shadow-sm outline-none placeholder:text-slate-400 focus:border-brand-300 focus:ring-2 focus:ring-brand-100"
              />
              <Button
                type="button"
                onClick={() => void handleSend()}
                disabled={!input.trim() || sending}
                className="mb-0.5 bg-indigo-600 text-white hover:bg-indigo-700"
              >
                <span className="inline-flex items-center gap-2">
                  <SendHorizontal className="h-4 w-4" />
                  Senden
                </span>
              </Button>
            </div>
            {lastUserMessage ? (
              <p className="mt-2 text-[11px] text-slate-500">
                Tipp: Schreib z. B. „Generator-Style“ oder „Brand Voice Tonalität“,
                dann passe ich die Antworten an.
              </p>
            ) : null}
          </div>
        </Card>
      </div>
    </div>
  )
}

