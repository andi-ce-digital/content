import { NavLink, Outlet } from 'react-router-dom'
import { Button } from './components/ui/Button'
import { useAuth } from './auth/AuthContext'
import { supabase } from './lib/supabaseClient'
import {
  Blocks,
  Gauge,
  Menu,
  Bot,
  Settings,
  Sparkles,
  UserCircle2,
  WandSparkles,
  X,
} from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'

function App() {
  const { user } = useAuth()
  const [profileName, setProfileName] = useState<string | null>(null)
  const [profileAvatarUrl, setProfileAvatarUrl] = useState<string | null>(null)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const navItemBase =
    'group flex items-center gap-2 rounded-2xl px-3 py-2 transition duration-200'
  const navItemInactive = 'text-slate-600 hover:bg-slate-900/3'
  const navItemActive =
    'text-slate-900 shadow-soft shadow-slate-900/5 ring-1 ring-indigo-100 bg-gradient-to-r from-indigo-50 to-slate-50'
  useEffect(() => {
    async function loadProfile() {
      if (!supabase || !user) return
      const { data } = await supabase
        .from('profiles')
        .select('first_name, last_name, avatar_url')
        .eq('id', user.id)
        .maybeSingle<{ first_name: string | null; last_name: string | null; avatar_url: string | null }>()
      const fullName = `${data?.first_name ?? ''} ${data?.last_name ?? ''}`.trim()
      setProfileName(fullName || null)
      setProfileAvatarUrl(data?.avatar_url ?? null)
    }
    void loadProfile()
  }, [user?.id])

  const userName = profileName ?? user?.email?.split('@')[0] ?? 'Workspace User'
  const userInitials = useMemo(() => userName.slice(0, 2).toUpperCase(), [userName])

  return (
    <div className="flex min-h-screen bg-gradient-to-b from-slate-50 via-white to-slate-50 text-slate-900">
      <aside className="sticky top-0 hidden h-screen w-64 shrink-0 border-r border-slate-200 bg-white/80 px-4 py-6 backdrop-blur-xl md:flex md:flex-col">
        <div className="mb-8 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500 via-violet-500 to-sky-500 text-xs font-semibold text-white shadow-soft">
              CS
            </div>
            <div>
              <p className="text-xs font-semibold tracking-tight text-slate-900">
                content-saas
              </p>
              <p className="text-[11px] text-slate-500">
                Competitive Content Strategy
              </p>
            </div>
          </div>
          <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-medium text-emerald-700 ring-1 ring-emerald-100">
            Beta
          </span>
        </div>
        <nav className="space-y-4 text-xs font-medium text-slate-500">
          <div className="space-y-1.5">
            <p className="px-2 text-[10px] uppercase tracking-[0.16em] text-slate-400">
              Overview
            </p>
            <NavLink
              to="/"
              end
              className={({ isActive }) =>
                `${navItemBase} ${isActive ? navItemActive : navItemInactive}`
              }
            >
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-indigo-500/10 text-indigo-600 transition group-hover:bg-indigo-500/20">
                <Gauge className="h-3.5 w-3.5" />
              </span>
              <div className="flex flex-col">
                <span>Dashboard</span>
                <span className="text-[10px] font-normal text-slate-400">
                  Signals & Top-Performer
                </span>
              </div>
            </NavLink>
            <NavLink
              to="/dashboard/assistant"
              className={({ isActive }) =>
                `${navItemBase} ${isActive ? navItemActive : navItemInactive}`
              }
            >
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-indigo-500/10 text-indigo-600 transition group-hover:bg-indigo-500/20">
                <Bot className="h-3.5 w-3.5" />
              </span>
              <div className="flex flex-col">
                <span>AI Assistent</span>
                <span className="text-[10px] font-normal text-slate-400">
                  Fragen & Content-Ideen
                </span>
              </div>
            </NavLink>
          </div>
          <div className="space-y-1.5">
            <p className="px-2 text-[10px] uppercase tracking-[0.16em] text-slate-400">
              Accounts
            </p>
            <NavLink
              to="/creators"
              className={({ isActive }) =>
                `${navItemBase} ${isActive ? navItemActive : navItemInactive}`
              }
            >
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-slate-900/5 text-slate-600 transition group-hover:bg-slate-900/10">
                <UserCircle2 className="h-3.5 w-3.5" />
              </span>
              <div className="flex flex-col">
                <span>Creators</span>
                <span className="text-[10px] font-normal text-slate-400">
                  Accounts & Profile
                </span>
              </div>
            </NavLink>
          </div>
          <div className="space-y-1.5">
            <p className="px-2 text-[10px] uppercase tracking-[0.16em] text-slate-400">
              Analyse
            </p>
            <NavLink
              to="/library"
              className={({ isActive }) =>
                `${navItemBase} ${isActive ? navItemActive : navItemInactive}`
              }
            >
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-slate-900/5 text-slate-600 transition group-hover:bg-slate-900/10">
                <Blocks className="h-3.5 w-3.5" />
              </span>
              <div className="flex flex-col">
                <span>Content Library</span>
                <span className="text-[10px] font-normal text-slate-400">
                  Reels, Hooks, Metriken
                </span>
              </div>
            </NavLink>
          </div>
          <div className="space-y-1.5">
            <p className="px-2 text-[10px] uppercase tracking-[0.16em] text-slate-400">
              Voice & Output
            </p>
            <NavLink
              to="/brand-voice"
              className={({ isActive }) =>
                `${navItemBase} ${isActive ? navItemActive : navItemInactive}`
              }
            >
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-slate-900/5 text-slate-600 transition group-hover:bg-slate-900/10">
                <Sparkles className="h-3.5 w-3.5" />
              </span>
              <div className="flex flex-col">
                <span>Brand Voice</span>
                <span className="text-[10px] font-normal text-slate-400">
                  Tonalität & Patterns
                </span>
              </div>
            </NavLink>
            <NavLink
              to="/generator"
              className={({ isActive }) =>
                `${navItemBase} ${isActive ? navItemActive : navItemInactive}`
              }
            >
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-slate-900/5 text-slate-600 transition group-hover:bg-slate-900/10">
                <WandSparkles className="h-3.5 w-3.5" />
              </span>
              <div className="flex flex-col">
                <span>Generator</span>
                <span className="text-[10px] font-normal text-slate-400">
                  Skripte & Produktionsbriefing
                </span>
              </div>
            </NavLink>
          </div>
        </nav>
        <div className="mt-auto space-y-3 rounded-2xl border border-dashed border-slate-200 bg-slate-50/80 p-3">
          <p className="text-[11px] font-medium text-slate-700">
            Live Signal Feed
          </p>
          <p className="text-[11px] text-slate-500">
            Diese Demo zeigt, wie deine Konkurrenz in verwertbare Hook-Patterns
            und Skripte übersetzt wird.
          </p>
          <div className="mt-2 flex items-center justify-between text-[10px] text-slate-400">
            <span>Letzter Import</span>
            <span className="rounded-full bg-slate-900/5 px-2 py-0.5 text-[10px] text-slate-600">
              vor 2 Min (Demo)
            </span>
          </div>
        </div>
        <div className="mt-3 flex items-center justify-between rounded-2xl border border-slate-200 bg-white/90 px-3 py-2.5 shadow-sm">
          <div className="flex items-center gap-2">
            {profileAvatarUrl ? (
              <img
                src={profileAvatarUrl}
                alt={userName}
                className="h-9 w-9 rounded-full border border-slate-200 object-cover"
              />
            ) : (
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 via-violet-500 to-sky-500 text-[11px] font-semibold text-white">
                {userInitials}
              </div>
            )}
            <div className="min-w-0">
              <p className="truncate text-xs font-semibold text-slate-900">{userName}</p>
              <p className="truncate text-[10px] text-slate-500">
                {user?.email ?? 'Profil & Einstellungen'}
              </p>
            </div>
          </div>
          <NavLink
            to="/settings"
            aria-label="Einstellungen"
            className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-slate-200 text-slate-500 transition hover:bg-brand-50 hover:text-brand-700"
          >
            <Settings className="h-4 w-4" />
          </NavLink>
        </div>
      </aside>
      <main className="flex min-h-screen flex-1 flex-col">
        <header className="sticky top-0 z-20 border-b border-slate-200/80 bg-white/80 px-4 py-3 backdrop-blur-xl">
          <div className="mx-auto flex w-full max-w-7xl items-center justify-between">
            <div className="flex items-center gap-2 lg:hidden">
              <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500 via-violet-500 to-sky-500 text-[11px] font-semibold text-white shadow-soft">
                CS
              </div>
            </div>
            <div className="hidden flex-col gap-1 lg:flex">
              <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-slate-400">
                Content Intelligence
              </p>
              <h1 className="text-sm font-semibold tracking-tight text-slate-900">
                Deine Content-Strategie, gespeist aus echten Creators
              </h1>
            </div>
            <div className="flex items-center gap-3">
              <button
                type="button"
                className="hidden min-w-[220px] items-center justify-between rounded-full border border-slate-300 bg-white px-4 py-2 text-xs text-slate-600 shadow-sm lg:inline-flex"
              >
                <span>Suchen...</span>
                <span className="ml-3 rounded bg-slate-100 px-1.5 py-0.5 text-[10px] text-slate-500">
                  ⌘K
                </span>
              </button>
              <Button
                variant="secondary"
                size="sm"
                className="border-indigo-200 bg-indigo-50 text-indigo-700 hover:bg-indigo-100"
              >
                Demo Workspace
              </Button>
              <Button size="sm" className="hidden lg:inline-flex">Neuen Creator analysieren</Button>
              <img
                src="/favicon.svg"
                alt="content-saas logo"
                className="hidden h-8 w-8 object-contain lg:block"
              />
              <button
                type="button"
                onClick={() => setMobileMenuOpen(true)}
                className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-700 shadow-sm lg:hidden"
                aria-label="Menü öffnen"
              >
                <Menu className="h-4 w-4" />
              </button>
            </div>
          </div>
        </header>
        <div className="flex-1 px-4 py-5">
          <div className="mx-auto w-full max-w-7xl">
            <Outlet />
          </div>
        </div>
      </main>
      {mobileMenuOpen && (
        <div className="mobile-menu-fade fixed inset-0 z-50 lg:hidden">
          <button
            type="button"
            aria-label="Menü schließen"
            onClick={() => setMobileMenuOpen(false)}
            className="absolute inset-0 bg-slate-950/45"
          />
          <div className="mobile-menu-panel absolute inset-0 flex flex-col overflow-hidden bg-gradient-to-b from-white via-slate-50 to-white p-4">
            <div className="flex-1 overflow-y-auto">
              <div className="mb-4 flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-slate-400">
                    Content Intelligence
                  </p>
                  <h2 className="mt-1 text-sm font-semibold tracking-tight text-slate-900">
                    Deine Content-Strategie, gespeist aus echten Creators
                  </h2>
                </div>
                <button
                  type="button"
                  onClick={() => setMobileMenuOpen(false)}
                  className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-600 shadow-sm"
                  aria-label="Menü schließen"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="space-y-2 rounded-3xl border border-slate-200 bg-white/90 p-3 shadow-sm backdrop-blur">
              <NavLink
                to="/"
                end
                onClick={() => setMobileMenuOpen(false)}
                className={({ isActive }) =>
                  `${navItemBase} ${isActive ? navItemActive : navItemInactive}`
                }
              >
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-indigo-500/10 text-indigo-600">
                  <Gauge className="h-3.5 w-3.5" />
                </span>
                <span>Dashboard</span>
              </NavLink>
              <NavLink
                to="/creators"
                onClick={() => setMobileMenuOpen(false)}
                className={({ isActive }) =>
                  `${navItemBase} ${isActive ? navItemActive : navItemInactive}`
                }
              >
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-slate-900/5 text-slate-600">
                  <UserCircle2 className="h-3.5 w-3.5" />
                </span>
                <span>Creators</span>
              </NavLink>
              <NavLink
                to="/library"
                onClick={() => setMobileMenuOpen(false)}
                className={({ isActive }) =>
                  `${navItemBase} ${isActive ? navItemActive : navItemInactive}`
                }
              >
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-slate-900/5 text-slate-600">
                  <Blocks className="h-3.5 w-3.5" />
                </span>
                <span>Content Library</span>
              </NavLink>
              <NavLink
                to="/brand-voice"
                onClick={() => setMobileMenuOpen(false)}
                className={({ isActive }) =>
                  `${navItemBase} ${isActive ? navItemActive : navItemInactive}`
                }
              >
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-slate-900/5 text-slate-600">
                  <Sparkles className="h-3.5 w-3.5" />
                </span>
                <span>Brand Voice</span>
              </NavLink>
              <NavLink
                to="/generator"
                onClick={() => setMobileMenuOpen(false)}
                className={({ isActive }) =>
                  `${navItemBase} ${isActive ? navItemActive : navItemInactive}`
                }
              >
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-slate-900/5 text-slate-600">
                  <WandSparkles className="h-3.5 w-3.5" />
                </span>
                <span>Generator</span>
              </NavLink>
              <NavLink
                to="/settings"
                onClick={() => setMobileMenuOpen(false)}
                className={({ isActive }) =>
                  `${navItemBase} ${isActive ? navItemActive : navItemInactive}`
                }
              >
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-slate-900/5 text-slate-600">
                  <Settings className="h-3.5 w-3.5" />
                </span>
                <span>Einstellungen</span>
              </NavLink>
              </div>
            </div>

            <div className="mt-3 rounded-2xl border border-slate-200 bg-white/90 px-3 py-2.5 shadow-sm">
              <div className="flex items-center justify-between gap-3">
                <div className="flex min-w-0 items-center gap-2">
                  {profileAvatarUrl ? (
                    <img
                      src={profileAvatarUrl}
                      alt={userName}
                      className="h-9 w-9 rounded-full border border-slate-200 object-cover"
                    />
                  ) : (
                    <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 via-violet-500 to-sky-500 text-[11px] font-semibold text-white">
                      {userInitials}
                    </div>
                  )}
                  <div className="min-w-0">
                    <p className="truncate text-xs font-semibold text-slate-900">
                      {userName}
                    </p>
                    <p className="truncate text-[10px] text-slate-500">
                      {user?.email ?? '—'}
                    </p>
                  </div>
                </div>
                <NavLink
                  to="/settings"
                  onClick={() => setMobileMenuOpen(false)}
                  aria-label="Einstellungen"
                  className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-slate-200 text-slate-500 transition hover:bg-brand-50 hover:text-brand-700"
                >
                  <Settings className="h-4 w-4" />
                </NavLink>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default App
