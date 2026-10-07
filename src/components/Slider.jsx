import { motion } from 'framer-motion'

/**
 * Labelled range input. The value sits on the same baseline as the label, set
 * in mono so it reads as a measurement rather than as body text.
 */
export default function Slider({
  label,
  value,
  min,
  max,
  step = 1,
  onChange,
  display,
  hint,
  accent = '#123655',
}) {
  const pct = ((value - min) / (max - min)) * 100

  return (
    <div>
      <div className="mb-2 flex items-baseline justify-between gap-3">
        <label className="text-[12.5px] text-ink-2">{label}</label>
        <motion.span
          key={display}
          initial={{ opacity: 0.5 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.18 }}
          className="tnum font-mono text-[12px] font-medium text-ink"
        >
          {display}
        </motion.span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        aria-label={label}
        style={{
          background: `linear-gradient(90deg, ${accent} 0%, ${accent} ${pct}%, rgba(27,29,26,0.18) ${pct}%, rgba(27,29,26,0.18) 100%)`,
        }}
      />
      {hint && <p className="mt-2 text-[11px] leading-[1.6] text-ink-3">{hint}</p>}
    </div>
  )
}
