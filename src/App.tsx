import { NavLink, Outlet } from 'react-router-dom'
import reachboxLogo from './assets/reachbox.svg'
import { Button } from './components/ui/Button'
import { useAuth } from './auth/AuthContext'
import { supabase } from './lib/supabaseClient'
import {
  Blocks,
  Gauge,
  Menu,
  Bot,
  CalendarDays,
  Settings,
  Sparkles,
  UserCircle2,
  WandSparkles,
  Clapperboard,
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
    <div className="flex min-h-screen min-w-0 overflow-x-hidden bg-gradient-to-b from-slate-50 via-white to-slate-50 text-slate-900">
      <aside className="sticky top-0 z-10 hidden h-screen w-64 shrink-0 border-r border-slate-200 bg-white/80 px-4 py-6 backdrop-blur-xl md:flex md:flex-col">
        <div className="mb-8 flex min-h-[28px] items-center justify-between gap-2 sm:min-h-[32px]">
          <NavLink
            to="/dashboard"
            end
            className="flex min-h-[28px] min-w-0 flex-1 items-center outline-none focus-visible:ring-2 focus-visible:ring-indigo-400/60 focus-visible:ring-offset-2 rounded-lg sm:min-h-[32px]"
          >
            <img
              src={reachboxLogo}
              alt="Reachbox"
              className="h-6 w-auto max-w-full object-contain object-left sm:h-7"
            />
          </NavLink>
          <span className="inline-flex h-6 shrink-0 items-center justify-center self-center rounded-full bg-violet-100 px-2.5 text-[10px] font-semibold leading-none text-violet-800 ring-1 ring-violet-200/90 sm:h-7">
            Premium
          </span>
        </div>
        <nav className="space-y-4 text-xs font-medium text-slate-500">
          <div className="space-y-1.5">
            <p className="px-2 text-[10px] uppercase tracking-[0.16em] text-slate-400">
              Overview
            </p>
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
                <span>KI-Studio</span>
                <span className="text-[10px] font-normal text-slate-400">
                  Fragen & Content-Ideen
                </span>
              </div>
            </NavLink>
            <NavLink
              to="/dashboard"
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
            <NavLink
              to="/content-plan"
              className={({ isActive }) =>
                `${navItemBase} ${isActive ? navItemActive : navItemInactive}`
              }
            >
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-slate-900/5 text-slate-600 transition group-hover:bg-slate-900/10">
                <CalendarDays className="h-3.5 w-3.5" />
              </span>
              <div className="flex flex-col">
                <span>Content Plan</span>
                <span className="text-[10px] font-normal text-slate-400">
                  Kalender & Publishing
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
            <NavLink
              to="/generator/remotion-editor"
              className={({ isActive }) =>
                `${navItemBase} ${isActive ? navItemActive : navItemInactive}`
              }
            >
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-slate-900/5 text-slate-600 transition group-hover:bg-slate-900/10">
                <Clapperboard className="h-3.5 w-3.5" />
              </span>
              <div className="flex flex-col">
                <span>Remotion Editor</span>
                <span className="text-[10px] font-normal text-slate-400">
                  Snippets & Render Setup
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
      <main className="relative z-0 flex min-h-screen min-w-0 flex-1 flex-col overflow-x-hidden">
        <header className="sticky top-0 z-[100] border-b border-slate-200/80 bg-white/90 px-3 py-3.5 backdrop-blur-xl sm:px-4 sm:py-4">
          <div className="mx-auto flex w-full max-w-7xl min-w-0 items-center justify-between gap-2">
            <NavLink
              to="/dashboard"
              end
              className="min-w-0 shrink-0 outline-none focus-visible:ring-2 focus-visible:ring-indigo-400/60 focus-visible:ring-offset-2 rounded-lg lg:hidden"
            >
              <img
                src={reachboxLogo}
                alt="Reachbox"
                className="h-7 w-auto max-w-[min(160px,42vw)] object-contain object-left"
              />
            </NavLink>
            <div className="hidden min-w-0 flex-col gap-1.5 py-0.5 lg:flex">
              <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-slate-400">
                Content Intelligence
              </p>
              <h1 className="text-sm font-semibold tracking-tight text-slate-900">
                Deine Content-Strategie, gespeist aus echten Creators
              </h1>
            </div>
            <div className="flex shrink-0 items-center gap-2 sm:gap-3">
              <button
                type="button"
                className="hidden min-w-[220px] items-center justify-between rounded-full border border-indigo-200 bg-indigo-50 px-4 py-2 text-xs text-indigo-700 shadow-sm lg:inline-flex hover:bg-indigo-100"
              >
                <span>Suchen...</span>
                <span className="ml-3 rounded bg-indigo-100 px-1.5 py-0.5 text-[10px] text-indigo-700">
                  ⌘K
                </span>
              </button>
              <Button
                variant="secondary"
                size="sm"
                className="hidden border-indigo-200 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 sm:inline-flex"
              >
                Demo Workspace
              </Button>
              <Button size="sm" className="hidden lg:inline-flex">Neuen Creator analysieren</Button>
              <button
                type="button"
                onClick={() => setMobileMenuOpen(true)}
                className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-indigo-200 bg-indigo-50 text-indigo-700 shadow-sm hover:bg-indigo-100 lg:hidden"
                aria-label="Menü öffnen"
              >
                <Menu className="h-4 w-4" />
              </button>
            </div>
          </div>
        </header>
        <div className="min-w-0 flex-1 overflow-x-hidden px-4 pb-5 pt-4 sm:pt-5">
          <div className="mx-auto w-full min-w-0 max-w-7xl">
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
                  <NavLink
                    to="/dashboard"
                    end
                    onClick={() => setMobileMenuOpen(false)}
                    className="mb-7 inline-block outline-none focus-visible:ring-2 focus-visible:ring-indigo-400/60 focus-visible:ring-offset-2 rounded-lg"
                  >
                    <img
                      src={reachboxLogo}
                      alt="Reachbox"
                      className="h-7 w-auto max-w-[min(200px,55vw)] object-contain object-left sm:h-8"
                    />
                  </NavLink>
                  <p className="mt-3 text-[11px] font-medium uppercase tracking-[0.16em] text-slate-400">
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
                to="/dashboard/assistant"
                onClick={() => setMobileMenuOpen(false)}
                className={({ isActive }) =>
                  `${navItemBase} ${isActive ? navItemActive : navItemInactive}`
                }
              >
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-indigo-500/10 text-indigo-600">
                  <Bot className="h-3.5 w-3.5" />
                </span>
                <span>KI-Studio</span>
              </NavLink>
              <NavLink
                to="/dashboard"
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
                to="/content-plan"
                onClick={() => setMobileMenuOpen(false)}
                className={({ isActive }) =>
                  `${navItemBase} ${isActive ? navItemActive : navItemInactive}`
                }
              >
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-slate-900/5 text-slate-600">
                  <CalendarDays className="h-3.5 w-3.5" />
                </span>
                <span>Content Plan</span>
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
              <NavLink
                to="/generator/remotion-editor"
                onClick={() => setMobileMenuOpen(false)}
                className={({ isActive }) =>
                  `${navItemBase} ${isActive ? navItemActive : navItemInactive}`
                }
              >
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-slate-900/5 text-slate-600">
                  <Clapperboard className="h-3.5 w-3.5" />
                </span>
                <span>Remotion Editor</span>
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
