import { useState } from 'react'
import type { Category } from '../types'
import { addTransaction, useCategories } from '../lib/data'
import { useLang } from '../lib/i18n'
import { todayIso } from '../lib/utils'
import { Button, Input } from './ui'

export default function QuickAddExpense() {
  const { t, translateCategoryName } = useLang()
  const categories = useCategories()
  const expenseCategories = categories?.filter((c) => c.type === 'expense') ?? []

  const [open, setOpen] = useState(false)
  const [selected, setSelected] = useState<Category | null>(null)
  const [amount, setAmount] = useState('')
  const [success, setSuccess] = useState(false)
  const [saving, setSaving] = useState(false)

  function close() {
    setOpen(false)
    setSelected(null)
    setAmount('')
    setSuccess(false)
  }

  async function confirm() {
    const value = Number(amount)
    if (!selected || !value || value <= 0) return
    setSaving(true)
    await addTransaction({
      type: 'expense',
      amount: value,
      categoryId: selected.id!,
      description: '',
      date: todayIso(),
      recurring: false,
    })
    setSaving(false)
    setSuccess(true)
    setTimeout(close, 900)
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        aria-label={t('quickAddButton')}
        className="fixed bottom-20 right-4 z-40 flex h-14 w-14 cursor-pointer items-center justify-center rounded-full bg-purple-600 text-2xl text-white shadow-lg shadow-purple-300 transition-transform hover:scale-105 active:scale-95 sm:bottom-8 sm:right-8"
      >
        ⚡
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-0 sm:items-center sm:p-4" onClick={close}>
          <div
            className="w-full max-w-md rounded-t-3xl bg-white p-5 shadow-xl sm:rounded-3xl"
            onClick={(e) => e.stopPropagation()}
          >
            {success ? (
              <div className="flex flex-col items-center gap-2 py-8 text-center">
                <span className="text-4xl">✅</span>
                <p className="font-semibold text-purple-900">{t('quickAddSuccess')}</p>
              </div>
            ) : !selected ? (
              <>
                <h3 className="mb-4 text-center font-semibold text-purple-900">{t('quickAddPickCategory')}</h3>
                <div className="grid grid-cols-3 gap-3 sm:grid-cols-4">
                  {expenseCategories.map((c) => (
                    <button
                      key={c.id}
                      onClick={() => setSelected(c)}
                      className="flex flex-col items-center gap-1 rounded-2xl border border-purple-100 p-3 transition-transform hover:scale-105 active:scale-95"
                      style={{ backgroundColor: c.color + '1a' }}
                    >
                      <span className="text-2xl">{c.icon}</span>
                      <span className="text-center text-[11px] font-medium leading-tight text-purple-900">
                        {translateCategoryName(c.name)}
                      </span>
                    </button>
                  ))}
                </div>
                <button onClick={close} className="mt-4 w-full cursor-pointer text-center text-sm text-purple-400">
                  {t('closeButton')}
                </button>
              </>
            ) : (
              <>
                <button onClick={() => setSelected(null)} className="mb-2 cursor-pointer text-sm text-purple-400">
                  {t('quickAddBack')}
                </button>
                <div className="mb-4 flex items-center gap-2">
                  <span
                    className="flex h-10 w-10 items-center justify-center rounded-full text-lg"
                    style={{ backgroundColor: selected.color + '33' }}
                  >
                    {selected.icon}
                  </span>
                  <span className="font-semibold text-purple-900">{translateCategoryName(selected.name)}</span>
                </div>
                <Input
                  type="number"
                  inputMode="decimal"
                  step="0.01"
                  min="0"
                  autoFocus
                  placeholder="0.00"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="mb-4 text-center text-2xl font-bold"
                />
                <Button className="w-full" onClick={confirm} disabled={saving || !amount || Number(amount) <= 0}>
                  {t('quickAddConfirm')}
                </Button>
              </>
            )}
          </div>
        </div>
      )}
    </>
  )
}
