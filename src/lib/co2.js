/**
 * CO2 avoided by moving a dwelling to schillabel B.
 *
 * Implements the method in DATA_NOTES.md, "CO2 calculation", using the factors
 * that build-data.mjs copied out of savings_config.json. For a buurt, with
 * f_L the relative gas use of label L against G:
 *
 *   mix         = sum over labels of (pct_L / 100) * f_L
 *   gas_G_equiv = gas_m3_avg / mix
 *   CO2(L -> B) = gas_G_equiv * (f_L - f_B) * co2_kg_per_m3 / 1000   tonnes/yr
 *
 * gas_G_equiv is what an E/F/G-level dwelling in that buurt would burn. It
 * backs the buurt's measured average gas use out of its own label mix, so two
 * buurten with the same average gas use but different label mixes do not get
 * the same potential.
 *
 * The factors are a cross-sectional comparison of dwellings that differ in
 * label, not a before-and-after measurement of renovated dwellings. The caveat
 * from savings_config.json travels with the number into the interface.
 */
import { CO2_REQUIRED_STATUS } from '../config/coefficients'

const LABELS = ['A', 'B', 'C', 'D', 'E', 'F', 'G']

/** True when the configured source is verified and CO2 may be shown. */
export const co2IsAvailable = (savings) => savings?.status === CO2_REQUIRED_STATUS

/**
 * Per-dwelling CO2 potential for one buurt, in tonnes per year.
 * Returns null when the buurt has no measured gas use or no label mix, which
 * is a real gap rather than a zero.
 */
export function buurtCo2(buurt, savings) {
  if (!co2IsAvailable(savings)) return null
  const f = savings.relativeGasUse
  const gas = buurt.gasM3Avg
  if (gas === null || gas === undefined) return null

  let mix = 0
  for (const L of LABELS) {
    const pct = buurt[`pct${L}`]
    if (pct === null || pct === undefined) return null
    mix += (pct / 100) * f[L]
  }
  if (!mix) return null

  const gasGEquiv = gas / mix
  const perTonnes = (fromFactor) =>
    (gasGEquiv * (fromFactor - f.B) * savings.co2KgPerM3Gas) / 1000

  // E, F and G share a factor in the source, so one figure covers the group.
  const efg = perTonnes(f.E)
  const d = perTonnes(f.D)

  // Potential across the whole D-G stock of this buurt, weighted by how that
  // stock splits between D and E/F/G. Used for totals; the weighting formula
  // uses the E/F/G figure on its own.
  const defg = (buurt.pctD ?? 0) + (buurt.pctE ?? 0) + (buurt.pctF ?? 0) + (buurt.pctG ?? 0)
  const mixed =
    defg > 0
      ? ((buurt.pctD ?? 0) * d + ((buurt.pctE ?? 0) + (buurt.pctF ?? 0) + (buurt.pctG ?? 0)) * efg) / defg
      : null

  return { gasGEquiv, efg, d, mixed }
}
