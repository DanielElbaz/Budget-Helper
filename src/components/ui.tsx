import type { ButtonHTMLAttributes, InputHTMLAttributes, ReactNode, SelectHTMLAttributes } from 'react'

export function Card({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <div className={`rounded-2xl border border-purple-100 bg-white/90 p-5 shadow-sm shadow-purple-100 ${className}`}>
      {children}
    </div>
  )
}

export function Button({
  variant = 'primary',
  className = '',
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: 'primary' | 'ghost' | 'danger' }) {
  const styles = {
    primary: 'bg-purple-600 text-white hover:bg-purple-700 shadow-md shadow-purple-200',
    ghost: 'bg-purple-50 text-purple-700 hover:bg-purple-100',
    danger: 'bg-red-50 text-red-600 hover:bg-red-100',
  }
  return (
    <button
      className={`cursor-pointer rounded-xl px-4 py-2 text-sm font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${styles[variant]} ${className}`}
      {...props}
    />
  )
}

export function Input(props: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className="w-full rounded-xl border border-purple-200 bg-white px-3 py-2 text-sm text-purple-950 outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-100"
      {...props}
    />
  )
}

export function Select(props: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      className="w-full rounded-xl border border-purple-200 bg-white px-3 py-2 text-sm text-purple-950 outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-100"
      {...props}
    />
  )
}

export function Label({ children }: { children: ReactNode }) {
  return <label className="mb-1 block text-xs font-semibold text-purple-500">{children}</label>
}

export function EmptyState({ icon, text }: { icon: string; text: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 py-12 text-center text-purple-400">
      <span className="text-4xl">{icon}</span>
      <p className="text-sm">{text}</p>
    </div>
  )
}
