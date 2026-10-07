import AnimatedNumber from './AnimatedNumber'
import { InfoTip } from './primitives'
import { SCHEME } from '../config/palette'
import { formatEuroCompact, formatNumber, formatShare } from '../lib/format'
import { OUTPUT_DEFS, CO2_PENDING_LABEL } from '../config/coefficients'

/**
 * The four outputs, current against proposed.
 *
 * Laid out as a comparison table rather than as cards: the question is always
 * "how does this differ from the flat grant", and a table puts the two numbers
 * on the same line where they can be read against each other.
 */
function Row({ label, tip, current, proposed, better }) {
  return (
    <div className="rule grid grid-cols-[1fr_auto_auto] items-baseline gap-x-6 py-3 sm:gap-x-10">
      <div className="min-w-0">
        <div className="flex items-start gap-1.5">
          <p className="text-[12.5px] leading-snug text-ink-2">{label}</p>
          {tip && <InfoTip>{tip}</InfoTip>}
        </div>
      </div>
      <p className="tnum font-serif text-right text-[20px] leading-none" style={{ color: SCHEME.current }}>
        {current}
      </p>
      <p
        className="tnum font-serif text-right text-[20px] leading-none"
        style={{ color: better ? SCHEME.proposed : SCHEME.current }}
      >
        {proposed}
      </p>
    </div>
  )
}

export default function ComparisonOutputs({ result, co2Available, savings }) {
  const { current, proposed } = result

  const co2Cell = (v) =>
    co2Available ? <AnimatedNumber value={v} format={(x) => formatNumber(x, 2)} /> : CO2_PENDING_LABEL

  return (
    <div>
      <div className="grid grid-cols-[1fr_auto_auto] gap-x-6 border-b-2 border-ink pb-2 sm:gap-x-10">
        <span className="label-mono">Outcome</span>
        <span className="label-mono text-right">Current</span>
        <span className="label-mono text-right" style={{ color: SCHEME.proposed }}>
          Proposed
        </span>
      </div>

      <Row
        label="Total potential public spend"
        tip={`${OUTPUT_DEFS.spendCaption}. Uptake is not modelled: no reliable Amsterdam figure for behavioural response exists.`}
        current={<AnimatedNumber value={current.totalSpend} format={formatEuroCompact} />}
        proposed={<AnimatedNumber value={proposed.totalSpend} format={formatEuroCompact} />}
        better
      />
      <Row
        label="Tonnes CO2 per year per €1,000 of public money"
        tip={
          co2Available
            ? `${savings.labelGroupsNote} ${savings.caveat}`
            : 'Withheld because the savings configuration is not marked VERIFIED.'
        }
        current={co2Cell(current.co2PerThousandEur)}
        proposed={co2Cell(proposed.co2PerThousandEur)}
        better={co2Available && proposed.co2PerThousandEur > current.co2PerThousandEur}
      />
      <Row
        label={`Share of budget to the top ${Math.round(OUTPUT_DEFS.co2ConcentrationQuantile * 100)}% of buurten by CO2 potential`}
        tip="Buurten ranked by CO2 potential per dwelling, counted by buurt rather than by dwelling, which is the level the map is drawn at."
        current={<AnimatedNumber value={current.shareToTopCo2} format={(v) => formatShare(v, 1)} />}
        proposed={<AnimatedNumber value={proposed.shareToTopCo2} format={(v) => formatShare(v, 1)} />}
        better={proposed.shareToTopCo2 > current.shareToTopCo2}
      />
      <Row
        label="Share of budget to the top third of buurten by low-income households"
        tip="Ranked on pct_hh_lowincome130_2024, households at or below 130% of the social minimum."
        current={<AnimatedNumber value={current.shareToTopIncome} format={(v) => formatShare(v, 1)} />}
        proposed={<AnimatedNumber value={proposed.shareToTopIncome} format={(v) => formatShare(v, 1)} />}
        better={proposed.shareToTopIncome > current.shareToTopIncome}
      />

      <p className="mt-4 font-mono text-[10.5px] leading-[1.6] text-ink-3">
        {OUTPUT_DEFS.spendCaption}. Both columns cover the same{' '}
        {formatNumber(proposed.totalDwellings, 0)} eligible dwellings where the scheme
        reaches them.
      </p>
    </div>
  )
}
