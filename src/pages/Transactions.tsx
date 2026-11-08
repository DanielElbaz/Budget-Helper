import { useMemo, useState } from 'react'
import { Plus, Receipt, Repeat, Trash2, X } from 'lucide-react'
import { addTransaction, deleteTransaction, updateTransaction, useCategories, useTransactions } from '../lib/data'
import type { RecurrenceFrequency, Transaction, TransactionType } from '../types'
import { Button, Card, CategoryBadge, EmptyState, Field, IconButton, Input, PageHeader, Segmented, Select, SkeletonList } from '../components/ui'
import { useFeedback } from '../components/feedback'
import { currentMonthKey, formatMoney, formatSignedMoney, monthKeyOf, monthLabel, todayIso } from '../lib/utils'
import { useLang } from '../lib/i18n'

function emptyForm() {
  return {
    type: 'expense' as TransactionType,
    amount: '',
    categoryId: '',
    description: '',
    date: todayIso(),
    recurring: false,
    recurrenceFrequency: 'monthly' as RecurrenceFrequency,
  }
}

export default function Transactions() {
  const { t, locale, currency, translateCategoryName } = useLang()
  const { run, confirm } = useFeedback()
  const money = (amount: number) => formatMoney(amount, locale, currency)
  const categories = useCategories()
  const allTransactions = useTransactions()
  const transactions = useMemo(() => (allTransactions ?? []).slice().sort((a, b) => (a.date < b.date ? 1 : -1)), [allTransactions])

  const [form, setForm] = useState(emptyForm)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [saving, setSaving] = useState(false)
  const [filterType, setFilterType] = useState<'all' | TransactionType>('all')
  const [filterMonth, setFilterMonth] = useState(currentMonthKey())
  const [error, setError] = useState('')

  const categoriesForType = categories?.filter((c) => c.type === form.type) ?? []

  const monthOptions = useMemo(() => {
    const keys = new Set(transactions.map((tx) => monthKeyOf(tx.date)))
    keys.add(currentMonthKey())
    return Array.from(keys).sort().reverse()
  }, [transactions])

  const filtered = useMemo(
    () =>
      transactions.filter((tx) => {
        if (filterType !== 'all' && tx.type !== filterType) return false
        if (filterMonth !== 'all' && monthKeyOf(tx.date) !== filterMonth) return false
        return true
      }),
    [transactions, filterType, filterMonth],
  )

  const totals = useMemo(
    () => ({
      income: filtered.filter((tx) => tx.type === 'income').reduce((s, tx) => s + tx.amount, 0),
      expense: filtered.filter((tx) => tx.type === 'expense').reduce((s, tx) => s + tx.amount, 0),
    }),
    [filtered],
  )

  const grouped = useMemo(() => {
    const map = new Map<string, Transaction[]>()
    for (const tx of filtered) {
      if (!map.has(tx.date)) map.set(tx.date, [])
      map.get(tx.date)!.push(tx)
    }
    return Array.from(map.entries())
  }, [filtered])

  function categoryFor(id: string) {
    return categories?.find((c) => c.id === id)
  }

  function resetForm() {
    setEditingId(null)
    setForm(emptyForm())
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
    setError('')
    setShowForm(true)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const amount = Number(form.amount.replace(',', '.'))
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
    setSaving(true)
    const ok = await run(() => (editingId ? updateTransaction(editingId, payload) : addTransaction(payload)), t('toastSaved'))
    setSaving(false)
    if (ok) resetForm()
  }

  async function handleDelete(tx: Transaction) {
    const cat = categoryFor(tx.categoryId)
    const ok = await confirm({
      title: t('confirmDeleteTransaction'),
      body: `${tx.description || (cat ? translateCategoryName(cat.name) : '')} · ${money(tx.amount)}. ${t('confirmIrreversible')}`,
    })
    if (!ok) return
    await run(() => deleteTransaction(tx.id!), t('toastDeleted'))
    if (editingId === tx.id) resetForm()
  }

  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <PageHeader
        title={t('transactionsTitle')}
        subtitle={t('transactionsSubtitle')}
        action={
          showForm ? (
            <Button variant="secondary" icon={X} onClick={resetForm}>
              {t('closeButton')}
            </Button>
          ) : (
            <Button icon={Plus} onClick={() => setShowForm(true)}>
              {t('addButton')}
            </Button>
          )
        }
      />

      {showForm && (
        <Card className="animate-sheet">
          <form onSubmit={handleSubmit} className="space-y-4" noValidate>
            <Segmented
              label={t('typeLabel')}
              value={form.type}
              onChange={(type) => setForm({ ...form, type, categoryId: '' })}
              options={[
                { value: 'expense', label: t('typeExpense'), activeClass: 'bg-rose-600 text-white shadow-sm' },
                { value: 'income', label: t('typeIncome'), activeClass: 'bg-emerald-600 text-white shadow-sm' },
              ]}
            />

            <div className="grid gap-4 sm:grid-cols-2">
              <Field label={`${t('amountLabel')} (₪)`}>
                {(id) => (
                  <Input
                    id={id}
                    type="text"
                    inputMode="decimal"
                    autoComplete="off"
                    dir="ltr"
                    className="num text-end"
                    value={form.amount}
                    onChange={(e) => setForm({ ...form, amount: e.target.value.replace(/[^\d.,]/g, '') })}
                    placeholder="0"
                    aria-invalid={error === t('errorAmount')}
                  />
                )}
              </Field>
              <Field label={t('categoryLabel')}>
                {(id) => (
                  <Select
                    id={id}
                    value={form.categoryId}
                    onChange={(e) => setForm({ ...form, categoryId: e.target.value })}
                    aria-invalid={error === t('errorCategory')}
                  >
                    <option value="">{t('categoryPlaceholder')}</option>
                    {categoriesForType.map((c) => (
                      <option key={c.id} value={c.id}>
                        {translateCategoryName(c.name)}
                      </option>
                    ))}
                  </Select>
                )}
              </Field>
              <Field label={t('dateLabel')}>
                {(id) => <Input id={id} type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} />}
              </Field>
              <Field label={t('descriptionLabel')}>
                {(id) => (
                  <Input
                    id={id}
                    value={form.description}
                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                    placeholder={t('descriptionPlaceholder')}
                  />
                )}
              </Field>
            </div>

            <div className="rounded-xl bg-slate-50 p-3">
              <label className="flex min-h-11 cursor-pointer items-center gap-3 text-sm font-medium text-ink">
                <input
                  type="checkbox"
                  checked={form.recurring}
                  onChange={(e) => setForm({ ...form, recurring: e.target.checked })}
                  className="h-5 w-5 rounded accent-brand-600"
                />
                <Repeat className="h-4 w-4 text-ink-subtle" aria-hidden />
                {t('fixedExpensesLabel')}
              </label>
              {form.recurring && (
                <div className="mt-2 space-y-2">
                  <Select
                    aria-label={t('recurringLabel')}
                    value={form.recurrenceFrequency}
                    onChange={(e) => setForm({ ...form, recurrenceFrequency: e.target.value as RecurrenceFrequency })}
                  >
                    <option value="weekly">{t('freqWeekly')}</option>
                    <option value="monthly">{t('freqMonthly')}</option>
                    <option value="yearly">{t('freqYearly')}</option>
                  </Select>
                  <p className="text-xs text-ink-subtle">{t('fixedExpensesHint')}</p>
                </div>
              )}
            </div>

            {error && (
              <p role="alert" className="text-sm font-medium text-red-600">
                {error}
              </p>
            )}

            <Button type="submit" className="w-full sm:w-auto" disabled={saving}>
              {saving ? t('loadingLabel') : editingId ? t('saveButton') : t('addPlainButton')}
            </Button>
          </form>
        </Card>
      )}

      <div className="grid gap-3 sm:grid-cols-[1fr_14rem]">
        <Segmented
          label={t('filterTypeLabel')}
          value={filterType}
          onChange={setFilterType}
          options={[
            { value: 'all', label: t('filterAllTypes') },
            { value: 'expense', label: t('filterExpenses') },
            { value: 'income', label: t('filterIncomes') },
          ]}
        />
        <Select aria-label={t('filterMonthLabel')} value={filterMonth} onChange={(e) => setFilterMonth(e.target.value)}>
          {monthOptions.map((m) => (
            <option key={m} value={m}>
              {monthLabel(m, locale)}
            </option>
          ))}
          <option value="all">{t('filterAllMonths')}</option>
        </Select>
      </div>

      {allTransactions !== undefined && filtered.length > 0 && (
        <div className="grid grid-cols-2 gap-3">
          {filterType !== 'expense' && (
            <div className={`rounded-xl bg-emerald-50 px-4 py-3 ${filterType === 'income' ? 'col-span-2' : ''}`}>
              <p className="text-xs text-emerald-800">{t('statIncome')}</p>
              <p className="num text-lg font-bold text-emerald-700">{money(totals.income)}</p>
            </div>
          )}
          {filterType !== 'income' && (
            <div className={`rounded-xl bg-rose-50 px-4 py-3 ${filterType === 'expense' ? 'col-span-2' : ''}`}>
              <p className="text-xs text-rose-800">{t('statExpense')}</p>
              <p className="num text-lg font-bold text-rose-700">{money(totals.expense)}</p>
            </div>
          )}
        </div>
      )}

      {allTransactions === undefined ? (
        <SkeletonList rows={6} label={t('loadingLabel')} />
      ) : grouped.length === 0 ? (
        <Card>
          <EmptyState icon={Receipt} text={t('transactionsEmpty')} />
        </Card>
      ) : (
        <div className="space-y-4">
          {grouped.map(([date, txs]) => (
            <section key={date}>
              <h3 className="mb-2 px-1 text-sm font-semibold text-ink-muted">
                {new Intl.DateTimeFormat(locale, { weekday: 'long', day: 'numeric', month: 'long' }).format(new Date(`${date}T00:00:00`))}
              </h3>
              <Card className="overflow-hidden p-0 sm:p-0">
                <ul className="divide-y divide-line">
                  {txs.map((tx) => {
                    const cat = categoryFor(tx.categoryId)
                    const catName = cat ? translateCategoryName(cat.name) : ''
                    return (
                      <li key={tx.id} className="group flex items-center">
                        <button
                          type="button"
                          onClick={() => startEdit(tx)}
                          aria-label={`${t('editButton')}: ${tx.description || catName}, ${money(tx.amount)}`}
                          className="flex min-h-16 min-w-0 flex-1 cursor-pointer items-center gap-3 py-2.5 ps-3 text-start transition-colors duration-150 hover:bg-slate-50 active:bg-slate-100 sm:ps-4"
                        >
                          <CategoryBadge icon={cat?.icon ?? 'package'} color={cat?.color ?? '#94a3b8'} />
                          <div className="min-w-0 flex-1">
                            <p className="flex items-center gap-1.5 text-sm font-medium text-ink">
                              <span className="truncate">{tx.description || catName}</span>
                              {tx.recurring && <Repeat className="h-3.5 w-3.5 shrink-0 text-ink-subtle" aria-label={t('recurringTitle')} />}
                            </p>
                            {tx.description && <p className="truncate text-xs text-ink-subtle">{catName}</p>}
                          </div>
                          <span className={`num shrink-0 text-sm font-semibold ${tx.type === 'income' ? 'text-emerald-700' : 'text-ink'}`}>
                            {formatSignedMoney(tx.type === 'income' ? tx.amount : -tx.amount, locale, currency)}
                          </span>
                        </button>
                        <IconButton
                          icon={Trash2}
                          label={`${t('deleteButton')}: ${tx.description || catName}`}
                          tone="danger"
                          className="me-1 transition-opacity [@media(hover:hover)]:opacity-0 [@media(hover:hover)]:group-hover:opacity-100 [@media(hover:hover)]:focus-visible:opacity-100"
                          onClick={() => handleDelete(tx)}
                        />
                      </li>
                    )
                  })}
                </ul>
              </Card>
            </section>
          ))}
        </div>
      )}
    </div>
  )
}
