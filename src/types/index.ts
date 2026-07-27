export type TransactionType = 'income' | 'expense'

export type RecurrenceFrequency = 'weekly' | 'monthly' | 'yearly'

export interface Category {
  id?: string
  name: string
  icon: string
  color: string
  type: TransactionType
}

export interface Transaction {
  id?: string
  type: TransactionType
  amount: number
  categoryId: string
  description: string
  date: string // ISO date string (yyyy-mm-dd)
  recurring: boolean
  recurrenceFrequency?: RecurrenceFrequency
  // Set when this row was auto-generated from a recurring template transaction.
  templateId?: string
}

export interface Budget {
  id?: string
  categoryId: string
  monthlyLimit: number
}
