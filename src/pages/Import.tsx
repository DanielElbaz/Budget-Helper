import { useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { AlertTriangle, FileSpreadsheet, Info, Lock, RotateCcw, Upload } from 'lucide-react'
import { addTransactions, useCategories, useTransactions } from '../lib/data'
import { buildSuggester, merchantKey } from '../lib/categorize'
import { NoTableFoundError, UnsupportedFileError, readStatement } from '../lib/statementImport'
import type { Transaction, TransactionType } from '../types'
import { Button, Card, CategoryBadge, PageHeader, Segmented, Select, SkeletonList } from '../components/ui'
import { useFeedback } from '../components/feedback'
import { formatMoney } from '../lib/utils'
import { useLang } from '../lib/i18n'

interface Item {
  key: number
  date: string
  description: string
  amount: number
  type: TransactionType
  categoryId: string
  /** True once the user picked the category themselves (stops auto-propagation). */
  manual: boolean
  include: boolean
  duplicate: 'exact' | 'maybe' | null
}

export default function Import() {
  const { t, locale, currency, translateCategoryName } = useLang()
  const { run } = useFeedback()
  const navigate = useNavigate()
  const categories = useCategories()
  const transactions = useTransactions()
  const money = (n: number) => formatMoney(n, locale, currency)
  const fileInput = useRef<HTMLInputElement>(null)

  const [items, setItems] = useState<Item[] | null>(null)
  const [fileName, setFileName] = useState('')
  const [reading, setReading] = useState(false)
  const [error, setError] = useState('')
  const [filter, setFilter] = useState<'all' | 'missing'>('all')
  const [saving, setSaving] = useState(false)

  const ready = categories !== undefined && transactions !== undefined

  async function onFile(file: File | undefined) {
    if (!file || !categories || !transactions) return
    setError('')
    setReading(true)
    setFileName(file.name)
    try {
      const rows = await readStatement(file)
      const suggester = buildSuggester(categories, transactions)
      // Money in with no better guess (card refunds, unknown bank credits) → "other income".
      const otherIncome = categories.find((c) => c.type === 'income' && c.name === 'Autres revenus')?.id
      const exact = new Set(transactions.map((tx) => `${tx.date}|${tx.amount}|${merchantKey(tx.description)}`))
      const loose = new Set(transactions.map((tx) => `${tx.date}|${tx.amount}|${tx.type}`))
      setItems(
        rows.map((row, i) => {
          const type: TransactionType = row.amount < 0 ? 'income' : 'expense'
          const amount = Math.abs(row.amount)
          const duplicate = exact.has(`${row.date}|${amount}|${merchantKey(row.description)}`)
            ? 'exact'
            : loose.has(`${row.date}|${amount}|${type}`)
              ? 'maybe'
              : null
          return {
            key: i,
            date: row.date,
            description: row.description,
            amount,
            type,
            categoryId: suggester.suggest(row.description, type) ?? (type === 'income' ? otherIncome : undefined) ?? '',
            manual: false,
            include: duplicate === null,
            duplicate,
          }
        }),
      )
      setFilter('all')
    } catch (err) {
      console.error(err)
      setItems(null)
      setError(err instanceof UnsupportedFileError ? t('importLegacyXls') : err instanceof NoTableFoundError ? t('importNoTable') : t('toastError'))
    } finally {
      setReading(false)
      if (fileInput.current) fileInput.current.value = ''
    }
  }

  function setCategory(item: Item, categoryId: string) {
    const key = merchantKey(item.description)
    setItems((list) =>
      (list ?? []).map((it) => {
        if (it.key === item.key) return { ...it, categoryId, manual: true }
        // Same merchant, not chosen by hand yet: apply the same category.
        if (!it.manual && it.type === item.type && merchantKey(it.description) === key) return { ...it, categoryId }
        return it
      }),
    )
  }

  function toggle(item: Item) {
    setItems((list) => (list ?? []).map((it) => (it.key === item.key ? { ...it, include: !it.include } : it)))
  }

  const selected = items?.filter((it) => it.include) ?? []
  const missing = selected.filter((it) => !it.categoryId).length
  const totalOut = selected.filter((it) => it.type === 'expense').reduce((s, it) => s + it.amount, 0)
  const visible = (items ?? []).filter((it) => filter === 'all' || (it.include && !it.categoryId))
  const categoriesByType = useMemo(
    () => ({
      expense: (categories ?? []).filter((c) => c.type === 'expense'),
      income: (categories ?? []).filter((c) => c.type === 'income'),
    }),
    [categories],
  )

  async function confirmImport() {
    if (!selected.length || missing) return
    const txs: Transaction[] = selected.map((it) => ({
      type: it.type,
      amount: it.amount,
      categoryId: it.categoryId,
      description: it.description,
      date: it.date,
      recurring: false,
    }))
    setSaving(true)
    const ok = await run(() => addTransactions(txs), `${t('importDone')} (${txs.length})`)
    setSaving(false)
    if (ok) navigate('/transactions')
  }

  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <PageHeader title={t('importTitle')} subtitle={t('importSubtitle')} />

      <input
        ref={fileInput}
        type="file"
        accept=".xlsx,.xls,.csv,.html,.htm,text/csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel"
        className="sr-only"
        tabIndex={-1}
        aria-hidden
        onChange={(e) => onFile(e.target.files?.[0])}
      />

      {!items && (
        <Card className="space-y-4">
          <button
            type="button"
            disabled={!ready || reading}
            onClick={() => fileInput.current?.click()}
            className="flex w-full cursor-pointer flex-col items-center gap-3 rounded-2xl border-2 border-dashed border-brand-200 bg-brand-50/50 px-4 py-10 text-center transition-colors hover:border-brand-400 hover:bg-brand-50 disabled:cursor-wait disabled:opacity-60"
          >
            <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-600 text-white">
              {reading ? <FileSpreadsheet className="h-7 w-7 animate-pulse" aria-hidden /> : <Upload className="h-7 w-7" aria-hidden />}
            </span>
            <span className="text-base font-semibold text-ink">{reading ? t('importReading') : t('importChooseFile')}</span>
            <span className="text-sm text-ink-subtle">{t('importFormats')}</span>
          </button>

          {error && (
            <p role="alert" className="flex items-start gap-2 rounded-xl bg-red-50 p-3 text-sm font-medium text-red-700">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
              {error}
            </p>
          )}

          <div className="space-y-2 text-sm text-ink-muted">
            <p className="flex items-start gap-2">
              <Info className="mt-0.5 h-4 w-4 shrink-0 text-ink-subtle" aria-hidden />
              {t('importHowTo')}
            </p>
            <p className="flex items-start gap-2">
              <Lock className="mt-0.5 h-4 w-4 shrink-0 text-ink-subtle" aria-hidden />
              {t('importPrivacy')}
            </p>
          </div>
        </Card>
      )}

      {items && (
        <>
          <Card className="space-y-3">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="truncate text-sm text-ink-subtle" dir="auto">
                  {fileName}
                </p>
                <p className="mt-0.5 text-sm text-ink">
                  {t('importFound')} <span className="num font-semibold">{items.length}</span> {t('importTransactions')} ·{' '}
                  {t('importSelected')} <span className="num font-semibold">{selected.length}</span>
                </p>
                <p className="num mt-0.5 text-lg font-bold text-ink">{money(totalOut)}</p>
              </div>
              <Button variant="secondary" icon={RotateCcw} onClick={() => setItems(null)}>
                {t('importAnotherFile')}
              </Button>
            </div>
            {missing > 0 && (
              <Segmented
                label={t('importOnlyMissing')}
                value={filter}
                onChange={setFilter}
                options={[
                  { value: 'all', label: t('filterAllTypes') },
                  { value: 'missing', label: `${t('importOnlyMissing')} (${missing})`, activeClass: 'bg-amber-500 text-white shadow-sm' },
                ]}
              />
            )}
          </Card>

          <Card className="overflow-hidden p-0 sm:p-0">
            <ul className="divide-y divide-line">
              {visible.map((it) => {
                const cat = categories?.find((c) => c.id === it.categoryId)
                const needsCategory = it.include && !it.categoryId
                return (
                  <li key={it.key} className={`flex items-start gap-2 px-2 py-2.5 sm:px-3 ${it.include ? '' : 'opacity-55'} ${needsCategory ? 'bg-amber-50' : ''}`}>
                    <label className="flex h-11 w-11 shrink-0 cursor-pointer items-center justify-center">
                      <input
                        type="checkbox"
                        checked={it.include}
                        onChange={() => toggle(it)}
                        aria-label={`${t('importIncludeLabel')}: ${it.description}`}
                        className="h-5 w-5 rounded accent-brand-600"
                      />
                    </label>
                    <div className="min-w-0 flex-1 space-y-1.5 pt-1">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium text-ink" dir="auto">
                            {it.description}
                          </p>
                          <p className="flex flex-wrap items-center gap-x-2 text-xs text-ink-subtle">
                            <span className="num">{new Intl.DateTimeFormat(locale, { day: 'numeric', month: 'short' }).format(new Date(`${it.date}T00:00:00`))}</span>
                            {it.type === 'income' && <span className="font-medium text-emerald-700">{t('importRefund')}</span>}
                            {it.duplicate && (
                              <span className="font-medium text-amber-700">{it.duplicate === 'exact' ? t('importDuplicate') : t('importMaybeDuplicate')}</span>
                            )}
                          </p>
                        </div>
                        <span className={`num shrink-0 text-sm font-semibold ${it.type === 'income' ? 'text-emerald-700' : 'text-ink'}`}>
                          {money(it.amount)}
                        </span>
                      </div>
                      {it.include && (
                        <div className="flex items-center gap-2">
                          {cat && <CategoryBadge icon={cat.icon} color={cat.color} size="sm" />}
                          <Select
                            aria-label={`${t('categoryLabel')}: ${it.description}`}
                            value={it.categoryId}
                            onChange={(e) => setCategory(it, e.target.value)}
                            className={`min-h-10 text-sm ${needsCategory ? 'border-amber-400' : ''}`}
                          >
                            <option value="">{t('categoryPlaceholder')}</option>
                            {categoriesByType[it.type].map((c) => (
                              <option key={c.id} value={c.id}>
                                {translateCategoryName(c.name)}
                              </option>
                            ))}
                          </Select>
                        </div>
                      )}
                    </div>
                  </li>
                )
              })}
            </ul>
          </Card>

          {/* Sticky action bar above the bottom navigation. */}
          <div className="sticky bottom-[calc(4.5rem+env(safe-area-inset-bottom))] z-20 rounded-2xl border border-line bg-surface/95 p-3 shadow-lg backdrop-blur sm:bottom-4">
            {missing > 0 && <p className="mb-2 text-center text-xs font-medium text-amber-700">{t('importChooseCategories')} ({missing})</p>}
            <Button className="w-full" icon={Upload} disabled={saving || selected.length === 0 || missing > 0} onClick={confirmImport}>
              {saving ? t('loadingLabel') : `${t('importConfirm')} ${selected.length} ${t('importTransactions')}`}
            </Button>
          </div>
        </>
      )}

      {!ready && !items && <SkeletonList rows={2} label={t('loadingLabel')} />}
    </div>
  )
}
