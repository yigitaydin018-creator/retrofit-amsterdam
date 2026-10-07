/**
 * ============================================================================
 *  POLICY LAB COEFFICIENTS
 * ============================================================================
 *  Every fixed number the simulation uses lives here, each with the source it
 *  came from and a status: Sourced, Derived, Assumption or Policy choice.
 *  Nothing outside this file hard-codes a coefficient, and the "Data and
 *  sources" section is generated from the SOURCES registry at the bottom, so a
 *  coefficient that is added here appears there automatically.
 *
 *  All of it traces to data/DATA_NOTES.md. Numbers that are not in the source
 *  files are not in this file either.
 * ============================================================================
 */

/* ---------------------------------------------------------------------------
 * 1. RENOVATION COST TO SCHILLABEL B
 * ---------------------------------------------------------------------------
 * TNO/PBL, Bepaling Isolatiekosten Woningen, Startanalyse 2025, Table 3.1,
 * "zelfstandig" scenario. 2020 euros, excluding VAT.
 *
 * These are averages per dwelling category, not per square metre. Floor area
 * is deliberately absent from this model: scaling these figures by m2 would
 * invent a precision the source does not have.
 */
export const RENOVATION_COST_EUR_EXCL_VAT = {
  apartment: { G: 21359, F: 15951, E: 12735, D: 9945 },
  house: { G: 35219, F: 36064, E: 25388, D: 21695 },
}

/**
 * Average VAT on the packages above: 9% on labour, 21% on material, assumed a
 * 50/50 split, so roughly 15%. From the same TNO report.
 */
export const VAT_RATE = 0.15

/** Stated wherever a cost appears. We have no sourced index to inflate with. */
export const PRICE_LEVEL_NOTE = '2020 euros, not indexed to 2026'

/* ---------------------------------------------------------------------------
 * 2. CO2
 * ---------------------------------------------------------------------------
 * The factors themselves are NOT here. They are read from
 * data/savings_config.json at build time and travel with the dataset, so they
 * can be changed without touching code. See src/lib/co2.js for the method and
 * DATA_NOTES.md section "CO2 calculation" for the formula.
 *
 * If that file's status is ever not VERIFIED, every CO2 output reads
 * "pending verified source" instead of a number.
 */
export const CO2_REQUIRED_STATUS = 'VERIFIED'
export const CO2_PENDING_LABEL = 'pending verified source'

/* ---------------------------------------------------------------------------
 * 3. CURRENT SCHEME (the baseline being compared against)
 * ---------------------------------------------------------------------------
 * Gemeente Amsterdam, Extra Isolatiesubsidie. A flat grant per dwelling, with
 * a label condition and a WOZ ceiling.
 */
export const CURRENT_SCHEME = {
  grantPerDwelling: 2500,
  eligibleLabels: ['D', 'E', 'F', 'G'],
  wozCapEur: 666000,
  wozCapYear: 2024,
}

/* ---------------------------------------------------------------------------
 * 4. ISDE
 * ---------------------------------------------------------------------------
 * RVO sets ISDE as a fixed amount per square metre per measure, doubling for
 * two or more measures within 24 months. It is not expressed as a share of
 * cost. Secondary sources summarise the multi-measure case as roughly 30%, and
 * that approximation is what is used here.
 *
 * It is identical under both schemes, so it cancels out of the comparison. It
 * matters only in the household example, where it arrives after the work and
 * therefore has to be pre-financed.
 */
export const ISDE = {
  shareOfCost: 0.3,
  status: 'Approximation',
  paidAfterWork: true,
}

/* ---------------------------------------------------------------------------
 * 5. PROPOSED SCHEME: DEFAULTS AND RANGES
 * ---------------------------------------------------------------------------
 * These are levers, not findings. Each one is a policy choice the municipality
 * would make, and the interface labels them that way.
 *
 *   grant = min(B * W_n + T_h, s * cost)
 *
 *   B    base grant
 *   W_n  CO2 weight for buurt n, see WEIGHTING below
 *   T_h  income top-up, paid to households at or below the 130% line
 *   s    cap on the public share of the cost
 */
export const PROPOSED_DEFAULTS = {
  baseGrantEur: { min: 0, max: 6000, step: 100, default: 2500 },
  /**
   * alpha moves the weight from flat to fully CO2-proportional.
   * 0 reproduces a flat grant, 1 makes the grant proportional to CO2 potential.
   */
  alpha: { min: 0, max: 1, step: 0.05, default: 0.5 },
  incomeTopUpEur: { min: 0, max: 5000, step: 100, default: 2500 },
  /** Cap on the public share of the total cost. */
  costShareCap: { min: 0.1, max: 1, step: 0.05, default: 0.5 },
}

/**
 * The CO2 weight.
 *
 *   W_n = (1 - alpha) + alpha * (co2_n / co2_citywide_average)
 *
 * The average is weighted by eligible dwellings, which is what keeps the mean
 * weight at 1: a buurt with average CO2 potential receives exactly the base
 * grant at any alpha. W_n uses the E/F/G-to-B figure, so the weight describes
 * the buurt's potential rather than the particular dwelling applying.
 */
export const WEIGHTING = {
  referenceLabelGroup: 'E/F/G',
  averageWeight: 1,
}

/**
 * The income top-up follows the 130% of social minimum line, which is the same
 * definition as pct_hh_lowincome130_2024 in the dataset and the line Amsterdam
 * already uses for its poverty schemes. Map and policy therefore agree.
 *
 * The Nationaal Warmtefonds 60,000 euro rule is deliberately not used: it is
 * gross verzamelinkomen and cannot be compared with the BBGA disposable income
 * basis.
 */
export const INCOME_TOPUP = {
  thresholdLabel: '130% of the social minimum',
  basisColumn: 'pct_hh_lowincome130_2024',
  /**
   * Buurt-level cost of the top-up is an UPPER BOUND. The share applies to all
   * households, while the grant reaches owner-occupiers, who are less likely
   * to be on low incomes. No buurt-level cross-tab of tenure by income exists.
   */
  costIsUpperBound: true,
}

/* ---------------------------------------------------------------------------
 * 6. OUTPUT DEFINITIONS
 * ---------------------------------------------------------------------------
 */
export const OUTPUT_DEFS = {
  /** Top fifth of buurten by CO2 potential per dwelling. */
  co2ConcentrationQuantile: 0.2,
  /** Top third of buurten by share of low-income households. */
  incomeConcentrationQuantile: 1 / 3,
  spendCaption: 'if every eligible home renovated, not a forecast',
}

/* ---------------------------------------------------------------------------
 * 7. MAP LAYERS
 * ---------------------------------------------------------------------------
 */
export const MAP_LAYERS = [
  { id: 'grant', label: 'Grant per eligible dwelling', unit: 'EUR', format: 'eur' },
  { id: 'co2', label: 'CO2 potential per dwelling', unit: 't/yr', format: 'co2' },
  { id: 'lowIncome', label: 'Low-income households', unit: '%', format: 'pct' },
  { id: 'owner', label: 'Owner-occupied', unit: '%', format: 'pct' },
  { id: 'defg', label: 'Labels D to G', unit: '%', format: 'pct' },
]

/* ---------------------------------------------------------------------------
 * 8. SOURCE REGISTRY
 * ---------------------------------------------------------------------------
 * Drives the "Data and sources" section. Each entry names what it covers, the
 * source, and the status from DATA_NOTES.md. No narrative.
 */
export const SOURCES = [
  {
    group: 'Datasets',
    items: [
      {
        name: 'Buurt identifiers, dwelling stock, tenure, dwelling type, WOZ',
        source: 'CBS Kerncijfers wijken en buurten 2025',
        status: 'Sourced',
      },
      {
        name: 'Average gas and electricity use per dwelling, district heating share',
        source: 'CBS table 86159NED (published 31 Aug 2026)',
        status: 'Sourced',
        note: 'District heating published for 15 buurten only, privacy suppression',
      },
      {
        name: 'Energy label shares per buurt',
        source: 'EP-Online (RVO) totaalbestand 1 Sep 2026, matched via CBS PC6-huisnummer 2025',
        status: 'Sourced',
      },
      {
        name: 'Household income, low-income and minima shares',
        source: 'BBGA (OIS Amsterdam): IHHINK_MED, ILAAGHH130_P, IMINHH130_P, IINKQ1_P, IINKQ5_P',
        status: 'Sourced',
      },
      {
        name: 'Buurt boundaries, 517 polygons, WGS84',
        source: 'CBS Wijk- en buurtkaart 2025, simplified to about 5 m',
        status: 'Sourced',
      },
    ],
  },
  {
    group: 'Derived columns',
    items: [
      { name: 'pct_DEFG', source: 'pct_D + pct_E + pct_F + pct_G', status: 'Derived' },
      {
        name: 'est_owner_DEFG_dwellings',
        source: 'dwellings x pct_owner x pct_DEFG',
        status: 'Assumption',
        note: 'Treats tenure and label as independent within a buurt. No buurt-level cross-tab exists',
      },
      {
        name: 'woz_avg_above_cap',
        source: 'buurt average WOZ above 666,000 euro',
        status: 'Derived',
        note: 'Proxy for the current scheme cap. Individual homes can sit either side',
      },
      {
        name: 'low_gas_flag',
        source: 'gas_m3_avg below 150 m3',
        status: 'Derived',
        note: 'Likely district heating or all-electric, so gas-based CO2 potential is near zero',
      },
    ],
  },
  {
    group: 'Coefficients',
    items: [
      {
        name: 'Renovation cost to schillabel B, apartment and house, by label',
        source: 'TNO/PBL, Bepaling Isolatiekosten Woningen, Startanalyse 2025, Table 3.1',
        status: 'Sourced',
        note: `${PRICE_LEVEL_NOTE}. Averages per dwelling category, not per m2`,
      },
      {
        name: `VAT on renovation cost, ${Math.round(VAT_RATE * 100)}%`,
        source: 'Same TNO report: 9% labour, 21% material, 50/50 split assumed',
        status: 'Sourced',
      },
      {
        name: 'Relative gas use by label and CO2 factor',
        source: 'See data/savings_config.json, loaded at build time',
        status: 'Sourced',
        note: 'Status must read VERIFIED or CO2 outputs are withheld',
      },
      {
        name: `Current grant ${CURRENT_SCHEME.grantPerDwelling} euro, labels D to G, WOZ below ${CURRENT_SCHEME.wozCapEur} euro`,
        source: 'Gemeente Amsterdam, Extra Isolatiesubsidie',
        status: 'Sourced',
      },
      {
        name: `ISDE at ${Math.round(ISDE.shareOfCost * 100)}% of cost`,
        source: 'RVO. Expressed per m2 per measure, summarised by secondary sources',
        status: 'Approximation',
        note: 'Identical under both schemes, so it does not affect the comparison',
      },
      {
        name: 'Income threshold for the top-up, 130% of the social minimum',
        source: 'Matches BBGA ILAAGHH130_P and the line Amsterdam uses for poverty schemes',
        status: 'Policy choice',
      },
    ],
  },
  {
    group: 'Not available, not invented',
    items: [
      { name: 'Who actually received the Amsterdam grant or ISDE, per buurt', source: 'Not published', status: 'Missing' },
      { name: 'Behavioural response per extra euro of subsidy', source: 'No reliable Amsterdam figure', status: 'Missing', note: 'The lab shows potential allocation, not forecast uptake' },
      { name: 'Total budget of the current scheme', source: 'Not found', status: 'Missing', note: 'Budget is a user input' },
      { name: 'Per-household WOZ or income', source: 'Not public', status: 'Missing' },
      { name: 'Income distribution among owner-occupiers', source: 'Not available', status: 'Missing', note: 'Top-up cost is therefore an upper bound' },
      { name: 'Gas price', source: 'Not in our material', status: 'Missing', note: 'No payback output' },
    ],
  },
]
