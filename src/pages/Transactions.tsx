import { useLiveQuery } from 'dexie-react-hooks'
import { useMemo, useState } from 'react'
import { db } from '../lib/db'
import type { RecurrenceFrequency, Transaction, TransactionType } from '../types'
import { Button, Card, EmptyState, Input, Label, Select } from '../components/ui'
import { formatMoney, monthKeyOf, monthLabel, todayIso } from '../lib/utils'

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
  const categories = useLiveQuery(() => db.categories.toArray(), [])
  const transactions = useLiveQuery(() => db.transactions.orderBy('date').reverse().toArray(), [])

  const [form, setForm] = useState(EMPTY_FORM)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [filterType, setFilterType] = useState<'all' | TransactionType>('all')
  const [filterMonth, setFilterMonth] = useState('all')
  const [error, setError] = useState('')

  const categoriesForType = categories?.filter((c) => c.type === form.type) ?? []

  const monthOptions = useMemo(() => {
    const keys = new Set((transactions ?? []).map((t) => monthKeyOf(t.date)))
    return Array.from(keys).sort().reverse()
  }, [transactions])

  const filtered = useMemo(() => {
    return (transactions ?? []).filter((t) => {
      if (filterType !== 'all' && t.type !== filterType) return false
      if (filterMonth !== 'all' && monthKeyOf(t.date) !== filterMonth) return false
      return true
    })
  }, [transactions, filterType, filterMonth])

  function categoryFor(id: number) {
    return categories?.find((c) => c.id === id)
  }

  function resetForm() {
    setEditingId(null)
    setForm(EMPTY_FORM)
    setError('')
    setShowForm(false)
  }

  function startEdit(t: Transaction) {
    setEditingId(t.id!)
    setForm({
      type: t.type,
      amount: String(t.amount),
      categoryId: String(t.categoryId),
      description: t.description,
      date: t.date,
      recurring: t.recurring,
      recurrenceFrequency: t.recurrenceFrequency ?? 'monthly',
    })
    setShowForm(true)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const amount = Number(form.amount)
    if (!amount || amount <= 0) {
      setError('Le montant doit être positif')
      return
    }
    if (!form.categoryId) {
      setError('Choisis une catégorie')
      return
    }
    const payload: Transaction = {
      type: form.type,
      amount,
      categoryId: Number(form.categoryId),
      description: form.description.trim(),
      date: form.date,
      recurring: form.recurring,
      recurrenceFrequency: form.recurring ? form.recurrenceFrequency : undefined,
    }
    if (editingId) {
      await db.transactions.update(editingId, payload)
    } else {
      await db.transactions.add(payload)
    }
    resetForm()
  }

  async function handleDelete(id: number) {
    await db.transactions.delete(id)
  }

  const grouped = useMemo(() => {
    const map = new Map<string, Transaction[]>()
    for (const t of filtered) {
      if (!map.has(t.date)) map.set(t.date, [])
      map.get(t.date)!.push(t)
    }
    return Array.from(map.entries()).sort((a, b) => (a[0] < b[0] ? 1 : -1))
  }, [filtered])

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-purple-950">Transactions</h2>
          <p className="text-sm text-purple-400">Tous tes revenus et dépenses.</p>
        </div>
        <Button
          onClick={() => {
            setShowForm((s) => !s)
            if (showForm) resetForm()
          }}
        >
          {showForm ? 'Fermer' : '+ Ajouter'}
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
                  {type === 'expense' ? '💸 Dépense' : '💰 Revenu'}
                </button>
              ))}
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <Label>Montant (€)</Label>
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
                <Label>Catégorie</Label>
                <Select value={form.categoryId} onChange={(e) => setForm({ ...form, categoryId: e.target.value })}>
                  <option value="">Choisir...</option>
                  {categoriesForType.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.icon} {c.name}
                    </option>
                  ))}
                </Select>
              </div>
              <div>
                <Label>Date</Label>
                <Input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} />
              </div>
              <div>
                <Label>Description</Label>
                <Input
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  placeholder="ex: Courses Carrefour"
                />
              </div>
            </div>

            <div className="flex items-center gap-3">
              <label className="flex items-center gap-2 text-sm text-purple-700">
                <input
                  type="checkbox"
                  checked={form.recurring}
                  onChange={(e) => setForm({ ...form, recurring: e.target.checked })}
                  className="h-4 w-4 rounded accent-purple-600"
                />
                Récurrente
              </label>
              {form.recurring && (
                <Select
                  value={form.recurrenceFrequency}
                  onChange={(e) => setForm({ ...form, recurrenceFrequency: e.target.value as RecurrenceFrequency })}
                  className="w-40"
                >
                  <option value="weekly">Hebdomadaire</option>
                  <option value="monthly">Mensuelle</option>
                  <option value="yearly">Annuelle</option>
                </Select>
              )}
            </div>

            {error && <p className="text-sm text-red-500">{error}</p>}

            <Button type="submit">{editingId ? 'Enregistrer' : 'Ajouter'}</Button>
          </form>
        </Card>
      )}

      <div className="flex flex-wrap gap-3">
        <Select value={filterType} onChange={(e) => setFilterType(e.target.value as 'all' | TransactionType)} className="w-40">
          <option value="all">Tous types</option>
          <option value="expense">Dépenses</option>
          <option value="income">Revenus</option>
        </Select>
        <Select value={filterMonth} onChange={(e) => setFilterMonth(e.target.value)} className="w-48">
          <option value="all">Tous les mois</option>
          {monthOptions.map((m) => (
            <option key={m} value={m}>
              {monthLabel(m)}
            </option>
          ))}
        </Select>
      </div>

      <Card>
        {grouped.length === 0 ? (
          <EmptyState icon="🧾" text="Aucune transaction pour l'instant." />
        ) : (
          <div className="space-y-5">
            {grouped.map(([date, txs]) => (
              <div key={date}>
                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-purple-300">
                  {new Intl.DateTimeFormat('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' }).format(new Date(date))}
                </p>
                <ul className="space-y-2">
                  {txs.map((t) => {
                    const cat = categoryFor(t.categoryId)
                    return (
                      <li key={t.id} className="group flex items-center justify-between rounded-xl bg-purple-50/60 px-3 py-2.5">
                        <div className="flex items-center gap-3">
                          <span
                            className="flex h-9 w-9 items-center justify-center rounded-full text-base"
                            style={{ backgroundColor: (cat?.color ?? '#999') + '33' }}
                          >
                            {cat?.icon ?? '❓'}
                          </span>
                          <div>
                            <p className="text-sm font-medium text-purple-900">
                              {t.description || cat?.name} {t.recurring && <span title="Récurrente">🔁</span>}
                            </p>
                            <p className="text-xs text-purple-400">{cat?.name}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className={`text-sm font-semibold ${t.type === 'income' ? 'text-green-600' : 'text-red-500'}`}>
                            {t.type === 'income' ? '+' : '-'}
                            {formatMoney(t.amount)}
                          </span>
                          <button
                            onClick={() => startEdit(t)}
                            className="cursor-pointer rounded-lg px-2 py-1 text-xs text-purple-400 opacity-0 hover:bg-purple-100 group-hover:opacity-100"
                          >
                            ✏️
                          </button>
                          <button
                            onClick={() => handleDelete(t.id!)}
                            className="cursor-pointer rounded-lg px-2 py-1 text-xs text-red-400 opacity-0 hover:bg-red-50 group-hover:opacity-100"
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
