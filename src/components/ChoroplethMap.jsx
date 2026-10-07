import { useMemo, useState } from 'react'
import { geoMercator, geoPath } from 'd3-geo'
import { CHOROPLETH, MAP_STATE } from '../config/palette'
import { classOf } from '../lib/classify'

/**
 * Buurt choropleth, drawn from the CBS boundary file with d3-geo.
 *
 * No tile provider and no API key: the polygons are the map. Fills crossfade
 * through a CSS transition when the layer or the parameters change, so a
 * change in policy reads as the city shifting rather than redrawing.
 */
export default function ChoroplethMap({
  geo,
  name,
  valueFor,
  breaks,
  selectedCode,
  onSelect,
  isModelled,
  isLowGas,
  width = 720,
  height = 620,
}) {
  const [hover, setHover] = useState(null)

  const shapes = useMemo(() => {
    const projection = geoMercator().fitExtent(
      [
        [10, 10],
        [width - 10, height - 10],
      ],
      geo,
    )
    const path = geoPath(projection)
    return geo.features.map((f) => ({ code: f.properties.code, d: path(f) }))
  }, [geo, width, height])

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      className="h-full w-full"
      role="img"
      aria-label="Map of Amsterdam neighbourhoods"
    >
      <defs>
        <pattern id="lowgas" width="5" height="5" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
          <line x1="0" y1="0" x2="0" y2="5" stroke={MAP_STATE.hatch} strokeWidth="1.2" />
        </pattern>
        <filter id="selglow" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="3" result="b" />
          <feMerge>
            <feMergeNode in="b" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {shapes.map(({ code, d }) => {
        if (!d) return null
        const modelled = isModelled(code)
        const cls = modelled ? classOf(valueFor(code), breaks) : null
        const fill = cls === null ? MAP_STATE.noData : CHOROPLETH[cls]
        const selected = code === selectedCode
        const hovered = code === hover

        return (
          <g key={code}>
            <path
              d={d}
              data-code={code}
              role="button"
              aria-label={name(code)}
              fill={fill}
              stroke={selected ? MAP_STATE.strokeSelected : MAP_STATE.stroke}
              strokeWidth={selected ? 1.6 : 0.35}
              onClick={() => onSelect(code)}
              onMouseEnter={() => setHover(code)}
              onMouseLeave={() => setHover(null)}
              filter={selected ? 'url(#selglow)' : undefined}
              style={{
                cursor: modelled ? 'pointer' : 'default',
                opacity: hovered && !selected ? 0.75 : 1,
                transition: 'fill 420ms ease, opacity 140ms ease',
              }}
            />
            {modelled && isLowGas(code) && <path d={d} fill="url(#lowgas)" pointerEvents="none" />}
          </g>
        )
      })}
    </svg>
  )
}
