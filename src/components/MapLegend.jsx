import { CHOROPLETH, MAP_STATE } from '../config/palette'

/** Legend for the active layer. Classes hold equal numbers of neighbourhoods. */
export default function MapLegend({ breaks, format, unit, lowGasCount }) {
  return (
    <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
      <div className="flex items-end gap-0">
        {CHOROPLETH.map((c, i) => (
          <div key={c} className="w-11">
            <div className="h-[6px]" style={{ backgroundColor: c }} />
            <p className="num mt-1 text-[10px] text-ink-4">{i === 0 ? 'low' : format(breaks[i - 1])}</p>
          </div>
        ))}
        <span className="label-dim ml-2 pb-1">{unit}</span>
      </div>

      <span className="flex items-center gap-1.5 text-[10px] text-ink-4">
        <span className="h-2.5 w-2.5" style={{ backgroundColor: MAP_STATE.noData }} />
        {MAP_STATE.noDataLabel}
      </span>
      {lowGasCount > 0 && (
        <span className="flex items-center gap-1.5 text-[10px] text-ink-4">
          <svg width="10" height="10" aria-hidden="true">
            <rect width="10" height="10" fill={CHOROPLETH[1]} />
            <path d="M0 10 L10 0 M-3 7 L7 -3 M3 13 L13 3" stroke={MAP_STATE.hatch} strokeWidth="1.1" />
          </svg>
          {MAP_STATE.lowGasLabel}
        </span>
      )}
    </div>
  )
}
