import { useEffect, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { ChevronRight, Plus, X } from 'lucide-react'
import type { Category } from '../types'
import { addTransaction, useCategories } from '../lib/data'
import { useLang } from '../lib/i18n'
import { todayIso } from '../lib/utils'
import { useFeedback } from './feedback'
import { Button, CategoryBadge, IconButton, Skeleton } from './ui'

export default function QuickAddExpense() {
  const { t, translateCategoryName } = useLang()
  const { run } = useFeedback()
  const categories = useCategories()
  const expenseCategories = categories?.filter((c) => c.type === 'expense')

  const [open, setOpen] = useState(false)
  const [selected, setSelected] = useState<Category | null>(null)
  const [amount, setAmount] = useState('')
  const [saving, setSaving] = useState(false)
  const { pathname } = useLocation()

  function close() {
    setOpen(false)
    setSelected(null)
    setAmount('')
  }

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && close()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open])

  const value = Number(amount.replace(',', '.'))
  const valid = Boolean(selected) && value > 0

  async function confirm(e: React.FormEvent) {
    e.preventDefault()
    if (!selected || !valid) return
    setSaving(true)
    const ok = await run(
      () =>
        addTransaction({
          type: 'expense',
          amount: value,
          categoryId: selected.id!,
          description: '',
          date: todayIso(),
          recurring: false,
        }),
      t('quickAddSuccess'),
    )
    setSaving(false)
    if (ok) close()
  }

  // The import page has its own sticky action bar where the button would sit.
  if (pathname === '/import') return null

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        aria-label={t('quickAddButton')}
        aria-haspopup="dialog"
        className="fixed bottom-[calc(4.5rem+env(safe-area-inset-bottom))] end-4 z-40 flex h-14 w-14 cursor-pointer items-center justify-center rounded-2xl bg-brand-600 text-white shadow-lg shadow-brand-600/30 transition-colors duration-150 hover:bg-brand-700 active:bg-brand-800 sm:bottom-8 sm:end-8"
      >
        <Plus className="h-7 w-7" aria-hidden />
      </button>

      {open && (
        <div className="animate-fade fixed inset-0 z-50 flex items-end justify-center bg-slate-900/50 sm:items-center sm:p-4" onClick={close}>
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="quick-add-title"
            className="animate-sheet max-h-[85vh] w-full max-w-md overflow-y-auto rounded-t-3xl bg-surface p-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] shadow-xl sm:rounded-3xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-4 flex items-center justify-between gap-2">
              {selected ? (
                <button
                  onClick={() => setSelected(null)}
                  className="-ms-2 flex min-h-11 cursor-pointer items-center gap-1 rounded-xl px-2 text-sm font-medium text-brand-700 hover:bg-brand-50"
                >
                  <ChevronRight className="h-4 w-4" aria-hidden />
                  {t('quickAddBack')}
                </button>
              ) : (
                <h3 id="quick-add-title" className="text-lg font-semibold text-ink">
                  {t('quickAddPickCategory')}
                </h3>
              )}
              <IconButton icon={X} label={t('closeButton')} onClick={close} />
            </div>

            {!selected ? (
              <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
                {expenseCategories === undefined
                  ? Array.from({ length: 6 }, (_, i) => <Skeleton key={i} className="h-24" />)
                  : expenseCategories.map((c) => (
                      <button
                        key={c.id}
                        onClick={() => setSelected(c)}
                        className="flex min-h-24 cursor-pointer flex-col items-center justify-center gap-1.5 rounded-2xl border border-line p-2 transition-colors duration-150 hover:border-brand-300 hover:bg-brand-50 active:bg-brand-100"
                      >
                        <CategoryBadge icon={c.icon} color={c.color} />
                        <span className="text-center text-xs font-medium leading-tight text-ink">{translateCategoryName(c.name)}</span>
                      </button>
                    ))}
              </div>
            ) : (
              <form onSubmit={confirm}>
                <div className="mb-5 flex items-center gap-3">
                  <CategoryBadge icon={selected.icon} color={selected.color} size="lg" />
                  <span id="quick-add-title" className="text-lg font-semibold text-ink">
                    {translateCategoryName(selected.name)}
                  </span>
                </div>
                <label htmlFor="quick-amount" className="mb-1.5 block text-sm font-medium text-ink-muted">
                  {t('quickAddAmount')}
                </label>
                <div className="relative mb-5" dir="ltr">
                  <span className="pointer-events-none absolute inset-y-0 left-4 flex items-center text-2xl font-semibold text-ink-subtle">₪</span>
                  <input
                    id="quick-amount"
                    type="text"
                    inputMode="decimal"
                    autoComplete="off"
                    autoFocus
                    placeholder="0"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value.replace(/[^\d.,]/g, ''))}
                    className="num min-h-16 w-full rounded-2xl border border-slate-300 bg-surface px-12 text-center text-3xl font-bold text-ink outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
                  />
                </div>
                <Button type="submit" className="w-full" disabled={saving || !valid}>
                  {saving ? t('loadingLabel') : t('quickAddConfirm')}
                </Button>
              </form>
            )}
          </div>
        </div>
      )}
    </>
  )
}
