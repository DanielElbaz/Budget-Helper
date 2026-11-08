import type { Category } from '../types'

export { ICON_CHOICES } from './categoryIcons'

// Seed categories, adapted from a real household budget spreadsheet
// (income sources + fixed/variable expense groups).
export const DEFAULT_CATEGORIES: Category[] = [
  // Income
  { name: 'Salaire conjoint 1', icon: 'briefcase', color: '#16a34a', type: 'income' },
  { name: 'Salaire conjoint 2', icon: 'briefcase', color: '#15803d', type: 'income' },
  { name: 'Allocations', icon: 'hand-coins', color: '#eab308', type: 'income' },
  { name: 'Autres revenus', icon: 'coins', color: '#84cc16', type: 'income' },

  // Fixed expenses
  { name: 'Logement', icon: 'home', color: '#f97316', type: 'expense' },
  { name: 'Électricité & Gaz', icon: 'zap', color: '#eab308', type: 'expense' },
  { name: 'Eau', icon: 'droplet', color: '#0ea5e9', type: 'expense' },
  { name: 'Internet & Téléphone', icon: 'wifi', color: '#06b6d4', type: 'expense' },
  { name: 'Assurances', icon: 'shield', color: '#64748b', type: 'expense' },
  { name: 'Enfants & Éducation', icon: 'backpack', color: '#f59e0b', type: 'expense' },
  { name: 'Santé', icon: 'heart-pulse', color: '#ef4444', type: 'expense' },
  { name: 'Transport & Carburant', icon: 'car', color: '#3b82f6', type: 'expense' },
  { name: 'Banque & Crédits', icon: 'landmark', color: '#6b7280', type: 'expense' },
  { name: 'Épargne', icon: 'gem', color: '#10b981', type: 'expense' },
  { name: 'Abonnements', icon: 'smartphone', color: '#0284c7', type: 'expense' },

  // Variable expenses
  { name: 'Alimentation & Courses', icon: 'shopping-cart', color: '#22c55e', type: 'expense' },
  { name: 'Restaurants & Sorties', icon: 'utensils', color: '#f43f5e', type: 'expense' },
  { name: 'Beauté & Soins', icon: 'scissors', color: '#ec4899', type: 'expense' },
  { name: 'Habillement', icon: 'shirt', color: '#d946ef', type: 'expense' },
  { name: 'Loisirs & Culture', icon: 'gamepad', color: '#a855f7', type: 'expense' },
  { name: 'Vacances & Voyages', icon: 'plane', color: '#6366f1', type: 'expense' },
  { name: 'Cadeaux & Événements', icon: 'gift', color: '#14b8a6', type: 'expense' },
  { name: 'Animaux', icon: 'paw', color: '#a16207', type: 'expense' },
  { name: 'Divers / Imprévus', icon: 'package', color: '#94a3b8', type: 'expense' },
]

export const COLOR_CHOICES = [
  '#f97316', '#eab308', '#0ea5e9', '#06b6d4', '#64748b', '#f59e0b',
  '#ef4444', '#3b82f6', '#6b7280', '#10b981', '#0284c7', '#22c55e',
  '#f43f5e', '#ec4899', '#d946ef', '#a855f7', '#6366f1', '#14b8a6',
  '#a16207', '#94a3b8', '#16a34a', '#84cc16',
]
