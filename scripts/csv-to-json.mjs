/**
 * Build-time CSV -> JSON conversion.
 *
 * Reads data/amsterdam_buurt_samenvatting.csv (517 Amsterdam buurten, CBS
 * "Kerncijfers wijken en buurten" + energy-label distribution) and writes
 * src/data/buurten.json, which is imported statically by the app. No runtime
 * fetching, no backend: the whole dataset is bundled.
 *
 * Source CSV quirks handled here:
 *  - Missing numeric values are written as "." (CBS convention), not "".
 *  - 47 buurten (harbour/industrial zones, no housing stock) have no energy
 *    label columns at all. These are kept in the JSON but flagged
 *    hasEnergyData: false so the UI can exclude or mark them.
 *  - Each buurt carries its parent wijk (wijkcode/wijknaam), the official CBS
 *    district level. These are the names people actually search for ("Jordaan",
 *    "Oude Pijp"), so the UI searches and groups on them. 2 buurten have no
 *    wijk mapping; they get wijkName: null and are never grouped.
 */
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const root = resolve(__dirname, '..')
const SRC = resolve(root, 'data/amsterdam_buurt_samenvatting.csv')
const OUT = resolve(root, 'src/data/buurten.json')

/** CBS writes suppressed / not-applicable numbers as a bare dot. */
const num = (v) => {
  if (v === undefined) return null
  const t = v.trim()
  if (t === '' || t === '.' || t === 'NA') return null
  const n = Number(t)
  return Number.isFinite(n) ? n : null
}

const raw = readFileSync(SRC, 'utf8').replace(/^﻿/, '').trim()
const [headerLine, ...lines] = raw.split(/\r?\n/)
const header = headerLine.split(',').map((h) => h.trim())

// The file contains no quoted fields; a plain split is safe. Assert it stays true.
const col = (cells, name) => cells[header.indexOf(name)]

const buurten = lines.map((line, i) => {
  const cells = line.split(',')
  if (cells.length !== header.length) {
    throw new Error(
      `Row ${i + 2}: expected ${header.length} fields, got ${cells.length}. ` +
        `The CSV may now contain quoted commas; upgrade this parser.`,
    )
  }

  const labelCount = num(col(cells, 'n_woningen_label'))
  const pct = (name) => num(col(cells, name))

  const wijkName = (col(cells, 'wijknaam') ?? '').trim()
  const wijkCode = (col(cells, 'wijkcode') ?? '').trim()

  const record = {
    code: col(cells, 'buurtcode').trim(),
    name: col(cells, 'buurtnaam').trim(),
    // Parent CBS district. null where the official mapping is missing.
    wijkCode: wijkCode || null,
    wijkName: wijkName || null,
    inwoners: num(col(cells, 'inwoners')),
    huishoudens: num(col(cells, 'huishoudens')),
    woningvoorraad: num(col(cells, 'woningvoorraad')),
    wozK: num(col(cells, 'woz_gemiddeld_x1000')), // average WOZ value, x €1000
    pctKoop: num(col(cells, 'pct_koopwoning')),
    pctHuur: num(col(cells, 'pct_huurwoning')),
    pctWcorp: num(col(cells, 'pct_wcorp')), // social-housing share of the rental stock
    pctBouwjaarVoor10jr: num(col(cells, 'pct_bouwjaar_voor10jr')),
    pctBouwjaarAfgelopen10jr: num(col(cells, 'pct_bouwjaar_afgelopen10jr')),
    pctEengezins: num(col(cells, 'pct_eengezinswoning')),
    pctMeergezins: num(col(cells, 'pct_meergezinswoning')),
    nWoningenLabel: labelCount,
    pctA: pct('pct_A'),
    pctB: pct('pct_B'),
    pctC: pct('pct_C'),
    pctD: pct('pct_D'),
    pctEFG: pct('pct_EFG'),
    gemBouwjaar: num(col(cells, 'gem_bouwjaar')),
  }

  record.hasEnergyData = record.pctEFG !== null && (labelCount ?? 0) > 0
  return record
})

const withData = buurten.filter((b) => b.hasEnergyData)

// Amsterdam-wide aggregates, computed once at build time so the UI does not
// have to re-derive them. The EFG rate is weighted by the number of labelled
// dwellings, which is the honest city-level figure; the unweighted mean over
// buurten is reported alongside it for reference.
const labelledTotal = withData.reduce((s, b) => s + b.nWoningenLabel, 0)
const weighted = (key) =>
  withData.reduce((s, b) => s + (b[key] ?? 0) * b.nWoningenLabel, 0) / labelledTotal

const wijkNames = new Set(buurten.map((b) => b.wijkName).filter(Boolean))

const summary = {
  nBuurten: buurten.length,
  nWijken: wijkNames.size,
  nBuurtenWithoutWijk: buurten.filter((b) => !b.wijkName).length,
  nBuurtenWithEnergyData: withData.length,
  nBuurtenWithoutEnergyData: buurten.length - withData.length,
  labelledDwellings: labelledTotal,
  totalWoningvoorraad: buurten.reduce((s, b) => s + (b.woningvoorraad ?? 0), 0),
  totalInwoners: buurten.reduce((s, b) => s + (b.inwoners ?? 0), 0),
  pctEFGWeighted: weighted('pctEFG'),
  pctEFGMeanOfBuurten:
    withData.reduce((s, b) => s + b.pctEFG, 0) / withData.length,
  pctAWeighted: weighted('pctA'),
  pctBWeighted: weighted('pctB'),
  pctCWeighted: weighted('pctC'),
  pctDWeighted: weighted('pctD'),
  // Dwellings in the E/F/G bracket, city-wide, among labelled dwellings only.
  efgDwellings: Math.round((weighted('pctEFG') / 100) * labelledTotal),
  medianWozK: (() => {
    const v = buurten.map((b) => b.wozK).filter((x) => x !== null).sort((a, b) => a - b)
    return v.length ? v[Math.floor(v.length / 2)] : null
  })(),
  generatedFrom: 'amsterdam_buurt_samenvatting.csv',
}

mkdirSync(dirname(OUT), { recursive: true })
writeFileSync(OUT, JSON.stringify({ summary, buurten }, null, 0))

console.log(
  `[csv-to-json] ${buurten.length} buurten -> src/data/buurten.json ` +
    `(${withData.length} with energy data, ${summary.nBuurtenWithoutEnergyData} without; ` +
    `${summary.nWijken} wijken, ${summary.nBuurtenWithoutWijk} buurten unmapped); ` +
    `city-wide E/F/G = ${summary.pctEFGWeighted.toFixed(2)}%`,
)
