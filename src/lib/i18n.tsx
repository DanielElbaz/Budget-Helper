import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { defaultCategoryNameTranslations, translations, type Lang, type TranslationKey } from './translations'

const STORAGE_KEY = 'budget-helper-lang'
const RTL_LANGS: Lang[] = ['he']

interface LangContextValue {
  lang: Lang
  setLang: (lang: Lang) => void
  t: (key: TranslationKey) => string
  dir: 'ltr' | 'rtl'
  currency: string
  locale: string
  translateCategoryName: (name: string) => string
}

const LangContext = createContext<LangContextValue | null>(null)

function getInitialLang(): Lang {
  const stored = localStorage.getItem(STORAGE_KEY)
  return stored === 'he' ? 'he' : 'fr'
}

export function LangProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>(getInitialLang)

  const dir = RTL_LANGS.includes(lang) ? 'rtl' : 'ltr'
  const locale = lang === 'he' ? 'he-IL' : 'fr-FR'
  const currency = lang === 'he' ? 'ILS' : 'EUR'

  useEffect(() => {
    document.documentElement.dir = dir
    document.documentElement.lang = lang
  }, [dir, lang])

  function setLang(next: Lang) {
    localStorage.setItem(STORAGE_KEY, next)
    setLangState(next)
  }

  const value = useMemo<LangContextValue>(
    () => ({
      lang,
      setLang,
      t: (key) => translations[lang][key],
      dir,
      currency,
      locale,
      translateCategoryName: (name) => defaultCategoryNameTranslations[name]?.[lang] ?? name,
    }),
    [lang, dir, currency, locale],
  )

  return <LangContext.Provider value={value}>{children}</LangContext.Provider>
}

export function useLang() {
  const ctx = useContext(LangContext)
  if (!ctx) throw new Error('useLang must be used within LangProvider')
  return ctx
}
