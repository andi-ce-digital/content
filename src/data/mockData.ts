export type ContentItem = {
  id: string
  platform: 'instagram' | 'tiktok' | 'youtube'
  creatorName: string
  creatorHandle: string
  title?: string
  hook: string
  firstSentence?: string
  cta?: string
  views: number
  likes: number
  comments: number
  shares: number
  durationSeconds: number
  topic: string
  contentAngle: string
  hookType: string
  engagementRate?: number
  performanceScore?: number
  viralPotentialScore?: number
  contentStage?: string
  emotion?: string
  /** Thumbnail/Preview-Bild aus thumbnail_url (DB) */
  thumbnailUrl?: string | null
  /** Video-URL aus media_url (DB) */
  mediaUrl?: string | null

  // Extra DB-Fields für "detaillierte Stats" (optional)
  frameworkType?: string | null
  hookFramework?: string | null
  openingLine?: string | null
  mainMessage?: string | null
  primaryPainPoint?: string | null
  primaryDesire?: string | null
  viralTrigger?: string | null
  storytellingType?: string | null
  contentFormat?: string | null
  targetAudience?: string | null
  patternInterrupts?: string[] | null
  ctaSource?: string | null

  hookStrengthScore?: number | null
  likeRate?: number | null
  commentRate?: number | null
  saveRate?: number | null
  shareRate?: number | null
  reachRatio?: number | null

  transcriptDetail?: unknown | null

  hookStart?: number | null
  hookEnd?: number | null
  hookDuration?: number | null
  ctaStart?: number | null
  ctaEnd?: number | null
  bodyDuration?: number | null
  timeToHook?: number | null

  /** Aus `user_account_content` (eigene verbundene Accounts) */
  isOwnAccountContent?: boolean
  /** Link zum Original-Post (z. B. Instagram/TikTok) */
  sourcePostUrl?: string | null
}

export const contentLibraryMock: ContentItem[] = [
  {
    id: '0e183d1a-51bd-465e-bdfa-33dd176c0ece',
    platform: 'instagram',
    creatorName: 'JP',
    creatorHandle: 'jpegan7',
    title: 'Skillaufbau statt nur mehr Geld',
    hook: 'You can either choose to do everything on your own...',
    firstSentence:
      "You can either choose to do everything in your own, or you can choose to get someone who's been in the position that you wanna be in.",
    cta: 'Kommentiere 30k, um an meinem Life-Training teilzunehmen.',
    views: 336,
    likes: 31,
    comments: 5,
    shares: 0,
    durationSeconds: 33.437,
    topic: 'Persönliche Entwicklung & finanzielle Freiheit',
    contentAngle:
      'Erfolgsstrategie durch Mentoring und gezieltes Lernen zur Vermeidung von Fehlern',
    hookType: 'opportunity',
    engagementRate: 0.1071,
    performanceScore: 0.7,
    viralPotentialScore: 0.68,
    contentStage: 'lead_generation',
    emotion: 'freedom',
    thumbnailUrl: 'https://picsum.photos/seed/reel1/400/712',
  },
  {
    id: '0e80c77b-8bc3-4e18-899b-c9c163c4f6d1',
    platform: 'instagram',
    creatorName: 'JP',
    creatorHandle: 'jpegan7',
    title: 'Deine Einwände blockieren deinen Umsatz',
    hook: "Because if you knew you couldn't fail, like, would you do it?",
    firstSentence:
      "Because if you knew you couldn't fail, like, would you do it?",
    cta: 'Kommentiere 30k, um am kostenlosen Training teilzunehmen.',
    views: 1204,
    likes: 88,
    comments: 5,
    shares: 0,
    durationSeconds: 53.058,
    topic: 'Überwindung von Verkaufs-Hürden und Einwänden im Vertrieb',
    contentAngle:
      'Echte Ängste und Einwände identifizieren, um sie individuell zu lösen',
    hookType: 'question',
    engagementRate: 0.0772,
    performanceScore: 0.8,
    viralPotentialScore: 0.73,
    contentStage: 'education',
    emotion: 'curiosity',
    thumbnailUrl: 'https://picsum.photos/seed/reel2/400/712',
  },
]

export const exampleStrategy = {
  strategy_summary: {
    sales_psychology_layer:
      'NEPQ als Grundstruktur (Problem → Konsequenz → Lösungsvision → CTA) kombiniert mit Skill Mastery Anti-Busyness-Frame.',
    chosen_hook_pattern:
      'Contrarian Hook – widerspricht dem dominanten Glaubenssatz der Zielgruppe.',
    chosen_hook_framework:
      'Hormozi-Style: kurz, direkt, harter Kontrast – provoziert sofortigen Widerspruch oder Zustimmung.',
    chosen_viral_trigger:
      'Anti-Konsens-Statement + Selbsterkenntnis-Trigger (Zuschauer fühlt sich ertappt).',
    chosen_storytelling_type:
      'Progressions-Story mit Zahlen (25% → 40% Close Rate) + Hidden Mechanism Reveal.',
    chosen_cta_pattern:
      'Meinungsfrage CTA – niedrigschwellig, treibt Kommentare, fordert zur Selbstreflexion auf.',
    why_this_should_work:
      'Vertriebler haben eine starke Identität rund um „Hustle & mehr Calls“. Diesen Glaubenssatz zu challengen erzeugt Kommentare & Shares.',
  },
}

