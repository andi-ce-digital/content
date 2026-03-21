import { useEffect, useMemo, useState } from 'react'
import { Card } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'
import { Select } from '../components/ui/Select'
import { Textarea } from '../components/ui/Textarea'
import { supabase } from '../lib/supabaseClient'
import { useAuth } from '../auth/AuthContext'
import {
  CalendarCog,
  CalendarCheck2,
  ChevronLeft,
  ChevronRight,
  Clock3,
  Save,
  Sparkles,
  Target,
  X,
} from 'lucide-react'

type PlanItem = {
  id: string
  title: string
  type: 'reel' | 'carousel' | 'story' | 'post'
  status: 'draft' | 'planned' | 'ready'
  time: string
}

type UserAccountOption = {
  id: string
  platform: string
  handle: string
  display_name: string | null
}

type ContentPlanSettingsRow = {
  id: string
  user_account_id: string
  timezone: string
  filming_days: number[]
  editing_days: number[]
  posting_days: number[]
  filming_time: string | null
  editing_time: string | null
  posting_time: string | null
  reels_per_week: number | null
  notes: string | null
}

const demoPlanByDate: Record<string, PlanItem[]> = {
  '2026-03-02': [
    {
      id: 'p0',
      title: 'Story: Wochenfokus & KPI-Ziel',
      type: 'story',
      status: 'planned',
      time: '08:15',
    },
  ],
  '2026-03-06': [
    {
      id: 'p0b',
      title: 'Reel: 3 Hook-Typen in 30 Sekunden',
      type: 'reel',
      status: 'ready',
      time: '11:00',
    },
  ],
  '2026-03-19': [
    {
      id: 'p1',
      title: 'Hook-Serie: Warum mehr Content nicht mehr Umsatz macht',
      type: 'reel',
      status: 'ready',
      time: '09:30',
    },
    {
      id: 'p2',
      title: 'Story-Sequenz: Behind the Scenes vom Editing Workflow',
      type: 'story',
      status: 'planned',
      time: '13:00',
    },
    {
      id: 'p3',
      title: 'Carousel: 5 häufige Hook-Fehler',
      type: 'carousel',
      status: 'draft',
      time: '18:00',
    },
  ],
  '2026-03-20': [
    {
      id: 'p4',
      title: 'Reel: 3 Creator-Muster aus den letzten 7 Tagen',
      type: 'reel',
      status: 'planned',
      time: '10:00',
    },
  ],
  '2026-03-24': [
    {
      id: 'p5',
      title: 'Post: Weekly Recap + CTA',
      type: 'post',
      status: 'draft',
      time: '17:30',
    },
  ],
  '2026-03-27': [
    {
      id: 'p6',
      title: 'Carousel: 7 Learnings aus der Woche',
      type: 'carousel',
      status: 'planned',
      time: '12:00',
    },
    {
      id: 'p7',
      title: 'Story Poll: Nächstes Wunschthema',
      type: 'story',
      status: 'planned',
      time: '19:00',
    },
  ],
}

function toDateKey(value: Date) {
  const y = value.getFullYear()
  const m = String(value.getMonth() + 1).padStart(2, '0')
  const d = String(value.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

function statusPill(status: PlanItem['status']) {
  if (status === 'ready') return 'bg-emerald-50 text-emerald-700 border-emerald-100'
  if (status === 'planned') return 'bg-indigo-50 text-indigo-700 border-indigo-100'
  return 'bg-slate-100 text-slate-700 border-slate-200'
}

function typePill(type: PlanItem['type']) {
  if (type === 'reel') return 'bg-fuchsia-50 text-fuchsia-700 border-fuchsia-100'
  if (type === 'carousel') return 'bg-sky-50 text-sky-700 border-sky-100'
  if (type === 'story') return 'bg-amber-50 text-amber-700 border-amber-100'
  return 'bg-slate-100 text-slate-700 border-slate-200'
}

const weekDayLabels = ['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So']
const monthLabels = [
  'Januar',
  'Februar',
  'März',
  'April',
  'Mai',
  'Juni',
  'Juli',
  'August',
  'September',
  'Oktober',
  'November',
  'Dezember',
]

const dayOptions = [
  { id: 1, short: 'Mo' },
  { id: 2, short: 'Di' },
  { id: 3, short: 'Mi' },
  { id: 4, short: 'Do' },
  { id: 5, short: 'Fr' },
  { id: 6, short: 'Sa' },
  { id: 0, short: 'So' },
]

function startOfWeekMonday(date: Date) {
  const d = new Date(date)
  const day = d.getDay()
  const shift = day === 0 ? -6 : 1 - day
  d.setDate(d.getDate() + shift)
  d.setHours(0, 0, 0, 0)
  return d
}

function addDays(date: Date, amount: number) {
  const d = new Date(date)
  d.setDate(d.getDate() + amount)
  return d
}

function sameDay(a: Date, b: Date) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  )
}

function buildMonthGrid(monthCursor: Date) {
  const monthStart = new Date(monthCursor.getFullYear(), monthCursor.getMonth(), 1)
  const gridStart = startOfWeekMonday(monthStart)
  const days: Date[] = []
  for (let i = 0; i < 42; i += 1) {
    days.push(addDays(gridStart, i))
  }
  return days
}

export function ContentPlanPage() {
  const { user } = useAuth()
  const [selectedDate, setSelectedDate] = useState<Date>(new Date(2026, 2, 19))
  const [monthCursor, setMonthCursor] = useState<Date>(new Date(2026, 2, 1))
  const [quickIdea, setQuickIdea] = useState('')
  const [settingsOpen, setSettingsOpen] = useState(false)

  const [accountsLoading, setAccountsLoading] = useState(false)
  const [accountsError, setAccountsError] = useState<string | null>(null)
  const [accounts, setAccounts] = useState<UserAccountOption[]>([])
  const [selectedAccountId, setSelectedAccountId] = useState('')

  const [settingsLoading, setSettingsLoading] = useState(false)
  const [settingsError, setSettingsError] = useState<string | null>(null)
  const [savingSettings, setSavingSettings] = useState(false)
  const [saveStateLabel, setSaveStateLabel] = useState<string | null>(null)

  const [timezone, setTimezone] = useState('Europe/Berlin')
  const [filmingDays, setFilmingDays] = useState<number[]>([])
  const [editingDays, setEditingDays] = useState<number[]>([])
  const [postingDays, setPostingDays] = useState<number[]>([])
  const [filmingTime, setFilmingTime] = useState('')
  const [editingTime, setEditingTime] = useState('')
  const [postingTime, setPostingTime] = useState('')
  const [reelsPerWeek, setReelsPerWeek] = useState('3')
  const [notes, setNotes] = useState('')

  const selectedDateKey = useMemo(() => toDateKey(selectedDate), [selectedDate])
  const dayItems = demoPlanByDate[selectedDateKey] ?? []
  const monthDays = useMemo(() => buildMonthGrid(monthCursor), [monthCursor])
  const monthTitle = `${monthLabels[monthCursor.getMonth()]} ${monthCursor.getFullYear()}`
  const weekPlanned = useMemo(
    () => Object.values(demoPlanByDate).reduce((sum, items) => sum + items.length, 0),
    [],
  )
  const weekTarget = Number(reelsPerWeek || 0)

  const selectedAccountLabel = useMemo(() => {
    const current = accounts.find((a) => a.id === selectedAccountId)
    if (!current) return 'Kein Account ausgewählt'
    const name = current.display_name?.trim() || current.handle
    return `${name} (${current.platform})`
  }, [accounts, selectedAccountId])

  function toggleDay(setter: (value: number[] | ((prev: number[]) => number[])) => void, day: number) {
    setter((prev) => (prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]))
  }

  function sortedUniqueDays(days: number[]) {
    return [...new Set(days)].sort((a, b) => {
      const toRank = (v: number) => (v === 0 ? 7 : v)
      return toRank(a) - toRank(b)
    })
  }

  function applySettingsRow(row: ContentPlanSettingsRow | null) {
    if (!row) {
      setTimezone('Europe/Berlin')
      setFilmingDays([])
      setEditingDays([])
      setPostingDays([])
      setFilmingTime('')
      setEditingTime('')
      setPostingTime('')
      setReelsPerWeek('3')
      setNotes('')
      return
    }
    setTimezone(row.timezone || 'Europe/Berlin')
    setFilmingDays(Array.isArray(row.filming_days) ? row.filming_days : [])
    setEditingDays(Array.isArray(row.editing_days) ? row.editing_days : [])
    setPostingDays(Array.isArray(row.posting_days) ? row.posting_days : [])
    setFilmingTime(row.filming_time ?? '')
    setEditingTime(row.editing_time ?? '')
    setPostingTime(row.posting_time ?? '')
    setReelsPerWeek(
      row.reels_per_week !== null && row.reels_per_week !== undefined
        ? String(row.reels_per_week)
        : '3',
    )
    setNotes(row.notes ?? '')
  }

  async function loadUserAccounts() {
    if (!supabase || !user) return
    setAccountsLoading(true)
    setAccountsError(null)
    const { data, error } = await supabase
      .from('user_accounts')
      .select('id, platform, handle, display_name')
      .eq('user_id', user.id)
      .order('created_at', { ascending: true })
    setAccountsLoading(false)
    if (error) {
      setAccountsError(error.message)
      setAccounts([])
      return
    }
    const list = (data ?? []) as UserAccountOption[]
    setAccounts(list)
    setSelectedAccountId((prev) => prev || list[0]?.id || '')
  }

  async function loadContentPlanSettings(userAccountId: string) {
    if (!supabase || !user || !userAccountId) {
      applySettingsRow(null)
      return
    }
    setSettingsLoading(true)
    setSettingsError(null)
    const { data, error } = await supabase
      .from('content_plan_settings')
      .select(
        'id, user_account_id, timezone, filming_days, editing_days, posting_days, filming_time, editing_time, posting_time, reels_per_week, notes',
      )
      .eq('user_id', user.id)
      .eq('user_account_id', userAccountId)
      .maybeSingle()
    setSettingsLoading(false)
    if (error) {
      setSettingsError(error.message)
      applySettingsRow(null)
      return
    }
    applySettingsRow((data as ContentPlanSettingsRow | null) ?? null)
  }

  async function saveSettings() {
    if (!supabase || !user || !selectedAccountId || savingSettings) return
    setSavingSettings(true)
    setSaveStateLabel(null)
    const payload = {
      user_id: user.id,
      user_account_id: selectedAccountId,
      timezone: timezone || 'Europe/Berlin',
      filming_days: sortedUniqueDays(filmingDays),
      editing_days: sortedUniqueDays(editingDays),
      posting_days: sortedUniqueDays(postingDays),
      filming_time: filmingTime || null,
      editing_time: editingTime || null,
      posting_time: postingTime || null,
      reels_per_week: reelsPerWeek.trim() ? Number(reelsPerWeek) : null,
      notes: notes.trim() || null,
      updated_at: new Date().toISOString(),
    }
    const { error } = await supabase
      .from('content_plan_settings')
      .upsert(payload, { onConflict: 'user_id,user_account_id' })
    setSavingSettings(false)
    if (error) {
      setSaveStateLabel('Fehler beim Speichern.')
      return
    }
    setSaveStateLabel('Gespeichert.')
    setTimeout(() => setSaveStateLabel(null), 1800)
  }

  useEffect(() => {
    void loadUserAccounts()
  }, [user?.id])

  useEffect(() => {
    if (!selectedAccountId) return
    void loadContentPlanSettings(selectedAccountId)
  }, [selectedAccountId, user?.id])

  return (
    <div className="mx-auto max-w-7xl space-y-4">
      <div className="relative overflow-hidden rounded-3xl border border-slate-100 bg-gradient-to-br from-white via-indigo-50/40 to-sky-50/40 p-5 shadow-sm">
        <div className="pointer-events-none absolute right-0 top-0 h-28 w-56 rounded-full bg-indigo-100/50 blur-3xl" />
        <p className="text-[10px] font-medium uppercase tracking-[0.2em] text-slate-400">
          Content Plan
        </p>
        <h1 className="mt-1 text-lg font-semibold tracking-tight text-slate-900">
          Plane deinen Content wie ein Redaktionssystem
        </h1>
        <p className="mt-1 text-xs text-slate-500">
          Kalender, Tagesplanung und Prioritäten für Produktion und Publishing.
        </p>
        <div className="mt-4 flex flex-wrap items-center gap-2">
          <span className="rounded-full border border-slate-200 bg-white px-3 py-1 text-[11px] text-slate-700">
            Account: <span className="font-medium text-slate-900">{selectedAccountLabel}</span>
          </span>
          <Button type="button" size="sm" variant="secondary" onClick={() => setSettingsOpen(true)}>
            <CalendarCog className="mr-1 h-3.5 w-3.5" />
            Plan Einstellungen
          </Button>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-[1.7fr,1fr]">
        <Card
          title="Kalenderansicht"
          description="Wie im Google-Kalender: du siehst pro Tag direkt, was ansteht."
        >
          <div className="rounded-2xl border border-slate-200 bg-white">
            <div className="flex items-center justify-between border-b border-slate-100 px-3 py-2.5">
              <p className="text-sm font-semibold text-slate-900">{monthTitle}</p>
              <div className="flex items-center gap-1.5">
                <Button
                  type="button"
                  size="sm"
                  variant="secondary"
                  onClick={() =>
                    setMonthCursor(
                      new Date(monthCursor.getFullYear(), monthCursor.getMonth() - 1, 1),
                    )
                  }
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="secondary"
                  onClick={() =>
                    setMonthCursor(
                      new Date(monthCursor.getFullYear(), monthCursor.getMonth() + 1, 1),
                    )
                  }
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-7 border-b border-slate-100">
              {weekDayLabels.map((label) => (
                <div
                  key={label}
                  className="px-2 py-2 text-center text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-400"
                >
                  {label}
                </div>
              ))}
            </div>

            <div className="grid grid-cols-7">
              {monthDays.map((d) => {
                const key = toDateKey(d)
                const items = demoPlanByDate[key] ?? []
                const inCurrentMonth = d.getMonth() === monthCursor.getMonth()
                const isSelected = sameDay(d, selectedDate)
                const isToday = sameDay(d, new Date())
                const preview = items.slice(0, 2)
                const overflow = Math.max(0, items.length - preview.length)

                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setSelectedDate(d)}
                    className={`min-h-[108px] border-b border-r border-slate-100 p-1.5 text-left transition ${
                      isSelected
                        ? 'bg-indigo-50/70 ring-1 ring-inset ring-indigo-200'
                        : 'hover:bg-slate-50'
                    }`}
                  >
                    <div className="mb-1 flex items-center justify-between">
                      <span
                        className={`inline-flex h-6 w-6 items-center justify-center rounded-full text-[11px] font-semibold ${
                          isSelected
                            ? 'bg-indigo-600 text-white'
                            : isToday
                              ? 'bg-indigo-100 text-indigo-700'
                              : inCurrentMonth
                                ? 'text-slate-900'
                                : 'text-slate-300'
                        }`}
                      >
                        {d.getDate()}
                      </span>
                      {items.length > 0 ? (
                        <span className="rounded-full bg-slate-100 px-1.5 py-0.5 text-[10px] text-slate-600">
                          {items.length}
                        </span>
                      ) : null}
                    </div>

                    <div className="space-y-1">
                      {preview.map((item) => (
                        <div
                          key={item.id}
                          className={`truncate rounded-md border px-1.5 py-0.5 text-[10px] ${typePill(
                            item.type,
                          )}`}
                        >
                          {item.time} {item.title}
                        </div>
                      ))}
                      {overflow > 0 ? (
                        <div className="text-[10px] font-medium text-slate-500">
                          +{overflow} mehr
                        </div>
                      ) : null}
                    </div>
                  </button>
                )
              })}
            </div>
          </div>
        </Card>

        <div className="space-y-4">
          <Card
            title="Tagesplan"
            description="Alle geplanten Inhalte für den ausgewählten Tag."
          >
            <div className="mb-2 rounded-xl bg-slate-50 px-3 py-2 text-[11px] text-slate-600">
              Ausgewähltes Datum:{' '}
              <span className="font-medium text-slate-900">{selectedDateKey}</span>
            </div>
            {dayItems.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50/60 p-4 text-xs text-slate-500">
                Für diesen Tag sind noch keine Inhalte geplant.
              </div>
            ) : (
              <div className="space-y-2">
                {dayItems.map((item) => (
                  <div
                    key={item.id}
                    className="rounded-2xl border border-slate-200 bg-white px-3 py-3 shadow-sm"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="truncate text-xs font-semibold text-slate-900">{item.title}</p>
                        <div className="mt-1 flex items-center gap-2 text-[11px] text-slate-500">
                          <Clock3 className="h-3.5 w-3.5" />
                          <span>{item.time}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span
                          className={`rounded-full border px-2 py-0.5 text-[10px] font-medium ${typePill(item.type)}`}
                        >
                          {item.type}
                        </span>
                        <span
                          className={`rounded-full border px-2 py-0.5 text-[10px] font-medium ${statusPill(item.status)}`}
                        >
                          {item.status}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>

          <div className="grid gap-4 md:grid-cols-3">
            <Card title="Slots geplant" description="Aktuelle Tagesbelegung">
              <div className="flex items-center gap-2 text-sm font-semibold text-slate-900">
                <CalendarCheck2 className="h-4 w-4 text-indigo-600" />
                {dayItems.length} Slots
              </div>
            </Card>
            <Card title="Ready to publish" description="Direkt veröffentlichbar">
              <div className="flex items-center gap-2 text-sm font-semibold text-slate-900">
                <Target className="h-4 w-4 text-emerald-600" />
                {dayItems.filter((x) => x.status === 'ready').length} Inhalte
              </div>
            </Card>
            <Card title="Wochenziel" description="Aus deinen Plan-Einstellungen">
              <div className="space-y-1 text-sm">
                <p className="font-semibold text-slate-900">{weekTarget || 0} Reels / Woche</p>
                <p className="text-[11px] text-slate-500">
                  Aktuell im Demo-Plan: {weekPlanned} Inhalte insgesamt
                </p>
              </div>
            </Card>
          </div>

          <Card title="Creative Input" description="Schnelle Idee parken">
            <div className="space-y-2">
              <Input
                label="Neue Idee"
                value={quickIdea}
                onChange={(e) => setQuickIdea(e.target.value)}
                placeholder="z.B. Reel über Hook-Muster"
              />
              <Button size="sm" variant="secondary" disabled={!quickIdea.trim()}>
                <Sparkles className="mr-1 h-3.5 w-3.5" />
                Idee merken
              </Button>
            </div>
          </Card>
        </div>
      </div>

      {settingsOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 p-4">
          <div className="w-full max-w-3xl overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-2xl">
            <div className="flex items-start justify-between gap-3 border-b border-slate-100 px-6 py-4">
              <div>
                <p className="text-sm font-semibold text-slate-900">Content Plan Einstellungen</p>
                <p className="mt-1 text-xs text-slate-500">
                  Definiere pro Account deine Drehtage, Bearbeitungstage und Publishing-Rhythmus.
                </p>
              </div>
              <Button type="button" size="sm" variant="secondary" onClick={() => setSettingsOpen(false)}>
                <X className="h-4 w-4" />
              </Button>
            </div>

            <div className="max-h-[72vh] space-y-4 overflow-y-auto px-6 py-5">
              {accountsLoading ? (
                <p className="text-xs text-slate-500">Accounts laden…</p>
              ) : accountsError ? (
                <p className="text-xs text-rose-600">{accountsError}</p>
              ) : accounts.length === 0 ? (
                <p className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-3 text-xs text-slate-500">
                  Du hast noch keinen `user_account`. Bitte erst Account anlegen.
                </p>
              ) : (
                <>
                  <Select
                    label="Für welchen Account gilt der Plan?"
                    value={selectedAccountId}
                    onChange={setSelectedAccountId}
                    options={accounts.map((a) => ({
                      value: a.id,
                      label: `${a.display_name || a.handle} (${a.platform})`,
                    }))}
                  />

                  {settingsLoading ? (
                    <p className="text-xs text-slate-500">Einstellungen laden…</p>
                  ) : settingsError ? (
                    <p className="text-xs text-rose-600">{settingsError}</p>
                  ) : (
                    <>
                      <div className="grid gap-3 md:grid-cols-2">
                        <Input
                          label="Timezone"
                          value={timezone}
                          onChange={(e) => setTimezone(e.target.value)}
                          placeholder="Europe/Berlin"
                        />
                        <Input
                          label="Reels pro Woche"
                          type="number"
                          min={0}
                          value={reelsPerWeek}
                          onChange={(e) => setReelsPerWeek(e.target.value)}
                          placeholder="3"
                        />
                      </div>

                      <div className="grid gap-3 md:grid-cols-3">
                        <Input
                          label="Dreh-Uhrzeit (optional)"
                          value={filmingTime}
                          onChange={(e) => setFilmingTime(e.target.value)}
                          placeholder="z.B. 10:00"
                        />
                        <Input
                          label="Edit-Uhrzeit (optional)"
                          value={editingTime}
                          onChange={(e) => setEditingTime(e.target.value)}
                          placeholder="z.B. 14:00"
                        />
                        <Input
                          label="Posting-Uhrzeit (optional)"
                          value={postingTime}
                          onChange={(e) => setPostingTime(e.target.value)}
                          placeholder="z.B. 18:30"
                        />
                      </div>

                      <Card
                        title="An welchen Tagen willst du Reels drehen?"
                        description="Mehrfachauswahl möglich."
                        className="bg-slate-50/70"
                      >
                        <div className="flex flex-wrap gap-2">
                          {dayOptions.map((d) => {
                            const active = filmingDays.includes(d.id)
                            return (
                              <Button
                                key={`film-${d.id}`}
                                type="button"
                                size="sm"
                                variant="ghost"
                                className={
                                  active
                                    ? 'border border-indigo-500 bg-indigo-600 text-white hover:bg-indigo-700'
                                    : 'border border-indigo-200 bg-indigo-50 text-indigo-700 hover:bg-indigo-100'
                                }
                                onClick={() => toggleDay(setFilmingDays, d.id)}
                              >
                                {d.short}
                              </Button>
                            )
                          })}
                        </div>
                      </Card>

                      <Card
                        title="An welchen Tagen willst du bearbeiten?"
                        description="Mehrfachauswahl möglich."
                        className="bg-slate-50/70"
                      >
                        <div className="flex flex-wrap gap-2">
                          {dayOptions.map((d) => {
                            const active = editingDays.includes(d.id)
                            return (
                              <Button
                                key={`edit-${d.id}`}
                                type="button"
                                size="sm"
                                variant="ghost"
                                className={
                                  active
                                    ? 'border border-violet-500 bg-violet-600 text-white hover:bg-violet-700'
                                    : 'border border-violet-200 bg-violet-50 text-violet-700 hover:bg-violet-100'
                                }
                                onClick={() => toggleDay(setEditingDays, d.id)}
                              >
                                {d.short}
                              </Button>
                            )
                          })}
                        </div>
                      </Card>

                      <Card
                        title="An welchen Tagen willst du posten?"
                        description="Optional, falls du feste Publishing-Tage hast."
                        className="bg-slate-50/70"
                      >
                        <div className="flex flex-wrap gap-2">
                          {dayOptions.map((d) => {
                            const active = postingDays.includes(d.id)
                            return (
                              <Button
                                key={`post-${d.id}`}
                                type="button"
                                size="sm"
                                variant="ghost"
                                className={
                                  active
                                    ? 'border border-sky-500 bg-sky-600 text-white hover:bg-sky-700'
                                    : 'border border-sky-200 bg-sky-50 text-sky-700 hover:bg-sky-100'
                                }
                                onClick={() => toggleDay(setPostingDays, d.id)}
                              >
                                {d.short}
                              </Button>
                            )
                          })}
                        </div>
                      </Card>

                      <Textarea
                        label="Notizen / Produktionsregeln"
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        placeholder="z.B. Montags nur Talking Head, mittwochs B-Roll Batch, freitags CTA-lastige Clips…"
                        rows={4}
                      />
                    </>
                  )}
                </>
              )}
            </div>

            <div className="flex items-center justify-between border-t border-slate-100 px-6 py-4">
              <p className="text-xs text-slate-500">{saveStateLabel ?? ' '}</p>
              <div className="flex items-center gap-2">
                <Button type="button" size="sm" variant="secondary" onClick={() => setSettingsOpen(false)}>
                  Schließen
                </Button>
                <Button
                  type="button"
                  size="sm"
                  onClick={() => void saveSettings()}
                  disabled={!selectedAccountId || savingSettings}
                >
                  <Save className="mr-1 h-3.5 w-3.5" />
                  {savingSettings ? 'Speichern…' : 'Einstellungen speichern'}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

