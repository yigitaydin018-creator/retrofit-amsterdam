/**
 * ENERGY POVERTY RISK: a proxy composite score, 0 to 100, per buurt.
 *
 * ---------------------------------------------------------------------------
 * WHAT THIS IS, AND WHAT IT IS NOT
 * ---------------------------------------------------------------------------
 * The conceptual basis is the official Dutch indicator, CBS/TNO Monitor
 * Energiearmoede, which treats energy poverty as the intersection of three
 * things: a low household income, a dwelling of poor energy quality (the "Lage
 * Energie Kwaliteit" threshold, which covers labels D through G rather than
 * E/F/G alone), and a high energy cost burden relative to income.
 *
 * This score is NOT that indicator. CBS has not published household income at
 * buurt level for 2025, so the income and cost-burden legs cannot be measured
 * here. What follows is a proxy built from the columns we do have, and it
 * should be read as a relative ranking of Amsterdam neighbourhoods rather than
 * as a count of households in energy poverty. The interface says so wherever
 * the score appears.
 *
 * ---------------------------------------------------------------------------
 * COMPONENTS
 * ---------------------------------------------------------------------------
 *  1. Poor energy quality:  pct_D + pct_EFG
 *     Deliberately D and worse, to follow the official Lage Energie Kwaliteit
 *     threshold. Every other view in this application still uses pct_EFG on its
 *     own; the two are not interchangeable and are never mixed.
 *
 *  2. Dwelling value:       woz_gemiddeld_x1000, inverted
 *     Standing in for the income leg. Lower average WOZ contributes more risk.
 *
 *  3. Tenure vulnerability: pct_huurwoning and pct_wcorp
 *     Standing in for structural vulnerability. Social housing in the
 *     Netherlands is means-tested, which makes it the closest thing to an
 *     income signal available in this dataset.
 *
 * ---------------------------------------------------------------------------
 * WEIGHTING, AND WHY
 * ---------------------------------------------------------------------------
 * The three components are weighted equally, at one third each. The official
 * indicator rests on three legs and we have one proxy for each, so equal
 * weights are the honest default. Anything else would be arbitrary precision
 * dressed up as method: we have no empirical basis in this dataset for saying
 * that tenure matters more than dwelling value, or the reverse.
 *
 * Two deliberate departures from the obvious implementation:
 *
 * a) PERCENTILE RANK, NOT MIN-MAX. WOZ is strongly right-skewed across
 *    Amsterdam (median around 504k, maximum around 2,286k). Under min-max a
 *    single expensive neighbourhood would compress every other buurt into a
 *    narrow band at the bottom of the scale. Percentile rank across the buurten
 *    that carry label data is robust to that, and it matches how the score is
 *    meant to be read: relative standing, not an absolute quantity.
 *
 * b) TENURE IS AVERAGED, NOT SUMMED. pct_wcorp is a subset of pct_huurwoning,
 *    verified against this dataset: pct_koopwoning + pct_huurwoning equals 100
 *    in every buurt that reports them, and pct_wcorp never exceeds
 *    pct_huurwoning. Adding the two raw would double-count social housing and
 *    produce a component that can reach 200. Instead each is percentile-ranked
 *    on its own and the two are averaged, which still lets social housing raise
 *    the score on top of rental share: a buurt that is 90% rented and 90%
 *    social ranks above one that is 90% rented and 20% social.
 *
 * ---------------------------------------------------------------------------
 * MISSING DATA
 * ---------------------------------------------------------------------------
 * 40 of the 470 buurten with label data report no WOZ value or no tenure
 * split. Those get a null score and drop out of the risk ranking rather than
 * being imputed. An imputed score would be indistinguishable from a measured
 * one in the interface, which is exactly the confusion this file is trying to
 * avoid.
 */

export const RISK_WEIGHTS = {
  energyQuality: 1 / 3,
  dwellingValue: 1 / 3,
  tenure: 1 / 3,
}

export const RISK_SOURCE =
  'Conceptual basis: CBS/TNO, Monitor Energiearmoede. Proxy composite, not the official indicator.'

/**
 * Percentile rank of each value within `values`, returned as a Map from the
 * original index to a 0..1 rank. Ties share the average of the ranks they span,
 * so a run of identical values does not create artificial ordering.
 */
function percentileRanks(values) {
  const indexed = values
    .map((v, i) => ({ v, i }))
    .filter((x) => x.v !== null && x.v !== undefined && Number.isFinite(x.v))
    .sort((a, b) => a.v - b.v)

  const ranks = new Map()
  const n = indexed.length
  if (n === 0) return ranks
  if (n === 1) {
    ranks.set(indexed[0].i, 0.5)
    return ranks
  }

  let i = 0
  while (i < n) {
    let j = i
    while (j + 1 < n && indexed[j + 1].v === indexed[i].v) j += 1
    // Average rank position across the tied run, mapped onto 0..1.
    const avg = (i + j) / 2 / (n - 1)
    for (let k = i; k <= j; k += 1) ranks.set(indexed[k].i, avg)
    i = j + 1
  }
  return ranks
}

/** Poor-energy-quality share used by this score only: label D and worse. */
export const poorQualityShare = (b) => (b.pctD ?? 0) + (b.pctEFG ?? 0)

/**
 * Attach an energyPovertyRisk field (0..100, or null) to every buurt.
 *
 * Normalisation runs across the buurten that carry label data, so the score
 * always means "relative to the rest of residential Amsterdam" and does not
 * shift when the caller filters the list for display.
 */
export function withEnergyPovertyRisk(buurten) {
  const pool = buurten.filter((b) => b.hasEnergyData)

  const qualityRank = percentileRanks(pool.map(poorQualityShare))
  // Inverted: the lowest WOZ should carry the highest risk.
  const valueRank = percentileRanks(pool.map((b) => (b.wozK == null ? null : -b.wozK)))
  const huurRank = percentileRanks(pool.map((b) => b.pctHuur ?? null))
  const wcorpRank = percentileRanks(pool.map((b) => b.pctWcorp ?? null))

  const scores = new Map()
  pool.forEach((b, i) => {
    const quality = qualityRank.get(i)
    const value = valueRank.get(i)
    const huur = huurRank.get(i)
    const wcorp = wcorpRank.get(i)

    // Every leg must be present. See the missing-data note above.
    if ([quality, value, huur, wcorp].some((x) => x === undefined)) {
      scores.set(b.code, null)
      return
    }

    const tenure = (huur + wcorp) / 2
    const composite =
      quality * RISK_WEIGHTS.energyQuality +
      value * RISK_WEIGHTS.dwellingValue +
      tenure * RISK_WEIGHTS.tenure

    scores.set(b.code, {
      score: composite * 100,
      parts: {
        energyQuality: quality * 100,
        dwellingValue: value * 100,
        tenure: tenure * 100,
      },
      poorQualityPct: poorQualityShare(b),
    })
  })

  return buurten.map((b) => {
    const s = scores.get(b.code)
    return {
      ...b,
      energyPovertyRisk: s ? s.score : null,
      energyPovertyParts: s ? s.parts : null,
      poorQualityPct: b.hasEnergyData ? poorQualityShare(b) : null,
    }
  })
}

/** Ranking by risk score, highest first. Buurten without a score are dropped. */
export function rankByRisk(buurten, { minLabelled = 0 } = {}) {
  return buurten
    .filter(
      (b) =>
        b.hasEnergyData &&
        b.energyPovertyRisk !== null &&
        (b.nWoningenLabel ?? 0) >= minLabelled,
    )
    .slice()
    .sort((a, b) => b.energyPovertyRisk - a.energyPovertyRisk)
}

/** Plain-language band for a score, used in the tooltip. */
export function riskBand(score) {
  if (score === null || score === undefined) return 'No score'
  if (score >= 75) return 'Highest quartile'
  if (score >= 50) return 'Above median'
  if (score >= 25) return 'Below median'
  return 'Lowest quartile'
}
