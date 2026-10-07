import { useState } from 'react'
import { motion } from 'framer-motion'
import { InfoTip, Tag } from './primitives'
import { formatEuro, formatInt, formatNumber, formatPct } from '../lib/format'
import { householdExample } from '../lib/model'
import { CURRENT_SCHEME, ISDE, CO2_PENDING_LABEL } from '../config/coefficients'
import { SCHEME } from '../config/palette'

const LABELS = ['D', 'E', 'F', 'G']

function Stat({ label, value, hint }) {
  return (
    <div className="rule pt-2.5">
      <p className="label-mono">{label}</p>
      <p className="tnum font-serif mt-1 text-[18px] font-medium leading-none text-ink">{value}</p>
      {hint && <p className="mt-1.5 font-mono text-[9.5px] text-ink-4">{hint}</p>}
    </div>
  )
}

/**
 * One buurt, its data, and a worked household example under both schemes.
 *
 * ISDE is shown on its own line because it behaves differently from the grant:
 * it is the same under both schemes and it arrives after the work, so the
 * household carries it until then.
 */
export default function BuurtDetail({ buurt, result, co2Available }) {
  const [dwellingType, setDwellingType] = useState('apartment')
  const [label, setLabel] = useState('F')
  const [lowIncome, setLowIncome] = useState(false)

  if (!buurt) {
    return (
      <div className="plate-sunk flex min-h-[220px] items-center justify-center p-6">
        <p className="text-[12.5px] text-ink-3">Select a buurt on the map.</p>
      </div>
    )
  }

  const row = result.grantFor(buurt.code)
  const currentRow = result.currentFor(buurt.code)
  const example = householdExample({
    buurt,
    dwellingType,
    label,
    lowIncome,
    params: result.effectiveParams,
    avgCo2Efg: result.avgCo2Efg,
  })

  return (
    <motion.div
      key={buurt.code}
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
      className="plate p-6"
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="font-serif text-[24px] font-medium leading-tight tracking-tight text-ink">
            {buurt.name}
          </h3>
          <p className="mt-1 font-mono text-[10px] text-ink-3">
            {buurt.wijkName ? `${buurt.wijkName} · ` : ''}
            {buurt.code}
          </p>
        </div>
        <div className="flex shrink-0 flex-wrap gap-2">
          {buurt.wozAboveCap && <Tag tone="brick">above WOZ ceiling</Tag>}
          {buurt.lowGasFlag && <Tag>low gas use</Tag>}
          {!buurt.modelled && <Tag>not modelled</Tag>}
        </div>
      </div>

      <div className="mt-5 grid grid-cols-2 gap-x-5 gap-y-4 sm:grid-cols-4">
        <Stat label="Dwellings" value={formatInt(buurt.dwellings)} />
        <Stat label="Owner-occupied" value={formatPct(buurt.pctOwner, 0)} />
        <Stat label="Labels D to G" value={formatPct(buurt.pctDEFG, 1)} />
        <Stat label="Eligible dwellings" value={formatInt(buurt.eligibleDwellings)} hint="assumption" />
        <Stat label="Average WOZ" value={formatEuro(buurt.wozAvgEur)} />
        <Stat label="Low-income households" value={formatPct(buurt.pctLowIncome130, 1)} hint="at or below 130%" />
        <Stat
          label="CO2 potential per dwelling"
          value={co2Available ? `${formatNumber(buurt.co2Efg, 3)} t/yr` : CO2_PENDING_LABEL}
          hint="E/F/G to B"
        />
        <Stat label="Average cost per dwelling" value={formatEuro(buurt.cost)} hint="2020 euros, incl. VAT" />
      </div>

      {row && (
        <div className="mt-6 grid grid-cols-2 gap-x-6 border-t border-ink/15 pt-4">
          <div>
            <p className="label-mono">Grant per dwelling, current</p>
            <p className="tnum font-serif mt-1 text-[22px]" style={{ color: SCHEME.current }}>
              {formatEuro(currentRow?.grantPerDwelling ?? 0)}
            </p>
          </div>
          <div>
            <p className="label-mono">Grant per dwelling, proposed</p>
            <p className="tnum font-serif mt-1 text-[22px]" style={{ color: SCHEME.proposed }}>
              {formatEuro(row.grantPerDwelling)}
            </p>
            <p className="mt-1 font-mono text-[9.5px] text-ink-4">buurt average across households</p>
          </div>
        </div>
      )}

      {/* Household example */}
      <div className="mt-7 border-t border-ink/15 pt-5">
        <div className="mb-4 flex items-center gap-1.5">
          <h4 className="label-mono">Household example</h4>
          <InfoTip>
            One dwelling in this buurt. The grant uses this buurt&rsquo;s CO2 weight, so it
            is the same for every household here apart from the income top-up.
          </InfoTip>
        </div>

        <div className="flex flex-wrap gap-5">
          <div>
            <p className="label-mono mb-1.5">Dwelling</p>
            <div className="flex border border-ink/20">
              {['apartment', 'house'].map((t, i) => (
                <button
                  key={t}
                  onClick={() => setDwellingType(t)}
                  className={`px-3 py-1.5 font-mono text-[10px] uppercase tracking-[0.06em] transition-colors ${i > 0 ? 'border-l border-ink/20' : ''} ${dwellingType === t ? 'bg-ink text-paper' : 'bg-paper text-ink-3 hover:text-ink'}`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          <div>
            <p className="label-mono mb-1.5">Current label</p>
            <div className="flex border border-ink/20">
              {LABELS.map((l, i) => (
                <button
                  key={l}
                  onClick={() => setLabel(l)}
                  className={`px-3 py-1.5 font-mono text-[10px] transition-colors ${i > 0 ? 'border-l border-ink/20' : ''} ${label === l ? 'bg-ink text-paper' : 'bg-paper text-ink-3 hover:text-ink'}`}
                >
                  {l}
                </button>
              ))}
            </div>
          </div>

          <div>
            <p className="label-mono mb-1.5">Low income</p>
            <div className="flex border border-ink/20">
              {[
                { v: false, t: 'no' },
                { v: true, t: 'yes' },
              ].map((o, i) => (
                <button
                  key={o.t}
                  onClick={() => setLowIncome(o.v)}
                  className={`px-3 py-1.5 font-mono text-[10px] uppercase tracking-[0.06em] transition-colors ${i > 0 ? 'border-l border-ink/20' : ''} ${lowIncome === o.v ? 'bg-ink text-paper' : 'bg-paper text-ink-3 hover:text-ink'}`}
                >
                  {o.t}
                </button>
              ))}
            </div>
          </div>
        </div>

        {example && (
          <div className="mt-5 grid grid-cols-[1fr_auto_auto] gap-x-6 sm:gap-x-10">
            <div className="col-span-3 grid grid-cols-[1fr_auto_auto] gap-x-6 border-b border-ink/20 pb-1.5 sm:gap-x-10">
              <span className="label-mono" />
              <span className="label-mono text-right">Current</span>
              <span className="label-mono text-right" style={{ color: SCHEME.proposed }}>
                Proposed
              </span>
            </div>

            {[
              ['Renovation cost to label B', formatEuro(example.cost), formatEuro(example.cost)],
              ['Municipal grant', formatEuro(example.current.grant), formatEuro(example.proposed.grant)],
              [`ISDE, about ${Math.round(ISDE.shareOfCost * 100)}% of cost`, formatEuro(example.isde), formatEuro(example.isde)],
              ['Net household cost', formatEuro(example.current.net), formatEuro(example.proposed.net)],
            ].map(([l, c, p], i) => (
              <div key={l} className="col-span-3 grid grid-cols-[1fr_auto_auto] gap-x-6 border-b border-ink/10 py-2 sm:gap-x-10">
                <span className={`text-[12px] ${i === 3 ? 'font-medium text-ink' : 'text-ink-2'}`}>{l}</span>
                <span className="tnum text-right text-[12.5px]" style={{ color: SCHEME.current }}>{c}</span>
                <span className="tnum text-right text-[12.5px]" style={{ color: SCHEME.proposed }}>{p}</span>
              </div>
            ))}

            <p className="col-span-3 mt-3 font-mono text-[10px] leading-[1.6] text-ink-3">
              ISDE is identical under both schemes and is paid after the work, so the
              household pre-finances it.
              {example.wozBlocked && ` This buurt is above the ${formatEuro(CURRENT_SCHEME.wozCapEur)} WOZ ceiling, so the current scheme pays nothing.`}
              {example.proposed.capBinds && ' The cost-share cap is binding on the proposed grant.'}
            </p>
          </div>
        )}
      </div>
    </motion.div>
  )
}
