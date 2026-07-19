import { useLiveQuery } from 'dexie-react-hooks'
import { useState } from 'react'
import { db } from '../lib/db'
import type { Category, TransactionType } from '../types'
import { Button, Card, Input, Label, Select } from '../components/ui'

const ICON_CHOICES = ['🏠', '🛒', '🚗', '🎮', '⚕️', '📱', '🛍️', '📦', '💼', '💻', '💰', '🍽️', '✈️', '🎓', '🐾', '🎁']
const COLOR_CHOICES = [
  '#f97316', '#22c55e', '#3b82f6', '#a855f7', '#ef4444', '#06b6d4',
  '#ec4899', '#6b7280', '#16a34a', '#0ea5e9', '#eab308', '#14b8a6',
]

const EMPTY_FORM = { name: '', icon: ICON_CHOICES[0], color: COLOR_CHOICES[0], type: 'expense' as TransactionType }

export default function Categories() {
  const categories = useLiveQuery(() => db.categories.toArray(), [])
  const [form, setForm] = useState(EMPTY_FORM)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [error, setError] = useState('')

  const expenseCategories = categories?.filter((c) => c.type === 'expense') ?? []
  const incomeCategories = categories?.filter((c) => c.type === 'income') ?? []

  function startEdit(category: Category) {
    setEditingId(category.id!)
    setForm({ name: category.name, icon: category.icon, color: category.color, type: category.type })
  }

  function resetForm() {
    setEditingId(null)
    setForm(EMPTY_FORM)
    setError('')
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.name.trim()) {
      setError('Le nom est requis')
      return
    }
    if (editingId) {
      await db.categories.update(editingId, form)
    } else {
      await db.categories.add(form)
    }
    resetForm()
  }

  async function handleDelete(id: number) {
    const [txCount, budget] = await Promise.all([
      db.transactions.where('categoryId').equals(id).count(),
      db.budgets.where('categoryId').equals(id).first(),
    ])
    if (txCount > 0) {
      alert('Impossible de supprimer : des transactions utilisent cette catégorie.')
      return
    }
    if (budget) await db.budgets.delete(budget.id!)
    await db.categories.delete(id)
    if (editingId === id) resetForm()
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-purple-950">Catégories</h2>
        <p className="text-sm text-purple-400">Organise tes revenus et dépenses par catégorie.</p>
      </div>

      <Card>
        <form onSubmit={handleSubmit} className="space-y-4">
          <h3 className="font-semibold text-purple-900">{editingId ? 'Modifier la catégorie' : 'Nouvelle catégorie'}</h3>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label>Nom</Label>
              <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="ex: Vacances" />
            </div>
            <div>
              <Label>Type</Label>
              <Select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value as TransactionType })}>
                <option value="expense">Dépense</option>
                <option value="income">Revenu</option>
              </Select>
            </div>
          </div>

          <div>
            <Label>Icône</Label>
            <div className="flex flex-wrap gap-2">
              {ICON_CHOICES.map((icon) => (
                <button
                  type="button"
                  key={icon}
                  onClick={() => setForm({ ...form, icon })}
                  className={`flex h-10 w-10 items-center justify-center rounded-xl text-xl transition-transform hover:scale-110 ${
                    form.icon === icon ? 'bg-purple-200 ring-2 ring-purple-500' : 'bg-purple-50'
                  }`}
                >
                  {icon}
                </button>
              ))}
            </div>
          </div>

          <div>
            <Label>Couleur</Label>
            <div className="flex flex-wrap gap-2">
              {COLOR_CHOICES.map((color) => (
                <button
                  type="button"
                  key={color}
                  onClick={() => setForm({ ...form, color })}
                  style={{ backgroundColor: color }}
                  className={`h-8 w-8 rounded-full transition-transform hover:scale-110 ${
                    form.color === color ? 'ring-2 ring-offset-2 ring-purple-500' : ''
                  }`}
                />
              ))}
            </div>
          </div>

          {error && <p className="text-sm text-red-500">{error}</p>}

          <div className="flex gap-2">
            <Button type="submit">{editingId ? 'Enregistrer' : 'Ajouter'}</Button>
            {editingId && (
              <Button type="button" variant="ghost" onClick={resetForm}>
                Annuler
              </Button>
            )}
          </div>
        </form>
      </Card>

      <div className="grid gap-6 sm:grid-cols-2">
        <CategoryGroup title="Dépenses" categories={expenseCategories} onEdit={startEdit} onDelete={handleDelete} />
        <CategoryGroup title="Revenus" categories={incomeCategories} onEdit={startEdit} onDelete={handleDelete} />
      </div>
    </div>
  )
}

function CategoryGroup({
  title,
  categories,
  onEdit,
  onDelete,
}: {
  title: string
  categories: Category[]
  onEdit: (c: Category) => void
  onDelete: (id: number) => void
}) {
  return (
    <Card>
      <h3 className="mb-3 font-semibold text-purple-900">{title}</h3>
      <ul className="space-y-2">
        {categories.map((c) => (
          <li key={c.id} className="flex items-center justify-between rounded-xl bg-purple-50/60 px-3 py-2">
            <div className="flex items-center gap-2">
              <span
                className="flex h-8 w-8 items-center justify-center rounded-full text-base"
                style={{ backgroundColor: c.color + '33' }}
              >
                {c.icon}
              </span>
              <span className="text-sm font-medium text-purple-900">{c.name}</span>
            </div>
            <div className="flex gap-1">
              <button onClick={() => onEdit(c)} className="cursor-pointer rounded-lg px-2 py-1 text-xs text-purple-500 hover:bg-purple-100">
                ✏️
              </button>
              <button onClick={() => onDelete(c.id!)} className="cursor-pointer rounded-lg px-2 py-1 text-xs text-red-400 hover:bg-red-50">
                🗑️
              </button>
            </div>
          </li>
        ))}
        {categories.length === 0 && <p className="py-4 text-center text-sm text-purple-300">Aucune catégorie</p>}
      </ul>
    </Card>
  )
}
