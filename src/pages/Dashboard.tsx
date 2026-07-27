import { useMemo } from 'react'
import { Bar, BarChart, CartesianGrid, Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { useBudgets, useCategories, useTransactions } from '../lib/data'
import { Card, EmptyState } from '../components/ui'
import { currentMonthKey, formatMoney, lastNMonthKeys, monthKeyOf, monthLabel } from '../lib/utils'
import { useLang } from '../lib/i18n'

export default function Dashboard() {
  const { t, locale, currency, translateCategoryName } = useLang()
  const categories = useCategories()
  const transactions = useTransactions()
  const budgets = useBudgets()

  const money = (amount: number) => formatMoney(amount, locale, currency)
  const monthKey = currentMonthKey()
  const monthLabelText = monthLabel(monthKey, locale)

  const monthTxs = useMemo(() => (transactions ?? []).filter((t) => monthKeyOf(t.date) === monthKey), [transactions, monthKey])
  const totalIncome = monthTxs.filter((t) => t.type === 'income').reduce((s, t) => s + t.amount, 0)
  const totalExpense = monthTxs.filter((t) => t.type === 'expense').reduce((s, t) => s + t.amount, 0)
  const balance = totalIncome - totalExpense

  const pieData = useMemo(() => {
    const map = new Map<string, number>()
    for (const t of monthTxs) {
      if (t.type !== 'expense') continue
      map.set(t.categoryId, (map.get(t.categoryId) ?? 0) + t.amount)
    }
    return Array.from(map.entries())
      .map(([categoryId, value]) => {
        const cat = categories?.find((c) => c.id === categoryId)
        return { name: cat ? translateCategoryName(cat.name) : '?', value, color: cat?.color ?? '#999' }
      })
      .sort((a, b) => b.value - a.value)
  }, [monthTxs, categories, translateCategoryName])

  const trendData = useMemo(() => {
    const months = lastNMonthKeys(6)
    return months.map((key) => {
      const txs = (transactions ?? []).filter((t) => monthKeyOf(t.date) === key)
      return {
        month: monthLabel(key, locale).split(' ')[0],
        revenus: txs.filter((t) => t.type === 'income').reduce((s, t) => s + t.amount, 0),
        depenses: txs.filter((t) => t.type === 'expense').reduce((s, t) => s + t.amount, 0),
      }
    })
  }, [transactions, locale])

  const budgetAlerts = useMemo(() => {
    return (budgets ?? [])
      .map((b) => {
        const cat = categories?.find((c) => c.id === b.categoryId)
        const spent = monthTxs.filter((t) => t.type === 'expense' && t.categoryId === b.categoryId).reduce((s, t) => s + t.amount, 0)
        return { cat, spent, limit: b.monthlyLimit, pct: b.monthlyLimit > 0 ? (spent / b.monthlyLimit) * 100 : 0 }
      })
      .filter((b) => b.pct >= 80)
      .sort((a, b) => b.pct - a.pct)
  }, [budgets, categories, monthTxs])

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-purple-950">{t('navDashboard')}</h2>
        <p className="text-sm text-purple-400 capitalize">{monthLabelText}</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label={t('statIncome')} value={money(totalIncome)} icon="💰" color="text-green-600" bg="from-green-400 to-emerald-500" />
        <StatCard label={t('statExpense')} value={money(totalExpense)} icon="💸" color="text-red-500" bg="from-orange-400 to-red-500" />
        <StatCard
          label={t('statBalance')}
          value={money(balance)}
          icon={balance >= 0 ? '🎉' : '⚠️'}
          color={balance >= 0 ? 'text-green-600' : 'text-red-500'}
          bg="from-purple-500 to-fuchsia-500"
        />
      </div>

      {budgetAlerts.length > 0 && (
        <Card className="border-amber-200 bg-amber-50/80">
          <h3 className="mb-2 flex items-center gap-2 font-semibold text-amber-700">{t('budgetAlertsTitle')}</h3>
          <ul className="space-y-1 text-sm text-amber-800">
            {budgetAlerts.map((b) => (
              <li key={b.cat?.id}>
                {b.cat?.icon} {b.cat ? translateCategoryName(b.cat.name) : ''} — {money(b.spent)} / {money(b.limit)} ({Math.round(b.pct)}%)
                {b.pct > 100 ? t('budgetExceededSuffix') : ''}
              </li>
            ))}
          </ul>
        </Card>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <h3 className="mb-4 font-semibold text-purple-900">{t('pieTitle')}</h3>
          {pieData.length === 0 ? (
            <EmptyState icon="🥧" text={t('pieEmpty')} />
          ) : (
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie data={pieData} dataKey="value" nameKey="name" innerRadius={55} outerRadius={90} paddingAngle={2}>
                  {pieData.map((entry, i) => (
                    <Cell key={i} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip formatter={(v) => money(Number(v))} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          )}
        </Card>

        <Card>
          <h3 className="mb-4 font-semibold text-purple-900">{t('trendTitle')}</h3>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={trendData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f3e8ff" />
              <XAxis dataKey="month" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip formatter={(v) => money(Number(v))} />
              <Legend />
              <Bar dataKey="revenus" fill="#22c55e" radius={[4, 4, 0, 0]} name={t('legendIncome')} />
              <Bar dataKey="depenses" fill="#f97316" radius={[4, 4, 0, 0]} name={t('legendExpense')} />
            </BarChart>
          </ResponsiveContainer>
        </Card>
      </div>
    </div>
  )
}

function StatCard({
  label,
  value,
  icon,
  color,
  bg,
}: {
  label: string
  value: string
  icon: string
  color: string
  bg: string
}) {
  return (
    <Card className="relative overflow-hidden">
      <div className={`pointer-events-none absolute -right-6 -top-6 h-24 w-24 rounded-full bg-gradient-to-br opacity-20 ${bg}`} />
      <p className="text-sm text-purple-400">{label}</p>
      <div className="mt-1 flex items-center gap-2">
        <span className="text-2xl">{icon}</span>
        <span className={`text-2xl font-bold ${color}`}>{value}</span>
      </div>
    </Card>
  )
}
