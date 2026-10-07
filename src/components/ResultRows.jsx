import AnimatedNumber from './AnimatedNumber'
import { InfoTip } from './primitives'
import { ACCENT, CURRENT } from '../config/palette'

/**
 * Compact comparison rows under the headline ring. Current in grey, proposed
 * in the accent, on one line so the pair reads as a single fact.
 */
export default function ResultRows({ rows }) {
  return (
    <div>
      {rows.map((r) => (
        <div key={r.label} className="hairline flex items-baseline justify-between gap-4 py-2.5">
          <span className="flex min-w-0 items-center gap-1.5">
            <span className="text-[11.5px] leading-snug text-ink-3">{r.label}</span>
            {r.tip && <InfoTip>{r.tip}</InfoTip>}
          </span>
          <span className="flex shrink-0 items-baseline gap-3">
            <span className="num text-[17px]" style={{ color: CURRENT }}>
              <AnimatedNumber value={r.current} format={r.format} />
            </span>
            <span className="text-[10px] text-ink-4">&rarr;</span>
            <span className="num text-[19px] font-semibold" style={{ color: ACCENT }}>
              <AnimatedNumber value={r.proposed} format={r.format} />
            </span>
          </span>
        </div>
      ))}
    </div>
  )
}
