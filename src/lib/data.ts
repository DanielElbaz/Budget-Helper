import { useEffect, useRef, useState } from 'react'
import type { Budget, Category, RecurrenceFrequency, Transaction } from '../types'
import { DEFAULT_CATEGORIES } from './defaultCategories'
import { supabase } from './supabase'
import { todayIso } from './utils'

type CategoryRow = { id: string; name: string; icon: string; color: string; type: Category['type'] }
type TransactionRow = {
  id: string
  type: Transaction['type']
  amount: number
  category_id: string
  description: string
  date: string
  recurring: boolean
  recurrence_frequency: RecurrenceFrequency | null
  template_id: string | null
}
type BudgetRow = { id: string; category_id: string; monthly_limit: number }

function categoryFromRow(row: CategoryRow): Category {
  return { id: row.id, name: row.name, icon: row.icon, color: row.color, type: row.type }
}

function categoryPatchToRow(patch: Partial<Category>) {
  const row: Record<string, unknown> = {}
  if (patch.name !== undefined) row.name = patch.name
  if (patch.icon !== undefined) row.icon = patch.icon
  if (patch.color !== undefined) row.color = patch.color
  if (patch.type !== undefined) row.type = patch.type
  return row
}

function transactionFromRow(row: TransactionRow): Transaction {
  return {
    id: row.id,
    type: row.type,
    amount: Number(row.amount),
    categoryId: row.category_id,
    description: row.description ?? '',
    date: row.date,
    recurring: row.recurring,
    recurrenceFrequency: row.recurrence_frequency ?? undefined,
    templateId: row.template_id ?? undefined,
  }
}

function transactionToRow(tx: Transaction) {
  return {
    type: tx.type,
    amount: tx.amount,
    category_id: tx.categoryId,
    description: tx.description,
    date: tx.date,
    recurring: tx.recurring,
    recurrence_frequency: tx.recurring ? (tx.recurrenceFrequency ?? 'monthly') : null,
    template_id: tx.templateId ?? null,
  }
}

function budgetFromRow(row: BudgetRow): Budget {
  return { id: row.id, categoryId: row.category_id, monthlyLimit: Number(row.monthly_limit) }
}

function budgetPatchToRow(patch: Partial<Budget>) {
  const row: Record<string, unknown> = {}
  if (patch.categoryId !== undefined) row.category_id = patch.categoryId
  if (patch.monthlyLimit !== undefined) row.monthly_limit = patch.monthlyLimit
  return row
}

// --- realtime read hooks ---
// Small households generate few rows, so refetching the whole table on any
// change is simpler (and safer) than merging individual row diffs by hand.

type TableName = 'categories' | 'transactions' | 'budgets'

function useTable<T>(table: TableName, fromRow: (row: any) => T): T[] | undefined {
  const [data, setData] = useState<T[] | undefined>(undefined)
  // Several components subscribe to the same table at once (e.g. the quick-add
  // FAB and the current page both read categories) — each needs its own
  // channel name, otherwise they collide on the same Realtime channel.
  const channelName = useRef(`${table}-${Math.random().toString(36).slice(2)}`)

  useEffect(() => {
    let cancelled = false

    async function load() {
      const { data: rows, error } = await supabase.from(table).select('*')
      if (cancelled) return
      if (error) {
        console.error(`Erreur de lecture (${table}):`, error.message)
        setData([])
        return
      }
      setData((rows ?? []).map(fromRow))
    }

    load()

    const channel = supabase
      .channel(channelName.current)
      .on('postgres_changes', { event: '*', schema: 'public', table }, () => load())
      .subscribe()

    return () => {
      cancelled = true
      supabase.removeChannel(channel)
    }
    // fromRow is a stable top-level function reference for every call site, safe to omit.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [table])

  return data
}

export function useCategories() {
  return useTable('categories', categoryFromRow)
}
export function useTransactions() {
  return useTable('transactions', transactionFromRow)
}
export function useBudgets() {
  return useTable('budgets', budgetFromRow)
}

// --- categories CRUD ---

export async function addCategory(cat: Category) {
  const { error } = await supabase.from('categories').insert(categoryPatchToRow(cat))
  if (error) throw error
}

export async function updateCategory(id: string, patch: Partial<Category>) {
  const { error } = await supabase.from('categories').update(categoryPatchToRow(patch)).eq('id', id)
  if (error) throw error
}

export async function deleteCategory(id: string) {
  const { error } = await supabase.from('categories').delete().eq('id', id)
  if (error) throw error
}

export async function categoryUsage(id: string) {
  const [txCountRes, budgetRes] = await Promise.all([
    supabase.from('transactions').select('id', { count: 'exact', head: true }).eq('category_id', id),
    supabase.from('budgets').select('id').eq('category_id', id).maybeSingle(),
  ])
  return { transactionCount: txCountRes.count ?? 0, budgetId: budgetRes.data?.id as string | undefined }
}

export async function ensureDefaultCategories() {
  const { count, error } = await supabase.from('categories').select('id', { count: 'exact', head: true })
  if (error) {
    console.error(error)
    return
  }
  if ((count ?? 0) === 0) {
    const { error: insertError } = await supabase.from('categories').insert(DEFAULT_CATEGORIES.map(categoryPatchToRow))
    if (insertError) console.error(insertError)
  }
}

// --- transactions CRUD ---

export async function addTransaction(tx: Transaction) {
  const { error } = await supabase.from('transactions').insert(transactionToRow(tx))
  if (error) throw error
}

export async function updateTransaction(id: string, tx: Transaction) {
  const { error } = await supabase.from('transactions').update(transactionToRow(tx)).eq('id', id)
  if (error) throw error
}

export async function deleteTransaction(id: string) {
  const { error } = await supabase.from('transactions').delete().eq('id', id)
  if (error) throw error
}

// --- budgets CRUD ---

export async function addBudget(budget: Budget) {
  const { error } = await supabase.from('budgets').insert(budgetPatchToRow(budget))
  if (error) throw error
}

export async function updateBudget(id: string, patch: Partial<Budget>) {
  const { error } = await supabase.from('budgets').update(budgetPatchToRow(patch)).eq('id', id)
  if (error) throw error
}

export async function deleteBudget(id: string) {
  const { error } = await supabase.from('budgets').delete().eq('id', id)
  if (error) throw error
}

// --- fixed/recurring expenses: auto-generate this period's occurrence ---
// The first entry of a recurring transaction acts as its template
// (recurring = true, templateId unset). On each load we make sure every
// due occurrence up to today exists, so a rent or subscription entered once
// keeps counting against the budget every month without being retyped.

function addDays(date: Date, days: number) {
  const d = new Date(date)
  d.setDate(d.getDate() + days)
  return d
}

function addMonthsClamped(date: Date, months: number) {
  const day = date.getDate()
  const d = new Date(date.getFullYear(), date.getMonth() + months, 1)
  const lastDayOfTargetMonth = new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate()
  d.setDate(Math.min(day, lastDayOfTargetMonth))
  return d
}

function toIsoDate(d: Date) {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

function parseIsoDate(iso: string) {
  const [y, m, d] = iso.split('-').map(Number)
  return new Date(y, m - 1, d)
}

export function computeMissingOccurrenceDates(startIso: string, freq: RecurrenceFrequency, untilIso: string): string[] {
  const until = parseIsoDate(untilIso)
  const dates: string[] = []
  let cursor = parseIsoDate(startIso)
  // Safety cap (10 years of weekly occurrences) guards against corrupt/ancient data.
  for (let i = 0; i < 520; i++) {
    cursor = freq === 'weekly' ? addDays(cursor, 7) : freq === 'yearly' ? addMonthsClamped(cursor, 12) : addMonthsClamped(cursor, 1)
    if (cursor > until) break
    dates.push(toIsoDate(cursor))
  }
  return dates
}

export async function generateRecurringOccurrences() {
  const today = todayIso()
  const { data: templates, error } = await supabase.from('transactions').select('*').eq('recurring', true).is('template_id', null)
  if (error || !templates) return

  for (const template of templates as TransactionRow[]) {
    const freq = template.recurrence_frequency ?? 'monthly'
    const missingDates = computeMissingOccurrenceDates(template.date, freq, today)
    if (missingDates.length === 0) continue

    const { data: existing } = await supabase.from('transactions').select('date').eq('template_id', template.id)
    const existingDates = new Set((existing ?? []).map((r) => r.date as string))
    const toInsert = missingDates
      .filter((d) => !existingDates.has(d))
      .map((d) => ({
        type: template.type,
        amount: template.amount,
        category_id: template.category_id,
        description: template.description,
        date: d,
        recurring: true,
        recurrence_frequency: freq,
        template_id: template.id,
      }))

    if (toInsert.length > 0) {
      await supabase.from('transactions').insert(toInsert)
    }
  }
}
