import { useCallback, useState } from 'react'
import { MotionConfig, motion } from 'framer-motion'
import NavBar from './components/NavBar'
import ExecutiveSummary from './sections/ExecutiveSummary'
import Simulator from './sections/Simulator'
import Theory from './sections/Theory'
import Recommendations from './sections/Recommendations'
import Process from './sections/Process'
import dataset from './data/buurten.json'

const SECTIONS = [
  { id: 'summary', label: 'Executive Summary' },
  { id: 'simulator', label: 'Simulator' },
  { id: 'theory', label: 'Theoretical Framework' },
  { id: 'policy', label: 'Policy Recommendations' },
  { id: 'process', label: 'Team & AI Statement' },
]

export default function App() {
  const [active, setActive] = useState('summary')

  const change = useCallback((id) => {
    setActive(id)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }, [])

  return (
    // reducedMotion="user" makes every Framer Motion animation in the tree
    // follow the viewer's OS "reduce motion" setting without each component
    // having to check for it.
    <MotionConfig reducedMotion="user">
      <div className="paper-grain" aria-hidden="true" />

      <NavBar sections={SECTIONS} active={active} onChange={change} />

      {/*
        Section transitions are enter-only: the keyed wrapper remounts on every
        change, so the incoming section fades and slides up while the outgoing
        one is simply unmounted.

        Deliberately NOT `AnimatePresence mode="wait"` here. That variant gates
        mounting the incoming section on the outgoing one's exit animation
        reporting completion, and requestAnimationFrame is throttled whenever
        the page is in a background or hidden tab, which stalls the exit and
        leaves the whole page blank until the tab is focused again. Enter-only
        has no such dependency: the new section is in the DOM immediately and
        the animation only affects how it arrives. Same transition, no failure
        mode.
      */}
      <main>
        <motion.div
          key={active}
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.36, ease: [0.22, 1, 0.36, 1] }}
        >
          {active === 'summary' && (
            <ExecutiveSummary data={dataset} onOpenSimulator={() => change('simulator')} />
          )}
          {active === 'simulator' && <Simulator data={dataset} />}
          {active === 'theory' && <Theory />}
          {active === 'policy' && <Recommendations />}
          {active === 'process' && <Process />}
        </motion.div>
      </main>

      <footer className="plate-ink mt-8">
        <div className="mx-auto flex max-w-[1360px] flex-col gap-2 px-5 py-8 sm:flex-row sm:items-baseline sm:justify-between sm:px-8">
          <p className="font-mono text-[10.5px] uppercase tracking-[0.08em] text-paper/55">
            RetroFit Amsterdam / academic policy simulator / calculations run in the browser
          </p>
          <p className="font-mono text-[10.5px] uppercase tracking-[0.08em] text-paper/40">
            CBS Kerncijfers wijken en buurten / cost model TNO-PBL 2025
          </p>
        </div>
      </footer>
    </MotionConfig>
  )
}
