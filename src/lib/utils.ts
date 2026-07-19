export function formatMoney(amount: number, locale = 'fr-FR', currency = 'EUR') {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
    maximumFractionDigits: 2,
  }).format(amount)
}

export function currentMonthKey(date = new Date()) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
}

export function monthKeyOf(isoDate: string) {
  return isoDate.slice(0, 7)
}

export function monthLabel(monthKey: string, locale = 'fr-FR') {
  const [year, month] = monthKey.split('-').map(Number)
  const date = new Date(year, month - 1, 1)
  return new Intl.DateTimeFormat(locale, { month: 'long', year: 'numeric' }).format(date)
}

export function lastNMonthKeys(n: number, from = new Date()) {
  const keys: string[] = []
  for (let i = n - 1; i >= 0; i--) {
    const date = new Date(from.getFullYear(), from.getMonth() - i, 1)
    keys.push(currentMonthKey(date))
  }
  return keys
}

export function todayIso() {
  return new Date().toISOString().slice(0, 10)
}
