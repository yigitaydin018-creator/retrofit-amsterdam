import { motion } from 'framer-motion'
import { InfoTip } from './primitives'
import AnimatedNumber from './AnimatedNumber'

/**
 * A single reported figure, set the way a table of figures is set in print.
 *
 * A hairline rule opens it, a mono label hangs beneath the rule, and the value
 * sits large in the serif. There is no box, no shadow and no rounding. This
 * replaces the uniform card grid that every result used to sit in, and it is
 * why the numbers now carry the page.
 */
export default function Figure({
  label,
  value,
  format,
  tone = 'ink',
  sub,
  tip,
  index = 0,
  size = 'md',
}) {
  const tones = {
    ink: 'text-ink',
    delft: 'text-delft-800',
    brick: 'text-brick',
  }
  const sizes = {
    md: 'text-[30px]',
    lg: 'text-[44px] sm:text-[52px]',
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, delay: index * 0.05, ease: [0.22, 1, 0.36, 1] }}
      className="rule pt-3"
    >
      <div className="flex items-start gap-1.5">
        <p className="label-mono">{label}</p>
        {tip && <InfoTip>{tip}</InfoTip>}
      </div>

      <p className={`figure-serif mt-2.5 leading-none ${sizes[size]} ${tones[tone]}`}>
        <AnimatedNumber value={value} format={format} />
      </p>

      {sub && <p className="mt-2.5 text-[11.5px] leading-[1.6] text-ink-3">{sub}</p>}
    </motion.div>
  )
}
