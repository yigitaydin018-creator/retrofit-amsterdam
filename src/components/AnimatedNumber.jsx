import { useEffect, useRef, useState } from 'react'
import { useMotionValue, useSpring, useReducedMotion } from 'framer-motion'

/** How long the spring is given to settle before the exact value is committed. */
const SETTLE_MS = 750

/**
 * A number that springs to its new value instead of snapping.
 *
 * Used for every result card, so that dragging a slider reads as a continuous
 * change rather than a flicker. The spring drives a formatted string in state
 * via a motion-value subscription, which keeps formatting (currency, decimals,
 * thousands separators) in normal React rather than in a raw DOM write.
 *
 * Two correctness guarantees on top of the animation:
 *  - prefers-reduced-motion bypasses the spring entirely and renders the exact
 *    value during render, with no animation state involved.
 *  - Otherwise a settle timer commits the exactly-formatted target after
 *    SETTLE_MS. Spring frames come from requestAnimationFrame, which browsers
 *    throttle hard in a background or hidden tab, so without this a card could
 *    be left showing a stale number. The timer makes the displayed value
 *    converge on the true one whether or not any frames were ever painted.
 */
export default function AnimatedNumber({
  value,
  format = (v) => Math.round(v).toLocaleString('en-GB'),
  className = '',
  placeholder = 'n/a',
}) {
  const reduceMotion = useReducedMotion()
  const isNullish = value === null || value === undefined || Number.isNaN(value)
  const target = isNullish ? 0 : value

  const motionValue = useMotionValue(target)
  const spring = useSpring(motionValue, {
    stiffness: 140,
    damping: 26,
    mass: 0.7,
    restDelta: 0.01,
  })

  const [animated, setAnimated] = useState(() => format(target))

  // Latest-formatter ref, updated after render so the spring subscription below
  // never closes over a stale formatter.
  const formatRef = useRef(format)
  useEffect(() => {
    formatRef.current = format
  })

  useEffect(() => {
    motionValue.set(target)
  }, [target, motionValue])

  // Follow the spring while frames are being painted.
  useEffect(() => {
    if (reduceMotion) return undefined
    return spring.on('change', (v) => setAnimated(formatRef.current(v)))
  }, [spring, reduceMotion])

  // Commit the exact value once the spring has had time to settle.
  useEffect(() => {
    if (reduceMotion) return undefined
    const id = setTimeout(() => setAnimated(formatRef.current(target)), SETTLE_MS)
    return () => clearTimeout(id)
  }, [target, format, reduceMotion])

  if (isNullish) return <span className={className}>{placeholder}</span>

  // Under reduced motion the value is derived straight from props, with no
  // animation, no intermediate state.
  const display = reduceMotion ? format(target) : animated
  return <span className={`tnum ${className}`}>{display}</span>
}
