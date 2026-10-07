/**
 * Search over buurten, with grouping by parent wijk.
 *
 * Amsterdammers search for the district ("Jordaan", "Oude Pijp",
 * "Museumkwartier"), which in CBS terms is the *wijk*, while the simulator
 * operates on the *buurt* below it. So a query is matched against both levels:
 *
 *  - A wijk match returns that wijk as a labelled group with all of its
 *    constituent buurten listed underneath as selectable options.
 *  - A buurt (or buurtcode) match that is not already covered by a matched
 *    wijk is returned standalone, ungrouped, exactly as before.
 *
 * Two buurten have no wijk mapping at all; they are never grouped and can only
 * ever appear standalone.
 *
 * Pure functions, no React. The ranking rules are easier to check this way.
 */

/** Case- and diacritic-insensitive, so "Zuid" finds "Zuid-Pijp" and "ij" works. */
export const normalize = (s) =>
  (s ?? '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')

/**
 * Ordering inside any list of buurten: selectable ones first (a buurt with no
 * energy data cannot be simulated), then alphabetically by Dutch collation.
 */
const byUsefulnessThenName = (a, b) => {
  if (a.hasEnergyData !== b.hasEnergyData) return a.hasEnergyData ? -1 : 1
  return a.name.localeCompare(b.name, 'nl')
}

/**
 * Build the render model for the dropdown.
 *
 * Returns `sections`, each `{ wijkName, wijkCode, buurten }`. A section with
 * `wijkName: null` is an ungrouped run of buurten and renders without a header.
 * `optionCount` is the number of selectable rows across all sections, which the
 * caller uses for keyboard navigation.
 */
export function buildSearchResults(buurten, query, { limit = 120 } = {}) {
  const q = normalize(query).trim()

  // No query: the plain alphabetical list, unchanged from before wijk grouping.
  if (!q) {
    const all = buurten.slice().sort(byUsefulnessThenName).slice(0, limit)
    return { sections: [{ wijkName: null, wijkCode: null, buurten: all }], optionCount: all.length }
  }

  // --- wijk matches ---------------------------------------------------------
  const wijkIndex = new Map()
  for (const b of buurten) {
    if (!b.wijkName) continue
    if (!wijkIndex.has(b.wijkName)) {
      wijkIndex.set(b.wijkName, { wijkName: b.wijkName, wijkCode: b.wijkCode, buurten: [] })
    }
    wijkIndex.get(b.wijkName).buurten.push(b)
  }

  const wijkSections = [...wijkIndex.values()]
    .map((w) => ({ ...w, n: normalize(w.wijkName) }))
    .filter((w) => w.n.includes(q))
    // A wijk whose name starts with the query is the more likely target than
    // one that merely contains it somewhere.
    .sort((a, b) => {
      const ap = a.n.startsWith(q) ? 0 : 1
      const bp = b.n.startsWith(q) ? 0 : 1
      if (ap !== bp) return ap - bp
      return a.wijkName.localeCompare(b.wijkName, 'nl')
    })
    .map((w) => ({
      wijkName: w.wijkName,
      wijkCode: w.wijkCode,
      buurten: w.buurten.slice().sort(byUsefulnessThenName),
    }))

  // Everything already shown under a wijk header must not appear again below.
  const grouped = new Set(wijkSections.flatMap((s) => s.buurten.map((b) => b.code)))

  // --- direct buurt matches -------------------------------------------------
  const direct = buurten
    .filter((b) => !grouped.has(b.code))
    .map((b) => ({ b, n: normalize(b.name) }))
    .filter(({ b, n }) => n.includes(q) || normalize(b.code).includes(q))
    .sort((x, y) => {
      if (x.b.hasEnergyData !== y.b.hasEnergyData) return x.b.hasEnergyData ? -1 : 1
      const xp = x.n.startsWith(q) ? 0 : 1
      const yp = y.n.startsWith(q) ? 0 : 1
      if (xp !== yp) return xp - yp
      return x.b.name.localeCompare(y.b.name, 'nl')
    })
    .map(({ b }) => b)

  // --- assemble, respecting the overall row budget --------------------------
  const sections = []
  let budget = limit

  for (const s of wijkSections) {
    if (budget <= 0) break
    const take = s.buurten.slice(0, budget)
    if (!take.length) break
    sections.push({ ...s, buurten: take })
    budget -= take.length
  }

  if (budget > 0 && direct.length) {
    sections.push({ wijkName: null, wijkCode: null, buurten: direct.slice(0, budget) })
    budget -= Math.min(direct.length, budget)
  }

  return {
    sections,
    optionCount: sections.reduce((n, s) => n + s.buurten.length, 0),
  }
}

/** The selectable rows in render order. This is what keyboard navigation indexes. */
export const flattenSections = (sections) => sections.flatMap((s) => s.buurten)
