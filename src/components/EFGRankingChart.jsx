import { useMemo, useState } from 'react'
import {
  Bar,
  BarChart,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  ReferenceLine,
} from 'recharts'
import { SERIES } from '../config/palette'
import { formatInt, formatNumber, formatPct } from '../lib/format'
import { MIN_LABELLED_FOR_RANKING } from '../config/coefficients'
import { buildRankingWindow, axisScale } from '../lib/ranking'
import { riskBand, RISK_SOURCE } from '../lib/energyPoverty'
import { heritageAreaOf } from '../config/heritage'
import { InfoTip } from './primitives'

/**
 * Neighbourhood ranking, in two measures.
 *
 * This stands in for a choropleth until real geometry is wired in. A proper map
 * needs the CBS boundary file and is a separate job.
 *
 * MEASURES
 *  - Poor label share: pct_EFG, the share of dwellings rated E, F or G.
 *  - Energy poverty risk: the proxy composite from src/lib/energyPoverty.js,
 *    which uses D and worse rather than E/F/G. The two are not interchangeable
 *    and the caption says which is on screen.
 *
 * WINDOWING
 * 470 buurten carry label data, far too many bars to read at once, so the chart
 * shows a 24-bar window: the highest, the lowest, or the band around the
 * current selection. Ranked windows show exactly their own slice; the selection
 * is reachable through "Around selection" and a note appears when it is
 * off-window.
 *
 * HERITAGE OVERLAY
 * Protected-cityscape neighbourhoods are marked on whichever measure is active.
 * The cue is a dashed outline on the bar plus a filled square against the name,
 * never colour on its own, since colour here is already carrying the measure.
 */
const MEASURES = {
  efg: {
    id: 'efg',
    label: 'Poor label share',
    axisUnit: '%',
    title: 'Neighbourhoods by share of E/F/G dwellings',
    describe: 'Share of dwellings rated E, F or G.',
    format: (v) => formatPct(v),
  },
  risk: {
    id: 'risk',
    label: 'Energy poverty risk',
    axisUnit: '',
    title: 'Neighbourhoods by energy poverty risk score',
    describe: 'Proxy composite score from 0 to 100. Higher means more exposed.',
    format: (v) => formatNumber(v, 1),
  },
}

const VIEWS = [
  { id: 'worst', label: 'Highest' },
  { id: 'around', label: 'Around selection' },
  { id: 'best', label: 'Lowest' },
]

function ChartTooltip({ active, payload, measure }) {
  if (!active || !payload?.length) return null
  const d = payload[0].payload
  const m = MEASURES[measure]
  return (
    <div className="border border-ink/25 bg-paper px-3 py-2.5 shadow-[0_10px_28px_-16px_rgba(27,29,26,0.6)]">
      <p className="font-serif text-[14px] font-medium text-ink">{d.name}</p>
      <p className="mt-0.5 font-mono text-[9.5px] text-ink-4">
        {d.wijkName ? `${d.wijkName} · ` : ''}
        {d.code}
      </p>
      <div className="mt-2 space-y-1 font-mono text-[10.5px]">
        <p className="flex items-center justify-between gap-6">
          <span className="text-ink-3">{m.label}</span>
          <span className="tnum font-medium text-ink">{m.format(d.value)}</span>
        </p>
        {measure === 'risk' && (
          <p className="flex items-center justify-between gap-6">
            <span className="text-ink-3">Band</span>
            <span className="text-ink-2">{riskBand(d.value)}</span>
          </p>
        )}
        {measure === 'risk' && d.poorQualityPct != null && (
          <p className="flex items-center justify-between gap-6">
            <span className="text-ink-3">D and worse</span>
            <span className="tnum text-ink-2">{formatPct(d.poorQualityPct)}</span>
          </p>
        )}
        {measure === 'efg' && (
          <p className="flex items-center justify-between gap-6">
            <span className="text-ink-3">Labelled dwellings</span>
            <span className="tnum text-ink-2">{formatInt(d.nWoningenLabel)}</span>
          </p>
        )}
        <p className="flex items-center justify-between gap-6">
          <span className="text-ink-3">Rank</span>
          <span className="tnum text-ink-2">
            {d.rank} / {d.total}
          </span>
        </p>
        {d.heritage && (
          <p className="mt-1.5 border-t border-ink/15 pt-1.5 text-ink-2">
            Protected cityscape ({d.heritage})
          </p>
        )}
      </div>
    </div>
  )
}

/** Y-axis label with a heritage marker. The square is the non-colour cue. */
function NameTick({ x, y, payload, rows }) {
  const row = rows[payload.index]
  const heritage = row?.heritage
  const name = row?.name ?? payload.value
  return (
    <g transform={`translate(${x},${y})`}>
      {heritage && <rect x={-168} y={-4} width={5} height={5} fill="#1b1d1a" />}
      <text
        x={heritage ? -158 : -8}
        y={0}
        dy={4}
        textAnchor={heritage ? 'start' : 'end'}
        fill="#3f443e"
        fontSize={10.5}
        fontFamily="IBM Plex Sans"
      >
        {name.length > 26 ? `${name.slice(0, 25)}…` : name}
      </text>
    </g>
  )
}

export default function EFGRankingChart({
  rankings,
  selected,
  onSelect,
  cityAverage,
  filterSmall,
  onToggleFilterSmall,
}) {
  const [view, setView] = useState('worst')
  const [measure, setMeasure] = useState('efg')

  const source = rankings[measure][filterSmall ? 'filtered' : 'all']
  const m = MEASURES[measure]

  // Rank once over the whole city, then slice a window out of it, so a bar's
  // stated rank never depends on which window it is being viewed in.
  const withRank = useMemo(
    () =>
      source.map((b, i) => ({
        code: b.code,
        name: b.name,
        wijkName: b.wijkName,
        value: measure === 'efg' ? b.pctEFG : b.energyPovertyRisk,
        pctEFG: b.pctEFG,
        poorQualityPct: b.poorQualityPct,
        nWoningenLabel: b.nWoningenLabel,
        heritage: heritageAreaOf(b),
        rank: i + 1,
        total: source.length,
      })),
    [source, measure],
  )

  const { rows, selIdx, selectionOffscreen } = useMemo(
    () => buildRankingWindow({ ranked: withRank, view, selectedCode: selected?.code }),
    [withRank, view, selected],
  )

  // The city-average line is an E/F/G figure, so it is meaningless against a
  // risk-score axis and is only offered on that measure.
  const { showCityLine, maxVal } = axisScale({
    rows,
    cityAverage: measure === 'efg' ? cityAverage : null,
  })

  const heritageShown = rows.filter((r) => r.heritage).length

  return (
    <div>
      <div className="mb-5 flex flex-wrap items-end justify-between gap-4">
        <div className="min-w-0">
          <div className="flex items-center gap-1.5">
            <h3 className="font-serif text-[19px] font-medium leading-tight text-ink">
              {m.title}
            </h3>
            {measure === 'risk' && (
              <InfoTip>
                A proxy composite, not the official government indicator. It combines the
                share of dwellings rated D or worse, average WOZ value inverted, and rental
                and social-housing share, each percentile-ranked across Amsterdam and
                weighted equally. Household income is not in it, because CBS has not
                published income at buurt level for 2025. {RISK_SOURCE}
              </InfoTip>
            )}
          </div>
          <p className="mt-1 font-mono text-[10.5px] text-ink-3">
            {m.describe} {rows.length} of {source.length} ranked. Click a bar to select it.
          </p>
          {selectionOffscreen && (
            <p className="mt-1 font-mono text-[10.5px] text-ink-3">
              {selected.name} ranks {selIdx + 1} of {source.length} and falls outside this
              window. Switch to <span className="text-delft-800">Around selection</span> to
              see it in place.
            </p>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
          <label className="flex cursor-pointer items-center gap-2 font-mono text-[10px] uppercase tracking-[0.07em] text-ink-3 transition-colors hover:text-ink">
            <input
              type="checkbox"
              checked={filterSmall}
              onChange={(e) => onToggleFilterSmall(e.target.checked)}
              className="h-3 w-3 accent-[#123655]"
            />
            Min {MIN_LABELLED_FOR_RANKING} labelled
          </label>

          <div className="flex items-center gap-4">
            {VIEWS.map((v) => (
              <button
                key={v.id}
                onClick={() => setView(v.id)}
                className={`relative pb-1 font-mono text-[10px] uppercase tracking-[0.07em] transition-colors ${
                  view === v.id ? 'text-ink' : 'text-ink-4 hover:text-ink-2'
                }`}
              >
                {v.label}
                {view === v.id && <span className="absolute inset-x-0 -bottom-px h-px bg-ink" />}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Measure switch. Given its own row and a heavier treatment than the
          window switch above, since it changes what is being measured rather
          than which slice of it is on screen. */}
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3 border-y border-ink/15 py-2">
        <div className="flex">
          {Object.values(MEASURES).map((opt, i) => (
            <button
              key={opt.id}
              onClick={() => setMeasure(opt.id)}
              className={`border px-3 py-1.5 font-mono text-[10px] uppercase tracking-[0.07em] transition-colors ${
                i > 0 ? 'border-l-0' : ''
              } ${
                measure === opt.id
                  ? 'border-ink bg-ink text-paper'
                  : 'border-ink/20 bg-paper text-ink-3 hover:text-ink'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>

        <p className="flex items-center gap-2 font-mono text-[10px] text-ink-3">
          <span className="inline-block h-[5px] w-[5px] bg-ink" />
          protected cityscape
          {heritageShown > 0 && <span className="text-ink-4">({heritageShown} shown)</span>}
        </p>
      </div>

      <div style={{ height: Math.max(rows.length * 21 + 44, 300) }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={rows}
            layout="vertical"
            margin={{ top: 4, right: 46, bottom: 18, left: 4 }}
            barCategoryGap={2}
          >
            <XAxis
              type="number"
              domain={[0, maxVal]}
              tick={{ fill: SERIES.axis, fontSize: 10, fontFamily: 'IBM Plex Mono' }}
              axisLine={false}
              tickLine={false}
              unit={m.axisUnit}
            />
            <YAxis
              type="category"
              dataKey="name"
              width={168}
              tick={<NameTick rows={rows} />}
              axisLine={false}
              tickLine={false}
              interval={0}
            />
            <Tooltip
              content={<ChartTooltip measure={measure} />}
              cursor={{ fill: 'rgba(27,29,26,0.05)' }}
            />

            {showCityLine && (
              <ReferenceLine
                x={cityAverage}
                stroke={SERIES.reference}
                strokeDasharray="3 3"
                strokeWidth={1.2}
                label={{
                  value: `city ${cityAverage.toFixed(1)}%`,
                  position: 'top',
                  fill: SERIES.reference,
                  fontSize: 9.5,
                  fontFamily: 'IBM Plex Mono',
                }}
              />
            )}

            <Bar
              dataKey="value"
              isAnimationActive
              animationDuration={520}
              onClick={(d) => onSelect?.(d.code)}
              className="cursor-pointer"
            >
              {rows.map((r) => {
                const isSelected = r.code === selected?.code
                return (
                  <Cell
                    key={r.code}
                    fill={isSelected ? SERIES.barSelected : SERIES.bar}
                    // Dashed outline for protected areas. Drawn in paper on the
                    // ink-filled selected bar so it stays visible either way.
                    stroke={r.heritage ? (isSelected ? '#f2efe7' : '#1b1d1a') : undefined}
                    strokeWidth={r.heritage ? 1 : 0}
                    strokeDasharray={r.heritage ? '3 2' : undefined}
                  />
                )
              })}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
