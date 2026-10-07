import { useEffect, useMemo, useRef } from 'react'
import { motion, useReducedMotion } from 'framer-motion'
import { geoMercator } from 'd3-geo'
import { APP_NAME } from '../config/coefficients'
import { ACCENT } from '../config/palette'

/**
 * Landing view.
 *
 * The signature visual is the city itself: one particle per neighbourhood,
 * placed at its real centroid and lit by its carbon saving potential. It is
 * the same data the simulator runs on, so the first thing seen is the subject
 * rather than an ornament.
 *
 * Particles settle inward over about two seconds. Under prefers-reduced-motion
 * the final frame is drawn immediately with no animation at all.
 */
const DUR = 2000

export default function IntroView({ geo, buurten, onEnter, views }) {
  const canvasRef = useRef(null)
  const reduce = useReducedMotion()

  // Centroid and brightness per neighbourhood, computed once.
  const particles = useMemo(() => {
    const co2 = new Map(buurten.map((b) => [b.code, b.co2Efg]))
    const values = buurten.map((b) => b.co2Efg).filter((v) => v !== null && v > 0)
    const max = values.length ? Math.max(...values) : 1

    const projection = geoMercator().fitExtent(
      [
        [0, 0],
        [1, 1],
      ],
      geo,
    )

    return geo.features
      .map((f) => {
        // A polygon's mean vertex is close enough to a centroid for a field of
        // dots and avoids pulling in a geometry library for it.
        let ring = f.geometry.coordinates
        while (Array.isArray(ring[0]) && Array.isArray(ring[0][0])) ring = ring[0]
        if (!Array.isArray(ring) || !ring.length) return null
        let sx = 0
        let sy = 0
        let n = 0
        for (const pt of ring) {
          if (!Array.isArray(pt) || pt.length < 2) continue
          sx += pt[0]
          sy += pt[1]
          n += 1
        }
        if (!n) return null
        const p = projection([sx / n, sy / n])
        if (!p || !Number.isFinite(p[0])) return null
        const v = co2.get(f.properties.code)
        return { x: p[0], y: p[1], weight: v === null || v === undefined ? 0 : v / max }
      })
      .filter(Boolean)
  }, [geo, buurten])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return undefined
    const ctx = canvas.getContext('2d')
    const dpr = Math.min(window.devicePixelRatio || 1, 2)

    let raf = 0
    let start = null
    let stopped = false

    const sizeOf = () => {
      const rect = canvas.getBoundingClientRect()
      canvas.width = rect.width * dpr
      canvas.height = rect.height * dpr
      return rect
    }

    const draw = (t) => {
      const rect = sizeOf()
      const side = Math.min(rect.width, rect.height)
      const ox = (rect.width - side) / 2
      const oy = (rect.height - side) / 2

      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      ctx.clearRect(0, 0, rect.width, rect.height)

      const cx = rect.width / 2
      const cy = rect.height / 2

      for (const p of particles) {
        const tx = ox + p.x * side
        const ty = oy + p.y * side
        // Particles drift in from outside towards their real position.
        const x = cx + (tx - cx) * t
        const y = cy + (ty - cy) * t

        const alpha = (0.14 + p.weight * 0.86) * t
        const r = 1 + p.weight * 2.4

        ctx.beginPath()
        ctx.arc(x, y, r, 0, Math.PI * 2)
        ctx.fillStyle = ACCENT
        ctx.globalAlpha = alpha
        ctx.shadowBlur = p.weight > 0.55 ? 10 * t : 0
        ctx.shadowColor = ACCENT
        ctx.fill()
      }
      ctx.globalAlpha = 1
      ctx.shadowBlur = 0
    }

    if (reduce) {
      draw(1)
      return undefined
    }

    const frame = (now) => {
      if (stopped) return
      if (start === null) start = now
      const elapsed = now - start
      const linear = Math.min(elapsed / DUR, 1)
      // Ease out so the field settles rather than stopping dead.
      const t = 1 - Math.pow(1 - linear, 3)
      draw(t)
      if (linear < 1) raf = requestAnimationFrame(frame)
    }
    raf = requestAnimationFrame(frame)

    const onResize = () => draw(1)
    window.addEventListener('resize', onResize)
    return () => {
      stopped = true
      cancelAnimationFrame(raf)
      window.removeEventListener('resize', onResize)
    }
  }, [particles, reduce])

  // Any key or click gets past this screen.
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Enter' || e.key === 'Escape') onEnter('simulator')
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onEnter])

  return (
    <div
      className="relative flex h-full w-full cursor-pointer flex-col items-center justify-center overflow-hidden bg-base"
      onClick={() => onEnter('simulator')}
    >
      <canvas ref={canvasRef} className="absolute inset-0 h-full w-full" aria-hidden="true" />

      <motion.div
        initial={reduce ? false : { opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: reduce ? 0 : 0.5 }}
        className="relative z-10 flex flex-col items-center px-6 text-center"
      >
        <h1 className="text-[44px] font-semibold leading-none tracking-tight text-ink sm:text-[58px]">
          {APP_NAME}
        </h1>
        <p className="mt-4 max-w-xl text-[14px] leading-snug text-ink-3 sm:text-[15px]">
          Design Amsterdam&rsquo;s renovation subsidy around carbon and need.
        </p>

        <div
          className="mt-10 flex flex-wrap items-center justify-center gap-3"
          onClick={(e) => e.stopPropagation()}
        >
          <button
            onClick={() => onEnter('simulator')}
            className="border border-accent bg-accent px-6 py-2.5 text-[11px] font-semibold uppercase tracking-[0.12em] text-base transition-opacity hover:opacity-85"
          >
            Open the simulator
          </button>
          {views
            .filter((v) => v.id !== 'simulator')
            .map((v) => (
              <button
                key={v.id}
                onClick={() => onEnter(v.id)}
                className="border border-line-strong px-5 py-2.5 text-[11px] font-medium uppercase tracking-[0.12em] text-ink-3 transition-colors hover:border-accent hover:text-accent"
              >
                {v.label}
              </button>
            ))}
        </div>

        <p className="mt-9 text-[10px] uppercase tracking-[0.16em] text-ink-4">
          Click anywhere to continue
        </p>
      </motion.div>
    </div>
  )
}
