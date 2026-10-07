/**
 * Quantile classification for the choropleth.
 *
 * Kept out of the map component so that file only exports a component, which
 * is what React Fast Refresh needs. Quantiles rather than equal intervals: the
 * grant and CO2 layers are skewed enough that equal intervals would drop
 * almost every buurt into the lowest class.
 */
export function quantileBreaks(values, classes) {
  const v = values
    .filter((x) => x !== null && x !== undefined && Number.isFinite(x))
    .sort((a, b) => a - b)
  if (!v.length) return []
  const breaks = []
  for (let i = 1; i < classes; i += 1) {
    breaks.push(v[Math.floor((i / classes) * v.length)])
  }
  return breaks
}

export function classOf(value, breaks) {
  if (value === null || value === undefined || !Number.isFinite(value)) return null
  let i = 0
  while (i < breaks.length && value >= breaks[i]) i += 1
  return i
}
