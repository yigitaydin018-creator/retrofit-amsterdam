import { useCallback, useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'

/**
 * Shared interface pieces.
 *
 * Tooltips carry an (i) icon and plain sentences for a policymaker: what the
 * number means, then where it comes from. Variable names, formulas and status
 * badges belong in the methodology view, not here.
 */
export function InfoTip({ children, width = 280 }) {
  const [open, setOpen] = useState(false)
  const [pos, setPos] = useState(null)
  const btnRef = useRef(null)

  // Measured and positioned against the viewport, then rendered into a portal
  // on document.body. An absolutely-positioned popover inside the results
  // column was being clipped by that column's own scroll container, which is
  // what made it appear empty and pinned to the top of the window.
  const place = useCallback(() => {
    const el = btnRef.current
    if (!el) return
    const r = el.getBoundingClientRect()
    const margin = 10
    const estHeight = 150

    // Prefer above the icon; flip below when there is not room.
    const above = r.top > estHeight + margin
    const top = above ? r.top - margin : r.bottom + margin

    // Centre on the icon, then pull back inside whichever edge it would cross.
    let left = r.left + r.width / 2 - width / 2
    left = Math.max(margin, Math.min(left, window.innerWidth - width - margin))

    setPos({ top, left, above })
  }, [width])

  const show = () => {
    place()
    setOpen(true)
  }
  const hide = () => setOpen(false)

  useEffect(() => {
    if (!open) return undefined
    const onKey = (e) => {
      if (e.key === 'Escape') setOpen(false)
    }
    // Any scroll or resize invalidates a viewport-anchored position.
    const onMove = () => setOpen(false)
    window.addEventListener('keydown', onKey)
    window.addEventListener('scroll', onMove, true)
    window.addEventListener('resize', onMove)
    return () => {
      window.removeEventListener('keydown', onKey)
      window.removeEventListener('scroll', onMove, true)
      window.removeEventListener('resize', onMove)
    }
  }, [open])

  return (
    <span className="relative inline-flex align-middle">
      <button
        ref={btnRef}
        type="button"
        aria-label="More information"
        onMouseEnter={show}
        onMouseLeave={hide}
        onFocus={show}
        onBlur={hide}
        onClick={(e) => {
          e.preventDefault()
          if (open) hide()
          else show()
        }}
        className="flex h-[14px] w-[14px] cursor-help items-center justify-center rounded-full border border-white/25 text-[9px] font-semibold leading-none text-ink-4 transition-colors hover:border-accent hover:text-accent focus:outline-none focus-visible:ring-2 focus-visible:ring-accent/40"
      >
        i
      </button>

      {open &&
        pos &&
        createPortal(
          <span
            role="tooltip"
            style={{
              position: 'fixed',
              top: pos.top,
              left: pos.left,
              width,
              transform: pos.above ? 'translateY(-100%)' : 'none',
            }}
            className="pointer-events-none z-[200] block border border-line-strong bg-base-3 p-3 text-[11.5px] leading-[1.55] text-ink-2 shadow-[0_18px_40px_-18px_rgba(0,0,0,0.9)]"
          >
            {children}
          </span>,
          document.body,
        )}
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
    <div className="flex shrink-0 flex-col gap-3 border-b border-line px-4 py-4 md:flex-row md:items-start md:justify-between md:gap-6 md:px-6">
      <div className="min-w-0">
        <h1 className="text-[17px] font-semibold tracking-tight text-ink">{title}</h1>
        {lead && (
          <p className="mt-1 max-w-[32rem] text-[12px] leading-snug text-ink-3">
            {lead}
          </p>
        )}
      </div>

      {right && (
        <div className="w-full overflow-x-auto pb-1 md:w-auto md:shrink-0 md:pb-0">
          {right}
        </div>
      )}
    </div>
  )
}
