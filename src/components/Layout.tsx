import type { ReactNode } from 'react'
import { NavLink } from 'react-router-dom'
import { ArrowLeftRight, LayoutDashboard, LogOut, Tags, Target, Wallet, type LucideIcon } from 'lucide-react'
import { useLang } from '../lib/i18n'
import { useAuth } from '../lib/auth'
import type { TranslationKey } from '../lib/translations'
import QuickAddExpense from './QuickAddExpense'
import { IconButton } from './ui'

const NAV_ITEMS: { to: string; labelKey: TranslationKey; icon: LucideIcon; end: boolean }[] = [
  { to: '/', labelKey: 'navDashboard', icon: LayoutDashboard, end: true },
  { to: '/transactions', labelKey: 'navTransactions', icon: ArrowLeftRight, end: false },
  { to: '/budgets', labelKey: 'navBudgets', icon: Target, end: false },
  { to: '/categories', labelKey: 'navCategories', icon: Tags, end: false },
]

function Logo({ withTagline = false }: { withTagline?: boolean }) {
  const { t } = useLang()
  return (
    <div className="flex items-center gap-2.5">
      <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-600 text-white">
        <Wallet className="h-5 w-5" aria-hidden />
      </span>
      <div>
        <h1 className="text-base font-bold leading-tight text-ink">{t('appName')}</h1>
        {withTagline && <p className="text-xs text-ink-subtle">{t('tagline')}</p>}
      </div>
    </div>
  )
}

export default function Layout({ children }: { children: ReactNode }) {
  const { t } = useLang()
  const { signOut } = useAuth()

  return (
    <div className="flex min-h-screen">
      <aside className="sticky top-0 hidden h-screen w-64 shrink-0 flex-col border-e border-line bg-surface p-5 sm:flex">
        <div className="mb-8">
          <Logo withTagline />
        </div>
        <nav aria-label={t('mainNavLabel')} className="flex flex-col gap-1">
          {NAV_ITEMS.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                `flex min-h-11 items-center gap-3 rounded-xl px-3 text-sm font-medium transition-colors duration-150 ${
                  isActive ? 'bg-brand-50 text-brand-700' : 'text-ink-muted hover:bg-slate-100 hover:text-ink'
                }`
              }
            >
              <item.icon className="h-5 w-5" aria-hidden />
              {t(item.labelKey)}
            </NavLink>
          ))}
        </nav>

        <button
          onClick={() => signOut()}
          className="mt-auto flex min-h-11 cursor-pointer items-center gap-3 rounded-xl px-3 text-sm font-medium text-ink-subtle transition-colors hover:bg-slate-100 hover:text-ink"
        >
          <LogOut className="h-5 w-5" aria-hidden />
          {t('logoutButton')}
        </button>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 flex items-center justify-between border-b border-line bg-surface/90 px-4 pb-2 pt-[max(0.5rem,env(safe-area-inset-top))] backdrop-blur sm:hidden">
          <Logo />
          <IconButton icon={LogOut} label={t('logoutButton')} onClick={() => signOut()} />
        </header>

        <main className="flex-1 p-4 pb-[calc(6rem+env(safe-area-inset-bottom))] sm:p-8">{children}</main>

        <QuickAddExpense />

        <nav
          aria-label={t('mainNavLabel')}
          className="fixed inset-x-0 bottom-0 z-30 grid grid-cols-4 border-t border-line bg-surface/95 pb-[env(safe-area-inset-bottom)] backdrop-blur sm:hidden"
        >
          {NAV_ITEMS.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                `flex min-h-14 flex-col items-center justify-center gap-1 text-xs font-medium transition-colors duration-150 ${
                  isActive ? 'text-brand-700' : 'text-ink-subtle'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <span className={`flex h-7 w-12 items-center justify-center rounded-full transition-colors ${isActive ? 'bg-brand-100' : ''}`}>
                    <item.icon className="h-5 w-5" aria-hidden />
                  </span>
                  {t(item.labelKey)}
                </>
              )}
            </NavLink>
          ))}
        </nav>
      </div>
    </div>
  )
}
