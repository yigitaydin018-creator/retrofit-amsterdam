import { motion } from 'framer-motion'
import { Tag } from './primitives'
import LabelDistribution from './LabelDistribution'
import { formatEuro, formatInt, formatPct } from '../lib/format'
import { HIGH_RENTAL_THRESHOLD_PCT } from '../config/coefficients'
import { heritageAreaOf, HERITAGE_NOTICE, HERITAGE_SOURCE } from '../config/heritage'

/**
 * Descriptive panel for the selected buurt: tenure, value, stock and the label
 * distribution, plus the split-incentive warning where the rental share is high
 * enough that an owner-occupier subsidy will miss most of the dwellings that
 * need it.
 *
 * Laid out as a statistical table with ruled columns rather than as a grid of
 * cards, which is closer to how this data appears in its source.
 */
function Stat({ label, value, hint }) {
  return (
    <div className="rule pt-2.5">
      <p className="label-mono">{label}</p>
      <p className="tnum font-serif mt-1 text-[19px] font-medium leading-none text-ink">
        {value}
      </p>
      {hint && <p className="mt-1.5 font-mono text-[9.5px] text-ink-4">{hint}</p>}
    </div>
  )
}

export default function BuurtInfoCard({ buurt }) {
  if (!buurt) return null

  const highRental = (buurt.pctHuur ?? 0) >= HIGH_RENTAL_THRESHOLD_PCT
  const heritageArea = heritageAreaOf(buurt)

  return (
    <div className="plate p-6">
      {/* Enter-only on a changing key. An exit-gated transition can stall in a
          background tab and leave the panel blank. */}
      <motion.div
        key={buurt.code}
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
      >
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <h3 className="font-serif text-[26px] font-medium leading-tight tracking-tight text-ink">
              {buurt.name}
            </h3>
            <p className="mt-1 font-mono text-[10px] text-ink-3">
              {buurt.wijkName ? `${buurt.wijkName} · ` : ''}
              {buurt.code} · CBS Kerncijfers wijken en buurten
            </p>
          </div>
          <div className="flex shrink-0 flex-wrap gap-2">
            <Tag tone={buurt.pctEFG > 15 ? 'brick' : 'neutral'}>
              {formatPct(buurt.pctEFG)} E/F/G
            </Tag>
            {heritageArea && <Tag tone="ink">protected cityscape</Tag>}
            {buurt.gemBouwjaar && <Tag>built {Math.round(buurt.gemBouwjaar)}</Tag>}
          </div>
        </div>

        <div className="mt-6 grid grid-cols-2 gap-x-5 gap-y-4 sm:grid-cols-4">
          <Stat label="Owner-occupied" value={formatPct(buurt.pctKoop, 0)} />
          <Stat
            label="Rented"
            value={formatPct(buurt.pctHuur, 0)}
            hint={buurt.pctWcorp != null ? `${Math.round(buurt.pctWcorp)}% social` : undefined}
          />
          <Stat
            label="Avg. WOZ value"
            value={buurt.wozK === null ? 'n/a' : formatEuro(buurt.wozK * 1000)}
            hint={buurt.wozK === null ? 'not published' : undefined}
          />
          <Stat label="Dwelling stock" value={formatInt(buurt.woningvoorraad)} />
          <Stat label="Residents" value={formatInt(buurt.inwoners)} />
          <Stat label="Households" value={formatInt(buurt.huishoudens)} />
          <Stat
            label="Single-family"
            value={formatPct(buurt.pctEengezins, 0)}
            hint="eengezinswoning"
          />
          <Stat
            label="Labelled dwellings"
            value={formatInt(buurt.nWoningenLabel)}
            hint="basis for label shares"
          />
        </div>

        <div className="mt-7">
          <LabelDistribution buurt={buurt} />
        </div>

        {/* Informational only. Nothing here feeds cost, subsidy or payback. */}
        {heritageArea && (
          <motion.div
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="mt-6 border border-ink/25 bg-paper-2 p-4"
          >
            <div className="flex items-baseline justify-between gap-3">
              <p className="label-mono">Heritage protection</p>
              <span className="font-mono text-[9.5px] uppercase tracking-wide text-ink-4">
                {heritageArea}
              </span>
            </div>
            <p className="mt-2.5 text-[12px] leading-[1.65] text-ink-2">{HERITAGE_NOTICE}</p>
            <p className="mt-2.5 font-mono text-[10px] leading-[1.6] text-ink-4">
              Flagged at wijk level as an approximation, so it will over-report inside a
              flagged area and miss protected buildings outside one. Check the actual
              designation before relying on it. {HERITAGE_SOURCE}
            </p>
          </motion.div>
        )}

        {highRental && (
          <motion.div
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="mt-6 border-l-2 border-brick bg-brick/[0.05] py-3 pl-4 pr-4"
          >
            <p className="text-[12.5px] font-medium leading-snug text-brick">
              {Math.round(buurt.pctHuur)}% of dwellings here are rented, so the subsidy does
              not reach this group directly.
            </p>
            <p className="mt-2 text-[11.5px] leading-[1.65] text-ink-2">
              An owner-occupier instrument is claimed by the landlord, while the energy bill
              is paid by the tenant. That is the split incentive in its plainest form: the
              party who can invest is not the party who benefits.
              {buurt.pctWcorp != null &&
                ` Around ${Math.round(buurt.pctWcorp)}% of the rental stock here belongs to housing associations, which answer to national performance agreements rather than to this instrument.`}
            </p>
          </motion.div>
        )}
      </motion.div>
    </div>
  )
}
