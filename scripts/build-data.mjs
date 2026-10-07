/**
 * Build-time data preparation.
 *
 * Reads the three source files in data/ and writes two JSON modules into
 * src/data/ that the app imports statically. No runtime fetching, no backend.
 *
 *   amsterdam_policy_data.csv      -> src/data/buurten.json
 *   savings_config.json            -> folded into buurten.json as `savings`
 *   amsterdam_buurten_2025.geojson -> src/data/geo.json
 *
 * The savings factors are copied in here rather than imported by the app, so
 * editing savings_config.json and rebuilding changes the CO2 outputs with no
 * code change. Note that it is a rebuild, not a live reload.
 *
 * This script derives nothing. It parses, validates and passes through. Every
 * calculation lives in src/lib so it can be read in one place.
 */
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const OUT_DIR = resolve(root, 'src/data')

/** CBS writes suppressed or not-applicable numbers as a bare dot. */
const num = (v) => {
  if (v === undefined || v === null) return null
  const t = String(v).trim()
  if (t === '' || t === '.' || t === 'NA') return null
  const n = Number(t)
  return Number.isFinite(n) ? n : null
}
const bool = (v) => String(v ?? '').trim().toLowerCase() === 'true'
const str = (v) => String(v ?? '').trim()

// --- CSV ---------------------------------------------------------------------
const csv = readFileSync(resolve(root, 'data/amsterdam_policy_data.csv'), 'utf8')
  .replace(/^﻿/, '')
  .trim()
const [headerLine, ...lines] = csv.split(/\r?\n/)
const header = headerLine.split(',').map((h) => h.trim())

const REQUIRED = [
  'buurtcode', 'buurtnaam', 'wijkcode', 'wijknaam', 'dwellings', 'households',
  'pct_owner', 'pct_rent', 'pct_social_rent', 'pct_house', 'pct_apartment',
  'woz_avg_eur', 'gas_m3_avg', 'elec_kwh_avg', 'district_heating_pct',
  'pct_A', 'pct_B', 'pct_C', 'pct_D', 'pct_E', 'pct_F', 'pct_G', 'n_labelled',
  'income_median_2024', 'income_mean_2024', 'pct_hh_lowincome130_2024',
  'pct_hh_minimum130_2024', 'pct_hh_income_q1_2023', 'pct_hh_income_q5_2023',
  'pct_DEFG', 'est_owner_DEFG_dwellings', 'woz_avg_above_cap',
  'has_energy_data', 'low_gas_flag',
]
const missingCols = REQUIRED.filter((c) => !header.includes(c))
if (missingCols.length) {
  throw new Error(`amsterdam_policy_data.csv is missing columns: ${missingCols.join(', ')}`)
}

const col = (cells, name) => cells[header.indexOf(name)]

const buurten = lines.map((line, i) => {
  const cells = line.split(',')
  if (cells.length !== header.length) {
    throw new Error(
      `Row ${i + 2}: expected ${header.length} fields, got ${cells.length}. ` +
        'The CSV may now contain quoted commas; upgrade this parser.',
    )
  }
  const g = (n) => num(col(cells, n))
  return {
    code: str(col(cells, 'buurtcode')),
    name: str(col(cells, 'buurtnaam')),
    wijkCode: str(col(cells, 'wijkcode')) || null,
    wijkName: str(col(cells, 'wijknaam')) || null,

    dwellings: g('dwellings'),
    households: g('households'),
    pctOwner: g('pct_owner'),
    pctRent: g('pct_rent'),
    pctSocialRent: g('pct_social_rent'),
    pctHouse: g('pct_house'),
    pctApartment: g('pct_apartment'),
    wozAvgEur: g('woz_avg_eur'),

    gasM3Avg: g('gas_m3_avg'),
    elecKwhAvg: g('elec_kwh_avg'),
    districtHeatingPct: g('district_heating_pct'),

    pctA: g('pct_A'), pctB: g('pct_B'), pctC: g('pct_C'), pctD: g('pct_D'),
    pctE: g('pct_E'), pctF: g('pct_F'), pctG: g('pct_G'),
    nLabelled: g('n_labelled'),
    pctDEFG: g('pct_DEFG'),

    incomeMedian2024: g('income_median_2024'),
    incomeMean2024: g('income_mean_2024'),
    pctLowIncome130: g('pct_hh_lowincome130_2024'),
    pctMinima130: g('pct_hh_minimum130_2024'),
    pctIncomeQ1: g('pct_hh_income_q1_2023'),
    pctIncomeQ5: g('pct_hh_income_q5_2023'),

    eligibleDwellings: g('est_owner_DEFG_dwellings'),
    wozAboveCap: bool(col(cells, 'woz_avg_above_cap')),
    hasEnergyData: bool(col(cells, 'has_energy_data')),
    lowGasFlag: bool(col(cells, 'low_gas_flag')),
  }
})

// --- savings config ----------------------------------------------------------
const savingsRaw = JSON.parse(readFileSync(resolve(root, 'data/savings_config.json'), 'utf8'))
const savings = {
  status: savingsRaw.status,
  source: savingsRaw.source,
  method: savingsRaw.method,
  labelGroupsNote: savingsRaw.label_groups_note,
  caveat: savingsRaw.caveat,
  relativeGasUse: savingsRaw.relative_gas_use_vs_G,
  co2KgPerM3Gas: savingsRaw.co2_kg_per_m3_gas,
  co2Source: savingsRaw.co2_source,
  impliedSavingsToB: savingsRaw.implied_savings_to_B,
}
for (const k of ['A', 'B', 'C', 'D', 'E', 'F', 'G']) {
  if (typeof savings.relativeGasUse?.[k] !== 'number') {
    throw new Error(`savings_config.json: relative_gas_use_vs_G is missing label ${k}`)
  }
}
if (typeof savings.co2KgPerM3Gas !== 'number') {
  throw new Error('savings_config.json: co2_kg_per_m3_gas must be a number')
}

// --- geojson -----------------------------------------------------------------
const geo = JSON.parse(readFileSync(resolve(root, 'data/amsterdam_buurten_2025.geojson'), 'utf8'))
const geoCodes = new Set(geo.features.map((f) => f.properties.buurtcode))
const csvCodes = new Set(buurten.map((b) => b.code))
const notInGeo = [...csvCodes].filter((c) => !geoCodes.has(c))
const notInCsv = [...geoCodes].filter((c) => !csvCodes.has(c))
if (notInGeo.length || notInCsv.length) {
  throw new Error(
    `buurtcode join is incomplete: ${notInGeo.length} missing from geojson, ` +
      `${notInCsv.length} missing from csv`,
  )
}

// Drop every property except the join key; the attributes live in buurten.json.
const geoOut = {
  type: 'FeatureCollection',
  features: geo.features.map((f) => ({
    type: 'Feature',
    properties: { code: f.properties.buurtcode },
    geometry: f.geometry,
  })),
}

mkdirSync(OUT_DIR, { recursive: true })
writeFileSync(
  resolve(OUT_DIR, 'buurten.json'),
  JSON.stringify({ savings, buurten }, null, 0),
)
writeFileSync(resolve(OUT_DIR, 'geo.json'), JSON.stringify(geoOut, null, 0))

const withEnergy = buurten.filter((b) => b.hasEnergyData).length
console.log(
  `[build-data] ${buurten.length} buurten, ${withEnergy} with energy data, ` +
    `${geo.features.length} polygons joined. savings_config status: ${savings.status}`,
)
