import type { ReactNode } from 'react'
import { NavLink } from 'react-router-dom'
import { useLang } from '../lib/i18n'
import { useAuth } from '../lib/auth'
import type { TranslationKey } from '../lib/translations'
import QuickAddExpense from './QuickAddExpense'

const NAV_ITEMS: { to: string; labelKey: TranslationKey; icon: string; end: boolean }[] = [
  { to: '/', labelKey: 'navDashboard', icon: '📊', end: true },
  { to: '/transactions', labelKey: 'navTransactions', icon: '💸', end: false },
  { to: '/budgets', labelKey: 'navBudgets', icon: '🎯', end: false },
  { to: '/categories', labelKey: 'navCategories', icon: '🏷️', end: false },
]

export default function Layout({ children }: { children: ReactNode }) {
  const { t, lang, setLang } = useLang()
  const { signOut } = useAuth()

  return (
    <div className="flex min-h-screen">
      <aside className="hidden w-64 shrink-0 flex-col border-e border-purple-100 bg-white/70 p-6 backdrop-blur sm:flex">
        <div className="mb-8 flex items-center gap-2">
          <span className="text-3xl">💰</span>
          <div>
            <h1 className="text-lg font-bold text-purple-900">{t('appName')}</h1>
            <p className="text-xs text-purple-400">{t('tagline')}</p>
          </div>
        </div>
        <nav className="flex flex-col gap-1">
          {NAV_ITEMS.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-xl px-4 py-2.5 text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-purple-600 text-white shadow-md shadow-purple-200'
                    : 'text-purple-700 hover:bg-purple-100'
                }`
              }
            >
              <span className="text-lg">{item.icon}</span>
              {t(item.labelKey)}
            </NavLink>
          ))}
        </nav>

        <div className="mt-auto space-y-3 pt-6">
          <p className="mb-1 text-xs font-semibold text-purple-400">{t('langSwitchLabel')}</p>
          <div className="flex gap-1 rounded-xl bg-purple-50 p-1">
            <button
              onClick={() => setLang('fr')}
              className={`flex-1 rounded-lg py-1.5 text-sm font-medium transition-colors ${
                lang === 'fr' ? 'bg-purple-600 text-white' : 'text-purple-500 hover:bg-purple-100'
              }`}
            >
              Français
            </button>
            <button
              onClick={() => setLang('he')}
              className={`flex-1 rounded-lg py-1.5 text-sm font-medium transition-colors ${
                lang === 'he' ? 'bg-purple-600 text-white' : 'text-purple-500 hover:bg-purple-100'
              }`}
            >
              עברית
            </button>
          </div>
          <button onClick={() => signOut()} className="w-full cursor-pointer rounded-lg py-1.5 text-xs font-medium text-purple-400 hover:bg-purple-50">
            {t('logoutButton')}
          </button>
        </div>
      </aside>

      <div className="flex flex-1 flex-col">
        <header
          className="flex items-center justify-between border-b border-purple-100 bg-white/70 px-4 py-3 backdrop-blur sm:hidden"
          style={{ paddingTop: 'max(0.75rem, env(safe-area-inset-top))' }}
        >
          <div className="flex items-center gap-2">
            <span className="text-2xl">💰</span>
            <h1 className="text-base font-bold text-purple-900">{t('appName')}</h1>
          </div>
          <div className="flex gap-1 rounded-xl bg-purple-50 p-1">
            <button
              onClick={() => setLang('fr')}
              className={`rounded-lg px-2 py-1 text-xs font-medium transition-colors ${
                lang === 'fr' ? 'bg-purple-600 text-white' : 'text-purple-500'
              }`}
            >
              FR
            </button>
            <button
              onClick={() => setLang('he')}
              className={`rounded-lg px-2 py-1 text-xs font-medium transition-colors ${
                lang === 'he' ? 'bg-purple-600 text-white' : 'text-purple-500'
              }`}
            >
              עב
            </button>
          </div>
        </header>

        <main className="flex-1 p-4 sm:p-8">{children}</main>

        <QuickAddExpense />

        <nav
          className="sticky bottom-0 flex justify-around border-t border-purple-100 bg-white/90 pt-2 backdrop-blur sm:hidden"
          style={{ paddingBottom: 'max(0.5rem, env(safe-area-inset-bottom))' }}
        >
          {NAV_ITEMS.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                `flex flex-col items-center gap-0.5 rounded-lg px-3 py-1 text-xs font-medium ${
                  isActive ? 'text-purple-700' : 'text-purple-300'
                }`
              }
            >
              <span className="text-xl">{item.icon}</span>
              {t(item.labelKey)}
            </NavLink>
          ))}
        </nav>
      </div>
    </div>
  )
}
