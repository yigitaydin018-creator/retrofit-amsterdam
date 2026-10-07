/**
 * Windowing and axis scaling for the E/F/G ranking chart.
 *
 * Pulled out of the component so the ordering rules can be exercised directly
 * against the real dataset. The bug these functions exist to prevent is
 * described in buildRankingWindow below.
 */

export const RANKING_WINDOW = 24

/**
 * Slice a readable window out of a full city ranking.
 *
 * `ranked` arrives sorted descending by the active measure, so:
 *   worst  -> the head of the list, left descending
 *   best   -> the tail, reversed, so the axis reads lowest first
 *   around -> a band centred on the selection
 *
 * A ranked window shows exactly its own top or bottom slice and nothing else.
 * An earlier version spliced the selected buurt in whenever it fell outside the
 * window, which broke the "best" view twice over: the splice re-sorted
 * descending, so a rank-1 buurt sat at the head of a list of the lowest, and its
 * value then set the axis maximum and flattened every genuinely low bar to a
 * sliver. The selection stays reachable through the "around" view instead, and
 * the caller reports when it is off-window.
 */
export function buildRankingWindow({ ranked, view, selectedCode, windowSize = RANKING_WINDOW }) {
  const selIdx = ranked.findIndex((b) => b.code === selectedCode)

  let rows
  if (view === 'best') {
    rows = ranked.slice(-windowSize).reverse()
  } else if (view === 'around' && selIdx >= 0) {
    const start = Math.max(
      0,
      Math.min(selIdx - Math.floor(windowSize / 2), ranked.length - windowSize),
    )
    rows = ranked.slice(start, start + windowSize)
  } else {
    rows = ranked.slice(0, windowSize)
  }

  return {
    rows,
    selIdx,
    selectionOffscreen: selIdx >= 0 && !rows.some((r) => r.code === selectedCode),
  }
}

/**
 * Round an axis maximum up to a readable step that follows the magnitude on
 * show. A fixed step of 5 turns the lowest view, where every bar is under 2%,
 * into a row of stubs against a 5% axis.
 */
export function niceAxisMax(v) {
  if (v <= 0) return 1
  const step = v < 2 ? 0.5 : v < 5 ? 1 : v < 20 ? 5 : 10
  return Math.ceil(v / step) * step
}

/**
 * Axis maximum for a set of rows, plus whether the reference line belongs
 * inside it. In the lowest view the city average sits far outside the data and
 * would squash every bar for nothing, so it is dropped.
 *
 * Rows are read through `key` so the same scaling serves any measure the chart
 * offers, not just the label share it was written for.
 */
export function axisScale({ rows, cityAverage, key = 'value' }) {
  const maxRow = Math.max(...rows.map((r) => r[key] ?? 0), 0)
  const showCityLine = cityAverage != null && cityAverage <= maxRow
  return {
    maxRow,
    showCityLine,
    maxVal: niceAxisMax(Math.max(maxRow, showCityLine ? cityAverage : 0)),
  }
}
