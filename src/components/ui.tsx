import { useId, type ComponentProps, type InputHTMLAttributes, type ReactNode, type SelectHTMLAttributes } from 'react'
import type { LucideIcon } from 'lucide-react'
import { categoryIconFor } from '../lib/categoryIcons'

export function Card({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <div className={`rounded-2xl border border-line bg-surface p-4 shadow-sm sm:p-5 ${className}`}>{children}</div>
}

export function PageHeader({ title, subtitle, action }: { title: string; subtitle?: ReactNode; action?: ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-3">
      <div className="min-w-0">
        <h2 className="text-2xl font-bold text-ink">{title}</h2>
        {subtitle && <p className="mt-0.5 text-sm text-ink-muted">{subtitle}</p>}
      </div>
      {action}
    </div>
  )
}

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger'

const BUTTON_STYLES: Record<ButtonVariant, string> = {
  primary: 'bg-brand-600 text-white hover:bg-brand-700 active:bg-brand-800 shadow-sm',
  secondary: 'bg-brand-50 text-brand-700 hover:bg-brand-100 active:bg-brand-200',
  ghost: 'bg-transparent text-ink-muted hover:bg-slate-100 active:bg-slate-200',
  danger: 'bg-red-600 text-white hover:bg-red-700 active:bg-red-800',
}

export function Button({
  variant = 'primary',
  icon: Icon,
  className = '',
  children,
  ...props
}: ComponentProps<'button'> & { variant?: ButtonVariant; icon?: LucideIcon }) {
  return (
    <button
      className={`inline-flex min-h-11 cursor-pointer items-center justify-center gap-2 rounded-xl px-4 text-sm font-semibold transition-colors duration-150 disabled:cursor-not-allowed disabled:opacity-50 ${BUTTON_STYLES[variant]} ${className}`}
      {...props}
    >
      {Icon && <Icon className="h-4 w-4 shrink-0" aria-hidden />}
      {children}
    </button>
  )
}

/** Icon-only button with a 44px hit area and a required accessible label. */
export function IconButton({
  icon: Icon,
  label,
  tone = 'neutral',
  className = '',
  ...props
}: ComponentProps<'button'> & { icon: LucideIcon; label: string; tone?: 'neutral' | 'danger' }) {
  const toneClass =
    tone === 'danger' ? 'text-red-600 hover:bg-red-50 active:bg-red-100' : 'text-ink-subtle hover:bg-slate-100 active:bg-slate-200'
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      className={`inline-flex h-11 w-11 shrink-0 cursor-pointer items-center justify-center rounded-xl transition-colors duration-150 ${toneClass} ${className}`}
      {...props}
    >
      <Icon className="h-[18px] w-[18px]" aria-hidden />
    </button>
  )
}

const FIELD_CLASS =
  'w-full min-h-11 rounded-xl border border-slate-300 bg-surface px-3 text-base text-ink outline-none transition-colors placeholder:text-slate-400 focus:border-brand-500 focus:ring-2 focus:ring-brand-100'

export function Input({ className = '', ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return <input className={`${FIELD_CLASS} ${className}`} {...props} />
}

export function Select({ className = '', ...props }: SelectHTMLAttributes<HTMLSelectElement>) {
  return <select className={`${FIELD_CLASS} ${className}`} {...props} />
}

/** Label + control, linked by id so tapping the label focuses the field. */
export function Field({ label, hint, children }: { label: string; hint?: string; children: (id: string) => ReactNode }) {
  const id = useId()
  return (
    <div>
      <label htmlFor={id} className="mb-1.5 block text-sm font-medium text-ink-muted">
        {label}
      </label>
      {children(id)}
      {hint && <p className="mt-1 text-xs text-ink-subtle">{hint}</p>}
    </div>
  )
}

/** Two or three mutually exclusive options shown as one pill control. */
export function Segmented<T extends string>({
  value,
  options,
  onChange,
  label,
}: {
  value: T
  options: { value: T; label: string; activeClass?: string }[]
  onChange: (value: T) => void
  label: string
}) {
  return (
    <div role="radiogroup" aria-label={label} className="flex gap-1 rounded-xl bg-slate-100 p-1">
      {options.map((o) => {
        const active = o.value === value
        return (
          <button
            key={o.value}
            type="button"
            role="radio"
            aria-checked={active}
            onClick={() => onChange(o.value)}
            className={`min-h-10 flex-1 cursor-pointer rounded-lg px-3 text-sm font-semibold transition-colors duration-150 ${
              active ? (o.activeClass ?? 'bg-surface text-brand-700 shadow-sm') : 'text-ink-muted hover:text-ink'
            }`}
          >
            {o.label}
          </button>
        )
      })}
    </div>
  )
}

export function EmptyState({ icon: Icon, text }: { icon: LucideIcon; text: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-10 text-center text-ink-subtle">
      <span className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-100">
        <Icon className="h-6 w-6" aria-hidden />
      </span>
      <p className="text-sm">{text}</p>
    </div>
  )
}

/** Placeholder blocks shown while data loads, sized like the real content. */
export function Skeleton({ className = '' }: { className?: string }) {
  return <div className={`animate-pulse rounded-xl bg-slate-200/70 ${className}`} />
}

export function SkeletonList({ rows = 4, label }: { rows?: number; label: string }) {
  return (
    <div className="space-y-3" aria-busy="true" aria-label={label}>
      {Array.from({ length: rows }, (_, i) => (
        <Skeleton key={i} className="h-14" />
      ))}
    </div>
  )
}

/** Round badge with a category's icon on its tinted color. Legacy emoji icons
 *  map to their SVG equivalent; anything unknown is shown as typed. */
export function CategoryBadge({ icon, color, size = 'md' }: { icon: string; color: string; size?: 'sm' | 'md' | 'lg' }) {
  const sizes = { sm: 'h-8 w-8 text-base', md: 'h-10 w-10 text-lg', lg: 'h-12 w-12 text-2xl' }
  const iconSizes = { sm: 'h-4 w-4', md: 'h-5 w-5', lg: 'h-6 w-6' }
  const Icon = categoryIconFor(icon)
  return (
    <span
      aria-hidden
      className={`flex shrink-0 items-center justify-center rounded-full ${sizes[size]}`}
      // Darken the category color for the glyph so light colors (yellow…) keep enough contrast.
      style={{ backgroundColor: color + '26', color: `color-mix(in oklab, ${color} 70%, black)` }}
    >
      {Icon ? <Icon className={iconSizes[size]} strokeWidth={2} /> : icon}
    </span>
  )
}
