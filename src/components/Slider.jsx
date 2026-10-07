import { motion } from 'framer-motion'
import { InfoTip } from './primitives'

/** Labelled range input. The value sits on the label's baseline, in numerals. */
export default function Slider({ label, value, min, max, step = 1, onChange, display, hint, tip }) {
  const pct = ((value - min) / (max - min)) * 100
  return (
    <div>
      <div className="mb-2 flex items-baseline justify-between gap-3">
        <span className="flex items-center gap-1.5">
          <span className="label">{label}</span>
          {tip && <InfoTip>{tip}</InfoTip>}
        </span>
        <motion.span
          key={display}
          initial={{ opacity: 0.5 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.15 }}
          className="num text-[16px] font-semibold text-ink"
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
          background: `linear-gradient(90deg, #cdf75e 0%, #cdf75e ${pct}%, rgba(255,255,255,0.14) ${pct}%, rgba(255,255,255,0.14) 100%)`,
        }}
      />
      {hint && <p className="mt-1.5 text-[10.5px] leading-[1.5] text-ink-4">{hint}</p>}
    </div>
  )
}
