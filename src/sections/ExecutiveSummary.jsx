import { motion } from 'framer-motion'
import { SectionHeading, InfoTip, SourceNote, Tag } from '../components/primitives'
import AnimatedNumber from '../components/AnimatedNumber'
import { formatEuro, formatInt, formatNumber } from '../lib/format'
import {
  POLICY_TARGETS,
  RENOVATION_COST_EUR,
  BASELINE_GAS_M3_PER_YEAR,
  GAS_SAVINGS_FRACTION,
  GAS_PRICE_EUR_PER_M3,
  CO2_KG_PER_M3_GAS,
  NATIONAL_ENERGY_POVERTY,
} from '../config/coefficients'

/**
 * Headline annual saving for a household leaving the E/F/G bracket. Uses the
 * apartment baseline, since the Amsterdam stock is overwhelmingly multi-family,
 * and the default savings fraction.
 */
function headlineAnnualSaving() {
  const gasSaved = BASELINE_GAS_M3_PER_YEAR.apartment * GAS_SAVINGS_FRACTION.default
  return {
    euros: gasSaved * GAS_PRICE_EUR_PER_M3,
    gasM3: gasSaved,
    co2Tons: (gasSaved * CO2_KG_PER_M3_GAS) / 1000,
  }
}

/**
 * The three headline figures, set as a ruled table of figures rather than as
 * three identical cards. Each column opens on a heavy rule with a mono label
 * hung beneath it, and the value carries in the serif at display size.
 */
function HeadlineFigure({ index, label, value, format, unit, tone, children }) {
  const tones = { ink: 'text-ink', delft: 'text-delft-800', brick: 'text-brick' }
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.55, delay: index * 0.09, ease: [0.22, 1, 0.36, 1] }}
      className="rule-heavy pt-4"
    >
      <p className="label-mono">{label}</p>
      <p className={`figure-serif mt-4 text-[56px] leading-[0.9] sm:text-[64px] ${tones[tone]}`}>
        <AnimatedNumber value={value} format={format} />
        {unit && <span className="ml-1 font-sans text-[17px] tracking-normal text-ink-3">{unit}</span>}
      </p>
      <div className="mt-4 text-[12.5px] leading-[1.65] text-ink-2">{children}</div>
    </motion.div>
  )
}

export default function ExecutiveSummary({ data, onOpenSimulator }) {
  const { summary } = data
  const saving = headlineAnnualSaving()

  return (
    <div className="mx-auto max-w-[1360px] px-5 pb-24 pt-12 sm:px-8">
      {/* Masthead block. Asymmetric on purpose: the title occupies seven of
          twelve columns and the standfirst hangs in the last four, which breaks
          the centred-hero habit. */}
      <div className="grid gap-x-10 gap-y-8 lg:grid-cols-12">
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
          className="min-w-0 lg:col-span-7"
        >
          <p className="label-mono mb-4">Section 01 / Executive summary</p>
          <div className="rule-heavy" />
          <h1 className="font-serif mt-6 text-[2.9rem] font-medium leading-[1.04] tracking-tight text-ink sm:text-[3.9rem]">
            Where does a renovation subsidy actually change the outcome?
          </h1>

          <div className="mt-7 flex flex-wrap gap-2">
            <Tag tone="ink">{formatInt(summary.nBuurten)} neighbourhoods</Tag>
            <Tag>CBS Kerncijfers wijken en buurten</Tag>
            <Tag tone="delft">Energy label distribution</Tag>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.12, ease: [0.22, 1, 0.36, 1] }}
          className="min-w-0 lg:col-span-5 lg:pt-16"
        >
          <p className="rule-left pl-5 text-[14.5px] leading-[1.7] text-ink-2">
            A neighbourhood-level simulator for targeted green renovation subsidies in the
            Amsterdam housing market. It sets the CBS neighbourhood statistics against the
            TNO/PBL insulation cost table to estimate, for any of the{' '}
            {formatInt(summary.nBuurtenWithEnergyData)} neighbourhoods that carry
            energy-label data, what an upgrade costs, who ends up paying for it, and what it
            takes out of the atmosphere.
          </p>

          <button
            onClick={onOpenSimulator}
            className="group mt-6 ml-5 inline-flex items-center gap-2 border border-ink bg-ink px-5 py-2.5 font-mono text-[11px] uppercase tracking-[0.09em] text-paper transition-colors hover:bg-paper hover:text-ink"
          >
            Open the simulator
            <span className="transition-transform group-hover:translate-x-0.5">&rarr;</span>
          </button>
        </motion.div>
      </div>

      {/* Headline figures */}
      <div className="mt-20 grid gap-x-10 gap-y-12 sm:grid-cols-2 xl:grid-cols-4">
        <HeadlineFigure
          index={0}
          label="Poorly-labelled stock"
          value={summary.pctEFGWeighted}
          format={(v) => formatNumber(v, 1)}
          unit="%"
          tone="brick"
        >
          of Amsterdam&rsquo;s {formatInt(summary.labelledDwellings)} labelled dwellings
          carry an E, F or G rating. That is roughly {formatInt(summary.efgDwellings)}
          {' '}homes, and it is the population this instrument is aimed at.{' '}
          <InfoTip>
            Share of labelled dwellings rated E, F or G across Amsterdam, weighted by the
            number of labelled dwellings in each neighbourhood. The unweighted mean across
            neighbourhoods comes out higher, at{' '}
            {formatNumber(summary.pctEFGMeanOfBuurten, 1)}%, because the worst performers
            tend to be small.
          </InfoTip>
        </HeadlineFigure>

        <HeadlineFigure
          index={1}
          label="Annual saving, E/F/G to A/B"
          value={saving.euros}
          format={formatEuro}
          tone="ink"
        >
          off the gas bill per household per year. That is about{' '}
          {formatInt(saving.gasM3)} m&sup3; of gas and {formatNumber(saving.co2Tons, 2)}{' '}
          tonnes of CO&#8322;, set against an insulation package of{' '}
          {formatEuro(RENOVATION_COST_EUR.apartment.F)} for a label-F apartment.{' '}
          <InfoTip>
            {Math.round(GAS_SAVINGS_FRACTION.default * 100)}% of an assumed{' '}
            {formatInt(BASELINE_GAS_M3_PER_YEAR.apartment)} m&sup3;/year baseline for a
            poorly-labelled apartment, priced at &euro;
            {GAS_PRICE_EUR_PER_M3.toFixed(2)}/m&sup3;. The savings fraction is a working
            estimate rather than a cited figure. This simulator models it from the label
            transition; it does not measure it.
          </InfoTip>
        </HeadlineFigure>

        <HeadlineFigure
          index={2}
          label="Municipal target"
          value={POLICY_TARGETS.gasFreeYear}
          format={(v) => String(Math.round(v))}
          tone="delft"
        >
          is Amsterdam&rsquo;s date for a natural-gas-free housing stock, ten years ahead of
          the national {POLICY_TARGETS.nationalYear} commitment. Every dwelling still rated
          E, F or G has to move before then.{' '}
          <InfoTip>{POLICY_TARGETS.source}</InfoTip>
        </HeadlineFigure>

        {/* National context. Deliberately set in ink rather than brick: brick is
            reserved for the E/F/G bracket, and energy poverty is a different
            measure. */}
        <HeadlineFigure
          index={3}
          label="National context"
          value={NATIONAL_ENERGY_POVERTY.households}
          format={formatInt}
          tone="ink"
        >
          Dutch households, {NATIONAL_ENERGY_POVERTY.pctHouseholds}% of the total,
          experienced energy poverty in {NATIONAL_ENERGY_POVERTY.year}. The figure
          stagnated once government support measures ended in{' '}
          {NATIONAL_ENERGY_POVERTY.supportEndedYear}.{' '}
          <InfoTip>{NATIONAL_ENERGY_POVERTY.source}</InfoTip>
        </HeadlineFigure>
      </div>

      {/* Problem statement */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.35 }}
        className="mt-20"
      >
        <SectionHeading eyebrow="Problem statement" title="Framing the question" />
        <div className="plate-sunk mt-7 p-8">
          <p className="font-mono text-[12px] text-ink-3">[THEORY TEXT TO BE ADDED]</p>
        </div>
      </motion.div>

      {/* Provenance */}
      <div className="mt-16 grid gap-x-10 gap-y-8 sm:grid-cols-3">
        {[
          {
            k: 'Neighbourhoods',
            v: formatInt(summary.nBuurten),
            d: `${formatInt(summary.nBuurtenWithEnergyData)} carry energy-label data. The other ${summary.nBuurtenWithoutEnergyData} are harbour and industrial zones with effectively no housing stock, and they sit outside the simulator.`,
          },
          {
            k: 'Dwelling stock',
            v: formatInt(summary.totalWoningvoorraad),
            d: `${formatInt(summary.labelledDwellings)} of these carry a registered energy label. Every label share shown anywhere in this tool is calculated on that basis.`,
          },
          {
            k: 'Energy indicator',
            v: 'Label only',
            d: 'The simulator reads the label distribution and nothing else. Gas savings are modelled from the label transition rather than measured from consumption.',
          },
        ].map((item, i) => (
          <motion.div
            key={item.k}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.45 + i * 0.06 }}
            className="rule pt-3"
          >
            <p className="label-mono">{item.k}</p>
            <p className="figure-serif mt-2 text-[26px] leading-none text-ink">{item.v}</p>
            <p className="mt-3 text-[11.5px] leading-[1.65] text-ink-3">{item.d}</p>
          </motion.div>
        ))}
      </div>

      <div className="rule mt-12 pt-4">
        <SourceNote>
          Cost figures: TNO/PBL, Bepaling Isolatiekosten Woningen, Startanalyse 2025 (Feb
          2025), Table 3.1. Value uplift: Brounen &amp; Kok (2011), JEEM 62(2). Emission
          factor: RVO, Nederlandse lijst Energiedragers en standaard CO&#8322;-emissiefactoren.
        </SourceNote>
      </div>
    </div>
  )
}
