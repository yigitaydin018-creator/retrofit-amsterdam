/**
 * Colour for the map and charts, on the paper surface #f2efe7.
 *
 * The choropleth uses one sequential Delft blue ramp for every layer. Layers
 * are switched one at a time and the legend is relabelled with each switch, so
 * a single ramp reads as "more of whatever is selected" rather than asking the
 * reader to relearn a palette per layer.
 *
 * The ramp was checked against the paper surface: lightness monotone, smallest
 * adjacent delta L 0.083 (floor 0.06), light-end contrast 2.04:1 (floor 2.0),
 * hue spread 4.7 degrees. Steps are quantile-based, so the classes carry equal
 * numbers of buurten rather than equal value ranges.
 *
 * Two states sit outside the ramp and must never be mistaken for a low value:
 * buurten with no energy data are drawn in a flat warm grey, and low-gas
 * buurten keep their ramp colour but carry a hatch, because their CO2
 * potential is near zero for a reason the ramp cannot express.
 */
export const SURFACE = '#f2efe7'

export const CHOROPLETH = ['#88add3', '#6b93bf', '#4e79aa', '#315f8f', '#123655']

export const MAP_STATE = {
  noData: '#d8d3c6',
  noDataLabel: 'No energy data',
  stroke: 'rgba(27,29,26,0.22)',
  strokeSelected: '#1b1d1a',
  hatch: 'rgba(27,29,26,0.42)',
  lowGasLabel: 'Low gas use, CO2 potential near zero',
}

/**
 * The two schemes. Current is achromatic because it is the baseline being
 * measured against; proposed carries the working blue. Brick is reserved for
 * warnings and for nothing else.
 */
export const SCHEME = {
  current: '#6d7269',
  proposed: '#315f8f',
  brick: '#a8402c',
}

export const SCATTER = {
  point: 'rgba(49,95,143,0.55)',
  pointSelected: '#1b1d1a',
  grid: 'rgba(27,29,26,0.10)',
  axis: '#6d7269',
}
