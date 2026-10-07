import { useMemo, useState } from 'react'
import ControlsRail from '../components/ControlsRail'
import ChoroplethMap from '../components/ChoroplethMap'
import MapLegend from '../components/MapLegend'
import RingMetric from '../components/RingMetric'
import ResultRows from '../components/ResultRows'
import { InfoTip, ViewHeader } from '../components/primitives'
import { quantileBreaks } from '../lib/classify'
import { CHOROPLETH } from '../config/palette'
import { MAP_LAYERS, CO2_PENDING_LABEL } from '../config/coefficients'
import AnimatedNumber from '../components/AnimatedNumber'
import { formatEuro, formatEuroCompact, formatInt, formatNumber, formatPct, formatShare } from '../lib/format'

const FMT = { eur: formatEuro, co2: (v) => formatNumber(v, 2), pct: (v) => formatPct(v, 0) }

/**
 * The product. Controls on a slim left rail, the map taking the centre, the
 * comparison stacked down the right. One screen, no page scroll.
 */
export default function SimulatorView({ geo, result, params, onParams, co2Available, selectedCode, onSelect }) {
  const [layer, setLayer] = useState('grant')

  const byCode = useMemo(() => new Map(result.prepared.map((b) => [b.code, b])), [result.prepared])
  const layerDef = MAP_LAYERS.find((l) => l.id === layer)

  const valueFor = useMemo(() => {
    const grant = new Map(result.proposed.rows.map((r) => [r.code, r.grantPerDwelling]))
    return (code) => {
      const b = byCode.get(code)
      if (!b) return null
      if (layer === 'grant') return grant.get(code) ?? null
      if (layer === 'co2') return co2Available ? b.co2Efg : null
      if (layer === 'lowIncome') return b.pctLowIncome130
      if (layer === 'owner') return b.pctOwner
      if (layer === 'defg') return b.pctDEFG
      return null
    }
  }, [layer, byCode, result.proposed.rows, co2Available])

  const breaks = useMemo(
    () => quantileBreaks(result.modelled.map((b) => valueFor(b.code)), CHOROPLETH.length),
    [result.modelled, valueFor],
  )
  const modelledCodes = useMemo(() => new Set(result.modelled.map((b) => b.code)), [result.modelled])

  const { current, proposed } = result

  return (
    <div className="flex min-h-screen flex-col md:h-full md:min-h-0">
      <ViewHeader
        title="Simulator"
        lead="Change how the grant is designed and watch where the money lands."
        right={
          <div className="flex min-w-max items-center gap-4 md:gap-5">
            {MAP_LAYERS.map((l) => (
              <button
                key={l.id}
                onClick={() => setLayer(l.id)}
                className={`relative pb-1 text-[10px] font-medium uppercase tracking-[0.1em] transition-colors ${layer === l.id ? 'text-ink' : 'text-ink-4 hover:text-ink-2'}`}
              >
                {l.label}
                {layer === l.id && <span className="absolute inset-x-0 -bottom-px h-px bg-accent" />}
              </button>
            ))}
          </div>
        }
      />

      <div className="grid grid-cols-[minmax(0,1.35fr)_minmax(0,0.85fr)] md:min-h-0 md:flex-1 md:grid-cols-[248px_minmax(0,1fr)_320px]">
        <div className="col-span-2 border-b border-line md:col-span-1 md:min-h-0 md:border-b-0 md:border-r">
          <ControlsRail
            params={params}
            onChange={onParams}
            effectiveBase={result.effectiveParams.baseGrant}
            budgetNeutral={result.budgetNeutral}
          />
        </div>

        <div className="flex min-h-[360px] min-w-0 flex-col border-r border-line md:min-h-0 md:border-r-0">
          <div className="min-h-0 flex-1 p-3">
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
          <div className="shrink-0 border-t border-line px-5 py-2.5">
            <MapLegend
              breaks={breaks}
              format={FMT[layerDef.format]}
              unit={layerDef.unit}
              lowGasCount={result.counts.lowGas}
            />
          </div>
        </div>

        <div className="flex min-w-0 flex-col px-3 py-4 md:min-h-0 md:overflow-y-auto md:border-l md:border-line md:px-5 md:py-5">
          <RingMetric
            label="Budget reaching low-income households"
            unit="of every euro"
            current={current.lowIncomeShareOfBudget}
            proposed={proposed.lowIncomeShareOfBudget}
            format={(v) => formatShare(v, 1)}
            tip={
              <InfoTip>
                The share of the budget going to owner-occupier households living on up to
                130% of the social minimum. Estimated, because income and ownership are not
                published together. Source: OIS Amsterdam, 2024.
              </InfoTip>
            }
          />

          <div className="mt-6">
            <ResultRows
              rows={[
                {
                  label: 'Where each euro lands',
                  current: current.euroWeightedCo2Kg,
                  proposed: proposed.euroWeightedCo2Kg,
                  format: (v) => `${formatNumber(v, 0)} kg`,
                  tip: 'Higher means the money is going to homes that can save more carbon.',
                },
                {
                  label: 'Total public spend',
                  current: current.totalSpend,
                  proposed: proposed.totalSpend,
                  format: formatEuroCompact,
                },
              ]}
            />
          </div>

          <p className="mt-4 text-[10.5px] leading-[1.6] text-ink-4">
            Shows what happens if every eligible home renovates. It is not a forecast of
            uptake.
          </p>

          {/* Carbon is the same under both schemes, so it is context rather than a
              comparison. Stating it once stops it reading as a result of the policy. */}
          <div className="mt-6 border-t border-line pt-4">
            <p className="label-dim">Carbon saved if every eligible home renovates</p>
            <p className="num mt-1.5 text-[30px] text-ink">
              {co2Available ? (
                <>
                  <AnimatedNumber value={proposed.totalCo2} format={(v) => formatInt(v)} />
                  <span className="ml-1.5 text-[13px] text-ink-4">t a year</span>
                </>
              ) : (
                CO2_PENDING_LABEL
              )}
            </p>
            <p className="mt-1.5 text-[10.5px] leading-[1.6] text-ink-4">
              The same in both schemes: the same homes renovate, only the money is divided
              differently.
            </p>
          </div>

          <div className="mt-auto pt-6">
            <p className="label-dim">Covering</p>
            <p className="num mt-1.5 text-[26px] text-ink">
              {formatInt(proposed.totalDwellings)}
            </p>
            <p className="mt-1 text-[10.5px] leading-[1.5] text-ink-4">
              eligible homes across {formatInt(result.counts.modelled)} neighbourhoods.
              {result.counts.noEnergyData > 0 && ` ${formatInt(result.counts.noEnergyData)} have no energy data and are left out.`}
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
