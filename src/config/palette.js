/**
 * Chart palette, paper ground.
 *
 * Energy labels are an ORDINAL scale, so A to D run down a single-hue Delft
 * blue ramp rather than a set of unrelated categorical hues. E/F/G is drawn in
 * brick red, which is reserved: no other element in the interface uses red, so
 * red always means "the bracket the policy is aimed at".
 *
 * The A-D ramp was checked with the data-viz palette validator against the
 * paper surface #F2EFE7:
 *   lightness monotone PASS · adjacent ΔL >= 0.06 PASS ·
 *   light-end contrast 2.04:1 PASS · single hue (2° spread) PASS
 * Every label segment also carries a direct text label and a 2px gap, so
 * identity never rests on colour alone.
 */
export const CHART_SURFACE = '#f2efe7'

export const LABEL_COLORS = {
  A: '#88add3',
  B: '#5a88b7',
  C: '#33628f',
  D: '#123655',
  EFG: '#a8402c',
}

/**
 * Ranking chart. One measure, so one colour for the series.
 *
 * The selected bar is drawn in ink rather than in a fourth hue. Selection is a
 * state, not a category, and an achromatic bar among blue ones reads as
 * emphasis without implying it belongs to a different group. Both clear 3:1
 * against the paper surface.
 */
export const SERIES = {
  bar: '#5a88b7',
  barSelected: '#1b1d1a',
  grid: 'rgba(27,29,26,0.10)',
  axis: '#6d7269',
  reference: '#a8402c',
}

/**
 * Payback gauge. A status ramp from the working blue through to brick: fast
 * payback is unremarkable, a payback longer than anyone's holding period is
 * the problem case and lands on the same red as the E/F/G bracket.
 */
export const GAUGE_BANDS = [
  { max: 10, color: '#33628f', verdict: 'Pays back quickly' },
  { max: 20, color: '#5a88b7', verdict: 'Moderate' },
  { max: 35, color: '#c9755f', verdict: 'Slow' },
  { max: Infinity, color: '#a8402c', verdict: 'Longer than most owners hold' },
]
