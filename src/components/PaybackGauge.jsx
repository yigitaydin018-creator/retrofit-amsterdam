import { useMemo } from 'react'
import { motion, useReducedMotion } from 'framer-motion'
import { GAUGE_BANDS } from '../config/palette'
import { formatNumber } from '../lib/format'

/**
 * Simple-payback dial.
 *
 * One value with a qualitative band, so it gets a dial rather than a chart.
 * The arc caps at CAP years. Past that the arc fills and the readout says so,
 * which is more honest than letting a 300-year payback compress the part of
 * the scale anyone actually reads.
 */
const CAP = 40
const START = -198
const SWEEP = 216
const R = 72
const CX = 100
const CY = 94

const polar = (angleDeg, radius = R) => {
  const a = (angleDeg * Math.PI) / 180
  return { x: CX + radius * Math.cos(a), y: CY + radius * Math.sin(a) }
}

const arcPath = (fromDeg, toDeg, radius = R) => {
  const s = polar(fromDeg, radius)
  const e = polar(toDeg, radius)
  const large = Math.abs(toDeg - fromDeg) > 180 ? 1 : 0
  return `M ${s.x} ${s.y} A ${radius} ${radius} 0 ${large} 1 ${e.x} ${e.y}`
}

export default function PaybackGauge({ years }) {
  const reduceMotion = useReducedMotion()

  const { band, fraction, pinned } = useMemo(() => {
    if (years === null || years === undefined)
      return { band: GAUGE_BANDS[GAUGE_BANDS.length - 1], fraction: 0, pinned: false }
    const b =
      GAUGE_BANDS.find((x) => years <= x.max) ?? GAUGE_BANDS[GAUGE_BANDS.length - 1]
    return { band: b, fraction: Math.min(years / CAP, 1), pinned: years > CAP }
  }, [years])

  const trackLength = (SWEEP / 360) * 2 * Math.PI * R

  return (
    <div className="flex flex-col items-center">
      <svg
        viewBox="0 0 200 126"
        className="w-full max-w-[228px]"
        role="img"
        aria-label={
          years === null
            ? 'Payback period not applicable'
            : `Simple payback ${formatNumber(years, 1)} years`
        }
      >
        <path
          d={arcPath(START, START + SWEEP)}
          fill="none"
          stroke="rgba(27,29,26,0.13)"
          strokeWidth="8"
        />

        <motion.path
          d={arcPath(START, START + SWEEP)}
          fill="none"
          stroke={band.color}
          strokeWidth="8"
          strokeDasharray={trackLength}
          initial={false}
          animate={{ strokeDashoffset: trackLength * (1 - fraction) }}
          transition={
            reduceMotion ? { duration: 0 } : { type: 'spring', stiffness: 90, damping: 20 }
          }
        />

        {[0, 10, 20, 30, 40].map((t) => {
          const ang = START + (t / CAP) * SWEEP
          const a = polar(ang, R - 8)
          const b = polar(ang, R - 14)
          return (
            <line
              key={t}
              x1={a.x}
              y1={a.y}
              x2={b.x}
              y2={b.y}
              stroke="rgba(27,29,26,0.3)"
              strokeWidth="1"
            />
          )
        })}

        <text
          x={CX}
          y={CY - 8}
          textAnchor="middle"
          fill="#1b1d1a"
          fontSize="34"
          fontFamily="Newsreader, Georgia, serif"
          fontWeight="500"
          style={{ fontVariantNumeric: 'tabular-nums' }}
        >
          {years === null ? 'n/a' : pinned ? `${CAP}+` : formatNumber(years, 1)}
        </text>
        <text
          x={CX}
          y={CY + 10}
          textAnchor="middle"
          fill="#6d7269"
          fontSize="9"
          fontFamily="'IBM Plex Mono', monospace"
          letterSpacing="1.4"
        >
          YEARS
        </text>
        <text x={30} y={CY + 24} textAnchor="middle" fill="#93978d" fontSize="8.5" fontFamily="'IBM Plex Mono', monospace">
          0
        </text>
        <text x={170} y={CY + 24} textAnchor="middle" fill="#93978d" fontSize="8.5" fontFamily="'IBM Plex Mono', monospace">
          {CAP}+
        </text>
      </svg>

      <div className="mt-1 text-center">
        <p className="font-mono text-[11px] uppercase tracking-[0.09em]" style={{ color: band.color }}>
          {years === null ? 'No modelled saving' : band.verdict}
        </p>
        <p className="mt-2 text-[11px] leading-[1.6] text-ink-3">
          Net household cost divided by the annual bill saving. Undiscounted. The value
          uplift is left out of it, since that only arrives on sale.
        </p>
      </div>
    </div>
  )
}
