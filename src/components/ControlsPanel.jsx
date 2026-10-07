import Slider from './Slider'
import { InfoTip, SourceNote } from './primitives'
import { formatEuro } from '../lib/format'
import { PROPOSED_DEFAULTS, CURRENT_SCHEME, INCOME_TOPUP } from '../config/coefficients'

/** A labelled on/off control. */
function Toggle({ label, checked, onChange, hint, tip }) {
  return (
    <div>
      <label className="flex cursor-pointer items-center gap-2.5">
        <input
          type="checkbox"
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
          className="h-3.5 w-3.5 accent-[#123655]"
        />
        <span className="text-[12.5px] text-ink-2">{label}</span>
        {tip && <InfoTip>{tip}</InfoTip>}
      </label>
      {hint && <p className="mt-1.5 pl-6 text-[11px] leading-[1.6] text-ink-3">{hint}</p>}
    </div>
  )
}

/**
 * The levers. Every one of these is a decision the municipality would take,
 * not a finding, and the panel says so at the top rather than on each control.
 */
export default function ControlsPanel({ params, onChange, effectiveBase, budgetNeutral }) {
  const set = (k) => (v) => onChange({ ...params, [k]: v })

  return (
    <div className="plate p-5">
      <div className="mb-4 border-b border-ink/15 pb-3">
        <h3 className="label-mono">Proposed scheme</h3>
        <p className="mt-2 text-[11px] leading-[1.6] text-ink-3">
          Every control here is a policy choice, not a finding.
        </p>
      </div>

      <div className="space-y-5">
        <div>
          <Slider
            label="Base grant"
            value={params.baseGrant}
            min={PROPOSED_DEFAULTS.baseGrantEur.min}
            max={PROPOSED_DEFAULTS.baseGrantEur.max}
            step={PROPOSED_DEFAULTS.baseGrantEur.step}
            onChange={set('baseGrant')}
            display={formatEuro(params.baseGrant)}
            hint={`B in the formula. The current scheme pays ${formatEuro(CURRENT_SCHEME.grantPerDwelling)} flat.`}
          />
          {params.budgetNeutral && (
            <p className="mt-2 border-l-2 border-ink/25 pl-3 text-[11px] leading-[1.6] text-ink-2">
              Budget-neutral mode is rescaling this to {formatEuro(effectiveBase)}.
              {budgetNeutral && !budgetNeutral.reached && ' The cost-share cap prevents the current total being matched.'}
            </p>
          )}
        </div>

        <Slider
          label="CO2 weighting (alpha)"
          value={params.alpha}
          min={PROPOSED_DEFAULTS.alpha.min}
          max={PROPOSED_DEFAULTS.alpha.max}
          step={PROPOSED_DEFAULTS.alpha.step}
          onChange={set('alpha')}
          display={params.alpha.toFixed(2)}
          hint="0 pays the same everywhere. 1 makes the grant proportional to a buurt's CO2 potential. A buurt of average potential receives the base grant at any setting."
        />

        <Slider
          label="Income top-up"
          value={params.incomeTopUp}
          min={PROPOSED_DEFAULTS.incomeTopUpEur.min}
          max={PROPOSED_DEFAULTS.incomeTopUpEur.max}
          step={PROPOSED_DEFAULTS.incomeTopUpEur.step}
          onChange={set('incomeTopUp')}
          display={formatEuro(params.incomeTopUp)}
          accent="#a8402c"
          hint={`Paid to households at or below ${INCOME_TOPUP.thresholdLabel}. Buurt cost is an upper bound: the share covers all households, while the grant reaches owner-occupiers.`}
        />

        <Slider
          label="Cap on public share of cost"
          value={Math.round(params.costShareCap * 100)}
          min={PROPOSED_DEFAULTS.costShareCap.min * 100}
          max={PROPOSED_DEFAULTS.costShareCap.max * 100}
          step={PROPOSED_DEFAULTS.costShareCap.step * 100}
          onChange={(v) => set('costShareCap')(v / 100)}
          display={`${Math.round(params.costShareCap * 100)}%`}
          hint="Policy choice. No household receives more than this share of its renovation cost."
        />

        <div className="space-y-4 border-t border-ink/15 pt-5">
          <Toggle
            label="Apply the WOZ ceiling"
            checked={params.wozCapOn}
            onChange={set('wozCapOn')}
            hint={`Excludes buurten whose average WOZ is above ${formatEuro(CURRENT_SCHEME.wozCapEur)}. The current scheme always applies it.`}
            tip="The dataset holds a buurt average, not per-home values, so this is a proxy. Individual homes inside a buurt sit either side of the line."
          />
          <Toggle
            label="Budget neutral"
            checked={params.budgetNeutral}
            onChange={set('budgetNeutral')}
            hint="Rescales the base grant so total potential spend matches the current scheme."
            tip="Solved numerically. The cost-share cap makes total spend a non-linear function of the base grant, so there is no closed form."
          />
        </div>
      </div>

      <SourceNote className="mt-5 border-t border-ink/15 pt-4">
        grant = min(B x W + T, s x cost). Costs are TNO/PBL 2020 euros including an
        assumed 15% VAT.
      </SourceNote>
    </div>
  )
}
