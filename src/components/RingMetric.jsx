import { motion, useReducedMotion } from 'framer-motion'
import AnimatedNumber from './AnimatedNumber'
import { ACCENT, CURRENT } from '../config/palette'

/**
 * The headline result, as a ring.
 *
 * Two arcs on one track: the status quo in grey behind, the proposal in the
 * accent in front, both scaled against whichever is larger. The ring exists so
 * the size of the gap registers before either number is read.
 */
const SIZE = 184
const STROKE = 13
const R = (SIZE - STROKE) / 2 - 8
const CIRC = 2 * Math.PI * R

function Arc({ fraction, colour, glow, delay = 0 }) {
  const reduce = useReducedMotion()
  return (
    <motion.circle
      cx={SIZE / 2}
      cy={SIZE / 2}
      r={R}
      fill="none"
      stroke={colour}
      strokeWidth={STROKE}
      strokeLinecap="round"
      strokeDasharray={CIRC}
      className={glow ? 'glow-accent' : undefined}
      initial={false}
      animate={{ strokeDashoffset: CIRC * (1 - Math.max(0, Math.min(fraction, 1))) }}
      transition={reduce ? { duration: 0 } : { type: 'spring', stiffness: 80, damping: 20, delay }}
      transform={`rotate(-90 ${SIZE / 2} ${SIZE / 2})`}
    />
  )
}

export default function RingMetric({ label, unit, current, proposed, format, tip }) {
  const max = Math.max(current ?? 0, proposed ?? 0) || 1
  const delta = (proposed ?? 0) - (current ?? 0)
  const pctChange = current ? (delta / current) * 100 : null

  return (
    <div className="flex flex-col items-center">
      <div className="mb-1 flex items-center gap-1.5">
        <span className="label">{label}</span>
        {tip}
      </div>

      <div className="relative" style={{ width: SIZE, height: SIZE }}>
        <svg width={SIZE} height={SIZE} role="img" aria-label={label}>
          <circle
            cx={SIZE / 2}
            cy={SIZE / 2}
            r={R}
            fill="none"
            stroke="rgba(255,255,255,0.07)"
            strokeWidth={STROKE}
          />
          <Arc fraction={(current ?? 0) / max} colour={CURRENT} />
          <Arc fraction={(proposed ?? 0) / max} colour={ACCENT} glow delay={0.08} />
        </svg>

        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
          <span className="num text-[52px] font-semibold text-accent">
            <AnimatedNumber value={proposed} format={format} />
          </span>
          <span className="label-dim mt-1.5">{unit}</span>
        </div>
      </div>

      <div className="mt-3 flex items-center gap-4">
        <span className="flex items-center gap-1.5 text-[11px] text-ink-3">
          <span className="h-[3px] w-4" style={{ background: CURRENT }} />
          Current <span className="num text-[13px] text-ink-2"><AnimatedNumber value={current} format={format} /></span>
        </span>
        {pctChange !== null && Number.isFinite(pctChange) && (
          <span className="num text-[13px] font-semibold text-accent">
            {pctChange >= 0 ? '+' : ''}
            <AnimatedNumber value={pctChange} format={(v) => `${v.toFixed(0)}%`} />
          </span>
        )}
      </div>
    </div>
  )
}
