import { useLiveQuery } from 'dexie-react-hooks'
import { useMemo, useState } from 'react'
import { db } from '../lib/db'
import { Button, Card, Input } from '../components/ui'
import { currentMonthKey, formatMoney, monthKeyOf, monthLabel } from '../lib/utils'

export default function Budgets() {
  const categories = useLiveQuery(() => db.categories.where('type').equals('expense').toArray(), [])
  const budgets = useLiveQuery(() => db.budgets.toArray(), [])
  const transactions = useLiveQuery(() => db.transactions.where('type').equals('expense').toArray(), [])

  const [drafts, setDrafts] = useState<Record<number, string>>({})
  const monthKey = currentMonthKey()

  const spentByCategory = useMemo(() => {
    const map = new Map<number, number>()
    for (const t of transactions ?? []) {
      if (monthKeyOf(t.date) !== monthKey) continue
      map.set(t.categoryId, (map.get(t.categoryId) ?? 0) + t.amount)
    }
    return map
  }, [transactions, monthKey])

  function budgetFor(categoryId: number) {
    return budgets?.find((b) => b.categoryId === categoryId)
  }

  async function saveBudget(categoryId: number, value: string) {
    const limit = Number(value)
    if (!limit || limit <= 0) return
    const existing = budgetFor(categoryId)
    if (existing) {
      await db.budgets.update(existing.id!, { monthlyLimit: limit })
    } else {
      await db.budgets.add({ categoryId, monthlyLimit: limit })
    }
    setDrafts((d) => ({ ...d, [categoryId]: '' }))
  }

  async function removeBudget(id: number) {
    await db.budgets.delete(id)
  }

  const totalBudget = (budgets ?? []).reduce((sum, b) => sum + b.monthlyLimit, 0)
  const totalSpent = (categories ?? []).reduce((sum, c) => sum + (spentByCategory.get(c.id!) ?? 0), 0)

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-purple-950">Budgets</h2>
        <p className="text-sm text-purple-400">Fixe un plafond mensuel par catégorie — {monthLabel(monthKey)}.</p>
      </div>

      {totalBudget > 0 && (
        <Card className="bg-gradient-to-br from-purple-600 to-fuchsia-500 text-white">
          <p className="text-sm opacity-80">Total budgété ce mois</p>
          <div className="mt-1 flex items-end justify-between">
            <p className="text-3xl font-bold">{formatMoney(totalSpent)}</p>
            <p className="text-sm opacity-80">/ {formatMoney(totalBudget)}</p>
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
                    <p className="text-sm font-semibold text-purple-900">{c.name}</p>
                    {budget && (
                      <p className="text-xs text-purple-400">
                        {formatMoney(spent)} / {formatMoney(budget.monthlyLimit)}
                      </p>
                    )}
                  </div>
                </div>

                {budget ? (
                  <button onClick={() => removeBudget(budget.id!)} className="cursor-pointer text-xs text-red-400 hover:underline">
                    Supprimer le budget
                  </button>
                ) : (
                  <div className="flex items-center gap-2">
                    <Input
                      type="number"
                      min="0"
                      placeholder="Plafond €"
                      value={drafts[c.id!] ?? ''}
                      onChange={(e) => setDrafts((d) => ({ ...d, [c.id!]: e.target.value }))}
                      className="w-28"
                    />
                    <Button variant="ghost" onClick={() => saveBudget(c.id!, drafts[c.id!] ?? '')}>
                      Définir
                    </Button>
                  </div>
                )}
              </div>

              {budget && (
                <div className="mt-3">
                  <ProgressBar value={spent} max={budget.monthlyLimit} />
                </div>
              )}
            </Card>
          )
        })}
        {(categories ?? []).length === 0 && (
          <Card>
            <p className="text-center text-sm text-purple-300">
              Crée d'abord des catégories de dépenses dans l'onglet Catégories.
            </p>
          </Card>
        )}
      </div>
    </div>
  )
}

function ProgressBar({ value, max, light = false }: { value: number; max: number; light?: boolean }) {
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
      {overBudget && !light && <p className="mt-1 text-xs font-medium text-red-500">⚠️ Budget dépassé</p>}
    </div>
  )
}
