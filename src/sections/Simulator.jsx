import { useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { SectionHeading, InfoTip, SourceNote, Tag } from '../components/primitives'
import Slider from '../components/Slider'
import BuurtSelect from '../components/BuurtSelect'
import BuurtInfoCard from '../components/BuurtInfoCard'
import Figure from '../components/Figure'
import PaybackGauge from '../components/PaybackGauge'
import EFGRankingChart from '../components/EFGRankingChart'
import AnimatedNumber from '../components/AnimatedNumber'
import { runSimulation, defaultDwellingType, scaleToBuurt, rankByEFG } from '../lib/calc'
import { withEnergyPovertyRisk, rankByRisk } from '../lib/energyPoverty'
import { formatEuro, formatInt, formatNumber, formatPct } from '../lib/format'
import {
  CURRENT_LABELS,
  TARGET_LABELS,
  DEFAULT_TARGET_LABEL,
  INSTALLATION_ALLOWANCE,
  FLOOR_AREA_RANGE,
  SUBSIDY,
  VALUE_UPLIFT,
  GAS_SAVINGS_FRACTION,
  REFERENCE_FLOOR_AREA_M2,
  CO2_KG_PER_M3_GAS,
  GAS_PRICE_EUR_PER_M3,
  MIN_LABELLED_FOR_RANKING,
} from '../config/coefficients'

const euro = (v) => formatEuro(v)
const tons = (v) => formatNumber(v, 2)

/** Underlined segmented control. No pills, no filled backgrounds. */
function Segmented({ label, options, value, onChange, tip }) {
  return (
    <div>
      <div className="mb-2 flex items-center gap-1.5">
        <span className="label-mono">{label}</span>
        {tip && <InfoTip>{tip}</InfoTip>}
      </div>
      <div className="flex border border-ink/20">
        {options.map((o, i) => (
          <button
            key={o.value}
            onClick={() => onChange(o.value)}
            className={`flex-1 px-2 py-2 font-mono text-[11px] uppercase tracking-[0.06em] transition-colors ${
              i > 0 ? 'border-l border-ink/20' : ''
            } ${
              value === o.value
                ? 'bg-ink text-paper'
                : 'bg-paper text-ink-3 hover:bg-paper-2 hover:text-ink'
            }`}
          >
            {o.label}
          </button>
        ))}
      </div>
    </div>
  )
}

export default function Simulator({ data }) {
  // The energy poverty score is derived here rather than in the build-time
  // pipeline, since it needs normalising across the whole city and reads only
  // columns already present in the dataset.
  const buurten = useMemo(() => withEnergyPovertyRisk(data.buurten), [data.buurten])

  const selectable = useMemo(() => buurten.filter((b) => b.hasEnergyData), [buurten])

  // Four rankings, one per measure and threshold combination, so switching a
  // toggle never recomputes a sort.
  const rankings = useMemo(
    () => ({
      efg: {
        filtered: rankByEFG(buurten),
        all: rankByEFG(buurten, { minLabelled: 0 }),
      },
      risk: {
        filtered: rankByRisk(buurten, { minLabelled: MIN_LABELLED_FOR_RANKING }),
        all: rankByRisk(buurten),
      },
    }),
    [buurten],
  )
  const ranked = rankings.efg.filtered
  const [filterSmall, setFilterSmall] = useState(true)

  const [selected, setSelected] = useState(() => ranked[0] ?? selectable[0])
  const [dwellingType, setDwellingType] = useState(() =>
    defaultDwellingType(ranked[0] ?? selectable[0]),
  )
  const [dwellingTouched, setDwellingTouched] = useState(false)
  const [currentLabel, setCurrentLabel] = useState('F')
  const [targetLabel, setTargetLabel] = useState(DEFAULT_TARGET_LABEL)
  const [installationAllowance, setInstallationAllowance] = useState(
    INSTALLATION_ALLOWANCE.default,
  )
  const [floorArea, setFloorArea] = useState(FLOOR_AREA_RANGE.default)
  const [municipalRate, setMunicipalRate] = useState(SUBSIDY.municipalRate.default)
  const [upliftRate, setUpliftRate] = useState(VALUE_UPLIFT.default)
  const [savingsFraction, setSavingsFraction] = useState(GAS_SAVINGS_FRACTION.default)

  const chooseBuurt = (b) => {
    setSelected(b)
    // Follow the neighbourhood's dominant dwelling type until the user
    // overrides it, then respect their choice.
    if (!dwellingTouched) setDwellingType(defaultDwellingType(b))
  }

  const result = useMemo(
    () =>
      runSimulation({
        buurt: selected,
        dwellingType,
        currentLabel,
        floorAreaM2: floorArea,
        municipalRate,
        upliftRate,
        savingsFraction,
        targetLabel,
        installationAllowance,
      }),
    [
      selected,
      dwellingType,
      currentLabel,
      floorArea,
      municipalRate,
      upliftRate,
      savingsFraction,
      targetLabel,
      installationAllowance,
    ],
  )

  const buurtScale = useMemo(
    () => scaleToBuurt({ buurt: selected, perDwelling: result }),
    [selected, result],
  )

  const dominant = selected
    ? selected.pctEengezins > selected.pctMeergezins
      ? 'house'
      : 'apartment'
    : 'apartment'

  const targetIsCosted = TARGET_LABELS[targetLabel]?.costed !== false

  return (
    <div className="mx-auto max-w-[1360px] px-5 pb-24 pt-12 sm:px-8">
      <SectionHeading
        eyebrow="Section 02 / Simulator"
        title="Interactive policy simulator"
        lead="Choose a neighbourhood, a dwelling, a starting label and a municipal top-up rate. Everything below recomputes in the browser from the coefficients in the configuration file: costs from the TNO/PBL insulation table, value uplift from the Dutch hedonic literature, CO₂ from the RVO emission factor."
      />

      <div className="mt-10 grid gap-8 lg:grid-cols-[340px_minmax(0,1fr)]">
        {/* ---------------- Controls ---------------- */}
        {/* min-w-0: grid items default to min-width:auto, so a single nowrap
            descendant (a truncated subtitle, a wide chart) sizes the whole
            track to its min-content and pushes the column past the viewport on
            narrow screens. */}
        <div className="min-w-0 lg:sticky lg:top-24 lg:self-start">
          <div className="plate p-5">
            <div className="mb-5 flex items-center justify-between border-b border-ink/15 pb-3">
              <h3 className="label-mono">Parameters</h3>
              <Tag tone={targetIsCosted ? 'delft' : 'brick'}>
                target {TARGET_LABELS[targetLabel].name}
              </Tag>
            </div>

            <div className="space-y-5">
              <BuurtSelect buurten={buurten} value={selected} onChange={chooseBuurt} />

              <Segmented
                label="Dwelling type"
                tip={
                  <>
                    Selects which TNO cost table applies. It defaults to the
                    neighbourhood&rsquo;s dominant type, which here is{' '}
                    <strong className="text-ink">
                      {dominant === 'house' ? 'single-family' : 'multi-family'}
                    </strong>{' '}
                    at{' '}
                    {formatPct(
                      dominant === 'house' ? selected?.pctEengezins : selected?.pctMeergezins,
                      0,
                    )}{' '}
                    of the local stock.
                  </>
                }
                options={[
                  { value: 'apartment', label: 'Apartment' },
                  { value: 'house', label: 'House' },
                ]}
                value={dwellingType}
                onChange={(v) => {
                  setDwellingType(v)
                  setDwellingTouched(true)
                }}
              />

              <Segmented
                label="Current label"
                tip="The starting label sets the size of the insulation package. Only E, F and G are modelled, since those are the dwellings the instrument targets."
                options={CURRENT_LABELS.map((l) => ({ value: l, label: l }))}
                value={currentLabel}
                onChange={setCurrentLabel}
              />

              <Segmented
                label="Target label"
                tip={
                  <>
                    <strong className="text-ink">B</strong> is priced straight from the
                    TNO/PBL table, which publishes one target: schillabel B.{' '}
                    <strong className="text-ink">A</strong> needs the same envelope work
                    plus a heating-system replacement, and no per-dwelling figure for that
                    exists in our sources. Rather than invent one, selecting A opens an
                    allowance you set yourself. A+ and A++ are not offered, because costing
                    them would mean extrapolating past the end of the published table.
                  </>
                }
                options={Object.values(TARGET_LABELS).map((t) => ({
                  value: t.id,
                  label: t.name,
                }))}
                value={targetLabel}
                onChange={setTargetLabel}
              />

              {/* Only the uncosted target carries an allowance. */}
              {!targetIsCosted && (
                <motion.div
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.25 }}
                  className="border-l-2 border-brick bg-brick/[0.05] py-3 pl-4 pr-3"
                >
                  <Slider
                    label="Installation allowance"
                    value={installationAllowance}
                    min={INSTALLATION_ALLOWANCE.min}
                    max={INSTALLATION_ALLOWANCE.max}
                    step={INSTALLATION_ALLOWANCE.step}
                    onChange={setInstallationAllowance}
                    display={formatEuro(installationAllowance)}
                    accent="#a8402c"
                    hint="Your assumption, not a sourced figure. It covers the heating-system replacement a label-A transition needs. Left at zero, a label-A run costs exactly what a label-B run costs."
                  />
                </motion.div>
              )}

              <Slider
                label="Floor area"
                value={floorArea}
                min={FLOOR_AREA_RANGE.min}
                max={FLOOR_AREA_RANGE.max}
                step={FLOOR_AREA_RANGE.step}
                onChange={setFloorArea}
                display={`${floorArea} m²`}
                hint={`Scaled around the ${REFERENCE_FLOOR_AREA_M2} m² TNO reference dwelling. It is not applied as a €/m² rate.`}
              />

              <Slider
                label="Municipal top-up subsidy"
                value={Math.round(municipalRate * 100)}
                min={SUBSIDY.municipalRate.min * 100}
                max={SUBSIDY.municipalRate.max * 100}
                step={1}
                onChange={(v) => setMunicipalRate(v / 100)}
                display={`${Math.round(municipalRate * 100)}%`}
                accent="#33628f"
                hint={
                  SUBSIDY.applyNationalBaseline
                    ? `Sits on top of an assumed ${Math.round(
                        SUBSIDY.nationalBaselineRate * 100,
                      )}% national ISDE baseline. Combined support is capped at ${Math.round(
                        SUBSIDY.maxCombinedRate * 100,
                      )}%.`
                    : 'The municipal instrument is modelled on its own.'
                }
              />

              <div className="border-t border-ink/15 pt-5">
                <p className="label-mono mb-4">Model assumptions</p>
                <div className="space-y-5">
                  <Slider
                    label="Value uplift on label improvement"
                    value={Math.round(upliftRate * 1000)}
                    min={VALUE_UPLIFT.min * 1000}
                    max={VALUE_UPLIFT.max * 1000}
                    step={VALUE_UPLIFT.step * 1000}
                    onChange={(v) => setUpliftRate(v / 1000)}
                    display={`${(upliftRate * 100).toFixed(1)}%`}
                    accent="#5a88b7"
                    hint="Brounen and Kok (2011) put it near 3.7%. Later work finds the premium has weakened."
                  />
                  <Slider
                    label="Gas saving from the upgrade"
                    value={Math.round(savingsFraction * 100)}
                    min={GAS_SAVINGS_FRACTION.min * 100}
                    max={GAS_SAVINGS_FRACTION.max * 100}
                    step={1}
                    onChange={(v) => setSavingsFraction(v / 100)}
                    display={`${Math.round(savingsFraction * 100)}%`}
                    accent="#5a88b7"
                    hint="A working estimate with no single citation behind it. It drives the CO₂ figure and the payback period directly."
                  />
                </div>
              </div>
            </div>
          </div>

          <SourceNote className="mt-4">
            Costs: TNO/PBL, Bepaling Isolatiekosten Woningen (2025), Table 3.1, standalone
            scenario, target schillabel B, 2020 euros excluding VAT.
          </SourceNote>
        </div>

        {/* ---------------- Results ---------------- */}
        <div className="min-w-0 space-y-10">
          <BuurtInfoCard buurt={selected} />

          <div className="grid gap-x-8 gap-y-8 sm:grid-cols-2 xl:grid-cols-4">
            <Figure
              index={0}
              label="Total renovation cost"
              value={result.totalCost}
              format={euro}
              tip={
                <>
                  Insulation of the building envelope to schillabel B. It leaves out the
                  heating-system upgrade, meaning a heat pump, low-temperature emitters or a
                  district-heat connection, which a genuine label-A transition also needs.
                  Read it as an insulation estimate rather than a turnkey installation cost.
                  {!targetIsCosted && (
                    <>
                      {' '}
                      With target A selected, the allowance you set is added on top and is
                      shown separately below.
                    </>
                  )}
                </>
              }
              sub={
                targetIsCosted
                  ? `${dwellingType === 'house' ? 'Single-family' : 'Apartment'}, label ${currentLabel} to ${targetLabel}, ${floorArea} m²`
                  : `Envelope ${formatEuro(result.envelopeCost)} plus allowance ${formatEuro(result.installationCost)}`
              }
            />
            <Figure
              index={1}
              label="Municipal contribution"
              value={result.subsidy.municipal}
              format={euro}
              tone="delft"
              tip={
                result.subsidy.capped
                  ? `Combined public support hit the ${Math.round(SUBSIDY.maxCombinedRate * 100)}% cap, so the municipal share is trimmed below the slider value.`
                  : 'The municipal top-up on its own, excluding the national ISDE baseline shown below it.'
              }
              sub={`${Math.round(result.subsidy.municipalRate * 100)}% top-up. National ISDE ${formatEuro(
                result.subsidy.national,
              )}`}
            />
            <Figure
              index={2}
              label="Net household cost"
              value={result.netCost}
              format={euro}
              sub={`After ${Math.round(result.subsidy.combinedRate * 100)}% combined public support`}
            />
            <Figure
              index={3}
              label="Home value increase"
              value={result.valueIncrease}
              format={euro}
              tone="delft"
              tip={
                <>
                  {(upliftRate * 100).toFixed(1)}% of the neighbourhood&rsquo;s average WOZ
                  value. Source: Brounen and Kok (2011), which found roughly a 3.7% premium
                  for A/B/C dwellings. Treat it with caution. Aydin et al. (2020) find the
                  premium has weakened over time, and it only materialises on sale.
                </>
              }
              sub={
                selected?.wozK === null
                  ? 'No WOZ value published for this neighbourhood'
                  : `${(upliftRate * 100).toFixed(1)}% of ${formatEuro((selected?.wozK ?? 0) * 1000)} average WOZ`
              }
            />
          </div>

          {/* Payback + CO2 */}
          <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.25fr)]">
            <div className="plate-sunk p-6">
              <div className="mb-4 flex items-center gap-1.5">
                <h3 className="label-mono">Simple payback period</h3>
                <InfoTip>
                  Net household cost divided by the annual saving on the gas bill, at an
                  assumed &euro;{GAS_PRICE_EUR_PER_M3.toFixed(2)}/m&sup3; all-in retail
                  price. Undiscounted, and it leaves the value uplift out.
                </InfoTip>
              </div>
              <PaybackGauge years={result.payback} />
            </div>

            <div className="plate-sunk flex flex-col p-6">
              <div className="mb-4 flex items-center gap-1.5">
                <h3 className="label-mono">Annual avoided CO&#8322;</h3>
                <InfoTip>
                  Modelled gas saving times {CO2_KG_PER_M3_GAS} kg CO&#8322;/m&sup3;, the
                  RVO standard tank-to-wheel combustion factor for natural gas. The gas
                  saving itself is modelled from the label transition rather than measured,
                  so read the result as an order of magnitude.
                </InfoTip>
              </div>

              <div className="flex flex-1 flex-col justify-center">
                <p className="figure-serif text-[52px] leading-none text-ink">
                  <AnimatedNumber value={result.energy.co2AvoidedTons} format={tons} />
                  <span className="ml-2 font-sans text-[14px] tracking-normal text-ink-3">
                    t CO&#8322; / year
                  </span>
                </p>

                <div className="mt-5 h-[6px] w-full bg-ink/10">
                  <motion.div
                    className="h-full bg-delft-600"
                    initial={false}
                    animate={{
                      width: `${Math.min((result.energy.co2AvoidedTons / 3) * 100, 100)}%`,
                    }}
                    transition={{ type: 'spring', stiffness: 110, damping: 21 }}
                  />
                </div>
                <p className="mt-2 font-mono text-[10px] text-ink-4">
                  Scale: 3 t CO&#8322;/year per dwelling
                </p>

                <div className="mt-6 grid grid-cols-2 gap-6">
                  <div className="rule pt-2.5">
                    <p className="label-mono">Gas saved</p>
                    <p className="tnum font-serif mt-1 text-[19px] font-medium text-ink">
                      <AnimatedNumber
                        value={result.energy.gasSavedM3}
                        format={(v) => `${formatInt(v)} m³`}
                      />
                    </p>
                  </div>
                  <div className="rule pt-2.5">
                    <p className="label-mono">Bill saving</p>
                    <p className="tnum font-serif mt-1 text-[19px] font-medium text-ink">
                      <AnimatedNumber
                        value={result.energy.euroSavedPerYear}
                        format={(v) => `${formatEuro(v)}/yr`}
                      />
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Neighbourhood-level scaling */}
          {buurtScale && (
            <div>
              <div className="mb-4 flex items-center gap-1.5">
                <h3 className="label-mono">
                  Scaled to every E/F/G dwelling in {selected.name}
                </h3>
                <InfoTip>
                  The single-household result multiplied by the estimated number of E/F/G
                  dwellings in this neighbourhood. It assumes full take-up and an identical
                  dwelling throughout, so treat it as an upper bound rather than a budget
                  forecast.
                </InfoTip>
              </div>
              <div className="grid grid-cols-1 gap-x-8 gap-y-6 sm:grid-cols-3">
                <div className="rule pt-2.5">
                  <p className="label-mono">E/F/G dwellings</p>
                  <p className="figure-serif mt-2 text-[26px] leading-none text-ink">
                    <AnimatedNumber value={buurtScale.efgDwellings} format={formatInt} />
                  </p>
                </div>
                <div className="rule pt-2.5">
                  <p className="label-mono">Municipal outlay</p>
                  <p className="figure-serif mt-2 text-[26px] leading-none text-delft-800">
                    <AnimatedNumber value={buurtScale.municipalOutlay} format={euro} />
                  </p>
                </div>
                <div className="rule pt-2.5">
                  <p className="label-mono">CO&#8322; avoided</p>
                  <p className="figure-serif mt-2 text-[26px] leading-none text-ink">
                    <AnimatedNumber
                      value={buurtScale.co2AvoidedTons}
                      format={(v) => `${formatInt(v)} t/yr`}
                    />
                  </p>
                </div>
              </div>
            </div>
          )}

          <div className="plate p-6">
            <EFGRankingChart
              rankings={rankings}
              filterSmall={filterSmall}
              onToggleFilterSmall={setFilterSmall}
              selected={selected}
              cityAverage={data.summary.pctEFGWeighted}
              onSelect={(code) => {
                const b = buurten.find((x) => x.code === code)
                if (b?.hasEnergyData) chooseBuurt(b)
              }}
            />
            <div className="rule mt-5 pt-4">
              <SourceNote>
                Standing in for a choropleth map. {data.summary.nBuurtenWithoutEnergyData} of{' '}
                {data.summary.nBuurten} neighbourhoods have no energy-label data and cannot
                be ranked; they are harbour and industrial zones with effectively no housing
                stock. Of the {data.summary.nBuurtenWithEnergyData} that remain, the default
                view shows the {ranked.length} holding at least{' '}
                {MIN_LABELLED_FOR_RANKING} labelled dwellings. Without that guard the head
                of the ranking is four neighbourhoods reporting 100% E/F/G off one or two
                dwellings. Untick the box to see the unfiltered ranking. Every neighbourhood
                stays selectable in the dropdown either way.
              </SourceNote>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
