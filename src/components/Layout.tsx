import type { ReactNode } from 'react'
import { NavLink } from 'react-router-dom'

const NAV_ITEMS = [
  { to: '/', label: 'Dashboard', icon: '📊', end: true },
  { to: '/transactions', label: 'Transactions', icon: '💸', end: false },
  { to: '/budgets', label: 'Budgets', icon: '🎯', end: false },
  { to: '/categories', label: 'Catégories', icon: '🏷️', end: false },
]

export default function Layout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen">
      <aside className="hidden w-64 shrink-0 flex-col border-r border-purple-100 bg-white/70 p-6 backdrop-blur sm:flex">
        <div className="mb-8 flex items-center gap-2">
          <span className="text-3xl">🐷</span>
          <div>
            <h1 className="text-lg font-bold text-purple-900">Budget Helper</h1>
            <p className="text-xs text-purple-400">Tes finances, simplifiées</p>
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
              {item.label}
            </NavLink>
          ))}
        </nav>
      </aside>

      <div className="flex flex-1 flex-col">
        <header className="flex items-center justify-between border-b border-purple-100 bg-white/70 px-4 py-3 backdrop-blur sm:hidden">
          <div className="flex items-center gap-2">
            <span className="text-2xl">🐷</span>
            <h1 className="text-base font-bold text-purple-900">Budget Helper</h1>
          </div>
        </header>

        <main className="flex-1 p-4 sm:p-8">{children}</main>

        <nav className="sticky bottom-0 flex justify-around border-t border-purple-100 bg-white/90 py-2 backdrop-blur sm:hidden">
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
              {item.label}
            </NavLink>
          ))}
        </nav>
      </div>
    </div>
  )
}
