import { motion } from 'framer-motion'

/**
 * Shared surface and layout primitives.
 *
 * The system is built from rules and bordered plates, not from a single card
 * component repeated everywhere. `Plate` is the square-cornered hairline block
 * used where content genuinely needs enclosing; large parts of the page use no
 * container at all and are separated by rules instead.
 */

export function Plate({ children, className = '', tone = 'default', ...rest }) {
  const tones = {
    default: 'plate',
    sunk: 'plate-sunk',
    ink: 'plate-ink',
    bare: '',
  }
  return (
    <div className={`${tones[tone]} ${className}`} {...rest}>
      {children}
    </div>
  )
}

export function FadeIn({ children, delay = 0, className = '', y = 14 }) {
  return (
    <motion.div
      initial={{ opacity: 0, y }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay, ease: [0.22, 1, 0.36, 1] }}
      className={className}
    >
      {children}
    </motion.div>
  )
}

/**
 * Section opener. A numbered mono kicker sits above a heavy rule, the serif
 * title hangs below it. This is the page's recurring structural moment.
 */
export function SectionHeading({ eyebrow, title, lead, className = '' }) {
  return (
    <div className={className}>
      {eyebrow && (
        <p className="label-mono mb-3">{eyebrow}</p>
      )}
      <div className="rule-heavy" />
      <h2 className="font-serif mt-5 text-[2.1rem] font-medium leading-[1.1] tracking-tight text-ink sm:text-[2.7rem]">
        {title}
      </h2>
      {lead && (
        <p className="mt-4 max-w-2xl text-[14.5px] leading-[1.65] text-ink-2">{lead}</p>
      )}
    </div>
  )
}

/** Small squared-off tag. */
export function Tag({ children, tone = 'neutral', className = '' }) {
  const tones = {
    neutral: 'border-ink/20 text-ink-2',
    delft: 'border-delft-600/45 text-delft-800 bg-delft-50/60',
    brick: 'border-brick/40 text-brick bg-brick/[0.06]',
    ink: 'border-ink bg-ink text-paper',
  }
  return (
    <span
      className={`inline-flex items-center gap-1.5 border px-2 py-[3px] font-mono text-[10px] uppercase tracking-[0.08em] ${tones[tone]} ${className}`}
    >
      {children}
    </span>
  )
}

/**
 * Footnote marker with the note itself on hover or focus.
 *
 * Below `sm` the note is pinned to the foot of the viewport at full width. An
 * anchored bubble centred on its marker runs off the edge whenever the marker
 * sits near the right of a column, and gets clipped.
 */
export function InfoTip({ label = 'n', children }) {
  return (
    <span className="group/tip relative inline-flex align-middle">
      <button
        type="button"
        aria-label="Note"
        className="flex h-[15px] w-[15px] cursor-help items-center justify-center border border-ink/25 font-mono text-[9px] leading-none text-ink-3 transition-colors hover:border-delft-600 hover:text-delft-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-delft-600/40"
      >
        {label}
      </button>
      <span
        role="tooltip"
        className="pointer-events-none fixed inset-x-4 bottom-4 z-50 border border-ink/25 bg-paper p-3 text-[11.5px] leading-[1.6] text-ink-2 opacity-0 shadow-[0_10px_28px_-16px_rgba(27,29,26,0.6)] transition-opacity duration-200 group-hover/tip:opacity-100 group-focus-within/tip:opacity-100 sm:absolute sm:inset-x-auto sm:bottom-full sm:left-1/2 sm:mb-2 sm:w-72 sm:-translate-x-1/2"
      >
        {children}
      </span>
    </span>
  )
}

/** Source line. Set small, in mono, hung under a hairline. */
export function SourceNote({ children, className = '' }) {
  return (
    <p className={`font-mono text-[10.5px] leading-[1.65] text-ink-3 ${className}`}>
      {children}
    </p>
  )
}
