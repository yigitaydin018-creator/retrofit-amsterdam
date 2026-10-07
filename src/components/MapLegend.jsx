import { CHOROPLETH, MAP_STATE } from '../config/palette'

/**
 * Legend for the active layer. Classes are quantiles, so the swatches are
 * labelled with the value at each break rather than with even intervals.
 */
export default function MapLegend({ breaks, format, unit, lowGasCount }) {
  return (
    <div className="space-y-2.5">
      <div className="flex items-stretch">
        {CHOROPLETH.map((c, i) => (
          <div key={c} className="flex-1">
            <div className="h-3" style={{ backgroundColor: c }} />
            <p className="tnum mt-1 font-mono text-[9px] text-ink-3">
              {i === 0 ? 'low' : format(breaks[i - 1])}
            </p>
          </div>
        ))}
      </div>
      <p className="font-mono text-[9.5px] text-ink-4">
        {unit} · five classes of equal buurt count
      </p>

      <div className="flex flex-wrap gap-x-5 gap-y-1.5 pt-1">
        <span className="flex items-center gap-1.5 font-mono text-[9.5px] text-ink-3">
          <span className="h-2.5 w-2.5" style={{ backgroundColor: MAP_STATE.noData }} />
          {MAP_STATE.noDataLabel}
        </span>
        {lowGasCount > 0 && (
          <span className="flex items-center gap-1.5 font-mono text-[9.5px] text-ink-3">
            <svg width="11" height="11" aria-hidden="true">
              <rect width="11" height="11" fill={CHOROPLETH[1]} />
              <path d="M0 11 L11 0 M-3 8 L8 -3 M3 14 L14 3" stroke={MAP_STATE.hatch} strokeWidth="1.2" />
            </svg>
            {MAP_STATE.lowGasLabel} ({lowGasCount})
          </span>
        )}
      </div>
    </div>
  )
}
