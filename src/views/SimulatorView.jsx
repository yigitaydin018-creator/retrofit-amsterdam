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
    <div className="flex h-full min-h-0 flex-col">
      <ViewHeader
        title="Simulator"
        lead="Change how the grant is designed and watch where the money lands."
        right={
          <div className="flex shrink-0 items-center gap-5">
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

      <div className="grid min-h-0 flex-1 grid-cols-[248px_minmax(0,1fr)_320px]">
        <div className="min-h-0 border-r border-line">
          <ControlsRail
            params={params}
            onChange={onParams}
            effectiveBase={result.effectiveParams.baseGrant}
            budgetNeutral={result.budgetNeutral}
          />
        </div>

        <div className="flex min-h-0 flex-col">
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

        <div className="flex min-h-0 flex-col overflow-y-auto border-l border-line px-5 py-5">
          <RingMetric
            label="Carbon per €1,000 spent"
            unit="tonnes a year"
            current={current.co2PerThousandEur}
            proposed={proposed.co2PerThousandEur}
            format={co2Available ? (v) => formatNumber(v, 2) : () => CO2_PENDING_LABEL}
            tip={
              <InfoTip>
                How much carbon a year the grant buys for every €1,000 of public money.
                Based on measured gas use by energy label. Source: CBS, 2024.
              </InfoTip>
            }
          />

          <div className="mt-6">
            <ResultRows
              rows={[
                {
                  label: 'Total public spend',
                  current: current.totalSpend,
                  proposed: proposed.totalSpend,
                  format: formatEuroCompact,
                },
                {
                  label: 'Share going to the highest-carbon fifth',
                  current: current.shareToTopCo2,
                  proposed: proposed.shareToTopCo2,
                  format: (v) => formatShare(v, 0),
                  tip: 'The fifth of neighbourhoods where a renovation saves the most carbon.',
                },
                {
                  label: 'Share going to the poorest third',
                  current: current.shareToTopIncome,
                  proposed: proposed.shareToTopIncome,
                  format: (v) => formatShare(v, 0),
                  tip: 'The third of neighbourhoods with the most households on low incomes. Source: OIS Amsterdam, 2024.',
                },
              ]}
            />
          </div>

          <p className="mt-4 text-[10.5px] leading-[1.6] text-ink-4">
            Shows what happens if every eligible home renovates. It is not a forecast of
            uptake.
          </p>

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
