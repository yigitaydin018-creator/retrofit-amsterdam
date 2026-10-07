import { motion } from 'framer-motion'
import { Tag } from '../components/primitives'
import { formatInt } from '../lib/format'

/**
 * Masthead. The project name, what the tool is for, and an empty block where
 * the team writes the problem statement.
 */
export default function Hero({ counts, onOpenLab }) {
  return (
    <section id="top" className="mx-auto max-w-[1280px] px-5 pb-10 pt-14 sm:px-8">
      <div className="grid gap-x-10 gap-y-8 lg:grid-cols-12">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          className="min-w-0 lg:col-span-7"
        >
          <p className="label-mono mb-4">Gemeente Amsterdam / renovation subsidy</p>
          <div className="rule-heavy" />
          <h1 className="font-serif mt-6 text-[2.6rem] font-medium leading-[1.06] tracking-tight text-ink sm:text-[3.4rem]">
            RetroFit Amsterdam
          </h1>
          <p className="mt-5 max-w-xl text-[15px] leading-[1.7] text-ink-2">
            A policy lab for the municipal insulation grant. Change how the subsidy is
            designed and see where the money goes and what it buys, measured against the
            flat grant in force today.
          </p>

          <div className="mt-6 flex flex-wrap gap-2">
            <Tag tone="ink">{formatInt(counts.total)} buurten</Tag>
            <Tag>{formatInt(counts.modelled)} modelled</Tag>
            <Tag tone="delft">CBS, BBGA, EP-Online, TNO/PBL</Tag>
          </div>

          <button
            onClick={onOpenLab}
            className="group mt-7 inline-flex items-center gap-2 border border-ink bg-ink px-5 py-2.5 font-mono text-[11px] uppercase tracking-[0.09em] text-paper transition-colors hover:bg-paper hover:text-ink"
          >
            Open the policy lab
            <span className="transition-transform group-hover:translate-x-0.5">&rarr;</span>
          </button>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
          className="min-w-0 lg:col-span-5 lg:pt-20"
        >
          <p className="label-mono mb-3">Problem statement</p>
          <div className="plate-sunk p-7">
            <p className="font-mono text-[12px] text-ink-3">[Text to be added by the team]</p>
          </div>
        </motion.div>
      </div>
    </section>
  )
}
