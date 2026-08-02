import { useMemo, useState } from 'react'
import { addTransaction, deleteTransaction, updateTransaction, useCategories, useTransactions } from '../lib/data'
import type { RecurrenceFrequency, Transaction, TransactionType } from '../types'
import { Button, Card, EmptyState, Input, Label, Select } from '../components/ui'
import { formatMoney, monthKeyOf, monthLabel, todayIso } from '../lib/utils'
import { useLang } from '../lib/i18n'

const EMPTY_FORM = {
  type: 'expense' as TransactionType,
  amount: '',
  categoryId: '',
  description: '',
  date: todayIso(),
  recurring: false,
  recurrenceFrequency: 'monthly' as RecurrenceFrequency,
}

export default function Transactions() {
  const { t, locale, currency, translateCategoryName } = useLang()
  const money = (amount: number) => formatMoney(amount, locale, currency)
  const categories = useCategories()
  const allTransactions = useTransactions()
  const transactions = useMemo(() => (allTransactions ?? []).slice().sort((a, b) => (a.date < b.date ? 1 : -1)), [allTransactions])

  const [form, setForm] = useState(EMPTY_FORM)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [filterType, setFilterType] = useState<'all' | TransactionType>('all')
  const [filterMonth, setFilterMonth] = useState('all')
  const [error, setError] = useState('')

  const categoriesForType = categories?.filter((c) => c.type === form.type) ?? []

  const monthOptions = useMemo(() => {
    const keys = new Set((transactions ?? []).map((tx) => monthKeyOf(tx.date)))
    return Array.from(keys).sort().reverse()
  }, [transactions])

  const filtered = useMemo(() => {
    return (transactions ?? []).filter((tx) => {
      if (filterType !== 'all' && tx.type !== filterType) return false
      if (filterMonth !== 'all' && monthKeyOf(tx.date) !== filterMonth) return false
      return true
    })
  }, [transactions, filterType, filterMonth])

  function categoryFor(id: string) {
    return categories?.find((c) => c.id === id)
  }

  function resetForm() {
    setEditingId(null)
    setForm(EMPTY_FORM)
    setError('')
    setShowForm(false)
  }

  function startEdit(tx: Transaction) {
    setEditingId(tx.id!)
    setForm({
      type: tx.type,
      amount: String(tx.amount),
      categoryId: String(tx.categoryId),
      description: tx.description,
      date: tx.date,
      recurring: tx.recurring,
      recurrenceFrequency: tx.recurrenceFrequency ?? 'monthly',
    })
    setShowForm(true)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const amount = Number(form.amount)
    if (!amount || amount <= 0) {
      setError(t('errorAmount'))
      return
    }
    if (!form.categoryId) {
      setError(t('errorCategory'))
      return
    }
    const payload: Transaction = {
      type: form.type,
      amount,
      categoryId: form.categoryId,
      description: form.description.trim(),
      date: form.date,
      recurring: form.recurring,
      recurrenceFrequency: form.recurring ? form.recurrenceFrequency : undefined,
    }
    if (editingId) {
      await updateTransaction(editingId, payload)
    } else {
      await addTransaction(payload)
    }
    resetForm()
  }

  async function handleDelete(id: string) {
    await deleteTransaction(id)
  }

  const grouped = useMemo(() => {
    const map = new Map<string, Transaction[]>()
    for (const tx of filtered) {
      if (!map.has(tx.date)) map.set(tx.date, [])
      map.get(tx.date)!.push(tx)
    }
    return Array.from(map.entries()).sort((a, b) => (a[0] < b[0] ? 1 : -1))
  }, [filtered])

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-purple-950">{t('transactionsTitle')}</h2>
          <p className="text-sm text-purple-400">{t('transactionsSubtitle')}</p>
        </div>
        <Button
          onClick={() => {
            setShowForm((s) => !s)
            if (showForm) resetForm()
          }}
        >
          {showForm ? t('closeButton') : t('addButton')}
        </Button>
      </div>

      {showForm && (
        <Card>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="flex gap-2">
              {(['expense', 'income'] as TransactionType[]).map((type) => (
                <button
                  type="button"
                  key={type}
                  onClick={() => setForm({ ...form, type, categoryId: '' })}
                  className={`flex-1 rounded-xl py-2 text-sm font-semibold transition-colors ${
                    form.type === type
                      ? type === 'expense'
                        ? 'bg-red-100 text-red-700'
                        : 'bg-green-100 text-green-700'
                      : 'bg-purple-50 text-purple-400'
                  }`}
                >
                  {type === 'expense' ? t('typeExpense') : t('typeIncome')}
                </button>
              ))}
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <Label>
                  {t('amountLabel')} ({currency === 'ILS' ? '₪' : '€'})
                </Label>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  value={form.amount}
                  onChange={(e) => setForm({ ...form, amount: e.target.value })}
                  placeholder="0.00"
                />
              </div>
              <div>
                <Label>{t('categoryLabel')}</Label>
                <Select value={form.categoryId} onChange={(e) => setForm({ ...form, categoryId: e.target.value })}>
                  <option value="">{t('categoryPlaceholder')}</option>
                  {categoriesForType.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.icon} {translateCategoryName(c.name)}
                    </option>
                  ))}
                </Select>
              </div>
              <div>
                <Label>{t('dateLabel')}</Label>
                <Input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} />
              </div>
              <div>
                <Label>{t('descriptionLabel')}</Label>
                <Input
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  placeholder={t('descriptionPlaceholder')}
                />
              </div>
            </div>

            <div>
              <div className="flex items-center gap-3">
                <label className="flex items-center gap-2 text-sm text-purple-700">
                  <input
                    type="checkbox"
                    checked={form.recurring}
                    onChange={(e) => setForm({ ...form, recurring: e.target.checked })}
                    className="h-4 w-4 rounded accent-purple-600"
                  />
                  {t('fixedExpensesLabel')}
                </label>
                {form.recurring && (
                  <Select
                    value={form.recurrenceFrequency}
                    onChange={(e) => setForm({ ...form, recurrenceFrequency: e.target.value as RecurrenceFrequency })}
                    className="w-40"
                  >
                    <option value="weekly">{t('freqWeekly')}</option>
                    <option value="monthly">{t('freqMonthly')}</option>
                    <option value="yearly">{t('freqYearly')}</option>
                  </Select>
                )}
              </div>
              {form.recurring && <p className="mt-1 text-xs text-purple-400">{t('fixedExpensesHint')}</p>}
            </div>

            {error && <p className="text-sm text-red-500">{error}</p>}

            <Button type="submit">{editingId ? t('saveButton') : t('addPlainButton')}</Button>
          </form>
        </Card>
      )}

      <div className="flex flex-wrap gap-3">
        <Select value={filterType} onChange={(e) => setFilterType(e.target.value as 'all' | TransactionType)} className="w-40">
          <option value="all">{t('filterAllTypes')}</option>
          <option value="expense">{t('filterExpenses')}</option>
          <option value="income">{t('filterIncomes')}</option>
        </Select>
        <Select value={filterMonth} onChange={(e) => setFilterMonth(e.target.value)} className="w-48">
          <option value="all">{t('filterAllMonths')}</option>
          {monthOptions.map((m) => (
            <option key={m} value={m}>
              {monthLabel(m, locale)}
            </option>
          ))}
        </Select>
      </div>

      <Card>
        {grouped.length === 0 ? (
          <EmptyState icon="🧾" text={t('transactionsEmpty')} />
        ) : (
          <div className="space-y-5">
            {grouped.map(([date, txs]) => (
              <div key={date}>
                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-purple-300">
                  {new Intl.DateTimeFormat(locale, { weekday: 'long', day: 'numeric', month: 'long' }).format(new Date(date))}
                </p>
                <ul className="space-y-2">
                  {txs.map((tx) => {
                    const cat = categoryFor(tx.categoryId)
                    return (
                      <li key={tx.id} className="group flex items-center justify-between rounded-xl bg-purple-50/60 px-3 py-2.5">
                        <div className="flex items-center gap-3">
                          <span
                            className="flex h-9 w-9 items-center justify-center rounded-full text-base"
                            style={{ backgroundColor: (cat?.color ?? '#999') + '33' }}
                          >
                            {cat?.icon ?? '❓'}
                          </span>
                          <div>
                            <p className="text-sm font-medium text-purple-900">
                              {tx.description || (cat ? translateCategoryName(cat.name) : '')}{' '}
                              {tx.recurring && <span title={t('recurringTitle')}>🔁</span>}
                            </p>
                            <p className="text-xs text-purple-400">{cat ? translateCategoryName(cat.name) : ''}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className={`text-sm font-semibold ${tx.type === 'income' ? 'text-green-600' : 'text-red-500'}`}>
                            {tx.type === 'income' ? '+' : '-'}
                            {money(tx.amount)}
                          </span>
                          <button
                            onClick={() => startEdit(tx)}
                            className="cursor-pointer rounded-lg px-2 py-1 text-xs text-purple-400 hover:bg-purple-100 sm:opacity-0 sm:group-hover:opacity-100"
                          >
                            ✏️
                          </button>
                          <button
                            onClick={() => handleDelete(tx.id!)}
                            className="cursor-pointer rounded-lg px-2 py-1 text-xs text-red-400 hover:bg-red-50 sm:opacity-0 sm:group-hover:opacity-100"
                          >
                            🗑️
                          </button>
                        </div>
                      </li>
                    )
                  })}
                </ul>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  )
}
