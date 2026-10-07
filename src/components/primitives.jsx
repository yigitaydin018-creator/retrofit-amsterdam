/**
 * Shared interface pieces.
 *
 * Tooltips carry an (i) icon and plain sentences for a policymaker: what the
 * number means, then where it comes from. Variable names, formulas and status
 * badges belong in the methodology view, not here.
 */
export function InfoTip({ children, width = 'w-64' }) {
  return (
    <span className="group/tip relative inline-flex align-middle">
      <button
        type="button"
        aria-label="More information"
        className="flex h-[14px] w-[14px] cursor-help items-center justify-center rounded-full border border-white/25 text-[9px] font-semibold leading-none text-ink-4 transition-colors hover:border-accent hover:text-accent focus:outline-none focus-visible:ring-2 focus-visible:ring-accent/40"
      >
        i
      </button>
      <span
        role="tooltip"
        className={`pointer-events-none absolute bottom-full left-1/2 z-[60] mb-2 ${width} -translate-x-1/2 translate-y-1 border border-line-strong bg-base-3 p-3 text-[11.5px] leading-[1.55] text-ink-2 opacity-0 shadow-[0_18px_40px_-18px_rgba(0,0,0,0.9)] transition-all duration-150 group-hover/tip:translate-y-0 group-hover/tip:opacity-100 group-focus-within/tip:translate-y-0 group-focus-within/tip:opacity-100`}
      >
        {children}
      </span>
    </span>
  )
}

/** A label with an optional note beside it. */
export function FieldLabel({ children, tip }) {
  return (
    <div className="mb-2 flex items-center gap-1.5">
      <span className="label">{children}</span>
      {tip && <InfoTip>{tip}</InfoTip>}
    </div>
  )
}

/** Squared-off chip. */
export function Chip({ children, tone = 'neutral' }) {
  const tones = {
    neutral: 'border-line-strong text-ink-3',
    accent: 'border-accent/50 text-accent',
    solid: 'border-accent bg-accent text-base',
  }
  return (
    <span
      className={`inline-flex items-center gap-1.5 border px-2 py-[3px] text-[10px] font-medium uppercase tracking-[0.1em] ${tones[tone]}`}
    >
      {children}
    </span>
  )
}

/** View header: a title and an optional one-line standfirst. */
export function ViewHeader({ title, lead, right }) {
  return (
    <div className="flex shrink-0 items-start justify-between gap-6 border-b border-line px-6 py-4">
      <div className="min-w-0">
        <h1 className="text-[17px] font-semibold tracking-tight text-ink">{title}</h1>
        {lead && <p className="mt-1 text-[12px] leading-snug text-ink-3">{lead}</p>}
      </div>
      {right}
    </div>
  )
}
