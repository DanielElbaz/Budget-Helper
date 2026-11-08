import { useMemo } from 'react'
import { Bar, BarChart, CartesianGrid, Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { AlertTriangle, PieChart as PieIcon, TrendingDown, TrendingUp } from 'lucide-react'
import { useBudgets, useCategories, useTransactions } from '../lib/data'
import { Card, CategoryBadge, EmptyState, PageHeader, Skeleton } from '../components/ui'
import { currentMonthKey, formatMoney, formatMoneyCompact, lastNMonthKeys, monthKeyOf, monthLabel } from '../lib/utils'
import { useLang } from '../lib/i18n'

const INCOME_COLOR = '#10b981' // emerald-500
const EXPENSE_COLOR = '#f43f5e' // rose-500

export default function Dashboard() {
  const { t, locale, currency, translateCategoryName } = useLang()
  const categories = useCategories()
  const transactions = useTransactions()
  const budgets = useBudgets()
  const loading = transactions === undefined || categories === undefined

  const money = (amount: number) => formatMoney(amount, locale, currency)
  const monthKey = currentMonthKey()

  const monthTxs = useMemo(() => (transactions ?? []).filter((tx) => monthKeyOf(tx.date) === monthKey), [transactions, monthKey])
  const totalIncome = monthTxs.filter((tx) => tx.type === 'income').reduce((s, tx) => s + tx.amount, 0)
  const totalExpense = monthTxs.filter((tx) => tx.type === 'expense').reduce((s, tx) => s + tx.amount, 0)
  const balance = totalIncome - totalExpense
  const spentPct = totalIncome > 0 ? Math.min((totalExpense / totalIncome) * 100, 100) : 0

  const breakdown = useMemo(() => {
    const map = new Map<string, number>()
    for (const tx of monthTxs) {
      if (tx.type !== 'expense') continue
      map.set(tx.categoryId, (map.get(tx.categoryId) ?? 0) + tx.amount)
    }
    return Array.from(map.entries())
      .map(([categoryId, value]) => {
        const cat = categories?.find((c) => c.id === categoryId)
        return {
          id: categoryId,
          name: cat ? translateCategoryName(cat.name) : '?',
          icon: cat?.icon ?? '❓',
          value,
          color: cat?.color ?? '#94a3b8',
        }
      })
      .sort((a, b) => b.value - a.value)
  }, [monthTxs, categories, translateCategoryName])

  const trendData = useMemo(() => {
    return lastNMonthKeys(6).map((key) => {
      const txs = (transactions ?? []).filter((tx) => monthKeyOf(tx.date) === key)
      return {
        month: new Intl.DateTimeFormat(locale, { month: 'short' }).format(new Date(`${key}-01T00:00:00`)),
        income: txs.filter((tx) => tx.type === 'income').reduce((s, tx) => s + tx.amount, 0),
        expense: txs.filter((tx) => tx.type === 'expense').reduce((s, tx) => s + tx.amount, 0),
      }
    })
  }, [transactions, locale])

  const budgetAlerts = useMemo(() => {
    return (budgets ?? [])
      .map((b) => {
        const cat = categories?.find((c) => c.id === b.categoryId)
        const spent = monthTxs.filter((tx) => tx.type === 'expense' && tx.categoryId === b.categoryId).reduce((s, tx) => s + tx.amount, 0)
        return { id: b.id, cat, spent, limit: b.monthlyLimit, pct: b.monthlyLimit > 0 ? (spent / b.monthlyLimit) * 100 : 0 }
      })
      .filter((b) => b.pct >= 80)
      .sort((a, b) => b.pct - a.pct)
  }, [budgets, categories, monthTxs])

  return (
    <div className="mx-auto max-w-5xl space-y-5">
      <PageHeader title={t('navDashboard')} subtitle={monthLabel(monthKey, locale)} />

      {loading ? (
        <div className="space-y-3" aria-busy="true" aria-label={t('loadingLabel')}>
          <Skeleton className="h-36" />
          <div className="grid grid-cols-2 gap-3">
            <Skeleton className="h-20" />
            <Skeleton className="h-20" />
          </div>
          <Skeleton className="h-64" />
        </div>
      ) : (
        <>
          <section className="space-y-3">
            <div className="rounded-2xl bg-brand-600 p-5 text-white shadow-sm">
              <p className="text-sm text-brand-100">{t('statBalance')}</p>
              <p className={`num mt-1 text-4xl font-bold ${balance < 0 ? 'text-red-200' : ''}`}>{money(balance)}</p>
              <div className="mt-4 h-2 overflow-hidden rounded-full bg-white/20" aria-hidden>
                <div className="h-full rounded-full bg-white transition-[width] duration-500" style={{ width: `${spentPct}%` }} />
              </div>
              <p className="mt-1.5 text-xs text-brand-100">
                <span className="num">{Math.round(spentPct)}%</span> {t('spentShareOfIncome')}
              </p>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <StatTile label={t('statIncome')} value={money(totalIncome)} icon={TrendingUp} tone="income" />
              <StatTile label={t('statExpense')} value={money(totalExpense)} icon={TrendingDown} tone="expense" />
            </div>
          </section>

          {budgetAlerts.length > 0 && (
            <Card className="border-amber-200 bg-amber-50">
              <h3 className="mb-3 flex items-center gap-2 font-semibold text-amber-800">
                <AlertTriangle className="h-5 w-5" aria-hidden />
                {t('budgetAlertsTitle')}
              </h3>
              <ul className="space-y-3">
                {budgetAlerts.map((b) => (
                  <li key={b.id}>
                    <div className="mb-1 flex items-center justify-between gap-2 text-sm">
                      <span className="flex items-center gap-2 font-medium text-ink">
                        {b.cat && <CategoryBadge icon={b.cat.icon} color={b.cat.color} size="sm" />}
                        {b.cat ? translateCategoryName(b.cat.name) : ''}
                      </span>
                      <span className={`num font-semibold ${b.pct > 100 ? 'text-red-700' : 'text-amber-800'}`}>{Math.round(b.pct)}%</span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-amber-100" aria-hidden>
                      <div
                        className={`h-full rounded-full ${b.pct > 100 ? 'bg-red-500' : 'bg-amber-500'}`}
                        style={{ width: `${Math.min(b.pct, 100)}%` }}
                      />
                    </div>
                    <p className="mt-1 text-xs text-ink-muted">
                      <span className="num">{money(b.spent)}</span> {t('budgetOf')} <span className="num">{money(b.limit)}</span>
                      {b.pct > 100 && <span className="font-medium text-red-700">{t('budgetExceededSuffix')}</span>}
                    </p>
                  </li>
                ))}
              </ul>
            </Card>
          )}

          <div className="grid gap-5 lg:grid-cols-2">
            <Card>
              <h3 className="mb-4 font-semibold text-ink">{t('pieTitle')}</h3>
              {breakdown.length === 0 ? (
                <EmptyState icon={PieIcon} text={t('pieEmpty')} />
              ) : (
                <>
                  <div className="relative mx-auto h-48 w-48" dir="ltr">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie data={breakdown} dataKey="value" nameKey="name" innerRadius="68%" outerRadius="100%" paddingAngle={2} stroke="none">
                          {breakdown.map((entry) => (
                            <Cell key={entry.id} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip formatter={(v) => money(Number(v))} />
                      </PieChart>
                    </ResponsiveContainer>
                    <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
                      <span className="text-xs text-ink-subtle">{t('monthTotal')}</span>
                      <span className="num text-lg font-bold text-ink">{money(totalExpense)}</span>
                    </div>
                  </div>
                  {/* Legend as a list: name, amount and share, so meaning never relies on color alone. */}
                  <ul className="mt-5 divide-y divide-line">
                    {breakdown.map((b) => (
                      <li key={b.id} className="flex items-center gap-3 py-2.5">
                        <span className="h-3 w-3 shrink-0 rounded-full" style={{ backgroundColor: b.color }} aria-hidden />
                        <span className="min-w-0 flex-1 truncate text-sm text-ink">
                          {b.icon} {b.name}
                        </span>
                        <span className="num text-xs text-ink-subtle">{Math.round((b.value / totalExpense) * 100)}%</span>
                        <span className="num w-24 text-end text-sm font-semibold text-ink">{money(b.value)}</span>
                      </li>
                    ))}
                  </ul>
                </>
              )}
            </Card>

            <Card>
              <h3 className="mb-4 font-semibold text-ink">{t('trendTitle')}</h3>
              <div className="h-64" dir="ltr">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={trendData} margin={{ top: 4, right: 0, left: 0, bottom: 0 }} barGap={2}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                    {/* RTL: oldest month on the right, axis values on the right. */}
                    <XAxis dataKey="month" reversed tick={{ fontSize: 12, fill: '#64748b' }} tickLine={false} axisLine={false} />
                    <YAxis
                      orientation="right"
                      width={52}
                      tick={{ fontSize: 11, fill: '#64748b' }}
                      tickLine={false}
                      axisLine={false}
                      tickFormatter={(v) => formatMoneyCompact(Number(v), locale, currency)}
                    />
                    <Tooltip formatter={(v) => money(Number(v))} cursor={{ fill: '#f1f5f9' }} />
                    <Legend iconType="circle" wrapperStyle={{ fontSize: 13 }} />
                    <Bar dataKey="income" fill={INCOME_COLOR} radius={[6, 6, 0, 0]} name={t('legendIncome')} maxBarSize={18} />
                    <Bar dataKey="expense" fill={EXPENSE_COLOR} radius={[6, 6, 0, 0]} name={t('legendExpense')} maxBarSize={18} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </Card>
          </div>
        </>
      )}
    </div>
  )
}

function StatTile({
  label,
  value,
  icon: Icon,
  tone,
}: {
  label: string
  value: string
  icon: typeof TrendingUp
  tone: 'income' | 'expense'
}) {
  const toneClass = tone === 'income' ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'
  return (
    <Card className="p-4">
      <div className="flex items-center gap-2">
        <span className={`flex h-8 w-8 items-center justify-center rounded-lg ${toneClass}`}>
          <Icon className="h-4 w-4" aria-hidden />
        </span>
        <p className="text-sm text-ink-muted">{label}</p>
      </div>
      <p className="num mt-2 text-xl font-bold text-ink">{value}</p>
    </Card>
  )
}
