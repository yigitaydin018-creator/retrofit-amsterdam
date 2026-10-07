import { useEffect, useState } from 'react'

/**
 * Masthead.
 *
 * An inverted ink band across the top, the way a report cover or a running
 * head works in print. Section switching is React state only, with no routing
 * and no reload. The active section is marked by an underscore rule rather
 * than a filled pill, which keeps the band quiet.
 */
export default function NavBar({ sections, active, onChange }) {
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <header
      className={`plate-ink sticky top-0 z-50 border-b transition-colors duration-300 ${
        scrolled ? 'border-paper/25' : 'border-transparent'
      }`}
    >
      <div className="mx-auto flex max-w-[1360px] items-center justify-between gap-3 px-5 py-3 sm:gap-8 sm:px-8">
        <button
          onClick={() => onChange(sections[0].id)}
          className="group flex min-w-0 items-baseline gap-2.5 text-left"
        >
          <span className="font-serif truncate text-[16px] font-medium tracking-tight text-paper">
            RetroFit Amsterdam
          </span>
          <span className="hidden shrink-0 font-mono text-[9.5px] uppercase tracking-[0.14em] text-paper/45 sm:block">
            Subsidy simulator
          </span>
        </button>

        <nav className="hidden items-center gap-6 lg:flex">
          {sections.map((s, i) => (
            <button
              key={s.id}
              onClick={() => onChange(s.id)}
              className={`relative pb-1 font-mono text-[10.5px] uppercase tracking-[0.1em] transition-colors ${
                active === s.id ? 'text-paper' : 'text-paper/45 hover:text-paper/80'
              }`}
            >
              <span className="mr-1.5 text-paper/35">{String(i + 1).padStart(2, '0')}</span>
              {s.label}
              {active === s.id && (
                <span className="absolute inset-x-0 -bottom-px h-px bg-paper" />
              )}
            </button>
          ))}
        </nav>

        <select
          value={active}
          onChange={(e) => onChange(e.target.value)}
          aria-label="Section"
          className="min-w-0 max-w-[52vw] shrink border border-paper/30 bg-ink px-2 py-1.5 font-mono text-[11px] text-paper lg:hidden"
        >
          {sections.map((s) => (
            <option key={s.id} value={s.id}>
              {s.label}
            </option>
          ))}
        </select>
      </div>
    </header>
  )
}
