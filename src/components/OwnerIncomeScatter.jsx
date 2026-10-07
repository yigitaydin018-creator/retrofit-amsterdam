import { CartesianGrid, Cell, ResponsiveContainer, Scatter, ScatterChart, Tooltip, XAxis, YAxis, ZAxis } from 'recharts'
import { CHOROPLETH, SCATTER } from '../config/palette'
import { classOf } from '../lib/classify'
import { formatInt, formatPct } from '../lib/format'

/**
 * Owner-occupied share against low-income share, one dot per neighbourhood.
 *
 * Dots carry the colour of whichever map layer is active, so the chart and the
 * map are read as one picture rather than two. Selecting anywhere highlights
 * the same neighbourhood everywhere.
 */
function PointTooltip({ active, payload }) {
  if (!active || !payload?.length) return null
  const d = payload[0].payload
  return (
    <div className="border border-line-strong bg-base-3 px-3 py-2">
      <p className="text-[12.5px] font-medium text-ink">{d.name}</p>
      <div className="num mt-1 space-y-0.5 text-[12px] text-ink-3">
        <p>{formatPct(d.x, 0)} own their home</p>
        <p>{formatPct(d.y, 1)} on a low income</p>
        <p className="text-ink-4">{formatInt(d.eligible)} eligible homes</p>
      </div>
    </div>
  )
}

export default function OwnerIncomeScatter({ buurten, selectedCode, onSelect, colourFor }) {
  const points = buurten
    .filter((b) => b.pctOwner !== null && b.pctLowIncome130 !== null)
    .map((b) => ({
      code: b.code,
      name: b.name,
      x: b.pctOwner,
      y: b.pctLowIncome130,
      eligible: b.eligibleDwellings ?? 0,
      v: colourFor?.value(b.code) ?? null,
    }))

  const breaks = colourFor?.breaks ?? []

  return (
    <div className="min-h-0 flex-1" style={{ minHeight: 300 }}>
      <ResponsiveContainer width="100%" height="100%">
        <ScatterChart margin={{ top: 6, right: 10, bottom: 28, left: 0 }}>
          <CartesianGrid stroke={SCATTER.grid} />
          <XAxis
            type="number"
            dataKey="x"
            domain={[0, 100]}
            unit="%"
            tick={{ fill: SCATTER.axis, fontSize: 10 }}
            axisLine={false}
            tickLine={false}
            label={{ value: 'Own their home', position: 'bottom', offset: 10, fill: SCATTER.axis, fontSize: 10 }}
          />
          <YAxis
            type="number"
            dataKey="y"
            unit="%"
            tick={{ fill: SCATTER.axis, fontSize: 10 }}
            axisLine={false}
            tickLine={false}
            width={38}
            label={{ value: 'Low income', angle: -90, position: 'insideLeft', offset: 12, fill: SCATTER.axis, fontSize: 10 }}
          />
          <ZAxis range={[24, 24]} />
          <Tooltip content={<PointTooltip />} cursor={{ stroke: SCATTER.grid }} />
          <Scatter data={points} onClick={(d) => onSelect?.(d.code)} className="cursor-pointer">
            {points.map((p) => {
              const cls = classOf(p.v, breaks)
              const selected = p.code === selectedCode
              return (
                <Cell
                  key={p.code}
                  fill={cls === null ? 'rgba(255,255,255,0.18)' : CHOROPLETH[cls]}
                  stroke={selected ? '#ffffff' : 'none'}
                  strokeWidth={selected ? 2 : 0}
                  fillOpacity={selected ? 1 : 0.75}
                />
              )
            })}
          </Scatter>
        </ScatterChart>
      </ResponsiveContainer>
    </div>
  )
}
