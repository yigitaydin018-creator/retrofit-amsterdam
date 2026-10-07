/** Display formatting. Dutch data, English interface. */
const eur0 = new Intl.NumberFormat('en-GB', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 })
const num0 = new Intl.NumberFormat('en-GB', { maximumFractionDigits: 0 })

export const formatEuro = (v) => (v === null || v === undefined ? 'n/a' : eur0.format(v))
export const formatInt = (v) => (v === null || v === undefined ? 'n/a' : num0.format(Math.round(v)))

export const formatNumber = (v, d = 1) =>
  v === null || v === undefined
    ? 'n/a'
    : new Intl.NumberFormat('en-GB', { minimumFractionDigits: d, maximumFractionDigits: d }).format(v)

export const formatPct = (v, d = 1) => (v === null || v === undefined ? 'n/a' : `${formatNumber(v, d)}%`)
export const formatShare = (v, d = 0) => (v === null || v === undefined ? 'n/a' : `${formatNumber(v * 100, d)}%`)

/** Large money, compacted, for headline totals. */
export const formatEuroCompact = (v) => {
  if (v === null || v === undefined) return 'n/a'
  if (Math.abs(v) >= 1e6) return `€${formatNumber(v / 1e6, 1)}m`
  if (Math.abs(v) >= 1e3) return `€${formatNumber(v / 1e3, 0)}k`
  return formatEuro(v)
}
