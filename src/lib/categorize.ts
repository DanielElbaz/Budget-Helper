import type { Category, Transaction } from '../types'

/** Normalizes a merchant name so "רמי לוי שיווק השקמה 123" and "רמי לוי" compare well. */
export function merchantKey(description: string): string {
  return description
    .toLowerCase()
    .replace(/[‎‏"'׳״.,*#()\-_/\\]/g, ' ')
    .replace(/\d+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

// Keyword → default category (by its stored, original name). Matched on the
// normalized merchant text. Order matters: the first matching rule wins.
const W = (words: string) => new RegExp(`(^| )(${words})( |$)`) // whole words only
const RULES: [RegExp, string][] = [
  // Pharmacies before groceries: "סופר פארם" contains "סופר".
  [/סופר פארם|super ?pharm|ניו פארם|בי פארם|מכבי|כללית|מאוחדת|לאומית|קופת חולים|מרקחת|רופא|שיניים|אופטיק/, 'Santé'],
  [/רמי לוי(?! תקשורת)|שופרסל|יוחננוף|ויקטורי|אושר עד|יינות ביתן|טיב טעם|חצי חינם|קרפור|carrefour|am ?pm|מכולת|פרש מרקט|מחסני השוק|זול ובגדול/, 'Alimentation & Courses'],
  [W('מגה|סופר|super'), 'Alimentation & Courses'],
  [/וולט|wolt|תן ביס|10bis|סיבוס|cibus|מסעד|קפה|ארומה|aroma|גרג|מקדונלד|mcdonald|בורגר|burger|פיצה|pizza|דומינו|שווארמה|פלאפל|סושי|sushi/, 'Restaurants & Sorties'],
  [W('בר|pub'), 'Restaurants & Sorties'],
  [/סונול|דור אלון|yellow|חניון|פנגו|pango|cellopark|סלופארק|רב קו|רכבת ישראל|אגד|מטרופולין|gett|יאנגו|yango|uber|כביש|מוסך/, 'Transport & Carburant'],
  [W('פז|דלק|ten|טן|דן|טסט|ילו'), 'Transport & Carburant'],
  [/netflix|נטפליקס|spotify|ספוטיפיי|apple|google|youtube|disney|amazon prime|chatgpt|openai|icloud|microsoft|adobe|נקסט/, 'Abonnements'],
  [W('יס|yes|הוט|hot'), 'Abonnements'],
  [/חברת החשמל|חברת חשמל|סופרגז|אמישראגז|פזגז/, 'Électricité & Gaz'],
  [/תאגיד|מי אביבים|הגיחון|מי שבע|מיתב|מי כרמל|מי רעננה|מי נתניה|מי מודיעין/, 'Eau'],
  [/בזק|פרטנר|partner|סלקום|cellcom|פלאפון|pelephone|הוט מובייל|גולן טלקום|רמי לוי תקשורת|we4g|אינטרנט/, 'Internet & Téléphone'],
  [/ביטוח|הראל|מגדל|הפניקס|מנורה|איילון|ליברה|aig|שומרה/, 'Assurances'],
  [W('כלל|ישיר'), 'Assurances'],
  [/ארנונה|עיריי|ועד בית|שכירות|שכר דירה|משכנתא/, 'Logement'],
  [/מספרה|קוסמטיק|ציפורניים|spa/, 'Beauté & Soins'],
  [W('לק|ספא'), 'Beauté & Soins'],
  [/זארה|zara|h&m|קסטרו|castro|terminal ?x|טרמינל איקס|shein|asos|הודיס|אמריקן איגל|mango|רנואר/, 'Habillement'],
  [W('פוקס|fox|גולף|golf|מנגו'), 'Habillement'],
  [/צהרון|בית ספר|חוג|לימוד|צעצוע|toys/, 'Enfants & Éducation'],
  [W('גן'), 'Enfants & Éducation'],
  [/סינמה|cinema|יס פלאנט|eventim|לאן|זאפה|תיאטרון|מוזיאון|הולמס|gym/, 'Loisirs & Culture'],
  [/אל על|el al|ישראייר|ארקיע|booking|airbnb|מלון|hotel|ryanair|wizz|easyjet|expedia|agoda/, 'Vacances & Voyages'],
  [/עמלה|עמלת|ריבית|הלוואה|דמי כרטיס/, 'Banque & Crédits'],
  [/וטרינר|חיות|pet ?shop|פטשופ/, 'Animaux'],
]

export interface CategorySuggester {
  suggest: (description: string, type: 'income' | 'expense') => string | undefined
}

/** Learns merchant → category from past transactions, then falls back to keyword rules. */
export function buildSuggester(categories: Category[], history: Transaction[]): CategorySuggester {
  const learned = new Map<string, Map<string, number>>()
  for (const tx of history) {
    if (!tx.description) continue
    const key = merchantKey(tx.description)
    if (!key) continue
    const counts = learned.get(key) ?? new Map<string, number>()
    counts.set(tx.categoryId, (counts.get(tx.categoryId) ?? 0) + 1)
    learned.set(key, counts)
  }
  const byName = new Map(categories.map((c) => [c.name, c]))

  return {
    suggest(description, type) {
      const key = merchantKey(description)
      const counts = learned.get(key)
      if (counts) {
        const best = Array.from(counts.entries()).sort((a, b) => b[1] - a[1])[0][0]
        if (categories.some((c) => c.id === best && c.type === type)) return best
      }
      if (type === 'expense') {
        for (const [pattern, name] of RULES) {
          const cat = byName.get(name)
          if (cat && cat.type === 'expense' && pattern.test(key)) return cat.id
        }
      }
      return undefined
    },
  }
}
