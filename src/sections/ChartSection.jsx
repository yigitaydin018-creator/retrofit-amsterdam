import { SectionHeading, InfoTip } from '../components/primitives'
import OwnerIncomeScatter from '../components/OwnerIncomeScatter'

/**
 * The tenure-income relationship, with room beside it for the team's reading
 * of it.
 */
export default function ChartSection({ buurten, selectedCode, onSelect }) {
  return (
    <section id="chart" className="mx-auto max-w-[1280px] px-5 py-14 sm:px-8">
      <SectionHeading eyebrow="Section 04" title="Ownership and income" />

      <div className="mt-8 grid gap-8 lg:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)]">
        <div className="plate p-5">
          <div className="mb-3 flex items-center gap-1.5">
            <h3 className="label-mono">Owner-occupied share against low-income share</h3>
            <InfoTip>
              Owner share is CBS Kerncijfers 2025. Low-income share is BBGA
              ILAAGHH130_P, households at or below 130% of the social minimum, 2024.
            </InfoTip>
          </div>
          <OwnerIncomeScatter
            buurten={buurten}
            selectedCode={selectedCode}
            onSelect={onSelect}
          />
        </div>

        <div>
          <p className="label-mono mb-3">Reading</p>
          <div className="plate-sunk p-7">
            <p className="font-mono text-[12px] text-ink-3">[Text to be added by the team]</p>
          </div>
        </div>
      </div>
    </section>
  )
}
