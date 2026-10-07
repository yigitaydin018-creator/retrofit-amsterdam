import { useCallback, useMemo, useState } from 'react'
import { MotionConfig } from 'framer-motion'
import NavBar from './components/NavBar'
import Hero from './sections/Hero'
import PolicyLab from './sections/PolicyLab'
import ChartSection from './sections/ChartSection'
import DataSources from './sections/DataSources'
import PlaceholderSection from './sections/PlaceholderSection'
import { runComparison } from './lib/model'
import { co2IsAvailable } from './lib/co2'
import { PROPOSED_DEFAULTS } from './config/coefficients'
import dataset from './data/buurten.json'
import geo from './data/geo.json'

/**
 * One scrolling document rather than switched tabs: the lab, the detail panel
 * and the chart all read the same selection and the same parameters, and a
 * reader moving between them should not lose their place.
 */
const SECTIONS = [
  { id: 'top', label: 'Overview' },
  { id: 'lab', label: 'Policy lab' },
  { id: 'buurt', label: 'Buurt detail' },
  { id: 'chart', label: 'Ownership and income' },
  { id: 'sources', label: 'Data and sources' },
]

const PLACEHOLDERS = [
  { id: 'problem', eyebrow: 'Section 06', title: 'Problem' },
  { id: 'theory', eyebrow: 'Section 07', title: 'Theoretical framework' },
  { id: 'recommendations', eyebrow: 'Section 08', title: 'Recommendations' },
  { id: 'limitations', eyebrow: 'Section 09', title: 'Limitations' },
  { id: 'team', eyebrow: 'Section 10', title: 'Team and AI statement' },
]

export default function App() {
  const [params, setParams] = useState({
    baseGrant: PROPOSED_DEFAULTS.baseGrantEur.default,
    alpha: PROPOSED_DEFAULTS.alpha.default,
    incomeTopUp: PROPOSED_DEFAULTS.incomeTopUpEur.default,
    costShareCap: PROPOSED_DEFAULTS.costShareCap.default,
    wozCapOn: true,
    budgetNeutral: false,
  })
  const [selectedCode, setSelectedCode] = useState(null)

  const savings = dataset.savings
  const co2Available = co2IsAvailable(savings)

  const result = useMemo(
    () => runComparison({ buurten: dataset.buurten, savings, params }),
    [savings, params],
  )

  const goTo = useCallback((id) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }, [])

  return (
    <MotionConfig reducedMotion="user">
      <div className="paper-grain" aria-hidden="true" />

      <NavBar sections={SECTIONS} onNavigate={goTo} />

      <main>
        <Hero counts={result.counts} onOpenLab={() => goTo('lab')} />

        <PolicyLab
          geo={geo}
          result={result}
          params={params}
          onParams={setParams}
          savings={savings}
          co2Available={co2Available}
          selectedCode={selectedCode}
          onSelect={setSelectedCode}
        />

        <ChartSection
          buurten={result.modelled}
          selectedCode={selectedCode}
          onSelect={setSelectedCode}
        />

        <DataSources />

        {PLACEHOLDERS.map((p) => (
          <PlaceholderSection key={p.id} id={p.id} eyebrow={p.eyebrow} title={p.title} />
        ))}
      </main>

      <footer className="plate-ink mt-6">
        <div className="mx-auto flex max-w-[1280px] flex-col gap-2 px-5 py-8 sm:flex-row sm:items-baseline sm:justify-between sm:px-8">
          <p className="font-mono text-[10.5px] uppercase tracking-[0.08em] text-paper/55">
            RetroFit Amsterdam / policy lab / calculations run in the browser
          </p>
          <p className="font-mono text-[10.5px] uppercase tracking-[0.08em] text-paper/40">
            Potential allocation, not forecast uptake
          </p>
        </div>
      </footer>
    </MotionConfig>
  )
}
