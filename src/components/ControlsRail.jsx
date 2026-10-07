import Slider from './Slider'
import { InfoTip } from './primitives'
import { formatEuro } from '../lib/format'
import { PROPOSED_DEFAULTS, CURRENT_SCHEME, INCOME_TOPUP } from '../config/coefficients'

function Toggle({ label, checked, onChange, hint, tip }) {
  return (
    <div>
      <label className="flex cursor-pointer items-center gap-2.5">
        <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} className="h-3.5 w-3.5" />
        <span className="label">{label}</span>
        {tip && <InfoTip>{tip}</InfoTip>}
      </label>
      {hint && <p className="mt-1.5 pl-6 text-[10.5px] leading-[1.5] text-ink-4">{hint}</p>}
    </div>
  )
}

/** The levers. Slim rail, one column, no cards. */
export default function ControlsRail({ params, onChange, effectiveBase, budgetNeutral }) {
  const set = (k) => (v) => onChange({ ...params, [k]: v })

  return (
    <div className="flex h-full flex-col overflow-y-auto px-5 py-5">
      <p className="label mb-5">Design the grant</p>

      <div className="space-y-6">
        <div>
          <Slider
            label="Base grant"
            value={params.baseGrant}
            min={PROPOSED_DEFAULTS.baseGrantEur.min}
            max={PROPOSED_DEFAULTS.baseGrantEur.max}
            step={PROPOSED_DEFAULTS.baseGrantEur.step}
            onChange={set('baseGrant')}
            display={formatEuro(params.baseGrant)}
            hint={`Today every eligible home gets ${formatEuro(CURRENT_SCHEME.grantPerDwelling)}, wherever it is.`}
          />
          {params.budgetNeutral && (
            <p className="mt-2 border-l border-accent pl-3 text-[10.5px] leading-[1.5] text-accent">
              Matching today&rsquo;s budget sets this to {formatEuro(effectiveBase)}.
              {budgetNeutral && !budgetNeutral.reached && ' The cost cap stops it going higher.'}
            </p>
          )}
        </div>

        <Slider
          label="Target by carbon"
          value={params.alpha}
          min={PROPOSED_DEFAULTS.alpha.min}
          max={PROPOSED_DEFAULTS.alpha.max}
          step={PROPOSED_DEFAULTS.alpha.step}
          onChange={set('alpha')}
          display={params.alpha.toFixed(2)}
          hint="At zero every neighbourhood gets the same. At one the grant follows how much carbon a home there could save."
          tip="Neighbourhoods with average savings potential always receive the base grant. Only the spread around that average changes."
        />

        <Slider
          label="Low income top-up"
          value={params.incomeTopUp}
          min={PROPOSED_DEFAULTS.incomeTopUpEur.min}
          max={PROPOSED_DEFAULTS.incomeTopUpEur.max}
          step={PROPOSED_DEFAULTS.incomeTopUpEur.step}
          onChange={set('incomeTopUp')}
          display={formatEuro(params.incomeTopUp)}
          hint={`Extra for households living on up to ${INCOME_TOPUP.thresholdLabel}.`}
          tip="Around a quarter of low-income households own their home, so only part of a neighbourhood's low-income households can claim this. Source: CBS, 2024."
        />

        <Slider
          label="Maximum public share"
          value={Math.round(params.costShareCap * 100)}
          min={PROPOSED_DEFAULTS.costShareCap.min * 100}
          max={PROPOSED_DEFAULTS.costShareCap.max * 100}
          step={PROPOSED_DEFAULTS.costShareCap.step * 100}
          onChange={(v) => set('costShareCap')(v / 100)}
          display={`${Math.round(params.costShareCap * 100)}%`}
          hint="No household receives more than this share of its renovation bill."
        />

        <div className="space-y-4 border-t border-line pt-5">
          <Toggle
            label="Property value limit"
            checked={params.wozCapOn}
            onChange={set('wozCapOn')}
            hint={`Skips neighbourhoods where homes are worth more than ${formatEuro(CURRENT_SCHEME.wozCapEur)} on average.`}
            tip="Today's scheme checks each home's value. We only have a neighbourhood average, so some homes either side of the line are counted the wrong way."
          />
          <Toggle
            label="Match today's budget"
            checked={params.budgetNeutral}
            onChange={set('budgetNeutral')}
            hint="Scales the base grant so the two schemes cost the same."
          />
        </div>
      </div>
    </div>
  )
}
