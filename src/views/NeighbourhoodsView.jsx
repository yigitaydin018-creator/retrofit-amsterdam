import { useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { Chip, InfoTip, ViewHeader } from '../components/primitives'
import OwnerIncomeScatter from '../components/OwnerIncomeScatter'
import { householdExample } from '../lib/model'
import { formatEuro, formatInt, formatNumber, formatPct } from '../lib/format'
import { ACCENT, CURRENT } from '../config/palette'
import { CURRENT_SCHEME, NATIONAL_SUPPORT_NOTE, CO2_PENDING_LABEL } from '../config/coefficients'

const LABELS = ['D', 'E', 'F', 'G']

function Stat({ label, value, tip }) {
  return (
    <div className="hairline pt-2.5">
      <div className="flex items-center gap-1.5">
        <span className="label-dim">{label}</span>
        {tip && <InfoTip>{tip}</InfoTip>}
      </div>
      <p className="num mt-1.5 text-[21px] text-ink">{value}</p>
    </div>
  )
}

function Segmented({ options, value, onChange }) {
  return (
    <div className="flex border border-line-strong">
      {options.map((o, i) => (
        <button
          key={String(o.value)}
          onClick={() => onChange(o.value)}
          className={`px-3 py-1.5 text-[10px] font-medium uppercase tracking-[0.1em] transition-colors ${i > 0 ? 'border-l border-line-strong' : ''} ${value === o.value ? 'bg-accent text-base' : 'text-ink-3 hover:text-ink'}`}
        >
          {o.label}
        </button>
      ))}
    </div>
  )
}

/**
 * Neighbourhood view: search, detail, a worked household, and the ownership
 * against income chart. Everything here follows the same selection as the map.
 */
export default function NeighbourhoodsView({ result, selectedCode, onSelect, co2Available, layerValue }) {
  const [query, setQuery] = useState('')
  const [dwellingType, setDwellingType] = useState('apartment')
  const [label, setLabel] = useState('F')
  const [lowIncome, setLowIncome] = useState(false)

  const byCode = useMemo(() => new Map(result.prepared.map((b) => [b.code, b])), [result.prepared])
  const buurt = selectedCode ? byCode.get(selectedCode) : null

  const matches = useMemo(() => {
    const q = query.trim().toLowerCase()
    const pool = result.modelled
    if (!q) return pool.slice(0, 60)
    return pool
      .filter((b) => b.name.toLowerCase().includes(q) || (b.wijkName ?? '').toLowerCase().includes(q))
      .slice(0, 60)
  }, [query, result.modelled])

  const example = buurt
    ? householdExample({
        buurt,
        dwellingType,
        label,
        lowIncome,
        params: result.effectiveParams,
        avgCo2Efg: result.avgCo2Efg,
      })
    : null

  const row = buurt ? result.grantFor(buurt.code) : null
  const currentRow = buurt ? result.currentFor(buurt.code) : null

  return (
    <div className="flex h-full min-h-0 flex-col">
      <ViewHeader title="Neighbourhoods" lead="Search, inspect, and see what one household would pay." />

      <div className="grid min-h-0 flex-1 grid-cols-[236px_minmax(0,1fr)_minmax(0,420px)]">
        {/* search list */}
        <div className="flex min-h-0 flex-col border-r border-line">
          <div className="shrink-0 p-3">
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search neighbourhoods"
              className="w-full border border-line-strong bg-base-3 px-3 py-2 text-[12.5px] text-ink placeholder:text-ink-4 focus:border-accent focus:outline-none"
            />
          </div>
          <div className="min-h-0 flex-1 overflow-y-auto pb-3">
            {matches.map((b) => (
              <button
                key={b.code}
                onClick={() => onSelect(b.code)}
                className={`block w-full px-3 py-2 text-left transition-colors ${b.code === selectedCode ? 'bg-accent/10' : 'hover:bg-white/[0.04]'}`}
              >
                <span className={`block truncate text-[12.5px] ${b.code === selectedCode ? 'text-accent' : 'text-ink-2'}`}>
                  {b.name}
                </span>
                <span className="block truncate text-[10px] text-ink-4">{b.wijkName}</span>
              </button>
            ))}
            {!matches.length && <p className="px-3 py-5 text-[11.5px] text-ink-4">Nothing matches that.</p>}
          </div>
        </div>

        {/* detail */}
        <div className="min-h-0 overflow-y-auto overflow-x-clip px-6 py-5">
          {!buurt ? (
            <p className="text-[12.5px] text-ink-4">Pick a neighbourhood from the list or the map.</p>
          ) : (
            <motion.div key={buurt.code} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25 }}>
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <h2 className="text-[24px] font-semibold tracking-tight text-ink">{buurt.name}</h2>
                  <p className="mt-0.5 text-[11px] text-ink-4">{buurt.wijkName}</p>
                </div>
                <div className="flex shrink-0 gap-2">
                  {buurt.wozAboveCap && <Chip>above value limit</Chip>}
                  {buurt.lowGasFlag && <Chip>little gas used</Chip>}
                </div>
              </div>

              {/* Two columns, not four: the middle panel is about 390px at 1280 and a
                  four-up grid overflows it. */}
              <div className="mt-5 grid grid-cols-2 gap-x-6 gap-y-4">
                <Stat label="Homes" value={formatInt(buurt.dwellings)} />
                <Stat label="Owner-occupied" value={formatPct(buurt.pctOwner, 0)} />
                <Stat
                  label="Eligible homes"
                  value={formatInt(buurt.eligibleDwellings)}
                  tip="Owner-occupied homes with a poor energy label. Estimated, because ownership and label are not published together."
                />
                <Stat label="Average home value" value={formatEuro(buurt.wozAvgEur)} />
                <Stat
                  label="On a low income"
                  value={formatPct(buurt.pctLowIncome130, 1)}
                  tip="Share of households living on up to 130% of the social minimum. Source: OIS Amsterdam, 2024."
                />
                <Stat
                  label="Carbon saved per home"
                  value={co2Available ? `${formatNumber(buurt.co2Efg, 3)} t` : CO2_PENDING_LABEL}
                  tip="Tonnes of CO2 a year if a poorly insulated home here is brought up to label B. Source: CBS, 2024."
                />
                <Stat label="Renovation cost" value={formatEuro(buurt.cost)} tip="Typical cost of insulating a home here to label B, in 2025 prices including VAT. Source: TNO and PBL." />
                <Stat label="Poor labels" value={formatPct(buurt.pctDEFG, 1)} />
              </div>

              {row && (
                <div className="mt-6 grid grid-cols-2 gap-6 border-t border-line pt-4">
                  <div>
                    <p className="label-dim">Grant today</p>
                    <p className="num mt-1.5 text-[30px]" style={{ color: CURRENT }}>
                      {formatEuro(currentRow?.grantPerDwelling ?? 0)}
                    </p>
                  </div>
                  <div>
                    <p className="label-dim">Grant proposed</p>
                    <p className="num mt-1.5 text-[30px] font-semibold" style={{ color: ACCENT }}>
                      {formatEuro(row.grantPerDwelling)}
                    </p>
                    <p className="mt-1 text-[10px] text-ink-4">average across households here</p>
                  </div>
                </div>
              )}

              {/* household */}
              <div className="mt-7 border-t border-line pt-5">
                <p className="label mb-3">One household</p>
                <div className="flex flex-wrap gap-4">
                  <Segmented
                    options={[{ value: 'apartment', label: 'Flat' }, { value: 'house', label: 'House' }]}
                    value={dwellingType}
                    onChange={setDwellingType}
                  />
                  <Segmented options={LABELS.map((l) => ({ value: l, label: l }))} value={label} onChange={setLabel} />
                  <Segmented
                    options={[{ value: false, label: 'Any income' }, { value: true, label: 'Low income' }]}
                    value={lowIncome}
                    onChange={setLowIncome}
                  />
                </div>

                {example && (
                  <div className="mt-5">
                    <div className="grid grid-cols-[1fr_auto_auto] gap-x-8 border-b border-line-strong pb-1.5">
                      <span />
                      <span className="label-dim text-right">Today</span>
                      <span className="label-dim text-right" style={{ color: ACCENT }}>Proposed</span>
                    </div>
                    {[
                      ['Renovation cost', example.cost, example.cost],
                      ['Municipal grant', example.current.grant, example.proposed.grant],
                      ['You pay', example.current.net, example.proposed.net],
                    ].map(([l, c, p], i) => (
                      <div key={l} className="grid grid-cols-[1fr_auto_auto] gap-x-8 border-b border-line py-2">
                        <span className={`text-[12px] ${i === 2 ? 'font-semibold text-ink' : 'text-ink-3'}`}>{l}</span>
                        <span className="num text-right text-[16px]" style={{ color: CURRENT }}>{formatEuro(c)}</span>
                        <span className="num text-right text-[16px] font-semibold" style={{ color: i === 2 ? ACCENT : ACCENT }}>{formatEuro(p)}</span>
                      </div>
                    ))}
                    <p className="mt-3 text-[10.5px] leading-[1.6] text-ink-4">
                      {NATIONAL_SUPPORT_NOTE}
                      {example.wozBlocked && ` Homes here average more than ${formatEuro(CURRENT_SCHEME.wozCapEur)}, so today's scheme pays nothing.`}
                    </p>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </div>

        {/* scatter */}
        <div className="flex min-h-0 flex-col overflow-y-auto border-l border-line px-5 py-5">
          <div className="mb-2 flex items-center justify-between gap-3">
            <p className="label">Ownership and income</p>
            <Chip tone="accent">r = -0.62</Chip>
          </div>
          <p className="mb-4 text-[11.5px] leading-[1.6] text-ink-3">
            Low-income households are concentrated where few people own their home, so a
            grant for owner-occupiers reaches them least where they are most common.
          </p>
          <OwnerIncomeScatter
            buurten={result.modelled}
            selectedCode={selectedCode}
            onSelect={onSelect}
            colourFor={layerValue}
          />
        </div>
      </div>
    </div>
  )
}
