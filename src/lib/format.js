/** Display formatting. Dutch data, English UI: use en-GB grouping with € symbols. */

const eur0 = new Intl.NumberFormat('en-GB', {
  style: 'currency',
  currency: 'EUR',
  maximumFractionDigits: 0,
})
const num0 = new Intl.NumberFormat('en-GB', { maximumFractionDigits: 0 })

export const formatEuro = (v) => (v === null || v === undefined ? 'n/a' : eur0.format(v))
export const formatInt = (v) => (v === null || v === undefined ? 'n/a' : num0.format(Math.round(v)))

export const formatNumber = (v, decimals = 1) =>
  v === null || v === undefined
    ? 'n/a'
    : new Intl.NumberFormat('en-GB', {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals,
      }).format(v)

export const formatPct = (v, decimals = 1) =>
  v === null || v === undefined ? 'n/a' : `${formatNumber(v, decimals)}%`

/** Payback can legitimately be "never" (no saving) or "immediate" (fully funded). */
export const formatYears = (v) => {
  if (v === null || v === undefined) return 'n/a'
  if (v === 0) return 'immediate'
  if (v > 100) return '100+ yrs'
  return `${formatNumber(v, 1)} yrs`
}
