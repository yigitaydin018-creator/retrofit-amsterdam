import { useCallback, useMemo, useState } from 'react'
import { MotionConfig } from 'framer-motion'
import SideNav from './components/SideNav'
import IntroView from './views/IntroView'
import SimulatorView from './views/SimulatorView'
import NeighbourhoodsView from './views/NeighbourhoodsView'
import BriefingView from './views/BriefingView'
import MethodologyView from './views/MethodologyView'
import { runComparison } from './lib/model'
import { co2IsAvailable } from './lib/co2'
import { quantileBreaks } from './lib/classify'
import { PROPOSED_DEFAULTS } from './config/coefficients'
import { CHOROPLETH } from './config/palette'
import dataset from './data/buurten.json'
import geo from './data/geo.json'

/**
 * App shell. Four views switched by the rail, each sized to the window so
 * nothing scrolls except the panels that need to.
 *
 * Parameters and the selected neighbourhood live here, so moving between the
 * simulator and the neighbourhood view never loses either.
 */
const VIEWS = [
  { id: 'simulator', label: 'Simulator' },
  { id: 'neighbourhoods', label: 'Neighbourhoods' },
  { id: 'briefing', label: 'Briefing' },
  { id: 'methodology', label: 'Methodology' },
]

/**
 * Session memory: the intro plays once per browser session. Returning within
 * the same session lands on the last view instead, and the logo always goes
 * back to the intro.
 */
const SEEN_KEY = 'rfa.introSeen'
const LAST_VIEW_KEY = 'rfa.lastView'

const readSession = (key) => {
  try {
    return window.sessionStorage.getItem(key)
  } catch {
    // Private windows and blocked site data both throw here.
    return null
  }
}
const writeSession = (key, value) => {
  try {
    window.sessionStorage.setItem(key, value)
  } catch {
    // Nothing to do: the intro simply plays again next time.
  }
}

export default function App() {
  const [view, setView] = useState(() => {
    if (readSession(SEEN_KEY) !== '1') return 'intro'
    const last = readSession(LAST_VIEW_KEY)
    return VIEWS.some((v) => v.id === last) ? last : 'simulator'
  })
  const [selectedCode, setSelectedCode] = useState(null)
  const [params, setParams] = useState({
    baseGrant: PROPOSED_DEFAULTS.baseGrantEur.default,
    alpha: PROPOSED_DEFAULTS.alpha.default,
    incomeTopUp: PROPOSED_DEFAULTS.incomeTopUpEur.default,
    costShareCap: PROPOSED_DEFAULTS.costShareCap.default,
    wozCapOn: true,
    budgetNeutral: false,
  })

  const enter = useCallback((id) => {
    writeSession(SEEN_KEY, '1')
    writeSession(LAST_VIEW_KEY, id)
    setView(id)
  }, [])

  const savings = dataset.savings
  const co2Available = co2IsAvailable(savings)

  const result = useMemo(
    () => runComparison({ buurten: dataset.buurten, savings, params }),
    [savings, params],
  )

  // The scatter borrows the simulator's grant layer so the two read as one
  // picture rather than two unrelated charts.
  const layerValue = useMemo(() => {
    const grant = new Map(result.proposed.rows.map((r) => [r.code, r.grantPerDwelling]))
    const value = (code) => grant.get(code) ?? null
    return { value, breaks: quantileBreaks(result.modelled.map((b) => value(b.code)), CHOROPLETH.length) }
  }, [result])

  if (view === 'intro') {
    return (
      <MotionConfig reducedMotion="user">
        <IntroView geo={geo} buurten={result.prepared} views={VIEWS} onEnter={enter} />
      </MotionConfig>
    )
  }

  return (
    <MotionConfig reducedMotion="user">
      <div className="flex h-full">
        <SideNav views={VIEWS} active={view} onChange={enter} onHome={() => setView('intro')} />

        <main className="min-w-0 flex-1">
          {view === 'simulator' && (
            <SimulatorView
              geo={geo}
              result={result}
              params={params}
              onParams={setParams}
              co2Available={co2Available}
              selectedCode={selectedCode}
              onSelect={setSelectedCode}
            />
          )}
          {view === 'neighbourhoods' && (
            <NeighbourhoodsView
              result={result}
              selectedCode={selectedCode}
              onSelect={setSelectedCode}
              co2Available={co2Available}
              layerValue={layerValue}
            />
          )}
          {view === 'briefing' && <BriefingView />}
          {view === 'methodology' && <MethodologyView />}
        </main>
      </div>
    </MotionConfig>
  )
}
