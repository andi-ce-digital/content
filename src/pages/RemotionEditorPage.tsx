import { useMemo, useState } from 'react'
import { Card } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { Select } from '../components/ui/Select'
import { Input } from '../components/ui/Input'
import { Textarea } from '../components/ui/Textarea'

type EditorElement = {
  id: string
  label: string
  start: number
  end: number
  type: 'title' | 'subtitle' | 'cta' | 'background'
}

const defaultElements: EditorElement[] = [
  { id: '1', label: 'Hook Title', start: 0, end: 90, type: 'title' },
  { id: '2', label: 'Main Statement', start: 90, end: 240, type: 'subtitle' },
  { id: '3', label: 'CTA', start: 240, end: 330, type: 'cta' },
]

const dimensionMap: Record<string, { width: number; height: number }> = {
  '1080x1920': { width: 1080, height: 1920 },
  '1080x1080': { width: 1080, height: 1080 },
  '1920x1080': { width: 1920, height: 1080 },
}

export function RemotionEditorPage() {
  const [platform, setPlatform] = useState('instagram')
  const [dimension, setDimension] = useState('1080x1920')
  const [fps, setFps] = useState('30')
  const [durationFrames, setDurationFrames] = useState('330')
  const [titleText, setTitleText] = useState('Schalke 04 Intro')
  const [subtitleText, setSubtitleText] = useState(
    'Ein kraftvoller Opener mit Motion Text und Club-Farben.',
  )
  const [ctaText, setCtaText] = useState('Folge für mehr Snippets')
  const [prompt, setPrompt] = useState(
    'Erstelle ein dynamisches Reel Intro mit starker Typografie, blau-weißer Farbwelt und klarer CTA.',
  )
  const [elements, setElements] = useState<EditorElement[]>(defaultElements)

  const dimensions = useMemo(() => dimensionMap[dimension] ?? dimensionMap['1080x1920'], [dimension])
  const aspectPadding = useMemo(() => `${(dimensions.height / dimensions.width) * 100}%`, [dimensions])
  const totalFrames = Math.max(1, Number(durationFrames) || 330)

  function updateElement(
    id: string,
    patch: Partial<Pick<EditorElement, 'start' | 'end' | 'label'>>,
  ) {
    setElements((prev) => prev.map((e) => (e.id === id ? { ...e, ...patch } : e)))
  }

  const requestPreview = {
    platform,
    dimension,
    fps: Number(fps) || 30,
    durationInFrames: totalFrames,
    prompt,
    inputProps: {
      title: titleText,
      subtitle: subtitleText,
      cta: ctaText,
      elements,
    },
    renderLibrary: 'remotion',
    renderLibraryRepo: 'https://github.com/remotion-dev/remotion',
  }

  return (
    <div className="mx-auto max-w-7xl space-y-4">
      <div className="relative overflow-hidden rounded-3xl border border-slate-100 bg-gradient-to-br from-slate-50 via-white to-indigo-50/30 px-5 py-6 shadow-sm">
        <div className="pointer-events-none absolute right-0 top-0 h-32 w-64 rounded-full bg-indigo-100/50 blur-3xl" />
        <div className="relative flex flex-col gap-2">
          <p className="text-[10px] font-medium uppercase tracking-[0.2em] text-slate-400">
            Generator Tool
          </p>
          <h1 className="text-lg font-semibold tracking-tight text-slate-900">
            Remotion Editor (Fullstack)
          </h1>
          <p className="text-xs text-slate-500">
            Konfiguriere Prompt, Composition-Props und Timeline in einem Editor-Workspace.
          </p>
        </div>
      </div>

      <div className="grid gap-4 xl:grid-cols-[340px,minmax(0,1fr),360px]">
        <Card title="Controls" description="Basis-Settings und Prompt für den Render-Job.">
          <div className="space-y-3">
            <Select
              label="Plattform"
              value={platform}
              onChange={setPlatform}
              options={[
                { value: 'instagram', label: 'Instagram' },
                { value: 'tiktok', label: 'TikTok' },
                { value: 'youtube', label: 'YouTube' },
              ]}
            />
            <Select
              label="Dimension"
              value={dimension}
              onChange={setDimension}
              options={[
                { value: '1080x1920', label: '1080x1920 (9:16)' },
                { value: '1080x1080', label: '1080x1080 (1:1)' },
                { value: '1920x1080', label: '1920x1080 (16:9)' },
              ]}
            />
            <div className="grid grid-cols-2 gap-2">
              <Input label="FPS" value={fps} onChange={(e) => setFps(e.target.value)} />
              <Input
                label="Frames"
                value={durationFrames}
                onChange={(e) => setDurationFrames(e.target.value)}
              />
            </div>
            <Textarea
              label="Prompt"
              rows={5}
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
            />
            <div className="flex gap-2">
              <Button size="sm" className="flex-1">
                Render starten
              </Button>
              <Button size="sm" variant="secondary" className="flex-1">
                Payload kopieren
              </Button>
            </div>
          </div>
        </Card>

        <Card title="Preview Stage" description="Visuelle Vorschau im ausgewählten Seitenverhältnis.">
          <div className="space-y-3">
            <div className="rounded-3xl border border-slate-200 bg-slate-950/95 p-3">
              <div className="mx-auto w-full max-w-[420px]">
                <div className="relative w-full overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-b from-indigo-700 via-sky-700 to-slate-900" style={{ paddingTop: aspectPadding }}>
                  <div className="absolute inset-0 flex flex-col items-center justify-center px-6 text-center">
                    <p className="text-xs uppercase tracking-[0.2em] text-indigo-100/80">
                      {platform}
                    </p>
                    <h2 className="mt-2 text-2xl font-bold text-white">{titleText}</h2>
                    <p className="mt-2 text-sm text-slate-100">{subtitleText}</p>
                    <span className="mt-4 rounded-full bg-white/15 px-3 py-1 text-xs font-medium text-white">
                      {ctaText}
                    </span>
                  </div>
                </div>
              </div>
            </div>
            <div className="grid gap-2 md:grid-cols-3">
              <Input
                label="Title Text"
                value={titleText}
                onChange={(e) => setTitleText(e.target.value)}
              />
              <Input
                label="Subtitle Text"
                value={subtitleText}
                onChange={(e) => setSubtitleText(e.target.value)}
              />
              <Input label="CTA Text" value={ctaText} onChange={(e) => setCtaText(e.target.value)} />
            </div>
          </div>
        </Card>

        <Card title="Timeline & JSON" description="Elemente pro Frame-Bereich und finales Request-Objekt.">
          <div className="space-y-3">
            <div className="space-y-2">
              {elements.map((el) => {
                const width = Math.max(4, ((el.end - el.start) / totalFrames) * 100)
                const left = Math.max(0, (el.start / totalFrames) * 100)
                return (
                  <div key={el.id} className="rounded-2xl border border-slate-200 bg-white p-2.5">
                    <div className="mb-2 flex items-center justify-between text-[11px]">
                      <span className="font-medium text-slate-800">{el.label}</span>
                      <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] text-slate-600">
                        {el.type}
                      </span>
                    </div>
                    <div className="relative h-7 rounded-xl bg-slate-100">
                      <div
                        className="absolute top-1 h-5 rounded-lg bg-indigo-500/80"
                        style={{ left: `${left}%`, width: `${width}%` }}
                      />
                    </div>
                    <div className="mt-2 grid grid-cols-2 gap-2">
                      <Input
                        label="Start"
                        value={String(el.start)}
                        onChange={(e) =>
                          updateElement(el.id, { start: Number(e.target.value) || 0 })
                        }
                      />
                      <Input
                        label="Ende"
                        value={String(el.end)}
                        onChange={(e) =>
                          updateElement(el.id, { end: Number(e.target.value) || 0 })
                        }
                      />
                    </div>
                  </div>
                )
              })}
            </div>
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3">
              <p className="text-[10px] font-medium uppercase tracking-[0.16em] text-slate-400">
                Request Preview
              </p>
              <pre className="mt-2 max-h-[220px] overflow-auto whitespace-pre-wrap break-all text-[10px] text-slate-700">
                {JSON.stringify(requestPreview, null, 2)}
              </pre>
            </div>
          </div>
        </Card>
      </div>
    </div>
  )
}

