import { useMemo, useState } from 'react'
import { addBudget, deleteBudget, updateBudget, useBudgets, useCategories, useTransactions } from '../lib/data'
import { Button, Card, Input } from '../components/ui'
import { currentMonthKey, formatMoney, monthKeyOf, monthLabel } from '../lib/utils'
import { useLang } from '../lib/i18n'

export default function Budgets() {
  const { t, locale, currency, translateCategoryName } = useLang()
  const money = (amount: number) => formatMoney(amount, locale, currency)
  const allCategories = useCategories()
  const categories = allCategories?.filter((c) => c.type === 'expense')
  const budgets = useBudgets()
  const allTransactions = useTransactions()
  const transactions = allTransactions?.filter((t) => t.type === 'expense')

  const [drafts, setDrafts] = useState<Record<string, string>>({})
  const monthKey = currentMonthKey()

  const spentByCategory = useMemo(() => {
    const map = new Map<string, number>()
    for (const tx of transactions ?? []) {
      if (monthKeyOf(tx.date) !== monthKey) continue
      map.set(tx.categoryId, (map.get(tx.categoryId) ?? 0) + tx.amount)
    }
    return map
  }, [transactions, monthKey])

  function budgetFor(categoryId: string) {
    return budgets?.find((b) => b.categoryId === categoryId)
  }

  async function saveBudget(categoryId: string, value: string) {
    const limit = Number(value)
    if (!limit || limit <= 0) return
    const existing = budgetFor(categoryId)
    if (existing) {
      await updateBudget(existing.id!, { monthlyLimit: limit })
    } else {
      await addBudget({ categoryId, monthlyLimit: limit })
    }
    setDrafts((d) => ({ ...d, [categoryId]: '' }))
  }

  async function removeBudget(id: string) {
    await deleteBudget(id)
  }

  const totalBudget = (budgets ?? []).reduce((sum, b) => sum + b.monthlyLimit, 0)
  const totalSpent = (categories ?? []).reduce((sum, c) => sum + (spentByCategory.get(c.id!) ?? 0), 0)

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-purple-950">{t('budgetsTitle')}</h2>
        <p className="text-sm text-purple-400">
          {t('budgetsSubtitle')} {monthLabel(monthKey, locale)}.
        </p>
      </div>

      {totalBudget > 0 && (
        <Card className="bg-gradient-to-br from-purple-600 to-fuchsia-500 text-white">
          <p className="text-sm opacity-80">{t('totalBudgeted')}</p>
          <div className="mt-1 flex items-end justify-between">
            <p className="text-3xl font-bold">{money(totalSpent)}</p>
            <p className="text-sm opacity-80">/ {money(totalBudget)}</p>
          </div>
          <ProgressBar value={totalSpent} max={totalBudget} light />
        </Card>
      )}

      <div className="space-y-3">
        {(categories ?? []).map((c) => {
          const budget = budgetFor(c.id!)
          const spent = spentByCategory.get(c.id!) ?? 0
          return (
            <Card key={c.id}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span
                    className="flex h-9 w-9 items-center justify-center rounded-full text-base"
                    style={{ backgroundColor: c.color + '33' }}
                  >
                    {c.icon}
                  </span>
                  <div>
                    <p className="text-sm font-semibold text-purple-900">{translateCategoryName(c.name)}</p>
                    {budget && (
                      <p className="text-xs text-purple-400">
                        {money(spent)} / {money(budget.monthlyLimit)}
                      </p>
                    )}
                  </div>
                </div>

                {budget ? (
                  <button onClick={() => removeBudget(budget.id!)} className="cursor-pointer text-xs text-red-400 hover:underline">
                    {t('removeBudget')}
                  </button>
                ) : (
                  <div className="flex items-center gap-2">
                    <Input
                      type="number"
                      min="0"
                      placeholder={`${t('limitPlaceholder')} ${currency === 'ILS' ? '₪' : '€'}`}
                      value={drafts[c.id!] ?? ''}
                      onChange={(e) => setDrafts((d) => ({ ...d, [c.id!]: e.target.value }))}
                      className="w-28"
                    />
                    <Button variant="ghost" onClick={() => saveBudget(c.id!, drafts[c.id!] ?? '')}>
                      {t('defineButton')}
                    </Button>
                  </div>
                )}
              </div>

              {budget && (
                <div className="mt-3">
                  <ProgressBar value={spent} max={budget.monthlyLimit} exceededLabel={t('budgetExceeded')} />
                </div>
              )}
            </Card>
          )
        })}
        {(categories ?? []).length === 0 && (
          <Card>
            <p className="text-center text-sm text-purple-300">{t('noExpenseCategories')}</p>
          </Card>
        )}
      </div>
    </div>
  )
}

function ProgressBar({
  value,
  max,
  light = false,
  exceededLabel,
}: {
  value: number
  max: number
  light?: boolean
  exceededLabel?: string
}) {
  const pct = max > 0 ? Math.min((value / max) * 100, 100) : 0
  const overBudget = value > max
  let barColor = light ? 'bg-white' : 'bg-green-500'
  if (!light) {
    if (overBudget) barColor = 'bg-red-500'
    else if (pct > 80) barColor = 'bg-amber-500'
  } else if (overBudget) {
    barColor = 'bg-red-300'
  }
  return (
    <div>
      <div className={`h-2.5 w-full overflow-hidden rounded-full ${light ? 'bg-white/25' : 'bg-purple-100'}`}>
        <div className={`h-full rounded-full transition-all ${barColor}`} style={{ width: `${pct}%` }} />
      </div>
      {overBudget && !light && exceededLabel && <p className="mt-1 text-xs font-medium text-red-500">{exceededLabel}</p>}
    </div>
  )
}
