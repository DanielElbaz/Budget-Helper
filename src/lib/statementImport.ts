// Reads credit-card / bank statement exports (Max, Isracard, Cal, banks…) into
// plain rows: date, description, amount. Everything runs in the browser; the
// file never leaves the phone except as the transactions the user confirms.

export type Cell = string | number | boolean | Date | null | undefined

export interface StatementRow {
  date: string // yyyy-mm-dd
  description: string
  /** Positive = money out (a purchase), negative = money in (refund / credit). */
  amount: number
}

export class UnsupportedFileError extends Error {}
export class NoTableFoundError extends Error {}

// Column titles seen in Israeli exports, most specific first.
const DATE_HEADERS = ['תאריך עסקה', 'תאריך רכישה', 'תאריך העסקה', 'תאריך', 'date']
const DESCRIPTION_HEADERS = ['שם בית העסק', 'שם בית עסק', 'בית עסק', 'שם העסק', 'תיאור', 'פרטים', 'הפעולה', 'description']
// "Charged" amount (in shekels) beats the original transaction amount (may be foreign currency).
const AMOUNT_HEADERS = ['סכום חיוב', 'סכום החיוב', 'סכום לחיוב', 'סכום בש"ח', 'סכום עסקה', 'סכום', 'amount']
const DEBIT_HEADERS = ['חובה', 'בחובה']
const CREDIT_HEADERS = ['זכות', 'בזכות']

function norm(value: Cell): string {
  return String(value ?? '')
    .replace(/[‎‏‪-‮]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase()
}

function findColumn(header: string[], candidates: string[]): number {
  for (const candidate of candidates) {
    const exact = header.findIndex((h) => h === candidate)
    if (exact !== -1) return exact
  }
  for (const candidate of candidates) {
    const partial = header.findIndex((h) => h.includes(candidate))
    if (partial !== -1) return partial
  }
  return -1
}

export function parseDate(value: Cell): string | null {
  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    return `${value.getFullYear()}-${String(value.getMonth() + 1).padStart(2, '0')}-${String(value.getDate()).padStart(2, '0')}`
  }
  if (typeof value === 'number' && value > 20000 && value < 80000) {
    // Excel serial date (days since 1899-12-30).
    const d = new Date(Date.UTC(1899, 11, 30) + value * 86400000)
    return d.toISOString().slice(0, 10)
  }
  const s = norm(value)
  let m = s.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/)
  if (m) return `${m[1]}-${m[2].padStart(2, '0')}-${m[3].padStart(2, '0')}`
  m = s.match(/^(\d{1,2})[./-](\d{1,2})[./-](\d{2,4})$/)
  if (m) {
    const year = m[3].length === 2 ? `20${m[3]}` : m[3]
    const day = Number(m[1])
    const month = Number(m[2])
    if (month < 1 || month > 12 || day < 1 || day > 31) return null
    return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`
  }
  return null
}

export function parseAmount(value: Cell): number | null {
  if (typeof value === 'number') return Number.isFinite(value) ? value : null
  let s = norm(value).replace(/[₪$€]|ש"ח|ils|nis/g, '').replace(/\s/g, '')
  if (!s) return null
  let negative = false
  if (s.startsWith('(') && s.endsWith(')')) {
    negative = true
    s = s.slice(1, -1)
  }
  if (s.endsWith('-')) {
    negative = true
    s = s.slice(0, -1)
  }
  if (s.startsWith('-')) {
    negative = !negative
    s = s.slice(1)
  }
  // "1,234.50" → 1234.50 ; "1.234,50" → 1234.50
  if (/,\d{1,2}$/.test(s) && s.includes('.')) s = s.replace(/\./g, '').replace(',', '.')
  else s = s.replace(/,/g, '')
  if (!/^\d+(\.\d+)?$/.test(s)) return null
  const n = Number(s)
  return negative ? -n : n
}

/** Finds the header row in a sheet and turns the rows under it into statement rows. */
export function extractRows(table: Cell[][]): StatementRow[] {
  for (let h = 0; h < Math.min(table.length, 40); h++) {
    const header = table[h].map(norm)
    const dateCol = findColumn(header, DATE_HEADERS)
    const descCol = findColumn(header, DESCRIPTION_HEADERS)
    const amountCol = findColumn(header, AMOUNT_HEADERS)
    const debitCol = findColumn(header, DEBIT_HEADERS)
    const creditCol = findColumn(header, CREDIT_HEADERS)
    const hasAmount = amountCol !== -1 || debitCol !== -1
    if (dateCol === -1 || descCol === -1 || !hasAmount) continue

    const rows: StatementRow[] = []
    for (const raw of table.slice(h + 1)) {
      const date = parseDate(raw[dateCol])
      const description = String(raw[descCol] ?? '').replace(/\s+/g, ' ').trim()
      let amount: number | null
      if (amountCol !== -1) {
        amount = parseAmount(raw[amountCol])
      } else {
        // Bank layout: separate debit (money out) and credit (money in) columns.
        const debit = parseAmount(raw[debitCol]) ?? 0
        const credit = creditCol !== -1 ? (parseAmount(raw[creditCol]) ?? 0) : 0
        amount = debit || credit ? Math.abs(debit) - Math.abs(credit) : null
      }
      // Totals, section titles and blank lines have no date or no amount: skip them.
      if (!date || amount === null || amount === 0 || !description) continue
      rows.push({ date, description, amount: Math.round(amount * 100) / 100 })
    }
    if (rows.length > 0) return rows
  }
  return []
}

function tablesFromHtml(text: string): Cell[][][] {
  const doc = new DOMParser().parseFromString(text, 'text/html')
  return Array.from(doc.querySelectorAll('table')).map((table) =>
    Array.from(table.querySelectorAll('tr')).map((tr) => Array.from(tr.querySelectorAll('th,td')).map((td) => td.textContent ?? '')),
  )
}

function tableFromCsv(text: string): Cell[][] {
  const firstLine = text.split(/\r?\n/, 1)[0] ?? ''
  const delimiter = [',', ';', '\t'].sort((a, b) => firstLine.split(b).length - firstLine.split(a).length)[0]
  const rows: Cell[][] = []
  let row: string[] = []
  let cell = ''
  let quoted = false
  for (let i = 0; i < text.length; i++) {
    const ch = text[i]
    if (quoted) {
      if (ch === '"' && text[i + 1] === '"') {
        cell += '"'
        i++
      } else if (ch === '"') quoted = false
      else cell += ch
    } else if (ch === '"') quoted = true
    else if (ch === delimiter) {
      row.push(cell)
      cell = ''
    } else if (ch === '\n' || ch === '\r') {
      if (ch === '\r' && text[i + 1] === '\n') i++
      row.push(cell)
      rows.push(row)
      row = []
      cell = ''
    } else cell += ch
  }
  if (cell || row.length) rows.push([...row, cell])
  return rows
}

async function decodeText(buffer: ArrayBuffer): Promise<string> {
  const utf8 = new TextDecoder('utf-8').decode(buffer)
  // Older Israeli exports are in Windows-1255; if UTF-8 decoding produced
  // replacement characters, try that instead.
  if (!utf8.includes('�')) return utf8.replace(/^﻿/, '')
  try {
    return new TextDecoder('windows-1255').decode(buffer)
  } catch {
    return utf8
  }
}

/** Reads every sheet/table of the file and returns all statement rows found. */
export async function readStatement(file: File): Promise<StatementRow[]> {
  const buffer = await file.arrayBuffer()
  const head = new Uint8Array(buffer.slice(0, 8))
  let tables: Cell[][][]

  if (head[0] === 0x50 && head[1] === 0x4b) {
    // .xlsx (a zip archive). Loaded on demand so the library is not in the main bundle.
    const { default: readXlsxFile } = await import('read-excel-file/browser')
    const sheets = await readXlsxFile(file)
    tables = sheets.map((s) => s.data as Cell[][])
  } else if (head[0] === 0xd0 && head[1] === 0xcf) {
    // Legacy binary .xls: not supported without a heavy, outdated dependency.
    throw new UnsupportedFileError('legacy-xls')
  } else {
    const text = await decodeText(buffer)
    // Many banks' ".xls" downloads are really an HTML table.
    tables = /<table/i.test(text) ? tablesFromHtml(text) : [tableFromCsv(text)]
  }

  const rows = tables.flatMap(extractRows)
  if (rows.length === 0) throw new NoTableFoundError('no-table')
  return rows
}
