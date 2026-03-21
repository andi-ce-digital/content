import { useEffect, useState } from 'react'
import { Card } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { exampleStrategy } from '../data/mockData'
import { supabase } from '../lib/supabaseClient'
import { useAuth } from '../auth/AuthContext'
import { TrendingDown, TrendingUp } from 'lucide-react'

export function GeneratorPage() {
  type Mode = 'hooks' | 'script' | 'cta' | 'reel_elements'
  type Platform = 'instagram' | 'tiktok' | 'youtube'

  const { user } = useAuth()
  const [mode, setMode] = useState<Mode>('hooks')
  const [activeActionKey, setActiveActionKey] = useState<string>('hooks_generate')
  const [platform, setPlatform] = useState<Platform>('instagram')
  const [goal, setGoal] = useState('Lead-Generierung')
  const [selectedTopics, setSelectedTopics] = useState<string[]>([])

  // Hooks Wizard
  const [isHookWizardOpen, setIsHookWizardOpen] = useState(false)
  const [hookWizardStep, setHookWizardStep] = useState(0)
  const [topicQueryLoading, setTopicQueryLoading] = useState(false)
  const [topicQueryError, setTopicQueryError] = useState<string | null>(null)
  const [topTopics, setTopTopics] = useState<
    {
      topic: string
      score: number
      count: number
      avgEngagement: number
      mainMessage: string | null
      isCustom?: boolean
    }[]
  >([])
  const [topicSelection, setTopicSelection] = useState<string[]>([])
  const [customThemeInput, setCustomThemeInput] = useState('')

  // Brand Voice & Creators Wizard (Step 2-4)
  type BrandVoiceRecord = {
    id: string
    name: string
    ai_brand_voice: string | null
    created_at: string
  }
  type CreatorRecord = {
    id: string
    platform: string
    creator_name: string
    creator_handle: string
    followers: number | string | null
    related_profiles: Array<string | Record<string, unknown>> | null
  }

  const [brandVoicesLoading, setBrandVoicesLoading] = useState(false)
  const [brandVoicesError, setBrandVoicesError] = useState<string | null>(null)
  const [brandVoices, setBrandVoices] = useState<BrandVoiceRecord[]>([])
  const [selectedBrandVoiceId, setSelectedBrandVoiceId] = useState<string>('')

  const [creatorsLoading, setCreatorsLoading] = useState(false)
  const [creatorsError, setCreatorsError] = useState<string | null>(null)
  const [creators, setCreators] = useState<CreatorRecord[]>([])
  const [selectedCreatorIds, setSelectedCreatorIds] = useState<string[]>([])

  const [additionalPoints, setAdditionalPoints] = useState('')
  const [startLoading, setStartLoading] = useState(false)

  // Reel Elements Wizard
  const [isReelElementsWizardOpen, setIsReelElementsWizardOpen] = useState(false)
  const [reelDimension, setReelDimension] = useState('1080x1920')
  const [reelPrompt, setReelPrompt] = useState('')
  const [reelStartLoading, setReelStartLoading] = useState(false)

  // Actions (registered templates) - nur diese sollen angezeigt werden
  type GeneratorActionRecord = {
    id: string
    user_id: string
    action_key: string
    title: string
    platform: string
    platform_label: string | null
    description: string | null
    webhook_url: string
    template_json: Record<string, unknown>
  }

  const [actionsLoading, setActionsLoading] = useState(false)
  const [actionsError, setActionsError] = useState<string | null>(null)
  const [registeredActions, setRegisteredActions] = useState<GeneratorActionRecord[]>([])

  const [topicBrowserOpen, setTopicBrowserOpen] = useState(false)
  const [topicBrowserLoading, setTopicBrowserLoading] = useState(false)
  const [topicBrowserError, setTopicBrowserError] = useState<string | null>(null)
  const [browseTopics, setBrowseTopics] = useState<
    Array<{ topic: string; avgEngagement: number; mainMessage: string | null }>
  >([])

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
    setCustomThemeInput('')
    setTopicQueryError(null)

    setSelectedBrandVoiceId('')
    setSelectedCreatorIds([])
    setAdditionalPoints('')
    setStartLoading(false)

    setIsHookWizardOpen(true)

    // Step 2/3 data preload
    void loadBrandVoices()
    void loadCreatorsForPlatform()
  }

  function hooksGenerateTemplateJson() {
    return {
      action_key: 'hooks_generate',
      platform: platform,
      steps: [
        {
          key: 'topics',
          title: 'Topics auswählen',
          required: true,
          type: 'topicMultiSelect',
          info: 'Topics aus deiner Library (content_items) – sortiert nach Engagement-Rate.',
          ui: { hover: 'main_message' },
        },
        {
          key: 'brandVoice',
          title: 'Brand Voice auswählen',
          required: true,
          type: 'brandVoiceSingleSelect',
          info: 'Wähle eine Brand Voice aus deinen gespeicherten Brand Voices.',
        },
        {
          key: 'creators',
          title: 'Creator(s) selektieren',
          required: true,
          type: 'creatorMultiSelect',
          info: 'Wähle Creators, an deren Content du dich orientieren willst.',
        },
        {
          key: 'additionalPoints',
          title: 'Weitere Punkte (Freitext)',
          required: false,
          type: 'textArea',
          info: 'Einwände, Beispiele, gewünschte Richtung.',
        },
      ],
      webhook: {
        url: '{{webhook_url}}',
        payloadMapping: {
          platform: '$platform',
          goal: '$goal',
          topicSelection: '$config.topics',
          brandVoiceId: '$config.brandVoice',
          creatorIds: '$config.creators',
          additionalPoints: '$config.additionalPoints',
        },
      },
    }
  }

  function reelElementsTemplateJson() {
    return {
      action_key: 'reel_elements_generate',
      platform: platform,
      engine: {
        library: 'remotion',
        repository: 'https://github.com/remotion-dev/remotion',
      },
      steps: [
        {
          key: 'dimension',
          title: 'Dimension auswählen',
          required: true,
          type: 'singleSelect',
          options: ['1080x1920', '1080x1080', '1920x1080'],
          info: 'Wähle das Zielformat für die Reel-Elemente.',
        },
        {
          key: 'prompt',
          title: 'Prompt',
          required: true,
          type: 'textArea',
          info: 'Beschreibe die gewünschten Reel-Elemente.',
        },
      ],
      webhook: {
        url: '{{webhook_url}}',
        payloadMapping: {
          platform: '$platform',
          dimension: '$config.dimension',
          prompt: '$config.prompt',
          renderLibrary: 'remotion',
          renderLibraryRepo: 'https://github.com/remotion-dev/remotion',
        },
      },
    }
  }

  async function ensureRegisteredHooksGenerateAction() {
    if (!supabase || !user) return

    const actionKey = 'hooks_generate'
    const { data: existing, error: existingErr } = await supabase
      .from('generator_actions')
      .select('id')
      .eq('user_id', user.id)
      .eq('action_key', actionKey)
      .eq('platform', platform)
      .maybeSingle()

    if (existingErr) throw existingErr

    // NOTE: existing template might be stale if the app logic changed.
    // We'll update it on every open to keep generator actions consistent.
    const defaultWebhookUrl =
      'https://n8n.srv999320.hstgr.cloud/webhook/8cb79ac1-533e-404e-aa49-62d4e24b5345'

    if (existing) {
      const template_json = hooksGenerateTemplateJson()
      const { error: updateErr } = await supabase
        .from('generator_actions')
        .update({ template_json, webhook_url: defaultWebhookUrl })
        .eq('user_id', user.id)
        .eq('action_key', actionKey)
        .eq('platform', platform)

      if (updateErr) throw updateErr
      return
    }
    const template_json = hooksGenerateTemplateJson()

    const { error: insertErr } = await supabase
      .from('generator_actions')
      .insert({
        user_id: user.id,
        action_key: actionKey,
        title: 'Hooks generieren',
        platform,
        platform_label:
          platform === 'instagram'
            ? 'Instagram'
            : platform === 'tiktok'
              ? 'TikTok'
              : 'YouTube',
        description: 'Wizard mit Topics, Brand Voice, Creators und Freitext.',
        webhook_url: defaultWebhookUrl,
        template_json,
      })

    if (insertErr) throw insertErr
  }

  async function ensureRegisteredReelElementsAction() {
    if (!supabase || !user) return

    const actionKey = 'reel_elements_generate'
    const { data: existing, error: existingErr } = await supabase
      .from('generator_actions')
      .select('id')
      .eq('user_id', user.id)
      .eq('action_key', actionKey)
      .eq('platform', platform)
      .maybeSingle()

    if (existingErr) throw existingErr

    const template_json = reelElementsTemplateJson()
    const title = 'Reel-Elemente generieren'
    const description =
      'Generiert Reel-Bausteine per Prompt und Dimension auf Basis von Remotion.'
    const platformLabel =
      platform === 'instagram' ? 'Instagram' : platform === 'tiktok' ? 'TikTok' : 'YouTube'

    if (existing) {
      const { error: updateErr } = await supabase
        .from('generator_actions')
        .update({ template_json, title, description, platform_label: platformLabel })
        .eq('user_id', user.id)
        .eq('action_key', actionKey)
        .eq('platform', platform)

      if (updateErr) throw updateErr
      return
    }

    const { error: insertErr } = await supabase.from('generator_actions').insert({
      user_id: user.id,
      action_key: actionKey,
      title,
      platform,
      platform_label: platformLabel,
      description,
      webhook_url: 'https://n8n.srv999320.hstgr.cloud/webhook/8cb79ac1-533e-404e-aa49-62d4e24b5345',
      template_json,
    })

    if (insertErr) throw insertErr
  }

  async function loadRegisteredActions() {
    if (!supabase || !user) return
    setActionsLoading(true)
    setActionsError(null)
    try {
      await ensureRegisteredHooksGenerateAction()
      await ensureRegisteredReelElementsAction()

      const { data, error } = await supabase
        .from('generator_actions')
        .select(
          'id, user_id, action_key, title, platform, platform_label, description, webhook_url, template_json',
        )
        .eq('user_id', user.id)
        .eq('platform', platform)
        .order('created_at', { ascending: false })

      if (error) throw error

      setRegisteredActions((data ?? []) as GeneratorActionRecord[])
    } catch (e) {
      setActionsError((e as Error).message ?? 'Fehler beim Laden der Actions.')
      setRegisteredActions([])
    } finally {
      setActionsLoading(false)
    }
  }

  useEffect(() => {
    void loadRegisteredActions()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, platform])

  async function loadBrowseTopics() {
    if (!supabase || !user) return
    setTopicBrowserLoading(true)
    setTopicBrowserError(null)
    try {
      const cutoff = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000)
      const { data, error } = await supabase
        .from('content_items')
        .select('topic, engagement_rate, main_message')
        .eq('user_id', user.id)
        .not('topic', 'is', null)
        .gte('created_at', cutoff.toISOString())
        // Limit aus Performance-Gründen; die Liste wird später nur aggregiert & sortiert.
        .limit(3000)

      if (error) throw error

      const map = new Map<
        string,
        { sumEngagement: number; count: number; bestMainMessage: string | null; bestScore: number }
      >()

      for (const r of (data ?? []) as Array<{
        topic: string | null
        engagement_rate: number | null
        main_message: string | null
      }>) {
        const t = (r.topic ?? '').trim()
        if (!t) continue

        const rowEng = Number(r.engagement_rate ?? 0)
        const key = t
        const prev =
          map.get(key) ?? {
            sumEngagement: 0,
            count: 0,
            bestMainMessage: null,
            bestScore: -Infinity,
          }

        prev.sumEngagement += rowEng
        prev.count += 1

        // bestMainMessage aus dem Zeilen-Kontext (simple Heuristik: höheres engagement_rate)
        if (rowEng > prev.bestScore) {
          prev.bestScore = rowEng
          prev.bestMainMessage = r.main_message != null ? String(r.main_message) : null
        }

        map.set(key, prev)
      }

      const ranked = Array.from(map.entries())
        .map(([topic, agg]) => ({
          topic,
          avgEngagement: agg.sumEngagement / Math.max(1, agg.count),
          mainMessage: agg.bestMainMessage,
        }))
        .sort((a, b) => b.avgEngagement - a.avgEngagement)

      setBrowseTopics(ranked)
    } catch (e) {
      setTopicBrowserError((e as Error).message ?? 'Fehler beim Laden der Topics.')
      setBrowseTopics([])
    } finally {
      setTopicBrowserLoading(false)
    }
  }

  async function loadBrandVoices() {
    if (!supabase || !user) return
    setBrandVoicesLoading(true)
    setBrandVoicesError(null)
    try {
      const { data, error } = await supabase
        .from('brand_voices')
        .select('id, name, ai_brand_voice, created_at')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      if (error) throw error

      const list = (data ?? []) as BrandVoiceRecord[]
      setBrandVoices(list)

      if (!selectedBrandVoiceId && list.length > 0) {
        setSelectedBrandVoiceId(list[0]!.id)
      }
    } catch (e) {
      setBrandVoicesError((e as Error).message ?? 'Fehler beim Laden der Brand Voices.')
      setBrandVoices([])
      setSelectedBrandVoiceId('')
    } finally {
      setBrandVoicesLoading(false)
    }
  }

  async function loadCreatorsForPlatform() {
    if (!supabase || !user) return
    setCreatorsLoading(true)
    setCreatorsError(null)
    try {
      const { data, error } = await supabase
        .from('creators')
        .select('id, platform, creator_name, creator_handle, followers, related_profiles')
        .eq('user_id', user.id)
        .eq('platform', platform)
        .order('followers', { ascending: false, nullsFirst: false })

      if (error) throw error

      const list = (data ?? []) as CreatorRecord[]
      setCreators(list)

      // Wenn der Nutzer später aus irgendeinem Grund wieder rein kommt,
      // sollen alte Auswahl-IDs nicht "falsch" bleiben.
      setSelectedCreatorIds((prev) => prev.filter((id) => list.some((c) => c.id === id)))
    } catch (e) {
      setCreatorsError((e as Error).message ?? 'Fehler beim Laden der Creators.')
      setCreators([])
      setSelectedCreatorIds([])
    } finally {
      setCreatorsLoading(false)
    }
  }

  function closeHookWizard() {
    setIsHookWizardOpen(false)
  }

  function openReelElementsWizard() {
    setMode('reel_elements')
    setActiveActionKey('reel_elements_generate')
    setReelDimension('1080x1920')
    setReelPrompt('')
    setReelStartLoading(false)
    setIsReelElementsWizardOpen(true)
  }

  function closeReelElementsWizard() {
    setIsReelElementsWizardOpen(false)
  }

  function toggleTopic(t: string) {
    setTopicSelection((prev) =>
      prev.includes(t) ? prev.filter((x) => x !== t) : [...prev, t],
    )
  }

  function addCustomTopic(rawTopic: string) {
    const next = rawTopic.trim()
    if (!next) return

    setTopicSelection((prev) => (prev.includes(next) ? prev : [...prev, next]))

    // Neues Thema direkt in die obere Topic-Liste einfügen.
    setTopTopics((prev) => {
      if (prev.some((t) => t.topic === next)) return prev
      return [
        {
          topic: next,
          score: 0,
          count: 1,
          avgEngagement: 0,
          mainMessage: null,
          isCustom: true,
        },
        ...prev,
      ]
    })

    setCustomThemeInput('')
  }

  function toggleCreator(id: string) {
    setSelectedCreatorIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
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

  async function startTask() {
    if (startLoading) return
    setStartLoading(true)
    try {
      if (!supabase || !user) return

      // Stelle sicher, dass die Action existiert (pro User + Plattform).
      await ensureRegisteredHooksGenerateAction()

      const { data: actionRow, error: actionErr } = await supabase
        .from('generator_actions')
        .select('id, action_key, platform, title, webhook_url')
        .eq('user_id', user.id)
        .eq('action_key', 'hooks_generate')
        .eq('platform', platform)
        .single()

      if (actionErr || !actionRow) {
        throw new Error(actionErr?.message ?? 'Hooks Action nicht gefunden.')
      }

      const actionConfigJson = {
        platform,
        goal,
        topicSelection,
        brandVoiceId: selectedBrandVoiceId,
        creatorIds: selectedCreatorIds,
        additionalPoints,
      }

      const { data: runRow, error: runErr } = await supabase
        .from('generator_action_runs')
        .insert({
          user_id: user.id,
          action_id: actionRow.id,
          config_json: actionConfigJson,
          status: 'running',
          started_at: new Date().toISOString(),
          progress_json: { step: 'start' },
        })
        .select('id')
        .single()

      if (runErr || !runRow) {
        throw new Error(runErr?.message ?? 'Run konnte nicht erstellt werden.')
      }

      const n8nWebhookUrl =
        actionRow.webhook_url ||
        'https://n8n.srv999320.hstgr.cloud/webhook/8cb79ac1-533e-404e-aa49-62d4e24b5345'

      const brandVoiceName =
        brandVoices.find((v) => v.id === selectedBrandVoiceId)?.name ?? null

      const selectedCreators = creators.filter((c) =>
        selectedCreatorIds.includes(c.id),
      )

      const creatorsMeta = selectedCreators.map((c) => ({
        id: c.id,
        platform: c.platform,
        creator_name: c.creator_name,
        creator_handle: c.creator_handle,
        followers: getCreatorFollowers(c),
      }))

      const payload = {
        run_id: runRow.id,
        action_id: actionRow.id,
        action_key: actionRow.action_key,
        user_id: user.id,
        created_at: new Date().toISOString(),

        // “Meta” für n8n, komplett:
        platform,
        goal,
        topicSelection,
        brandVoiceId: selectedBrandVoiceId,
        brandVoiceName,
        creatorIds: selectedCreatorIds,
        creators: creatorsMeta,
        additionalPoints,

        // für bequemes Mapping:
        config_json: actionConfigJson,
      }

      let responseText = ''
      let resultJson: unknown = null
      let ok = false
      try {
        const resp = await fetch(n8nWebhookUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        })
        responseText = await resp.text()
        ok = resp.ok
        try {
          resultJson = responseText ? JSON.parse(responseText) : null
        } catch {
          resultJson = { raw: responseText }
        }
      } catch (e) {
        ok = false
        resultJson = null
        responseText = (e as Error).message
      }

      if (ok) {
        const { error: updateErr } = await supabase
          .from('generator_action_runs')
          .update({
            status: 'succeeded',
            finished_at: new Date().toISOString(),
            result_json: (resultJson ?? null) as Record<string, unknown> | null,
            progress_json: { step: 'webhook_sent' },
            error_text: null,
          })
          .eq('id', runRow.id)

        if (updateErr) {
          // DB Update Fehler ist nicht fatal fürs UI
          // (wir haben den Run aber immerhin erstellt und den Webhook gesendet).
        }
      } else {
        const { error: updateErr } = await supabase
          .from('generator_action_runs')
          .update({
            status: 'failed',
            finished_at: new Date().toISOString(),
            result_json: null,
            error_text: responseText || 'Webhook Request fehlgeschlagen',
            progress_json: { step: 'webhook_failed' },
          })
          .eq('id', runRow.id)

        if (updateErr) {
          // Ignorieren: Hauptsache Run existiert.
        }
      }

      // Für den UX-Flow: Auswahl übernehmen & Wizard schließen.
      setSelectedTopics(topicSelection)
      setIsHookWizardOpen(false)
    } finally {
      setStartLoading(false)
    }
  }

  async function startReelElementsTask() {
    if (reelStartLoading) return
    if (!reelPrompt.trim()) return
    setReelStartLoading(true)
    try {
      if (!supabase || !user) return
      await ensureRegisteredReelElementsAction()

      const { data: actionRow, error: actionErr } = await supabase
        .from('generator_actions')
        .select('id, action_key, platform, title, webhook_url')
        .eq('user_id', user.id)
        .eq('action_key', 'reel_elements_generate')
        .eq('platform', platform)
        .single()

      if (actionErr || !actionRow) {
        throw new Error(actionErr?.message ?? 'Reel-Elemente Action nicht gefunden.')
      }

      const actionConfigJson = {
        platform,
        dimension: reelDimension,
        prompt: reelPrompt.trim(),
        renderLibrary: 'remotion',
        renderLibraryRepo: 'https://github.com/remotion-dev/remotion',
      }

      const { data: runRow, error: runErr } = await supabase
        .from('generator_action_runs')
        .insert({
          user_id: user.id,
          action_id: actionRow.id,
          config_json: actionConfigJson,
          status: 'running',
          started_at: new Date().toISOString(),
          progress_json: { step: 'start' },
        })
        .select('id')
        .single()

      if (runErr || !runRow) {
        throw new Error(runErr?.message ?? 'Run konnte nicht erstellt werden.')
      }

      const webhookUrl = actionRow.webhook_url
      if (!webhookUrl) {
        throw new Error('Webhook URL für Reel-Elemente ist nicht gesetzt.')
      }

      const payload = {
        run_id: runRow.id,
        action_id: actionRow.id,
        action_key: actionRow.action_key,
        user_id: user.id,
        created_at: new Date().toISOString(),
        platform,
        dimension: reelDimension,
        prompt: reelPrompt.trim(),
        renderLibrary: 'remotion',
        renderLibraryRepo: 'https://github.com/remotion-dev/remotion',
        config_json: actionConfigJson,
      }

      let responseText = ''
      let resultJson: unknown = null
      let ok = false
      try {
        const resp = await fetch(webhookUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        })
        responseText = await resp.text()
        ok = resp.ok
        try {
          resultJson = responseText ? JSON.parse(responseText) : null
        } catch {
          resultJson = { raw: responseText }
        }
      } catch (e) {
        ok = false
        resultJson = null
        responseText = (e as Error).message
      }

      if (ok) {
        await supabase
          .from('generator_action_runs')
          .update({
            status: 'succeeded',
            finished_at: new Date().toISOString(),
            result_json: (resultJson ?? null) as Record<string, unknown> | null,
            progress_json: { step: 'webhook_sent' },
            error_text: null,
          })
          .eq('id', runRow.id)
      } else {
        await supabase
          .from('generator_action_runs')
          .update({
            status: 'failed',
            finished_at: new Date().toISOString(),
            result_json: null,
            error_text: responseText || 'Webhook Request fehlgeschlagen',
            progress_json: { step: 'webhook_failed' },
          })
          .eq('id', runRow.id)
      }

      setIsReelElementsWizardOpen(false)
    } finally {
      setReelStartLoading(false)
    }
  }

  function formatFollowers(value: number | string | null | undefined) {
    if (value === null || value === undefined) return '—'
    const n = typeof value === 'number' ? value : Number(value)
    if (!Number.isFinite(n)) return '—'
    // Compact formatting (avoids locale quirks).
    if (n >= 1_000_000) return `${Math.round((n / 1_000_000) * 10) / 10}M`
    if (n >= 1_000) return `${Math.round((n / 1_000) * 10) / 10}k`
    return `${Math.round(n)}`
  }

  function parseFollowerNumberLike(value: unknown): number | null {
    if (value === null || value === undefined) return null
    if (typeof value === 'number') return Number.isFinite(value) ? value : null
    if (typeof value === 'string') {
      const cleaned = value.replace(/[^\d.]/g, '')
      const n = Number(cleaned)
      return Number.isFinite(n) ? n : null
    }
    return null
  }

  function getCreatorFollowers(c: CreatorRecord): number | null {
    const direct = parseFollowerNumberLike(c.followers)
    if (direct !== null) return direct

    // Fallback: followers in related_profiles (falls dort von n8n gespeichert)
    const rel = c.related_profiles
    if (!Array.isArray(rel)) return null

    for (const raw of rel) {
      let obj: Record<string, unknown> | null = null
      if (typeof raw === 'string') {
        try {
          obj = JSON.parse(raw) as Record<string, unknown>
        } catch {
          obj = null
        }
      } else if (raw && typeof raw === 'object') {
        obj = raw as Record<string, unknown>
      }
      if (!obj) continue

      const cand =
        parseFollowerNumberLike(obj.followers) ??
        parseFollowerNumberLike(obj.followers_count) ??
        parseFollowerNumberLike(obj.follower_count)
      if (cand !== null) return cand
    }

    return null
  }

  useEffect(() => {
    async function loadTopics() {
      if (!isHookWizardOpen) return
      if (!supabase || !user) return
      setTopicQueryLoading(true)
      setTopicQueryError(null)

      const cutoff = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000)
      const { data, error } = await supabase
        .from('content_items')
        .select(
          'topic, engagement_rate, performance_score, viral_potential_score, views, main_message',
        )
        .eq('user_id', user.id)
        .not('topic', 'is', null)
        .gte('created_at', cutoff.toISOString())
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
        main_message: string | null
      }[]

      const map = new Map<
        string,
        {
          sumScore: number
          count: number
          sumEngagement: number
          bestScore: number
          bestMainMessage: string | null
        }
      >()
      for (const r of rows) {
        const t = (r.topic ?? '').trim()
        if (!t) continue
        const key = t
        const rowScore = computeScore(r)
        const prev =
          map.get(key) ?? {
            sumScore: 0,
            count: 0,
            sumEngagement: 0,
            bestScore: -Infinity,
            bestMainMessage: null,
          }
        prev.sumScore += rowScore
        prev.sumEngagement += Number(r.engagement_rate ?? 0)

        // Nimm die "best passende" main_message aus den Zeilen des Topics.
        if (rowScore > prev.bestScore) {
          prev.bestScore = rowScore
          prev.bestMainMessage =
            r.main_message != null ? String(r.main_message) : null
        }
        prev.count += 1
        map.set(key, prev)
      }

      const ranked = Array.from(map.entries())
        .map(([topic, agg]) => ({
          topic,
          score: agg.sumScore / Math.max(1, agg.count),
          count: agg.count,
          avgEngagement: agg.sumEngagement / Math.max(1, agg.count),
          mainMessage: agg.bestMainMessage,
          isCustom: false,
        }))
        .sort((a, b) => b.avgEngagement - a.avgEngagement)
        .slice(0, 15)

      setTopTopics(ranked)
    }
    void loadTopics()
  }, [isHookWizardOpen, user])

  function formatEngagementPercent(value: number) {
    if (!Number.isFinite(value)) return '—'
    const v = Number(value)
    // engagement_rate ist i.d.R. 0..1, wenn >1 dann behandeln wir es als bereits Prozentwert
    const percent = v <= 1 ? v * 100 : v
    if (!Number.isFinite(percent)) return '—'
    return `${Math.round(percent)}%`
  }

  function engagementBadgeClasses(value: number) {
    const v = Number(value)
    const percent = v <= 1 ? v * 100 : v
    if (percent >= 10) return 'bg-emerald-50 text-emerald-700 border-emerald-100'
    if (percent >= 5) return 'bg-indigo-50 text-indigo-700 border-indigo-100'
    return 'bg-rose-50 text-rose-700 border-rose-100'
  }

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
              {actionsLoading ? (
                <p className="col-span-2 text-[11px] text-slate-500">
                  Actions laden…
                </p>
              ) : actionsError ? (
                <p className="col-span-2 text-[11px] text-rose-600">
                  {actionsError}
                </p>
              ) : registeredActions.length === 0 ? (
                <p className="col-span-2 text-[11px] text-slate-500">
                  Keine Actions für diese Plattform eingetragen.
                </p>
              ) : (
                registeredActions.map((a) => {
                  const active = a.action_key === activeActionKey
                  const badgeLabel =
                    a.action_key === 'hooks_generate'
                      ? '10 Varianten'
                      : a.action_key === 'reel_elements_generate'
                        ? 'Remotion'
                        : 'Wizard'

                  return (
                    <button
                      key={`${a.action_key}-${a.platform}`}
                      type="button"
                      onClick={() => {
                        if (a.action_key === 'hooks_generate') {
                          setActiveActionKey('hooks_generate')
                          openHookWizard()
                          return
                        }
                        if (a.action_key === 'reel_elements_generate') {
                          openReelElementsWizard()
                          return
                        }
                        // Für andere Action-Keys (script/cta/...) sind später Templates vorgesehen.
                      }}
                      className={`rounded-3xl border p-4 text-left transition ${
                        active
                          ? 'border-indigo-200 bg-indigo-50'
                          : 'border-slate-100 bg-white/60 hover:bg-slate-50'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <PlatformBadge p={platform} />
                          <p className="text-xs font-semibold text-slate-900">
                            {a.title}
                          </p>
                        </div>
                        <span className="rounded-full bg-slate-900/5 px-2 py-0.5 text-[10px] text-slate-600">
                          {badgeLabel}
                        </span>
                      </div>
                      {a.description ? (
                        <p className="mt-2 text-[11px] text-slate-600">
                          {a.description}
                        </p>
                      ) : (
                        <p className="mt-2 text-[11px] text-slate-600">
                          {a.action_key}
                        </p>
                      )}
                    </button>
                  )
                })
              )}
            </div>
          </Card>

          <Card
            title="Konfiguration"
            description="Diese Inputs steuern die Generierung (Demo)."
          >
            <div className="space-y-3 text-xs">
              <div className="grid gap-3 md:grid-cols-1">
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
            description="Strategie basiert auf deiner Auswahl (Demo)."
          >
            <div className="space-y-2 text-[11px] text-slate-700">
              <p>
                <span className="font-medium">Ziel:</span> {goal}
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
                      Platform: {platform}
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
                  {hookWizardStep === 0
                    ? 'Wähle Topics, die gerade performen'
                    : hookWizardStep === 1
                      ? 'Wähle deine Brand Voice'
                      : hookWizardStep === 2
                        ? 'Wähle Creator(s) zur Orientierung'
                        : 'Füge weitere Punkte hinzu'}
                </p>
                <p className="mt-1 text-[11px] text-slate-500">
                  {hookWizardStep === 0
                    ? 'Topics werden aus deinen `content_items` abgeleitet und nach Engagement-Rate sortiert.'
                    : hookWizardStep === 1
                      ? 'Brand Voice definiert Ton & strategische Leitplanken.'
                      : hookWizardStep === 2
                        ? 'Creator(s) dienen als Content-Referenz.'
                        : 'Ergänze Einwände, Beispiele und gewünschte Richtung.'}
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
                    Schritt {hookWizardStep + 1} von 4
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

                      <div className="mt-3 flex items-center justify-between gap-3">
                        <Button
                          type="button"
                          size="sm"
                          variant="secondary"
                          onClick={() => {
                            setTopicBrowserOpen(true)
                            void loadBrowseTopics()
                          }}
                          disabled={!supabase || !user || topicBrowserLoading}
                        >
                          Themen browsen
                        </Button>
                        <p className="text-[11px] text-slate-500">
                          Sortiert nach Engagement-Rate
                        </p>
                      </div>

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
                                className={`group relative rounded-full border px-3 py-1.5 text-[11px] transition ${
                                  active
                                    ? 'border-indigo-200 bg-indigo-50 text-indigo-700'
                                    : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                                }`}
                                title={`Score: ${t.score.toFixed(1)} · Avg ER: ${(t.avgEngagement * 100).toFixed(1)}%`}
                              >
                                <div className="flex items-center gap-2">
                                  <span className="max-w-[260px] truncate">{t.topic}</span>
                                  {!t.isCustom ? (
                                    <span
                                      className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] ${
                                        engagementBadgeClasses(t.avgEngagement)
                                      }`}
                                      title={`Avg Engagement: ${formatEngagementPercent(t.avgEngagement)}`}
                                    >
                                      {t.avgEngagement >= 0.1 ? (
                                        <TrendingUp className="h-3.5 w-3.5" />
                                      ) : (
                                        <TrendingDown className="h-3.5 w-3.5" />
                                      )}
                                      {formatEngagementPercent(t.avgEngagement)}
                                    </span>
                                  ) : null}
                                </div>

                                {t.mainMessage ? (
                                  <span className="pointer-events-none absolute bottom-full left-1/2 z-50 mb-2 w-[340px] -translate-x-1/2 rounded-3xl border border-slate-200 bg-white p-3 text-left text-[11px] text-slate-700 shadow-xl opacity-0 transition-opacity duration-150 group-hover:opacity-100">
                                    <span className="block text-[10px] font-medium uppercase tracking-[0.14em] text-slate-400">
                                      Main message
                                    </span>
                                    <span className="mt-1 block whitespace-pre-wrap">{t.mainMessage}</span>
                                  </span>
                                ) : null}
                              </button>
                            )
                          })}
                        </div>

                        <div className="mt-4 space-y-2 rounded-3xl border border-slate-200 bg-white/70 p-4">
                          <p className="text-[11px] font-medium text-slate-900">
                            Eigenes Thema hinzufügen
                          </p>
                          <p className="text-[11px] text-slate-500">
                            Optional. Ein einzelnes Thema ergänzen (z.B. „Abnehmen ohne Diät“).
                          </p>
                          <div className="flex items-center gap-2">
                            <input
                              type="text"
                              value={customThemeInput}
                              onChange={(e) => setCustomThemeInput(e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key !== 'Enter') return
                                e.preventDefault()
                                addCustomTopic(customThemeInput)
                              }}
                              placeholder="Eigenes Thema…"
                              className="flex-1 rounded-2xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-800 placeholder:text-slate-400 shadow-sm outline-none"
                            />
                            <Button
                              type="button"
                              size="sm"
                              onClick={() => {
                                addCustomTopic(customThemeInput)
                              }}
                              disabled={!customThemeInput.trim()}
                            >
                              Hinzufügen
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>

                    {topicBrowserOpen && (
                      <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 p-4">
                        <div className="w-full max-w-3xl overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-xl">
                          <div className="flex items-start justify-between gap-3 border-b border-slate-100 px-6 py-4">
                            <div>
                              <p className="text-sm font-semibold text-slate-900">
                                Themen aus deiner Library
                              </p>
                              <p className="mt-1 text-xs text-slate-500">
                                Auswahl durch Klick. Sortierung nach Engagement-Rate (letzte 2 Wochen).
                              </p>
                            </div>
                            <Button
                              type="button"
                              size="sm"
                              variant="secondary"
                              onClick={() => setTopicBrowserOpen(false)}
                            >
                              Schließen
                            </Button>
                          </div>

                          <div className="max-h-[60vh] overflow-y-auto px-6 py-5">
                            {topicBrowserLoading ? (
                              <p className="text-xs text-slate-500">Lade Themen…</p>
                            ) : topicBrowserError ? (
                              <p className="text-xs text-rose-600">
                                {topicBrowserError}
                              </p>
                            ) : browseTopics.length === 0 ? (
                              <p className="text-xs text-slate-500">
                                Keine Topics gefunden.
                              </p>
                            ) : (
                              <div className="space-y-2">
                                {browseTopics.map((t) => {
                                  const active = topicSelection.includes(t.topic)
                                  return (
                                    <button
                                      key={t.topic}
                                      type="button"
                                      onClick={() => toggleTopic(t.topic)}
                                      className={`w-full rounded-2xl border px-4 py-3 text-left transition ${
                                        active
                                          ? 'border-indigo-200 bg-indigo-50 text-indigo-700'
                                          : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                                      }`}
                                    >
                                      <div className="flex items-center justify-between gap-3">
                                        <span className="min-w-0 truncate text-[11px] font-medium">
                                          {t.topic}
                                        </span>
                                        <span
                                          className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] ${engagementBadgeClasses(
                                            t.avgEngagement,
                                          )}`}
                                          title={`Avg Engagement: ${formatEngagementPercent(
                                            t.avgEngagement,
                                          )}`}
                                        >
                                          {formatEngagementPercent(t.avgEngagement)}
                                        </span>
                                      </div>
                                      {t.mainMessage ? (
                                        <span className="mt-1 block line-clamp-2 text-[10px] leading-snug text-slate-500">
                                          {t.mainMessage}
                                        </span>
                                      ) : null}
                                    </button>
                                  )
                                })}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {hookWizardStep === 1 && (
                  <div className="space-y-3">
                    <div className="rounded-3xl bg-slate-50 p-4">
                      <p className="text-[11px] font-medium text-slate-900">
                        Schritt 2: Brand Voice auswählen
                      </p>
                      <p className="mt-1 text-[11px] text-slate-500">
                        Wähle die Brand Voice, an der sich der Ton & die Strategie orientieren sollen.
                      </p>

                      {brandVoicesLoading ? (
                        <p className="mt-3 text-[11px] text-slate-500">Brand Voices laden…</p>
                      ) : brandVoicesError ? (
                        <p className="mt-3 text-[11px] text-rose-600">{brandVoicesError}</p>
                      ) : brandVoices.length === 0 ? (
                        <p className="mt-3 text-[11px] text-slate-500">
                          Noch keine Brand Voices vorhanden.
                        </p>
                      ) : (
                        <div className="mt-3 grid gap-2 sm:grid-cols-2">
                          {brandVoices.map((v) => {
                            const active = selectedBrandVoiceId === v.id
                            return (
                              <button
                                key={v.id}
                                type="button"
                                onClick={() => setSelectedBrandVoiceId(v.id)}
                                className={`rounded-3xl border p-3 text-left transition ${
                                  active
                                    ? 'border-indigo-200 bg-indigo-50'
                                    : 'border-slate-200 bg-white hover:bg-slate-50'
                                }`}
                              >
                                <div className="flex items-start justify-between gap-3">
                                  <div className="min-w-0">
                                    <p className="truncate text-[11px] font-semibold text-slate-900">
                                      {v.name}
                                    </p>
                                    <p className="mt-1 text-[10px] text-slate-500">
                                      {v.ai_brand_voice ? 'AI-Voice bereit' : 'AI-Voice noch nicht gesetzt'}
                                    </p>
                                  </div>
                                  {active ? (
                                    <span className="rounded-full bg-indigo-100 px-2 py-0.5 text-[10px] font-medium text-indigo-700">
                                      Auswahl
                                    </span>
                                  ) : null}
                                </div>
                              </button>
                            )
                          })}
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {hookWizardStep === 2 && (
                  <div className="space-y-3">
                    <div className="rounded-3xl bg-slate-50 p-4">
                      <p className="text-[11px] font-medium text-slate-900">
                        Schritt 3: Creator(s) selektieren
                      </p>
                      <p className="mt-1 text-[11px] text-slate-500">
                        Wähle explizit die Creators, an deren Content du dich orientieren willst.
                      </p>

                      {creatorsLoading ? (
                        <p className="mt-3 text-[11px] text-slate-500">Creators laden…</p>
                      ) : creatorsError ? (
                        <p className="mt-3 text-[11px] text-rose-600">{creatorsError}</p>
                      ) : creators.length === 0 ? (
                        <p className="mt-3 text-[11px] text-slate-500">
                          Keine Creators gefunden (für Plattform: {platform}).
                        </p>
                      ) : (
                        <div className="mt-3 space-y-2">
                          {creators.map((c) => {
                            const active = selectedCreatorIds.includes(c.id)
                            return (
                              <button
                                key={c.id}
                                type="button"
                                onClick={() => toggleCreator(c.id)}
                                className={`w-full rounded-3xl border px-4 py-3 text-left transition ${
                                  active
                                    ? 'border-indigo-200 bg-indigo-50'
                                    : 'border-slate-200 bg-white hover:bg-slate-50'
                                }`}
                              >
                                <div className="flex items-center justify-between gap-3">
                                  <div className="min-w-0">
                                    <p className="truncate text-[11px] font-semibold text-slate-900">
                                      {c.creator_name}
                                    </p>
                                    <p className="mt-1 truncate text-[10px] text-slate-500">
                                      @{c.creator_handle}
                                    </p>
                                    <p className="mt-1 text-[10px] text-slate-400">
                                      {formatFollowers(getCreatorFollowers(c))} Follower
                                    </p>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <span className="rounded-full bg-slate-900/5 px-2 py-0.5 text-[10px] text-slate-600">
                                      {c.platform}
                                    </span>
                                    {active ? (
                                      <span className="rounded-full bg-indigo-100 px-2 py-0.5 text-[10px] font-medium text-indigo-700">
                                        ✓
                                      </span>
                                    ) : null}
                                  </div>
                                </div>
                              </button>
                            )
                          })}
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {hookWizardStep === 3 && (
                  <div className="space-y-3">
                    <div className="rounded-3xl bg-slate-50 p-4">
                      <p className="text-[11px] font-medium text-slate-900">
                        Schritt 4: Weitere Punkte (Freitext)
                      </p>
                      <p className="mt-1 text-[11px] text-slate-500">
                        Was willst du zusätzlich reinbringen? (z.B. Einwände, Beispiele, gewünschte Richtung)
                      </p>

                      <textarea
                        rows={5}
                        className="mt-3 w-full resize-none rounded-2xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-800 placeholder:text-slate-400"
                        placeholder="z.B.\n- Nutze mehr direkte Ansprache\n- Baue einen konkreten Fall ein\n- Hebe besonders den Nutzen für Selbstständige hervor"
                        value={additionalPoints}
                        onChange={(e) => setAdditionalPoints(e.target.value)}
                      />

                      <div className="mt-3 rounded-3xl border border-slate-200 bg-white/70 p-3 text-[11px] text-slate-700">
                        <p className="font-medium text-slate-900">Preview</p>
                        <p className="mt-1">
                          Brand Voice:{' '}
                          <span className="font-medium">
                            {brandVoices.find((v) => v.id === selectedBrandVoiceId)?.name ?? '—'}
                          </span>
                        </p>
                        <p className="mt-1">
                          Creators:{' '}
                          <span className="font-medium">
                            {selectedCreatorIds.length === 0
                              ? '—'
                              : selectedCreatorIds
                                  .map(
                                    (id) =>
                                      creators.find((c) => c.id === id)?.creator_name ?? '',
                                  )
                                  .filter(Boolean)
                                  .join(', ')}
                          </span>
                        </p>
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
                    <span className="font-medium">Ziel:</span> {goal}
                  </p>
                  <p className="mt-1 text-[11px] text-slate-700">
                    <span className="font-medium">Brand Voice:</span>{' '}
                    {brandVoices.find((v) => v.id === selectedBrandVoiceId)?.name ??
                      '—'}
                  </p>
                  <p className="mt-1 text-[11px] text-slate-700">
                    <span className="font-medium">Creators:</span>{' '}
                    {selectedCreatorIds.length === 0
                      ? '—'
                      : selectedCreatorIds
                          .map(
                            (id) =>
                              creators.find((c) => c.id === id)?.creator_name ?? '',
                          )
                          .filter(Boolean)
                          .join(', ')}
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
                  {hookWizardStep < 3 ? (
                    <Button
                      type="button"
                      size="sm"
                      disabled={
                        (hookWizardStep === 0 && topicSelection.length === 0) ||
                        (hookWizardStep === 1 && !selectedBrandVoiceId) ||
                        (hookWizardStep === 2 && selectedCreatorIds.length === 0)
                      }
                      onClick={() => {
                        if (hookWizardStep === 0) setTopicBrowserOpen(false)
                        setHookWizardStep((s) => Math.min(3, s + 1))
                      }}
                    >
                      Weiter
                    </Button>
                  ) : (
                    <Button
                      type="button"
                      size="sm"
                      onClick={() => {
                        void startTask()
                      }}
                      disabled={
                        topicSelection.length === 0 ||
                        !selectedBrandVoiceId ||
                        selectedCreatorIds.length === 0 ||
                        startLoading
                      }
                    >
                      {startLoading ? 'Starte…' : 'Aufgabe starten'}
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {isReelElementsWizardOpen && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-slate-900/25 p-4">
          <div className="w-full max-w-2xl overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-[0_24px_80px_rgba(15,23,42,0.18)]">
            <div className="flex items-start justify-between gap-3 border-b border-slate-100 px-6 py-4">
              <div>
                <p className="text-[10px] font-medium uppercase tracking-[0.2em] text-slate-400">
                  Reel-Elemente generieren
                </p>
                <p className="mt-1 text-sm font-semibold text-slate-900">
                  Dimension wählen und Prompt beschreiben
                </p>
                <p className="mt-1 text-[11px] text-slate-500">
                  Diese Action nutzt Remotion als Render-Library.
                </p>
              </div>
              <button
                type="button"
                onClick={closeReelElementsWizard}
                className="rounded-full bg-slate-900/5 px-3 py-1 text-[11px] text-slate-600 hover:bg-slate-900/10"
              >
                Schließen
              </button>
            </div>
            <div className="space-y-4 px-6 py-5">
              <div className="space-y-1.5">
                <label className="text-[11px] font-medium text-slate-700">Dimension</label>
                <select
                  className="w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-700"
                  value={reelDimension}
                  onChange={(e) => setReelDimension(e.target.value)}
                >
                  <option value="1080x1920">1080x1920 (Reel / 9:16)</option>
                  <option value="1080x1080">1080x1080 (Square / 1:1)</option>
                  <option value="1920x1080">1920x1080 (Landscape / 16:9)</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-[11px] font-medium text-slate-700">Prompt</label>
                <textarea
                  rows={6}
                  className="w-full resize-none rounded-2xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-800 placeholder:text-slate-400"
                  placeholder="Beschreibe genau, welche Reel-Elemente erzeugt werden sollen (Szene, Stil, Texte, Motion, Farben etc.)."
                  value={reelPrompt}
                  onChange={(e) => setReelPrompt(e.target.value)}
                />
              </div>

              <div className="rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 text-[11px] text-slate-600">
                Engine: <span className="font-medium text-slate-800">Remotion</span> · Repo:
                {' '}
                <a
                  href="https://github.com/remotion-dev/remotion"
                  target="_blank"
                  rel="noreferrer"
                  className="text-indigo-600 hover:text-indigo-700"
                >
                  remotion-dev/remotion
                </a>
              </div>

              <div className="flex justify-end gap-2 pt-1">
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={closeReelElementsWizard}
                >
                  Abbrechen
                </Button>
                <Button
                  type="button"
                  size="sm"
                  onClick={() => {
                    void startReelElementsTask()
                  }}
                  disabled={!reelPrompt.trim() || reelStartLoading}
                >
                  {reelStartLoading ? 'Starte…' : 'Aufgabe starten'}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

