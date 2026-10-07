/**
 * Pure calculation layer. Every function here is a plain function of its
 * inputs, with no React and no side effects, so the model can be reasoned about and
 * tested independently of the UI. All coefficients come from
 * src/config/coefficients.js.
 */
import {
  RENOVATION_COST_EUR,
  REFERENCE_FLOOR_AREA_M2,
  PRICE_ADJUSTMENTS,
  CO2_KG_PER_M3_GAS,
  BASELINE_GAS_M3_PER_YEAR,
  GAS_PRICE_EUR_PER_M3,
  SUBSIDY,
  MIN_LABELLED_FOR_RANKING,
  TARGET_LABELS,
} from '../config/coefficients'

/**
 * Which TNO cost table applies. Defaults from the neighbourhood's dominant
 * dwelling type (pct_eengezinswoning vs pct_meergezinswoning); the user can
 * override it in the UI.
 */
export function defaultDwellingType(buurt) {
  if (!buurt) return 'apartment'
  const eengezins = buurt.pctEengezins ?? 0
  const meergezins = buurt.pctMeergezins ?? 0
  return eengezins > meergezins ? 'house' : 'apartment'
}

/**
 * Envelope cost for one dwelling, split from the installation component.
 *
 * The table value (2020 €, excl. VAT, target schillabel B) is scaled linearly
 * around the 75 m² reference dwelling. Optional inflation and VAT adjustments
 * are off by default; see PRICE_ADJUSTMENTS.
 *
 * Both target labels use the same envelope figure, because that is the only
 * envelope cost our source publishes. What separates a label-A run from a
 * label-B run is the installation allowance, which the user supplies. Returning
 * the two parts separately lets the interface show which half is sourced and
 * which half is an assumption.
 */
export function renovationCost({
  dwellingType,
  currentLabel,
  floorAreaM2,
  targetLabel = 'B',
  installationAllowance = 0,
}) {
  const base = RENOVATION_COST_EUR[dwellingType]?.[currentLabel]
  if (base === undefined) return { envelope: 0, installation: 0, total: 0 }

  let envelope = base * (floorAreaM2 / REFERENCE_FLOOR_AREA_M2)
  if (PRICE_ADJUSTMENTS.applyInflation) envelope *= PRICE_ADJUSTMENTS.inflationFactor
  if (PRICE_ADJUSTMENTS.applyVat) envelope *= 1 + PRICE_ADJUSTMENTS.vatRate

  // Only the uncosted target carries an allowance. Selecting B ignores it.
  const costed = TARGET_LABELS[targetLabel]?.costed !== false
  const installation = costed ? 0 : Math.max(0, installationAllowance)

  return { envelope, installation, total: envelope + installation }
}

/**
 * Public support, split into the assumed national ISDE baseline and the
 * municipal top-up the slider controls. Combined support is capped at
 * SUBSIDY.maxCombinedRate; the cap is absorbed by the municipal share, since
 * the national scheme is exogenous to the municipality.
 */
export function subsidyBreakdown({ totalCost, municipalRate }) {
  const nationalRate = SUBSIDY.applyNationalBaseline ? SUBSIDY.nationalBaselineRate : 0
  const uncappedCombined = nationalRate + municipalRate
  const combinedRate = Math.min(uncappedCombined, SUBSIDY.maxCombinedRate)
  const effectiveMunicipalRate = Math.max(0, combinedRate - nationalRate)

  const national = totalCost * nationalRate
  const municipal = totalCost * effectiveMunicipalRate
  return {
    nationalRate,
    municipalRate: effectiveMunicipalRate,
    combinedRate,
    national,
    municipal,
    total: national + municipal,
    capped: uncappedCombined > SUBSIDY.maxCombinedRate,
  }
}

/**
 * Capitalised value uplift from moving out of the E/F/G bracket, applied to
 * the neighbourhood's average WOZ value (which the CSV reports in €1,000s).
 * Returns null where WOZ is unavailable. Several harbour and mixed-use
 * buurten have label data but no published WOZ.
 */
export function valueIncrease({ buurt, upliftRate }) {
  if (!buurt || buurt.wozK === null || buurt.wozK === undefined) return null
  return buurt.wozK * 1000 * upliftRate
}

/**
 * Annual gas saved (m³), the euros that removes from the bill, and the CO2
 * avoided. Baseline consumption is scaled by floor area on the same 75 m²
 * reference as cost.
 */
export function energySavings({ dwellingType, floorAreaM2, savingsFraction }) {
  const baseline =
    BASELINE_GAS_M3_PER_YEAR[dwellingType] * (floorAreaM2 / REFERENCE_FLOOR_AREA_M2)
  const gasSavedM3 = baseline * savingsFraction
  return {
    baselineGasM3: baseline,
    gasSavedM3,
    euroSavedPerYear: gasSavedM3 * GAS_PRICE_EUR_PER_M3,
    co2AvoidedKg: gasSavedM3 * CO2_KG_PER_M3_GAS,
    co2AvoidedTons: (gasSavedM3 * CO2_KG_PER_M3_GAS) / 1000,
  }
}

/**
 * Simple (undiscounted) payback: net household outlay divided by the annual
 * energy-bill saving. It deliberately excludes the value uplift, which is only
 * realised on sale, so folding it into payback would flatter the result.
 * Returns null when there is no saving to pay anything back.
 */
export function paybackYears({ netCost, euroSavedPerYear }) {
  if (!euroSavedPerYear || euroSavedPerYear <= 0) return null
  if (netCost <= 0) return 0
  return netCost / euroSavedPerYear
}

/**
 * Full model run for one household under one policy setting.
 */
export function runSimulation({
  buurt,
  dwellingType,
  currentLabel,
  floorAreaM2,
  municipalRate,
  upliftRate,
  savingsFraction,
  targetLabel = 'B',
  installationAllowance = 0,
}) {
  const cost = renovationCost({
    dwellingType,
    currentLabel,
    floorAreaM2,
    targetLabel,
    installationAllowance,
  })
  const totalCost = cost.total
  const subsidy = subsidyBreakdown({ totalCost, municipalRate })
  const netCost = totalCost - subsidy.total
  const uplift = valueIncrease({ buurt, upliftRate })
  const energy = energySavings({ dwellingType, floorAreaM2, savingsFraction })
  const payback = paybackYears({ netCost, euroSavedPerYear: energy.euroSavedPerYear })

  return {
    totalCost,
    envelopeCost: cost.envelope,
    installationCost: cost.installation,
    targetLabel,
    subsidy,
    netCost,
    valueIncrease: uplift,
    // Net position once the (uncertain, sale-contingent) value uplift is
    // counted against the household's own outlay.
    netAfterValue: uplift === null ? null : uplift - netCost,
    energy,
    payback,
  }
}

/**
 * Scales one household's result to the neighbourhood's E/F/G stock, to show
 * what the same policy costs and delivers at buurt level.
 * Uses labelled dwellings as the denominator, since pctEFG is a share of them.
 */
export function scaleToBuurt({ buurt, perDwelling }) {
  if (!buurt?.hasEnergyData) return null
  const efgDwellings = Math.round((buurt.pctEFG / 100) * buurt.nWoningenLabel)
  return {
    efgDwellings,
    municipalOutlay: efgDwellings * perDwelling.subsidy.municipal,
    totalInvestment: efgDwellings * perDwelling.totalCost,
    co2AvoidedTons: efgDwellings * perDwelling.energy.co2AvoidedTons,
  }
}

/**
 * Ranking used by the neighbourhood bar chart.
 *
 * By default this drops buurten whose label share rests on too few dwellings
 * to mean anything. See MIN_LABELLED_FOR_RANKING. Pass
 * { minLabelled: 0 } for the unfiltered ranking.
 */
export function rankByEFG(buurten, { minLabelled = MIN_LABELLED_FOR_RANKING } = {}) {
  return buurten
    .filter((b) => b.hasEnergyData && (b.nWoningenLabel ?? 0) >= minLabelled)
    .slice()
    .sort((a, b) => b.pctEFG - a.pctEFG)
}
