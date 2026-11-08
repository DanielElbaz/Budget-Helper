import { useRef, useState } from 'react'
import { Pencil, Plus, Trash2, X } from 'lucide-react'
import { addCategory, categoryUsage, deleteBudget, deleteCategory, updateCategory, useCategories } from '../lib/data'
import { COLOR_CHOICES } from '../lib/defaultCategories'
import { CATEGORY_ICONS, ICON_CHOICES, categoryIconKey } from '../lib/categoryIcons'
import type { Category, TransactionType } from '../types'
import { Button, Card, CategoryBadge, Field, IconButton, Input, PageHeader, Segmented, SkeletonList } from '../components/ui'
import { useFeedback } from '../components/feedback'
import { useLang } from '../lib/i18n'

const EMPTY_FORM = { name: '', icon: ICON_CHOICES[0], color: COLOR_CHOICES[0], type: 'expense' as TransactionType }

export default function Categories() {
  const { t, translateCategoryName } = useLang()
  const { run, confirm, toast } = useFeedback()
  const categories = useCategories()
  const [form, setForm] = useState(EMPTY_FORM)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const formRef = useRef<HTMLDivElement>(null)

  const expenseCategories = categories?.filter((c) => c.type === 'expense') ?? []
  const incomeCategories = categories?.filter((c) => c.type === 'income') ?? []

  function startEdit(category: Category) {
    setEditingId(category.id!)
    // Default categories are stored with their original name; edit the Hebrew one.
    setForm({ name: translateCategoryName(category.name), icon: categoryIconKey(category.icon) ?? category.icon, color: category.color, type: category.type })
    setError('')
    setShowForm(true)
    requestAnimationFrame(() => formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }))
  }

  function resetForm() {
    setEditingId(null)
    setForm(EMPTY_FORM)
    setError('')
    setShowForm(false)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.name.trim()) {
      setError(t('errorName'))
      return
    }
    const data = { ...form, name: form.name.trim() }
    setSaving(true)
    const ok = await run(() => (editingId ? updateCategory(editingId, data) : addCategory(data)), t('toastSaved'))
    setSaving(false)
    if (ok) resetForm()
  }

  async function handleDelete(category: Category) {
    let usage: Awaited<ReturnType<typeof categoryUsage>>
    try {
      usage = await categoryUsage(category.id!)
    } catch {
      toast('error', t('toastError'))
      return
    }
    if (usage.transactionCount > 0) {
      toast('error', t('deleteCategoryBlocked'))
      return
    }
    const ok = await confirm({ title: t('confirmDeleteCategory'), body: `${translateCategoryName(category.name)}. ${t('confirmIrreversible')}` })
    if (!ok) return
    await run(async () => {
      if (usage.budgetId) await deleteBudget(usage.budgetId)
      await deleteCategory(category.id!)
    }, t('toastDeleted'))
    if (editingId === category.id) resetForm()
  }

  return (
    <div className="mx-auto max-w-4xl space-y-5">
      <PageHeader
        title={t('categoriesTitle')}
        subtitle={t('categoriesSubtitle')}
        action={
          showForm ? (
            <Button variant="secondary" icon={X} onClick={resetForm}>
              {t('closeButton')}
            </Button>
          ) : (
            <Button icon={Plus} onClick={() => setShowForm(true)}>
              {t('addButton')}
            </Button>
          )
        }
      />

      <div ref={formRef} className="scroll-mt-20">
        {showForm && (
        <Card className="animate-sheet">
          <form onSubmit={handleSubmit} className="space-y-5" noValidate>
            <div className="flex items-center gap-3">
              <CategoryBadge icon={form.icon} color={form.color} size="lg" />
              <h3 className="font-semibold text-ink">{editingId ? t('editCategoryTitle') : t('newCategoryTitle')}</h3>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <Field label={t('nameLabel')}>
                {(id) => (
                  <Input
                    id={id}
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    placeholder={t('namePlaceholder')}
                    aria-invalid={Boolean(error)}
                  />
                )}
              </Field>
              <div>
                <p className="mb-1.5 text-sm font-medium text-ink-muted">{t('typeLabel')}</p>
                <Segmented
                  label={t('typeLabel')}
                  value={form.type}
                  onChange={(type) => setForm({ ...form, type })}
                  options={[
                    { value: 'expense', label: t('typeOptionExpense') },
                    { value: 'income', label: t('typeOptionIncome') },
                  ]}
                />
              </div>
            </div>

            <fieldset>
              <legend className="mb-1.5 text-sm font-medium text-ink-muted">{t('iconLabel')}</legend>
              <div className="flex flex-wrap gap-2">
                {ICON_CHOICES.map((key) => {
                  const { icon: Icon, label } = CATEGORY_ICONS[key]
                  const active = form.icon === key
                  return (
                    <button
                      type="button"
                      key={key}
                      aria-label={label}
                      title={label}
                      aria-pressed={active}
                      onClick={() => setForm({ ...form, icon: key })}
                      className={`flex h-11 w-11 cursor-pointer items-center justify-center rounded-xl transition-colors duration-150 ${
                        active ? 'bg-brand-100 text-brand-700 ring-2 ring-brand-600' : 'bg-slate-100 text-ink-muted hover:bg-slate-200'
                      }`}
                    >
                      <Icon className="h-5 w-5" aria-hidden />
                    </button>
                  )
                })}
              </div>
            </fieldset>

            <fieldset>
              <legend className="mb-1.5 text-sm font-medium text-ink-muted">{t('colorLabel')}</legend>
              <div className="flex flex-wrap gap-2">
                {COLOR_CHOICES.map((color) => (
                  <button
                    type="button"
                    key={color}
                    aria-label={color}
                    aria-pressed={form.color === color}
                    onClick={() => setForm({ ...form, color })}
                    className="flex h-11 w-11 cursor-pointer items-center justify-center rounded-full"
                  >
                    <span
                      className={`h-8 w-8 rounded-full transition-shadow ${form.color === color ? 'ring-2 ring-brand-600 ring-offset-2' : ''}`}
                      style={{ backgroundColor: color }}
                    />
                  </button>
                ))}
              </div>
            </fieldset>

            {error && (
              <p role="alert" className="text-sm font-medium text-red-600">
                {error}
              </p>
            )}

            <div className="flex gap-2">
              <Button type="submit" disabled={saving}>
                {saving ? t('loadingLabel') : editingId ? t('saveButton') : t('addPlainButton')}
              </Button>
              {editingId && (
                <Button type="button" variant="secondary" onClick={resetForm}>
                  {t('cancelButton')}
                </Button>
              )}
            </div>
          </form>
        </Card>
        )}
      </div>

      {categories === undefined ? (
        <SkeletonList rows={6} label={t('loadingLabel')} />
      ) : (
        <div className="grid gap-5 sm:grid-cols-2">
          <CategoryGroup title={t('groupExpenses')} categories={expenseCategories} onEdit={startEdit} onDelete={handleDelete} />
          <CategoryGroup title={t('groupIncomes')} categories={incomeCategories} onEdit={startEdit} onDelete={handleDelete} />
        </div>
      )}
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
  onDelete: (c: Category) => void
}) {
  const { t, translateCategoryName } = useLang()
  return (
    <section>
      <h3 className="mb-2 px-1 text-sm font-semibold text-ink-muted">
        {title} <span className="num text-ink-subtle">({categories.length})</span>
      </h3>
      <Card className="p-0 sm:p-0">
        <ul className="divide-y divide-line">
          {categories.map((c) => (
            <li key={c.id} className="flex items-center gap-3 px-3 py-1.5 sm:px-4">
              <CategoryBadge icon={c.icon} color={c.color} size="sm" />
              <span className="min-w-0 flex-1 truncate text-sm font-medium text-ink">{translateCategoryName(c.name)}</span>
              <IconButton icon={Pencil} label={t('editButton')} onClick={() => onEdit(c)} />
              <IconButton icon={Trash2} label={t('deleteButton')} tone="danger" onClick={() => onDelete(c)} />
            </li>
          ))}
          {categories.length === 0 && <li className="py-6 text-center text-sm text-ink-subtle">{t('categoriesEmpty')}</li>}
        </ul>
      </Card>
    </section>
  )
}
