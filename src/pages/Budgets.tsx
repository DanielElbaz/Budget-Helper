import { useMemo, useState } from 'react'
import { Check, Pencil, Plus, Trash2, X } from 'lucide-react'
import { addBudget, deleteBudget, updateBudget, useBudgets, useCategories, useTransactions } from '../lib/data'
import type { Budget, Category } from '../types'
import { Button, Card, CategoryBadge, IconButton, PageHeader, SkeletonList } from '../components/ui'
import { useFeedback } from '../components/feedback'
import { currentMonthKey, formatMoney, monthKeyOf, monthLabel } from '../lib/utils'
import { useLang } from '../lib/i18n'

export default function Budgets() {
  const { t, locale, currency, translateCategoryName } = useLang()
  const { run, confirm } = useFeedback()
  const money = (amount: number) => formatMoney(amount, locale, currency)
  const allCategories = useCategories()
  const budgets = useBudgets()
  const allTransactions = useTransactions()
  const loading = allCategories === undefined || budgets === undefined || allTransactions === undefined
  const monthKey = currentMonthKey()

  const spentByCategory = useMemo(() => {
    const map = new Map<string, number>()
    for (const tx of allTransactions ?? []) {
      if (tx.type !== 'expense' || monthKeyOf(tx.date) !== monthKey) continue
      map.set(tx.categoryId, (map.get(tx.categoryId) ?? 0) + tx.amount)
    }
    return map
  }, [allTransactions, monthKey])

  const rows = useMemo(() => {
    const list = (allCategories ?? [])
      .filter((c) => c.type === 'expense')
      .map((c) => {
        const budget = budgets?.find((b) => b.categoryId === c.id)
        const spent = spentByCategory.get(c.id!) ?? 0
        return { category: c, budget, spent, pct: budget ? (spent / budget.monthlyLimit) * 100 : -1 }
      })
    // Budgeted categories first, the closest to their limit on top.
    return list.sort((a, b) => b.pct - a.pct)
  }, [allCategories, budgets, spentByCategory])

  // Only count spending in categories that actually have a budget, so the
  // total compares like with like.
  const budgeted = rows.filter((r) => r.budget)
  const totalBudget = budgeted.reduce((sum, r) => sum + r.budget!.monthlyLimit, 0)
  const totalSpent = budgeted.reduce((sum, r) => sum + r.spent, 0)
  const remaining = totalBudget - totalSpent

  async function saveLimit(category: Category, budget: Budget | undefined, limit: number) {
    return run(
      () => (budget ? updateBudget(budget.id!, { monthlyLimit: limit }) : addBudget({ categoryId: category.id!, monthlyLimit: limit })),
      t('toastSaved'),
    )
  }

  async function removeBudget(category: Category, budget: Budget) {
    const ok = await confirm({ title: t('confirmDeleteBudget'), body: translateCategoryName(category.name) })
    if (ok) await run(() => deleteBudget(budget.id!), t('toastDeleted'))
  }

  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <PageHeader title={t('budgetsTitle')} subtitle={`${t('budgetsSubtitle')} ${monthLabel(monthKey, locale)}`} />

      {!loading && totalBudget > 0 && (
        <div className="rounded-2xl bg-brand-600 p-5 text-white shadow-sm">
          <p className="text-sm text-brand-100">{t('totalBudgeted')}</p>
          <div className="mt-1 flex flex-wrap items-baseline gap-x-2">
            <p className="num text-3xl font-bold">{money(totalSpent)}</p>
            <p className="text-sm text-brand-100">
              {t('budgetOf')} <span className="num">{money(totalBudget)}</span>
            </p>
          </div>
          <ProgressBar value={totalSpent} max={totalBudget} onDark />
          <p className={`mt-2 text-sm font-medium ${remaining < 0 ? 'text-red-200' : 'text-brand-50'}`}>
            {remaining < 0 ? t('budgetOver') : t('budgetRemaining')} <span className="num">{money(Math.abs(remaining))}</span>
          </p>
        </div>
      )}

      {loading ? (
        <SkeletonList rows={5} label={t('loadingLabel')} />
      ) : rows.length === 0 ? (
        <Card>
          <p className="py-4 text-center text-sm text-ink-subtle">{t('noExpenseCategories')}</p>
        </Card>
      ) : (
        <ul className="space-y-3">
          {rows.map(({ category, budget, spent }) => (
            <li key={category.id}>
              <BudgetRow
                category={category}
                budget={budget}
                spent={spent}
                name={translateCategoryName(category.name)}
                money={money}
                onSave={(limit) => saveLimit(category, budget, limit)}
                onRemove={budget ? () => removeBudget(category, budget) : undefined}
              />
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

function BudgetRow({
  category,
  budget,
  spent,
  name,
  money,
  onSave,
  onRemove,
}: {
  category: Category
  budget?: Budget
  spent: number
  name: string
  money: (n: number) => string
  onSave: (limit: number) => Promise<boolean>
  onRemove?: () => void
}) {
  const { t } = useLang()
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState('')
  const [saving, setSaving] = useState(false)
  const inputId = `limit-${category.id}`

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    const limit = Number(draft.replace(',', '.'))
    if (!limit || limit <= 0) return
    setSaving(true)
    const ok = await onSave(limit)
    setSaving(false)
    if (ok) {
      setDraft('')
      setEditing(false)
    }
  }

  const showForm = editing
  const over = budget ? spent - budget.monthlyLimit : 0

  return (
    <Card>
      <div className="flex items-center gap-3">
        <CategoryBadge icon={category.icon} color={category.color} />
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-ink">{name}</p>
          {budget ? (
            <p className="text-xs text-ink-subtle">
              <span className="num">{money(spent)}</span> {t('budgetOf')} <span className="num">{money(budget.monthlyLimit)}</span>
            </p>
          ) : (
            <p className="text-xs text-ink-subtle">{t('noBudgetYet')}</p>
          )}
        </div>
        {!budget && !editing && (
          <Button variant="secondary" icon={Plus} className="shrink-0" onClick={() => setEditing(true)}>
            {t('defineButton')}
          </Button>
        )}
        {budget && !editing && (
          <div className="flex shrink-0">
            <IconButton
              icon={Pencil}
              label={t('editButton')}
              onClick={() => {
                setDraft(String(budget.monthlyLimit))
                setEditing(true)
              }}
            />
            {onRemove && <IconButton icon={Trash2} label={t('removeBudget')} tone="danger" onClick={onRemove} />}
          </div>
        )}
      </div>

      {showForm && (
        <form onSubmit={submit} className="mt-3 flex items-center gap-2">
          <label htmlFor={inputId} className="sr-only">
            {t('limitPlaceholder')} — {name}
          </label>
          <div className="relative flex-1" dir="ltr">
            <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-ink-subtle">₪</span>
            <input
              id={inputId}
              autoFocus
              type="text"
              inputMode="decimal"
              autoComplete="off"
              placeholder={t('limitPlaceholder')}
              value={draft}
              onChange={(e) => setDraft(e.target.value.replace(/[^\d.,]/g, ''))}
              className="num min-h-11 w-full rounded-xl border border-slate-300 bg-surface ps-8 pe-3 text-end text-base text-ink outline-none placeholder:text-slate-400 focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
            />
          </div>
          <Button type="submit" icon={Check} disabled={saving || !draft}>
            {t('saveButton')}
          </Button>
          <IconButton icon={X} label={t('cancelButton')} onClick={() => setEditing(false)} />
        </form>
      )}

      {budget && (
        <div className="mt-3">
          <ProgressBar value={spent} max={budget.monthlyLimit} />
          {over > 0 && (
            <p className="mt-1.5 text-xs font-medium text-red-700">
              {t('budgetExceeded')}: <span className="num">{money(over)}</span>
            </p>
          )}
        </div>
      )}
    </Card>
  )
}

function ProgressBar({ value, max, onDark = false }: { value: number; max: number; onDark?: boolean }) {
  const pct = max > 0 ? (value / max) * 100 : 0
  let barColor = 'bg-emerald-500'
  if (pct > 100) barColor = 'bg-red-500'
  else if (pct >= 80) barColor = 'bg-amber-500'
  if (onDark) barColor = pct > 100 ? 'bg-red-300' : 'bg-white'
  return (
    <div
      role="progressbar"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={Math.round(pct)}
      className={`mt-3 h-2.5 w-full overflow-hidden rounded-full ${onDark ? 'bg-white/25' : 'bg-slate-100'}`}
    >
      <div className={`h-full rounded-full transition-[width] duration-500 ${barColor}`} style={{ width: `${Math.min(pct, 100)}%` }} />
    </div>
  )
}
