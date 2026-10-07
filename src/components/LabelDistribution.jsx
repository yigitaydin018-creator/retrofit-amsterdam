import { LABEL_COLORS } from '../config/palette'
import { formatPct } from '../lib/format'

/**
 * The buurt's energy-label distribution as one 100% stacked bar.
 *
 * Ordinal scale, so A to D run down a validated single-hue blue ramp and E/F/G
 * takes the reserved brick red. Every visible segment is labelled directly and
 * separated by a 2px gap, so the reading never depends on colour alone.
 *
 * Segments grow with a CSS transition rather than a JS animation. The final
 * flex-grow is written to the element immediately and the transition only
 * interpolates towards it, so the bar is correct even in a background tab where
 * requestAnimationFrame is throttled.
 */
const ORDER = [
  { key: 'pctA', label: 'A', color: LABEL_COLORS.A, dark: false },
  { key: 'pctB', label: 'B', color: LABEL_COLORS.B, dark: false },
  { key: 'pctC', label: 'C', color: LABEL_COLORS.C, dark: true },
  { key: 'pctD', label: 'D', color: LABEL_COLORS.D, dark: true },
  { key: 'pctEFG', label: 'E/F/G', color: LABEL_COLORS.EFG, dark: true },
]

export default function LabelDistribution({ buurt }) {
  if (!buurt?.hasEnergyData) return null

  const segments = ORDER.map((s) => ({ ...s, value: buurt[s.key] ?? 0 }))
  const total = segments.reduce((acc, s) => acc + s.value, 0) || 100

  return (
    <div>
      <div className="mb-2 flex items-baseline justify-between">
        <span className="label-mono">Energy label distribution</span>
        <span className="font-mono text-[10px] text-ink-4">share of labelled dwellings</span>
      </div>

      <div className="flex h-6 w-full gap-[2px]">
        {segments.map((s) => {
          const pct = (s.value / total) * 100
          if (pct <= 0) return null
          return (
            <div
              key={s.label}
              style={{
                backgroundColor: s.color,
                flexBasis: 0,
                flexGrow: pct,
                transition: 'flex-grow 600ms cubic-bezier(0.22, 1, 0.36, 1)',
              }}
              className="relative flex items-center justify-center"
              title={`${s.label}: ${formatPct(s.value)}`}
            >
              {pct > 9 && (
                <span
                  className="font-mono text-[9.5px] font-medium"
                  style={{ color: s.dark ? '#f2efe7' : '#1b1d1a' }}
                >
                  {s.label}
                </span>
              )}
            </div>
          )
        })}
      </div>

      <div className="mt-2.5 flex flex-wrap gap-x-4 gap-y-1.5">
        {segments.map((s) => (
          <span key={s.label} className="flex items-center gap-1.5 font-mono text-[10px]">
            <span className="h-2 w-2 shrink-0" style={{ backgroundColor: s.color }} />
            <span className="text-ink-3">{s.label}</span>
            <span className="tnum text-ink">{formatPct(s.value, 1)}</span>
          </span>
        ))}
      </div>
    </div>
  )
}
