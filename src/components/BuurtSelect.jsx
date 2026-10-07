import { useEffect, useMemo, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import { formatPct } from '../lib/format'
import { buildSearchResults, flattenSections } from '../lib/search'

/**
 * Searchable combobox over all 517 buurten.
 *
 * Matching runs against two levels at once. People search for the district
 * name ("Jordaan", "Oude Pijp", "Museumkwartier"), which is the CBS *wijk*,
 * while the simulator operates on the *buurt* beneath it. A wijk match renders
 * as a labelled group with its constituent buurten underneath; a direct buurt
 * match renders standalone. See src/lib/search.js for the ranking rules.
 *
 * The 47 buurten with no energy-label data (harbour and industrial zones with
 * effectively no housing stock) stay in the list but are disabled and marked
 * "no data", rather than hidden: their absence is itself informative, and a
 * user searching for "Westhaven" should be told why it cannot be simulated.
 *
 * Keyboard: type to filter, arrow keys to move, Enter to pick, Escape to close.
 */
export default function BuurtSelect({ buurten, value, onChange }) {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [active, setActive] = useState(0)
  const wrapRef = useRef(null)
  const listRef = useRef(null)
  const inputRef = useRef(null)

  // Sections for rendering, each row pre-stamped with its position in the flat
  // keyboard sequence, so a grouped row and a standalone row share one index
  // space without any counter being mutated during render.
  const { sections, flat } = useMemo(() => {
    const { sections: raw } = buildSearchResults(buurten, query)
    let i = 0
    return {
      sections: raw.map((s) => ({
        ...s,
        rows: s.buurten.map((b) => ({ buurt: b, idx: i++ })),
      })),
      flat: flattenSections(raw),
    }
  }, [buurten, query])

  // Close on outside click.
  useEffect(() => {
    if (!open) return undefined
    const onDown = (e) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener('mousedown', onDown)
    return () => document.removeEventListener('mousedown', onDown)
  }, [open])

  // Keep the highlighted row in view while arrowing through a long list.
  useEffect(() => {
    if (!open || !listRef.current) return
    const el = listRef.current.querySelector(`[data-idx="${active}"]`)
    if (el) el.scrollIntoView({ block: 'nearest' })
  }, [active, open])

  // Reset the highlighted row where the query changes, rather than in an
  // effect reacting to it.
  const updateQuery = (next) => {
    setQuery(next)
    setActive(0)
  }

  const commit = (b) => {
    if (!b || !b.hasEnergyData) return
    onChange(b)
    setOpen(false)
    updateQuery('')
  }

  const onKeyDown = (e) => {
    if (!open && (e.key === 'ArrowDown' || e.key === 'Enter')) {
      setOpen(true)
      return
    }
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setActive((i) => Math.min(i + 1, flat.length - 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setActive((i) => Math.max(i - 1, 0))
    } else if (e.key === 'Enter') {
      e.preventDefault()
      commit(flat[active])
    } else if (e.key === 'Escape') {
      setOpen(false)
      updateQuery('')
    }
  }

  return (
    <div ref={wrapRef} className="relative">
      <label className="label-mono mb-2 block">
        Neighbourhood
      </label>

      <button
        type="button"
        onClick={() => {
          setOpen((o) => !o)
          window.requestAnimationFrame(() => inputRef.current?.focus())
        }}
        className="flex w-full items-center justify-between gap-3 border border-ink/25 bg-paper px-3.5 py-2.5 text-left transition-colors hover:border-delft-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-delft-600/40"
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        <span className="min-w-0">
          <span className="font-serif block truncate text-[16px] font-medium text-ink">
            {value ? value.name : 'Select a neighbourhood'}
          </span>
          {value && (
            <span className="mt-0.5 block truncate font-mono text-[10px] text-ink-3">
              {value.wijkName ? `${value.wijkName} · ` : ''}
              {value.code} · {formatPct(value.pctEFG)} E/F/G
            </span>
          )}
        </span>
        <motion.svg
          animate={{ rotate: open ? 180 : 0 }}
          transition={{ duration: 0.2 }}
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          className="shrink-0 text-ink-3"
        >
          <path d="M6 9l6 6 6-6" strokeLinecap="round" strokeLinejoin="round" />
        </motion.svg>
      </button>

      {/* Opens with an animation, closes instantly. An exit animation here
          would leave the panel in the DOM until it finishes, and a stalled
          exit (rAF is throttled in background tabs) leaves an invisible
          overlay that still swallows clicks on the controls beneath it. */}
      {open && (
        <motion.div
          initial={{ opacity: 0, y: -6, scale: 0.985 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.16, ease: [0.22, 1, 0.36, 1] }}
          className="absolute z-40 mt-1 w-full overflow-hidden border border-ink/25 bg-paper shadow-[0_16px_36px_-20px_rgba(27,29,26,0.7)]"
        >
          <div className="border-b border-ink/15 p-2">
            <input
              ref={inputRef}
              value={query}
              onChange={(e) => updateQuery(e.target.value)}
              onKeyDown={onKeyDown}
              placeholder="Search 517 neighbourhoods…"
              className="w-full border border-ink/15 bg-paper-2 px-3 py-2 text-[13.5px] text-ink placeholder:text-ink-4 focus:outline-none focus-visible:ring-2 focus-visible:ring-delft-600/40"
            />
            <p className="mt-1.5 px-1 text-[10.5px] leading-[1.55] text-ink-3">
              Search by neighborhood (e.g. “Jordaan”) or official statistical area name
            </p>
          </div>

          <div ref={listRef} className="max-h-72 overflow-y-auto py-1" role="listbox">
            {flat.length === 0 && (
              <p className="px-3.5 py-6 text-center text-[12.5px] text-ink-3">
                No neighbourhood matches “{query}”.
              </p>
            )}

            {sections.map((section) => (
              <div key={section.wijkName ?? '__ungrouped__'}>
                {section.wijkName && (
                  <div className="sticky top-0 z-10 flex items-baseline justify-between gap-2 border-y border-ink/15 bg-paper-3 px-3.5 py-1.5">
                    <span className="truncate font-mono text-[10.5px] font-medium uppercase tracking-[0.08em] text-delft-800">
                      {section.wijkName}
                    </span>
                    <span className="shrink-0 font-mono text-[9px] uppercase tracking-wide text-ink-4">
                      {section.buurten.length}{' '}
                      {section.buurten.length === 1 ? 'area' : 'areas'}
                    </span>
                  </div>
                )}

                {section.rows.map(({ buurt: b, idx }) => {
                  const selected = value?.code === b.code
                  return (
                    <div
                      key={b.code}
                      data-idx={idx}
                      role="option"
                      aria-selected={selected}
                      aria-disabled={!b.hasEnergyData}
                      onMouseEnter={() => setActive(idx)}
                      onClick={() => commit(b)}
                      className={`flex cursor-pointer items-center justify-between gap-3 py-2 pr-3.5 transition-colors ${
                        section.wijkName ? 'pl-6' : 'pl-3.5'
                      } ${
                        !b.hasEnergyData
                          ? 'cursor-not-allowed opacity-45'
                          : idx === active
                            ? 'bg-delft-50'
                            : ''
                      }`}
                    >
                      <span className="min-w-0">
                        <span
                          className={`block truncate text-[13.5px] ${
                            selected ? 'font-medium text-delft-800' : 'text-ink'
                          }`}
                        >
                          {b.name}
                        </span>
                        <span className="block truncate font-mono text-[9.5px] text-ink-4">
                          {/* Inside a wijk group the header already names the
                              district, so only standalone rows repeat it. */}
                          {!section.wijkName && b.wijkName ? `${b.wijkName} · ` : ''}
                          {b.code}
                        </span>
                      </span>

                      {b.hasEnergyData ? (
                        <span className="tnum shrink-0 font-mono text-[11px] text-ink-3">
                          {formatPct(b.pctEFG, 0)}
                        </span>
                      ) : (
                        <span className="shrink-0 border border-ink/20 px-1.5 py-0.5 font-mono text-[9px] uppercase tracking-wide text-ink-4">
                          no data
                        </span>
                      )}
                    </div>
                  )
                })}
              </div>
            ))}
          </div>

          <div className="border-t border-ink/15 px-3.5 py-2 font-mono text-[10px] text-ink-3">
            Figure on the right is the share of dwellings labelled E, F or G.
          </div>
        </motion.div>
      )}
    </div>
  )
}
