import Dexie, { type EntityTable } from 'dexie'
import type { Budget, Category, Transaction } from '../types'

export const DEFAULT_CATEGORIES: Category[] = [
  { name: 'Logement', icon: '🏠', color: '#f97316', type: 'expense' },
  { name: 'Alimentation', icon: '🛒', color: '#22c55e', type: 'expense' },
  { name: 'Transport', icon: '🚗', color: '#3b82f6', type: 'expense' },
  { name: 'Loisirs', icon: '🎮', color: '#a855f7', type: 'expense' },
  { name: 'Santé', icon: '⚕️', color: '#ef4444', type: 'expense' },
  { name: 'Abonnements', icon: '📱', color: '#06b6d4', type: 'expense' },
  { name: 'Shopping', icon: '🛍️', color: '#ec4899', type: 'expense' },
  { name: 'Autres dépenses', icon: '📦', color: '#6b7280', type: 'expense' },
  { name: 'Salaire', icon: '💼', color: '#16a34a', type: 'income' },
  { name: 'Freelance', icon: '💻', color: '#0ea5e9', type: 'income' },
  { name: 'Autres revenus', icon: '💰', color: '#eab308', type: 'income' },
]

class BudgetDatabase extends Dexie {
  categories!: EntityTable<Category, 'id'>
  transactions!: EntityTable<Transaction, 'id'>
  budgets!: EntityTable<Budget, 'id'>

  constructor() {
    super('BudgetHelperDB')
    this.version(1).stores({
      categories: '++id, name, type',
      transactions: '++id, categoryId, type, date',
      budgets: '++id, &categoryId',
    })
  }
}

export const db = new BudgetDatabase()

export async function ensureDefaultCategories() {
  const count = await db.categories.count()
  if (count === 0) {
    await db.categories.bulkAdd(DEFAULT_CATEGORIES)
  }
}
