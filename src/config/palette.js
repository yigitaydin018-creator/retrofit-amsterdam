/**
 * Colour.
 *
 * Near-black surfaces, greyscale throughout, and one luminous accent that is
 * spent only on the proposed scheme and the headline result. The comparison is
 * the whole point of the product, so it gets the only hue on screen: the
 * proposal glows, the status quo is grey. Nothing else is allowed colour, which
 * is what keeps the accent meaning something.
 *
 * The map ramp runs from a dark olive to the accent. Checked against the
 * #0b0c0e surface: lightness monotone, smallest adjacent delta L 0.119
 * (floor 0.06), dark-end contrast 2.20:1 (floor 2.0), hue spread 2.9 degrees.
 */
export const SURFACE = '#0b0c0e'

/** Proposed scheme and the headline metric. */
export const ACCENT = '#cdf75e'
export const ACCENT_DIM = '#879c46'

/** Current scheme: deliberately achromatic, it is the baseline. */
export const CURRENT = '#8d959d'

export const CHOROPLETH = ['#434e26', '#637134', '#879c46', '#aec85a', '#cdf75e']

export const MAP_STATE = {
  noData: '#1b1e22',
  noDataLabel: 'No energy data',
  stroke: 'rgba(255,255,255,0.10)',
  strokeSelected: '#ffffff',
  hatch: 'rgba(255,255,255,0.30)',
  lowGasLabel: 'Low gas use, little to save',
}

export const SCATTER = {
  grid: 'rgba(255,255,255,0.07)',
  axis: '#6b7177',
}
