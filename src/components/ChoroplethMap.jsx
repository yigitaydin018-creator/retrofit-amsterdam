import { useMemo, useRef, useState } from 'react'
import { geoMercator, geoPath } from 'd3-geo'
import { CHOROPLETH, MAP_STATE } from '../config/palette'
import { classOf } from '../lib/classify'

/**
 * Buurt choropleth, drawn straight from the CBS boundary file with d3-geo.
 *
 * No tile provider and no API key: the polygons are the whole map. A Mercator
 * projection fitted to the feature collection is accurate enough at city scale
 * and keeps the shapes recognisable.
 *
 * Classes are quantiles of the values actually present in the current layer,
 * so each class holds a similar number of buurten. Equal-interval classes
 * would put almost every buurt in the lowest bin on the skewed layers.
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
  width = 640,
  height = 560,
}) {
  const [hover, setHover] = useState(null)
  const svgRef = useRef(null)

  const path = useMemo(() => {
    const projection = geoMercator().fitExtent(
      [
        [8, 8],
        [width - 8, height - 8],
      ],
      geo,
    )
    return geoPath(projection)
  }, [geo, width, height])

  const shapes = useMemo(
    () => geo.features.map((f) => ({ code: f.properties.code, d: path(f) })),
    [geo, path],
  )

  return (
    <svg
      ref={svgRef}
      viewBox={`0 0 ${width} ${height}`}
      className="w-full"
      role="img"
      aria-label="Map of Amsterdam buurten"
    >
      <defs>
        {/* Hatch for buurten whose gas use is too low for the CO2 method to
            say anything useful. */}
        <pattern id="lowgas" width="5" height="5" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
          <line x1="0" y1="0" x2="0" y2="5" stroke={MAP_STATE.hatch} strokeWidth="1.4" />
        </pattern>
      </defs>

      {shapes.map(({ code, d }) => {
        if (!d) return null
        const modelled = isModelled(code)
        const value = modelled ? valueFor(code) : null
        const cls = classOf(value, breaks)
        const fill = !modelled || cls === null ? MAP_STATE.noData : CHOROPLETH[cls]
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
              strokeWidth={selected ? 1.8 : 0.4}
              onClick={() => onSelect(code)}
              onMouseEnter={() => setHover(code)}
              onMouseLeave={() => setHover(null)}
              style={{ cursor: modelled ? 'pointer' : 'default', opacity: hovered && !selected ? 0.82 : 1 }}
            />
            {modelled && isLowGas(code) && (
              <path d={d} fill="url(#lowgas)" pointerEvents="none" />
            )}
          </g>
        )
      })}
    </svg>
  )
}
