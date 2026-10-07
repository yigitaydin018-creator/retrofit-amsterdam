import { SectionHeading } from '../components/primitives'
import { SOURCES } from '../config/coefficients'

/**
 * Generated from the SOURCES registry in the config module, so a coefficient
 * that is added or changed there shows up here without anyone remembering to
 * update a list. No narrative.
 */
const STATUS_STYLE = {
  Sourced: 'border-ink/25 text-ink-2',
  Derived: 'border-ink/25 text-ink-2',
  Assumption: 'border-brick/40 text-brick',
  Approximation: 'border-brick/40 text-brick',
  'Policy choice': 'border-delft-600/45 text-delft-800',
  Missing: 'border-ink/20 text-ink-4',
}

export default function DataSources() {
  return (
    <section id="sources" className="mx-auto max-w-[1280px] px-5 py-14 sm:px-8">
      <SectionHeading eyebrow="Section 05" title="Data and sources" />

      <div className="mt-8 space-y-10">
        {SOURCES.map((group) => (
          <div key={group.group}>
            <h3 className="label-mono mb-3">{group.group}</h3>
            <div className="rule-heavy" />
            {group.items.map((item) => (
              <div
                key={item.name}
                className="grid gap-x-6 gap-y-1 border-b border-ink/10 py-3 lg:grid-cols-[minmax(0,2fr)_minmax(0,2fr)_auto]"
              >
                <p className="text-[12.5px] leading-snug text-ink">{item.name}</p>
                <p className="text-[11.5px] leading-snug text-ink-2">{item.source}</p>
                <span
                  className={`justify-self-start border px-2 py-[2px] font-mono text-[9.5px] uppercase tracking-[0.07em] lg:justify-self-end ${STATUS_STYLE[item.status] ?? STATUS_STYLE.Sourced}`}
                >
                  {item.status}
                </span>
                {item.note && (
                  <p className="font-mono text-[10px] leading-[1.6] text-ink-3 lg:col-span-3">
                    {item.note}
                  </p>
                )}
              </div>
            ))}
          </div>
        ))}
      </div>
    </section>
  )
}
