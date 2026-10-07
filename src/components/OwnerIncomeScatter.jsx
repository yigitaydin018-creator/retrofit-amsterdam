import {
  CartesianGrid,
  ResponsiveContainer,
  Scatter,
  ScatterChart,
  Tooltip,
  XAxis,
  YAxis,
  ZAxis,
} from 'recharts'
import { SCATTER } from '../config/palette'
import { formatInt, formatPct } from '../lib/format'

/**
 * Owner-occupied share against low-income share, one point per buurt.
 *
 * This is the relationship that decides whether a grant aimed at owner-
 * occupiers can reach low-income households at all. DATA_NOTES.md records the
 * correlation as -0.62 across 392 buurten: low-income households concentrate
 * where few people own their home.
 */
function PointTooltip({ active, payload }) {
  if (!active || !payload?.length) return null
  const d = payload[0].payload
  return (
    <div className="border border-ink/25 bg-paper px-3 py-2 shadow-[0_10px_28px_-16px_rgba(27,29,26,0.6)]">
      <p className="font-serif text-[13px] font-medium text-ink">{d.name}</p>
      <div className="mt-1.5 space-y-0.5 font-mono text-[10px] text-ink-2">
        <p>Owner-occupied {formatPct(d.x, 0)}</p>
        <p>Low income {formatPct(d.y, 1)}</p>
        <p className="text-ink-4">{formatInt(d.eligible)} eligible dwellings</p>
      </div>
    </div>
  )
}

export default function OwnerIncomeScatter({ buurten, selectedCode, onSelect }) {
  const points = buurten
    .filter((b) => b.pctOwner !== null && b.pctLowIncome130 !== null)
    .map((b) => ({
      code: b.code,
      name: b.name,
      x: b.pctOwner,
      y: b.pctLowIncome130,
      eligible: b.eligibleDwellings ?? 0,
    }))

  return (
    <div>
      <div style={{ height: 380 }}>
        <ResponsiveContainer width="100%" height="100%">
          <ScatterChart margin={{ top: 8, right: 16, bottom: 34, left: 8 }}>
            <CartesianGrid stroke={SCATTER.grid} />
            <XAxis
              type="number"
              dataKey="x"
              domain={[0, 100]}
              unit="%"
              tick={{ fill: SCATTER.axis, fontSize: 10, fontFamily: 'IBM Plex Mono' }}
              axisLine={false}
              tickLine={false}
              label={{ value: 'Owner-occupied dwellings', position: 'bottom', offset: 14, fill: SCATTER.axis, fontSize: 10.5, fontFamily: 'IBM Plex Mono' }}
            />
            <YAxis
              type="number"
              dataKey="y"
              unit="%"
              tick={{ fill: SCATTER.axis, fontSize: 10, fontFamily: 'IBM Plex Mono' }}
              axisLine={false}
              tickLine={false}
              label={{ value: 'Low-income households', angle: -90, position: 'insideLeft', offset: 14, fill: SCATTER.axis, fontSize: 10.5, fontFamily: 'IBM Plex Mono' }}
            />
            <ZAxis range={[26, 26]} />
            <Tooltip content={<PointTooltip />} cursor={{ stroke: SCATTER.grid }} />
            <Scatter
              data={points}
              fill={SCATTER.point}
              onClick={(d) => onSelect?.(d.code)}
              className="cursor-pointer"
            />
            {selectedCode && (
              <Scatter
                data={points.filter((p) => p.code === selectedCode)}
                fill={SCATTER.pointSelected}
              />
            )}
          </ScatterChart>
        </ResponsiveContainer>
      </div>
      <p className="font-mono text-[10px] text-ink-3">
        {points.length} buurten with both values. One point per buurt.
      </p>
    </div>
  )
}
