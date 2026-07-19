export type TransactionType = 'income' | 'expense'

export type RecurrenceFrequency = 'weekly' | 'monthly' | 'yearly'

export interface Category {
  id?: number
  name: string
  icon: string
  color: string
  type: TransactionType
}

export interface Transaction {
  id?: number
  type: TransactionType
  amount: number
  categoryId: number
  description: string
  date: string // ISO date string (yyyy-mm-dd)
  recurring: boolean
  recurrenceFrequency?: RecurrenceFrequency
}

export interface Budget {
  id?: number
  categoryId: number
  monthlyLimit: number
}
