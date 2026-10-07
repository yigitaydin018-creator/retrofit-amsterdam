/**
 * ============================================================================
 *  MODEL COEFFICIENTS. RetroFit Amsterdam.
 * ============================================================================
 *  Every number the simulator uses lives in this file. Each block states its
 *  source, its units, its base year, and how confident we are in it.
 *  Adjust here; nothing else in the codebase hard-codes a parameter.
 *
 *  A note on the energy indicator. This model reads the energy label
 *  distribution (pct_A ... pct_EFG) and nothing else, so the gas savings below
 *  are modelled per household from the label transition rather than observed
 *  from metered consumption.
 *
 *  The source CSV does now carry per-dwelling consumption columns
 *  (gas_m3_per_jaar, elektriciteit_kwh_per_jaar, stadsverwarming_pct,
 *  co2_kg_per_jaar_gas_indicatief), populated for 447 of the 517 buurten. They
 *  are deliberately not wired in yet. Doing so would replace the flat baselines
 *  in BASELINE_GAS_M3_PER_YEAR with observed per-neighbourhood figures and
 *  change every downstream number, which is a separate piece of work. Until
 *  then, treat the savings and CO2 outputs as modelled, not measured.
 * ============================================================================
 */

/* ---------------------------------------------------------------------------
 * 1. RENOVATION COST (insulation / "schil" measures)
 * ---------------------------------------------------------------------------
 * Source: TNO / PBL, "Bepaling Isolatiekosten Woningen, Startanalyse 2025"
 *         (February 2025), Table 3.1.
 * Scenario: "zelfstandig" (standalone / individual owner-initiated renovation,
 *           as opposed to a collective or district-wide approach).
 * Target:   schillabel B.
 * Units:    euros, 2020 price level, EXCLUDING VAT.
 *
 * These are total per-dwelling packages for a reference dwelling, NOT a
 * €/m² rate. That is why the numbers are not linear in the starting label
 * and why the house/G figure is lower than house/F (the TNO reference
 * dwellings differ in envelope area and in which measures are already
 * present). Do not "smooth" these; they are the published values.
 *
 * IMPORTANT SCOPE LIMIT: this covers insulation of the building envelope only.
 * It does NOT include a heating-system upgrade (heat pump, low-temperature
 * emitters, district-heat connection) that a genuine label-A transition would
 * additionally require in practice. Treat every cost output as an insulation
 * estimate, not a turnkey installation cost.
 */
export const RENOVATION_COST_EUR = {
  apartment: { G: 21359, F: 15951, E: 12735 }, // meergezinswoning
  house: { G: 35219, F: 36064, E: 25388 }, // eengezinswoning
}

/**
 * The TNO figures were derived from a reference dwelling assumed at 75 m².
 * When the user's floor-area slider deviates from this, cost is scaled
 * proportionally around the reference:
 *
 *     cost = table_cost * (m2_selected / 75)
 *
 * This is a linear scaling around a baseline, NOT a €/m² rate applied from
 * zero. It is a simplification: in reality envelope cost scales with facade
 * and roof area, which grows more slowly than floor area, so large dwellings
 * are somewhat over-costed and small ones under-costed by this model.
 */
export const REFERENCE_FLOOR_AREA_M2 = 75

/** Bounds of the floor-area slider (m²). */
export const FLOOR_AREA_RANGE = { min: 40, max: 150, step: 5, default: 75 }

/**
 * The cost table is denominated in 2020 euros excluding VAT. Both adjustments
 * below are OPTIONAL and default to off, so headline figures stay directly
 * comparable to the published TNO table. Flip them on to show what a household
 * actually pays today.
 */
export const PRICE_ADJUSTMENTS = {
  // Dutch construction-cost inflation 2020 -> 2025 is roughly 25-30% (CBS
  // input price index, grond-, weg- en waterbouw / woningbouw). Rough figure.
  applyInflation: false,
  inflationFactor: 1.27,
  // Dutch VAT on renovation labour and materials for existing dwellings.
  applyVat: false,
  vatRate: 0.21,
}

/* ---------------------------------------------------------------------------
 * 2. HOME VALUE INCREASE from a poor label (E/F/G) to a good label (A/B/C)
 * ---------------------------------------------------------------------------
 * Source: Brounen, D. & Kok, N. (2011), "On the Economics of Energy Labels in
 *         the Housing Market", Journal of Environmental Economics and
 *         Management 62(2), 166-179. Found an average ~3.7% transaction price
 *         premium for dwellings labelled A/B/C relative to others, on Dutch
 *         data.
 *
 * We expose 4-6% as the adjustable band (default 4%), rounding the Brounen &
 * Kok estimate up slightly to reflect the range found across later Dutch
 * hedonic studies.
 *
 * CAVEAT, and do not overstate this. Aydin, Brounen & Kok (2020) and related work
 * find the label premium has WEAKENED over time as labels became near-universal
 * and less informative at the margin. The premium is also capitalised into the
 * price only if the buyer observes and prices the label. Treat the value uplift
 * as the softest number in this model.
 */
export const VALUE_UPLIFT = {
  min: 0.04,
  max: 0.06,
  default: 0.04,
  step: 0.005,
  citation: 'Brounen & Kok (2011), JEEM 62(2): ~3.7% A/B/C premium',
  caveat: 'Aydin et al. (2020): premium has weakened over time.',
}

/* ---------------------------------------------------------------------------
 * 3. CO2 EMISSION FACTOR: natural gas
 * ---------------------------------------------------------------------------
 * Source: RVO, "Nederlandse lijst Energiedragers en standaard CO2-
 *         emissiefactoren". Official Dutch government tank-to-wheel (TTW)
 *         combustion factor for natural gas. Published values range roughly
 *         1.78-1.89 kg CO2 per m³ across recent years; 1.8 is the round
 *         working figure.
 * Units:  kg CO2 per m³ of natural gas burned.
 */
export const CO2_KG_PER_M3_GAS = 1.8

/* ---------------------------------------------------------------------------
 * 4. ANNUAL GAS SAVINGS from an E/F/G -> A/B transition
 * ---------------------------------------------------------------------------
 * ROUGH ESTIMATE, FLAGGED DELIBERATELY.
 * This is NOT tied to a specific citation. It is a plausible working range
 * (40-50%, default 45%) for the reduction in space-heating gas demand after a
 * full envelope upgrade of a poorly-insulated Dutch dwelling.
 *
 * Why it is uncertain:
 *  - It has not been calibrated against the observed per-neighbourhood gas
 *    consumption now present in the source data. See the note at the top of
 *    this file.
 *  - Realised savings are systematically below engineering predictions
 *    ("prebound" / rebound effects): households in cold homes under-heat
 *    before renovation and heat more afterwards.
 *  - It ignores heating-system type, occupancy and behaviour entirely.
 * Treat CO2 and bill-savings outputs as order-of-magnitude, not forecasts.
 */
export const GAS_SAVINGS_FRACTION = {
  min: 0.4,
  max: 0.5,
  default: 0.45,
  step: 0.01,
  confidence: 'rough estimate, no single citation',
}

/**
 * Baseline annual gas use for a poorly-labelled (E/F/G) dwelling, m³/year.
 * Anchored on the Dutch average household gas consumption of roughly
 * 1,100-1,200 m³/year (CBS, recent years), uplifted for the fact that E/F/G
 * dwellings sit above average. Scaled by floor area against the 75 m²
 * reference in the same way as cost. Also a working assumption.
 */
export const BASELINE_GAS_M3_PER_YEAR = {
  apartment: 1000,
  house: 1500,
}

/**
 * Consumer gas price used to convert saved m³ into euros on the bill.
 * Dutch all-in retail rate incl. energy tax and VAT, ~€1.45/m³ (2025 order of
 * magnitude). Retail energy prices are volatile; this is an assumption, not a
 * forecast, and it drives the payback period directly.
 */
export const GAS_PRICE_EUR_PER_M3 = 1.45

/* ---------------------------------------------------------------------------
 * 5. SUBSIDY PARAMETERS
 * ---------------------------------------------------------------------------
 * The municipal top-up is modelled as a simple percentage of eligible
 * renovation cost, layered on top of the assumed national ISDE baseline.
 * Both are policy levers, not empirical estimates.
 */
export const SUBSIDY = {
  municipalRate: { min: 0, max: 0.6, step: 0.01, default: 0.25 },
  /**
   * National ISDE (Investeringssubsidie duurzame energie en energiebesparing)
   * covers roughly 30% of insulation costs for owner-occupiers meeting the
   * two-measure requirement. Included as a fixed baseline so the municipal
   * slider is read as an ADDITIONAL top-up. Set to 0 to model the municipal
   * instrument in isolation.
   */
  nationalBaselineRate: 0.3,
  applyNationalBaseline: true,
  /** Combined public support is capped at this share of total cost. */
  maxCombinedRate: 0.9,
}

/* ---------------------------------------------------------------------------
 * 6. POLICY CONTEXT (display only, not used in calculations)
 * ---------------------------------------------------------------------------
 */
export const POLICY_TARGETS = {
  gasFreeYear: 2040,
  gasFreeLabel: 'Amsterdam aardgasvrij',
  source:
    'Gemeente Amsterdam, Transitievisie Warmte: city-wide natural-gas phase-out target',
  nationalYear: 2050,
}

/** Starting labels offered in the simulator. */
export const CURRENT_LABELS = ['E', 'F', 'G']

/* ---------------------------------------------------------------------------
 * TARGET LABEL
 * ---------------------------------------------------------------------------
 * Only B is costed. The TNO/PBL table in RENOVATION_COST_EUR is published for
 * one target, schillabel B, and that is the only figure we can quote as
 * sourced.
 *
 * Label A is offered as a target because it is the realistic policy ambition,
 * but it is NOT costed from a table. Reaching a genuine label A means the same
 * envelope package plus a heating-system replacement (heat pump,
 * low-temperature emitters, or a district-heat connection), and we have no
 * published per-dwelling figure for that component. Rather than invent one, the
 * A target adds an installation allowance that the user sets themselves; it
 * defaults to zero and is labelled in the interface as an assumption rather
 * than a source.
 *
 * A+ and A++ are deliberately absent. Costing them would mean extrapolating
 * past the end of the published table, and an invented number carried through
 * to a payback period is worse than an option the interface does not offer.
 */
export const TARGET_LABELS = {
  B: {
    id: 'B',
    name: 'B',
    costed: true,
    summary: 'Envelope to schillabel B. Priced directly from the TNO/PBL table.',
  },
  A: {
    id: 'A',
    name: 'A',
    costed: false,
    summary:
      'The same envelope package plus a heating-system replacement, which has no published per-dwelling cost in our sources. Set the allowance yourself.',
  },
}

export const DEFAULT_TARGET_LABEL = 'B'

/**
 * User-set installation allowance for the label-A target, in euros.
 * Zero by default, which makes an A run cost exactly what a B run costs and
 * says so plainly. The upper bound is a slider limit, not a claim: Dutch
 * air-source heat-pump installations are commonly discussed in the 5k-20k
 * range, so the range is generous enough to cover the cases users want to try.
 */
export const INSTALLATION_ALLOWANCE = { min: 0, max: 25000, step: 500, default: 0 }

/** Rental share above which the split-incentive warning is shown. */
export const HIGH_RENTAL_THRESHOLD_PCT = 60

/* ---------------------------------------------------------------------------
 * 7. RANKING RELIABILITY THRESHOLD
 * ---------------------------------------------------------------------------
 * A share computed over a handful of dwellings is noise, not a signal. Four
 * buurten in this dataset report 100% E/F/G off one or two labelled dwellings,
 * and would otherwise dominate any ranking by percentage.
 *
 * The ranking therefore defaults to buurten with at least this many labelled
 * dwellings (405 of the 470 with label data clear the bar). Every buurt stays
 * selectable in the simulator. The threshold governs the ranking only, and the
 * UI exposes a toggle to show the unfiltered list.
 */
export const MIN_LABELLED_FOR_RANKING = 100

/* ---------------------------------------------------------------------------
 * 8. NATIONAL ENERGY POVERTY (display only, not used in calculations)
 * ---------------------------------------------------------------------------
 * Context for the Amsterdam figures. These are national counts, reported by the
 * official Dutch monitor; they are not derived from anything in this dataset
 * and nothing downstream reads them.
 */
export const NATIONAL_ENERGY_POVERTY = {
  households: 503000,
  pctHouseholds: 6,
  year: 2025,
  supportEndedYear: 2024,
  source: 'TNO/CBS, Monitor Energiearmoede, 2026.',
}
