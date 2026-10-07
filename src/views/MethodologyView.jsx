import { ViewHeader } from '../components/primitives'
import {
  SOURCES,
  PRICE_INDEX,
  VAT_RATE,
  CURRENT_SCHEME,
  INCOME_TOPUP,
  NATIONAL_SUPPORT_NOTE,
  RENOVATION_COST_EUR_EXCL_VAT,
} from '../config/coefficients'
import { formatEuro } from '../lib/format'

function H({ children }) {
  return <h2 className="mb-3 mt-9 text-[15px] font-semibold tracking-tight text-ink first:mt-0">{children}</h2>
}
function P({ children }) {
  return <p className="mb-3 max-w-[66ch] text-[12.5px] leading-[1.75] text-ink-2">{children}</p>
}

/**
 * Everything technical, written for a human.
 *
 * Plain language first, the formula once, then the tables. This is the only
 * view where variable names, statuses and the arithmetic are allowed to show.
 */
export default function MethodologyView() {
  const dataGroups = SOURCES.filter((g) => g.group !== 'Not available, not invented')
  const missing = SOURCES.find((g) => g.group === 'Not available, not invented')

  return (
    <div className="flex h-full min-h-0 flex-col">
      <ViewHeader title="Methodology" lead="What the numbers are, where they come from, and what we had to estimate." />

      <div className="min-h-0 flex-1 overflow-y-auto px-6 py-6">
        <H>What this tool does</H>
        <P>
          It compares two ways of paying out the municipal insulation grant across
          Amsterdam&rsquo;s neighbourhoods. The first is the scheme in force today: a flat{' '}
          {formatEuro(CURRENT_SCHEME.grantPerDwelling)} for every eligible home, provided
          the home is worth less than {formatEuro(CURRENT_SCHEME.wozCapEur)}. The second
          varies the grant by how much carbon a renovation would save there and by whether
          the household is on a low income.
        </P>
        <P>
          Both columns answer the same question: if every eligible home renovated, where
          would the money go and what would it buy? Neither is a forecast. How many
          households actually take up a grant is not modelled, because no reliable
          Amsterdam figure for that exists.
        </P>

        <H>How the grant is calculated</H>
        <P>
          Each household&rsquo;s proposed grant is the base grant, scaled by its
          neighbourhood&rsquo;s carbon potential, plus a top-up if the household is on a
          low income, with the total capped at a share of the renovation bill.
        </P>
        <div className="my-4 max-w-[66ch] border-l-2 border-accent bg-base-2 px-5 py-4">
          <p className="num text-[18px] text-ink">
            grant = min( base x weight + top-up , cap x cost )
          </p>
          <p className="mt-3 text-[11.5px] leading-[1.7] text-ink-3">
            The weight is 1 for a neighbourhood with average carbon potential, so the
            average grant stays at the base figure however hard the targeting is turned up.
            Only the spread around that average changes.
          </p>
        </div>
        <P>
          A neighbourhood figure blends the two cases, because only part of its households
          qualify for the top-up. The cap is applied to each case before blending, not
          after, so no individual household can exceed it.
        </P>

        <H>Where the numbers come from</H>
        {dataGroups.map((g) => (
          <div key={g.group} className="mb-7">
            <p className="label mb-2">{g.group}</p>
            <div className="border-t border-line-strong">
              {g.items.map((item) => (
                <div key={item.name} className="grid gap-x-6 gap-y-1 border-b border-line py-2.5 lg:grid-cols-[minmax(0,1.3fr)_minmax(0,1.6fr)_auto]">
                  <p className="text-[12px] leading-snug text-ink">{item.name}</p>
                  <p className="text-[11.5px] leading-snug text-ink-3">{item.source}</p>
                  <span className="justify-self-start text-[9.5px] uppercase tracking-[0.1em] text-ink-4 lg:justify-self-end">
                    {item.status}
                  </span>
                  {item.note && <p className="text-[11px] leading-[1.6] text-ink-4 lg:col-span-3">{item.note}</p>}
                </div>
              ))}
            </div>
          </div>
        ))}

        <H>Renovation costs</H>
        <P>
          TNO and PBL publish the cost of insulating a dwelling to label B as an average
          per dwelling type and starting label, in 2020 prices before VAT. Those figures
          are brought to 2025 with the CBS construction cost index ({PRICE_INDEX.base2020}{' '}
          in 2020 against {PRICE_INDEX.target2025} in 2025) and then {Math.round(VAT_RATE * 100)}%
          VAT is added. Because the source is an average per dwelling category, floor area
          plays no part: scaling by square metres would invent precision the source does
          not have.
        </P>
        <div className="my-4 max-w-[66ch] border-t border-line-strong">
          <div className="grid grid-cols-5 border-b border-line py-2">
            <span className="label-dim">2025 euros</span>
            {['G', 'F', 'E', 'D'].map((l) => (
              <span key={l} className="label-dim text-right">{l}</span>
            ))}
          </div>
          {Object.entries(RENOVATION_COST_EUR_EXCL_VAT).map(([type, byLabel]) => (
            <div key={type} className="grid grid-cols-5 border-b border-line py-2">
              <span className="text-[12px] capitalize text-ink-2">{type}</span>
              {['G', 'F', 'E', 'D'].map((l) => (
                <span key={l} className="num text-right text-[14px] text-ink">
                  {formatEuro(byLabel[l] * (PRICE_INDEX.target2025 / PRICE_INDEX.base2020) * (1 + VAT_RATE))}
                </span>
              ))}
            </div>
          ))}
        </div>

        <H>What we had to estimate</H>
        <P>
          Three things are estimates rather than measurements, and each one would change
          the results if it were wrong.
        </P>
        <P>
          <strong className="text-ink">Which homes are eligible.</strong> Ownership and
          energy label are not published together at neighbourhood level, so eligible homes
          are taken as the number of dwellings multiplied by the owner-occupied share and
          the poor-label share. This assumes the two are unrelated within a neighbourhood.
        </P>
        <P>
          <strong className="text-ink">Who qualifies for the top-up.</strong> The
          low-income share covers all households, but the grant only reaches owner-
          occupiers. Nationally about{' '}
          {Math.round(INCOME_TOPUP.ownerShareOfLowIncome * 100)}% of low-income households
          own their home, so the neighbourhood share is scaled by that before the top-up is
          costed. Source: {INCOME_TOPUP.ownerShareSource}.
        </P>
        <P>
          <strong className="text-ink">The property value limit.</strong> Today&rsquo;s
          scheme checks the value of each individual home. We only have a neighbourhood
          average, so homes either side of the line inside a neighbourhood are counted the
          wrong way.
        </P>

        <H>Carbon savings</H>
        <P>
          Savings come from measured gas use, not from modelled label steps. CBS compares
          dwellings that are alike in construction period, floor area, dwelling type and
          household size but differ in energy label. A home at label E, F or G uses about
          18% more gas than the same home at A or B. Each neighbourhood&rsquo;s own average
          gas use is adjusted for its label mix before the saving is applied, so two
          neighbourhoods that burn the same gas but differ in label mix do not get the same
          potential.
        </P>
        <P>
          Two caveats carry through to every carbon figure. CBS reports labels in groups,
          and the A/B group includes A homes, so savings to exactly label B are slightly
          overstated. And this compares different homes at one moment rather than the same
          homes before and after renovation; real renovations often save less than the
          comparison suggests.
        </P>

        <H>National support</H>
        <P>{NATIONAL_SUPPORT_NOTE} It is the same under both schemes, so leaving it out does not affect the comparison.</P>

        <H>Not available</H>
        <P>These were looked for and not found. Nothing here was filled in with a guess.</P>
        <div className="max-w-[66ch] border-t border-line-strong">
          {missing?.items.map((item) => (
            <div key={item.name} className="border-b border-line py-2.5">
              <p className="text-[12px] text-ink">{item.name}</p>
              <p className="text-[11.5px] text-ink-3">
                {item.source}
                {item.note ? `. ${item.note}` : ''}
              </p>
            </div>
          ))}
        </div>
        <div className="h-8" />
      </div>
    </div>
  )
}
