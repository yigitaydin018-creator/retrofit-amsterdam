import { useMemo, useState } from 'react'
import { SectionHeading, InfoTip, SourceNote } from '../components/primitives'
import ControlsPanel from '../components/ControlsPanel'
import ChoroplethMap from '../components/ChoroplethMap'
import MapLegend from '../components/MapLegend'
import ComparisonOutputs from '../components/ComparisonOutputs'
import BuurtDetail from '../components/BuurtDetail'
import { quantileBreaks } from '../lib/classify'
import { CHOROPLETH } from '../config/palette'
import { MAP_LAYERS, CO2_PENDING_LABEL } from '../config/coefficients'
import { formatEuro, formatInt, formatNumber, formatPct } from '../lib/format'

const FORMATTERS = {
  eur: (v) => formatEuro(v),
  co2: (v) => formatNumber(v, 2),
  pct: (v) => formatPct(v, 0),
}

/**
 * The lab. Controls on the left, map in the middle, comparison underneath.
 *
 * The map is the centre of the page: it is where a layer change and a
 * parameter change both become visible, and it is how a buurt is selected for
 * the detail panel below.
 */
export default function PolicyLab({
  geo,
  result,
  params,
  onParams,
  savings,
  co2Available,
  selectedCode,
  onSelect,
}) {
  // Layer is local to the map; the selected buurt is lifted to App so the
  // scatter in the next section highlights the same one.
  const [layer, setLayer] = useState('grant')

  const byCode = useMemo(
    () => new Map(result.prepared.map((b) => [b.code, b])),
    [result.prepared],
  )

  const layerDef = MAP_LAYERS.find((l) => l.id === layer)

  const valueFor = useMemo(() => {
    const grant = new Map(result.proposed.rows.map((r) => [r.code, r.grantPerDwelling]))
    return (code) => {
      const b = byCode.get(code)
      if (!b) return null
      switch (layer) {
        case 'grant':
          return grant.get(code) ?? null
        case 'co2':
          return co2Available ? b.co2Efg : null
        case 'lowIncome':
          return b.pctLowIncome130
        case 'owner':
          return b.pctOwner
        case 'defg':
          return b.pctDEFG
        default:
          return null
      }
    }
  }, [layer, byCode, result.proposed.rows, co2Available])

  const breaks = useMemo(() => {
    const vals = result.modelled.map((b) => valueFor(b.code))
    return quantileBreaks(vals, CHOROPLETH.length)
  }, [result.modelled, valueFor])

  const modelledCodes = useMemo(
    () => new Set(result.modelled.map((b) => b.code)),
    [result.modelled],
  )

  const selected = selectedCode ? byCode.get(selectedCode) : null

  return (
    <section id="lab" className="mx-auto max-w-[1280px] px-5 py-14 sm:px-8">
      <SectionHeading
        eyebrow="Section 02"
        title="Policy lab"
        lead="Change how the grant is designed and watch where the money lands. The current flat grant is held fixed as the baseline in every output."
      />

      <div className="mt-8 grid gap-8 lg:grid-cols-[300px_minmax(0,1fr)]">
        <div className="min-w-0 lg:sticky lg:top-20 lg:self-start">
          <ControlsPanel
            params={params}
            onChange={onParams}
            effectiveBase={result.effectiveParams.baseGrant}
            budgetNeutral={result.budgetNeutral}
          />
        </div>

        <div className="min-w-0 space-y-8">
          {/* Layer switch */}
          <div className="flex flex-wrap items-center gap-x-5 gap-y-2 border-y border-ink/15 py-2">
            <span className="label-mono">Map layer</span>
            {MAP_LAYERS.map((l) => (
              <button
                key={l.id}
                onClick={() => setLayer(l.id)}
                className={`relative pb-1 font-mono text-[10px] uppercase tracking-[0.07em] transition-colors ${layer === l.id ? 'text-ink' : 'text-ink-4 hover:text-ink-2'}`}
              >
                {l.label}
                {layer === l.id && <span className="absolute inset-x-0 -bottom-px h-px bg-ink" />}
              </button>
            ))}
          </div>

          <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_200px]">
            <div className="plate p-3">
              <ChoroplethMap
                geo={geo}
                name={(c) => byCode.get(c)?.name ?? c}
                valueFor={valueFor}
                breaks={breaks}
                selectedCode={selectedCode}
                onSelect={onSelect}
                isModelled={(c) => modelledCodes.has(c)}
                isLowGas={(c) => byCode.get(c)?.lowGasFlag ?? false}
              />
            </div>

            <div className="space-y-5">
              <div>
                <div className="mb-2 flex items-center gap-1.5">
                  <h3 className="label-mono">{layerDef.label}</h3>
                  {layer === 'co2' && (
                    <InfoTip>
                      {savings.labelGroupsNote} {savings.caveat}
                    </InfoTip>
                  )}
                  {layer === 'grant' && (
                    <InfoTip>
                      Buurt average across households, since only part of a buurt receives
                      the income top-up.
                    </InfoTip>
                  )}
                </div>
                <MapLegend
                  breaks={breaks}
                  format={FORMATTERS[layerDef.format]}
                  unit={layerDef.unit}
                  lowGasCount={result.counts.lowGas}
                />
              </div>

              <div className="rule pt-3">
                <p className="label-mono">Coverage</p>
                <p className="mt-2 font-mono text-[10.5px] leading-[1.7] text-ink-3">
                  {formatInt(result.counts.modelled)} of {formatInt(result.counts.total)} buurten
                  modelled. {formatInt(result.counts.noEnergyData)} have no energy data.
                  {result.counts.missingIncome > 0 && ` ${formatInt(result.counts.missingIncome)} lack an income share, so no top-up is attributed there.`}
                  {result.counts.missingCo2 > 0 && ` ${formatInt(result.counts.missingCo2)} lack measured gas use.`}
                </p>
              </div>
            </div>
          </div>

          <div>
            <ComparisonOutputs result={result} co2Available={co2Available} savings={savings} />
            {!co2Available && (
              <p className="mt-3 border-l-2 border-brick pl-3 font-mono text-[10.5px] text-brick">
                {CO2_PENDING_LABEL}: savings_config.json is not marked VERIFIED.
              </p>
            )}
          </div>

          <SourceNote className="rule pt-4">
            CO2 method: {savings.method} Source: {savings.source}
          </SourceNote>
        </div>
      </div>

      {/* Buurt detail */}
      <div id="buurt" className="mt-12">
        <SectionHeading eyebrow="Section 03" title="Buurt detail" />
        <div className="mt-6">
          <BuurtDetail buurt={selected} result={result} co2Available={co2Available} />
        </div>
      </div>
    </section>
  )
}
