import type { Category } from '../types'

// Seed categories, adapted from a real household budget spreadsheet
// (income sources + fixed/variable expense groups).
export const DEFAULT_CATEGORIES: Category[] = [
  // Income
  { name: 'Salaire conjoint 1', icon: '💼', color: '#16a34a', type: 'income' },
  { name: 'Salaire conjoint 2', icon: '💼', color: '#15803d', type: 'income' },
  { name: 'Allocations', icon: '👶', color: '#eab308', type: 'income' },
  { name: 'Autres revenus', icon: '💰', color: '#84cc16', type: 'income' },

  // Fixed expenses
  { name: 'Logement', icon: '🏠', color: '#f97316', type: 'expense' },
  { name: 'Électricité & Gaz', icon: '⚡', color: '#eab308', type: 'expense' },
  { name: 'Eau', icon: '💧', color: '#0ea5e9', type: 'expense' },
  { name: 'Internet & Téléphone', icon: '📶', color: '#06b6d4', type: 'expense' },
  { name: 'Assurances', icon: '🛡️', color: '#64748b', type: 'expense' },
  { name: 'Enfants & Éducation', icon: '🎒', color: '#f59e0b', type: 'expense' },
  { name: 'Santé', icon: '⚕️', color: '#ef4444', type: 'expense' },
  { name: 'Transport & Carburant', icon: '🚗', color: '#3b82f6', type: 'expense' },
  { name: 'Banque & Crédits', icon: '🏦', color: '#6b7280', type: 'expense' },
  { name: 'Épargne', icon: '💎', color: '#10b981', type: 'expense' },
  { name: 'Abonnements', icon: '📱', color: '#0284c7', type: 'expense' },

  // Variable expenses
  { name: 'Alimentation & Courses', icon: '🛒', color: '#22c55e', type: 'expense' },
  { name: 'Restaurants & Sorties', icon: '🍽️', color: '#f43f5e', type: 'expense' },
  { name: 'Beauté & Soins', icon: '💇', color: '#ec4899', type: 'expense' },
  { name: 'Habillement', icon: '👕', color: '#d946ef', type: 'expense' },
  { name: 'Loisirs & Culture', icon: '🎮', color: '#a855f7', type: 'expense' },
  { name: 'Vacances & Voyages', icon: '✈️', color: '#6366f1', type: 'expense' },
  { name: 'Cadeaux & Événements', icon: '🎁', color: '#14b8a6', type: 'expense' },
  { name: 'Animaux', icon: '🐾', color: '#a16207', type: 'expense' },
  { name: 'Divers / Imprévus', icon: '📦', color: '#94a3b8', type: 'expense' },
]

export const ICON_CHOICES = [
  '🏠', '⚡', '💧', '📶', '🛡️', '🎒', '⚕️', '🚗', '🏦', '💎', '📱',
  '🛒', '🍽️', '💇', '👕', '🎮', '✈️', '🎁', '🐾', '📦', '💼', '👶', '💰', '🎓',
]

export const COLOR_CHOICES = [
  '#f97316', '#eab308', '#0ea5e9', '#06b6d4', '#64748b', '#f59e0b',
  '#ef4444', '#3b82f6', '#6b7280', '#10b981', '#0284c7', '#22c55e',
  '#f43f5e', '#ec4899', '#d946ef', '#a855f7', '#6366f1', '#14b8a6',
  '#a16207', '#94a3b8', '#16a34a', '#84cc16',
]
