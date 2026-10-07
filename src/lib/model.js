/**
 * The simulation.
 *
 * Pure functions over the dataset: no React, no side effects, so the policy
 * arithmetic can be checked on its own. Every coefficient arrives from
 * src/config/coefficients.js, every CO2 figure from src/lib/co2.js.
 *
 * The lab compares two schemes over the same stock of eligible dwellings:
 *
 *   current   a flat grant per eligible dwelling, subject to a WOZ ceiling
 *   proposed  grant = min(B * W_n + T_h, s * cost_n)
 *
 * Both are potential allocations, not forecasts. Nothing here models whether a
 * household decides to renovate, because no reliable Amsterdam figure for that
 * exists (DATA_NOTES.md, "Not available").
 */
import {
  RENOVATION_COST_EUR_EXCL_VAT,
  VAT_RATE,
  COST_INFLATION_FACTOR,
  CURRENT_SCHEME,
  INCOME_TOPUP,
  OUTPUT_DEFS,
} from '../config/coefficients'
import { buurtCo2, co2IsAvailable } from './co2'

const DEFG = ['D', 'E', 'F', 'G']

/* ---------------------------------------------------------------------------
 * Cost
 * ------------------------------------------------------------------------- */

/**
 * Cost to bring one dwelling of a given type and label to schillabel B,
 * in 2025 euros including VAT.
 *
 * The TNO figures are 2020 euros excluding VAT, so they are indexed forward
 * with the CBS construction cost index and then have VAT added.
 */
export function dwellingCost(dwellingType, label) {
  const base = RENOVATION_COST_EUR_EXCL_VAT[dwellingType]?.[label]
  return base === undefined ? null : base * COST_INFLATION_FACTOR * (1 + VAT_RATE)
}

/**
 * Average cost per eligible dwelling in a buurt.
 *
 * Mixed twice: across dwelling type by pct_apartment and pct_house, and across
 * starting label by how the buurt's D-G stock splits between D, E, F and G.
 * TNO publishes averages per dwelling category, so there is no floor-area term.
 */
export function buurtCost(b) {
  if (b.pctApartment === null || b.pctHouse === null) return null
  const defgTotal = DEFG.reduce((s, L) => s + (b[`pct${L}`] ?? 0), 0)
  if (!defgTotal) return null

  let cost = 0
  for (const L of DEFG) {
    const share = (b[`pct${L}`] ?? 0) / defgTotal
    if (!share) continue
    const apt = dwellingCost('apartment', L)
    const house = dwellingCost('house', L)
    cost += share * ((b.pctApartment / 100) * apt + (b.pctHouse / 100) * house)
  }
  return cost
}

/* ---------------------------------------------------------------------------
 * Preparing the modelled set
 * ------------------------------------------------------------------------- */

/**
 * Attaches cost and CO2 to every buurt and marks which ones the lab can model.
 *
 * A buurt is modelled when it has energy data, an eligible-dwelling estimate
 * above zero, and the dwelling-type split the cost mix needs. Gaps are carried
 * as nulls and counted, never imputed: an imputed value would be
 * indistinguishable from a measured one once it reached the map.
 */
export function prepareBuurten(buurten, savings) {
  const prepared = buurten.map((b) => {
    const co2 = buurtCo2(b, savings)
    const cost = buurtCost(b)
    const modelled =
      b.hasEnergyData &&
      (b.eligibleDwellings ?? 0) > 0 &&
      cost !== null

    return {
      ...b,
      cost,
      co2Efg: co2?.efg ?? null,
      co2D: co2?.d ?? null,
      co2Mixed: co2?.mixed ?? null,
      gasGEquiv: co2?.gasGEquiv ?? null,
      modelled,
      /** Flags surfaced in the interface rather than silently absorbed. */
      missingCo2: modelled && (co2?.efg ?? null) === null,
      missingIncome: modelled && b.pctLowIncome130 === null,
      missingWoz: modelled && b.wozAvgEur === null,
    }
  })

  const modelled = prepared.filter((b) => b.modelled)

  // Dwelling-weighted citywide average CO2 potential. Weighting by eligible
  // dwellings is what keeps the mean of W_n at 1.
  let num = 0
  let den = 0
  for (const b of modelled) {
    if (b.co2Efg === null) continue
    num += b.co2Efg * b.eligibleDwellings
    den += b.eligibleDwellings
  }
  const avgCo2Efg = den > 0 ? num / den : null

  return { prepared, modelled, avgCo2Efg }
}

/* ---------------------------------------------------------------------------
 * The two schemes
 * ------------------------------------------------------------------------- */

/** Whether a buurt passes the WOZ ceiling. Missing WOZ is not treated as over. */
const passesWozCap = (b, capOn) => !capOn || !b.wozAboveCap

/**
 * CO2 weight for a buurt.
 *
 *   W_n = (1 - alpha) + alpha * (co2_n / citywide average)
 *
 * A buurt with average potential gets exactly 1 at any alpha. Buurten with no
 * measured gas use get 1 as well, which neither rewards nor punishes a gap in
 * the data.
 */
export function co2Weight(b, alpha, avgCo2Efg) {
  if (!alpha) return 1
  if (b.co2Efg === null || !avgCo2Efg) return 1
  return 1 - alpha + alpha * (b.co2Efg / avgCo2Efg)
}

/**
 * Expected grant per eligible dwelling under the proposed scheme.
 *
 * The income top-up reaches the share of OWNER-OCCUPIED households at or below
 * the 130% line, so the buurt average blends that group's grant with everyone
 * else's. The buurt figure covers all tenures, and only about a quarter of
 * low-income households own their home, so it is scaled before use. The cap
 * applies per household, before blending, which is why the two cases are
 * capped separately.
 */
export function proposedGrantPerDwelling(b, params, avgCo2Efg) {
  const { baseGrant, alpha, incomeTopUp, costShareCap } = params
  if (b.cost === null) return 0
  const ceiling = costShareCap * b.cost
  const weighted = baseGrant * co2Weight(b, alpha, avgCo2Efg)

  const withTopUp = Math.min(weighted + incomeTopUp, ceiling)
  const withoutTopUp = Math.min(weighted, ceiling)

  // Missing income share means no top-up is attributed, and the buurt is
  // flagged rather than assumed to have none.
  const share = ((b.pctLowIncome130 ?? 0) / 100) * INCOME_TOPUP.ownerShareOfLowIncome
  return share * withTopUp + (1 - share) * withoutTopUp
}

/** Flat grant per eligible dwelling under the current scheme. */
export function currentGrantPerDwelling(b) {
  return passesWozCap(b, true) ? CURRENT_SCHEME.grantPerDwelling : 0
}

/* ---------------------------------------------------------------------------
 * Running a scheme across the city
 * ------------------------------------------------------------------------- */

function runScheme(modelled, perDwelling, wozCapOn, savings) {
  const rows = modelled.map((b) => {
    const eligible = passesWozCap(b, wozCapOn) ? b.eligibleDwellings : 0
    const grant = eligible > 0 ? perDwelling(b) : 0
    return {
      code: b.code,
      name: b.name,
      eligible,
      grantPerDwelling: grant,
      spend: eligible * grant,
      // CO2 counts only the dwellings the scheme actually reaches.
      co2: eligible > 0 && b.co2Mixed !== null ? eligible * b.co2Mixed : 0,
      co2Known: b.co2Mixed !== null,
      co2Efg: b.co2Efg,
      lowIncome: b.pctLowIncome130,
    }
  })

  const totalSpend = rows.reduce((s, r) => s + r.spend, 0)
  const totalCo2 = rows.reduce((s, r) => s + r.co2, 0)
  const totalDwellings = rows.reduce((s, r) => s + r.eligible, 0)

  return {
    rows,
    totalSpend,
    totalCo2: co2IsAvailable(savings) ? totalCo2 : null,
    totalDwellings,
    co2PerThousandEur:
      co2IsAvailable(savings) && totalSpend > 0 ? totalCo2 / (totalSpend / 1000) : null,
    shareToTopCo2: concentration(rows, 'co2Efg', OUTPUT_DEFS.co2ConcentrationQuantile),
    shareToTopIncome: concentration(rows, 'lowIncome', OUTPUT_DEFS.incomeConcentrationQuantile),
  }
}

/**
 * Share of total spend landing in the top `quantile` of buurten ranked by
 * `key`. Ranked by buurt count, not by dwellings, so it answers "where does
 * the money go" at the level the map is drawn.
 */
function concentration(rows, key, quantile) {
  const ranked = rows.filter((r) => r[key] !== null && r[key] !== undefined)
  if (!ranked.length) return null
  const sorted = [...ranked].sort((a, b) => b[key] - a[key])
  const cut = Math.max(1, Math.round(sorted.length * quantile))
  const top = sorted.slice(0, cut).reduce((s, r) => s + r.spend, 0)
  const all = sorted.reduce((s, r) => s + r.spend, 0)
  return all > 0 ? top / all : null
}

/**
 * Budget-neutral base grant.
 *
 * Solved rather than derived: the cost-share cap makes total spend a
 * non-linear, flattening function of B, so there is no closed form. Bisection
 * on a monotonically increasing function, to the nearest euro. If the cap
 * binds so hard that the current total is unreachable, the upper bound is
 * returned and the interface says the target could not be met.
 */
export function solveBudgetNeutralBase(modelled, params, avgCo2Efg, targetSpend, wozCapOn) {
  const spendFor = (base) =>
    runScheme(
      modelled,
      (b) => proposedGrantPerDwelling(b, { ...params, baseGrant: base }, avgCo2Efg),
      wozCapOn,
      { status: 'VERIFIED' },
    ).totalSpend

  let lo = 0
  let hi = 20000
  if (spendFor(hi) < targetSpend) return { base: hi, reached: false }

  for (let i = 0; i < 60; i += 1) {
    const mid = (lo + hi) / 2
    if (spendFor(mid) < targetSpend) lo = mid
    else hi = mid
  }
  return { base: Math.round(hi), reached: true }
}

/**
 * One full comparison. Returns both schemes plus the parameters actually used,
 * which matters when the budget-neutral toggle has rewritten the base grant.
 */
export function runComparison({ buurten, savings, params }) {
  const { prepared, modelled, avgCo2Efg } = prepareBuurten(buurten, savings)

  const current = runScheme(modelled, currentGrantPerDwelling, true, savings)

  let effectiveParams = { ...params }
  let budgetNeutral = null
  if (params.budgetNeutral) {
    const solved = solveBudgetNeutralBase(
      modelled,
      params,
      avgCo2Efg,
      current.totalSpend,
      params.wozCapOn,
    )
    effectiveParams = { ...params, baseGrant: solved.base }
    budgetNeutral = solved
  }

  const proposed = runScheme(
    modelled,
    (b) => proposedGrantPerDwelling(b, effectiveParams, avgCo2Efg),
    params.wozCapOn,
    savings,
  )

  const byCode = new Map(proposed.rows.map((r) => [r.code, r]))
  const currentByCode = new Map(current.rows.map((r) => [r.code, r]))

  return {
    prepared,
    modelled,
    avgCo2Efg,
    current,
    proposed,
    effectiveParams,
    budgetNeutral,
    grantFor: (code) => byCode.get(code) ?? null,
    currentFor: (code) => currentByCode.get(code) ?? null,
    counts: {
      total: buurten.length,
      modelled: modelled.length,
      noEnergyData: buurten.filter((b) => !b.hasEnergyData).length,
      missingCo2: modelled.filter((b) => b.missingCo2).length,
      missingIncome: modelled.filter((b) => b.missingIncome).length,
      lowGas: modelled.filter((b) => b.lowGasFlag).length,
    },
  }
}

/* ---------------------------------------------------------------------------
 * Household example
 * ------------------------------------------------------------------------- */

/**
 * One household in one buurt, under both schemes.
 *
 * Figures are before national support. ISDE is excluded from the arithmetic
 * entirely: it cannot be expressed as a share of cost without inventing one,
 * and it is identical under both schemes.
 */
export function householdExample({ buurt, dwellingType, label, lowIncome, params, avgCo2Efg }) {
  const cost = dwellingCost(dwellingType, label)
  if (cost === null) return null

  const currentGrant = buurt.wozAboveCap ? 0 : CURRENT_SCHEME.grantPerDwelling

  const ceiling = params.costShareCap * cost
  const weighted = params.baseGrant * co2Weight(buurt, params.alpha, avgCo2Efg)
  const proposedGrant = Math.min(weighted + (lowIncome ? params.incomeTopUp : 0), ceiling)

  const capBinds = weighted + (lowIncome ? params.incomeTopUp : 0) > ceiling

  return {
    cost,
    current: { grant: currentGrant, net: cost - currentGrant },
    proposed: { grant: proposedGrant, net: cost - proposedGrant, capBinds },
    wozBlocked: buurt.wozAboveCap,
  }
}
