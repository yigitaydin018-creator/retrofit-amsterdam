/**
 * Shared Framer Motion variants. Kept out of primitives.jsx so that file only
 * exports components, which is what React Fast Refresh needs to work reliably.
 */

/** Staggered entrance for a group of cards. Pair with `fadeUpItem` on children. */
export const staggerContainer = {
  hidden: {},
  show: { transition: { staggerChildren: 0.07, delayChildren: 0.04 } },
}

export const fadeUpItem = {
  hidden: { opacity: 0, y: 18 },
  show: {
    opacity: 1,
    y: 0,
    transition: { type: 'spring', stiffness: 220, damping: 26, mass: 0.8 },
  },
}
