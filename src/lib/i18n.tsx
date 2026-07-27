import { createContext, useContext, useEffect, useMemo, type ReactNode } from 'react'
import { defaultCategoryNameTranslations, translations, type TranslationKey } from './translations'

interface LangContextValue {
  t: (key: TranslationKey) => string
  dir: 'ltr' | 'rtl'
  currency: string
  locale: string
  translateCategoryName: (name: string) => string
}

const LangContext = createContext<LangContextValue | null>(null)

export function LangProvider({ children }: { children: ReactNode }) {
  useEffect(() => {
    document.documentElement.dir = 'rtl'
    document.documentElement.lang = 'he'
  }, [])

  const value = useMemo<LangContextValue>(
    () => ({
      t: (key) => translations[key],
      dir: 'rtl',
      currency: 'ILS',
      locale: 'he-IL',
      translateCategoryName: (name) => defaultCategoryNameTranslations[name] ?? name,
    }),
    [],
  )

  return <LangContext.Provider value={value}>{children}</LangContext.Provider>
}

export function useLang() {
  const ctx = useContext(LangContext)
  if (!ctx) throw new Error('useLang must be used within LangProvider')
  return ctx
}
