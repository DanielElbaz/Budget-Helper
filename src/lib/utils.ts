export function formatMoney(amount: number, locale = 'he-IL', currency = 'ILS') {
  // Whole shekels show without ".00"; agorot only appear when there are some.
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
    minimumFractionDigits: Number.isInteger(amount) ? 0 : 2,
    maximumFractionDigits: 2,
  }).format(amount)
}

/** "+₪120" / "-₪120" with correct bidi handling from Intl. */
export function formatSignedMoney(amount: number, locale = 'he-IL', currency = 'ILS') {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
    signDisplay: 'exceptZero',
    minimumFractionDigits: Number.isInteger(amount) ? 0 : 2,
    maximumFractionDigits: 2,
  }).format(amount)
}

/** Short axis label: ₪12K instead of ₪12,000. */
export function formatMoneyCompact(amount: number, locale = 'he-IL', currency = 'ILS') {
  return new Intl.NumberFormat(locale, { style: 'currency', currency, notation: 'compact', maximumFractionDigits: 1 }).format(amount)
}

export function currentMonthKey(date = new Date()) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
}

export function monthKeyOf(isoDate: string) {
  return isoDate.slice(0, 7)
}

export function monthLabel(monthKey: string, locale = 'he-IL') {
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

/** Today's date in the phone's own time zone (toISOString() is UTC, which
 *  gave yesterday's date in Israel between midnight and 2–3am). */
export function todayIso(date = new Date()) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
}
